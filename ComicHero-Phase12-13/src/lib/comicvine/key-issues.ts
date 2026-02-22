import type { KeyIssue, KeyIssueCategory } from "@/types/comic";
import { getFromCache, setInCache } from "@/lib/cache/cache";
import { getCharacterDetail } from "./characters";
import { getIssueDetail } from "./issues";

// Curated seed data of well-known key issues
const SEED_KEY_ISSUES: KeyIssue[] = [
  { id: "key-1", volumeName: "Amazing Fantasy", issueNumber: "15", reason: "First appearance of Spider-Man", category: "first_appearance", significance: 10, imageUrl: null, coverDate: "1962-08", comicVineIssueId: 6686 },
  { id: "key-2", volumeName: "Action Comics", issueNumber: "1", reason: "First appearance of Superman", category: "first_appearance", significance: 10, imageUrl: null, coverDate: "1938-06", comicVineIssueId: 6744 },
  { id: "key-3", volumeName: "Detective Comics", issueNumber: "27", reason: "First appearance of Batman", category: "first_appearance", significance: 10, imageUrl: null, coverDate: "1939-05", comicVineIssueId: 16044 },
  { id: "key-4", volumeName: "The Amazing Spider-Man", issueNumber: "129", reason: "First appearance of The Punisher", category: "first_appearance", significance: 9, imageUrl: null, coverDate: "1974-02", comicVineIssueId: 6805 },
  { id: "key-5", volumeName: "The Amazing Spider-Man", issueNumber: "300", reason: "First full appearance of Venom", category: "first_appearance", significance: 9, imageUrl: null, coverDate: "1988-05", comicVineIssueId: 6966 },
  { id: "key-6", volumeName: "The Incredible Hulk", issueNumber: "181", reason: "First full appearance of Wolverine", category: "first_appearance", significance: 10, imageUrl: null, coverDate: "1974-11", comicVineIssueId: 16830 },
  { id: "key-7", volumeName: "The Incredible Hulk", issueNumber: "1", reason: "First appearance of The Hulk", category: "first_appearance", significance: 10, imageUrl: null, coverDate: "1962-05", comicVineIssueId: 16672 },
  { id: "key-8", volumeName: "X-Men", issueNumber: "1", reason: "First appearance of the X-Men", category: "first_appearance", significance: 10, imageUrl: null, coverDate: "1963-09", comicVineIssueId: 17472 },
  { id: "key-9", volumeName: "Fantastic Four", issueNumber: "1", reason: "First appearance of the Fantastic Four", category: "first_appearance", significance: 10, imageUrl: null, coverDate: "1961-11", comicVineIssueId: 14089 },
  { id: "key-10", volumeName: "Fantastic Four", issueNumber: "48", reason: "First appearance of Silver Surfer and Galactus", category: "first_appearance", significance: 9, imageUrl: null, coverDate: "1966-03", comicVineIssueId: 14136 },
  { id: "key-11", volumeName: "Fantastic Four", issueNumber: "52", reason: "First appearance of Black Panther", category: "first_appearance", significance: 9, imageUrl: null, coverDate: "1966-07", comicVineIssueId: 14140 },
  { id: "key-12", volumeName: "The Amazing Spider-Man", issueNumber: "1", reason: "First issue of Spider-Man's own series", category: "first_appearance", significance: 10, imageUrl: null, coverDate: "1963-03", comicVineIssueId: 6676 },
  { id: "key-13", volumeName: "Tales of Suspense", issueNumber: "39", reason: "First appearance of Iron Man", category: "first_appearance", significance: 9, imageUrl: null, coverDate: "1963-03", comicVineIssueId: 26192 },
  { id: "key-14", volumeName: "Journey into Mystery", issueNumber: "83", reason: "First appearance of Thor", category: "first_appearance", significance: 9, imageUrl: null, coverDate: "1962-08", comicVineIssueId: 18714 },
  { id: "key-15", volumeName: "Captain America Comics", issueNumber: "1", reason: "First appearance of Captain America", category: "first_appearance", significance: 10, imageUrl: null, coverDate: "1941-03", comicVineIssueId: 8825 },
  { id: "key-16", volumeName: "Batman", issueNumber: "1", reason: "First appearances of Joker and Catwoman", category: "first_appearance", significance: 10, imageUrl: null, coverDate: "1940-04", comicVineIssueId: 7390 },
  { id: "key-17", volumeName: "Wonder Woman", issueNumber: "1", reason: "First issue of Wonder Woman's solo series", category: "first_appearance", significance: 9, imageUrl: null, coverDate: "1942-06", comicVineIssueId: 34866 },
  { id: "key-18", volumeName: "The Amazing Spider-Man", issueNumber: "50", reason: "Spider-Man No More! iconic storyline", category: "major_storyline", significance: 8, imageUrl: null, coverDate: "1967-07", comicVineIssueId: 6725 },
  { id: "key-19", volumeName: "Giant-Size X-Men", issueNumber: "1", reason: "First appearance of new X-Men team (Storm, Colossus, Nightcrawler)", category: "first_appearance", significance: 9, imageUrl: null, coverDate: "1975-05", comicVineIssueId: 15701 },
  { id: "key-20", volumeName: "The Amazing Spider-Man", issueNumber: "252", reason: "First appearance of the black suit (symbiote)", category: "first_appearance", significance: 8, imageUrl: null, coverDate: "1984-05", comicVineIssueId: 6919 },
  { id: "key-21", volumeName: "X-Men", issueNumber: "94", reason: "New X-Men team begins (key run start)", category: "major_storyline", significance: 8, imageUrl: null, coverDate: "1975-08", comicVineIssueId: 17565 },
  { id: "key-22", volumeName: "X-Men", issueNumber: "141", reason: "Days of Future Past storyline begins", category: "major_storyline", significance: 8, imageUrl: null, coverDate: "1981-01", comicVineIssueId: 17612 },
  { id: "key-23", volumeName: "The Amazing Spider-Man", issueNumber: "121", reason: "Death of Gwen Stacy", category: "death", significance: 9, imageUrl: null, coverDate: "1973-06", comicVineIssueId: 6797 },
  { id: "key-24", volumeName: "Batman", issueNumber: "497", reason: "Bane breaks Batman's back (Knightfall)", category: "major_storyline", significance: 8, imageUrl: null, coverDate: "1993-07", comicVineIssueId: 7882 },
  { id: "key-25", volumeName: "Superman", issueNumber: "75", reason: "Death of Superman", category: "death", significance: 9, imageUrl: null, coverDate: "1993-01", comicVineIssueId: 25833 },
  { id: "key-26", volumeName: "The New Mutants", issueNumber: "98", reason: "First appearance of Deadpool", category: "first_appearance", significance: 9, imageUrl: null, coverDate: "1991-02", comicVineIssueId: 23059 },
  { id: "key-27", volumeName: "Green Lantern", issueNumber: "76", reason: "Green Lantern/Green Arrow team-up begins (socially relevant comics)", category: "major_storyline", significance: 8, imageUrl: null, coverDate: "1970-04", comicVineIssueId: 16247 },
  { id: "key-28", volumeName: "Batman Adventures", issueNumber: "12", reason: "First appearance of Harley Quinn in comics", category: "first_appearance", significance: 9, imageUrl: null, coverDate: "1993-09", comicVineIssueId: 44041 },
  { id: "key-29", volumeName: "Marvel Super Heroes", issueNumber: "18", reason: "First appearance of Guardians of the Galaxy", category: "first_appearance", significance: 8, imageUrl: null, coverDate: "1969-01", comicVineIssueId: 20685 },
  { id: "key-30", volumeName: "The Avengers", issueNumber: "1", reason: "First appearance of the Avengers team", category: "first_appearance", significance: 10, imageUrl: null, coverDate: "1963-09", comicVineIssueId: 6713 },
  { id: "key-31", volumeName: "Iron Fist", issueNumber: "14", reason: "First appearance of Sabretooth", category: "first_appearance", significance: 8, imageUrl: null, coverDate: "1977-08", comicVineIssueId: 18329 },
  { id: "key-32", volumeName: "The Amazing Spider-Man", issueNumber: "194", reason: "First appearance of Black Cat", category: "first_appearance", significance: 7, imageUrl: null, coverDate: "1979-07", comicVineIssueId: 6864 },
  { id: "key-33", volumeName: "Marvel Spotlight", issueNumber: "5", reason: "First appearance of Ghost Rider (Johnny Blaze)", category: "first_appearance", significance: 8, imageUrl: null, coverDate: "1972-08", comicVineIssueId: 21200 },
  { id: "key-34", volumeName: "DC Comics Presents", issueNumber: "26", reason: "First appearance of New Teen Titans (preview)", category: "first_appearance", significance: 8, imageUrl: null, coverDate: "1980-10", comicVineIssueId: 12534 },
  { id: "key-35", volumeName: "Brave and the Bold", issueNumber: "28", reason: "First appearance of the Justice League", category: "first_appearance", significance: 9, imageUrl: null, coverDate: "1960-03", comicVineIssueId: 8378 },
  { id: "key-36", volumeName: "Showcase", issueNumber: "4", reason: "First appearance of Silver Age Flash (Barry Allen)", category: "first_appearance", significance: 9, imageUrl: null, coverDate: "1956-10", comicVineIssueId: 25218 },
  { id: "key-37", volumeName: "Flash", issueNumber: "123", reason: "Flash of Two Worlds (introduces multiverse concept)", category: "major_storyline", significance: 9, imageUrl: null, coverDate: "1961-09", comicVineIssueId: 14860 },
  { id: "key-38", volumeName: "Showcase", issueNumber: "22", reason: "First appearance of Silver Age Green Lantern (Hal Jordan)", category: "first_appearance", significance: 8, imageUrl: null, coverDate: "1959-10", comicVineIssueId: 25234 },
  { id: "key-39", volumeName: "Tomb of Dracula", issueNumber: "10", reason: "First appearance of Blade", category: "first_appearance", significance: 8, imageUrl: null, coverDate: "1973-07", comicVineIssueId: 27544 },
  { id: "key-40", volumeName: "Strange Tales", issueNumber: "110", reason: "First appearance of Doctor Strange", category: "first_appearance", significance: 8, imageUrl: null, coverDate: "1963-07", comicVineIssueId: 25703 },
  { id: "key-41", volumeName: "Tales to Astonish", issueNumber: "27", reason: "First appearance of Ant-Man (Hank Pym)", category: "first_appearance", significance: 8, imageUrl: null, coverDate: "1962-01", comicVineIssueId: 26430 },
  { id: "key-42", volumeName: "The Avengers", issueNumber: "4", reason: "Captain America revived from ice", category: "major_storyline", significance: 9, imageUrl: null, coverDate: "1964-03", comicVineIssueId: 6716 },
  { id: "key-43", volumeName: "The Amazing Spider-Man", issueNumber: "238", reason: "First appearance of Hobgoblin", category: "first_appearance", significance: 7, imageUrl: null, coverDate: "1983-03", comicVineIssueId: 6907 },
  { id: "key-44", volumeName: "Iron Man", issueNumber: "55", reason: "First appearance of Thanos and Drax", category: "first_appearance", significance: 9, imageUrl: null, coverDate: "1973-02", comicVineIssueId: 18182 },
  { id: "key-45", volumeName: "Hero for Hire", issueNumber: "1", reason: "First appearance of Luke Cage", category: "first_appearance", significance: 8, imageUrl: null, coverDate: "1972-06", comicVineIssueId: 16436 },
  { id: "key-46", volumeName: "The Incredible Hulk", issueNumber: "180", reason: "First brief appearance of Wolverine (cameo)", category: "first_appearance", significance: 9, imageUrl: null, coverDate: "1974-10", comicVineIssueId: 16829 },
  { id: "key-47", volumeName: "Ms. Marvel", issueNumber: "1", reason: "First appearance of Kamala Khan as Ms. Marvel", category: "first_appearance", significance: 7, imageUrl: null, coverDate: "2014-02", comicVineIssueId: 459616 },
  { id: "key-48", volumeName: "Ultimate Fallout", issueNumber: "4", reason: "First appearance of Miles Morales as Spider-Man", category: "first_appearance", significance: 8, imageUrl: null, coverDate: "2011-08", comicVineIssueId: 313503 },
  { id: "key-49", volumeName: "Batman", issueNumber: "232", reason: "First appearance of Ra's al Ghul", category: "first_appearance", significance: 8, imageUrl: null, coverDate: "1971-06", comicVineIssueId: 7621 },
  { id: "key-50", volumeName: "Swamp Thing", issueNumber: "37", reason: "First appearance of John Constantine", category: "first_appearance", significance: 8, imageUrl: null, coverDate: "1985-06", comicVineIssueId: 26070 },
  { id: "key-51", volumeName: "Crisis on Infinite Earths", issueNumber: "7", reason: "Death of Supergirl", category: "death", significance: 8, imageUrl: null, coverDate: "1985-10", comicVineIssueId: 11668 },
  { id: "key-52", volumeName: "Crisis on Infinite Earths", issueNumber: "8", reason: "Death of Barry Allen (The Flash)", category: "death", significance: 9, imageUrl: null, coverDate: "1985-11", comicVineIssueId: 11669 },
  { id: "key-53", volumeName: "Uncanny X-Men", issueNumber: "266", reason: "First full appearance of Gambit", category: "first_appearance", significance: 8, imageUrl: null, coverDate: "1990-08", comicVineIssueId: 17737 },
  { id: "key-54", volumeName: "The Amazing Spider-Man", issueNumber: "361", reason: "First full appearance of Carnage", category: "first_appearance", significance: 8, imageUrl: null, coverDate: "1992-04", comicVineIssueId: 7027 },
  { id: "key-55", volumeName: "Teenage Mutant Ninja Turtles", issueNumber: "1", reason: "First appearance of TMNT", category: "first_appearance", significance: 9, imageUrl: null, coverDate: "1984-05", comicVineIssueId: 26650 },
  { id: "key-56", volumeName: "Watchmen", issueNumber: "1", reason: "First issue of the landmark Watchmen series", category: "major_storyline", significance: 9, imageUrl: null, coverDate: "1986-09", comicVineIssueId: 34327 },
  { id: "key-57", volumeName: "Batman: The Killing Joke", issueNumber: "1", reason: "Iconic Joker origin story; Barbara Gordon paralyzed", category: "major_storyline", significance: 9, imageUrl: null, coverDate: "1988-03", comicVineIssueId: 38699 },
  { id: "key-58", volumeName: "The Dark Knight Returns", issueNumber: "1", reason: "Frank Miller's landmark Batman story", category: "major_storyline", significance: 9, imageUrl: null, coverDate: "1986-02", comicVineIssueId: 27097 },
  { id: "key-59", volumeName: "Wolverine", issueNumber: "1", reason: "First issue of Wolverine's limited series (Frank Miller)", category: "first_appearance", significance: 8, imageUrl: null, coverDate: "1982-09", comicVineIssueId: 34593 },
  { id: "key-60", volumeName: "Spawn", issueNumber: "1", reason: "First appearance of Spawn", category: "first_appearance", significance: 8, imageUrl: null, coverDate: "1992-05", comicVineIssueId: 25370 },
  { id: "key-61", volumeName: "The Walking Dead", issueNumber: "1", reason: "First issue of The Walking Dead", category: "first_appearance", significance: 8, imageUrl: null, coverDate: "2003-10", comicVineIssueId: 106883 },
  { id: "key-62", volumeName: "Saga", issueNumber: "1", reason: "First issue of Saga", category: "first_appearance", significance: 7, imageUrl: null, coverDate: "2012-03", comicVineIssueId: 327957 },
  { id: "key-63", volumeName: "Batman", issueNumber: "181", reason: "First appearance of Poison Ivy", category: "first_appearance", significance: 7, imageUrl: null, coverDate: "1966-06", comicVineIssueId: 7570 },
  { id: "key-64", volumeName: "Batman", issueNumber: "227", reason: "Classic Neal Adams cover (homage to Detective Comics #31)", category: "other", significance: 7, imageUrl: null, coverDate: "1970-12", comicVineIssueId: 7616 },
  { id: "key-65", volumeName: "New Gods", issueNumber: "1", reason: "First appearance of Orion and the New Gods", category: "first_appearance", significance: 8, imageUrl: null, coverDate: "1971-03", comicVineIssueId: 22886 },
  { id: "key-66", volumeName: "Eternals", issueNumber: "1", reason: "First appearance of the Eternals", category: "first_appearance", significance: 8, imageUrl: null, coverDate: "1976-07", comicVineIssueId: 13846 },
  { id: "key-67", volumeName: "The Invincible Iron Man", issueNumber: "128", reason: "Demon in a Bottle storyline climax", category: "major_storyline", significance: 8, imageUrl: null, coverDate: "1979-11", comicVineIssueId: 18310 },
  { id: "key-68", volumeName: "Daredevil", issueNumber: "168", reason: "First appearance of Elektra", category: "first_appearance", significance: 8, imageUrl: null, coverDate: "1981-01", comicVineIssueId: 12724 },
  { id: "key-69", volumeName: "Marvel Premiere", issueNumber: "15", reason: "First appearance of Iron Fist", category: "first_appearance", significance: 7, imageUrl: null, coverDate: "1974-05", comicVineIssueId: 20954 },
  { id: "key-70", volumeName: "Avengers Annual", issueNumber: "10", reason: "First appearance of Rogue", category: "first_appearance", significance: 7, imageUrl: null, coverDate: "1981-11", comicVineIssueId: 6757 },
];

export function getSeededKeyIssues(params?: {
  query?: string;
  category?: KeyIssueCategory;
}): KeyIssue[] {
  let results = [...SEED_KEY_ISSUES];

  if (params?.category) {
    results = results.filter((k) => k.category === params.category);
  }

  if (params?.query) {
    const q = params.query.toLowerCase();
    results = results.filter(
      (k) =>
        k.volumeName.toLowerCase().includes(q) ||
        k.reason.toLowerCase().includes(q)
    );
  }

  return results.sort((a, b) => b.significance - a.significance);
}

export async function getKeyIssuesForCharacter(
  characterId: number
): Promise<KeyIssue[]> {
  const cacheKey = `key_issues_character:${characterId}`;
  const cached = await getFromCache<KeyIssue[]>(cacheKey);
  if (cached) return cached;

  const character = await getCharacterDetail(characterId);
  if (!character) return [];

  const results: KeyIssue[] = [];

  // Check seed data for this character name
  const seeded = SEED_KEY_ISSUES.filter((k) =>
    k.reason.toLowerCase().includes(character.name.toLowerCase())
  );
  results.push(...seeded);

  // If the character has a first appearance, fetch it from Comic Vine
  if (character.firstAppearedInIssueId) {
    const issue = await getIssueDetail(character.firstAppearedInIssueId);
    if (issue) {
      const alreadyHas = results.some(
        (k) =>
          k.volumeName.toLowerCase() === issue.volumeName.toLowerCase() &&
          k.issueNumber === issue.issueNumber
      );
      if (!alreadyHas) {
        results.push({
          id: `cv-first-${character.comicVineId}`,
          volumeName: issue.volumeName,
          issueNumber: issue.issueNumber,
          reason: `First appearance of ${character.name}`,
          category: "first_appearance",
          significance: 8,
          imageUrl: issue.imageUrl,
          coverDate: issue.coverDate,
          comicVineIssueId: issue.comicVineId,
        });
      }
    }
  }

  await setInCache(cacheKey, "key_issues", results, 300, 7 * 24 * 60 * 60);
  return results.sort((a, b) => b.significance - a.significance);
}
