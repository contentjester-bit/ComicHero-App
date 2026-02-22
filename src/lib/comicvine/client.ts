const CV_BASE_URL = "https://comicvine.gamespot.com/api";

// Rate limiting: 200 requests per 15 minutes, minimum 1 second between requests
const MIN_INTERVAL_MS = 1100;
const MAX_REQUESTS_PER_WINDOW = 190; // Stay safely under 200
const WINDOW_MS = 15 * 60 * 1000;

let lastRequestTime = 0;
let requestsInWindow = 0;
let windowStart = Date.now();

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function enforceRateLimit(): Promise<void> {
  // Check window limit
  if (Date.now() - windowStart > WINDOW_MS) {
    requestsInWindow = 0;
    windowStart = Date.now();
  }
  if (requestsInWindow >= MAX_REQUESTS_PER_WINDOW) {
    const waitTime = WINDOW_MS - (Date.now() - windowStart);
    await sleep(waitTime);
    requestsInWindow = 0;
    windowStart = Date.now();
  }

  // Enforce minimum interval between requests
  const elapsed = Date.now() - lastRequestTime;
  if (elapsed < MIN_INTERVAL_MS) {
    await sleep(MIN_INTERVAL_MS - elapsed);
  }

  lastRequestTime = Date.now();
  requestsInWindow++;
}

export async function comicVineFetch<T>(
  resource: string,
  params: Record<string, string> = {}
): Promise<T> {
  const apiKey = process.env.COMIC_VINE_API_KEY;
  if (!apiKey) {
    throw new Error("Comic Vine API key not configured. Set COMIC_VINE_API_KEY.");
  }

  await enforceRateLimit();

  const url = new URL(`${CV_BASE_URL}/${resource}/`);
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("format", "json");
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const response = await fetch(url.toString(), {
    headers: {
      "User-Agent": "ComicHero/1.0",
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Comic Vine API error (${response.status}): ${body}`);
  }

  return response.json();
}
