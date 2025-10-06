-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create HNSW index on the embedding column for fast vector similarity search
-- Using ivfflat index as it's more widely supported
CREATE INDEX CONCURRENTLY IF NOT EXISTS chunks_embedding_idx 
ON "Chunk" USING ivfflat (embedding vector_cosine_ops) 
WITH (lists = 100);

-- Alternative HNSW index (use this if your PostgreSQL version supports HNSW)
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS chunks_embedding_hnsw_idx 
-- ON "Chunk" USING hnsw (embedding vector_cosine_ops) 
-- WITH (m = 16, ef_construction = 64);