# Contributing to BeyondChats MVP

Thank you for your interest in contributing to BeyondChats! We welcome contributions from the community and are grateful for your support.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Process](#development-process)
- [Coding Standards](#coding-standards)
- [Submitting Changes](#submitting-changes)
- [Reporting Bugs](#reporting-bugs)
- [Feature Requests](#feature-requests)

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for all contributors.

### Our Standards

- Using welcoming and inclusive language
- Being respectful of differing viewpoints and experiences
- Gracefully accepting constructive criticism
- Focusing on what is best for the community
- Showing empathy towards other community members

## Getting Started

### Prerequisites

- Node.js 20.x or higher
- PostgreSQL 16.x with pgvector extension
- Git
- Basic understanding of TypeScript and React

### Development Setup

1. **Fork and Clone**
   ```bash
   git clone https://github.com/YOUR_USERNAME/beyondchats-mvp.git
   cd beyondchats-mvp
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your credentials
   ```

4. **Setup Database**
   ```bash
   npx prisma generate
   npx prisma migrate dev
   ```

5. **Start Development**
   ```bash
   npm run dev
   ```

## Development Process

### Branch Naming Convention

- `feature/` - New features (e.g., `feature/video-recommendations`)
- `fix/` - Bug fixes (e.g., `fix/chat-pagination`)
- `docs/` - Documentation updates (e.g., `docs/api-guide`)
- `refactor/` - Code refactoring (e.g., `refactor/rag-service`)
- `test/` - Test additions (e.g., `test/quiz-generation`)

### Commit Message Format

Follow conventional commits:

```
type(scope): subject

body (optional)

footer (optional)
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```
feat(chat): add streaming response support

fix(upload): resolve file size validation error

docs(readme): update installation instructions
```

## Coding Standards

### TypeScript

- Use TypeScript strict mode
- Define explicit types for function parameters and return values
- Avoid `any` types; use proper typing or `unknown`
- Use interfaces for object shapes, types for unions/intersections

### React Components

- Use functional components with hooks
- Extract reusable logic into custom hooks
- Keep components focused (Single Responsibility Principle)
- Use proper TypeScript interfaces for props

```typescript
// Good
interface ButtonProps {
  onClick: () => void;
  label: string;
  variant?: 'primary' | 'secondary';
}

export function Button({ onClick, label, variant = 'primary' }: ButtonProps) {
  // Component implementation
}
```

### File Organization

- One component per file
- Co-locate related files (styles, tests, types)
- Use absolute imports with `@/` prefix
- Export named exports for components

### Styling

- Use Tailwind CSS utility classes
- Follow mobile-first responsive design
- Use semantic color names from theme
- Maintain consistent spacing (Tailwind scale: 2, 3, 4, 6, 8)

### Code Quality

```bash
# Linting
npm run lint

# Type checking
npx tsc --noEmit

# Format code (if prettier is configured)
npm run format
```

## Submitting Changes

### Pull Request Process

1. **Create Feature Branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```

2. **Make Changes**
   - Write clean, documented code
   - Add tests for new functionality
   - Update documentation as needed

3. **Test Locally**
   ```bash
   npm run lint
   npm run build
   # Run any tests
   ```

4. **Commit Changes**
   ```bash
   git add .
   git commit -m "feat(scope): descriptive message"
   ```

5. **Push to GitHub**
   ```bash
   git push origin feature/amazing-feature
   ```

6. **Create Pull Request**
   - Use a clear, descriptive title
   - Reference related issues
   - Provide detailed description
   - Add screenshots for UI changes

### PR Review Checklist

Before submitting, ensure:

- [ ] Code follows project style guidelines
- [ ] All tests pass
- [ ] Documentation is updated
- [ ] Commit messages follow convention
- [ ] No console.log statements in production code
- [ ] TypeScript compilation succeeds
- [ ] Changes are tested on multiple screen sizes
- [ ] Accessibility standards are maintained

### Pull Request Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
Describe the tests performed

## Screenshots (if applicable)
Add screenshots of UI changes

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No new warnings generated
```

## Reporting Bugs

### Before Reporting

- Check existing issues to avoid duplicates
- Verify the bug on the latest version
- Collect relevant information

### Bug Report Template

```markdown
**Describe the Bug**
A clear description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '...'
3. Scroll down to '...'
4. See error

**Expected Behavior**
What you expected to happen.

**Screenshots**
If applicable, add screenshots.

**Environment:**
 - OS: [e.g., Windows 11]
 - Browser: [e.g., Chrome 120]
 - Version: [e.g., 0.1.0]

**Additional Context**
Any other context about the problem.
```

## Feature Requests

### Feature Request Template

```markdown
**Is your feature request related to a problem?**
A clear description of the problem.

**Describe the solution you'd like**
A clear description of what you want to happen.

**Describe alternatives you've considered**
Any alternative solutions or features.

**Additional context**
Any other context or screenshots.

**Priority**
- [ ] High
- [ ] Medium
- [ ] Low
```

## Documentation

### Documentation Standards

- Write clear, concise documentation
- Include code examples where applicable
- Update README when adding major features
- Document API changes
- Add JSDoc comments for complex functions

### JSDoc Example

```typescript
/**
 * Generates embeddings for the given text using the configured model.
 * 
 * @param text - The input text to embed
 * @param model - Optional model override
 * @returns Promise resolving to embedding vector
 * @throws {Error} If embedding generation fails
 * 
 * @example
 * const embedding = await generateEmbedding("Hello world");
 * console.log(embedding.length); // 1536
 */
export async function generateEmbedding(
  text: string,
  model?: string
): Promise<number[]> {
  // Implementation
}
```

## Questions or Need Help?

- **GitHub Discussions**: For questions and discussions
- **GitHub Issues**: For bug reports and feature requests
- **Email**: dev@beyondchats.com

## Recognition

Contributors will be acknowledged in:
- README.md contributors section
- Release notes
- Project website (when available)

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to BeyondChats! 🎉
