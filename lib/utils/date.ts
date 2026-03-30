/**
 * Date utility functions
 */

/**
 * Format date to a consistent, human-readable string.
 *
 * All display dates use the same locale (`en-GB`) so they render as:
 *   "24 Mar 2026"  (short / medium – day numeric, month short, year numeric)
 *   "Monday, 24 March 2026"  (long – includes weekday)
 *
 * Using `en-GB` avoids the comma-separated US format ("Mar 24, 2026") and the
 * slash-separated ISO ambiguity ("26/2/2026") – finance UIs need unambiguous dates.
 */
export function formatDate(
  date: string | Date,
  format: 'short' | 'long' | 'medium' = 'medium'
): string {
  const d = typeof date === 'string' ? new Date(date) : date;

  const formatOptions: Record<string, Intl.DateTimeFormatOptions> = {
    // "24 Mar 2026"
    short: { day: 'numeric', month: 'short', year: 'numeric' },
    // "24 Mar 2026"
    medium: { day: 'numeric', month: 'short', year: 'numeric' },
    // "Monday, 24 March 2026"
    long: { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' },
  };

  return d.toLocaleDateString('en-GB', formatOptions[format]);
}

/**
 * Format date for input fields (YYYY-MM-DD)
 */
export function formatDateForInput(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString().split('T')[0];
}

/**
 * Get relative time string (e.g., "2 days ago")
 */
export function getRelativeTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const diffWeek = Math.floor(diffDay / 7);
  const diffMonth = Math.floor(diffDay / 30);
  const diffYear = Math.floor(diffDay / 365);

  if (diffYear > 0) return `${diffYear} year${diffYear > 1 ? 's' : ''} ago`;
  if (diffMonth > 0) return `${diffMonth} month${diffMonth > 1 ? 's' : ''} ago`;
  if (diffWeek > 0) return `${diffWeek} week${diffWeek > 1 ? 's' : ''} ago`;
  if (diffDay > 0) return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
  if (diffHour > 0) return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
  if (diffMin > 0) return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
  return 'Just now';
}

/**
 * Check if date is in the past
 */
export function isDateInPast(date: string | Date): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d < new Date();
}

/**
 * Check if date is today
 */
export function isToday(date: string | Date): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  return (
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear()
  );
}

/**
 * Get days until date
 */
export function getDaysUntil(date: string | Date): number {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Get current financial year
 */
export function getCurrentFY(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // getMonth() returns 0-11, convert to 1-12

  if (month >= 4) {
    return `FY ${year}-${year + 1}`;
  } else {
    return `FY ${year - 1}-${year}`;
  }
}
