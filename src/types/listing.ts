export interface Listing {
  itemId: string;
  title: string;
  price: number;
  currency: string;
  shippingCost: number | null;
  totalPrice: number;
  condition: string | null;
  imageUrl: string | null;
  itemUrl: string;
  seller: string;
  sellerFeedbackScore: number | null;
  sellerFeedbackPercentage: number | null;
  buyingOptions: string[];
  listingDate: string;
  endDate: string | null;
  parsed: ParsedListingMeta;
  dealScore: DealScore | null;
}

export interface ParsedListingMeta {
  seriesName: string | null;
  issueNumber: string | null;
  grade: number | null;
  gradingCompany: "CGC" | "CBCS" | null;
  isVariant: boolean;
  variant: string | null;
  isReprint: boolean;
  keywords: string[];
  confidence: number;
}

export interface PriceHistory {
  volumeName: string;
  issueNumber: string;
  grade: number | null;
  soldListings: SoldListing[];
  averagePrice: number;
  medianPrice: number;
  minPrice: number;
  maxPrice: number;
  trendDirection: "up" | "down" | "stable";
  trendPercentage: number;
  dataPoints: number;
  periodDays: number;
}

export interface SoldListing {
  title: string;
  price: number;
  soldDate: string;
  condition: string | null;
  itemUrl: string;
}

export interface DealScore {
  score: number;
  percentBelowAverage: number;
  comparisonPrice: number;
  comparisonMethod: "average" | "median";
  confidence: number;
  reason: string;
  dataPoints: number;
}
