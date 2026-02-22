export interface ComicVolume {
  id: string;
  comicVineId: number;
  name: string;
  startYear: number | null;
  publisher: string | null;
  issueCount: number;
  imageUrl: string | null;
  description: string | null;
}

export interface ComicIssue {
  id: string;
  comicVineId: number;
  volumeId: string;
  volumeName: string;
  issueNumber: string;
  name: string | null;
  coverDate: string | null;
  imageUrl: string | null;
  description: string | null;
  characterIds: number[];
  characters?: string[];
  firstAppearanceCharacters?: string[];
  creators?: Array<{ name: string; role: string }>;
  teams?: string[];
  locations?: string[];
  concepts?: string[];
  storyArcs?: string[];
}

export interface Character {
  id: string;
  comicVineId: number;
  name: string;
  realName: string | null;
  publisher: string | null;
  imageUrl: string | null;
  description: string | null;
  firstAppearedInIssueId: number | null;
  issueCount: number;
}

export type KeyIssueCategory =
  | "first_appearance"
  | "first_cover"
  | "death"
  | "origin"
  | "major_storyline"
  | "key_crossover"
  | "last_issue"
  | "other";

export interface KeyIssue {
  id: string;
  volumeName: string;
  issueNumber: string;
  reason: string;
  category: KeyIssueCategory;
  significance: number;
  imageUrl: string | null;
  coverDate: string | null;
  comicVineIssueId: number | null;
}
