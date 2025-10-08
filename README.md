<div align="center">

# 🚀 BeyondChats MVP

### Next-Generation AI-Powered Document Intelligence Platform

[![Next.js](https://img.shields.io/badge/Next.js-15.5.4-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16+-336791?style=for-the-badge&logo=postgresql)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6.16-2D3748?style=for-the-badge&logo=prisma)](https://www.prisma.io/)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

**Transform the way you learn from documents with AI-powered chat, intelligent video recommendations, and adaptive assessments.**

[Features](#-key-features) • [Quick Start](#-quick-start) • [Architecture](#-architecture) • [Documentation](#-documentation) • [Contributing](#-contributing)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Technology Stack](#-technology-stack)
- [Architecture](#-architecture)
- [Quick Start](#-quick-start)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Usage](#-usage)
- [API Documentation](#-api-documentation)
- [Development](#-development)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Security](#-security)
- [Performance](#-performance)
- [Contributing](#-contributing)
- [Roadmap](#-roadmap)
- [License](#-license)

---

## 🎯 Overview

**BeyondChats MVP** is an enterprise-grade, AI-powered document intelligence platform that revolutionizes how users interact with and learn from PDF documents. Built on cutting-edge technologies including Retrieval-Augmented Generation (RAG), vector databases, and large language models, the platform provides an intuitive interface for document analysis, intelligent conversation, and knowledge assessment.

### 🎓 Use Cases

- **Educational Institutions**: Interactive learning from textbooks and research papers
- **Corporate Training**: Employee onboarding and knowledge management
- **Research & Development**: Document analysis and information extraction
- **Professional Development**: Self-paced learning with assessment tracking

---

## ✨ Key Features

### 📄 Intelligent Document Management
- **Multi-Format Support**: Upload and process PDF documents with automatic text extraction
- **Smart Chunking**: Intelligent document segmentation for optimal context retrieval
- **Vector Embeddings**: Semantic understanding using state-of-the-art embedding models
- **Persistent Storage**: Efficient document storage with PostgreSQL and pgvector

### 💬 AI-Powered Conversational Interface
- **Retrieval-Augmented Generation (RAG)**: Context-aware responses grounded in document content
- **Multi-Source Chat**: Query across multiple documents simultaneously
- **Source Attribution**: Direct references to relevant document sections
- **Real-Time Interaction**: Responsive chat interface with streaming support (planned)

### 🎥 YouTube Video Recommendations ✨ **NEW**
- **AI-Curated Content**: Gemini-powered search query optimization
- **Educational Focus**: Filtered content from verified educational sources
- **Context-Aware**: Recommendations based on current document topics
- **Rich Metadata**: Video duration, channel info, and descriptions
- **Seamless Integration**: Tabbed interface within the document reader

### 📝 Adaptive Quiz Generation
- **Multiple Question Types**: MCQ, Short Answer Questions (SAQ), and Long Answer Questions (LAQ)
- **Difficulty Customization**: Adjustable complexity based on learning objectives
- **Content-Specific**: Questions generated from actual document content
- **Automatic Grading**: Instant feedback with detailed explanations

### 📊 Advanced Analytics & Progress Tracking
- **Performance Metrics**: Comprehensive quiz attempt history and scores
- **Topic Strength Analysis**: Identify knowledge gaps and strong areas
- **Visual Dashboards**: Interactive charts and progress visualization
- **Historical Trends**: Track learning progress over time

### 🎨 Modern User Experience
- **Responsive Design**: Mobile-first approach with seamless desktop experience
- **Accessibility**: WCAG 2.1 Level AA compliant with keyboard navigation
- **Dark Mode**: Eye-friendly interface for extended study sessions (planned)
- **Intuitive Navigation**: Streamlined workflows for optimal productivity

---

## 🛠 Technology Stack

### Frontend
- **Framework**: Next.js 15.5.4 (App Router)
- **Language**: TypeScript 5.0
- **Styling**: Tailwind CSS 4.1
- **UI Components**: Custom component library with Radix UI primitives
- **PDF Rendering**: PDF.js (pdfjs-dist 5.4)
- **Charts**: Recharts 3.2 for analytics visualization

### Backend
- **Runtime**: Node.js 20+
- **API**: Next.js API Routes (RESTful)
- **ORM**: Prisma 6.16
- **Database**: PostgreSQL 16+ with pgvector extension
- **Vector Search**: pgvector 0.2 for semantic similarity

### AI & Machine Learning
- **LLM Provider**: Google Gemini (adaptable architecture)
- **Embeddings**: Text-embedding-004 (configurable)
- **Vector Dimensions**: 1536 (tunable)
- **RAG Framework**: Custom implementation with LangChain integration

### External APIs
- **YouTube Data API v3**: Video recommendations
- **Gemini AI**: Content generation and query optimization

### Development Tools
- **Package Manager**: npm
- **Build Tool**: Turbopack (Next.js native)
- **Linting**: ESLint 9
- **Type Checking**: TypeScript strict mode
- **Version Control**: Git

---

## 🏗 Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Client Layer (Next.js)                      │
│  ┌──────────────┬──────────────┬──────────────┬──────────────┐ │
│  │   Upload UI  │  Chat UI     │  Quiz UI     │  Videos UI   │ │
│  └──────────────┴──────────────┴──────────────┴──────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    API Layer (Next.js Routes)                   │
│  ┌──────────┬──────────┬──────────┬──────────┬──────────────┐  │
│  │  /upload │  /chat   │  /quiz   │  /pdfs   │ /recommend-  │  │
│  │          │          │          │          │   videos     │  │
│  └──────────┴──────────┴──────────┴──────────┴──────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Service Layer (lib/)                         │
│  ┌────────────┬────────────┬────────────┬────────────┐         │
│  │ embeddings │ rag        │ gemini     │ vector-    │         │
│  │            │            │            │ search     │         │
│  └────────────┴────────────┴────────────┴────────────┘         │
└─────────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    ▼                   ▼
┌──────────────────────────┐  ┌──────────────────────────┐
│  PostgreSQL + pgvector   │  │  External APIs           │
│  - Documents             │  │  - Gemini AI             │
│  - Chunks                │  │  - YouTube Data API      │
│  - Embeddings (vector)   │  │                          │
│  - Quizzes               │  │                          │
│  - User Progress         │  │                          │
└──────────────────────────┘  └──────────────────────────┘
```

### Data Flow

#### Document Upload & Processing
```
User Upload → Validate → Extract Text → Chunk Content 
  → Generate Embeddings → Store in PostgreSQL → Index Vectors
```

#### RAG Chat Flow
```
User Query → Generate Query Embedding → Vector Similarity Search 
  → Retrieve Top-K Chunks → Assemble Context → LLM Generation 
  → Stream Response → Display with Sources
```

#### Quiz Generation Flow
```
Select Topic → Gather Relevant Chunks → Structured Prompt 
  → LLM Generation → Parse Questions → Persist to Database 
  → Present to User
```

#### Video Recommendation Flow
```
PDF Topic/User Query → Gemini Query Optimization 
  → YouTube API Search → Fetch Metadata & Durations 
  → Filter & Rank → Display Results
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js**: 20.x or higher
- **PostgreSQL**: 16.x or higher with pgvector extension
- **npm**: 10.x or higher
- **Git**: Latest version

### Installation

```bash
# Clone the repository
git clone https://github.com/Shubhkesarwani02/beyondchats-mvp.git
cd beyondchats-mvp

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your configuration

# Initialize database
npx prisma generate
npx prisma migrate dev

# Start development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to access the application.

---

## ⚙️ Configuration

### Environment Variables

Create a `.env.local` file in the project root:

```bash
# Database Configuration
DATABASE_URL="postgresql://user:password@localhost:5432/beyondchats?schema=public"

# AI Configuration
GEMINI_API_KEY="your_gemini_api_key_here"

# YouTube API Configuration
YOUTUBE_API_KEY="your_youtube_api_key_here"

# Embedding Configuration (Optional)
EMBEDDING_MODEL="text-embedding-004"
VECTOR_DIM=1536

# Application Configuration
NODE_ENV="development"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Next.js Configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your_secret_key_here"
```

### Database Setup

#### 1. Install PostgreSQL with pgvector

**On Ubuntu/Debian:**
```bash
sudo apt-get install postgresql-16 postgresql-16-pgvector
```

**On macOS:**
```bash
brew install postgresql@16
brew install pgvector
```

**On Windows:**
- Download PostgreSQL from [official website](https://www.postgresql.org/download/windows/)
- Install pgvector extension manually

#### 2. Enable pgvector Extension

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

#### 3. Run Migrations

```bash
npx prisma migrate dev --name init
```

### API Keys Setup

#### Gemini AI API Key
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Add to `.env.local`

#### YouTube Data API Key
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable YouTube Data API v3
4. Create credentials (API Key)
5. Add to `.env.local`

---

## 📖 Usage

### Document Upload

1. Navigate to the upload page
2. Select a PDF file (max 10MB recommended)
3. Wait for processing and indexing
4. Document will appear in your library

### AI Chat

1. Open a document from your library
2. Click the "Chat" tab in the sidebar
3. Type your question about the document
4. Receive AI-generated responses with source citations
5. Click source references to jump to relevant pages

### Video Recommendations ✨

1. Open a document in the reader
2. Click the "Videos" tab
3. Click "Get Videos for [Document Title]" for automatic recommendations
4. Or enter a custom topic in the search box
5. Browse educational videos with metadata
6. Click any video to open in YouTube

### Quiz Generation

1. Navigate to the Quiz section
2. Select a document
3. Choose question types and difficulty
4. Click "Generate Quiz"
5. Complete the quiz and submit for instant feedback

### Analytics Dashboard

1. Access the Dashboard from the main menu
2. View overall performance metrics
3. Analyze topic strengths and weaknesses
4. Track progress over time with interactive charts

---

## 🔌 API Documentation

### Core Endpoints

#### Document Management

**Upload Document**
```http
POST /api/upload
Content-Type: multipart/form-data

Response: {
  "success": true,
  "pdf": {
    "id": "pdf_id",
    "title": "document.pdf",
    "url": "/uploads/...",
    "createdAt": "2025-10-08T..."
  }
}
```

**List Documents**
```http
GET /api/pdfs

Response: {
  "success": true,
  "pdfs": [
    {
      "id": "pdf_id",
      "title": "document.pdf",
      "hasChunks": true,
      "chunksCount": 42
    }
  ]
}
```

#### Chat

**Send Chat Message**
```http
POST /api/chat
Content-Type: application/json

{
  "message": "Explain quantum mechanics",
  "pdfId": "pdf_id"
}

Response: {
  "answer": "Quantum mechanics is...",
  "sources": [
    {
      "pageNum": 5,
      "content": "...",
      "similarity": 0.92
    }
  ]
}
```

#### Video Recommendations

**Get Video Recommendations**
```http
POST /api/recommend-videos
Content-Type: application/json

{
  "topic": "Machine Learning",
  "pdfTitle": "AI Textbook",
  "useGemini": true
}

Response: {
  "success": true,
  "videos": [
    {
      "id": { "videoId": "..." },
      "snippet": {
        "title": "...",
        "channelTitle": "...",
        "thumbnails": { ... }
      },
      "duration": "12:45"
    }
  ],
  "query": "optimized search query",
  "count": 6
}
```

#### Quiz Generation

**Generate Quiz**
```http
POST /api/generate-quiz
Content-Type: application/json

{
  "pdfId": "pdf_id",
  "title": "Chapter 1 Quiz",
  "difficulty": "medium",
  "mcqCount": 5,
  "saqCount": 3,
  "laqCount": 2
}

Response: {
  "success": true,
  "quiz": {
    "id": "quiz_id",
    "title": "Chapter 1 Quiz",
    "questions": [ ... ]
  }
}
```

For complete API documentation, see [API_DOCUMENTATION.md](./docs/API_DOCUMENTATION.md).

---

## 👨‍💻 Development

### Project Structure

```
beyondchats-mvp/
├── app/                      # Next.js App Router
│   ├── api/                  # API routes
│   │   ├── chat/            # Chat endpoints
│   │   ├── upload/          # Upload handlers
│   │   ├── quiz/            # Quiz management
│   │   └── recommend-videos/ # Video recommendations
│   ├── chat/                # Chat page
│   ├── dashboard/           # Analytics dashboard
│   ├── reader/              # PDF reader
│   └── quiz/                # Quiz interface
├── components/              # React components
│   ├── ui/                 # Reusable UI primitives
│   ├── ChatPanel.tsx       # Chat interface
│   ├── PdfViewer.tsx       # PDF rendering
│   ├── VideoRecommendations.tsx # Video panel
│   └── ...
├── lib/                     # Core services
│   ├── prisma.ts           # Database client
│   ├── gemini.ts           # AI integration
│   ├── embeddings.ts       # Embedding generation
│   ├── rag.ts              # RAG implementation
│   └── vector-search.ts    # Similarity search
├── prisma/                  # Database schema & migrations
│   ├── schema.prisma       # Data models
│   └── migrations/         # Migration files
├── public/                  # Static assets
│   ├── uploads/            # Uploaded documents
│   └── pdf.worker.js       # PDF.js worker
└── docs/                    # Documentation
```

### Available Scripts

```bash
# Development
npm run dev              # Start development server with Turbopack
npm run build           # Create production build
npm run start           # Start production server

# Code Quality
npm run lint            # Run ESLint
npm run type-check      # Run TypeScript compiler (add script)

# Database
npx prisma generate     # Generate Prisma client
npx prisma migrate dev  # Run migrations in development
npx prisma studio       # Open Prisma Studio GUI
npx prisma db push      # Push schema changes (development only)

# Utilities
npx prisma format       # Format schema file
npx prisma validate     # Validate schema
```

### Code Style & Conventions

- **TypeScript**: Strict mode enabled
- **Formatting**: Consistent indentation (2 spaces)
- **Naming**: camelCase for variables, PascalCase for components
- **Imports**: Absolute imports using `@/` prefix
- **Comments**: JSDoc for functions, inline for complex logic

---

## 🧪 Testing

### Testing Strategy

```bash
# Unit Tests (Planned)
npm run test

# Integration Tests (Planned)
npm run test:integration

# E2E Tests (Planned)
npm run test:e2e

# Coverage Report (Planned)
npm run test:coverage
```

### Test Coverage Goals
- **Unit Tests**: Service layer (>80% coverage)
- **Integration Tests**: API routes (>70% coverage)
- **E2E Tests**: Critical user journeys (100% coverage)

---

## 🚢 Deployment

### Vercel Deployment (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Production deployment
vercel --prod
```

### Environment Variables on Vercel
1. Go to Project Settings → Environment Variables
2. Add all variables from `.env.local`
3. Redeploy for changes to take effect

### Database Considerations
- Use managed PostgreSQL (e.g., Neon, Supabase, AWS RDS)
- Ensure pgvector extension is enabled
- Run migrations before first deployment
- Set up connection pooling for production

### Pre-Deployment Checklist
- [ ] All environment variables configured
- [ ] Database migrations run
- [ ] API keys validated
- [ ] Build succeeds locally
- [ ] Static assets accessible
- [ ] CORS configured (if needed)
- [ ] Rate limiting enabled
- [ ] Error monitoring set up

---

## 🔒 Security

### Security Best Practices

#### Authentication & Authorization (Planned)
- JWT-based authentication
- Role-based access control (RBAC)
- Session management with secure cookies

#### Data Protection
- API keys stored server-side only
- Environment variables never committed
- Input validation on all endpoints
- SQL injection protection via Prisma ORM

#### File Upload Security
- MIME type validation
- File size limits enforced
- Malware scanning (recommended for production)
- Isolated file storage

#### API Security
- Rate limiting per endpoint
- CORS configuration
- Request validation
- Error message sanitization

### Security Headers

```typescript
// next.config.ts
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  }
];
```

---

## ⚡ Performance

### Optimization Strategies

#### Frontend
- **Code Splitting**: Automatic route-based splitting
- **Image Optimization**: Next.js Image component
- **Lazy Loading**: Dynamic imports for heavy components
- **Memoization**: React.memo for expensive renders

#### Backend
- **Database Indexing**: Optimized queries with proper indexes
- **Connection Pooling**: Prisma connection management
- **Caching**: Redis integration (planned)
- **Query Optimization**: Efficient SQL with Prisma

#### PDF Processing
- **Lazy Rendering**: On-demand page rendering
- **Task Cancellation**: Prevent unnecessary work
- **Thumbnail Generation**: Progressive loading
- **Worker Threads**: Background processing

### Performance Metrics
- **Time to First Byte (TTFB)**: <200ms
- **First Contentful Paint (FCP)**: <1.5s
- **Largest Contentful Paint (LCP)**: <2.5s
- **Time to Interactive (TTI)**: <3.5s

---

## 🤝 Contributing

We welcome contributions from the community! Please read our [Contributing Guidelines](CONTRIBUTING.md) before submitting pull requests.

### How to Contribute

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit your changes**: `git commit -m 'Add amazing feature'`
4. **Push to the branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request**

### Contribution Areas
- 🐛 Bug fixes
- ✨ New features
- 📝 Documentation improvements
- 🎨 UI/UX enhancements
- 🧪 Test coverage
- 🌐 Internationalization

### Code Review Process
1. Automated checks must pass (linting, type-checking)
2. At least one maintainer approval required
3. All discussions must be resolved
4. Branch must be up-to-date with main

---

## 🗺 Roadmap

### Phase 1: Foundation (Current)
- [x] PDF upload and processing
- [x] RAG-powered chat interface
- [x] Quiz generation and assessment
- [x] YouTube video recommendations
- [x] Progress analytics dashboard

### Phase 2: Enhancement (Q1 2025)
- [ ] Real-time streaming responses (SSE)
- [ ] User authentication and authorization
- [ ] Multi-user workspace support
- [ ] Answer citation highlighting
- [ ] Quiz answer explanations

### Phase 3: Scale (Q2 2025)
- [ ] Advanced analytics and insights
- [ ] Collaborative features (sharing, comments)
- [ ] Mobile applications (iOS/Android)
- [ ] API rate limiting and quotas
- [ ] Observability and monitoring

### Phase 4: Intelligence (Q3 2025)
- [ ] Advanced RAG with re-ranking
- [ ] Custom AI model fine-tuning
- [ ] Multi-modal support (images, audio)
- [ ] Personalized learning paths
- [ ] AI-powered study plans

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2025 BeyondChats

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 🙏 Acknowledgments

- **Next.js Team**: For the amazing React framework
- **Vercel**: For hosting and deployment infrastructure
- **Prisma**: For the excellent ORM and database toolkit
- **Google**: For Gemini AI and YouTube Data API
- **Open Source Community**: For invaluable libraries and tools

---

## 📞 Support & Contact

- **Issues**: [GitHub Issues](https://github.com/Shubhkesarwani02/beyondchats-mvp/issues)
- **Discussions**: [GitHub Discussions](https://github.com/Shubhkesarwani02/beyondchats-mvp/discussions)
- **Email**: support@beyondchats.com
- **Documentation**: [Full Documentation](./docs)

---

<div align="center">

### ⭐ Star this repository if you find it helpful!

**Built with ❤️ by the BeyondChats Team**

[Website](https://beyondchats.com) • [Documentation](./docs) • [Blog](https://blog.beyondchats.com)

</div>
