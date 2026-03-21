-- CreateTable
CREATE TABLE "Chapter" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "documentId" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'Untitled Chapter',
    "content" TEXT NOT NULL DEFAULT '',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "wordCount" INTEGER NOT NULL DEFAULT 0,
    "charCount" INTEGER NOT NULL DEFAULT 0,
    "partNumber" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME,
    CONSTRAINT "Chapter_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "JournalEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "entryDate" DATETIME NOT NULL,
    "content" TEXT NOT NULL DEFAULT '',
    "wordCount" INTEGER NOT NULL DEFAULT 0,
    "mood" TEXT,
    "tags" TEXT NOT NULL DEFAULT '[]',
    "prompt" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME,
    CONSTRAINT "JournalEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Document" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'Untitled',
    "content" TEXT NOT NULL DEFAULT '',
    "version" INTEGER NOT NULL DEFAULT 1,
    "checksum" TEXT,
    "writingMode" TEXT NOT NULL DEFAULT 'typewriter',
    "wordCount" INTEGER NOT NULL DEFAULT 0,
    "charCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME,
    "lastSyncedAt" DATETIME,
    "clientUpdatedAt" DATETIME,
    CONSTRAINT "Document_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Document" ("charCount", "checksum", "clientUpdatedAt", "content", "createdAt", "deletedAt", "id", "lastSyncedAt", "title", "updatedAt", "userId", "version", "wordCount") SELECT "charCount", "checksum", "clientUpdatedAt", "content", "createdAt", "deletedAt", "id", "lastSyncedAt", "title", "updatedAt", "userId", "version", "wordCount" FROM "Document";
DROP TABLE "Document";
ALTER TABLE "new_Document" RENAME TO "Document";
CREATE INDEX "Document_userId_deletedAt_idx" ON "Document"("userId", "deletedAt");
CREATE INDEX "Document_userId_updatedAt_idx" ON "Document"("userId", "updatedAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "Chapter_documentId_sortOrder_idx" ON "Chapter"("documentId", "sortOrder");

-- CreateIndex
CREATE INDEX "Chapter_documentId_deletedAt_idx" ON "Chapter"("documentId", "deletedAt");

-- CreateIndex
CREATE INDEX "JournalEntry_userId_deletedAt_idx" ON "JournalEntry"("userId", "deletedAt");

-- CreateIndex
CREATE INDEX "JournalEntry_userId_entryDate_idx" ON "JournalEntry"("userId", "entryDate");

-- CreateIndex
CREATE UNIQUE INDEX "JournalEntry_userId_entryDate_key" ON "JournalEntry"("userId", "entryDate");
