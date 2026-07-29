import { createHash } from "node:crypto";
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";

const saveSchema = z.object({
  typedCode: z.string().max(1_000_000),
  basedOnRevision: z.number().int().nonnegative(),
  deviceId: z.string().min(1).max(200),
  sessionId: z.string().cuid().optional()
});
const leaseSchema = z.object({
  deviceId: z.string().min(1).max(200),
  sessionId: z.string().cuid()
});
const fileParams = z.object({ fileId: z.string().min(1) });
const leaseMs = Number(process.env.DRAFT_LEASE_MS ?? 60_000);
const asyncRoute =
  (handler: (request: any, response: any) => Promise<unknown>) =>
  (request: any, response: any, next: any) =>
    Promise.resolve(handler(request, response)).catch(next);

function conflict(message: string, details: unknown) {
  return Object.assign(new Error(message), { status: 409, code: "DRAFT_CONFLICT", details });
}

async function verifySession(profileId: string, sessionId?: string) {
  if (!sessionId) return;
  const session = await prisma.practiceSession.findFirst({ where: { id: sessionId, userId: profileId } });
  if (!session) throw Object.assign(new Error("Session not found"), { status: 404 });
}

export const draftRouter = Router();

draftRouter.get("/files/:fileId/draft", asyncRoute(async (req, res) => {
  const { fileId } = fileParams.parse(req.params);
  const document = await prisma.draftDocument.findUnique({
    where: { userId_fileId: { userId: req.auth.profile.id, fileId } },
    include: { revisions: { orderBy: { revision: "desc" }, take: 1 } }
  });
  res.json(document ? { ...document, latest: document.revisions[0] ?? null } : null);
}));

draftRouter.get("/files/:fileId/draft/revisions", asyncRoute(async (req, res) => {
  const { fileId } = fileParams.parse(req.params);
  const document = await prisma.draftDocument.findUnique({
    where: { userId_fileId: { userId: req.auth.profile.id, fileId } }
  });
  if (!document) return res.json([]);
  res.json(await prisma.draftRevision.findMany({
    where: { documentId: document.id },
    orderBy: { revision: "desc" },
    take: 100
  }));
}));

draftRouter.put("/files/:fileId/draft", asyncRoute(async (req, res) => {
  const { fileId } = fileParams.parse(req.params);
  const input = saveSchema.parse(req.body);
  await verifySession(req.auth.profile.id, input.sessionId);
  const saved = await prisma.$transaction(async (tx) => {
    const document = await tx.draftDocument.upsert({
      where: { userId_fileId: { userId: req.auth.profile.id, fileId } },
      update: {},
      create: { userId: req.auth.profile.id, fileId }
    });
    if (document.latestRevision !== input.basedOnRevision) {
      const latest = await tx.draftRevision.findUnique({
        where: { documentId_revision: { documentId: document.id, revision: document.latestRevision } }
      });
      throw conflict("A newer draft exists on the server.", {
        serverRevision: document.latestRevision,
        basedOnRevision: input.basedOnRevision,
        server: latest,
        localCharacterCount: input.typedCode.length,
        serverCharacterCount: latest?.typedCode.length ?? 0
      });
    }
    const revision = document.latestRevision + 1;
    const created = await tx.draftRevision.create({
      data: {
        documentId: document.id,
        revision,
        basedOnRevision: input.basedOnRevision,
        deviceId: req.auth.device?.id,
        sessionId: input.sessionId,
        typedCode: input.typedCode,
        contentHash: createHash("sha256").update(input.typedCode).digest("hex")
      }
    });
    await tx.draftDocument.update({
      where: { id: document.id },
      data: { latestRevision: revision }
    });
    return created;
  }, { isolationLevel: "Serializable" });
  res.json(saved);
}));

async function acquireLease(req: any, takeOver: boolean) {
  const { fileId } = fileParams.parse(req.params);
  const input = leaseSchema.parse(req.body);
  await verifySession(req.auth.profile.id, input.sessionId);
  return prisma.$transaction(async (tx) => {
    const document = await tx.draftDocument.upsert({
      where: { userId_fileId: { userId: req.auth.profile.id, fileId } },
      update: {},
      create: { userId: req.auth.profile.id, fileId }
    });
    const activeElsewhere =
      document.leaseExpiresAt && document.leaseExpiresAt > new Date() &&
      document.activeDeviceId && document.activeDeviceId !== req.auth.device?.id;
    if (activeElsewhere && !takeOver) {
      throw conflict("This file is currently active on another device.", {
        activeDeviceId: document.activeDeviceId,
        leaseExpiresAt: document.leaseExpiresAt,
        latestRevision: document.latestRevision
      });
    }
    return tx.draftDocument.update({
      where: { id: document.id },
      data: {
        activeDeviceId: req.auth.device?.id ?? input.deviceId,
        activeSessionId: input.sessionId,
        leaseExpiresAt: new Date(Date.now() + leaseMs)
      }
    });
  }, { isolationLevel: "Serializable" });
}

draftRouter.post("/files/:fileId/lease", asyncRoute(async (req, res) => res.json(await acquireLease(req, false))));
draftRouter.post("/files/:fileId/lease/takeover", asyncRoute(async (req, res) => res.json(await acquireLease(req, true))));
draftRouter.post("/files/:fileId/lease/heartbeat", asyncRoute(async (req, res) => {
  const { fileId } = fileParams.parse(req.params);
  const input = leaseSchema.parse(req.body);
  const document = await prisma.draftDocument.findUnique({
    where: { userId_fileId: { userId: req.auth.profile.id, fileId } }
  });
  if (!document || document.activeDeviceId !== req.auth.device?.id || document.activeSessionId !== input.sessionId) {
    throw conflict("The editing lease is no longer owned by this device.", { latestRevision: document?.latestRevision ?? 0 });
  }
  res.json(await prisma.draftDocument.update({
    where: { id: document.id },
    data: { leaseExpiresAt: new Date(Date.now() + leaseMs) }
  }));
}));
draftRouter.delete("/files/:fileId/lease", asyncRoute(async (req, res) => {
  const { fileId } = fileParams.parse(req.params);
  const document = await prisma.draftDocument.findUnique({
    where: { userId_fileId: { userId: req.auth.profile.id, fileId } }
  });
  if (document && document.activeDeviceId === req.auth.device?.id) {
    await prisma.draftDocument.update({
      where: { id: document.id },
      data: { activeDeviceId: null, activeSessionId: null, leaseExpiresAt: null }
    });
  }
  res.status(204).end();
}));
