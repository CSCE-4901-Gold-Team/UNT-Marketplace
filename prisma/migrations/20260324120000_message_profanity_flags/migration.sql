-- CreateEnum
CREATE TYPE "MessageProfanityFlagStatus" AS ENUM ('PENDING', 'REVIEWED_NO_ACTION', 'ACTIONED');

-- CreateTable
CREATE TABLE "message_profanity_flag" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "originalBody" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "MessageProfanityFlagStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedAt" TIMESTAMP(3),
    "reviewedById" TEXT,

    CONSTRAINT "message_profanity_flag_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "message_profanity_flag_messageId_key" ON "message_profanity_flag"("messageId");

-- CreateIndex
CREATE INDEX "message_profanity_flag_status_idx" ON "message_profanity_flag"("status");

-- CreateIndex
CREATE INDEX "message_profanity_flag_senderId_idx" ON "message_profanity_flag"("senderId");

-- AddForeignKey
ALTER TABLE "message_profanity_flag" ADD CONSTRAINT "message_profanity_flag_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "message"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_profanity_flag" ADD CONSTRAINT "message_profanity_flag_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_profanity_flag" ADD CONSTRAINT "message_profanity_flag_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_profanity_flag" ADD CONSTRAINT "message_profanity_flag_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
