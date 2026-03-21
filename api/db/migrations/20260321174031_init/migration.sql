-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "hashedPassword" TEXT NOT NULL,
    "salt" TEXT NOT NULL,
    "resetToken" TEXT,
    "resetTokenExpiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'Untitled',
    "content" TEXT NOT NULL DEFAULT '',
    "version" INTEGER NOT NULL DEFAULT 1,
    "checksum" TEXT,
    "writingMode" TEXT NOT NULL DEFAULT 'typewriter',
    "wordCount" INTEGER NOT NULL DEFAULT 0,
    "charCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "lastSyncedAt" TIMESTAMP(3),
    "clientUpdatedAt" TIMESTAMP(3),

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentSnapshot" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "checksum" TEXT NOT NULL,
    "wordCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSettings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "maxWidth" INTEGER NOT NULL DEFAULT 800,
    "activeThemeId" TEXT NOT NULL DEFAULT 'classic',
    "fontId" TEXT NOT NULL DEFAULT 'courier-prime',
    "fontSizeOffset" INTEGER NOT NULL DEFAULT 0,
    "lineHeight" DOUBLE PRECISION NOT NULL DEFAULT 1.6,
    "letterSpacing" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "paragraphSpacing" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "highlightConfig" JSONB NOT NULL DEFAULT '{"nouns":true,"pronouns":true,"verbs":true,"adjectives":true,"adverbs":true,"prepositions":true,"conjunctions":true,"articles":true,"interjections":true,"urls":true,"numbers":true,"hashtags":true}',
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
    "wordTypeOrder" JSONB,
    "themeOverrides" JSONB NOT NULL DEFAULT '{}',
    "themeNames" JSONB NOT NULL DEFAULT '{}',
    "lastSyncedAt" TIMESTAMP(3),
    "clientUpdatedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomTheme" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "textColor" TEXT NOT NULL,
    "backgroundColor" TEXT NOT NULL,
    "accentColor" TEXT NOT NULL,
    "cursorColor" TEXT NOT NULL,
    "strikethroughColor" TEXT NOT NULL,
    "selectionColor" TEXT NOT NULL,
    "highlightColors" JSONB NOT NULL,
    "rhymeColors" JSONB,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "lastSyncedAt" TIMESTAMP(3),
    "clientUpdatedAt" TIMESTAMP(3),

    CONSTRAINT "CustomTheme_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ThemeConfig" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "hiddenThemeIds" JSONB NOT NULL DEFAULT '[]',
    "themeOrder" JSONB NOT NULL DEFAULT '[]',
    "hasCustomizedVisibility" BOOLEAN NOT NULL DEFAULT false,
    "lastSyncedAt" TIMESTAMP(3),
    "clientUpdatedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ThemeConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Chapter" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'Untitled Chapter',
    "content" TEXT NOT NULL DEFAULT '',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "wordCount" INTEGER NOT NULL DEFAULT 0,
    "charCount" INTEGER NOT NULL DEFAULT 0,
    "partNumber" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Chapter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JournalEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "entryDate" TIMESTAMP(3) NOT NULL,
    "content" TEXT NOT NULL DEFAULT '',
    "wordCount" INTEGER NOT NULL DEFAULT 0,
    "mood" TEXT,
    "tags" JSONB NOT NULL DEFAULT '[]',
    "prompt" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "JournalEntry_pkey" PRIMARY KEY ("id")
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

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentSnapshot" ADD CONSTRAINT "DocumentSnapshot_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSettings" ADD CONSTRAINT "UserSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomTheme" ADD CONSTRAINT "CustomTheme_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ThemeConfig" ADD CONSTRAINT "ThemeConfig_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chapter" ADD CONSTRAINT "Chapter_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JournalEntry" ADD CONSTRAINT "JournalEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
