import type { PrismaClient } from "@prisma/client";
import { utcDayStart } from "./streak.js";

export async function upsertDailyMetric(
  prisma: PrismaClient,
  userId: string,
  input: {
    activeDurationMs: number;
    completed: boolean;
    tokenAccuracy: number;
    correctCharactersPerMinute: number;
    manualCodingRatio: number;
  }
) {
  const date = utcDayStart();
  const existing = await prisma.dailyMetric.findUnique({ where: { userId_date: { userId, date } } });
  if (!existing) {
    return prisma.dailyMetric.create({
      data: {
        userId,
        date,
        activeDurationMs: input.activeDurationMs,
        filesCompleted: input.completed ? 1 : 0,
        averageAccuracy: input.tokenAccuracy,
        averageCpm: input.correctCharactersPerMinute,
        manualCodingRatio: input.manualCodingRatio
      }
    });
  }
  const samples = Math.max(1, existing.filesCompleted + (input.completed ? 1 : 0));
  const previousSamples = Math.max(1, existing.filesCompleted);
  return prisma.dailyMetric.update({
    where: { userId_date: { userId, date } },
    data: {
      activeDurationMs: { increment: input.activeDurationMs },
      filesCompleted: { increment: input.completed ? 1 : 0 },
      averageAccuracy: (existing.averageAccuracy * previousSamples + input.tokenAccuracy) / samples,
      averageCpm: (existing.averageCpm * previousSamples + input.correctCharactersPerMinute) / samples,
      manualCodingRatio: (existing.manualCodingRatio * previousSamples + input.manualCodingRatio) / samples
    }
  });
}
