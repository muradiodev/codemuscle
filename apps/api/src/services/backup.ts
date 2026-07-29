import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { gzip, gunzip } from "node:zlib";
import { promisify } from "node:util";
import type { BackupType, Prisma, UserBackup } from "@prisma/client";
import { prisma } from "../lib/prisma.js";

const gzipAsync = promisify(gzip);
const gunzipAsync = promisify(gunzip);
const schemaVersion = 1;

export interface BackupStorage {
  put(objectKey: string, data: Buffer): Promise<void>;
  get(objectKey: string): Promise<Buffer>;
  delete(objectKey: string): Promise<void>;
  exists(objectKey: string): Promise<boolean>;
}

class LocalBackupStorage implements BackupStorage {
  constructor(private readonly root: string) {}
  private resolve(key: string) {
    const target = path.resolve(this.root, key);
    const root = path.resolve(this.root) + path.sep;
    if (!target.startsWith(root)) throw new Error("Invalid backup object key");
    return target;
  }
  async put(key: string, data: Buffer) {
    const target = this.resolve(key);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, data, { flag: "wx" });
  }
  get(key: string) { return readFile(this.resolve(key)); }
  async delete(_key: string) {
    throw new Error("Physical backup deletion is disabled; backup records are soft-deleted.");
  }
  async exists(key: string) {
    try { await readFile(this.resolve(key)); return true; } catch { return false; }
  }
}

function encryptionKey() {
  const configured = process.env.BACKUP_ENCRYPTION_KEY;
  if (!configured) {
    if (process.env.NODE_ENV === "production") throw new Error("BACKUP_ENCRYPTION_KEY is required in production");
    return createHash("sha256").update("codemuscle-development-backup-key").digest();
  }
  const decoded = Buffer.from(configured, "base64");
  if (decoded.length !== 32) throw new Error("BACKUP_ENCRYPTION_KEY must be a base64-encoded 32-byte key");
  return decoded;
}

export const backupStorage: BackupStorage = new LocalBackupStorage(
  path.resolve(process.env.BACKUP_LOCAL_DIRECTORY ?? "./data/backups")
);

type BackupPayload = Awaited<ReturnType<typeof collectBackup>>;
async function collectBackup(userId: string) {
  const account = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: {
      id: true, email: true, emailVerifiedAt: true, status: true, createdAt: true, updatedAt: true,
      profile: {
        include: {
          settings: true,
          sessions: { include: { attempts: true } },
          dailyMetrics: true,
          goals: true,
          achievements: true,
          repeats: true,
          draftDocuments: { include: { revisions: { orderBy: { revision: "asc" } } } }
        }
      },
      profileRevisions: true,
      settingsRevisions: true
    }
  });
  return {
    schemaVersion,
    applicationVersion: process.env.npm_package_version ?? "1.0.0",
    createdAt: new Date().toISOString(),
    account
  };
}

async function seal(payload: BackupPayload) {
  const compressed = await gzipAsync(Buffer.from(JSON.stringify(payload)));
  const nonce = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), nonce);
  const ciphertext = Buffer.concat([cipher.update(compressed), cipher.final()]);
  const tag = cipher.getAuthTag();
  const envelope = Buffer.concat([Buffer.from("CMBAK1"), nonce, tag, ciphertext]);
  return { envelope, checksum: createHash("sha256").update(envelope).digest("hex") };
}

async function open(envelope: Buffer, checksum: string) {
  const actual = createHash("sha256").update(envelope).digest("hex");
  if (actual !== checksum) throw new Error("Backup checksum verification failed");
  if (envelope.subarray(0, 6).toString() !== "CMBAK1") throw new Error("Unsupported backup format");
  const nonce = envelope.subarray(6, 18);
  const tag = envelope.subarray(18, 34);
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), nonce);
  decipher.setAuthTag(tag);
  const plain = await gunzipAsync(Buffer.concat([decipher.update(envelope.subarray(34)), decipher.final()]));
  const parsed = JSON.parse(plain.toString()) as BackupPayload;
  if (parsed.schemaVersion !== schemaVersion) throw new Error("Unsupported backup schema version");
  return parsed;
}

export async function createBackup(userId: string, type: BackupType): Promise<UserBackup> {
  const pending = await prisma.userBackup.create({
    data: { userId, type, status: "PENDING", schemaVersion, applicationVersion: "1.0.0" }
  });
  try {
    const payload = await collectBackup(userId);
    const { envelope, checksum } = await seal(payload);
    const objectKey = `${userId}/${pending.id}.cmbak`;
    await backupStorage.put(objectKey, envelope);
    return await prisma.userBackup.update({
      where: { id: pending.id },
      data: {
        status: "COMPLETED", objectKey, checksum, encryptedSize: envelope.length,
        completedAt: new Date(), sourceUpdatedAt: payload.account.updatedAt
      }
    });
  } catch (error) {
    await prisma.userBackup.update({
      where: { id: pending.id },
      data: { status: "FAILED", failureReason: error instanceof Error ? error.message.slice(0, 500) : "Backup failed" }
    });
    throw error;
  }
}

export async function readBackup(userId: string, backupId: string) {
  const backup = await prisma.userBackup.findFirst({
    where: { id: backupId, userId, status: "COMPLETED" }
  });
  if (!backup?.objectKey || !backup.checksum) throw Object.assign(new Error("Backup not found"), { status: 404 });
  const envelope = await backupStorage.get(backup.objectKey);
  const payload = await open(envelope, backup.checksum);
  if (payload.account.id !== userId) throw Object.assign(new Error("Backup owner mismatch"), { status: 404 });
  return { backup, envelope, payload };
}

export async function restoreBackup(userId: string, backupId: string) {
  const { payload } = await readBackup(userId, backupId);
  await createBackup(userId, "PRE_RESTORE");
  const profile = payload.account.profile;
  await prisma.$transaction(async (tx) => {
    await tx.userProfile.update({ where: { id: profile.id }, data: { displayName: profile.displayName } });
    if (profile.settings) {
      const { id: _id, userId: _userId, ...settings } = profile.settings;
      await tx.userSettings.upsert({ where: { userId: profile.id }, update: settings, create: { userId: profile.id, ...settings } });
    }
    for (const metric of profile.dailyMetrics) {
      const { id: _id, ...data } = metric;
      await tx.dailyMetric.upsert({
        where: { userId_date: { userId: profile.id, date: metric.date } },
        update: data,
        create: data
      });
    }
    for (const goal of profile.goals) {
      const { id: _id, ...data } = goal;
      await tx.practiceGoal.upsert({
        where: { userId_date: { userId: profile.id, date: goal.date } },
        update: data,
        create: data
      });
    }
    for (const achievement of profile.achievements) {
      await tx.userAchievement.upsert({
        where: { userId_achievementId: { userId: profile.id, achievementId: achievement.achievementId } },
        update: { unlockedAt: achievement.unlockedAt },
        create: achievement
      });
    }
    for (const repetition of profile.repeats) {
      await tx.repetition.upsert({
        where: { userId_fileId: { userId: profile.id, fileId: repetition.fileId } },
        update: { markedAt: repetition.markedAt },
        create: repetition
      });
    }
    await tx.draftDocument.updateMany({
      where: { userId: profile.id },
      data: { activeDeviceId: null, activeSessionId: null, leaseExpiresAt: null }
    });
    await tx.userBackup.update({ where: { id: backupId }, data: { restoredAt: new Date() } });
    await tx.securityEvent.create({ data: { userId, type: "BACKUP_RESTORED", metadata: { backupId } } });
  });
}

export function backupPreview(payload: BackupPayload) {
  return {
    createdAt: payload.createdAt,
    sessions: payload.account.profile.sessions.length,
    attempts: payload.account.profile.sessions.reduce((sum, session) => sum + session.attempts.length, 0),
    drafts: payload.account.profile.draftDocuments.length,
    achievements: payload.account.profile.achievements.length,
    settings: Boolean(payload.account.profile.settings)
  };
}
