import type { Listing, PriceHistory, DealScore } from "@/types/listing";

export function scoreDeal(
  listing: Listing,
  priceHistory: PriceHistory | null
): DealScore {
  if (!priceHistory || priceHistory.dataPoints < 3) {
    return {
      score: 50,
      percentBelowAverage: 0,
      comparisonPrice: 0,
      comparisonMethod: "median",
      confidence: 0,
      reason: "Insufficient price history data to evaluate this deal.",
      dataPoints: priceHistory?.dataPoints ?? 0,
    };
  }

  const comparisonPrice = priceHistory.medianPrice;
  const listingTotalPrice = listing.totalPrice;

  const percentBelow =
    ((comparisonPrice - listingTotalPrice) / comparisonPrice) * 100;

  // Score: 50 = at median, 100 = 50%+ below, 0 = 50%+ above
  let score = 50 + percentBelow;
  score = Math.max(0, Math.min(100, score));

  // Confidence based on data volume
  let confidence = Math.min(1, priceHistory.dataPoints / 20);
  // Reduce confidence if listing has grade info but our history doesn't
  if (listing.parsed.grade && priceHistory.grade === null) {
    confidence *= 0.6;
  }

  let reason: string;
  if (percentBelow >= 30) {
    reason = `Excellent deal: ${Math.round(percentBelow)}% below the recent median of $${comparisonPrice.toFixed(2)}.`;
  } else if (percentBelow >= 15) {
    reason = `Good deal: ${Math.round(percentBelow)}% below the recent median of $${comparisonPrice.toFixed(2)}.`;
  } else if (percentBelow >= 0) {
    reason = `Fair price: roughly in line with the recent median of $${comparisonPrice.toFixed(2)}.`;
  } else {
    reason = `Above average: ${Math.round(Math.abs(percentBelow))}% above the recent median of $${comparisonPrice.toFixed(2)}.`;
  }

  return {
    score: Math.round(score),
    percentBelowAverage: Math.round(percentBelow),
    comparisonPrice,
    comparisonMethod: "median",
    confidence,
    reason,
    dataPoints: priceHistory.dataPoints,
  };
}
