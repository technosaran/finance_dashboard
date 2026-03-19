# Changelog

All notable changes to FINCORE will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Production deployment guide (PRODUCTION_DEPLOYMENT.md)
- Comprehensive API documentation (API.md)
- Architecture documentation with diagrams (ARCHITECTURE.md)
- Database schema documentation (DATABASE.md)
- Developer guide with common tasks (DEVELOPER_GUIDE.md)
- Code of Conduct
- Testing strategy documentation
- JSDoc comments for key utilities and components

### Enhanced

- README.md with clearer setup instructions
- CONTRIBUTING.md with more detailed examples
- Security documentation

### Fixed

- **Critical**: Build error caused by Google Fonts network fetch failure during production builds (removed `next/font/google`).
- **Performance**: Optimized batch stock fetching in `stock-fetcher.ts` and added API chunking for both stocks and mutual funds.
- **Memory**: Added hard limit and FIFO eviction to in-memory rate limiter to prevent leaks.
- **Compatibility**: Enhanced Bond quote API to support both `isin` and `symbol` parameters.
- **Linting**: Fixed all ESLint warnings including unused `RefreshCw` import in `Dashboard.tsx`.
- **Quality**: Implemented recursive log sanitization for sensitive data in nested objects.
- **Type Safety**: Replaced legacy `any` types with proper definitions across the codebase.

### Security

- **Vulnerability**: Patched CSRF bypass in Next.js Server Actions by upgrading to `@latest` (16.2.0+).
- **Vulnerability**: Fixed ReDoS vulnerabilities in `ajv` and `minimatch` via `npm audit fix`.
- **Quality**: Verified 100% clean check with `npx eslint . --max-warnings 0`.

---

## [0.2.0] - 2026-02-14

### Added

- Forex transactions tracking
- Bonds portfolio management with ISIN search
- F&O (Futures & Options) trading terminal
- Enhanced charge calculations for Zerodha brokerage
- CSV export functionality for ledger
- Watchlist feature for tracking stocks
- Family transfers tracking
- Goal progress visualization

### Enhanced

- Stock price refresh optimization with batch API calls
- Mutual fund NAV integration improvements
- Dashboard UI with better charts (Recharts)
- Error handling and loading states
- Mobile responsiveness

### Fixed

- Stock transaction charge calculation accuracy
- Mutual fund NAV update timing issues
- Authentication redirect loops
- Database query performance

### Security

- Row-Level Security (RLS) policies enforced on all tables
- Input validation for all user inputs
- API key protection via server-side routes
- CORS configuration

---

## [0.1.0] - 2026-01-15

### Added

- Initial release
- User authentication via Supabase
- Dashboard with net worth tracking
- Account management (bank accounts, wallets)
- Transaction ledger with categories
- Stock portfolio tracking
- Mutual fund portfolio tracking
- Live price updates (Yahoo Finance, MFAPI)
- Dark theme UI
- Responsive design

### Technical Stack

- Next.js 16 with App Router
- React 19
- TypeScript (strict mode)
- Supabase (PostgreSQL + Auth)
- Recharts for data visualization
- Lucide React for icons

---

## Version History

### Version Numbering

FINCORE follows semantic versioning (MAJOR.MINOR.PATCH):

- **MAJOR**: Breaking changes or significant architectural changes
- **MINOR**: New features, backward-compatible
- **PATCH**: Bug fixes and minor improvements

### Release Schedule

- **Major releases**: Every 6-12 months
- **Minor releases**: Monthly or as features are completed
- **Patch releases**: As needed for critical bugs

---

## Upgrade Guide

### Upgrading from 0.1.0 to 0.2.0

**Database Changes**:

```sql
-- Add new tables (run in Supabase SQL editor)
CREATE TABLE bonds (...);
CREATE TABLE fno_trades (...);
CREATE TABLE forex_transactions (...);
CREATE TABLE watchlist (...);
-- See DATABASE.md for full schema
```

**Code Changes**:

- Update `FinanceContext` import paths if customized
- Review API endpoint changes in API.md
- Update environment variables if using new features

**No Breaking Changes**: All 0.1.0 features remain compatible

---

## Future Roadmap

### Planned for 0.3.0

- [ ] Real-time price updates via WebSocket
- [ ] Mobile app (React Native)
- [ ] Advanced analytics and reports
- [ ] Portfolio optimization suggestions
- [ ] Tax calculation and reporting
- [ ] Multi-currency support
- [ ] Shared portfolios (family accounts)

### Planned for 0.4.0

- [ ] Machine learning-based insights
- [ ] Price alerts and notifications
- [ ] Integration with brokers (Zerodha, Upstox)
- [ ] Automatic transaction import
- [ ] PDF report generation
- [ ] Backup and restore functionality

### Long-term Vision (1.0.0)

- [ ] Full-featured financial planning
- [ ] Retirement planning calculator
- [ ] Insurance tracking
- [ ] Loan and EMI management
- [ ] Business intelligence dashboard
- [ ] API for third-party integrations
- [ ] White-label solution for institutions

---

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for how to contribute to FINCORE.

## Links

- **Repository**: https://github.com/technosaran/fin_dashboard
- **Issues**: https://github.com/technosaran/fin_dashboard/issues
- **Documentation**: See README.md and docs/ directory

---

## Notes

- All dates in YYYY-MM-DD format
- All monetary values in INR unless specified
- All times in UTC unless specified
- Breaking changes are clearly marked with ⚠️ **BREAKING**
