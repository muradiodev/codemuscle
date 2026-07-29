import { Router } from "express";
import {
  forgotPasswordSchema,
  resetPasswordSchema,
  signInSchema,
  signUpSchema
} from "@codemuscle/shared";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import {
  clearAuthCookies,
  createAuthSession,
  hashPassword,
  hashToken,
  normalizeEmail,
  randomToken,
  verifyPassword
} from "../services/auth.js";
import { sendPasswordReset, sendVerification } from "../services/mail.js";
import { authenticate, validateCsrf } from "../middleware/auth.js";

export const authRouter = Router();
const asyncRoute = (handler: (request: any, response: any) => Promise<unknown>) =>
  (request: any, response: any, next: any) => Promise.resolve(handler(request, response)).catch(next);
const compromised = new Set(["password123", "1234567890", "qwerty12345", "letmein12345"]);
const publicUser = (user: { id: string; email: string; emailVerifiedAt: Date | null; status: string; profile: { id: string; displayName: string }; createdAt: Date }) => ({
  id: user.id,
  profileId: user.profile.id,
  email: user.email,
  emailVerified: Boolean(user.emailVerifiedAt),
  status: user.status,
  displayName: user.profile.displayName,
  createdAt: user.createdAt
});

async function createVerification(userId: string, email: string) {
  const token = randomToken();
  await prisma.emailVerificationToken.create({
    data: { userId, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + 24 * 60 * 60_000) }
  });
  void sendVerification(email, token).catch(() => undefined);
}

authRouter.post("/sign-up", asyncRoute(async (request, response) => {
  const input = signUpSchema.parse(request.body);
  if (compromised.has(input.password.toLowerCase())) {
    return response.status(400).json({ error: { code: "COMPROMISED_PASSWORD", message: "Choose a less common password.", details: [] } });
  }
  const normalizedEmail = normalizeEmail(input.email);
  const passwordHash = await hashPassword(input.password);
  const user = await prisma.$transaction(async (tx) => {
    if (await tx.user.findUnique({ where: { normalizedEmail } })) {
      throw Object.assign(new Error("Email already registered"), { status: 409, code: "EMAIL_EXISTS" });
    }
    const firstAccount = await tx.user.count() === 0;
    const legacy = firstAccount && process.env.ALLOW_FIRST_USER_LEGACY_CLAIM !== "false"
      ? await tx.userProfile.findUnique({ where: { id: "local-user" }, include: { account: true } })
      : null;
    const profileId = legacy && !legacy.account
      ? legacy.id
      : (await tx.userProfile.create({ data: { displayName: input.displayName, settings: { create: {} } } })).id;
    if (legacy && !legacy.account) {
      await tx.userProfile.update({ where: { id: legacy.id }, data: { displayName: input.displayName } });
    }
    const created = await tx.user.create({
      data: { email: input.email.trim(), normalizedEmail, passwordHash, profileId },
      include: { profile: true }
    });
    await tx.profileRevision.create({
      data: { userId: created.id, version: 1, snapshot: { displayName: input.displayName, email: input.email.trim() }, changedFields: ["displayName", "email"] }
    });
    if (legacy && !legacy.account) {
      const backup = await tx.userBackup.create({
        data: { userId: created.id, type: "PRE_MIGRATION", status: "PENDING", schemaVersion: 1 }
      });
      await tx.legacyProgressClaim.create({
        data: { userId: created.id, legacyProfileId: legacy.id, backupId: backup.id, summary: { profileId: legacy.id, claimed: true } }
      });
      await tx.securityEvent.create({ data: { userId: created.id, type: "LEGACY_PROGRESS_CLAIMED" } });
    }
    await tx.securityEvent.create({ data: { userId: created.id, type: "SIGN_UP" } });
    return created;
  });
  await createAuthSession({
    userId: user.id,
    deviceKey: input.deviceKey,
    ...(input.deviceName ? { deviceName: input.deviceName } : {}),
    rememberMe: true,
    request,
    response
  });
  await createVerification(user.id, user.email);
  response.status(201).json({ user: publicUser(user), legacyProgressClaimed: user.profile.id === "local-user" });
}));

authRouter.post("/sign-in", asyncRoute(async (request, response) => {
  const input = signInSchema.parse(request.body);
  const user = await prisma.user.findUnique({
    where: { normalizedEmail: normalizeEmail(input.email) },
    include: { profile: true }
  });
  if (!user || !(await verifyPassword(user.passwordHash, input.password))) {
    return response.status(401).json({ error: { code: "INVALID_CREDENTIALS", message: "Email or password is incorrect.", details: [] } });
  }
  if (user.status !== "ACTIVE") {
    return response.status(403).json({ error: { code: "ACCOUNT_DISABLED", message: "This account is not active.", details: [] } });
  }
  await createAuthSession({
    userId: user.id,
    deviceKey: input.deviceKey,
    ...(input.deviceName ? { deviceName: input.deviceName } : {}),
    rememberMe: input.rememberMe,
    request,
    response
  });
  await prisma.user.update({ where: { id: user.id }, data: { lastSignedInAt: new Date() } });
  await prisma.securityEvent.create({ data: { userId: user.id, type: "SIGN_IN" } });
  response.json({ user: publicUser(user) });
}));

authRouter.get("/session", authenticate, asyncRoute(async (request, response) => {
  response.json({ user: publicUser({ ...request.auth!.account, profile: request.auth!.profile }), session: {
    id: request.auth!.session.id,
    expiresAt: request.auth!.session.expiresAt,
    rememberMe: request.auth!.session.rememberMe,
    deviceId: request.auth!.session.deviceId
  } });
}));

authRouter.get("/csrf", authenticate, (request, response) => {
  response.json({ csrfToken: request.cookies.cm_csrf });
});

authRouter.post("/sign-out", authenticate, validateCsrf, asyncRoute(async (request, response) => {
  await prisma.authSession.update({ where: { id: request.auth!.session.id }, data: { revokedAt: new Date() } });
  await prisma.securityEvent.create({ data: { userId: request.auth!.account.id, type: "SIGN_OUT", deviceId: request.auth!.device?.id } });
  clearAuthCookies(response);
  response.status(204).end();
}));

authRouter.post("/sign-out-all", authenticate, validateCsrf, asyncRoute(async (request, response) => {
  await prisma.authSession.updateMany({ where: { userId: request.auth!.account.id, revokedAt: null }, data: { revokedAt: new Date() } });
  await prisma.securityEvent.create({ data: { userId: request.auth!.account.id, type: "ALL_SESSIONS_REVOKED" } });
  clearAuthCookies(response);
  response.status(204).end();
}));

authRouter.post("/resend-verification", authenticate, validateCsrf, asyncRoute(async (request, response) => {
  if (!request.auth!.account.emailVerifiedAt) await createVerification(request.auth!.account.id, request.auth!.account.email);
  response.status(202).json({ message: "Verification email queued." });
}));

authRouter.post("/verify-email", asyncRoute(async (request, response) => {
  const { token } = z.object({ token: z.string().min(32) }).parse(request.body);
  const record = await prisma.emailVerificationToken.findUnique({ where: { tokenHash: hashToken(token) } });
  if (!record || record.consumedAt || record.expiresAt <= new Date()) {
    return response.status(400).json({ error: { code: "TOKEN_INVALID", message: "Verification token is invalid or expired.", details: [] } });
  }
  await prisma.$transaction([
    prisma.emailVerificationToken.update({ where: { id: record.id }, data: { consumedAt: new Date() } }),
    prisma.user.update({ where: { id: record.userId }, data: { emailVerifiedAt: new Date() } }),
    prisma.securityEvent.create({ data: { userId: record.userId, type: "EMAIL_VERIFIED" } })
  ]);
  response.json({ verified: true });
}));

authRouter.post("/forgot-password", asyncRoute(async (request, response) => {
  const { email } = forgotPasswordSchema.parse(request.body);
  const user = await prisma.user.findUnique({ where: { normalizedEmail: normalizeEmail(email) } });
  if (user) {
    const token = randomToken();
    await prisma.passwordResetToken.create({
      data: { userId: user.id, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + 60 * 60_000) }
    });
    void sendPasswordReset(user.email, token).catch(() => undefined);
  }
  response.status(202).json({ message: "If the account exists, a reset message has been sent." });
}));

authRouter.post("/reset-password", asyncRoute(async (request, response) => {
  const input = resetPasswordSchema.parse(request.body);
  const record = await prisma.passwordResetToken.findUnique({ where: { tokenHash: hashToken(input.token) } });
  if (!record || record.consumedAt || record.expiresAt <= new Date()) {
    return response.status(400).json({ error: { code: "TOKEN_INVALID", message: "Reset token is invalid or expired.", details: [] } });
  }
  const passwordHash = await hashPassword(input.password);
  await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { passwordHash } }),
    prisma.passwordResetToken.update({ where: { id: record.id }, data: { consumedAt: new Date() } }),
    prisma.authSession.updateMany({ where: { userId: record.userId, revokedAt: null }, data: { revokedAt: new Date() } }),
    prisma.securityEvent.create({ data: { userId: record.userId, type: "PASSWORD_RESET" } })
  ]);
  clearAuthCookies(response);
  response.json({ reset: true });
}));
