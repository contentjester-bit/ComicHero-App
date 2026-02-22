import { NextRequest, NextResponse } from "next/server";
import type { ApiResponse } from "@/types/api";

interface PriceCheckRequest {
  volumeName: string;
  issueNumber: string;
  condition?: string;
}

interface PriceData {
  averagePrice: number;
  medianPrice: number;
  lowestPrice: number;
  highestPrice: number;
  recentSales: Array<{
    title: string;
    price: number;
    condition: string;
    soldDate: string;
    url: string;
  }>;
  totalSales: number;
  priceRange: string;
  suggestedPrice: number;
  marketVelocity: string; // "Fast", "Medium", "Slow"
}

export async function POST(request: NextRequest) {
  try {
    const { volumeName, issueNumber, condition }: PriceCheckRequest = await request.json();

    // Build eBay search query
    const searchQuery = `${volumeName} ${issueNumber} comic ${condition || ""}`.trim();
    
    // Check if eBay API is configured
    if (!process.env.EBAY_CLIENT_ID || !process.env.EBAY_CLIENT_SECRET) {
      return NextResponse.json({
        success: false,
        data: null,
        error: "eBay API not configured. Add EBAY_CLIENT_ID and EBAY_CLIENT_SECRET to environment variables.",
      } as ApiResponse<null>, { status: 400 });
    }

    // Get eBay OAuth token
    const tokenResponse = await fetch("https://api.ebay.com/identity/v1/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": `Basic ${Buffer.from(`${process.env.EBAY_CLIENT_ID}:${process.env.EBAY_CLIENT_SECRET}`).toString("base64")}`,
      },
      body: "grant_type=client_credentials&scope=https://api.ebay.com/oauth/api_scope",
    });

    if (!tokenResponse.ok) {
      throw new Error("Failed to get eBay access token");
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Search for sold listings
    const searchUrl = new URL("https://api.ebay.com/buy/browse/v1/item_summary/search");
    searchUrl.searchParams.set("q", searchQuery);
    searchUrl.searchParams.set("filter", "buyingOptions:{FIXED_PRICE|AUCTION},conditions:{USED},itemEndDate:[2024-01-01T00:00:00.000Z..],soldItemsOnly:true");
    searchUrl.searchParams.set("sort", "price");
    searchUrl.searchParams.set("limit", "50");

    const searchResponse = await fetch(searchUrl.toString(), {
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "X-EBAY-C-MARKETPLACE-ID": "EBAY_US",
      },
    });

    if (!searchResponse.ok) {
      throw new Error(`eBay search failed: ${searchResponse.statusText}`);
    }

    const searchData = await searchResponse.json();
    const items = searchData.itemSummaries || [];

    if (items.length === 0) {
      return NextResponse.json({
        success: false,
        data: null,
        error: "No recent sales found for this comic",
      } as ApiResponse<null>, { status: 404 });
    }

    // Extract prices
    const prices = items.map((item: any) => parseFloat(item.price.value));
    const sortedPrices = prices.sort((a: number, b: number) => a - b);
    
    const averagePrice = prices.reduce((a: number, b: number) => a + b, 0) / prices.length;
    const medianPrice = sortedPrices[Math.floor(sortedPrices.length / 2)];
    const lowestPrice = sortedPrices[0];
    const highestPrice = sortedPrices[sortedPrices.length - 1];

    // Get recent sales details
    const recentSales = items.slice(0, 10).map((item: any) => ({
      title: item.title,
      price: parseFloat(item.price.value),
      condition: item.condition || "Unknown",
      soldDate: item.itemEndDate || "Unknown",
      url: item.itemWebUrl,
    }));

    // Calculate market velocity (how fast items sell)
    const daysSinceOldestSale = items.length > 0 
      ? Math.floor((Date.now() - new Date(items[items.length - 1].itemEndDate).getTime()) / (1000 * 60 * 60 * 24))
      : 30;
    const salesPerDay = items.length / daysSinceOldestSale;
    const marketVelocity = salesPerDay > 2 ? "Fast" : salesPerDay > 0.5 ? "Medium" : "Slow";

    // Suggested price (slightly below median for quick sale)
    const suggestedPrice = Math.round(medianPrice * 0.95);

    const priceData: PriceData = {
      averagePrice: Math.round(averagePrice * 100) / 100,
      medianPrice: Math.round(medianPrice * 100) / 100,
      lowestPrice: Math.round(lowestPrice * 100) / 100,
      highestPrice: Math.round(highestPrice * 100) / 100,
      recentSales,
      totalSales: items.length,
      priceRange: `$${lowestPrice.toFixed(2)} - $${highestPrice.toFixed(2)}`,
      suggestedPrice,
      marketVelocity,
    };

    const response: ApiResponse<PriceData> = {
      success: true,
      data: priceData,
      error: null,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Price check error:", error);
    const response: ApiResponse<null> = {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : "Failed to check prices",
    };
    return NextResponse.json(response, { status: 500 });
  }
}
