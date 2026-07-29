import { Router } from "express";
import { z } from "zod";
import { verifyPassword, hashPassword, clearAuthCookies } from "../services/auth.js";
import { backupPreview, createBackup, readBackup, restoreBackup } from "../services/backup.js";
import { prisma } from "../lib/prisma.js";

const asyncRoute =
  (handler: (request: any, response: any) => Promise<unknown>) =>
  (request: any, response: any, next: any) =>
    Promise.resolve(handler(request, response)).catch(next);
const params = z.object({ deviceId: z.string().cuid().optional(), backupId: z.string().cuid().optional() });
const passwordSchema = z.object({ currentPassword: z.string(), newPassword: z.string().min(10).max(128) });
const restoreSchema = z.object({ currentPassword: z.string() });

export const accountRouter = Router();

accountRouter.get("/account", asyncRoute(async (req, res) => {
  const account = await prisma.user.findUniqueOrThrow({
    where: { id: req.auth.account.id },
    select: {
      id: true, email: true, emailVerifiedAt: true, createdAt: true, lastSignedInAt: true, status: true,
      profile: { select: { displayName: true } },
      _count: { select: { devices: true, backups: true } }
    }
  });
  const aggregate = await prisma.practiceSession.aggregate({
    where: { userId: req.auth.profile.id },
    _sum: { activeDurationMs: true },
    _count: true
  });
  const completedFiles = await prisma.practiceSession.findMany({
    where: { userId: req.auth.profile.id, status: "COMPLETED" },
    distinct: ["fileId"],
    select: { fileId: true }
  });
  const latestBackup = await prisma.userBackup.findFirst({
    where: { userId: req.auth.account.id, status: "COMPLETED" },
    orderBy: { createdAt: "desc" }
  });
  res.json({ ...account, totalPracticeMs: aggregate._sum.activeDurationMs ?? 0, completedFiles: completedFiles.length, latestBackup });
}));

accountRouter.get("/account/devices", asyncRoute(async (req, res) => {
  const devices = await prisma.userDevice.findMany({
    where: { userId: req.auth.account.id },
    include: { sessions: { where: { revokedAt: null, expiresAt: { gt: new Date() } }, select: { id: true } } },
    orderBy: { lastSeenAt: "desc" }
  });
  res.json(devices.map((device) => ({
    ...device,
    current: device.id === req.auth.device?.id,
    activeSessions: device.sessions.length,
    sessions: undefined
  })));
}));

accountRouter.patch("/account/devices/:deviceId", asyncRoute(async (req, res) => {
  const { deviceId } = params.parse(req.params);
  const input = z.object({ displayName: z.string().trim().min(1).max(80) }).parse(req.body);
  const device = await prisma.userDevice.findFirst({ where: { id: deviceId, userId: req.auth.account.id } });
  if (!device) throw Object.assign(new Error("Device not found"), { status: 404 });
  res.json(await prisma.userDevice.update({ where: { id: device.id }, data: input }));
}));

accountRouter.delete("/account/devices/:deviceId", asyncRoute(async (req, res) => {
  const { deviceId } = params.parse(req.params);
  const device = await prisma.userDevice.findFirst({ where: { id: deviceId, userId: req.auth.account.id } });
  if (!device) throw Object.assign(new Error("Device not found"), { status: 404 });
  await prisma.$transaction([
    prisma.authSession.updateMany({ where: { userId: req.auth.account.id, deviceId }, data: { revokedAt: new Date() } }),
    prisma.userDevice.update({ where: { id: deviceId }, data: { revokedAt: new Date() } }),
    prisma.securityEvent.create({ data: { userId: req.auth.account.id, deviceId, type: "DEVICE_REVOKED" } })
  ]);
  if (deviceId === req.auth.device?.id) clearAuthCookies(res);
  res.status(204).end();
}));

accountRouter.delete("/account/devices", asyncRoute(async (req, res) => {
  await prisma.$transaction([
    prisma.authSession.updateMany({
      where: { userId: req.auth.account.id, id: { not: req.auth.session.id } },
      data: { revokedAt: new Date() }
    }),
    prisma.securityEvent.create({ data: { userId: req.auth.account.id, type: "OTHER_SESSIONS_REVOKED" } })
  ]);
  res.status(204).end();
}));

accountRouter.get("/account/profile-history", asyncRoute(async (req, res) =>
  res.json(await prisma.profileRevision.findMany({ where: { userId: req.auth.account.id }, orderBy: { version: "desc" } }))
));
accountRouter.get("/account/settings-history", asyncRoute(async (req, res) =>
  res.json(await prisma.settingsRevision.findMany({ where: { userId: req.auth.account.id }, orderBy: { version: "desc" } }))
));
accountRouter.get("/account/security-events", asyncRoute(async (req, res) =>
  res.json(await prisma.securityEvent.findMany({
    where: { userId: req.auth.account.id },
    orderBy: { createdAt: "desc" },
    take: 100
  }))
));

accountRouter.post("/auth/change-password", asyncRoute(async (req, res) => {
  const input = passwordSchema.parse(req.body);
  const user = await prisma.user.findUniqueOrThrow({ where: { id: req.auth.account.id } });
  if (!await verifyPassword(user.passwordHash, input.currentPassword)) {
    throw Object.assign(new Error("Current password is incorrect."), { status: 400, code: "INVALID_PASSWORD" });
  }
  const passwordHash = await hashPassword(input.newPassword);
  await prisma.$transaction([
    prisma.user.update({ where: { id: user.id }, data: { passwordHash } }),
    prisma.authSession.updateMany({ where: { userId: user.id, id: { not: req.auth.session.id } }, data: { revokedAt: new Date() } }),
    prisma.securityEvent.create({ data: { userId: user.id, deviceId: req.auth.device?.id, type: "PASSWORD_CHANGED" } })
  ]);
  res.status(204).end();
}));

accountRouter.get("/account/backups", asyncRoute(async (req, res) =>
  res.json(await prisma.userBackup.findMany({
    where: { userId: req.auth.account.id, status: { not: "DELETED" } },
    orderBy: { createdAt: "desc" }
  }))
));
accountRouter.post("/account/backups", asyncRoute(async (req, res) => {
  if (!req.auth.account.emailVerifiedAt) throw Object.assign(new Error("Verify your email before exporting account data."), { status: 403 });
  res.status(201).json(await createBackup(req.auth.account.id, "MANUAL"));
}));
accountRouter.get("/account/backups/:backupId", asyncRoute(async (req, res) => {
  const { backupId } = params.parse(req.params);
  const result = await readBackup(req.auth.account.id, backupId!);
  res.json({ backup: result.backup, preview: backupPreview(result.payload) });
}));
accountRouter.get("/account/backups/:backupId/download", asyncRoute(async (req, res) => {
  if (!req.auth.account.emailVerifiedAt) throw Object.assign(new Error("Verify your email before exporting account data."), { status: 403 });
  const { backupId } = params.parse(req.params);
  const result = await readBackup(req.auth.account.id, backupId!);
  res.setHeader("Content-Type", "application/octet-stream");
  res.setHeader("Content-Disposition", `attachment; filename="codemuscle-${backupId}.cmbak"`);
  res.send(result.envelope);
}));
accountRouter.post("/account/backups/:backupId/restore", asyncRoute(async (req, res) => {
  if (!req.auth.account.emailVerifiedAt) throw Object.assign(new Error("Verify your email before restoring a backup."), { status: 403 });
  const input = restoreSchema.parse(req.body);
  const user = await prisma.user.findUniqueOrThrow({ where: { id: req.auth.account.id } });
  if (!await verifyPassword(user.passwordHash, input.currentPassword)) {
    throw Object.assign(new Error("Current password is incorrect."), { status: 400 });
  }
  const { backupId } = params.parse(req.params);
  await restoreBackup(user.id, backupId!);
  res.status(204).end();
}));
accountRouter.delete("/account/backups/:backupId", asyncRoute(async (req, res) => {
  const { backupId } = params.parse(req.params);
  const backup = await prisma.userBackup.findFirst({ where: { id: backupId, userId: req.auth.account.id } });
  if (!backup) throw Object.assign(new Error("Backup not found"), { status: 404 });
  await prisma.userBackup.update({ where: { id: backup.id }, data: { status: "DELETED" } });
  res.status(204).end();
}));
