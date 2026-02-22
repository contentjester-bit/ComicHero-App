import { marvelFetch } from "./client";
import type { MarvelApiResponse, MarvelComic, MarvelComicInfo } from "./types";

/**
 * Search Marvel API for comics by title and optional issue number.
 * Only works for Marvel-published comics (obviously).
 */
export async function searchMarvelComic(
  title: string,
  issueNumber?: string
): Promise<MarvelComicInfo[]> {
  const params = new URLSearchParams({
    titleStartsWith: title,
    format: "comic",
    formatType: "comic",
    noVariants: "false",
    orderBy: "-onsaleDate",
    limit: "20",
  });

  if (issueNumber) {
    params.set("issueNumber", issueNumber);
  }

  const data = await marvelFetch<MarvelApiResponse<MarvelComic>>("/comics", params);
  if (!data || !data.data || data.data.results.length === 0) return [];

  return data.data.results.map(mapMarvelComic);
}

/**
 * Get a specific Marvel comic by its Marvel ID.
 */
export async function getMarvelComicById(
  marvelId: number
): Promise<MarvelComicInfo | null> {
  const data = await marvelFetch<MarvelApiResponse<MarvelComic>>(`/comics/${marvelId}`);
  if (!data || !data.data || data.data.results.length === 0) return null;
  return mapMarvelComic(data.data.results[0]);
}

/**
 * Search for Marvel characters.
 */
export async function searchMarvelCharacter(
  name: string
): Promise<Array<{ marvelId: number; name: string; description: string; imageUrl: string; comicCount: number }>> {
  const params = new URLSearchParams({
    nameStartsWith: name,
    limit: "10",
  });

  const data = await marvelFetch<MarvelApiResponse<{
    id: number;
    name: string;
    description: string;
    thumbnail: { path: string; extension: string };
    comics: { available: number };
  }>>("/characters", params);

  if (!data || !data.data) return [];

  return data.data.results.map((c) => ({
    marvelId: c.id,
    name: c.name,
    description: c.description || "",
    imageUrl: `${c.thumbnail.path}/standard_xlarge.${c.thumbnail.extension}`,
    comicCount: c.comics.available,
  }));
}

function mapMarvelComic(comic: MarvelComic): MarvelComicInfo {
  const onSaleDateObj = comic.dates.find((d) => d.type === "onsaleDate");
  const printPriceObj = comic.prices.find((p) => p.type === "printPrice");
  const digitalPriceObj = comic.prices.find((p) => p.type === "digitalPurchasePrice");

  return {
    marvelId: comic.id,
    title: comic.title,
    issueNumber: comic.issueNumber,
    variantDescription: comic.variantDescription || "",
    description: comic.description,
    format: comic.format,
    pageCount: comic.pageCount,
    coverPrice: printPriceObj?.price ?? null,
    printPrice: digitalPriceObj?.price ?? null,
    coverUrl: `${comic.thumbnail.path}/portrait_uncanny.${comic.thumbnail.extension}`,
    additionalImages: comic.images.map((img) => `${img.path}/portrait_uncanny.${img.extension}`),
    creators: comic.creators.items.map((c) => ({ name: c.name, role: c.role })),
    characters: comic.characters.items.map((c) => c.name),
    events: comic.events.items.map((e) => e.name),
    seriesName: comic.series.name,
    onSaleDate: onSaleDateObj?.date || null,
    upc: comic.upc || "",
  };
}
