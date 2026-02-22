-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "WantListItem" (
    "id" TEXT NOT NULL,
    "volumeName" TEXT NOT NULL,
    "issueNumber" TEXT NOT NULL,
    "comicVineIssueId" INTEGER,
    "targetMaxPrice" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastCheckedAt" TIMESTAMP(3),

    CONSTRAINT "WantListItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WantListMatch" (
    "id" TEXT NOT NULL,
    "wantListItemId" TEXT NOT NULL,
    "ebayItemId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "totalPrice" DOUBLE PRECISION NOT NULL,
    "imageUrl" TEXT,
    "itemUrl" TEXT NOT NULL,
    "dealScore" DOUBLE PRECISION,
    "percentBelow" DOUBLE PRECISION,
    "foundAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isNew" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "WantListMatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CachedComicVineData" (
    "id" TEXT NOT NULL,
    "cacheKey" TEXT NOT NULL,
    "dataType" TEXT NOT NULL,
    "jsonData" TEXT NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CachedComicVineData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PriceSnapshot" (
    "id" TEXT NOT NULL,
    "volumeName" TEXT NOT NULL,
    "issueNumber" TEXT NOT NULL,
    "grade" DOUBLE PRECISION,
    "averagePrice" DOUBLE PRECISION NOT NULL,
    "medianPrice" DOUBLE PRECISION NOT NULL,
    "dataPoints" INTEGER NOT NULL,
    "snapshotDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PriceSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WantListItem_volumeName_issueNumber_idx" ON "WantListItem"("volumeName", "issueNumber");

-- CreateIndex
CREATE INDEX "WantListMatch_wantListItemId_idx" ON "WantListMatch"("wantListItemId");

-- CreateIndex
CREATE UNIQUE INDEX "WantListMatch_wantListItemId_ebayItemId_key" ON "WantListMatch"("wantListItemId", "ebayItemId");

-- CreateIndex
CREATE UNIQUE INDEX "CachedComicVineData_cacheKey_key" ON "CachedComicVineData"("cacheKey");

-- CreateIndex
CREATE INDEX "CachedComicVineData_cacheKey_idx" ON "CachedComicVineData"("cacheKey");

-- CreateIndex
CREATE INDEX "CachedComicVineData_expiresAt_idx" ON "CachedComicVineData"("expiresAt");

-- CreateIndex
CREATE INDEX "PriceSnapshot_volumeName_issueNumber_grade_idx" ON "PriceSnapshot"("volumeName", "issueNumber", "grade");

-- CreateIndex
CREATE INDEX "PriceSnapshot_snapshotDate_idx" ON "PriceSnapshot"("snapshotDate");

-- AddForeignKey
ALTER TABLE "WantListMatch" ADD CONSTRAINT "WantListMatch_wantListItemId_fkey" FOREIGN KEY ("wantListItemId") REFERENCES "WantListItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
