import { Router } from "express";
import { z } from "zod";
import {
  draftSchema,
  metricsInputSchema,
  profilePatchSchema,
  sessionCreateSchema,
  sessionPatchSchema,
  settingsSchema
} from "@codemuscle/shared";
import { prisma } from "../lib/prisma.js";
import { buildTree } from "../services/tree.js";
import { calculateMetrics } from "../services/comparison.js";
import { recommend } from "../services/recommendations.js";
import { calculateStreak, utcDayStart } from "../services/streak.js";
import { upsertDailyMetric } from "../services/dailyMetrics.js";
import { unlockAchievements } from "../services/achievements.js";
import { openApiDocument } from "../services/openapi.js";

export const apiRouter = Router();

const asyncRoute =
  (handler: (request: any, response: any) => Promise<unknown>) =>
  (request: any, response: any, next: any) =>
    Promise.resolve(handler(request, response)).catch(next);

const idSchema = z.object({
  projectId: z.string().min(1).default("_"),
  fileId: z.string().min(1).default("_"),
  sessionId: z.string().min(1).default("_")
});
const profileId = (request: any): string => request.auth.profile.id;
const ownedSession = (request: any, sessionId: string) =>
  prisma.practiceSession.findFirstOrThrow({
    where: { id: sessionId, userId: profileId(request) },
    include: { file: true }
  });

apiRouter.get("/health", (_req, res) => res.json({ status: "ok", service: "codemuscle-api" }));
apiRouter.get("/ready", asyncRoute(async (_req, res) => {
  await prisma.$queryRaw`SELECT 1`;
  res.json({ status: "ready" });
}));
apiRouter.get("/openapi.json", (_req, res) => res.json(openApiDocument));

apiRouter.get("/profile", asyncRoute(async (req, res) =>
  res.json(await prisma.userProfile.findUniqueOrThrow({ where: { id: profileId(req) } }))
));
apiRouter.patch("/profile", asyncRoute(async (req, res) =>
  res.json(await prisma.userProfile.update({ where: { id: profileId(req) }, data: profilePatchSchema.parse(req.body) }))
));
apiRouter.get("/settings", asyncRoute(async (req, res) => {
  const value = await prisma.userSettings.findUniqueOrThrow({ where: { userId: profileId(req) } });
  res.json({ ...value, comparisonMode: value.comparisonMode.toLowerCase() });
}));
apiRouter.patch("/settings", asyncRoute(async (req, res) => {
  const value = settingsSchema.partial().parse(req.body);
  const { comparisonMode, ...rest } = value;
  const data = {
    ...rest,
    ...(comparisonMode ? { comparisonMode: comparisonMode.toUpperCase() as "SYNTAX" | "STRICT" } : {})
  };
  res.json(await prisma.userSettings.update({ where: { userId: profileId(req) }, data }));
}));

apiRouter.get("/languages", asyncRoute(async (_req, res) =>
  res.json(await prisma.language.findMany({ orderBy: { name: "asc" } }))
));
apiRouter.get("/projects", asyncRoute(async (req, res) => {
  const projects = await prisma.trainingProject.findMany({
    where: { enabled: true },
    include: {
      _count: { select: { files: true } },
      files: {
        where: { enabled: true },
        orderBy: { order: "asc" },
        select: {
          id: true,
          sessions: {
            where: { userId: profileId(req), status: "COMPLETED" },
            select: { id: true }
          }
        }
      }
    },
    orderBy: { order: "asc" }
  });
  res.json(
    projects.map((project) => {
      const nextFile = project.files.find((file) => file.sessions.length === 0) ?? project.files[0];
      return {
        ...project,
        fileCount: project._count.files,
        completedFiles: project.files.filter((file) => file.sessions.length).length,
        nextFileId: nextFile?.id ?? null,
        files: undefined,
        _count: undefined
      };
    })
  );
}));
apiRouter.get("/projects/:projectId", asyncRoute(async (req, res) => {
  const { projectId } = idSchema.parse(req.params);
  res.json(
    await prisma.trainingProject.findUniqueOrThrow({
      where: { id: projectId },
      include: {
        files: {
          include: {
            topics: { include: { topic: true } },
            sessions: {
              where: { userId: profileId(req) },
              include: { attempts: { orderBy: { createdAt: "desc" }, take: 1 } }
            }
          },
          orderBy: { order: "asc" }
        }
      }
    })
  );
}));
apiRouter.get("/projects/:projectId/files", asyncRoute(async (req, res) => {
  const { projectId } = idSchema.parse(req.params);
  res.json(
    await prisma.trainingFile.findMany({
      where: { projectId, enabled: true },
      include: { topics: { include: { topic: true } } },
      orderBy: { order: "asc" }
    })
  );
}));
apiRouter.get("/projects/:projectId/tree", asyncRoute(async (req, res) => {
  const { projectId } = idSchema.parse(req.params);
  const files = await prisma.trainingFile.findMany({
    where: { projectId, enabled: true },
    select: { id: true, path: true },
    orderBy: { path: "asc" }
  });
  res.json(
    buildTree(
      files.map((file) => ({
        ...file,
        projectId: "",
        fileName: "",
        language: "java" as const,
        difficulty: "warmup" as const,
        order: 0,
        estimatedMinutes: 0,
        topics: [],
        referenceCode: "",
        enabled: true,
        contentHash: ""
      }))
    )
  );
}));
apiRouter.get("/files/:fileId", asyncRoute(async (req, res) => {
  const { fileId } = idSchema.parse(req.params);
  res.json(
    await prisma.trainingFile.findUniqueOrThrow({
      where: { id: fileId },
      include: {
        project: true,
        topics: { include: { topic: true } },
        sessions: {
          where: { userId: profileId(req) },
          include: { draft: true, attempts: { orderBy: { createdAt: "desc" }, take: 3 } },
          orderBy: { startedAt: "desc" },
          take: 1
        }
      }
    })
  );
}));

apiRouter.post("/sessions", asyncRoute(async (req, res) => {
  const input = sessionCreateSchema.parse(req.body);
  const session = await prisma.practiceSession.create({
    data: {
      userId: profileId(req),
      projectId: input.projectId,
      fileId: input.fileId,
      comparisonMode: input.comparisonMode.toUpperCase() as "SYNTAX" | "STRICT"
    }
  });
  res.status(201).json(session);
}));
apiRouter.get("/sessions/:sessionId", asyncRoute(async (req, res) => {
  const { sessionId } = idSchema.parse(req.params);
  res.json(
    await prisma.practiceSession.findFirstOrThrow({
      where: { id: sessionId, userId: profileId(req) },
      include: { draft: true, attempts: true, file: true, project: true }
    })
  );
}));
apiRouter.patch("/sessions/:sessionId", asyncRoute(async (req, res) => {
  const { sessionId } = idSchema.parse(req.params);
  await ownedSession(req, sessionId);
  res.json(await prisma.practiceSession.update({ where: { id: sessionId }, data: sessionPatchSchema.parse(req.body) }));
}));
apiRouter.post("/sessions/:sessionId/pause", asyncRoute(async (req, res) => {
  const { sessionId } = idSchema.parse(req.params);
  const current = await ownedSession(req, sessionId);
  if (current.status !== "ACTIVE") throw Object.assign(new Error("Session is not active"), { status: 409 });
  const activeIncrement = Math.max(0, Date.now() - current.lastResumedAt.getTime());
  res.json(
    await prisma.practiceSession.update({
      where: { id: sessionId },
      data: { status: "PAUSED", activeDurationMs: { increment: activeIncrement } }
    })
  );
}));
apiRouter.post("/sessions/:sessionId/resume", asyncRoute(async (req, res) => {
  const { sessionId } = idSchema.parse(req.params);
  const current = await ownedSession(req, sessionId);
  if (current.status !== "PAUSED") throw Object.assign(new Error("Session is not paused"), { status: 409 });
  res.json(
    await prisma.practiceSession.update({
      where: { id: sessionId },
      data: { status: "ACTIVE", lastResumedAt: new Date() }
    })
  );
}));
apiRouter.post("/sessions/:sessionId/restart", asyncRoute(async (req, res) => {
  const { sessionId } = idSchema.parse(req.params);
  const old = await ownedSession(req, sessionId);
  await prisma.practiceSession.update({ where: { id: sessionId }, data: { status: "ABANDONED" } });
  res.status(201).json(
    await prisma.practiceSession.create({
      data: {
        userId: old.userId,
        projectId: old.projectId,
        fileId: old.fileId,
        comparisonMode: old.comparisonMode
      }
    })
  );
}));
apiRouter.put("/sessions/:sessionId/draft", asyncRoute(async (req, res) => {
  const { sessionId } = idSchema.parse(req.params);
  await ownedSession(req, sessionId);
  const { typedCode } = draftSchema.parse(req.body);
  res.json(await prisma.savedDraft.upsert({ where: { sessionId }, update: { typedCode }, create: { sessionId, typedCode } }));
}));
apiRouter.get("/sessions/:sessionId/draft", asyncRoute(async (req, res) => {
  const { sessionId } = idSchema.parse(req.params);
  await ownedSession(req, sessionId);
  res.json(await prisma.savedDraft.findUnique({ where: { sessionId } }));
}));
apiRouter.post("/sessions/:sessionId/metrics", asyncRoute(async (req, res) => {
  const { sessionId } = idSchema.parse(req.params);
  const input = metricsInputSchema.parse(req.body);
  const session = await ownedSession(req, sessionId);
  res.json(calculateMetrics(input, session.file.referenceCode, session.comparisonMode.toLowerCase() as "syntax" | "strict"));
}));
apiRouter.post("/sessions/:sessionId/finish", asyncRoute(async (req, res) => {
  const { sessionId } = idSchema.parse(req.params);
  const input = metricsInputSchema.parse(req.body);
  const session = await ownedSession(req, sessionId);
  const metrics = calculateMetrics(input, session.file.referenceCode, session.comparisonMode.toLowerCase() as "syntax" | "strict");
  const completed = metrics.state === "completed";
  const previousBest = await prisma.fileAttempt.aggregate({
    where: { session: { userId: profileId(req), fileId: session.fileId } },
    _max: { correctCharactersPerMinute: true }
  });
  const attempt = await prisma.$transaction(async (tx) => {
    const result = await tx.fileAttempt.create({
      data: {
        sessionId,
        typedCode: input.typedCode,
        completionPercentage: metrics.completionPercentage,
        characterAccuracy: metrics.characterAccuracy,
        tokenAccuracy: metrics.tokenAccuracy,
        correctCharactersPerMinute: metrics.correctCharactersPerMinute,
        rawCharactersPerMinute: metrics.rawCharactersPerMinute,
        linesPerMinute: metrics.linesPerMinute,
        manualCharacterCount: input.manualCharacterCount,
        autocompleteCharacterCount: input.autocompleteCharacterCount,
        autocompleteDependencyRatio: metrics.autocompleteDependencyRatio,
        keystrokeCount: input.keystrokeCount,
        backspaceCount: input.backspaceCount,
        pasteAttemptCount: input.pasteAttemptCount,
        errorCount: input.errorCount,
        correctedErrorCount: input.correctedErrorCount,
        averageRecoveryTimeMs: metrics.averageRecoveryTimeMs,
        completed
      }
    });
    await tx.practiceSession.update({
      where: { id: sessionId },
      data: { status: "COMPLETED", completedAt: new Date(), activeDurationMs: input.activeDurationMs }
    });
    await upsertDailyMetric(tx as unknown as typeof prisma, profileId(req), {
      activeDurationMs: input.activeDurationMs,
      completed,
      tokenAccuracy: metrics.tokenAccuracy,
      correctCharactersPerMinute: metrics.correctCharactersPerMinute,
      manualCodingRatio: metrics.manualCodingRatio
    });
    const settings = await tx.userSettings.findUniqueOrThrow({ where: { userId: profileId(req) } });
    const day = utcDayStart();
    const daily = await tx.dailyMetric.findUnique({ where: { userId_date: { userId: profileId(req), date: day } } });
    await tx.practiceGoal.upsert({
      where: { userId_date: { userId: profileId(req), date: day } },
      update: {
        targetMinutes: settings.dailyGoalMinutes,
        completed: (daily?.activeDurationMs ?? 0) >= settings.dailyGoalMinutes * 60_000
      },
      create: {
        userId: profileId(req),
        date: day,
        targetMinutes: settings.dailyGoalMinutes,
        completed: (daily?.activeDurationMs ?? 0) >= settings.dailyGoalMinutes * 60_000
      }
    });
    return result;
  });
  const unlocked = await unlockAchievements(prisma, profileId(req), {
    completed,
    tokenAccuracy: metrics.tokenAccuracy,
    autocompleteDependencyRatio: metrics.autocompleteDependencyRatio,
    correctCharactersPerMinute: metrics.correctCharactersPerMinute,
    previousBestCpm: previousBest._max.correctCharactersPerMinute,
    projectId: session.projectId
  });
  res.json({ ...attempt, metrics, unlockedAchievements: unlocked });
}));

apiRouter.get("/dashboard/summary", asyncRoute(async (req, res) => {
  const sessions = await prisma.practiceSession.findMany({ where: { userId: profileId(req) }, include: { attempts: true } });
  const attempts = sessions.flatMap((session) => session.attempts);
  const completed = attempts.filter((attempt) => attempt.completed);
  const metrics = await prisma.dailyMetric.findMany({ where: { userId: profileId(req) }, select: { date: true } });
  const settings = await prisma.userSettings.findUniqueOrThrow({ where: { userId: profileId(req) } });
  const today = await prisma.dailyMetric.findUnique({
    where: { userId_date: { userId: profileId(req), date: utcDayStart() } }
  });
  res.json({
    activeMinutes: Math.round(sessions.reduce((sum, session) => sum + session.activeDurationMs, 0) / 60_000),
    todayActiveMinutes: Math.round((today?.activeDurationMs ?? 0) / 60_000),
    filesCompleted: completed.length,
    averageAccuracy: attempts.length ? attempts.reduce((sum, attempt) => sum + attempt.tokenAccuracy, 0) / attempts.length : 0,
    averageCpm: attempts.length ? attempts.reduce((sum, attempt) => sum + attempt.correctCharactersPerMinute, 0) / attempts.length : 0,
    manualCodingRatio: attempts.length
      ? 100 - attempts.reduce((sum, attempt) => sum + attempt.autocompleteDependencyRatio, 0) / attempts.length
      : 100,
    currentStreak: calculateStreak(metrics.map((metric) => metric.date)),
    dailyGoalMinutes: settings.dailyGoalMinutes
  });
}));
apiRouter.get("/dashboard/recent-sessions", asyncRoute(async (req, res) =>
  res.json(
    await prisma.practiceSession.findMany({
      where: { userId: profileId(req) },
      include: { file: true, project: true, attempts: true },
      orderBy: { startedAt: "desc" },
      take: 20
    })
  )
));
apiRouter.get("/dashboard/timeseries", asyncRoute(async (req, res) =>
  res.json(await prisma.dailyMetric.findMany({ where: { userId: profileId(req) }, orderBy: { date: "asc" }, take: 30 }))
));
apiRouter.get("/dashboard/topics", asyncRoute(async (req, res) => {
  const attempts = await prisma.fileAttempt.findMany({
    where: { session: { userId: profileId(req) } },
    include: { session: { include: { file: { include: { topics: { include: { topic: true } } } } } } }
  });
  const buckets = new Map<string, { topic: string; attempts: number; accuracySum: number; cpmSum: number }>();
  for (const attempt of attempts) {
    for (const link of attempt.session.file.topics) {
      const key = link.topic.slug;
      const current = buckets.get(key) ?? { topic: link.topic.name, attempts: 0, accuracySum: 0, cpmSum: 0 };
      current.attempts += 1;
      current.accuracySum += attempt.tokenAccuracy;
      current.cpmSum += attempt.correctCharactersPerMinute;
      buckets.set(key, current);
    }
  }
  res.json(
    [...buckets.values()].map((bucket) => ({
      topic: bucket.topic,
      attempts: bucket.attempts,
      averageAccuracy: bucket.accuracySum / bucket.attempts,
      averageCpm: bucket.cpmSum / bucket.attempts
    }))
  );
}));
apiRouter.get("/dashboard/projects", asyncRoute(async (_req, res) => res.redirect(307, "/api/v1/projects")));
apiRouter.get("/dashboard/personal-bests", asyncRoute(async (req, res) => {
  const values = await prisma.fileAttempt.aggregate({
    where: { session: { userId: profileId(req) } },
    _max: { correctCharactersPerMinute: true, tokenAccuracy: true, linesPerMinute: true }
  });
  res.json(values._max);
}));
apiRouter.get("/recommendations/daily", asyncRoute(async (req, res) => {
  const topicStats = await prisma.fileAttempt.findMany({
    where: { session: { userId: profileId(req) } },
    include: { session: { include: { file: { include: { topics: { include: { topic: true } } } } } } }
  });
  const topicAccuracy = new Map<string, { sum: number; count: number }>();
  for (const attempt of topicStats) {
    for (const link of attempt.session.file.topics) {
      const current = topicAccuracy.get(link.topic.slug) ?? { sum: 0, count: 0 };
      current.sum += attempt.tokenAccuracy;
      current.count += 1;
      topicAccuracy.set(link.topic.slug, current);
    }
  }
  const average =
    [...topicAccuracy.values()].reduce((sum, value) => sum + value.sum / value.count, 0) /
    Math.max(1, topicAccuracy.size);
  const files = await prisma.trainingFile.findMany({
    include: {
      topics: { include: { topic: true } },
      sessions: { where: { userId: profileId(req) }, include: { attempts: { orderBy: { createdAt: "desc" }, take: 1 } } },
      repeats: { where: { userId: profileId(req) } }
    },
    orderBy: [{ project: { order: "asc" } }, { order: "asc" }]
  });
  res.json(
    recommend(
      files.map((file) => {
        const latest = file.sessions.flatMap((session) => session.attempts)[0];
        const weak = file.topics.find((link) => {
          const stats = topicAccuracy.get(link.topic.slug);
          return stats ? stats.sum / stats.count < average - 5 : false;
        });
        return {
          fileId: file.id,
          fileName: file.fileName,
          projectId: file.projectId,
          order: file.order,
          completed: file.sessions.some((session) => session.status === "COMPLETED"),
          repeated: file.repeats.length > 0,
          ...(latest
            ? {
                accuracy: latest.tokenAccuracy,
                cpm: latest.correctCharactersPerMinute,
                lastPractisedAt: latest.createdAt
              }
            : {}),
          ...(weak ? { weakTopic: weak.topic.name } : {})
        };
      })
    )
  );
}));
apiRouter.post("/files/:fileId/repeat", asyncRoute(async (req, res) => {
  const { fileId } = idSchema.parse(req.params);
  res.status(201).json(
    await prisma.repetition.upsert({
      where: { userId_fileId: { userId: profileId(req), fileId: fileId! } },
      update: { markedAt: new Date() },
      create: { userId: profileId(req), fileId: fileId! }
    })
  );
}));
apiRouter.delete("/files/:fileId/repeat", asyncRoute(async (req, res) => {
  const { fileId } = idSchema.parse(req.params);
  await prisma.repetition.deleteMany({ where: { userId: profileId(req), fileId } });
  res.status(204).end();
}));
apiRouter.get("/achievements", asyncRoute(async (_req, res) => res.json(await prisma.achievement.findMany())));
apiRouter.get("/achievements/unlocked", asyncRoute(async (req, res) =>
  res.json(
    await prisma.userAchievement.findMany({
      where: { userId: profileId(req) },
      include: { achievement: true },
      orderBy: { unlockedAt: "desc" }
    })
  )
));
