# Contributing to FINCORE

Thank you for your interest in contributing to FINCORE! This guide will help you get started and ensure a smooth contribution process.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Development Workflow](#development-workflow)
3. [Code Standards](#code-standards)
4. [Commit Guidelines](#commit-guidelines)
5. [Pull Request Process](#pull-request-process)
6. [Testing Requirements](#testing-requirements)
7. [Documentation](#documentation)
8. [Reporting Issues](#reporting-issues)
9. [Community Guidelines](#community-guidelines)

---

## Getting Started

### Prerequisites

- **Node.js**: 18+ (check with `node --version`)
- **npm**: 9+ (check with `npm --version`)
- **Git**: Latest version
- **Code Editor**: VS Code recommended with extensions:
  - ESLint
  - Prettier
  - TypeScript and JavaScript Language Features

### First-Time Setup

1. **Fork** the repository on GitHub
2. **Clone** your fork:
   ```bash
   git clone https://github.com/<your-username>/fin_dashboard.git
   cd fin_dashboard
   ```
3. **Add upstream remote** (to sync with main repo):
   ```bash
   git remote add upstream https://github.com/technosaran/fin_dashboard.git
   ```
4. **Install** dependencies:

   ```bash
   npm install
   ```

   This will also set up Git hooks (via Husky) for automated quality checks.

5. **Set up** environment variables:

   ```bash
   cp .env.example .env.local
   ```

   Fill in your Supabase credentials in `.env.local`.

6. **Verify installation**:

   ```bash
   npm run lint
   npm test
   npm run build
   ```

7. **Run** the development server:
   ```bash
   npm run dev
   ```
   Open http://localhost:3000 to view the app.

### Pre-commit Hooks

This project uses Husky and lint-staged to enforce code quality:

- **Before every commit**: Automatically runs linting and formatting on staged files
- **Commit message validation**: Ensures commit messages follow Conventional Commits format

If pre-commit hooks fail, fix the issues before committing:

```bash
# Fix linting issues
npm run lint:fix

# Format code
npm run format

# Then try committing again
git commit -m "feat: your change description"
```

---

## Development Workflow

### 1. Create a Feature Branch

Always create a new branch for your work:

```bash
# Update your main branch
git checkout main
git pull upstream main

# Create a feature branch
git checkout -b feature/your-feature-name
```

**Branch naming conventions**:

- `feature/` - New features (e.g., `feature/crypto-portfolio`)
- `fix/` - Bug fixes (e.g., `fix/stock-price-update`)
- `docs/` - Documentation updates (e.g., `docs/api-examples`)
- `refactor/` - Code refactoring (e.g., `refactor/finance-context`)
- `test/` - Adding tests (e.g., `test/utility-functions`)

### 2. Make Your Changes

- Write clean, readable code
- Follow the code standards (see below)
- Add tests for new functionality
- Update documentation as needed

### 3. Test Your Changes

```bash
# Run linter
npm run lint

# Fix linting issues automatically
npm run lint -- --fix

# Format code
npm run format

# Run tests
npm test

# Run tests with coverage
npm run test:ci
```

### 4. Commit Your Changes

```bash
git add .
git commit -m "feat: add crypto portfolio tracking"
```

See [Commit Guidelines](#commit-guidelines) below.

### 5. Push to Your Fork

```bash
git push origin feature/your-feature-name
```

### 6. Open a Pull Request

1. Go to your fork on GitHub
2. Click "Compare & pull request"
3. Fill in the PR template
4. Link related issues (e.g., "Closes #123")
5. Submit the PR

---

## Code Standards

### TypeScript

- ✅ **Always use explicit types** - No implicit `any`
- ✅ **Use interfaces for object shapes**
  ```typescript
  interface Stock {
    id: string;
    symbol: string;
    quantity: number;
  }
  ```
- ✅ **Use type for unions and aliases**
  ```typescript
  type Status = 'active' | 'inactive';
  ```
- ❌ **Avoid `any`** - Use `unknown` or proper types
- ❌ **Avoid type assertions** unless absolutely necessary

### React Components

- ✅ **Use `'use client'` directive** for client components
- ✅ **Export named functions** for components
  ```typescript
  export default function Dashboard() { ... }
  ```
- ✅ **Use TypeScript for props**
  ```typescript
  interface ButtonProps {
    label: string;
    onClick: () => void;
  }
  ```
- ✅ **Keep components under 200 lines** - Extract smaller components

### File Organization

```
app/components/
├── [ComponentName].tsx       # Main component
├── [ComponentName].module.css # Component-specific styles (if needed)
```

### Import Order

```typescript
// 1. React imports
import { useState, useEffect } from 'react';

// 2. Third-party libraries
import { X } from 'lucide-react';

// 3. Internal imports (alphabetical, using aliases)
import { useFinance } from '@/app/components/FinanceContext';
import { formatCurrency } from '@/lib/utils/number';

// 4. Types
import type { Stock } from '@/lib/types';

// 5. Styles (if applicable)
import styles from './Component.module.css';
```

### Naming Conventions

- **Components**: `PascalCase` (e.g., `Dashboard.tsx`)
- **Files**: `camelCase` for utilities (e.g., `formatNumber.ts`)
- **Variables**: `camelCase` (e.g., `totalValue`)
- **Constants**: `UPPER_SNAKE_CASE` (e.g., `API_BASE_URL`)
- **Types/Interfaces**: `PascalCase` (e.g., `Stock`, `UserSettings`)

### Code Formatting

- Use Prettier for consistent formatting
- Run `npm run format` before committing
- 2 spaces for indentation
- Single quotes for strings
- Trailing commas in objects/arrays

---

## Commit Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/):

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, no logic change)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Examples

```bash
feat: add crypto portfolio tracking

Implements cryptocurrency portfolio management with live prices
from CoinGecko API.

Closes #45
```

```bash
fix: correct stock price calculation

Stock prices were not updating correctly due to incorrect symbol
mapping. Fixed by normalizing symbols before API calls.

Fixes #78
```

```bash
docs: update API documentation

Added examples for forex endpoints and improved error handling
documentation.
```

### Scope (Optional)

Add scope for clarity:

- `feat(stocks): add bulk import feature`
- `fix(api): handle timeout errors`
- `docs(readme): update installation steps`

---

## Pull Request Process

### PR Title

Use the same format as commit messages:

```
feat: add cryptocurrency tracking
fix: resolve stock price refresh issue
docs: improve developer guide
```

### PR Description Template

```markdown
## Description

Brief description of changes

## Type of Change

- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing

- [ ] All tests pass
- [ ] Added new tests
- [ ] Manual testing completed

## Checklist

- [ ] Code follows style guidelines
- [ ] Self-reviewed code
- [ ] Commented complex code
- [ ] Updated documentation
- [ ] No new warnings
- [ ] Added tests
- [ ] All tests pass
- [ ] Checked for breaking changes

## Related Issues

Closes #123
Related to #456
```

### Review Process

1. **Automated checks** must pass:
   - Linting (ESLint)
   - Tests (Jest)
   - Build (Next.js)

2. **Code review** by maintainers:
   - Code quality
   - Test coverage
   - Documentation
   - Performance impact

3. **Approval** required before merge

4. **Merge** by maintainers (squash and merge)

---

## Testing Requirements

### Required Tests

- **New features**: Must include tests
- **Bug fixes**: Add regression tests
- **Refactoring**: Ensure existing tests pass

### Test Coverage

Aim for:

- **Utilities**: 90%+ coverage
- **Components**: 70%+ coverage
- **Overall**: 75%+ coverage

### Writing Tests

See [TESTING.md](./TESTING.md) for detailed testing guidelines.

**Example test**:

```typescript
// __tests__/utils/number.test.ts
import { formatCurrency } from '@/lib/utils/number';

describe('formatCurrency', () => {
  it('formats positive numbers correctly', () => {
    expect(formatCurrency(1234.56)).toBe('₹1,234.56');
  });

  it('formats negative numbers correctly', () => {
    expect(formatCurrency(-1234.56)).toBe('-₹1,234.56');
  });
});
```

---

## Documentation

### When to Update Documentation

- Adding new features → Update README.md, DEVELOPER_GUIDE.md
- Changing APIs → Update API.md
- Database changes → Update DATABASE.md
- Architecture changes → Update ARCHITECTURE.md

### Documentation Standards

- Use Markdown
- Include code examples
- Add screenshots for UI changes
- Keep it concise but complete
- Update table of contents

---

## Reporting Issues

### Bug Reports

Use the bug report template and include:

- **Description**: Clear description of the bug
- **Steps to Reproduce**: Numbered steps
- **Expected Behavior**: What should happen
- **Actual Behavior**: What actually happens
- **Screenshots**: If applicable
- **Environment**:
  - OS: [e.g., Windows 10, macOS 13]
  - Browser: [e.g., Chrome 120, Firefox 121]
  - Node version: [e.g., 18.17.0]

### Feature Requests

Include:

- **Problem**: What problem does this solve?
- **Solution**: Proposed solution
- **Alternatives**: Other solutions considered
- **Additional Context**: Mockups, examples, etc.

---

## Community Guidelines

### Code of Conduct

We follow the [Contributor Covenant Code of Conduct](./CODE_OF_CONDUCT.md).

**Summary**:

- Be respectful and inclusive
- Welcome newcomers
- Accept constructive criticism
- Focus on what's best for the community

### Getting Help

- **Questions**: Use GitHub Discussions
- **Bugs**: Use GitHub Issues
- **Security**: Email maintainers directly (see SECURITY.md)

### Recognition

Contributors are recognized in:

- README.md contributors section
- Release notes
- CHANGELOG.md

---

## Development Tips

### Useful Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run start            # Start production server

# Code Quality
npm run lint             # Run ESLint
npm run lint -- --fix    # Auto-fix linting issues
npm run format           # Format with Prettier
npm run format:check     # Check formatting

# Testing
npm test                 # Run tests
npm run test:watch       # Run tests in watch mode
npm run test:ci          # Run tests with coverage
```

### Debugging

- Use React DevTools for component inspection
- Use Network tab for API calls
- Use VS Code debugger (see DEVELOPER_GUIDE.md)
- Add `console.log` or use `lib/utils/logger.ts`

### Common Pitfalls

1. **Forgetting 'use client'**: Components using hooks need `'use client'`
2. **RLS policies**: Ensure database queries respect user_id
3. **Type safety**: Don't bypass TypeScript with `any` or `@ts-ignore`
4. **Test isolation**: Mock external dependencies in tests

---

## Additional Resources

- [Developer Guide](./DEVELOPER_GUIDE.md) - Common development tasks
- [Architecture](./ARCHITECTURE.md) - System design and patterns
- [API Documentation](./API.md) - API endpoint reference
- [Database](./DATABASE.md) - Database schema and queries
- [Testing](./TESTING.md) - Testing guidelines and examples

---

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

## Questions?

Feel free to:

- Open a GitHub Discussion
- Comment on existing issues
- Reach out to maintainers

Thank you for contributing to FINCORE! 🚀
