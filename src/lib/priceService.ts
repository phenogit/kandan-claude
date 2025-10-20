// src/lib/priceService.ts
import * as cheerio from "cheerio";

interface StockPrice {
  ticker: string;
  price: number;
  dailyHigh: number;
  dailyLow: number;
  source: "yahoo_tw" | "finnhub";
  timestamp: string;
}

/**
 * Fetch stock price from Yahoo Taiwan
 * Primary data source for Taiwan stocks
 */
async function fetchYahooTaiwanPrice(ticker: string): Promise<StockPrice> {
  const url = `https://tw.stock.yahoo.com/quote/${ticker}.TW`;

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    if (!response.ok) {
      throw new Error(`Yahoo Taiwan returned ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Yahoo Taiwan price selectors (these may change - monitor regularly)
    // Current price is usually in a large font div
    const priceText = $('span[class*="Fz(32px)"]').first().text().trim();

    // High/Low are in the price detail section
    const highText = $('span:contains("最高")').next().text().trim();
    const lowText = $('span:contains("最低")').next().text().trim();

    const price = parseFloat(priceText.replace(/,/g, ""));
    const dailyHigh = parseFloat(highText.replace(/,/g, ""));
    const dailyLow = parseFloat(lowText.replace(/,/g, ""));

    if (isNaN(price) || isNaN(dailyHigh) || isNaN(dailyLow)) {
      throw new Error("Failed to parse price data from Yahoo Taiwan");
    }

    return {
      ticker,
      price,
      dailyHigh,
      dailyLow,
      source: "yahoo_tw",
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error(`Yahoo Taiwan fetch failed for ${ticker}:`, error);
    throw error;
  }
}

/**
 * Fetch stock price from Finnhub API
 * Backup data source
 */
async function fetchFinnhubPrice(ticker: string): Promise<StockPrice> {
  const apiKey = process.env.FINNHUB_API_KEY;

  if (!apiKey) {
    throw new Error("FINNHUB_API_KEY not configured");
  }

  const symbol = `${ticker}.TW`;
  const url = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${apiKey}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Finnhub returned ${response.status}`);
    }

    const data = await response.json();

    // Finnhub returns: c (current), h (high), l (low), o (open), pc (previous close)
    if (!data.c || data.c === 0) {
      throw new Error("No data available from Finnhub");
    }

    return {
      ticker,
      price: data.c,
      dailyHigh: data.h,
      dailyLow: data.l,
      source: "finnhub",
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error(`Finnhub fetch failed for ${ticker}:`, error);
    throw error;
  }
}

/**
 * Fetch stock price with fallback strategy
 * Tries Yahoo Taiwan first, falls back to Finnhub
 */
export async function fetchStockPrice(ticker: string): Promise<StockPrice> {
  // Try Yahoo Taiwan first (primary source)
  try {
    console.log(`Fetching price for ${ticker} from Yahoo Taiwan...`);
    const price = await fetchYahooTaiwanPrice(ticker);
    console.log(`✅ Yahoo Taiwan: ${ticker} = $${price.price}`);
    return price;
  } catch (yahooError) {
    console.warn(`Yahoo Taiwan failed for ${ticker}, trying Finnhub...`);

    // Fallback to Finnhub
    try {
      const price = await fetchFinnhubPrice(ticker);
      console.log(`✅ Finnhub: ${ticker} = $${price.price}`);
      return price;
    } catch (finnhubError) {
      console.error(`All price sources failed for ${ticker}`);
      throw new Error(`Failed to fetch price for ${ticker} from all sources`);
    }
  }
}

/**
 * Fetch multiple stock prices in parallel
 */
export async function fetchMultipleStockPrices(
  tickers: string[]
): Promise<Map<string, StockPrice>> {
  const results = new Map<string, StockPrice>();

  const promises = tickers.map(async (ticker) => {
    try {
      const price = await fetchStockPrice(ticker);
      results.set(ticker, price);
    } catch (error) {
      console.error(`Failed to fetch price for ${ticker}:`, error);
      // Don't add to results if failed
    }
  });

  await Promise.all(promises);
  return results;
}
