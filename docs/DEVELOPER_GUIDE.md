# FINCORE Developer Guide

## Table of Contents

1. [Quick Start](#quick-start)
2. [Project Structure](#project-structure)
3. [Common Development Tasks](#common-development-tasks)
4. [Component Development](#component-development)
5. [Working with FinanceContext](#working-with-financecontext)
6. [API Development](#api-development)
7. [Database Operations](#database-operations)
8. [Testing](#testing)
9. [Debugging](#debugging)
10. [Code Style](#code-style)

---

## Quick Start

### Prerequisites

- **Node.js**: 18+
- **npm**: 9+
- **Git**: Latest version
- **Code Editor**: VS Code recommended

### First-Time Setup

```bash
# 1. Clone repository
git clone https://github.com/technosaran/fin_dashboard.git
cd fin_dashboard

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env.local

# Edit .env.local with your Supabase credentials:
# NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
# NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-anon-key

# 4. Start development server
npm run dev

# 5. Open browser
# Navigate to http://localhost:3000
```

### Verify Installation

Run the following to ensure everything works:

```bash
# Check linting
npm run lint

# Run tests
npm test

# Build production bundle
npm run build
```

---

## Project Structure

```
fin_dashboard/
├── app/                        # Next.js App Router
│   ├── components/             # Shared React components
│   │   ├── AuthContext.tsx       # Authentication provider
│   │   ├── FinanceContext.tsx    # Global financial state
│   │   ├── NotificationContext.tsx # Toast notifications
│   │   ├── ClientLayout.tsx      # Authenticated layout
│   │   ├── Dashboard.tsx         # Main dashboard
│   │   ├── Sidebar.tsx           # Navigation menu
│   │   └── [Modal components]    # Various modals
│   │
│   ├── api/                    # API route handlers
│   │   ├── stocks/               # Stock endpoints
│   │   ├── mf/                   # Mutual fund endpoints
│   │   ├── bonds/                # Bond endpoints
│   │   ├── forex/                # Forex endpoints
│   │   └── fno/                  # F&O endpoints
│   │
│   ├── [feature]/              # Feature pages
│   │   ├── page.tsx              # Server component
│   │   └── [Feature]Client.tsx   # Client component
│   │
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Home (redirects to dashboard)
│   └── globals.css             # Global styles
│
├── lib/                        # Shared libraries
│   ├── config/
│   │   └── env.ts                # Environment validation
│   ├── hooks/
│   │   ├── useFetch.ts           # Data fetching hook
│   │   ├── useDebounce.ts        # Debounced values
│   │   └── useLocalStorage.ts    # Local storage hook
│   ├── services/
│   │   ├── api.ts                # API utilities
│   │   └── google-finance.ts     # Google Finance integration
│   ├── types/
│   │   └── index.ts              # TypeScript type definitions
│   ├── utils/
│   │   ├── charges.ts            # Brokerage calculations
│   │   ├── date.ts               # Date utilities
│   │   ├── number.ts             # Number formatting
│   │   ├── string.ts             # String utilities
│   │   ├── db-converters.ts      # DB-to-TS conversions
│   │   └── logger.ts             # Logging utility
│   ├── validators/
│   │   └── input.ts              # Input validation
│   ├── database.types.ts       # Supabase type definitions
│   ├── exportUtils.ts          # CSV export utilities
│   └── supabase.ts             # Supabase client
│
├── __tests__/                  # Test files
│   ├── components/               # Component tests
│   └── utils/                    # Utility tests
│
├── public/                     # Static assets
├── supabase/                   # Supabase migrations (optional)
│
├── .env.example                # Environment template
├── .eslintrc.json              # ESLint config
├── .prettierrc                 # Prettier config
├── jest.config.ts              # Jest config
├── next.config.ts              # Next.js config
├── tsconfig.json               # TypeScript config
└── package.json                # Dependencies & scripts
```

---

## Common Development Tasks

### Task 1: Add a New Page

**Example**: Create a "Reports" page

```bash
# 1. Create page directory
mkdir -p app/reports

# 2. Create server component (page.tsx)
cat > app/reports/page.tsx << 'EOF'
import ReportsClient from './ReportsClient';

export default function ReportsPage() {
  return <ReportsClient />;
}
EOF

# 3. Create client component (ReportsClient.tsx)
cat > app/reports/ReportsClient.tsx << 'EOF'
'use client';

import { useFinance } from '@/app/components/FinanceContext';

export default function ReportsClient() {
  const { accounts, stocks } = useFinance();

  return (
    <div className="page-container">
      <h1>Financial Reports</h1>
      {/* Your content */}
    </div>
  );
}
EOF

# 4. Add to sidebar navigation
# Edit app/components/Sidebar.tsx and add menu item
```

### Task 2: Add a New Entity Type

**Example**: Add "Real Estate" tracking

**Step 1: Update TypeScript Types**

```typescript
// lib/types/index.ts

export interface RealEstate {
  id: string;
  user_id: string;
  property_name: string;
  property_type: 'residential' | 'commercial';
  purchase_price: number;
  current_value: number;
  purchase_date: string;
  location: string;
  created_at: string;
}
```

**Step 2: Create Database Table**

```sql
-- In Supabase SQL Editor
CREATE TABLE real_estate (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  property_name TEXT NOT NULL,
  property_type TEXT NOT NULL,
  purchase_price NUMERIC NOT NULL,
  current_value NUMERIC NOT NULL,
  purchase_date DATE NOT NULL,
  location TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE real_estate ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own properties" ON real_estate
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users insert own properties" ON real_estate
FOR INSERT WITH CHECK (auth.uid() = user_id);
```

**Step 3: Add to FinanceContext**

```typescript
// app/components/FinanceContext.tsx

interface FinanceContextType {
  // ... existing fields
  realEstates: RealEstate[];
  addRealEstate: (property: NewRealEstate) => Promise<void>;
  updateRealEstate: (id: string, updates: Partial<RealEstate>) => Promise<void>;
  deleteRealEstate: (id: string) => Promise<void>;
}

// In FinanceProvider component:
const [realEstates, setRealEstates] = useState<RealEstate[]>([]);

// Load function
const loadRealEstates = async () => {
  const { data, error } = await supabase
    .from('real_estate')
    .select('*')
    .order('created_at', { ascending: false });

  if (data) setRealEstates(data);
};

// CRUD operations
const addRealEstate = async (property: NewRealEstate) => {
  const { data, error } = await supabase
    .from('real_estate')
    .insert({ ...property, user_id: user.id })
    .select()
    .single();

  if (data) {
    setRealEstates((prev) => [...prev, data]);
    showNotification('Property added successfully', 'success');
  }
};
```

**Step 4: Create Page & UI**

```bash
mkdir app/real-estate
# Create page.tsx and RealEstateClient.tsx as shown in Task 1
```

### Task 3: Add a New API Endpoint

**Example**: Create `/api/crypto/quote` endpoint

```typescript
// app/api/crypto/quote/route.ts

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const symbol = request.nextUrl.searchParams.get('symbol');

    if (!symbol) {
      return NextResponse.json({ error: 'Symbol is required' }, { status: 400 });
    }

    // Fetch from external API (example: CoinGecko)
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${symbol}&vs_currencies=usd`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch crypto data');
    }

    const data = await response.json();

    return NextResponse.json({
      symbol,
      price: data[symbol]?.usd,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Crypto API error:', error);
    return NextResponse.json({ error: 'Failed to fetch crypto data' }, { status: 500 });
  }
}
```

### Task 4: Add Validation for User Input

**Example**: Validate stock symbol input

```typescript
// lib/validators/input.ts

export function validateStockSymbol(symbol: string): {
  isValid: boolean;
  error?: string;
} {
  if (!symbol || symbol.trim() === '') {
    return { isValid: false, error: 'Symbol cannot be empty' };
  }

  // NSE/BSE symbols: Uppercase letters, optional .NS or .BO
  const symbolRegex = /^[A-Z]+(\.(NS|BO))?$/;

  if (!symbolRegex.test(symbol)) {
    return {
      isValid: false,
      error: 'Invalid symbol format. Use uppercase letters with optional .NS or .BO',
    };
  }

  return { isValid: true };
}

// Usage in component:
const handleAddStock = () => {
  const validation = validateStockSymbol(symbol);

  if (!validation.isValid) {
    showNotification(validation.error!, 'error');
    return;
  }

  addStock({ symbol, quantity, buyPrice });
};
```

---

## Component Development

### Creating Reusable Components

**Best Practices**:

1. Use TypeScript with explicit prop types
2. Add JSDoc comments for complex components
3. Keep components small and focused
4. Extract reusable logic into custom hooks

**Example: Button Component**

```typescript
// app/components/Button.tsx

'use client';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
}

/**
 * Reusable button component with consistent styling
 *
 * @example
 * <Button variant="primary" onClick={handleClick}>
 *   Save
 * </Button>
 */
export default function Button({
  children,
  onClick,
  variant = 'primary',
  disabled = false,
  type = 'button',
  className = ''
}: ButtonProps) {
  const baseClass = 'btn';
  const variantClass = `btn-${variant}`;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClass} ${variantClass} ${className}`}
    >
      {children}
    </button>
  );
}
```

### Creating Modal Components

**Example: Generic Modal**

```typescript
// app/components/Modal.tsx

'use client';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export default function Modal({ isOpen, onClose, title, children }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>
  );
}
```

---

## Working with FinanceContext

### Accessing Data

```typescript
'use client';

import { useFinance } from '@/app/components/FinanceContext';

export default function MyComponent() {
  const {
    stocks,
    accounts,
    isLoading,
    addStock,
    refreshStockPrices
  } = useFinance();

  // Read data
  const totalStockValue = stocks.reduce((sum, stock) =>
    sum + (stock.current_price * stock.quantity), 0
  );

  // Update data
  const handleAddStock = async () => {
    await addStock({ symbol, quantity, buyPrice });
  };

  return <div>{/* Your UI */}</div>;
}
```

### Adding New Methods to FinanceContext

```typescript
// app/components/FinanceContext.tsx

// 1. Add to interface
interface FinanceContextType {
  // ... existing
  calculateNetWorth: () => number;
}

// 2. Implement in provider
const calculateNetWorth = useCallback(() => {
  const accountsTotal = accounts.reduce((sum, acc) => sum + acc.balance, 0);
  const stocksTotal = stocks.reduce((sum, s) => sum + (s.current_price * s.quantity), 0);
  const mfTotal = mutualFunds.reduce((sum, mf) => sum + (mf.current_nav * mf.units), 0);

  return accountsTotal + stocksTotal + mfTotal;
}, [accounts, stocks, mutualFunds]);

// 3. Include in context value
return (
  <FinanceContext.Provider value={{
    // ... existing
    calculateNetWorth
  }}>
    {children}
  </FinanceContext.Provider>
);
```

---

## API Development

### Creating API Routes

**Pattern**: `app/api/[resource]/[action]/route.ts`

```typescript
// app/api/stocks/quote/route.ts

import { NextRequest, NextResponse } from 'next/server';

// GET handler
export async function GET(request: NextRequest) {
  const symbol = request.nextUrl.searchParams.get('symbol');

  if (!symbol) {
    return NextResponse.json(
      { error: { code: 'INVALID_REQUEST', message: 'Symbol is required' } },
      { status: 400 }
    );
  }

  try {
    const data = await fetchStockQuote(symbol);
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch quote' } },
      { status: 500 }
    );
  }
}

// POST handler
export async function POST(request: NextRequest) {
  const body = await request.json();
  // Handle POST logic
}
```

### Error Handling in APIs

```typescript
// lib/services/api.ts

export class APIError extends Error {
  constructor(
    public code: string,
    public message: string,
    public status: number = 500
  ) {
    super(message);
  }
}

export function handleAPIError(error: unknown) {
  if (error instanceof APIError) {
    return NextResponse.json(
      { error: { code: error.code, message: error.message } },
      { status: error.status }
    );
  }

  return NextResponse.json(
    { error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
    { status: 500 }
  );
}
```

---

## Database Operations

### Using Supabase Client

```typescript
import { supabase } from '@/lib/supabase';

// SELECT
const { data, error } = await supabase.from('stocks').select('*').eq('user_id', userId);

// INSERT
const { data, error } = await supabase
  .from('stocks')
  .insert({ symbol, quantity, buy_price, user_id })
  .select()
  .single();

// UPDATE
const { error } = await supabase
  .from('stocks')
  .update({ current_price: newPrice })
  .eq('id', stockId);

// DELETE
const { error } = await supabase.from('stocks').delete().eq('id', stockId);
```

### Handling Database Errors

```typescript
async function addStock(stock: NewStock) {
  const { data, error } = await supabase.from('stocks').insert(stock).select().single();

  if (error) {
    console.error('Database error:', error);

    // Check specific error codes
    if (error.code === '23505') {
      showNotification('Stock already exists', 'error');
    } else {
      showNotification('Failed to add stock', 'error');
    }

    return;
  }

  // Success
  setStocks((prev) => [...prev, data]);
}
```

---

## Testing

### Component Testing

```typescript
// __tests__/components/Button.test.tsx

import { render, screen, fireEvent } from '@testing-library/react';
import Button from '@/app/components/Button';

describe('Button', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click</Button>);

    fireEvent.click(screen.getByText('Click'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Click</Button>);
    expect(screen.getByText('Click')).toBeDisabled();
  });
});
```

### Utility Testing

```typescript
// __tests__/utils/number.test.ts

import { formatCurrency, formatPercent } from '@/lib/utils/number';

describe('formatCurrency', () => {
  it('formats positive numbers correctly', () => {
    expect(formatCurrency(1234.56)).toBe('₹1,234.56');
  });

  it('formats negative numbers correctly', () => {
    expect(formatCurrency(-1234.56)).toBe('-₹1,234.56');
  });
});
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:ci
```

---

## Debugging

### Using React DevTools

1. Install [React DevTools](https://react.dev/learn/react-developer-tools)
2. Open browser DevTools → React tab
3. Inspect component tree and props

### Using VS Code Debugger

```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Next.js: debug server-side",
      "type": "node-terminal",
      "request": "launch",
      "command": "npm run dev"
    }
  ]
}
```

### Console Logging Best Practices

```typescript
// Use logger utility
import { logger } from '@/lib/utils/logger';

logger.info('User logged in', { userId });
logger.error('API call failed', { error, endpoint });
logger.debug('State updated', { oldState, newState });
```

---

## Code Style

### TypeScript Guidelines

- ✅ Always provide explicit types
- ✅ Use `interface` for object shapes
- ✅ Use `type` for unions and complex types
- ❌ Avoid `any` - use `unknown` instead

### Component Guidelines

- ✅ Use `'use client'` directive for client components
- ✅ Keep components under 200 lines
- ✅ Extract complex logic into custom hooks
- ✅ Use meaningful component and variable names

### Import Order

```typescript
// 1. React imports
import { useState, useEffect } from 'react';

// 2. Third-party libraries
import { LucideIcon } from 'lucide-react';

// 3. Internal imports (absolute paths)
import { useFinance } from '@/app/components/FinanceContext';
import { formatCurrency } from '@/lib/utils/number';

// 4. Types
import type { Stock } from '@/lib/types';
```

### Formatting

```bash
# Format all files
npm run format

# Check formatting
npm run format:check
```

---

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Supabase Docs](https://supabase.com/docs)
- [Testing Library](https://testing-library.com/docs/react-testing-library/intro/)

---

## Getting Help

- **GitHub Issues**: Report bugs or request features
- **Discussions**: Ask questions in GitHub Discussions
- **Code Review**: Request review from maintainers on PRs

Happy coding! 🚀
