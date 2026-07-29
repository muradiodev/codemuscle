import type { PrismaClient } from "@prisma/client";
import { calculateStreak } from "./streak.js";

export async function unlockAchievements(
  prisma: PrismaClient,
  userId: string,
  context: {
    completed: boolean;
    tokenAccuracy: number;
    autocompleteDependencyRatio: number;
    correctCharactersPerMinute: number;
    previousBestCpm: number | null;
    projectId: string;
  }
) {
  const unlocked: string[] = [];
  const award = async (achievementId: string) => {
    await prisma.userAchievement.upsert({
      where: { userId_achievementId: { userId, achievementId } },
      update: {},
      create: { userId, achievementId }
    });
    unlocked.push(achievementId);
  };

  if (context.completed) await award("first-file");
  if (context.tokenAccuracy === 100) await award("perfect-syntax");
  if (context.autocompleteDependencyRatio < 20) await award("low-autocomplete");
  if (context.previousBestCpm !== null && context.correctCharactersPerMinute > context.previousBestCpm) {
    await award("speed-best");
  }

  const metrics = await prisma.dailyMetric.findMany({ where: { userId }, select: { date: true, activeDurationMs: true } });
  if (calculateStreak(metrics.map((metric) => metric.date)) >= 7) await award("seven-day-streak");

  const totalActive = await prisma.practiceSession.aggregate({
    where: { userId },
    _sum: { activeDurationMs: true }
  });
  if ((totalActive._sum.activeDurationMs ?? 0) >= 3_600_000) await award("one-hour");
  if ((totalActive._sum.activeDurationMs ?? 0) >= 36_000_000) await award("ten-hours");

  const completedAttempts = await prisma.fileAttempt.count({ where: { completed: true, session: { userId } } });
  if (completedAttempts >= 10) await award("ten-files");

  const highAccuracy = await prisma.fileAttempt.count({
    where: { completed: true, tokenAccuracy: { gte: 98 }, session: { userId } }
  });
  if (highAccuracy >= 10) await award("accuracy-ten-files");

  const projectFiles = await prisma.trainingFile.findMany({
    where: { projectId: context.projectId, enabled: true },
    include: { sessions: { where: { userId, status: "COMPLETED" }, take: 1 } }
  });
  if (projectFiles.length > 0 && projectFiles.every((file) => file.sessions.length > 0)) {
    await award("first-project");
  }

  return unlocked;
}
