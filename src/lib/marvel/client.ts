/**
 * Marvel Comics API Client
 * https://developer.marvel.com
 * Auth: ts + apikey + hash(ts + privateKey + publicKey)
 * Rate limit: 3000 calls/day
 */
import crypto from "crypto";

const MARVEL_BASE_URL = "https://gateway.marvel.com/v1/public";
const MIN_INTERVAL_MS = 1000;
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

function getAuthParams(): URLSearchParams | null {
  const publicKey = process.env.MARVEL_PUBLIC_KEY;
  const privateKey = process.env.MARVEL_PRIVATE_KEY;
  if (!publicKey || !privateKey) return null;

  const ts = Date.now().toString();
  const hash = crypto.createHash("md5").update(ts + privateKey + publicKey).digest("hex");

  return new URLSearchParams({
    ts,
    apikey: publicKey,
    hash,
  });
}

export async function marvelFetch<T>(path: string, extraParams?: URLSearchParams): Promise<T | null> {
  const authParams = getAuthParams();
  if (!authParams) {
    console.warn("Marvel API: MARVEL_PUBLIC_KEY and MARVEL_PRIVATE_KEY not set, skipping");
    return null;
  }

  await enforceRateLimit();

  // Merge auth params with extra params
  if (extraParams) {
    extraParams.forEach((value, key) => authParams.set(key, value));
  }

  const url = `${MARVEL_BASE_URL}${path}?${authParams.toString()}`;
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "ComicHero/1.0",
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      console.error("Marvel API: Authentication failed. Check MARVEL_PUBLIC_KEY/MARVEL_PRIVATE_KEY.");
    }
    throw new Error(`Marvel API error (${response.status}): ${await response.text()}`);
  }

  return response.json();
}
