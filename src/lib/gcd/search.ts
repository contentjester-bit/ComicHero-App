import { gcdFetch } from "./client";
import type {
  GCDPaginatedResponse,
  GCDIssueListItem,
  GCDIssueInfo,
  GCDVariant,
} from "./types";

/**
 * Search GCD for issues by series name and issue number.
 * Returns all matches including variants.
 */
export async function searchGCDIssue(
  seriesName: string,
  issueNumber: string
): Promise<GCDIssueInfo[]> {
  const encodedName = encodeURIComponent(seriesName);
  const encodedNumber = encodeURIComponent(issueNumber);

  const data = await gcdFetch<GCDPaginatedResponse<GCDIssueListItem>>(
    `/series/name/${encodedName}/issue/${encodedNumber}/?format=json`
  );

  if (!data.results || data.results.length === 0) return [];

  // Group by parent issue (variants share a variant_of)
  const grouped = new Map<string, GCDIssueListItem[]>();

  for (const item of data.results) {
    // Only include English-language US editions by default
    // (filter on series_name patterns for now)
    const key = item.variant_of || item.api_url;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(item);
  }

  const results: GCDIssueInfo[] = [];

  for (const [parentUrl, items] of grouped) {
    const parent = items.find((i) => !i.variant_of) || items[0];
    const variants: GCDVariant[] = items
      .filter((i) => i.variant_of)
      .map((v) => ({
        gcdUrl: v.api_url,
        descriptor: v.descriptor,
        coverArtist: extractCoverArtist(v.descriptor),
        price: v.price && v.price !== "[none]" ? v.price : null,
        isVariant: true,
      }));

    results.push({
      seriesName: parent.series_name,
      issueDescriptor: parent.descriptor,
      publicationDate: parent.publication_date,
      coverPrice: parent.price && parent.price !== "[none]" ? parent.price : null,
      pageCount: parent.page_count ? parseFloat(parent.page_count) : null,
      variants,
      isVariant: !!parent.variant_of,
      parentIssueUrl: parent.variant_of,
    });
  }

  return results;
}

/**
 * Extract cover artist name from GCD descriptor
 * e.g. "12 [Nick Dragotta Cover]" → "Nick Dragotta"
 */
function extractCoverArtist(descriptor: string): string {
  const match = descriptor.match(/\[(.+?)(?:\s+(?:Cover|Variant|Edition))/i);
  return match ? match[1].trim() : "";
}

/**
 * Search GCD series by name
 */
export async function searchGCDSeries(
  seriesName: string
): Promise<
  Array<{
    name: string;
    yearBegan: number;
    issueCount: number;
    apiUrl: string;
    seriesUrl: string;
  }>
> {
  const encodedName = encodeURIComponent(seriesName);
  const data = await gcdFetch<GCDPaginatedResponse<GCDIssueListItem>>(
    `/series/name/${encodedName}/?format=json`
  );

  // GCD series endpoint returns differently, handle gracefully
  if (!data.results) return [];

  // Deduplicate by series URL
  const seen = new Set<string>();
  const results: Array<{
    name: string;
    yearBegan: number;
    issueCount: number;
    apiUrl: string;
    seriesUrl: string;
  }> = [];

  for (const item of data.results as unknown as Array<{
    api_url: string;
    series_name: string;
    year_began?: number;
    issue_count?: number;
  }>) {
    if (!seen.has(item.api_url)) {
      seen.add(item.api_url);
      results.push({
        name: item.series_name || "",
        yearBegan: item.year_began || 0,
        issueCount: item.issue_count || 0,
        apiUrl: item.api_url,
        seriesUrl: item.api_url.replace("/api/", "/"),
      });
    }
  }

  return results;
}
