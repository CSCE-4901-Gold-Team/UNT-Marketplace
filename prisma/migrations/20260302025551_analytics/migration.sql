-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('LISTING_IMPRESSION', 'LISTING_VIEW', 'CONTACT_SELLER', 'SAVE_LISTING', 'SHARE_LISTING');

-- DropForeignKey
ALTER TABLE "report" DROP CONSTRAINT "report_reporterId_fkey";

-- CreateTable
CREATE TABLE "ListingEvent" (
    "listingId" TEXT NOT NULL,
    "userId" TEXT,
    "sessionId" TEXT NOT NULL,
    "eventType" "EventType" NOT NULL,
    "createdAt" DATE NOT NULL DEFAULT CURRENT_DATE
);

-- CreateIndex
CREATE INDEX "ListingEvent_listingId_idx" ON "ListingEvent"("listingId");

-- CreateIndex
CREATE INDEX "ListingEvent_userId_idx" ON "ListingEvent"("userId");

-- CreateIndex
CREATE INDEX "ListingEvent_createdAt_idx" ON "ListingEvent"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ListingEvent_sessionId_listingId_eventType_createdAt_key" ON "ListingEvent"("sessionId", "listingId", "eventType", "createdAt");

-- AddForeignKey
ALTER TABLE "report" ADD CONSTRAINT "report_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingEvent" ADD CONSTRAINT "ListingEvent_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingEvent" ADD CONSTRAINT "ListingEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
