-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('ACTIVE', 'PAUSED', 'COMPLETED', 'ABANDONED');

-- CreateEnum
CREATE TYPE "ComparisonMode" AS ENUM ('SYNTAX', 'STRICT');

-- CreateTable
CREATE TABLE "UserProfile" (
    "id" TEXT NOT NULL,
    "displayName" TEXT NOT NULL DEFAULT 'Local Developer',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSettings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "theme" TEXT NOT NULL DEFAULT 'dark',
    "editorFontSize" INTEGER NOT NULL DEFAULT 14,
    "tabSize" INTEGER NOT NULL DEFAULT 4,
    "wordWrap" BOOLEAN NOT NULL DEFAULT false,
    "minimapEnabled" BOOLEAN NOT NULL DEFAULT false,
    "synchronizedScrolling" BOOLEAN NOT NULL DEFAULT true,
    "pasteAllowed" BOOLEAN NOT NULL DEFAULT false,
    "comparisonMode" "ComparisonMode" NOT NULL DEFAULT 'SYNTAX',
    "dailyGoalMinutes" INTEGER NOT NULL DEFAULT 30,
    "onboardingComplete" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "UserSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Language" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "comingSoon" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Language_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingProject" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "languageId" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "TrainingProject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingFile" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "referenceCode" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "estimatedMinutes" INTEGER NOT NULL,
    "order" INTEGER NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "contentHash" TEXT NOT NULL,

    CONSTRAINT "TrainingFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Topic" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Topic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingFileTopic" (
    "fileId" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,

    CONSTRAINT "TrainingFileTopic_pkey" PRIMARY KEY ("fileId","topicId")
);

-- CreateTable
CREATE TABLE "PracticeSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "fileId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "activeDurationMs" INTEGER NOT NULL DEFAULT 0,
    "pausedDurationMs" INTEGER NOT NULL DEFAULT 0,
    "status" "SessionStatus" NOT NULL DEFAULT 'ACTIVE',
    "comparisonMode" "ComparisonMode" NOT NULL DEFAULT 'SYNTAX',
    "lastResumedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PracticeSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FileAttempt" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "typedCode" TEXT NOT NULL,
    "completionPercentage" DOUBLE PRECISION NOT NULL,
    "characterAccuracy" DOUBLE PRECISION NOT NULL,
    "tokenAccuracy" DOUBLE PRECISION NOT NULL,
    "correctCharactersPerMinute" DOUBLE PRECISION NOT NULL,
    "rawCharactersPerMinute" DOUBLE PRECISION NOT NULL,
    "linesPerMinute" DOUBLE PRECISION NOT NULL,
    "manualCharacterCount" INTEGER NOT NULL,
    "autocompleteCharacterCount" INTEGER NOT NULL,
    "autocompleteDependencyRatio" DOUBLE PRECISION NOT NULL,
    "keystrokeCount" INTEGER NOT NULL,
    "backspaceCount" INTEGER NOT NULL,
    "pasteAttemptCount" INTEGER NOT NULL,
    "errorCount" INTEGER NOT NULL,
    "correctedErrorCount" INTEGER NOT NULL,
    "averageRecoveryTimeMs" DOUBLE PRECISION NOT NULL,
    "completed" BOOLEAN NOT NULL,

    CONSTRAINT "FileAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyMetric" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "activeDurationMs" INTEGER NOT NULL DEFAULT 0,
    "filesCompleted" INTEGER NOT NULL DEFAULT 0,
    "averageAccuracy" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "averageCpm" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "manualCodingRatio" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "DailyMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Achievement" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "Achievement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserAchievement" (
    "userId" TEXT NOT NULL,
    "achievementId" TEXT NOT NULL,
    "unlockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserAchievement_pkey" PRIMARY KEY ("userId","achievementId")
);

-- CreateTable
CREATE TABLE "PracticeGoal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "targetMinutes" INTEGER NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "PracticeGoal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedDraft" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "typedCode" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SavedDraft_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Repetition" (
    "userId" TEXT NOT NULL,
    "fileId" TEXT NOT NULL,
    "markedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Repetition_pkey" PRIMARY KEY ("userId","fileId")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserSettings_userId_key" ON "UserSettings"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingProject_slug_key" ON "TrainingProject"("slug");

-- CreateIndex
CREATE INDEX "TrainingFile_projectId_order_idx" ON "TrainingFile"("projectId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingFile_projectId_path_key" ON "TrainingFile"("projectId", "path");

-- CreateIndex
CREATE UNIQUE INDEX "Topic_slug_key" ON "Topic"("slug");

-- CreateIndex
CREATE INDEX "PracticeSession_userId_startedAt_idx" ON "PracticeSession"("userId", "startedAt");

-- CreateIndex
CREATE INDEX "PracticeSession_projectId_fileId_idx" ON "PracticeSession"("projectId", "fileId");

-- CreateIndex
CREATE INDEX "FileAttempt_sessionId_createdAt_idx" ON "FileAttempt"("sessionId", "createdAt");

-- CreateIndex
CREATE INDEX "DailyMetric_userId_date_idx" ON "DailyMetric"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "DailyMetric_userId_date_key" ON "DailyMetric"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "PracticeGoal_userId_date_key" ON "PracticeGoal"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "SavedDraft_sessionId_key" ON "SavedDraft"("sessionId");

-- AddForeignKey
ALTER TABLE "UserSettings" ADD CONSTRAINT "UserSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingProject" ADD CONSTRAINT "TrainingProject_languageId_fkey" FOREIGN KEY ("languageId") REFERENCES "Language"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingFile" ADD CONSTRAINT "TrainingFile_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "TrainingProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingFileTopic" ADD CONSTRAINT "TrainingFileTopic_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "TrainingFile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingFileTopic" ADD CONSTRAINT "TrainingFileTopic_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PracticeSession" ADD CONSTRAINT "PracticeSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PracticeSession" ADD CONSTRAINT "PracticeSession_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "TrainingProject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PracticeSession" ADD CONSTRAINT "PracticeSession_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "TrainingFile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileAttempt" ADD CONSTRAINT "FileAttempt_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "PracticeSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyMetric" ADD CONSTRAINT "DailyMetric_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAchievement" ADD CONSTRAINT "UserAchievement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAchievement" ADD CONSTRAINT "UserAchievement_achievementId_fkey" FOREIGN KEY ("achievementId") REFERENCES "Achievement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PracticeGoal" ADD CONSTRAINT "PracticeGoal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedDraft" ADD CONSTRAINT "SavedDraft_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "PracticeSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Repetition" ADD CONSTRAINT "Repetition_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Repetition" ADD CONSTRAINT "Repetition_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "TrainingFile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
