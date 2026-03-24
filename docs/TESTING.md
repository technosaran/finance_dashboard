# Testing Guide

This document outlines the testing strategy, standards, and conventions for the FINCORE project.

## Overview

The FINCORE application relies heavily on automated testing to ensure the correctness of calculations, stability of components, and expected behavior of the data access layer. We use **Jest** connected to the Next.js runtime, combined with **React Testing Library** for component testing.

## Running Tests

There are several ways to run the test suite:

- `npm run test` - Run all tests once.
- `npm run test:watch` - Run all tests in watch mode.
- `npm run test:ci` - Run all tests and generate a code coverage report.

## Test Structure

All tests are located in the `__tests__` directory at the root of the project.

- `__tests__/api/` - Tests for Next.js API routes.
- `__tests__/components/` - Tests for React components and context providers.
- `__tests__/hooks/` - Tests for custom React hooks.
- `__tests__/services/` - Tests for external API calls and integrations.
- `__tests__/utils/` - Tests for independent utility functions.
- `__tests__/validators/` - Tests for input and schema validation logic.

## Guidelines & Best Practices

1. **Isolation**: Tests should not rely on external services. Mock external APIs (e.g., Supabase, Yahoo Finance) using Jest's mocking capabilities.
2. **Setup and Teardown**: Use `beforeEach` to reset temporary data, clear mocks, and start with a clean state.
3. **Descriptive Names**: Use `describe` blocks to specify the module or component being tested, and `it`/`test` blocks to describe the expected outcome.
4. **Coverage**: While coverage is not the only metric for success, ensure that business logic (like calculations, validation patterns) is thoroughly tested with multiple inputs (including edge cases). Our CI strictly enforces coverage thresholds.

## Continuous Integration

Tests are automatically run upon any pull request to the `master` branch via GitHub Actions. A failing test will block the PR from being merged.
