export interface MetronPaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface MetronIssue {
  id: number;
  publisher: { id: number; name: string };
  series: { id: number; name: string; sort_name: string; volume: number; year_began: number };
  number: string;
  name: string[];
  cover_date: string;
  store_date: string | null;
  price: string | null;
  sku: string | null;
  upc: string | null;
  page_count: number | null;
  desc: string | null;
  image: string | null;
  arcs: Array<{ id: number; name: string }>;
  credits: Array<{ id: number; creator: string; role: Array<{ id: number; name: string }> }>;
  characters: Array<{ id: number; name: string }>;
  teams: Array<{ id: number; name: string }>;
  reprints: Array<{ id: number; issue: string }>;
  variants: Array<{ name: string; sku: string; upc: string; image: string | null }>;
  cv_id: number | null; // Comic Vine ID — can cross-reference!
  resource_url: string;
  modified: string;
}

export interface MetronSeriesListItem {
  id: number;
  name: string;
  sort_name: string;
  volume: number;
  year_began: number;
  year_end: number | null;
  issue_count: number;
  modified: string;
}

// Mapped for our app
export interface MetronIssueInfo {
  metronId: number;
  comicVineId: number | null;
  seriesName: string;
  seriesVolume: number;
  issueNumber: string;
  publisher: string;
  coverDate: string;
  storeDate: string | null;
  price: string | null;
  pageCount: number | null;
  description: string | null;
  imageUrl: string | null;
  storyArcs: string[];
  characters: string[];
  teams: string[];
  credits: Array<{ creator: string; roles: string[] }>;
  variants: Array<{ name: string; imageUrl: string | null }>;
}
