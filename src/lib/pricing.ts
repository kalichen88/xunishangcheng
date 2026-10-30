import type { Service } from './types';

export function clampQuantity(service: Service, value: number): number {
  const min = Math.max(1, service.min);
  const max = Math.max(min, service.max);
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, Math.round(value)));
}

export function defaultQuantity(service: Service): number {
  return Math.max(1, service.min);
}

export function stepFor(service: Service): number {
  if (service.pricing === 'fixed') return 1;
  if (service.min >= 1000) return 1000;
  if (service.min >= 100) return 100;
  return 1;
}

export function quantityUnit(service: Service): string {
  return service.pricing === 'fixed' ? '件' : '次';
}

export const RATE_QUANTITY = 10000;

/** Catalog rates are stored per 1,000 for per1000 services; display them per 10,000. */
export function ratePerWan(service: Pick<Service, 'rate' | 'pricing'>): number {
  return service.pricing === 'fixed' ? service.rate : service.rate * (RATE_QUANTITY / 1000);
}

export function formatServiceRate(service: Pick<Service, 'rate' | 'pricing'>): string {
  return formatRate(ratePerWan(service));
}

export function formatSnapshotRate(rate: number, pricing: Service['pricing']): string {
  return formatRate(pricing === 'fixed' ? rate : rate * (RATE_QUANTITY / 1000));
}

export function formatQuantity(quantity: number): string {
  if (quantity >= 10000) {
    const wan = quantity / 10000;
    return `${new Intl.NumberFormat('zh-CN', {
      maximumFractionDigits: 2,
      minimumFractionDigits: 0,
    }).format(wan)} 万`;
  }
  return quantity.toLocaleString('zh-CN');
}

export function itemSubtotalCents(service: Service, quantity: number): number {
  const qty = clampQuantity(service, quantity);
  const amount =
    service.pricing === 'fixed' ? service.rate * qty : (service.rate * qty) / 1000;
  return Math.max(1, Math.round(amount * 100));
}

export function formatRate(rate: number): string {
  const maximumFractionDigits = rate >= 1 ? 2 : rate >= 0.01 ? 4 : 5;
  return new Intl.NumberFormat('zh-CN', {
    maximumFractionDigits,
    minimumFractionDigits: 0,
  }).format(rate);
}

export function formatMoney(cents: number): string {
  return `$${new Intl.NumberFormat('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100)}`;
}

export function usdtAmount(cents: number): string {
  return new Intl.NumberFormat('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

export function rateUnit(service: Service): string {
  return service.pricing === 'fixed' ? '件' : '万次';
}

export function pricingModeLabel(service: Service): string {
  return service.pricing === 'fixed' ? '整包价' : '每万次';
}

export function deliveryLabel(service: Service): string {
  if (!service.avgTime || service.avgTime === '新服务') return '以客服确认为准';
  return service.avgTime;
}

export function targetPlaceholder(platform: string): string {
  const map: Record<string, string> = {
    telegram: 'https://t.me/yourchannel 或 @yourchannel',
    instagram: '主页、帖子或 Reel 链接',
    tiktok: '视频链接或主页链接',
    youtube: '视频、Shorts 或频道链接',
    twitter: '帖子链接或主页链接',
    facebook: '主页、帖子或视频链接',
    whatsapp: '频道链接或邀请链接',
    discord: '服务器邀请链接',
    linkedin: '公司页面、个人主页或帖子链接',
    threads: '帖子链接或主页链接',
  };
  return map[platform] ?? '目标链接或用户名';
}

export function quantityPresets(service: Service): number[] {
  if (service.pricing === 'fixed') return [1];
  const min = service.min;
  const values = [min, Math.max(min, 1000), Math.max(min, 10000), Math.max(min, 50000)].map(
    (value) => clampQuantity(service, value),
  );
  return [...new Set(values)];
}
