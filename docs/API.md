# FINCORE API Documentation

## Overview

FINCORE uses Next.js API routes to provide backend functionality for fetching market data, managing financial entities, and processing transactions. All API routes are located in the `app/api/` directory.

## Base URL

- **Development**: `http://localhost:3000/api`
- **Production**: `https://yourdomain.com/api`

## Authentication

All API routes are protected by Supabase Row Level Security (RLS). Requests must include valid Supabase session cookies.

---

## Stock APIs

### Batch Stock Quotes

Fetches real-time stock quotes for multiple symbols.

**Endpoint**: `POST /api/stocks/batch`

**Request Body**:

```json
{
  "symbols": ["RELIANCE.NS", "TCS.NS", "INFY.NS"]
}
```

**Response**:

```json
{
  "data": {
    "RELIANCE.NS": {
      "symbol": "RELIANCE.NS",
      "price": 2456.75,
      "change": 12.5,
      "changePercent": 0.51,
      "timestamp": "2026-02-14T08:30:00Z"
    },
    "TCS.NS": {
      "symbol": "TCS.NS",
      "price": 3567.8,
      "change": -15.2,
      "changePercent": -0.42,
      "timestamp": "2026-02-14T08:30:00Z"
    }
  },
  "errors": []
}
```

**Error Responses**:

- `400 Bad Request`: Missing or invalid symbols array
- `500 Internal Server Error`: External API failure

**Rate Limiting**: 100 requests per minute per user

---

### Stock Search

Searches for stocks by symbol or company name.

**Endpoint**: `GET /api/stocks/search?q={query}`

**Query Parameters**:

- `q` (required): Search query (min 1 character)

**Response**:

```json
{
  "results": [
    {
      "symbol": "RELIANCE.NS",
      "name": "Reliance Industries Limited",
      "exchange": "NSE",
      "type": "EQUITY"
    }
  ]
}
```

---

### Single Stock Quote

Fetches a quote for a single stock symbol.

**Endpoint**: `GET /api/stocks/quote?symbol={symbol}`

**Query Parameters**:

- `symbol` (required): Stock symbol (e.g., "RELIANCE.NS")

**Response**:

```json
{
  "symbol": "RELIANCE.NS",
  "price": 2456.75,
  "change": 12.5,
  "changePercent": 0.51,
  "open": 2444.25,
  "high": 2460.0,
  "low": 2440.0,
  "volume": 5678900,
  "timestamp": "2026-02-14T08:30:00Z"
}
```

---

## Mutual Fund APIs

### Batch Mutual Fund NAVs

Fetches Net Asset Values (NAVs) for multiple mutual fund schemes.

**Endpoint**: `POST /api/mf/batch`

**Request Body**:

```json
{
  "schemeCodes": ["119551", "120503", "118989"]
}
```

**Response**:

```json
{
  "data": {
    "119551": {
      "schemeCode": "119551",
      "schemeName": "Axis Bluechip Fund - Direct Plan - Growth",
      "nav": 45.67,
      "date": "2026-02-13"
    },
    "120503": {
      "schemeCode": "120503",
      "schemeName": "HDFC Mid-Cap Opportunities Fund - Direct Plan - Growth",
      "nav": 123.45,
      "date": "2026-02-13"
    }
  },
  "errors": []
}
```

**Data Source**: [MFAPI.in](https://www.mfapi.in/) - A free public API for Indian mutual funds

---

## Bond APIs

### Batch Bond Prices

Fetches current prices for multiple bonds.

**Endpoint**: `POST /api/bonds/batch`

**Request Body**:

```json
{
  "isins": ["INE002A01018", "INE001A01036"]
}
```

**Response**:

```json
{
  "data": {
    "INE002A01018": {
      "isin": "INE002A01018",
      "currentPrice": 1045.5,
      "yieldToMaturity": 6.75,
      "lastUpdated": "2026-02-14T08:30:00Z"
    }
  },
  "errors": []
}
```

**Note**: Bond prices are simulated using deterministic volatility based on market conditions.

---

### Bond Search

Searches for bonds by ISIN or name.

**Endpoint**: `GET /api/bonds/search?q={query}`

**Query Parameters**:

- `q` (required): Search query (ISIN or bond name)

**Response**:

```json
{
  "results": [
    {
      "isin": "INE002A01018",
      "name": "Reliance Industries 7.5% Bond 2025",
      "issuer": "Reliance Industries",
      "couponRate": 7.5,
      "maturityDate": "2025-12-31",
      "faceValue": 1000
    }
  ]
}
```

---

## F&O (Futures & Options) APIs

### Batch F&O Data

Fetches data for multiple F&O positions.

**Endpoint**: `POST /api/fno/batch`

**Request Body**:

```json
{
  "symbols": ["NIFTY26FEB24000CE", "BANKNIFTY26FEB46000PE"]
}
```

**Response**:

```json
{
  "data": {
    "NIFTY26FEB24000CE": {
      "symbol": "NIFTY26FEB24000CE",
      "lastPrice": 145.5,
      "change": 12.3,
      "changePercent": 9.23,
      "volume": 456789,
      "openInterest": 1234567
    }
  },
  "errors": []
}
```

---

## Forex APIs

### Batch Forex Rates

Fetches exchange rates for multiple currency pairs.

**Endpoint**: `POST /api/forex/batch`

**Request Body**:

```json
{
  "pairs": ["USDINR", "EURINR", "GBPINR"]
}
```

**Response**:

```json
{
  "data": {
    "USDINR": {
      "pair": "USDINR",
      "rate": 83.45,
      "change": 0.15,
      "changePercent": 0.18,
      "timestamp": "2026-02-14T08:30:00Z"
    }
  },
  "errors": []
}
```

---

### Single Forex Rate

Fetches exchange rate for a single currency pair.

**Endpoint**: `GET /api/forex/quote?pair={pair}`

**Query Parameters**:

- `pair` (required): Currency pair (e.g., "USDINR")

**Response**:

```json
{
  "pair": "USDINR",
  "rate": 83.45,
  "change": 0.15,
  "changePercent": 0.18,
  "bid": 83.44,
  "ask": 83.46,
  "timestamp": "2026-02-14T08:30:00Z"
}
```

---

## Error Handling

All API endpoints follow a consistent error response format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {}
  }
}
```

### Common Error Codes

| Code                  | HTTP Status | Description                       |
| --------------------- | ----------- | --------------------------------- |
| `INVALID_REQUEST`     | 400         | Missing or invalid parameters     |
| `UNAUTHORIZED`        | 401         | Invalid or missing authentication |
| `FORBIDDEN`           | 403         | Insufficient permissions          |
| `NOT_FOUND`           | 404         | Resource not found                |
| `RATE_LIMIT_EXCEEDED` | 429         | Too many requests                 |
| `EXTERNAL_API_ERROR`  | 502         | External service unavailable      |
| `INTERNAL_ERROR`      | 500         | Server error                      |

---

## Rate Limiting

To ensure fair usage and system stability:

- **Default**: 100 requests per minute per user
- **Batch endpoints**: 20 requests per minute per user
- **Search endpoints**: 50 requests per minute per user

Rate limit headers are included in all responses:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1708765200
```

---

## External API Dependencies

FINCORE integrates with the following external APIs:

### Yahoo Finance

- **Purpose**: Real-time stock quotes
- **Rate Limits**: 2000 requests/hour (free tier)
- **Fallback**: Google Finance API

### MFAPI.in

- **Purpose**: Indian mutual fund NAVs
- **Rate Limits**: Unlimited (public API)
- **Update Frequency**: Daily (after market hours)

### Google Finance

- **Purpose**: Alternative stock quotes, forex rates
- **Rate Limits**: Varies by usage
- **Documentation**: Unofficial API

---

## Best Practices

### Batch Requests

Always use batch endpoints when fetching multiple entities:

**Good**:

```javascript
// Fetch 10 stocks in one request
const response = await fetch('/api/stocks/batch', {
  method: 'POST',
  body: JSON.stringify({ symbols: ['STOCK1.NS', 'STOCK2.NS', ...] })
});
```

**Bad**:

```javascript
// 10 separate requests - inefficient and may hit rate limits
for (const symbol of symbols) {
  await fetch(`/api/stocks/quote?symbol=${symbol}`);
}
```

### Error Handling

Always handle errors gracefully:

```javascript
try {
  const response = await fetch('/api/stocks/batch', { ... });

  if (!response.ok) {
    const error = await response.json();
    console.error('API Error:', error.error.message);
    // Show user-friendly message
  }

  const data = await response.json();
  // Handle successful response
} catch (error) {
  // Handle network errors
  console.error('Network error:', error);
}
```

### Caching

Client-side caching is implemented in `FinanceContext` with automatic refresh every 5 minutes. Consider this when making direct API calls.

---

## SDK Usage (via FinanceContext)

Instead of calling API routes directly, use the `FinanceContext` methods:

```typescript
import { useFinance } from '@/app/components/FinanceContext';

function MyComponent() {
  const { refreshStockPrices, stocks, isLoading } = useFinance();

  // Automatically batches and caches requests
  useEffect(() => {
    refreshStockPrices();
  }, []);

  return (
    <div>
      {stocks.map(stock => (
        <div key={stock.id}>{stock.symbol}: {stock.current_price}</div>
      ))}
    </div>
  );
}
```

---

## Testing APIs

### Development

Use tools like Postman, curl, or Thunder Client:

```bash
# Test stock batch endpoint
curl -X POST http://localhost:3000/api/stocks/batch \
  -H "Content-Type: application/json" \
  -d '{"symbols":["RELIANCE.NS","TCS.NS"]}'
```

### Integration Tests

Example using Jest:

```typescript
describe('Stock Batch API', () => {
  it('should fetch multiple stock quotes', async () => {
    const response = await fetch('/api/stocks/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symbols: ['RELIANCE.NS'] }),
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.data['RELIANCE.NS']).toBeDefined();
  });
});
```

---

## Future API Enhancements

Planned improvements:

- [ ] GraphQL endpoint for flexible queries
- [ ] WebSocket support for real-time price updates
- [ ] OpenAPI/Swagger specification
- [ ] API versioning (v2 endpoints)
- [ ] Enhanced rate limiting with Redis
- [ ] API key authentication for third-party integrations
- [ ] Webhook support for notifications

---

## Support

For API issues or questions:

- GitHub Issues: [technosaran/fin_dashboard](https://github.com/technosaran/fin_dashboard/issues)
- Email: support@fincore.example (if applicable)
