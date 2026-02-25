import { fetchWithTimeout } from './api';
import { logError } from '../utils/logger';

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:122.0) Gecko/20100101 Firefox/122.0',
];

/**
 * Scrapes Google Finance for a stock price
 * Note: Scraping is brittle but often more reliable for Indian stocks than public Yahoo endpoints
 */
export async function fetchGoogleFinancePrice(
  symbol: string,
  exchange: string = 'NSE'
): Promise<{ price: number; previousClose: number } | null> {
  const ticker = `${symbol}:${exchange}`;
  const url = `https://www.google.com/finance/quote/${ticker}`;
  const randomUA = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];

  try {
    const response = await fetchWithTimeout(
      url,
      {
        headers: {
          'User-Agent': randomUA,
          'Accept-Language': 'en-US,en;q=0.9',
          'Cache-Control': 'no-cache',
          Pragma: 'no-cache',
        },
      },
      8000
    );

    if (!response.ok) return null;

    const html = await response.text();

    let price = 0;
    let previousClose = 0;

    // 1. Try JSON-LD (Most reliable for the main entity)
    const jsonLdMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
    if (jsonLdMatch) {
      try {
        const jsonLd = JSON.parse(jsonLdMatch[1]);
        // JSON-LD can be a single object or an array
        const mainEntity = Array.isArray(jsonLd) ? jsonLd[0] : jsonLd;
        if (mainEntity.price) price = parseFloat(mainEntity.price);
        // Sometimes it's nested
        if (!price && mainEntity.mainEntity?.price) price = parseFloat(mainEntity.mainEntity.price);
      } catch (_e) {
        // ignore
      }
    }

    // 2. Fallback to specific regex patterns
    if (!price) {
      const metaPriceMatch = html.match(/<meta itemprop="price" content="([^"]+)"/);
      const lastPriceMatch = html.match(/data-last-price="([\d,.]+)"/);
      const classPriceMatch = html.match(/class="[^"]*YMlS7e[^"]*">([^<]+)<\/div>/);

      const priceStr = metaPriceMatch?.[1] || lastPriceMatch?.[1] || classPriceMatch?.[1];
      if (priceStr) {
        price = parseFloat(priceStr.replace(/,/g, '').replace(/[^\d.]/g, ''));
      }
    }

    // Extract Previous Close from Google Finance HTML
    // HTML structure: >Previous close</div><div class="tooltip">text</div></span><div class="P6K39c">₹2,573.70</div>
    // Class name changes periodically (was P639yc, now P6K39c), so use multiple known patterns:

    // 1. Current known class name P6K39c
    const labelPrevMatch = html.match(/>Previous close<\/div>[\s\S]*?class="P6K39c">([^<]+)</);
    // 2. Historical class name P639yc
    const labelPrevOld = html.match(/>Previous close<\/div>[\s\S]*?class="P639yc">([^<]+)</);
    // 3. JSON/data attribute patterns (other sources)
    const metaPrevMatch = html.match(/"?previousClose"?\s*:\s*"?([\d,.]+)"?/i);
    const lastCloseMatch = html.match(/data-last-close-price="([\d,.]+)"/);

    const prevStr =
      labelPrevMatch?.[1] || labelPrevOld?.[1] || metaPrevMatch?.[1] || lastCloseMatch?.[1];
    if (prevStr) {
      const parsed = parseFloat(prevStr.replace(/,/g, '').replace(/[^\d.]/g, ''));
      if (!isNaN(parsed) && parsed > 0) {
        previousClose = parsed;
      } else {
        previousClose = price;
      }
    } else {
      previousClose = price;
    }

    if (price > 0) {
      return { price, previousClose };
    }

    return null;
  } catch (error) {
    logError(`Google Finance fetch failed for ${ticker}:`, error);
    return null;
  }
}

/**
 * Batch fetch using parallel scraping - use sparingly
 */
export async function batchFetchGoogleFinance(
  symbols: string[]
): Promise<Record<string, { price: number; previousClose: number }>> {
  const results: Record<string, { price: number; previousClose: number }> = {};

  await Promise.all(
    symbols.map(async (symbol) => {
      try {
        let data = await fetchGoogleFinancePrice(symbol, 'NSE');
        if (!data) data = await fetchGoogleFinancePrice(symbol, 'BSE');

        if (data && data.price > 0) {
          results[symbol] = data;
        }
      } catch (err) {
        logError(`Batch item failed for ${symbol}:`, err);
      }
    })
  );

  return results;
}
