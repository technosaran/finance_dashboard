# FINCORE Testing Strategy

## Overview

FINCORE uses a comprehensive testing approach combining unit tests, integration tests, and manual testing to ensure code quality and reliability.

## Testing Stack

- **Test Framework**: Jest
- **React Testing**: React Testing Library
- **Test Runner**: Jest with jsdom environment
- **Coverage**: Built-in Jest coverage reporting

## Test Structure

```
__tests__/
├── components/          # Component tests
│   ├── Dashboard.test.tsx
│   ├── Sidebar.test.tsx
│   └── modals/
├── hooks/              # Custom hook tests
│   ├── useFetch.test.ts
│   └── useDebounce.test.ts
├── utils/              # Utility function tests
│   ├── number.test.ts
│   ├── date.test.ts
│   ├── charges.test.ts
│   └── validators.test.ts
├── api/                # API route tests
│   ├── stocks.test.ts
│   └── mf.test.ts
└── integration/        # Integration tests
    └── FinanceContext.test.tsx
```

---

## Testing Levels

### 1. Unit Tests

Test individual functions, utilities, and components in isolation.

**Example: Utility Function Test**

```typescript
// __tests__/utils/number.test.ts

import { formatCurrency, formatPercent } from '@/lib/utils/number';

describe('formatCurrency', () => {
  it('formats positive numbers with rupee symbol', () => {
    expect(formatCurrency(1234.56)).toBe('₹1,234.56');
  });

  it('formats negative numbers correctly', () => {
    expect(formatCurrency(-1234.56)).toBe('-₹1,234.56');
  });

  it('handles zero', () => {
    expect(formatCurrency(0)).toBe('₹0.00');
  });

  it('formats large numbers with commas', () => {
    expect(formatCurrency(1234567.89)).toBe('₹12,34,567.89');
  });
});

describe('formatPercent', () => {
  it('formats positive percentages', () => {
    expect(formatPercent(12.34)).toBe('+12.34%');
  });

  it('formats negative percentages', () => {
    expect(formatPercent(-5.67)).toBe('-5.67%');
  });

  it('handles zero', () => {
    expect(formatPercent(0)).toBe('0.00%');
  });
});
```

**Example: Component Test**

```typescript
// __tests__/components/Dashboard.test.tsx

import { render, screen } from '@testing-library/react';
import Dashboard from '@/app/components/Dashboard';
import { FinanceProvider } from '@/app/components/FinanceContext';
import { AuthProvider } from '@/app/components/AuthContext';

// Mock contexts
jest.mock('@/app/components/FinanceContext', () => ({
  useFinance: () => ({
    accounts: [
      { id: '1', name: 'Test Account', balance: 10000, type: 'bank' }
    ],
    stocks: [],
    isLoading: false
  })
}));

describe('Dashboard', () => {
  it('renders without crashing', () => {
    render(<Dashboard />);
    expect(screen.getByText(/Dashboard/i)).toBeInTheDocument();
  });

  it('displays net worth', () => {
    render(<Dashboard />);
    expect(screen.getByText(/Net Worth/i)).toBeInTheDocument();
    expect(screen.getByText(/₹10,000/)).toBeInTheDocument();
  });

  it('shows loading state', () => {
    jest.mock('@/app/components/FinanceContext', () => ({
      useFinance: () => ({ isLoading: true })
    }));

    render(<Dashboard />);
    expect(screen.getByTestId('skeleton-loader')).toBeInTheDocument();
  });
});
```

### 2. Integration Tests

Test interactions between multiple components and contexts.

**Example: FinanceContext Integration Test**

```typescript
// __tests__/integration/FinanceContext.test.tsx

import { renderHook, act, waitFor } from '@testing-library/react';
import { FinanceProvider, useFinance } from '@/app/components/FinanceContext';
import { supabase } from '@/lib/supabase';

// Mock Supabase
jest.mock('@/lib/supabase');

describe('FinanceContext Integration', () => {
  it('loads and updates stocks', async () => {
    const mockStocks = [{ id: '1', symbol: 'RELIANCE.NS', quantity: 10, buy_price: 2400 }];

    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ data: mockStocks, error: null }),
      }),
    });

    const { result } = renderHook(() => useFinance(), {
      wrapper: FinanceProvider,
    });

    await waitFor(() => {
      expect(result.current.stocks).toEqual(mockStocks);
    });

    // Test adding a stock
    await act(async () => {
      await result.current.addStock({
        symbol: 'TCS.NS',
        quantity: 5,
        buy_price: 3500,
      });
    });

    expect(result.current.stocks).toHaveLength(2);
  });
});
```

### 3. API Route Tests

Test Next.js API routes in isolation.

**Example: API Route Test**

```typescript
// __tests__/api/stocks.test.ts

import { GET } from '@/app/api/stocks/quote/route';
import { NextRequest } from 'next/server';

describe('Stocks API', () => {
  it('returns stock quote for valid symbol', async () => {
    const request = new NextRequest('http://localhost:3000/api/stocks/quote?symbol=RELIANCE.NS');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('symbol', 'RELIANCE.NS');
    expect(data).toHaveProperty('price');
  });

  it('returns 400 for missing symbol', async () => {
    const request = new NextRequest('http://localhost:3000/api/stocks/quote');

    const response = await GET(request);
    expect(response.status).toBe(400);
  });
});
```

### 4. Custom Hook Tests

Test custom React hooks.

**Example: Hook Test**

```typescript
// __tests__/hooks/useDebounce.test.ts

import { renderHook, act } from '@testing-library/react';
import { useDebounce } from '@/lib/hooks/useDebounce';

jest.useFakeTimers();

describe('useDebounce', () => {
  it('debounces value updates', () => {
    const { result, rerender } = renderHook(({ value, delay }) => useDebounce(value, delay), {
      initialProps: { value: 'initial', delay: 500 },
    });

    expect(result.current).toBe('initial');

    // Update value
    rerender({ value: 'updated', delay: 500 });

    // Value should not change immediately
    expect(result.current).toBe('initial');

    // Fast-forward time
    act(() => {
      jest.advanceTimersByTime(500);
    });

    // Now value should be updated
    expect(result.current).toBe('updated');
  });
});
```

---

## Test Coverage Goals

| Category       | Target Coverage | Current |
| -------------- | --------------- | ------- |
| **Utilities**  | 90%+            | TBD     |
| **Components** | 70%+            | TBD     |
| **Hooks**      | 85%+            | TBD     |
| **API Routes** | 80%+            | TBD     |
| **Overall**    | 75%+            | TBD     |

---

## Running Tests

### Local Development

```bash
# Run all tests
npm test

# Run tests in watch mode (recommended for development)
npm run test:watch

# Run tests with coverage report
npm run test:ci

# Run specific test file
npm test -- Dashboard.test.tsx

# Run tests matching pattern
npm test -- --testNamePattern="formatCurrency"
```

### CI/CD

Tests are automatically run on:

- Every push to feature branches
- Pull requests to `main`
- Before deployment to production

**GitHub Actions Workflow** (if configured):

```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run test:ci
      - uses: codecov/codecov-action@v3
```

---

## Mocking Strategy

### Mocking Supabase

```typescript
// jest.setup.ts or in test file

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ data: [], error: null })),
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: {}, error: null })),
        })),
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ error: null })),
      })),
      delete: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ error: null })),
      })),
    })),
    auth: {
      getSession: jest.fn(() => Promise.resolve({ data: { session: null } })),
    },
  },
}));
```

### Mocking External APIs

```typescript
// Mock fetch for API tests
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () =>
      Promise.resolve({
        price: 2456.75,
        symbol: 'RELIANCE.NS',
      }),
  })
) as jest.Mock;
```

### Mocking React Context

```typescript
jest.mock('@/app/components/FinanceContext', () => ({
  useFinance: () => ({
    stocks: [],
    addStock: jest.fn(),
    isLoading: false,
  }),
}));
```

---

## Best Practices

### 1. Test Naming

Use descriptive test names that explain the expected behavior:

```typescript
// ✅ Good
it('formats negative numbers with minus sign', () => {});

// ❌ Bad
it('works with negatives', () => {});
```

### 2. Arrange-Act-Assert Pattern

```typescript
it('calculates total stock value correctly', () => {
  // Arrange
  const stocks = [
    { quantity: 10, current_price: 100 },
    { quantity: 5, current_price: 200 },
  ];

  // Act
  const total = calculateTotalValue(stocks);

  // Assert
  expect(total).toBe(2000);
});
```

### 3. Test One Thing at a Time

```typescript
// ✅ Good - separate tests
it('validates correct email format', () => {});
it('rejects email without @ symbol', () => {});
it('rejects email without domain', () => {});

// ❌ Bad - testing multiple things
it('validates email', () => {
  // Tests 5 different scenarios in one test
});
```

### 4. Avoid Testing Implementation Details

```typescript
// ❌ Bad - testing internal state
it('sets loading to true when fetching', () => {
  expect(component.state.loading).toBe(true);
});

// ✅ Good - testing observable behavior
it('shows loading spinner when fetching', () => {
  expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
});
```

### 5. Use Test Data Factories

```typescript
// helpers/testData.ts
export const createMockStock = (overrides = {}) => ({
  id: 'test-id',
  symbol: 'TEST.NS',
  quantity: 10,
  buy_price: 100,
  current_price: 110,
  ...overrides,
});

// In test
const stock = createMockStock({ symbol: 'RELIANCE.NS' });
```

---

## Manual Testing Checklist

Before each release, manually test:

### Core Functionality

- [ ] User registration and login
- [ ] Dashboard loads with correct data
- [ ] Add/edit/delete accounts
- [ ] Add/edit/delete transactions
- [ ] Stock portfolio updates with live prices
- [ ] Mutual fund NAV refresh
- [ ] Bond valuation
- [ ] F&O position tracking
- [ ] Forex transactions
- [ ] Goal progress tracking
- [ ] CSV export functionality

### UI/UX

- [ ] Responsive design on mobile/tablet/desktop
- [ ] Dark theme displays correctly
- [ ] Loading states show appropriately
- [ ] Error messages are clear and helpful
- [ ] Forms validate input correctly
- [ ] Modals open and close properly

### Performance

- [ ] Initial page load < 3 seconds
- [ ] API calls complete within reasonable time
- [ ] No memory leaks on navigation
- [ ] Large datasets (100+ stocks) render smoothly

### Security

- [ ] Unauthenticated users redirected to login
- [ ] Users can only see their own data
- [ ] Input sanitization prevents XSS
- [ ] API endpoints validate requests

---

## Continuous Improvement

### Code Coverage Reports

After running `npm run test:ci`, check the coverage report:

```bash
open coverage/lcov-report/index.html
```

Focus on improving coverage for:

- Critical business logic
- Utility functions used across the app
- Core components (Dashboard, FinanceContext)

### Test Performance

Monitor test execution time:

- **Target**: All tests complete in < 30 seconds
- If tests become slow, consider:
  - Reducing unnecessary mock setup
  - Using `beforeAll` instead of `beforeEach` where possible
  - Splitting large test files

---

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Test-Driven Development](https://martinfowler.com/bliki/TestDrivenDevelopment.html)

---

## Contributing Tests

When contributing to FINCORE:

1. **Write tests for new features** - All new code should include tests
2. **Update existing tests** - If changing behavior, update tests
3. **Maintain coverage** - Don't decrease overall coverage
4. **Run tests before PR** - Ensure all tests pass locally

See [CONTRIBUTING.md](./CONTRIBUTING.md) for more details.
