import { createHash, randomBytes } from "node:crypto";
import argon2 from "argon2";
import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";

export const SESSION_COOKIE = "cm_session";
export const CSRF_COOKIE = "cm_csrf";
const standardMs = Number(process.env.AUTH_SESSION_DAYS ?? 7) * 86_400_000;
const rememberMs = Number(process.env.AUTH_REMEMBER_DAYS ?? 30) * 86_400_000;

export const normalizeEmail = (email: string) => email.trim().normalize("NFKC").toLowerCase();
export const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");
export const randomToken = () => randomBytes(32).toString("base64url");
export const hashPassword = (password: string) =>
  argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: Number(process.env.AUTH_ARGON2_MEMORY_KIB ?? 65_536),
    timeCost: Number(process.env.AUTH_ARGON2_TIME_COST ?? 3),
    parallelism: Number(process.env.AUTH_ARGON2_PARALLELISM ?? 1)
  });
export const verifyPassword = (hash: string, password: string) => argon2.verify(hash, password);

function cookieOptions(maxAge: number, httpOnly: boolean) {
  return {
    httpOnly,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    ...(process.env.AUTH_COOKIE_DOMAIN ? { domain: process.env.AUTH_COOKIE_DOMAIN } : {}),
    maxAge
  };
}

export function clientMetadata(request: Request) {
  const forwarded = request.headers["x-forwarded-for"];
  const ip = Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(",")[0] ?? request.ip;
  const ipHash = ip
    ? createHash("sha256").update(`${process.env.AUTH_IP_SALT ?? "local-ip-salt"}:${ip}`).digest("hex")
    : null;
  const userAgent = request.get("user-agent")?.slice(0, 500) ?? null;
  return { ipHash, userAgent };
}

export async function createAuthSession(args: {
  userId: string;
  deviceKey: string;
  deviceName?: string;
  rememberMe: boolean;
  request: Request;
  response: Response;
}) {
  const now = new Date();
  const duration = args.rememberMe ? rememberMs : standardMs;
  const rawToken = randomToken();
  const csrfToken = randomToken();
  const metadata = clientMetadata(args.request);
  const device = await prisma.userDevice.upsert({
    where: { userId_deviceKey: { userId: args.userId, deviceKey: args.deviceKey } },
    update: {
      lastSeenAt: now,
      revokedAt: null,
      ...(args.deviceName ? { displayName: args.deviceName.slice(0, 100) } : {})
    },
    create: {
      userId: args.userId,
      deviceKey: args.deviceKey,
      displayName: args.deviceName?.slice(0, 100) ?? "Browser"
    }
  });
  const session = await prisma.authSession.create({
    data: {
      userId: args.userId,
      deviceId: device.id,
      tokenHash: hashToken(rawToken),
      csrfTokenHash: hashToken(csrfToken),
      expiresAt: new Date(now.getTime() + duration),
      absoluteExpiresAt: new Date(now.getTime() + duration),
      rememberMe: args.rememberMe,
      ...metadata
    }
  });
  args.response.cookie(SESSION_COOKIE, rawToken, cookieOptions(duration, true));
  args.response.cookie(CSRF_COOKIE, csrfToken, cookieOptions(duration, false));
  return session;
}

export function clearAuthCookies(response: Response) {
  response.clearCookie(SESSION_COOKIE, { path: "/" });
  response.clearCookie(CSRF_COOKIE, { path: "/" });
}
