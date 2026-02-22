/**
 * Metron Comic Book Database API Client
 * https://metron.cloud
 * Auth: Basic Auth with username/password
 * Rate limit: Be respectful of this free community resource
 */

const METRON_BASE_URL = "https://metron.cloud/api";
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

function getAuthHeader(): string | null {
  const username = process.env.METRON_USERNAME;
  const password = process.env.METRON_PASSWORD;
  if (!username || !password) return null;
  const credentials = Buffer.from(`${username}:${password}`).toString("base64");
  return `Basic ${credentials}`;
}

export async function metronFetch<T>(path: string): Promise<T | null> {
  const auth = getAuthHeader();
  if (!auth) {
    console.warn("Metron API: METRON_USERNAME and METRON_PASSWORD not set, skipping");
    return null;
  }

  await enforceRateLimit();

  const url = `${METRON_BASE_URL}${path}`;
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: auth,
      "User-Agent": "ComicHero/1.0",
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      console.error("Metron API: Authentication failed. Check METRON_USERNAME/METRON_PASSWORD.");
    }
    throw new Error(`Metron API error (${response.status}): ${await response.text()}`);
  }

  return response.json();
}
