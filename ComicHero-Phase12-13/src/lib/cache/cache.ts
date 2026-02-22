import { prisma } from "@/lib/db";

// L1: In-memory cache with TTL
const memoryCache = new Map<string, { data: unknown; expiresAt: number }>();

export function getFromMemory<T>(key: string): T | null {
  const entry = memoryCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    memoryCache.delete(key);
    return null;
  }
  return entry.data as T;
}

export function setInMemory(key: string, data: unknown, ttlSeconds: number): void {
  memoryCache.set(key, { data, expiresAt: Date.now() + ttlSeconds * 1000 });
}

// L2: Database cache (for Comic Vine data)
export async function getFromDbCache<T>(key: string): Promise<T | null> {
  const entry = await prisma.cachedComicVineData.findUnique({
    where: { cacheKey: key },
  });
  if (!entry) return null;
  if (new Date() > entry.expiresAt) {
    await prisma.cachedComicVineData.delete({ where: { cacheKey: key } });
    return null;
  }
  return JSON.parse(entry.jsonData) as T;
}

export async function setInDbCache(
  key: string,
  dataType: string,
  data: unknown,
  ttlSeconds: number
): Promise<void> {
  await prisma.cachedComicVineData.upsert({
    where: { cacheKey: key },
    update: {
      jsonData: JSON.stringify(data),
      fetchedAt: new Date(),
      expiresAt: new Date(Date.now() + ttlSeconds * 1000),
    },
    create: {
      cacheKey: key,
      dataType,
      jsonData: JSON.stringify(data),
      expiresAt: new Date(Date.now() + ttlSeconds * 1000),
    },
  });
}

// Unified getter: checks L1 then L2
export async function getFromCache<T>(key: string): Promise<T | null> {
  const memResult = getFromMemory<T>(key);
  if (memResult) return memResult;

  const dbResult = await getFromDbCache<T>(key);
  if (dbResult) {
    setInMemory(key, dbResult, 300); // Promote to L1 for 5 min
    return dbResult;
  }

  return null;
}

export async function setInCache(
  key: string,
  dataType: string,
  data: unknown,
  memoryTtlSeconds: number,
  dbTtlSeconds?: number
): Promise<void> {
  setInMemory(key, data, memoryTtlSeconds);
  if (dbTtlSeconds) {
    await setInDbCache(key, dataType, data, dbTtlSeconds);
  }
}

export async function clearExpiredCache(): Promise<number> {
  const result = await prisma.cachedComicVineData.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });
  return result.count;
}
