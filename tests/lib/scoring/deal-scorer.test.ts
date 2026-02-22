import { describe, it, expect } from "vitest";
import { scoreDeal } from "@/lib/scoring/deal-scorer";
import type { Listing, PriceHistory } from "@/types/listing";

function makeListing(overrides: Partial<Listing> = {}): Listing {
  return {
    itemId: "test-123",
    title: "Test Comic #1",
    price: 100,
    currency: "USD",
    shippingCost: 0,
    totalPrice: 100,
    condition: null,
    imageUrl: null,
    itemUrl: "https://example.com",
    seller: "test-seller",
    sellerFeedbackScore: 100,
    sellerFeedbackPercentage: 99.5,
    buyingOptions: ["FIXED_PRICE"],
    listingDate: new Date().toISOString(),
    endDate: null,
    parsed: {
      seriesName: "Test Comic",
      issueNumber: "1",
      grade: null,
      gradingCompany: null,
      isVariant: false,
      variant: null,
      isReprint: false,
      keywords: [],
      confidence: 0.8,
    },
    dealScore: null,
    ...overrides,
  };
}

function makePriceHistory(overrides: Partial<PriceHistory> = {}): PriceHistory {
  return {
    volumeName: "Test Comic",
    issueNumber: "1",
    grade: null,
    soldListings: [],
    averagePrice: 150,
    medianPrice: 140,
    minPrice: 80,
    maxPrice: 300,
    trendDirection: "stable",
    trendPercentage: 0,
    dataPoints: 20,
    periodDays: 90,
    ...overrides,
  };
}

describe("scoreDeal", () => {
  it("returns neutral score with insufficient data", () => {
    const listing = makeListing();
    const result = scoreDeal(listing, null);
    expect(result.score).toBe(50);
    expect(result.confidence).toBe(0);
    expect(result.reason).toContain("Insufficient");
  });

  it("returns neutral score with too few data points", () => {
    const listing = makeListing();
    const priceHistory = makePriceHistory({ dataPoints: 2 });
    const result = scoreDeal(listing, priceHistory);
    expect(result.score).toBe(50);
    expect(result.confidence).toBe(0);
  });

  it("scores an excellent deal correctly", () => {
    const listing = makeListing({ price: 70, shippingCost: 0, totalPrice: 70 });
    const priceHistory = makePriceHistory({ medianPrice: 140 });
    const result = scoreDeal(listing, priceHistory);
    expect(result.score).toBe(100);
    expect(result.percentBelowAverage).toBe(50);
    expect(result.reason).toContain("Excellent");
  });

  it("scores a good deal correctly", () => {
    const listing = makeListing({ price: 112, shippingCost: 0, totalPrice: 112 });
    const priceHistory = makePriceHistory({ medianPrice: 140 });
    const result = scoreDeal(listing, priceHistory);
    expect(result.percentBelowAverage).toBe(20);
    expect(result.reason).toContain("Good");
  });

  it("scores a fair price correctly", () => {
    const listing = makeListing({ price: 135, shippingCost: 0, totalPrice: 135 });
    const priceHistory = makePriceHistory({ medianPrice: 140 });
    const result = scoreDeal(listing, priceHistory);
    expect(result.reason).toContain("Fair");
  });

  it("scores an above-average listing", () => {
    const listing = makeListing({ price: 200, shippingCost: 0, totalPrice: 200 });
    const priceHistory = makePriceHistory({ medianPrice: 140 });
    const result = scoreDeal(listing, priceHistory);
    expect(result.percentBelowAverage).toBeLessThan(0);
    expect(result.reason).toContain("Above");
  });

  it("includes shipping in total price comparison", () => {
    const listing = makeListing({
      price: 90,
      shippingCost: 20,
      totalPrice: 110,
    });
    const priceHistory = makePriceHistory({ medianPrice: 140 });
    const result = scoreDeal(listing, priceHistory);
    // (140 - 110) / 140 = 21.4%
    expect(result.percentBelowAverage).toBeGreaterThan(20);
  });

  it("reduces confidence when listing has grade but history does not", () => {
    const listing = makeListing({
      parsed: {
        seriesName: "Test",
        issueNumber: "1",
        grade: 9.4,
        gradingCompany: "CGC",
        isVariant: false,
        variant: null,
        isReprint: false,
        keywords: [],
        confidence: 0.9,
      },
    });
    const priceHistory = makePriceHistory({ grade: null, dataPoints: 20 });
    const result = scoreDeal(listing, priceHistory);
    expect(result.confidence).toBeLessThan(1);
    // 20/20 = 1.0, then * 0.6 = 0.6
    expect(result.confidence).toBeCloseTo(0.6, 1);
  });
});
