import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

const VERIFICATION_TOKEN = process.env.EBAY_VERIFICATION_TOKEN || "ComicHeroApp2026VerificationTokenSecure9cb4";
const ENDPOINT_URL = process.env.EBAY_DELETION_ENDPOINT || "https://comic-hero-app.vercel.app/api/ebay/account-deletion";

export const dynamic = "force-dynamic";

// eBay sends a GET request to validate the endpoint
export async function GET(request: NextRequest) {
  const challengeCode = request.nextUrl.searchParams.get("challenge_code");
  
  if (!challengeCode) {
    return NextResponse.json({ error: "Missing challenge_code" }, { status: 400 });
  }

  // eBay expects: SHA-256 hash of challengeCode + verificationToken + endpoint URL
  const hash = crypto
    .createHash("sha256")
    .update(challengeCode + VERIFICATION_TOKEN + ENDPOINT_URL)
    .digest("hex");

  return new NextResponse(
    JSON.stringify({ challengeResponse: hash }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
}

// eBay sends POST with account deletion notifications
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("eBay account deletion notification:", JSON.stringify(body));
    return NextResponse.json({ status: "ok" }, { status: 200 });
  } catch {
    return NextResponse.json({ status: "ok" }, { status: 200 });
  }
}
