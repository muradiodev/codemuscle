import type { NextFunction, Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { CSRF_COOKIE, SESSION_COOKIE, clearAuthCookies, hashToken } from "../services/auth.js";

const unsafe = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const publicUnsafe = new Set([
  "/api/v1/auth/sign-up",
  "/api/v1/auth/sign-in",
  "/api/v1/auth/forgot-password",
  "/api/v1/auth/reset-password"
]);

export async function authenticate(request: Request, response: Response, next: NextFunction) {
  const rawToken = request.cookies?.[SESSION_COOKIE] as string | undefined;
  if (!rawToken) return response.status(401).json({ error: { code: "UNAUTHENTICATED", message: "Sign in is required.", details: [] } });
  const session = await prisma.authSession.findUnique({
    where: { tokenHash: hashToken(rawToken) },
    include: { user: { include: { profile: true } }, device: true }
  });
  const now = new Date();
  if (
    !session ||
    session.revokedAt ||
    session.expiresAt <= now ||
    session.absoluteExpiresAt <= now ||
    session.user.status !== "ACTIVE" ||
    session.device?.revokedAt
  ) {
    clearAuthCookies(response);
    return response.status(401).json({ error: { code: "SESSION_EXPIRED", message: "Your session has expired.", details: [] } });
  }
  request.auth = {
    account: session.user,
    profile: session.user.profile,
    session,
    device: session.device
  };
  if (now.getTime() - session.lastSeenAt.getTime() > 300_000) {
    void prisma.authSession.update({ where: { id: session.id }, data: { lastSeenAt: now } });
    if (session.deviceId) void prisma.userDevice.update({ where: { id: session.deviceId }, data: { lastSeenAt: now } });
  }
  next();
}

export function validateOrigin(request: Request, response: Response, next: NextFunction) {
  if (!unsafe.has(request.method)) return next();
  const origin = request.get("origin");
  const allowed = (process.env.WEB_ORIGIN ?? "http://localhost:3000").split(",");
  if (origin && !allowed.includes(origin)) {
    return response.status(403).json({ error: { code: "INVALID_ORIGIN", message: "Request origin is not allowed.", details: [] } });
  }
  next();
}

export function validateCsrf(request: Request, response: Response, next: NextFunction) {
  if (!unsafe.has(request.method) || publicUnsafe.has(request.originalUrl.split("?")[0]!)) return next();
  if (!request.auth) return next();
  const header = request.get("x-csrf-token");
  const cookie = request.cookies?.[CSRF_COOKIE] as string | undefined;
  if (!header || !cookie || header !== cookie || hashToken(header) !== request.auth.session.csrfTokenHash) {
    return response.status(403).json({ error: { code: "CSRF_INVALID", message: "The CSRF token is missing or invalid.", details: [] } });
  }
  next();
}
