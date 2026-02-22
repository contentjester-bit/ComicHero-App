export interface CVApiResponse<T> {
  error: string;
  limit: number;
  offset: number;
  number_of_page_results: number;
  number_of_total_results: number;
  status_code: number;
  results: T;
}

export interface CVCharacter {
  id: number;
  name: string;
  real_name: string | null;
  publisher?: {
    id: number;
    name: string;
  };
  image?: {
    icon_url: string;
    medium_url: string;
    screen_url: string;
    small_url: string;
    super_url: string;
    thumb_url: string;
    tiny_url: string;
    original_url: string;
  };
  deck: string | null;
  first_appeared_in_issue?: {
    id: number;
    name: string;
    issue_number: string;
  };
  count_of_issue_appearances: number;
  issue_credits?: Array<{
    id: number;
    name: string;
    issue_number: string;
  }>;
}

export interface CVVolume {
  id: number;
  name: string;
  start_year: string | null;
  publisher?: {
    id: number;
    name: string;
  };
  count_of_issues: number;
  image?: {
    medium_url: string;
    super_url: string;
    thumb_url: string;
    original_url: string;
  };
  deck: string | null;
}

export interface CVIssue {
  id: number;
  name: string | null;
  issue_number: string;
  volume: {
    id: number;
    name: string;
  };
  cover_date: string | null;
  image?: {
    medium_url: string;
    super_url: string;
    thumb_url: string;
    original_url: string;
  };
  deck: string | null;
  description: string | null;
  character_credits?: Array<{
    id: number;
    name: string;
  }>;
  first_appearance_characters?: Array<{
    id: number;
    name: string;
  }>;
  person_credits?: Array<{
    id: number;
    name: string;
    role: string;
  }>;
  team_credits?: Array<{
    id: number;
    name: string;
  }>;
  location_credits?: Array<{
    id: number;
    name: string;
  }>;
  concept_credits?: Array<{
    id: number;
    name: string;
  }>;
  story_arc_credits?: Array<{
    id: number;
    name: string;
  }>;
}

export interface CVSearchResult {
  id: number;
  name: string;
  resource_type: string;
  deck: string | null;
  image?: {
    medium_url: string;
    thumb_url: string;
    original_url: string;
  };
}
