import type { KeyIssueCategory } from "./comic";

export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: string | null;
  meta?: {
    total: number;
    offset: number;
    limit: number;
    cached: boolean;
    cacheAge?: number;
  };
}

export interface IssueSearchParams {
  volumeName: string;
  issueNumber: string;
  maxPrice?: number;
  sort?: "price_asc" | "price_desc" | "date_newest" | "best_match";
  limit?: number;
  offset?: number;
}

export interface CharacterSearchParams {
  characterName: string;
  maxPrice?: number;
  sort?: string;
  limit?: number;
  offset?: number;
}

export interface KeyIssueSearchParams {
  query?: string;
  category?: KeyIssueCategory;
  characterId?: number;
  limit?: number;
  offset?: number;
}
