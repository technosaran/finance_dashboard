/**
 * Centralized logging utility with sanitization for production
 * Prevents sensitive data from being logged in production
 */

import { isDevelopment } from '../config/env';

interface LogContext {
  [key: string]: unknown;
}

/**
 * Sanitize sensitive data from log context (recursive)
 */
function sanitizeContext(context?: LogContext): LogContext | undefined {
  if (!context) return undefined;

  const sensitiveKeys = ['password', 'token', 'secret', 'key', 'authorization', 'cookie', 'email'];
  const sanitized: LogContext = {};

  Object.entries(context).forEach(([key, value]) => {
    if (sensitiveKeys.some((sensitive) => key.toLowerCase().includes(sensitive))) {
      sanitized[key] = '[REDACTED]';
    } else if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      sanitized[key] = sanitizeContext(value as LogContext);
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map((item) =>
        item !== null && typeof item === 'object' ? sanitizeContext(item as LogContext) : item
      );
    } else {
      sanitized[key] = value;
    }
  });

  return sanitized;
}

/**
 * Log info message
 */
export function logInfo(message: string, context?: LogContext): void {
  if (isDevelopment) {
    const sanitizedContext = sanitizeContext(context);
    console.log(`[INFO] ${message}`, sanitizedContext || '');
  }
}

/**
 * Log warning message
 */
export function logWarn(message: string, context?: LogContext): void {
  const sanitizedContext = sanitizeContext(context);

  if (isDevelopment) {
    console.warn(`[WARN] ${message}`, sanitizedContext || '');
  }
  // In production, warnings are suppressed from the browser console
  // to prevent data leaks. Send to a monitoring service instead.
}

/**
 * Log error message
 */
export function logError(message: string, error?: Error | unknown, context?: LogContext): void {
  const sanitizedContext = sanitizeContext(context);

  if (isDevelopment) {
    console.error(`[ERROR] ${message}`, error || '', sanitizedContext || '');
  }
  // In production, errors are suppressed from the browser console
  // to prevent data leaks. Send to a monitoring service instead.
  // TODO: Send to Sentry or other monitoring service
  // Sentry.captureException(error, { contexts: { custom: sanitizedContext } });
}

/**
 * Log debug message (only in development)
 */
export function logDebug(message: string, context?: LogContext): void {
  if (isDevelopment) {
    const sanitizedContext = sanitizeContext(context);
    console.debug(`[DEBUG] ${message}`, sanitizedContext || '');
  }
}

/**
 * Create a logger instance with a specific prefix
 */
export function createLogger(prefix: string) {
  return {
    info: (message: string, context?: LogContext) => logInfo(`[${prefix}] ${message}`, context),
    warn: (message: string, context?: LogContext) => logWarn(`[${prefix}] ${message}`, context),
    error: (message: string, error?: Error | unknown, context?: LogContext) =>
      logError(`[${prefix}] ${message}`, error, context),
    debug: (message: string, context?: LogContext) => logDebug(`[${prefix}] ${message}`, context),
  };
}
