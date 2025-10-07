# BeyondChats MVP - AI-Powered Learning Platform

<div align="center">

![BeyondChats Logo](https://img.shields.io/badge/BeyondChats-MVP-blue?style=for-the-badge)
[![Next.js](https://img.shields.io/badge/Next.js-15.5.4-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6.16.3-2D3748?style=flat-square&logo=prisma)](https://www.prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.1.14-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)

**Transform your PDFs into interactive learning experiences with AI-powered quizzes and intelligent document chat.**

[Demo](#demo) • [Features](#features) • [Quick Start](#quick-start) • [Documentation](#documentation)

</div>

---

## 🚀 Overview

BeyondChats MVP is a cutting-edge educational platform that leverages Google's Gemini AI to transform static PDF documents into dynamic, interactive learning experiences. Upload your study materials, generate AI-powered quizzes, engage in intelligent conversations with your documents, and track your learning progress with comprehensive analytics.

### 🎯 Key Value Propositions

- **📚 Smart Document Processing**: Advanced PDF parsing with semantic chunking and vector embeddings
- **🧠 AI-Powered Quiz Generation**: Multi-format questions (MCQ, SAQ, LAQ) with intelligent difficulty adaptation
- **💬 Interactive Document Chat**: Natural language conversations with your uploaded documents
- **📊 Learning Analytics**: Comprehensive progress tracking with visual insights and performance metrics
- **🎨 Modern UI/UX**: Responsive design with intuitive navigation and accessibility features

---

## ✨ Features

### 📄 Document Management
- **PDF Upload & Processing**: Seamless file upload with automatic text extraction
- **Smart Chunking**: Intelligent document segmentation for optimal AI processing
- **Vector Embeddings**: Advanced semantic search using Google's embedding models
- **Document Reader**: Interactive PDF viewer with search and navigation

### 🧠 AI-Powered Quiz Engine
- **Multi-Format Questions**: 
  - Multiple Choice Questions (MCQ) with 4 options
  - Short Answer Questions (SAQ) for concept understanding
  - Long Answer Questions (LAQ) for comprehensive evaluation
- **Adaptive Difficulty**: AI adjusts question complexity based on document content
- **Source Attribution**: Each question linked to specific document sections
- **Intelligent Scoring**: Automated evaluation with detailed feedback

### 💬 Intelligent Chat System
- **Document-Aware Conversations**: Chat with your PDFs using natural language
- **Context-Aware Responses**: AI maintains conversation context and document relevance
- **Source Citations**: Responses include references to specific document sections
- **Multi-Document Support**: Query across multiple uploaded documents

### 📊 Learning Analytics Dashboard
- **Progress Tracking**: Monitor quiz attempts, scores, and improvement trends
- **Topic Analysis**: Identify strengths and areas for improvement by subject
- **Performance Visualization**: Interactive charts showing learning progression
- **Achievement Metrics**: Track mastery levels and learning milestones

---

## 🏗️ Architecture

### Technology Stack

- **Frontend**: Next.js 15.5.4 with React 19.1.0, TypeScript 5.0, Tailwind CSS 4.1.14
- **Backend**: Next.js API Routes with Prisma ORM 6.16.3
- **Database**: PostgreSQL with pgvector extension for vector storage
- **AI**: Google Gemini Pro for text generation and embeddings
- **Analytics**: Recharts for data visualization
- **Deployment**: Vercel (recommended) or Docker

### Database Schema

```sql
-- Core entities with relationships
model PDF {
  id        String   @id @default(cuid())
  title     String
  url       String
  createdAt DateTime @default(now())
  chunks    Chunk[]
  quizzes   Quiz[]   @relation("QuizPDFs")
}

model Quiz {
  id          String        @id @default(cuid())
  title       String
  questions   Question[]
  attempts    QuizAttempt[]
  pdfs        PDF[]         @relation("QuizPDFs")
}

model QuizAttempt {
  id         String          @id @default(cuid())
  totalScore Int?
  maxScore   Int?
  answers    AttemptAnswer[]
}
```

### AI Integration Architecture

#### Google Gemini Integration
- **Model**: `gemini-1.5-flash` for text generation and quiz creation
- **Embeddings**: `text-embedding-004` for semantic search
- **Context Window**: Up to 1M tokens for comprehensive document analysis
- **Safety Settings**: Configured for educational content with appropriate filtering

---

## 🛠️ Installation & Setup

### Prerequisites

- **Node.js**: Version 18.0.0 or higher
- **PostgreSQL**: Version 14.0 or higher with pgvector extension
- **Google AI Studio**: API key for Gemini models

### Quick Start

1. **Clone the Repository**
   ```bash
   git clone https://github.com/Shubhkesarwani02/beyondchats-mvp.git
   cd beyondchats-mvp
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Database Setup**
   ```bash
   # Install PostgreSQL and pgvector extension
   # On Ubuntu/Debian:
   sudo apt-get install postgresql postgresql-contrib
   sudo apt-get install postgresql-14-pgvector
   
   # Create database
   createdb beyondchats_mvp
   ```

4. **Environment Configuration**
   Create `.env.local` file:
   ```env
   # Database Configuration
   DATABASE_URL="postgresql://username:password@localhost:5432/beyondchats_mvp?schema=public"
   
   # Google AI Configuration
   GOOGLE_GENERATIVE_AI_API_KEY="your_gemini_api_key_here"
   
   # Application Configuration
   NEXT_PUBLIC_APP_URL="http://localhost:3000"
   NODE_ENV="development"
   ```

5. **Database Migration**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

6. **Start Development Server**
   ```bash
   npm run dev
   ```

7. **Access Application**
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔧 Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string with pgvector | ✅ | - |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Google AI Studio API key | ✅ | - |
| `NEXT_PUBLIC_APP_URL` | Application base URL | ✅ | `http://localhost:3000` |
| `NODE_ENV` | Environment mode | ❌ | `development` |

### Google AI Studio Setup

1. Visit [Google AI Studio](https://aistudio.google.com/)
2. Create a new project or select existing
3. Generate API key with Gemini access
4. Configure safety settings for educational content
5. Add key to environment variables

---

## 🔍 How Gemini AI is Used

### 1. Text Embeddings for Semantic Search
- **Document Processing**: PDF text is chunked and converted to vector embeddings
- **Semantic Search**: User queries are matched against document chunks using cosine similarity
- **Context Retrieval**: Relevant document sections are identified for quiz generation and chat

### 2. Quiz Generation
- **Intelligent Question Creation**: AI analyzes document content to generate contextual questions
- **Multi-Format Support**: Creates MCQ, SAQ, and LAQ questions with varying difficulty levels
- **Source Attribution**: Each question includes references to specific document sections
- **Adaptive Difficulty**: Question complexity adjusts based on content and user performance

### 3. Document Chat
- **Context-Aware Responses**: AI maintains conversation context while referencing documents
- **Source Citations**: Responses include specific page and section references
- **Multi-Document Support**: Query across multiple uploaded documents simultaneously
- **Natural Language Processing**: Understands complex queries and provides detailed explanations

### 4. Intelligent Scoring
- **Automated Evaluation**: AI evaluates short and long answer questions
- **Detailed Feedback**: Provides specific improvement suggestions
- **Rubric-Based Assessment**: Uses predefined criteria for consistent scoring
- **Progress Tracking**: Analyzes performance patterns for personalized insights

---

## 📊 API Documentation

### Core Endpoints

#### PDF Management
```typescript
// Upload PDF
POST /api/upload
Content-Type: multipart/form-data
Body: { file: File }
Response: { success: boolean, pdfId: string }

// Get PDFs
GET /api/pdfs
Response: { success: boolean, pdfs: PDF[] }
```

#### Quiz Generation
```typescript
// Generate Quiz
POST /api/generate-quiz
Body: {
  pdfIds: string[],
  numMcq: number,
  numSaq: number,
  numLaq: number,
  difficulty?: 'easy' | 'medium' | 'hard'
}
Response: { success: boolean, quizId: string }

// Submit Quiz Attempt
POST /api/submit-quiz
Body: {
  quizId: string,
  answers: Answer[],
  userId: string
}
Response: { success: boolean, results: Results }
```

#### Chat System
```typescript
// Chat with PDF
POST /api/chat
Body: {
  message: string,
  pdfIds: string[],
  history?: Message[]
}
Response: {
  success: boolean,
  response: string,
  sources: Source[]
}
```

#### Progress Analytics
```typescript
// Get Progress Data
GET /api/progress?userId=string
Response: {
  success: boolean,
  data: {
    totalAttempts: number,
    avgScore: number,
    topics: Topic[],
    recentAttempts: Attempt[],
    performanceData: Performance[]
  }
}
```

---

## 💻 Development

### Project Structure
```
beyondchats-mvp/
├── app/                    # Next.js App Router
│   ├── api/               # API endpoints
│   ├── dashboard/         # Dashboard pages
│   ├── chat/             # Chat interface
│   ├── quiz/             # Quiz pages
│   └── upload/           # File upload
├── components/           # Reusable UI components
├── lib/                 # Utility libraries
│   ├── prisma.ts        # Database client
│   ├── gemini.ts        # AI integration
│   └── embeddings.ts    # Vector operations
├── prisma/              # Database schema
└── public/              # Static assets
```

### Development Commands
```bash
# Development server with Turbopack
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint

# Database operations
npx prisma studio          # Database GUI
npx prisma db seed         # Seed database
npx prisma migrate dev     # Create migration
```

---

## 🚀 Deployment

### Vercel Deployment (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Configure environment variables in Vercel dashboard
```

### Docker Deployment
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

---

## 🛡️ Security & Privacy

### Data Protection
- **Encryption**: All sensitive data encrypted at rest and in transit
- **Input Validation**: Comprehensive sanitization of user inputs
- **Rate Limiting**: API endpoint protection against abuse
- **Secure File Handling**: Safe PDF processing with virus scanning

### Privacy Compliance
- **Data Minimization**: Only necessary data collection
- **User Consent**: Clear privacy policy and consent mechanisms
- **Data Retention**: Automatic cleanup of old data
- **Export/Delete**: User data portability and deletion rights

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Standards
- Follow TypeScript best practices
- Write comprehensive tests
- Document new features
- Ensure accessibility compliance

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🆘 Support & Community

- **Issues**: [GitHub Issues](https://github.com/Shubhkesarwani02/beyondchats-mvp/issues)
- **Discussions**: [GitHub Discussions](https://github.com/Shubhkesarwani02/beyondchats-mvp/discussions)
- **Email**: support@beyondchats.com

---

## 🙏 Acknowledgments

- **Google AI**: For providing the powerful Gemini models
- **Vercel**: For excellent hosting and deployment platform  
- **Prisma**: For the robust database toolkit
- **Next.js Team**: For the amazing React framework
- **Open Source Community**: For the countless libraries and tools

---

<div align="center">

**Built with ❤️ by Shubh**

[![GitHub stars](https://img.shields.io/github/stars/Shubhkesarwani02/beyondchats-mvp?style=social)](https://github.com/Shubhkesarwani02/beyondchats-mvp)

</div>

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
