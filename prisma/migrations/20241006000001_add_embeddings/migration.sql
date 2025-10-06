-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector";

-- AlterTable
ALTER TABLE "Chunk" ADD COLUMN "embedding" vector(768);

-- CreateIndex
CREATE INDEX "chunks_embedding_idx" ON "Chunk" USING ivfflat ("embedding" vector_cosine_ops) WITH (lists = 100);