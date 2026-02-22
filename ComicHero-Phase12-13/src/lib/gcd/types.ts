export interface GCDPaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface GCDSeriesListItem {
  api_url: string;
  series_name: string;
  year_began: number;
  year_ended: number | null;
  issue_count: number;
  publisher: string;
  country_code: string;
  language_code: string;
}

export interface GCDSeriesDetail {
  api_url: string;
  series_name: string;
  year_began: number;
  year_ended: number | null;
  issue_count: number;
  publisher: string;
  country_code: string;
  language_code: string;
  color: string;
  dimensions: string;
  paper_stock: string;
  binding: string;
  publishing_format: string;
  issue_descriptors: string[];
  issue_api_urls: string[];
}

export interface GCDIssueListItem {
  api_url: string;
  series_name: string;
  descriptor: string;
  publication_date: string;
  price: string;
  page_count: string | null;
  variant_of: string | null;
  series: string;
}

export interface GCDIssueDetail {
  api_url: string;
  series_name: string;
  descriptor: string;
  publication_date: string;
  price: string;
  page_count: string | null;
  variant_of: string | null;
  series: string;
  cover_url?: string;
  stories?: GCDStory[];
}

export interface GCDStory {
  title: string;
  type: string;
  credits: string;
  characters: string;
}

// Mapped types for our app
export interface GCDVariant {
  gcdUrl: string;
  descriptor: string;
  coverArtist: string;
  price: string | null;
  isVariant: boolean;
}

export interface GCDIssueInfo {
  seriesName: string;
  issueDescriptor: string;
  publicationDate: string;
  coverPrice: string | null;
  pageCount: number | null;
  variants: GCDVariant[];
  isVariant: boolean;
  parentIssueUrl: string | null;
}
