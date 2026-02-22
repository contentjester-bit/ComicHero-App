-- CreateTable
CREATE TABLE "CuratedBundle" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "theme" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CuratedBundle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CuratedBundleItem" (
    "id" TEXT NOT NULL,
    "bundleId" TEXT NOT NULL,
    "volumeName" TEXT NOT NULL,
    "issueNumber" TEXT NOT NULL,
    "comicVineIssueId" INTEGER,
    "imageUrl" TEXT,
    "reason" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CuratedBundleItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CuratedBundle_status_idx" ON "CuratedBundle"("status");

-- CreateIndex
CREATE INDEX "CuratedBundleItem_bundleId_idx" ON "CuratedBundleItem"("bundleId");

-- CreateIndex
CREATE UNIQUE INDEX "CuratedBundleItem_bundleId_volumeName_issueNumber_key" ON "CuratedBundleItem"("bundleId", "volumeName", "issueNumber");

-- AddForeignKey
ALTER TABLE "CuratedBundleItem" ADD CONSTRAINT "CuratedBundleItem_bundleId_fkey" FOREIGN KEY ("bundleId") REFERENCES "CuratedBundle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
