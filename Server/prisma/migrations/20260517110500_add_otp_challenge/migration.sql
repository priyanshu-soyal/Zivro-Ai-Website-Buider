-- CreateTable
CREATE TABLE "otp_challenge" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "resendCount" INTEGER NOT NULL DEFAULT 0,
    "lastSentAt" TIMESTAMP(3),
    "consumedAt" TIMESTAMP(3),
    "sessionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "otp_challenge_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "otp_challenge_userId_idx" ON "otp_challenge"("userId");

-- CreateIndex
CREATE INDEX "otp_challenge_email_idx" ON "otp_challenge"("email");

-- CreateIndex
CREATE INDEX "otp_challenge_sessionId_idx" ON "otp_challenge"("sessionId");

-- AddForeignKey
ALTER TABLE "otp_challenge" ADD CONSTRAINT "otp_challenge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
