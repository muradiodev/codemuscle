import { PrismaClient } from "@prisma/client";
export const prisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL ?? "postgresql://codemuscle:codemuscle@localhost:5432/codemuscle"
});
export const LOCAL_USER_ID = "local-user";
