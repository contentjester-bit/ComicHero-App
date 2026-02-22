export interface MarvelApiResponse<T> {
  code: number;
  status: string;
  data: {
    offset: number;
    limit: number;
    total: number;
    count: number;
    results: T[];
  };
}

export interface MarvelComic {
  id: number;
  digitalId: number;
  title: string;
  issueNumber: number;
  variantDescription: string;
  description: string | null;
  modified: string;
  isbn: string;
  upc: string;
  diamondCode: string;
  ean: string;
  issn: string;
  format: string;
  pageCount: number;
  dates: Array<{ type: string; date: string }>;
  prices: Array<{ type: string; price: number }>;
  thumbnail: { path: string; extension: string };
  images: Array<{ path: string; extension: string }>;
  creators: {
    items: Array<{ name: string; role: string; resourceURI: string }>;
  };
  characters: {
    items: Array<{ name: string; resourceURI: string }>;
  };
  stories: {
    items: Array<{ name: string; type: string; resourceURI: string }>;
  };
  events: {
    items: Array<{ name: string; resourceURI: string }>;
  };
  series: {
    name: string;
    resourceURI: string;
  };
}

export interface MarvelCharacter {
  id: number;
  name: string;
  description: string;
  thumbnail: { path: string; extension: string };
  comics: { available: number; items: Array<{ name: string; resourceURI: string }> };
  events: { available: number; items: Array<{ name: string; resourceURI: string }> };
}

// Mapped for our app
export interface MarvelComicInfo {
  marvelId: number;
  title: string;
  issueNumber: number;
  variantDescription: string;
  description: string | null;
  format: string;
  pageCount: number;
  coverPrice: number | null;
  printPrice: number | null;
  coverUrl: string;
  additionalImages: string[];
  creators: Array<{ name: string; role: string }>;
  characters: string[];
  events: string[];
  seriesName: string;
  onSaleDate: string | null;
  upc: string;
}
