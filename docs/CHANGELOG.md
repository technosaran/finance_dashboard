# Changelog

All notable changes to the FINCORE Digital Wealth Hub will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Root `SECURITY.md` and `CODE_OF_CONDUCT.md` files for better GitHub integration.
- `engines.node` specification in `package.json` to ensure Node.js >= 22.

### Changed
- Switched live price refresh mechanism from saving to the database to updating only the client state (React Context), significantly improving performance and reducing database load.
- Adjusted live price refresh interval from 1 minute to 5 minutes to balance data recency with API rate limits and client CPU usage.
- Halted live price polling when the browser tab is hidden using the Page Visibility API.
- Fixed CI triggers from `main` to `master` branch in `.github/workflows/ci.yml` and `codeql.yml`.
- Replaced development-only text in `ErrorBoundary.tsx` to prevent misleading users about monitoring.
- Defaults API request CORS policy back to `localhost:3000` when `NEXT_PUBLIC_APP_URL` isn't provided.

### Removed
- `TESTING.md` and `CHANGELOG.md` references in the README (added them as actual files instead).
- `@fontsource/inter` and `@fontsource/outfit` from `package.json` to stick to `next/font/google`.

## [0.1.0] - 2026-03-24

### Added
- Initial project release with Stocks, Mutual Funds, Bonds, F&O, Forex tracking.
- Row Level Security (RLS) policies set via Supabase migrations.
- Complete set of Jest test files covering components, hooks, api, and utils.
