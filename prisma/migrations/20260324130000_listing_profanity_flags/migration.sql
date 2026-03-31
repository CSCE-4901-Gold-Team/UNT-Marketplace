-- CreateTable
CREATE TABLE "listing_profanity_flag" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "originalTitle" TEXT NOT NULL,
    "originalDescription" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "MessageProfanityFlagStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedAt" TIMESTAMP(3),
    "reviewedById" TEXT,

    CONSTRAINT "listing_profanity_flag_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "listing_profanity_flag_status_idx" ON "listing_profanity_flag"("status");

-- CreateIndex
CREATE INDEX "listing_profanity_flag_listingId_idx" ON "listing_profanity_flag"("listingId");

-- CreateIndex
CREATE INDEX "listing_profanity_flag_ownerId_idx" ON "listing_profanity_flag"("ownerId");

-- AddForeignKey
ALTER TABLE "listing_profanity_flag" ADD CONSTRAINT "listing_profanity_flag_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "public"."Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listing_profanity_flag" ADD CONSTRAINT "listing_profanity_flag_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listing_profanity_flag" ADD CONSTRAINT "listing_profanity_flag_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
