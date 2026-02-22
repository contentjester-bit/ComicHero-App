-- CreateTable
CREATE TABLE "CollectionItem" (
    "id" TEXT NOT NULL,
    "comicVineIssueId" INTEGER NOT NULL,
    "comicVineVolumeId" INTEGER NOT NULL,
    "volumeName" TEXT NOT NULL,
    "issueNumber" TEXT NOT NULL,
    "name" TEXT,
    "imageUrl" TEXT,
    "coverDate" TEXT,
    "condition" TEXT,
    "notes" TEXT,
    "pricePaid" DOUBLE PRECISION,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CollectionItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CollectionItem_comicVineIssueId_key" ON "CollectionItem"("comicVineIssueId");

-- CreateIndex
CREATE INDEX "CollectionItem_comicVineVolumeId_idx" ON "CollectionItem"("comicVineVolumeId");
