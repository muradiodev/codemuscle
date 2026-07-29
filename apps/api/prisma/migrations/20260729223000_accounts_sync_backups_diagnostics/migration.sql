-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'DISABLED', 'DELETION_PENDING', 'DELETED');

-- CreateEnum
CREATE TYPE "BackupType" AS ENUM ('AUTOMATIC', 'MANUAL', 'PRE_RESTORE', 'PRE_MIGRATION');

-- CreateEnum
CREATE TYPE "BackupStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'DELETED');

-- AlterTable
ALTER TABLE "UserSettings" ALTER COLUMN "synchronizedScrolling" SET DEFAULT false;

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "normalizedEmail" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "emailVerifiedAt" TIMESTAMP(3),
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastSignedInAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "profileId" TEXT NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuthSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "csrfTokenHash" TEXT NOT NULL,
    "deviceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "absoluteExpiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "ipHash" TEXT,
    "userAgent" TEXT,
    "rememberMe" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "AuthSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserDevice" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "deviceKey" TEXT NOT NULL,
    "displayName" TEXT,
    "platform" TEXT,
    "browser" TEXT,
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "trustedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "UserDevice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailVerificationToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),

    CONSTRAINT "EmailVerificationToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DraftDocument" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fileId" TEXT NOT NULL,
    "latestRevision" INTEGER NOT NULL DEFAULT 0,
    "activeDeviceId" TEXT,
    "activeSessionId" TEXT,
    "leaseExpiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DraftDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DraftRevision" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "revision" INTEGER NOT NULL,
    "basedOnRevision" INTEGER,
    "deviceId" TEXT,
    "sessionId" TEXT,
    "typedCode" TEXT NOT NULL,
    "contentHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DraftRevision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProfileRevision" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "snapshot" JSONB NOT NULL,
    "changedFields" JSONB NOT NULL,
    "deviceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProfileRevision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SettingsRevision" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "snapshot" JSONB NOT NULL,
    "changedFields" JSONB NOT NULL,
    "deviceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SettingsRevision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserBackup" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "BackupType" NOT NULL,
    "status" "BackupStatus" NOT NULL DEFAULT 'PENDING',
    "objectKey" TEXT,
    "schemaVersion" INTEGER NOT NULL,
    "applicationVersion" TEXT,
    "checksum" TEXT,
    "encryptedSize" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "restoredAt" TIMESTAMP(3),
    "failureReason" TEXT,
    "sourceUpdatedAt" TIMESTAMP(3),

    CONSTRAINT "UserBackup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SecurityEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "type" TEXT NOT NULL,
    "metadata" JSONB,
    "deviceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SecurityEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LegacyProgressClaim" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "legacyProfileId" TEXT NOT NULL,
    "backupId" TEXT,
    "claimedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "summary" JSONB NOT NULL,

    CONSTRAINT "LegacyProgressClaim_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiagnosticOccurrence" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "fileId" TEXT NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "code" TEXT,
    "category" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "startLine" INTEGER NOT NULL,
    "startColumn" INTEGER NOT NULL,
    "firstSeenAt" TIMESTAMP(3) NOT NULL,
    "lastSeenAt" TIMESTAMP(3) NOT NULL,
    "resolvedAt" TIMESTAMP(3),
    "recoveryTimeMs" INTEGER,
    "reappearanceCount" INTEGER NOT NULL DEFAULT 0,
    "transient" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "DiagnosticOccurrence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_normalizedEmail_key" ON "User"("normalizedEmail");

-- CreateIndex
CREATE UNIQUE INDEX "User_profileId_key" ON "User"("profileId");

-- CreateIndex
CREATE UNIQUE INDEX "AuthSession_tokenHash_key" ON "AuthSession"("tokenHash");

-- CreateIndex
CREATE INDEX "AuthSession_userId_revokedAt_idx" ON "AuthSession"("userId", "revokedAt");

-- CreateIndex
CREATE INDEX "AuthSession_expiresAt_idx" ON "AuthSession"("expiresAt");

-- CreateIndex
CREATE INDEX "UserDevice_userId_lastSeenAt_idx" ON "UserDevice"("userId", "lastSeenAt");

-- CreateIndex
CREATE UNIQUE INDEX "UserDevice_userId_deviceKey_key" ON "UserDevice"("userId", "deviceKey");

-- CreateIndex
CREATE UNIQUE INDEX "EmailVerificationToken_tokenHash_key" ON "EmailVerificationToken"("tokenHash");

-- CreateIndex
CREATE INDEX "EmailVerificationToken_userId_expiresAt_idx" ON "EmailVerificationToken"("userId", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_tokenHash_key" ON "PasswordResetToken"("tokenHash");

-- CreateIndex
CREATE INDEX "PasswordResetToken_userId_expiresAt_idx" ON "PasswordResetToken"("userId", "expiresAt");

-- CreateIndex
CREATE INDEX "DraftDocument_userId_updatedAt_idx" ON "DraftDocument"("userId", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "DraftDocument_userId_fileId_key" ON "DraftDocument"("userId", "fileId");

-- CreateIndex
CREATE INDEX "DraftRevision_documentId_createdAt_idx" ON "DraftRevision"("documentId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "DraftRevision_documentId_revision_key" ON "DraftRevision"("documentId", "revision");

-- CreateIndex
CREATE UNIQUE INDEX "ProfileRevision_userId_version_key" ON "ProfileRevision"("userId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "SettingsRevision_userId_version_key" ON "SettingsRevision"("userId", "version");

-- CreateIndex
CREATE INDEX "UserBackup_userId_createdAt_idx" ON "UserBackup"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "SecurityEvent_userId_createdAt_idx" ON "SecurityEvent"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "LegacyProgressClaim_legacyProfileId_key" ON "LegacyProgressClaim"("legacyProfileId");

-- CreateIndex
CREATE INDEX "DiagnosticOccurrence_userId_sessionId_idx" ON "DiagnosticOccurrence"("userId", "sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "DiagnosticOccurrence_sessionId_fingerprint_key" ON "DiagnosticOccurrence"("sessionId", "fingerprint");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "UserProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuthSession" ADD CONSTRAINT "AuthSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuthSession" ADD CONSTRAINT "AuthSession_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "UserDevice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserDevice" ADD CONSTRAINT "UserDevice_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailVerificationToken" ADD CONSTRAINT "EmailVerificationToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DraftDocument" ADD CONSTRAINT "DraftDocument_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DraftDocument" ADD CONSTRAINT "DraftDocument_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "TrainingFile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DraftRevision" ADD CONSTRAINT "DraftRevision_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "DraftDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DraftRevision" ADD CONSTRAINT "DraftRevision_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "PracticeSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfileRevision" ADD CONSTRAINT "ProfileRevision_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SettingsRevision" ADD CONSTRAINT "SettingsRevision_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserBackup" ADD CONSTRAINT "UserBackup_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecurityEvent" ADD CONSTRAINT "SecurityEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LegacyProgressClaim" ADD CONSTRAINT "LegacyProgressClaim_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiagnosticOccurrence" ADD CONSTRAINT "DiagnosticOccurrence_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiagnosticOccurrence" ADD CONSTRAINT "DiagnosticOccurrence_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "PracticeSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiagnosticOccurrence" ADD CONSTRAINT "DiagnosticOccurrence_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "TrainingFile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
