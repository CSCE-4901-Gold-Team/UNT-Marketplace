-- CreateTable
CREATE TABLE "saved_query" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "searchTerm" TEXT,
    "minPrice" DECIMAL(10,2),
    "maxPrice" DECIMAL(10,2),
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastEmailSentAt" TIMESTAMP(3),

    CONSTRAINT "saved_query_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "category_on_saved_query" (
    "id" SERIAL NOT NULL,
    "savedQueryId" TEXT NOT NULL,
    "categoryId" INTEGER NOT NULL,

    CONSTRAINT "category_on_saved_query_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "query_notification_log" (
    "id" TEXT NOT NULL,
    "queryId" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "listingCount" INTEGER NOT NULL,
    "recipientEmail" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'sent',

    CONSTRAINT "query_notification_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "saved_query_userId_idx" ON "saved_query"("userId");

-- CreateIndex
CREATE INDEX "saved_query_enabled_idx" ON "saved_query"("enabled");

-- CreateIndex
CREATE UNIQUE INDEX "category_on_saved_query_savedQueryId_categoryId_key" ON "category_on_saved_query"("savedQueryId", "categoryId");

-- CreateIndex
CREATE INDEX "query_notification_log_queryId_idx" ON "query_notification_log"("queryId");

-- CreateIndex
CREATE INDEX "query_notification_log_sentAt_idx" ON "query_notification_log"("sentAt");

-- AddForeignKey
ALTER TABLE "saved_query" ADD CONSTRAINT "saved_query_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "category_on_saved_query" ADD CONSTRAINT "category_on_saved_query_savedQueryId_fkey" FOREIGN KEY ("savedQueryId") REFERENCES "saved_query"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "category_on_saved_query" ADD CONSTRAINT "category_on_saved_query_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;
