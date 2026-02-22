import { comicVineFetch } from "./client";
import type { CVApiResponse, CVCharacter } from "./types";
import type { Character } from "@/types/comic";
import { getFromCache, setInCache } from "@/lib/cache/cache";

function mapCVCharacter(cv: CVCharacter): Character {
  return {
    id: String(cv.id),
    comicVineId: cv.id,
    name: cv.name,
    realName: cv.real_name,
    publisher: cv.publisher?.name || null,
    imageUrl: cv.image?.medium_url || null,
    description: cv.deck,
    firstAppearedInIssueId: cv.first_appeared_in_issue?.id || null,
    issueCount: cv.count_of_issue_appearances || 0,
  };
}

export async function searchCharacters(name: string): Promise<Character[]> {
  const cacheKey = `character_search:${name.toLowerCase()}`;
  const cached = await getFromCache<Character[]>(cacheKey);
  if (cached) return cached;

  const data = await comicVineFetch<CVApiResponse<CVCharacter[]>>("search", {
    query: name,
    resources: "character",
    field_list:
      "id,name,real_name,publisher,image,deck,first_appeared_in_issue,count_of_issue_appearances",
    limit: "10",
  });

  const characters = data.results.map(mapCVCharacter);
  await setInCache(cacheKey, "character_search", characters, 300, 7 * 24 * 60 * 60);
  return characters;
}

export async function getCharacterDetail(characterId: number): Promise<Character | null> {
  const cacheKey = `character:${characterId}`;
  const cached = await getFromCache<Character>(cacheKey);
  if (cached) return cached;

  const data = await comicVineFetch<CVApiResponse<CVCharacter>>(
    `character/4005-${characterId}`,
    {
      field_list:
        "id,name,real_name,publisher,image,deck,first_appeared_in_issue,count_of_issue_appearances",
    }
  );

  if (!data.results) return null;

  const character = mapCVCharacter(data.results);
  await setInCache(cacheKey, "character", character, 300, 7 * 24 * 60 * 60);
  return character;
}
