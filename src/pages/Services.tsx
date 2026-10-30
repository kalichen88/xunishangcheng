import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ChevronDown, RotateCcw, Search, SlidersHorizontal, X } from 'lucide-react';
import { usePageMeta } from '@/hooks/usePageMeta';
import { PlatformBadge } from '@/components/PlatformIcon';
import { ServiceCard } from '@/components/ServiceCard';
import { Reveal } from '@/components/Reveal';
import {
  countForType,
  featuredServices,
  getPlatform,
  matchesQuery,
  platforms,
  services,
  serviceTypes,
  shortTypeName,
  typeName,
} from '@/lib/catalog';
import type { Service } from '@/lib/types';

type SortKey = 'recommended' | 'price-asc' | 'price-desc' | 'min-asc' | 'delivery-asc';

const SORTS: Array<{ key: SortKey; label: string }> = [
  { key: 'recommended', label: '综合推荐' },
  { key: 'price-asc', label: '单价从低到高' },
  { key: 'price-desc', label: '单价从高到低' },
  { key: 'min-asc', label: '起订量从低到高' },
  { key: 'delivery-asc', label: '参考时效从快到慢' },
];

const PAGE_SIZE = 24;

function qualityScore(service: Service): number {
  let score = 0;
  if (service.type === 'members' || service.type === 'views' || service.type === 'likes') {
    score += 40;
  }
  if (service.pricing === 'per1000') score += 30;
  else score -= 20;
  if (service.min <= 100) score += 25;
  else if (service.min <= 1000) score += 10;
  if (service.rate > 0 && service.rate <= 200) score += 15;
  if (service.avgMinutes !== null && service.avgMinutes <= 1440) score += 10;
  if (service.type === 'other') score -= 80;
  return score;
}

/**
 * Keep the default page varied: editor picks first, then round-robin across
 * platforms, with the most useful services in each platform's queue first.
 */
function recommendedOrder(list: Service[]): Service[] {
  const featuredRank = new Map(featuredServices.map((service, index) => [service.id, index]));
  const featured = list
    .filter((service) => featuredRank.has(service.id))
    .sort((a, b) => (featuredRank.get(a.id) ?? 0) - (featuredRank.get(b.id) ?? 0));
  const featuredIds = new Set(featured.map((service) => service.id));

  const buckets = new Map<string, Service[]>();
  for (const service of list) {
    if (featuredIds.has(service.id)) continue;
    const bucket = buckets.get(service.platform) ?? [];
    bucket.push(service);
    buckets.set(service.platform, bucket);
  }
  for (const bucket of buckets.values()) {
    bucket.sort((a, b) => qualityScore(b) - qualityScore(a) || a.id - b.id);
  }

  const result = [...featured];
  const keys = platforms.map((platform) => platform.key);
  let cursor = 0;
  while (result.length < list.length) {
    let added = false;
    for (let step = 0; step < keys.length; step += 1) {
      const bucket = buckets.get(keys[(cursor + step) % keys.length]);
      if (bucket && bucket.length > 0) {
        result.push(bucket.shift() as Service);
        added = true;
        if (result.length >= list.length) break;
      }
    }
    cursor += 1;
    if (!added) break;
  }
  return result;
}

function sortServices(list: Service[], sort: SortKey): Service[] {
  const copy = [...list];
  switch (sort) {
    case 'price-asc':
      return copy.sort((a, b) => a.rate - b.rate || a.id - b.id);
    case 'price-desc':
      return copy.sort((a, b) => b.rate - a.rate || a.id - b.id);
    case 'min-asc':
      return copy.sort((a, b) => a.min - b.min || a.id - b.id);
    case 'delivery-asc':
      return copy.sort(
        (a, b) =>
          (a.avgMinutes ?? Number.MAX_SAFE_INTEGER) - (b.avgMinutes ?? Number.MAX_SAFE_INTEGER) ||
          a.id - b.id,
      );
    default:
      return recommendedOrder(copy);
  }
}

export function Services() {
  const [params, setParams] = useSearchParams();
  const platformParam = params.get('platform');
  const typeParam = params.get('type');
  const sortParam = params.get('sort');
  const qParam = params.get('q') ?? '';

  const platform = getPlatform(platformParam) ? (platformParam as string) : 'all';
  const type = serviceTypes.some((item) => item.key === typeParam) ? (typeParam as string) : 'all';
  const sort = SORTS.some((item) => item.key === sortParam) ? (sortParam as SortKey) : 'recommended';

  const [query, setQuery] = useState(qParam);
  const deferredQuery = useDeferredValue(query);
  const [visible, setVisible] = useState(PAGE_SIZE);

  usePageMeta(
    '全部服务',
    '浏览 AU9922 全部 3,959 项社媒增长服务，按平台、服务类型与价格筛选。',
  );

  useEffect(() => {
    setQuery(qParam);
  }, [qParam]);

  useEffect(() => {
    setVisible(PAGE_SIZE);
  }, [platform, type, sort, deferredQuery]);

  const commit = (next: { platform?: string; type?: string; sort?: SortKey; q?: string }) => {
    const nextPlatform = next.platform ?? platform;
    const nextType = next.type ?? type;
    const nextSort = next.sort ?? sort;
    const nextQuery = next.q ?? query.trim();
    const search = new URLSearchParams();
    if (nextPlatform !== 'all') search.set('platform', nextPlatform);
    if (nextType !== 'all') search.set('type', nextType);
    if (nextSort !== 'recommended') search.set('sort', nextSort);
    if (nextQuery) search.set('q', nextQuery);
    setParams(search, { replace: true });
  };

  const reset = () => {
    setQuery('');
    setParams(new URLSearchParams(), { replace: true });
  };

  const filtered = useMemo(() => {
    const list = services.filter(
      (service) =>
        (platform === 'all' || service.platform === platform) &&
        (type === 'all' || service.type === type) &&
        matchesQuery(service, deferredQuery),
    );
    return sortServices(list, sort);
  }, [platform, type, sort, deferredQuery]);

  const shown = filtered.slice(0, visible);
  const hasFilters = platform !== 'all' || type !== 'all' || Boolean(qParam) || Boolean(query);

  return (
    <>
      <section className="relative overflow-hidden border-b border-line bg-cream/55">
        <div
          className="dot-grid pointer-events-none absolute right-0 top-0 h-full w-1/3 opacity-[0.18] [mask-image:linear-gradient(to_left,black,transparent)]"
          aria-hidden="true"
        />
        <div className="container-page relative py-12 sm:py-16">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="eyebrow">Service catalog</p>
              <h1 className="mt-4 font-display text-[42px] font-semibold leading-none tracking-[-0.03em] text-ink sm:text-[58px]">
                全部服务<span className="text-line-strong">.</span>
              </h1>
              <p className="mt-4 text-[13px] text-muted sm:text-[14px]">
                <span className="num font-medium text-ink">{services.length.toLocaleString('zh-CN')}</span>{' '}
                项服务 · {platforms.length} 个平台 · 明码标价，按需起量
              </p>
            </div>

            <form
              className="relative w-full max-w-[430px]"
              onSubmit={(event) => {
                event.preventDefault();
                commit({ q: query.trim() });
              }}
            >
              <Search
                size={17}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted"
              />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="搜索服务，例如「Telegram 成员」"
                className="h-13 w-full rounded-full border border-line bg-cream py-0 pl-11 pr-24 text-[13px] text-ink shadow-soft outline-none transition placeholder:text-muted/60 focus:border-ink"
                aria-label="搜索服务"
              />
              {query ? (
                <button
                  type="button"
                  onClick={() => {
                    setQuery('');
                    commit({ q: '' });
                  }}
                  className="absolute right-[76px] top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full text-muted transition hover:bg-ink/5 hover:text-ink"
                  aria-label="清除搜索"
                >
                  <X size={13} />
                </button>
              ) : null}
              <button type="submit" className="btn btn-dark absolute right-1.5 top-1.5 h-10 px-4 text-[12px]">
                搜索
              </button>
            </form>
          </div>
        </div>
      </section>

      <section className="container-page py-8 lg:py-12">
        <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
          <aside className="hidden self-start lg:sticky lg:top-24 lg:block">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-semibold tracking-[0.16em] text-muted uppercase">
                筛选
              </p>
              {hasFilters ? (
                <button
                  type="button"
                  onClick={reset}
                  className="inline-flex items-center gap-1 text-[10px] text-muted transition hover:text-ink"
                >
                  <RotateCcw size={10} /> 重置
                </button>
              ) : null}
            </div>

            <div className="mt-4 border-t border-line pt-4">
              <p className="mb-2 text-[11px] font-semibold text-ink">平台</p>
              <div className="space-y-0.5">
                <button
                  type="button"
                  onClick={() => commit({ platform: 'all' })}
                  className={`flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-left text-[12px] transition ${
                    platform === 'all'
                      ? 'bg-ink font-medium text-cream'
                      : 'text-muted hover:bg-ink/5 hover:text-ink'
                  }`}
                >
                  <span>全部平台</span>
                  <span className="num text-[10px] opacity-60">{services.length}</span>
                </button>
                {platforms.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => commit({ platform: item.key })}
                    className={`flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-[12px] transition ${
                      platform === item.key
                        ? 'bg-ink font-medium text-cream'
                        : 'text-muted hover:bg-ink/5 hover:text-ink'
                    }`}
                  >
                    <PlatformBadge platform={item.key} size={24} rounded="rounded-[8px]" />
                    <span className="min-w-0 flex-1 truncate">{item.name}</span>
                    <span className="num text-[10px] opacity-55">{item.count}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6 border-t border-line pt-4">
              <p className="mb-2 text-[11px] font-semibold text-ink">服务类型</p>
              <div className="space-y-0.5">
                <button
                  type="button"
                  onClick={() => commit({ type: 'all' })}
                  className={`flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-left text-[12px] transition ${
                    type === 'all'
                      ? 'bg-ink font-medium text-cream'
                      : 'text-muted hover:bg-ink/5 hover:text-ink'
                  }`}
                >
                  全部类型
                </button>
                {serviceTypes.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => commit({ type: item.key })}
                    className={`flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-left text-[12px] transition ${
                      type === item.key
                        ? 'bg-ink font-medium text-cream'
                        : 'text-muted hover:bg-ink/5 hover:text-ink'
                    }`}
                  >
                    <span>{item.name}</span>
                    <span className="num text-[10px] opacity-55">{countForType(item.key)}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-line bg-cream p-4">
              <p className="flex items-center gap-1.5 text-[11px] font-semibold text-ink">
                <SlidersHorizontal size={12} /> 价格怎么算？
              </p>
              <p className="mt-2 text-[10.5px] leading-relaxed text-muted">
                多数服务按每万次计价，整包服务按件计价。单价 × 数量，就是购物车里的金额。
              </p>
              <Link
                to="/#pricing"
                className="mt-3 inline-block text-[10.5px] font-semibold text-ink underline underline-offset-4"
              >
                查看价格示例
              </Link>
            </div>
          </aside>

          <div className="min-w-0">
            <div className="lg:hidden">
              <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 pb-1">
                <button
                  type="button"
                  onClick={() => commit({ platform: 'all' })}
                  className={`chip shrink-0 ${platform === 'all' ? 'chip-active' : ''}`}
                >
                  全部平台
                </button>
                {platforms.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => commit({ platform: item.key })}
                    className={`chip shrink-0 ${platform === item.key ? 'chip-active' : ''}`}
                  >
                    {item.name}
                  </button>
                ))}
              </div>
              <div className="no-scrollbar -mx-5 mt-2 flex gap-2 overflow-x-auto px-5 pb-1">
                <button
                  type="button"
                  onClick={() => commit({ type: 'all' })}
                  className={`chip shrink-0 ${type === 'all' ? 'chip-active' : ''}`}
                >
                  全部类型
                </button>
                {serviceTypes.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => commit({ type: item.key })}
                    className={`chip shrink-0 ${type === item.key ? 'chip-active' : ''}`}
                  >
                    {item.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4 lg:mt-0">
              <p className="text-[12px] text-muted">
                共 <span className="num font-semibold text-ink">{filtered.length.toLocaleString('zh-CN')}</span>{' '}
                项服务
                {qParam ? (
                  <>
                    {' '}
                    · 关键词 <span className="text-ink">“{qParam}”</span>
                  </>
                ) : null}
              </p>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted">排序</span>
                <div className="relative">
                  <select
                    value={sort}
                    onChange={(event) => commit({ sort: event.target.value as SortKey })}
                    className="h-9 appearance-none rounded-full border border-line bg-cream pr-8 pl-3 text-[11px] font-medium text-ink outline-none transition hover:border-ink"
                    aria-label="排序方式"
                  >
                    {SORTS.map((item) => (
                      <option key={item.key} value={item.key}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={12}
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted"
                  />
                </div>
              </div>
            </div>

            {hasFilters ? (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {platform !== 'all' ? (
                  <button
                    type="button"
                    onClick={() => commit({ platform: 'all' })}
                    className="inline-flex h-7 items-center gap-1.5 rounded-full bg-ink px-2.5 text-[10px] text-cream"
                  >
                    {getPlatform(platform)?.name}
                    <X size={10} />
                  </button>
                ) : null}
                {type !== 'all' ? (
                  <button
                    type="button"
                    onClick={() => commit({ type: 'all' })}
                    className="inline-flex h-7 items-center gap-1.5 rounded-full bg-ink px-2.5 text-[10px] text-cream"
                  >
                    {typeName(type)}
                    <X size={10} />
                  </button>
                ) : null}
                {qParam ? (
                  <button
                    type="button"
                    onClick={() => {
                      setQuery('');
                      commit({ q: '' });
                    }}
                    className="inline-flex h-7 items-center gap-1.5 rounded-full border border-line px-2.5 text-[10px] text-muted"
                  >
                    “{qParam}”
                    <X size={10} />
                  </button>
                ) : null}
              </div>
            ) : null}

            {shown.length ? (
              <>
                <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {shown.map((service, index) => (
                    <Reveal key={service.id} delay={(index % 3) * 35}>
                      <ServiceCard service={service} />
                    </Reveal>
                  ))}
                </div>

                {visible < filtered.length ? (
                  <div className="mt-8 flex flex-col items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setVisible((value) => value + PAGE_SIZE)}
                      className="btn btn-outline"
                    >
                      加载更多
                      <span className="num text-[10px] text-muted">
                        {Math.min(PAGE_SIZE, filtered.length - visible)} / {filtered.length}
                      </span>
                    </button>
                    <p className="text-[10px] text-muted/60">
                      已展示 {shown.length} 项，调整筛选可缩小范围
                    </p>
                  </div>
                ) : (
                  <p className="mt-8 text-center text-[10px] text-muted/60">
                    已展示全部 {filtered.length.toLocaleString('zh-CN')} 项
                  </p>
                )}
              </>
            ) : (
              <div className="mt-6 rounded-[24px] border border-dashed border-line-strong bg-cream px-6 py-20 text-center">
                <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-ink/5 text-muted">
                  <Search size={20} />
                </span>
                <p className="mt-4 text-[15px] font-semibold text-ink">没有找到匹配的服务</p>
                <p className="mx-auto mt-2 max-w-sm text-[12px] leading-relaxed text-muted">
                  试试更短的关键词，或减少平台与类型筛选。也可以直接联系客服，让我们帮你找。
                </p>
                <button type="button" onClick={reset} className="btn btn-dark mt-6">
                  清除全部筛选
                </button>
              </div>
            )}

            {type !== 'all' ? (
              <p className="mt-6 text-center text-[10px] text-muted/60">
                当前类型：{shortTypeName(type)} · 共 {filtered.length} 项
              </p>
            ) : null}
          </div>
        </div>
      </section>
    </>
  );
}
