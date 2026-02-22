export interface CollectionItem {
  id: string;
  comicVineIssueId: number;
  comicVineVolumeId: number;
  volumeName: string;
  issueNumber: string;
  name: string | null;
  imageUrl: string | null;
  coverDate: string | null;
  condition: string | null;
  notes: string | null;
  pricePaid: number | null;
  addedAt: string;
}

export interface CollectionStats {
  totalIssues: number;
  totalVolumes: number;
  totalValue: number;
  recentlyAdded: CollectionItem[];
}

export interface VolumeCollectionStatus {
  volumeId: number;
  ownedIssueIds: number[];
  ownedCount: number;
}
