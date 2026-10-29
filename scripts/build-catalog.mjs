/**
 * Normalize the public price table snapshot into the storefront catalog.
 * Source: data/catalog.source.json (captured 2026-10-29 from the public
 * service price table). Branding, copy and design are original to TideSMM.
 */
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const source = JSON.parse(fs.readFileSync(path.join(root, 'data/catalog.source.json'), 'utf8'));
const CATEGORY_NAMES = new Map(source.categories.map((c) => [String(c.id), c.name]));

const PLATFORMS = [
  { key: 'telegram', name: 'Telegram', match: /telegram/i },
  { key: 'instagram', name: 'Instagram', match: /instagram/i },
  { key: 'tiktok', name: 'TikTok', match: /tiktok/i },
  { key: 'youtube', name: 'YouTube', match: /youtube/i },
  { key: 'twitter', name: 'X / Twitter', match: /twitter/i },
  { key: 'facebook', name: 'Facebook', match: /facebook/i },
  { key: 'whatsapp', name: 'WhatsApp', match: /whatsapp/i },
  { key: 'discord', name: 'Discord', match: /discord/i },
  { key: 'linkedin', name: 'LinkedIn', match: /linkedin/i },
  { key: 'threads', name: 'Threads', match: /threads/i },
];

const TYPE_RULES = [
  ['live', /直播|空间听众|space|broadcast/i],
  ['boost', /boost|助力|加速|服务器加速/i],
  ['members', /成员|关注|订阅|好友|听众|粉丝/i],
  ['comments', /评论|留言/i],
  ['views', /浏览|观看|播放|曝光|印象|观看时间/i],
  ['likes', /点赞|表情|反应|喜欢|收藏|书签|星星/i],
  ['shares', /分享|转发|转推/i],
];

function clean(text) {
  return String(text ?? '')
    .replace(/\u00a0/g, ' ')
    .replace(/[\u200b-\u200d]/g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s*[|｜]\s*$/g, '')
    .trim();
}

function parseMinutes(text) {
  if (!text || /新服务|暂无|n\/a/i.test(text)) return null;
  let total = 0;
  const day = text.match(/(\d+)\s*天/);
  const hour = text.match(/(\d+)\s*(?:小时|时)/);
  const minute = text.match(/(\d+)\s*分钟/);
  if (day) total += Number(day[1]) * 1440;
  if (hour) total += Number(hour[1]) * 60;
  if (minute) total += Number(minute[1]);
  return total || null;
}

function resolvePlatform(service) {
  if (service.platform) {
    const hit = PLATFORMS.find((p) => p.match.test(service.platform));
    if (hit) return hit;
  }
  if (/threads/i.test(service.name) || String(service.categoryId) === '42') {
    return PLATFORMS.find((p) => p.key === 'threads');
  }
  return null;
}

function resolveType(name) {
  for (const [type, re] of TYPE_RULES) if (re.test(name)) return type;
  return 'other';
}

function cleanCategory(name) {
  return clean(name)
    .replace(/🔜/g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s*S1$/, '')
    .trim();
}

const services = [];
for (const raw of source.services) {
  if (String(raw.id) === '668') continue; // "补差价专用" is a checkout utility, not a product.
  const platform = resolvePlatform(raw);
  if (!platform) continue;
  const name = clean(raw.name);
  const max = Number(raw.max) || 1;
  const min = Number(raw.min) || 1;
  const rate = Number(raw.priceCny) || 0;
  const pricing = max <= 5 ? 'fixed' : 'per1000';
  const type = resolveType(name);
  const category = cleanCategory(CATEGORY_NAMES.get(String(raw.categoryId)) || platform.name);
  const avgMinutes = parseMinutes(raw.avgTime);
  services.push({
    id: Number(raw.id),
    platform: platform.key,
    platformName: platform.name,
    categoryId: String(raw.categoryId),
    category,
    name,
    type,
    rate: Number(rate.toFixed(3)),
    min,
    max,
    avgTime: clean(raw.avgTime) || '以客服确认为准',
    avgMinutes,
    pricing,
    hot: String(raw.categoryId) === '363',
  });
}

services.sort((a, b) => a.id - b.id);

const platformCounts = {};
const typeCounts = {};
for (const s of services) {
  platformCounts[s.platform] = (platformCounts[s.platform] || 0) + 1;
  typeCounts[s.type] = (typeCounts[s.type] || 0) + 1;
}

// Hand-picked from the live catalog: one strong entry per major platform.
const featuredIds = [885, 4818, 5499, 1071, 1517, 4001, 3855, 4284];
const featured = featuredIds.map((id) => services.find((s) => s.id === id)).filter(Boolean);

const output = {
  generatedAt: '2026-10-29',
  currency: 'CNY',
  total: services.length,
  platforms: PLATFORMS.map((p) => ({
    key: p.key,
    name: p.name,
    count: platformCounts[p.key] || 0,
  })),
  types: [
    { key: 'members', name: '成员 / 关注' },
    { key: 'views', name: '浏览 / 播放' },
    { key: 'likes', name: '点赞 / 表情' },
    { key: 'comments', name: '评论' },
    { key: 'shares', name: '分享 / 转发' },
    { key: 'live', name: '直播 / 空间' },
    { key: 'boost', name: '助力 / 加速' },
    { key: 'other', name: '其他' },
  ].filter((t) => typeCounts[t.key]),
  typeCounts,
  featured,
  services,
};

fs.mkdirSync(path.join(root, 'src/data'), { recursive: true });
fs.writeFileSync(path.join(root, 'src/data/catalog.json'), JSON.stringify(output));
console.log(
  `catalog: ${output.total} services, ${output.platforms.length} platforms, ${output.types.length} types`,
);
for (const p of output.platforms) console.log(`  ${p.name.padEnd(12)} ${p.count}`);
console.log('featured:', featured.map((s) => `${s.id} ${s.name}`).join('\n  '));
