import { ebayFetch } from "./client";
import type { EbaySearchResponse, EbayItemSummary } from "./types";
import type { Listing } from "@/types/listing";
import type { IssueSearchParams, CharacterSearchParams } from "@/types/api";
import { parseListingTitle } from "@/lib/parser/listing-parser";

const COMIC_BOOKS_CATEGORY = "63";

function buildIssueQuery(volumeName: string, issueNumber: string): string {
  return `${volumeName} #${issueNumber} comic`;
}

function buildCharacterQuery(characterName: string): string {
  return `${characterName} comic book`;
}

function mapSortParam(sort?: string): string {
  switch (sort) {
    case "price_asc":
      return "price";
    case "price_desc":
      return "-price";
    case "date_newest":
      return "newlyListed";
    default:
      return "bestMatch";
  }
}

function mapEbayItemToListing(item: EbayItemSummary): Listing {
  const price = parseFloat(item.price.value);
  const shippingCost = item.shippingOptions?.[0]?.shippingCost
    ? parseFloat(item.shippingOptions[0].shippingCost.value)
    : null;

  return {
    itemId: item.itemId,
    title: item.title,
    price,
    currency: item.price.currency,
    shippingCost,
    totalPrice: price + (shippingCost ?? 0),
    condition: item.condition || null,
    imageUrl: item.image?.imageUrl || null,
    itemUrl: item.itemWebUrl,
    seller: item.seller.username,
    sellerFeedbackScore: item.seller.feedbackScore,
    sellerFeedbackPercentage: parseFloat(item.seller.feedbackPercentage) || null,
    buyingOptions: item.buyingOptions || [],
    listingDate: item.itemCreationDate || new Date().toISOString(),
    endDate: item.itemEndDate || null,
    parsed: parseListingTitle(item.title),
    dealScore: null,
  };
}

export async function searchByIssue(params: IssueSearchParams): Promise<{
  listings: Listing[];
  total: number;
}> {
  const q = buildIssueQuery(params.volumeName, params.issueNumber);

  const filters: string[] = [];
  if (params.maxPrice) {
    filters.push(`price:[..${params.maxPrice}]`);
    filters.push("priceCurrency:USD");
  }

  const queryParams: Record<string, string> = {
    q,
    category_ids: COMIC_BOOKS_CATEGORY,
    limit: String(params.limit ?? 50),
    offset: String(params.offset ?? 0),
    sort: mapSortParam(params.sort),
  };

  if (filters.length > 0) {
    queryParams.filter = filters.join(",");
  }

  const response = await ebayFetch("/item_summary/search", queryParams);

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`eBay search failed (${response.status}): ${body}`);
  }

  const data: EbaySearchResponse = await response.json();

  return {
    listings: (data.itemSummaries || []).map(mapEbayItemToListing),
    total: data.total || 0,
  };
}

export async function searchByCharacter(params: CharacterSearchParams): Promise<{
  listings: Listing[];
  total: number;
}> {
  const q = buildCharacterQuery(params.characterName);

  const filters: string[] = [];
  if (params.maxPrice) {
    filters.push(`price:[..${params.maxPrice}]`);
    filters.push("priceCurrency:USD");
  }

  const queryParams: Record<string, string> = {
    q,
    category_ids: COMIC_BOOKS_CATEGORY,
    limit: String(params.limit ?? 50),
    offset: String(params.offset ?? 0),
    sort: mapSortParam(params.sort),
  };

  if (filters.length > 0) {
    queryParams.filter = filters.join(",");
  }

  const response = await ebayFetch("/item_summary/search", queryParams);

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`eBay character search failed (${response.status}): ${body}`);
  }

  const data: EbaySearchResponse = await response.json();

  return {
    listings: (data.itemSummaries || []).map(mapEbayItemToListing),
    total: data.total || 0,
  };
}

export async function getItemDetail(itemId: string): Promise<Listing | null> {
  const response = await ebayFetch(`/item/${itemId}`, {});

  if (!response.ok) {
    if (response.status === 404) return null;
    const body = await response.text();
    throw new Error(`eBay item detail failed (${response.status}): ${body}`);
  }

  const item: EbayItemSummary = await response.json();
  return mapEbayItemToListing(item);
}
