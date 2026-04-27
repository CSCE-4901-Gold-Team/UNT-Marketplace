-- CreateEnum
CREATE TYPE "ProfanityListType" AS ENUM ('WHITELIST', 'BLACKLIST');

-- CreateTable
CREATE TABLE "profanity_moderation_term" (
    "id" TEXT NOT NULL,
    "listType" "ProfanityListType" NOT NULL,
    "term" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT,

    CONSTRAINT "profanity_moderation_term_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "profanity_moderation_term_listType_term_key" ON "profanity_moderation_term"("listType", "term");

-- CreateIndex
CREATE INDEX "profanity_moderation_term_listType_idx" ON "profanity_moderation_term"("listType");

-- AddForeignKey
ALTER TABLE "profanity_moderation_term" ADD CONSTRAINT "profanity_moderation_term_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
