export type PlatformKey =
  | 'telegram'
  | 'instagram'
  | 'tiktok'
  | 'youtube'
  | 'twitter'
  | 'facebook'
  | 'whatsapp'
  | 'discord'
  | 'linkedin'
  | 'threads';

export type ServiceTypeKey =
  | 'members'
  | 'views'
  | 'likes'
  | 'comments'
  | 'shares'
  | 'live'
  | 'boost'
  | 'other';

export type PricingMode = 'per1000' | 'fixed';

export interface Service {
  id: number;
  platform: PlatformKey;
  platformName: string;
  categoryId: string;
  category: string;
  name: string;
  type: ServiceTypeKey;
  rate: number;
  min: number;
  max: number;
  avgTime: string;
  avgMinutes: number | null;
  pricing: PricingMode;
  hot: boolean;
}

export interface PlatformInfo {
  key: PlatformKey;
  name: string;
  count: number;
}

export interface TypeInfo {
  key: ServiceTypeKey;
  name: string;
}

export interface CatalogData {
  generatedAt: string;
  currency: string;
  total: number;
  platforms: PlatformInfo[];
  types: TypeInfo[];
  typeCounts: Partial<Record<ServiceTypeKey, number>>;
  featured: Service[];
  services: Service[];
}
