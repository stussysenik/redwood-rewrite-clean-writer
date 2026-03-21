-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "hashedPassword" TEXT NOT NULL,
    "salt" TEXT NOT NULL,
    "resetToken" TEXT,
    "resetTokenExpiresAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'Untitled',
    "content" TEXT NOT NULL DEFAULT '',
    "version" INTEGER NOT NULL DEFAULT 1,
    "checksum" TEXT,
    "wordCount" INTEGER NOT NULL DEFAULT 0,
    "charCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME,
    "lastSyncedAt" DATETIME,
    "clientUpdatedAt" DATETIME,
    CONSTRAINT "Document_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DocumentSnapshot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "documentId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "checksum" TEXT NOT NULL,
    "wordCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DocumentSnapshot_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UserSettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "maxWidth" INTEGER NOT NULL DEFAULT 800,
    "activeThemeId" TEXT NOT NULL DEFAULT 'classic',
    "fontId" TEXT NOT NULL DEFAULT 'courier-prime',
    "fontSizeOffset" INTEGER NOT NULL DEFAULT 0,
    "lineHeight" REAL NOT NULL DEFAULT 1.6,
    "letterSpacing" REAL NOT NULL DEFAULT 0,
    "paragraphSpacing" REAL NOT NULL DEFAULT 0.5,
    "highlightConfig" TEXT NOT NULL DEFAULT '{"nouns":true,"pronouns":true,"verbs":true,"adjectives":true,"adverbs":true,"prepositions":true,"conjunctions":true,"articles":true,"interjections":true,"urls":true,"numbers":true,"hashtags":true}',
    "viewMode" TEXT NOT NULL DEFAULT 'write',
    "focusMode" TEXT NOT NULL DEFAULT 'none',
    "soloMode" TEXT,
    "syllableAnnotations" BOOLEAN NOT NULL DEFAULT true,
    "rhymeHighlightRadius" INTEGER NOT NULL DEFAULT 4,
    "rhymeBoldEnabled" BOOLEAN NOT NULL DEFAULT true,
    "utf8DisplayEnabled" BOOLEAN NOT NULL DEFAULT false,
    "seenSyntaxPanel" BOOLEAN NOT NULL DEFAULT false,
    "mobileWelcomeSeen" BOOLEAN NOT NULL DEFAULT false,
    "breakdownCollapsed" BOOLEAN NOT NULL DEFAULT false,
    "songRhymesCollapsed" BOOLEAN NOT NULL DEFAULT false,
    "songLinesCollapsed" BOOLEAN NOT NULL DEFAULT true,
    "wordTypeOrder" TEXT,
    "themeOverrides" TEXT NOT NULL DEFAULT '{}',
    "themeNames" TEXT NOT NULL DEFAULT '{}',
    "lastSyncedAt" DATETIME,
    "clientUpdatedAt" DATETIME,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "UserSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CustomTheme" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "textColor" TEXT NOT NULL,
    "backgroundColor" TEXT NOT NULL,
    "accentColor" TEXT NOT NULL,
    "cursorColor" TEXT NOT NULL,
    "strikethroughColor" TEXT NOT NULL,
    "selectionColor" TEXT NOT NULL,
    "highlightColors" TEXT NOT NULL,
    "rhymeColors" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME,
    "lastSyncedAt" DATETIME,
    "clientUpdatedAt" DATETIME,
    CONSTRAINT "CustomTheme_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ThemeConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "hiddenThemeIds" TEXT NOT NULL DEFAULT '[]',
    "themeOrder" TEXT NOT NULL DEFAULT '[]',
    "hasCustomizedVisibility" BOOLEAN NOT NULL DEFAULT false,
    "lastSyncedAt" DATETIME,
    "clientUpdatedAt" DATETIME,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ThemeConfig_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Document_userId_deletedAt_idx" ON "Document"("userId", "deletedAt");

-- CreateIndex
CREATE INDEX "Document_userId_updatedAt_idx" ON "Document"("userId", "updatedAt");

-- CreateIndex
CREATE INDEX "DocumentSnapshot_documentId_version_idx" ON "DocumentSnapshot"("documentId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "UserSettings_userId_key" ON "UserSettings"("userId");

-- CreateIndex
CREATE INDEX "CustomTheme_userId_deletedAt_idx" ON "CustomTheme"("userId", "deletedAt");

-- CreateIndex
CREATE INDEX "CustomTheme_userId_sortOrder_idx" ON "CustomTheme"("userId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "ThemeConfig_userId_key" ON "ThemeConfig"("userId");
