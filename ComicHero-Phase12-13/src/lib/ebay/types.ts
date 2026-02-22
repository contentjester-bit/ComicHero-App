export interface EbayTokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

export interface EbaySearchResponse {
  href: string;
  total: number;
  next: string;
  limit: number;
  offset: number;
  itemSummaries?: EbayItemSummary[];
}

export interface EbayItemSummary {
  itemId: string;
  title: string;
  price: {
    value: string;
    currency: string;
  };
  shippingOptions?: Array<{
    shippingCostType: string;
    shippingCost?: {
      value: string;
      currency: string;
    };
  }>;
  condition: string;
  conditionId: string;
  image?: {
    imageUrl: string;
  };
  itemWebUrl: string;
  seller: {
    username: string;
    feedbackScore: number;
    feedbackPercentage: string;
  };
  buyingOptions: string[];
  itemCreationDate?: string;
  itemEndDate?: string;
  categories?: Array<{
    categoryId: string;
    categoryName: string;
  }>;
}

export interface EbayItemDetail extends EbayItemSummary {
  description: string;
  shortDescription?: string;
  itemLocation: {
    city: string;
    stateOrProvince: string;
    country: string;
  };
  additionalImages?: Array<{
    imageUrl: string;
  }>;
}
