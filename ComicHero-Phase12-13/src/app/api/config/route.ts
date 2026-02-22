import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ebayEnabled: !!(process.env.EBAY_CLIENT_ID && process.env.EBAY_CLIENT_SECRET),
    comicVineEnabled: !!process.env.COMIC_VINE_API_KEY,
  });
}
