# BeyondChats MVP

AI-powered PDF learning platform: upload documents, chat with an AI grounded in their content, and auto‑generate adaptive quizzes to measure understanding.

## Quick Start

```bash
# Install deps
npm install

# Setup database (PostgreSQL with pgvector)
# Ensure DATABASE_URL in .env then:
npx prisma migrate dev

# Run dev
npm run dev
```

Visit: http://localhost:3000

## Features
- PDF Upload & Text Chunking
- Embedding + Vector Search (pgvector)
- Retrieval-Augmented AI Chat
- Quiz Generation (MCQ / SAQ / LAQ) with difficulty selection
- Quiz Attempts + Progress Analytics & Topic Strengths
- Responsive, mobile-first UI (Next.js App Router + Tailwind)
- Accessible components (focus rings, skip link, a11y labels)

## Architecture Overview
- **Next.js (App Router)**: API routes colocated with features under `app/api/*`
- **Database**: PostgreSQL + Prisma ORM + pgvector extension for semantic search
- **Embeddings & RAG**: `lib/embeddings.ts`, `lib/vector-search.ts`, `lib/rag.ts`
- **AI Adapter**: `lib/gemini.ts` (swappable for other providers)
- **UI Components**: Reusable primitives in `components/ui/`
- **PDF Rendering**: `pdfjs-dist` with incremental thumbnail generation & render cancellation

### Data Flow (Upload → Chat → Quiz)
1. Upload PDF → store + extract text → chunk → embed → persist vectors.
2. Chat request → vector similarity search → context assembly → LLM answer.
3. Quiz generation → gather relevant chunks → structured prompt → persist quiz & questions.

## Folder Structure (Selected)
```
app/              # Routes & API handlers
components/       # UI + feature components
lib/              # Service layer (prisma, rag, embeddings)
prisma/           # Schema & migrations
public/           # Static assets (pdf.worker.js, uploads/)
```

## Database & Migrations
- Enable pgvector (see `prisma/migrations/001_enable_pgvector.sql`).
- Run migrations with `npx prisma migrate dev`.
- Update the schema in `prisma/schema.prisma` for model changes.

## Environment Variables
Create `.env` based on `.env.example`:
```
DATABASE_URL=postgresql://user:pass@localhost:5432/beyondchats
AI_API_KEY=your-key-here
EMBEDDING_MODEL=text-embedding-3-small
VECTOR_DIM=1536
```

## Scripts
| Script | Purpose |
| ------ | ------- |
| `dev`  | Run development server |
| `build`| Production build |
| `start`| Start production server |
| `lint` | Lint codebase |

## RAG Details
- Chunk size & overlap (tune in ingestion code) to balance recall vs cost.
- Similarity search returns top-K (adjust in `vector-search.ts`).
- Future: add re-ranking + caching layer.

## Quiz Generation
- Parameterized counts (MCQ/SAQ/LAQ) and difficulty.
- Extend `generate-quiz` API for rubric scoring & rationales.

## Accessibility
- Skip link, focus-visible rings, semantic buttons.
- Live region updates for streaming chat tokens (assistive tech friendly).

## Performance Considerations
- PDF render task cancellation prevents unnecessary work.
- Thumbnails generated lazily (non-blocking UI).
- Chat message streaming simulation (future: real SSE / streaming).

## Security
- Validate MIME type and size on upload (recommend enforcing server-side hard limits).
- Keep AI keys server-side only.
- Planned: rate limiting middleware & auth.

## Testing (Planned)
- Unit tests (Vitest) for service layer.
- Integration tests for API routes.
- Playwright for critical user journeys.

## Roadmap
- Real streaming responses (SSE)
- Auth & multi-user isolation
- Answer citation highlighting & source ranking UI
- Explanations & rationales for quiz answers
- Seed & fixtures + test harness
- Observability (structured logs, metrics)

## Deployment
- Configure env vars on platform (e.g., Vercel).
- Run migrations before first request.
- Ensure `pdf.worker.js` served via `/public`.

## License
Add a suitable license (MIT / Apache-2.0 / Proprietary) before distribution.

---
Crafted with a focus on clarity, adaptability, and a strong foundation for future scaling.
