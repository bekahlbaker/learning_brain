-- CreateTable
CREATE TABLE "learning_events" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sessionId" TEXT,
    "kind" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "clientTimestamp" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "learning_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "learning_events_eventId_key" ON "learning_events"("eventId");

-- CreateIndex
CREATE INDEX "learning_events_userId_idx" ON "learning_events"("userId");

-- CreateIndex
CREATE INDEX "learning_events_sessionId_idx" ON "learning_events"("sessionId");

-- CreateIndex
CREATE INDEX "learning_events_createdAt_idx" ON "learning_events"("createdAt");
