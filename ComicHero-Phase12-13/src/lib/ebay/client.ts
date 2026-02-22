import type { EbayTokenResponse } from "./types";

const EBAY_AUTH_URL = "https://api.ebay.com/identity/v1/oauth2/token";
const EBAY_BROWSE_URL = "https://api.ebay.com/buy/browse/v1";
const EBAY_SANDBOX_AUTH_URL = "https://api.sandbox.ebay.com/identity/v1/oauth2/token";
const EBAY_SANDBOX_BROWSE_URL = "https://api.sandbox.ebay.com/buy/browse/v1";

let cachedToken: { accessToken: string; expiresAt: number } | null = null;

function getBaseUrls() {
  const useSandbox = process.env.EBAY_SANDBOX === "true";
  return {
    authUrl: useSandbox ? EBAY_SANDBOX_AUTH_URL : EBAY_AUTH_URL,
    browseUrl: useSandbox ? EBAY_SANDBOX_BROWSE_URL : EBAY_BROWSE_URL,
  };
}

async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt - 60_000) {
    return cachedToken.accessToken;
  }

  const clientId = process.env.EBAY_CLIENT_ID;
  const clientSecret = process.env.EBAY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("eBay API credentials not configured. Set EBAY_CLIENT_ID and EBAY_CLIENT_SECRET.");
  }

  const { authUrl } = getBaseUrls();
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const response = await fetch(authUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${credentials}`,
    },
    body: "grant_type=client_credentials&scope=https://api.ebay.com/oauth/api_scope",
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`eBay OAuth failed (${response.status}): ${body}`);
  }

  const data: EbayTokenResponse = await response.json();

  cachedToken = {
    accessToken: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };

  return cachedToken.accessToken;
}

export async function ebayFetch(
  path: string,
  params: Record<string, string> = {}
): Promise<Response> {
  const token = await getAccessToken();
  const { browseUrl } = getBaseUrls();
  const base = browseUrl.endsWith("/") ? browseUrl : `${browseUrl}/`;
  const relativePath = path.startsWith("/") ? path.slice(1) : path;
  const url = new URL(relativePath, base);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < 3; attempt++) {
    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${token}`,
        "X-EBAY-C-MARKETPLACE-ID": "EBAY_US",
        "Content-Type": "application/json",
      },
    });

    if (response.status === 429) {
      const backoff = Math.pow(2, attempt) * 1000;
      await new Promise((resolve) => setTimeout(resolve, backoff));
      lastError = new Error("Rate limited by eBay API");
      continue;
    }

    return response;
  }

  throw lastError || new Error("eBay API request failed after retries");
}
