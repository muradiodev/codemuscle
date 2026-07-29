import { createHash } from "node:crypto";
import type { Server as HttpServer } from "node:http";
import { Server } from "socket.io";
import { prisma } from "../lib/prisma.js";
import { SESSION_COOKIE } from "./auth.js";

let io: Server | undefined;
const cookieValue = (header: string | undefined, name: string) =>
  header?.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${name}=`))?.slice(name.length + 1);

export function startRealtime(server: HttpServer) {
  io = new Server(server, {
    path: "/api/v1/realtime",
    cors: { origin: process.env.WEB_ORIGIN ?? "http://localhost:3000", credentials: true },
    maxHttpBufferSize: 256_000
  });
  io.use(async (socket, next) => {
    const raw = cookieValue(socket.request.headers.cookie, SESSION_COOKIE);
    if (!raw) return next(new Error("Unauthorized"));
    const authSession = await prisma.authSession.findUnique({
      where: { tokenHash: createHash("sha256").update(raw).digest("hex") },
      include: { user: true }
    });
    if (!authSession || authSession.revokedAt || authSession.expiresAt <= new Date() ||
        authSession.absoluteExpiresAt <= new Date() || authSession.user.status !== "ACTIVE") {
      return next(new Error("Unauthorized"));
    }
    socket.data.userId = authSession.userId;
    socket.data.sessionId = authSession.id;
    socket.join(`user:${authSession.userId}`);
    next();
  });
  return io;
}

export function emitUserEvent(userId: string, event: string, payload: unknown = {}) {
  io?.to(`user:${userId}`).emit(event, payload);
}

export function disconnectSession(sessionId: string) {
  for (const socket of io?.sockets.sockets.values() ?? []) {
    if (socket.data.sessionId === sessionId) socket.disconnect(true);
  }
}

export function disconnectUser(userId: string, exceptSessionId?: string) {
  for (const socket of io?.sockets.sockets.values() ?? []) {
    if (socket.data.userId === userId && socket.data.sessionId !== exceptSessionId) socket.disconnect(true);
  }
}
