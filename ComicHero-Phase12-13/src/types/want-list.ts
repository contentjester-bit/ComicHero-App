import type { DealScore } from "./listing";

export interface WantListItem {
  id: string;
  volumeName: string;
  issueNumber: string;
  comicVineIssueId: number | null;
  targetMaxPrice: number;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastCheckedAt: string | null;
  matchCount: number;
}

export interface WantListMatch {
  id: string;
  wantListItemId: string;
  ebayItemId: string;
  title: string;
  price: number;
  totalPrice: number;
  imageUrl: string | null;
  itemUrl: string;
  dealScore: DealScore | null;
  percentBelow: number | null;
  foundAt: string;
  isNew: boolean;
}
