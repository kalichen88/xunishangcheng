import rawCatalog from '@/data/catalog.json';
import type { CatalogData, PlatformInfo, PlatformKey, Service, ServiceTypeKey } from './types';

export const catalog = rawCatalog as unknown as CatalogData;
export const services = catalog.services;
export const platforms = catalog.platforms;
export const serviceTypes = catalog.types;
export const featuredServices = catalog.featured;

const serviceIndex = new Map<number, Service>(services.map((service) => [service.id, service]));
const platformIndex = new Map<PlatformKey, PlatformInfo>(platforms.map((p) => [p.key, p]));

export function getService(id: number | string | null | undefined): Service | undefined {
  if (id === null || id === undefined) return undefined;
  return serviceIndex.get(Number(id));
}

export function getPlatform(key: string | null | undefined): PlatformInfo | undefined {
  if (!key) return undefined;
  return platformIndex.get(key as PlatformKey);
}

export function platformName(key: string): string {
  return getPlatform(key)?.name ?? key;
}

export function typeName(key: string): string {
  return serviceTypes.find((type) => type.key === key)?.name ?? '其他';
}

export function shortTypeName(key: string): string {
  const map: Record<string, string> = {
    members: '成员 / 关注',
    views: '浏览 / 播放',
    likes: '点赞 / 表情',
    comments: '评论',
    shares: '分享 / 转发',
    live: '直播 / 空间',
    boost: '助力 / 加速',
    other: '其他',
  };
  return map[key] ?? '其他';
}

export function minRateForPlatform(key: PlatformKey): number | null {
  let min: number | null = null;
  for (const service of services) {
    if (service.platform !== key || service.pricing !== 'per1000') continue;
    if (min === null || service.rate < min) min = service.rate;
  }
  return min;
}

export function searchServices(query: string, limit = 8): Service[] {
  const q = query.trim().toLowerCase();
  if (!q) return featuredServices.slice(0, limit);
  const tokens = q.split(/\s+/).filter(Boolean);
  const scored: Array<{ service: Service; score: number }> = [];
  for (const service of services) {
    const haystack = `${service.name} ${service.platformName} ${service.category}`.toLowerCase();
    let score = 0;
    let matchedAll = true;
    for (const token of tokens) {
      const at = haystack.indexOf(token);
      if (at === -1) {
        matchedAll = false;
        break;
      }
      score += at === 0 ? 8 : 2;
    }
    if (!matchedAll) continue;
    if (service.name.toLowerCase().startsWith(q)) score += 20;
    if (service.platformName.toLowerCase() === q || service.platform.toLowerCase() === q) score += 30;
    if (service.hot) score += 2;
    scored.push({ service, score });
  }
  scored.sort((a, b) => b.score - a.score || a.service.id - b.service.id);
  return scored.slice(0, limit).map((item) => item.service);
}

export function matchesQuery(service: Service, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const haystack = `${service.name} ${service.platformName} ${service.platform} ${service.category}`.toLowerCase();
  return q.split(/\s+/).filter(Boolean).every((token) => haystack.includes(token));
}

export function relatedServices(service: Service, limit = 4): Service[] {
  const sameType = services.filter(
    (candidate) =>
      candidate.id !== service.id &&
      candidate.platform === service.platform &&
      candidate.type === service.type,
  );
  if (sameType.length >= limit) {
    return sameType.sort((a, b) => a.rate - b.rate).slice(0, limit);
  }
  const samePlatform = services.filter(
    (candidate) => candidate.id !== service.id && candidate.platform === service.platform,
  );
  return [...sameType, ...samePlatform]
    .filter((candidate, index, list) => list.findIndex((item) => item.id === candidate.id) === index)
    .slice(0, limit);
}

export function countForType(type: ServiceTypeKey): number {
  return catalog.typeCounts[type] ?? 0;
}
