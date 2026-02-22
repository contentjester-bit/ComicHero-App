const GCD_BASE_URL = "https://www.comics.org/api";

// Rate limiting - be respectful of GCD's free API
const MIN_INTERVAL_MS = 1500;
let lastRequestTime = 0;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function enforceRateLimit(): Promise<void> {
  const elapsed = Date.now() - lastRequestTime;
  if (elapsed < MIN_INTERVAL_MS) {
    await sleep(MIN_INTERVAL_MS - elapsed);
  }
  lastRequestTime = Date.now();
}

export async function gcdFetch<T>(path: string): Promise<T> {
  await enforceRateLimit();

  const url = `${GCD_BASE_URL}${path}`;
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "ComicHero/1.0",
    },
  });

  if (!response.ok) {
    throw new Error(`GCD API error (${response.status}): ${await response.text()}`);
  }

  return response.json();
}
