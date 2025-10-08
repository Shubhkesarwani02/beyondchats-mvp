# Changelog

All notable changes to BeyondChats MVP will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned
- Real-time streaming responses (SSE)
- User authentication and authorization
- Multi-user workspace support
- Advanced analytics dashboard
- Mobile applications

## [0.1.0] - 2025-10-08

### Added
- 📺 **YouTube Video Recommendations** - AI-powered video suggestions based on document content
  - Gemini-powered search query optimization
  - Educational content filtering
  - Video metadata display (duration, channel, thumbnails)
  - Tabbed interface in PDF reader
  - Custom topic search functionality
- 📱 **Enhanced Mobile Responsiveness**
  - Full-screen sidebar on mobile devices
  - Responsive video card layouts
  - Touch-optimized interactions
  - Adaptive spacing and typography
- 🎨 **UI/UX Improvements**
  - Improved video card hover effects
  - Better loading and empty states
  - Enhanced error messaging with icons
  - Gradient floating action button
- 🔧 **API Enhancements**
  - Standardized API response format
  - User-friendly error messages
  - Better error categorization (quota, network, config)
  - Development-only error details
- 📚 **Comprehensive Documentation**
  - Professional README with badges and sections
  - Contributing guidelines
  - Testing verification guide
  - Architecture diagrams
  - API documentation

### Changed
- Improved sidebar behavior on mobile devices
- Enhanced video recommendation panel design
- Updated API response structure for consistency
- Better text truncation for long PDF titles

### Fixed
- Mobile sidebar overlay positioning
- Video card responsiveness issues
- Tab navigation on smaller screens
- API error handling edge cases

## [0.0.1] - 2024-12-XX

### Added
- 📄 **PDF Upload & Processing**
  - PDF file upload with validation
  - Text extraction and chunking
  - Vector embedding generation
  - PostgreSQL storage with pgvector
- 💬 **RAG-Powered Chat**
  - Context-aware AI responses
  - Vector similarity search
  - Source attribution with page numbers
  - Multi-document support
- 📝 **Quiz Generation**
  - Multiple question types (MCQ, SAQ, LAQ)
  - Difficulty level selection
  - Automated grading
  - Quiz attempt tracking
- 📊 **Analytics Dashboard**
  - Performance metrics visualization
  - Topic strength analysis
  - Progress tracking over time
  - Interactive charts with Recharts
- 🎨 **Modern UI**
  - Next.js 15 with App Router
  - Tailwind CSS styling
  - Responsive design
  - Accessibility features
- 🗄️ **Database Schema**
  - PDF model with relationships
  - Chunk model with vector embeddings
  - Quiz and Question models
  - QuizAttempt model for tracking

### Technical
- Next.js 15.5.4 with Turbopack
- TypeScript 5.0 with strict mode
- Prisma ORM 6.16
- PostgreSQL with pgvector extension
- PDF.js for rendering
- Google Gemini AI integration

---

## Version History

### Version Numbering

- **MAJOR**: Incompatible API changes
- **MINOR**: New features (backwards-compatible)
- **PATCH**: Bug fixes (backwards-compatible)

### Links

- [0.1.0] - Latest release with video recommendations
- [0.0.1] - Initial MVP release

---

## Migration Guides

### Upgrading from 0.0.1 to 0.1.0

**New Environment Variables Required:**
```bash
# Add to .env.local
YOUTUBE_API_KEY="your_youtube_api_key_here"
```

**Database Changes:**
No migration required for this release.

**Breaking Changes:**
None. This is a backwards-compatible release.

**New Features:**
- YouTube video recommendations in reader view
- Enhanced mobile experience
- Improved error handling

---

## Deprecation Notices

None at this time.

---

## Contributors

Special thanks to all contributors who helped with this release!

- [@Shubhkesarwani02](https://github.com/Shubhkesarwani02) - Project Lead & Core Development

---

## Feedback

We welcome your feedback! Please:
- Report bugs via [GitHub Issues](https://github.com/Shubhkesarwani02/beyondchats-mvp/issues)
- Suggest features via [GitHub Discussions](https://github.com/Shubhkesarwani02/beyondchats-mvp/discussions)
- Contribute code via Pull Requests

---

**Last Updated**: October 8, 2025
