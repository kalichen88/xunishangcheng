import { useState } from 'react';
import { Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { catalog, platforms } from '@/lib/catalog';
import { formatRate } from '@/lib/pricing';

const TRENDING = ['Telegram 成员', 'Instagram 关注', 'TikTok 播放', 'YouTube 订阅'];

const lowestRate = Math.min(
  ...catalog.services.filter((service) => service.pricing === 'per1000').map((service) => service.rate),
);

export function HeroSearch() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  return (
    <section className="container-page relative z-10 mt-6">
      <div className="rounded-[26px] border border-line bg-cream p-4 shadow-lift sm:p-5">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            const q = query.trim();
            navigate(q ? `/services?q=${encodeURIComponent(q)}` : '/services');
          }}
          className="flex items-center gap-2 rounded-full border border-line bg-paper p-1.5"
        >
          <Search size={17} className="ml-2.5 shrink-0 text-muted/60" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜平台、服务或场景"
            className="h-10 min-w-0 flex-1 bg-transparent text-[13px] text-ink outline-none placeholder:text-muted/50"
            aria-label="搜索服务"
          />
          <button type="submit" className="btn btn-dark h-10 shrink-0 px-5 text-[12px]">
            搜索
          </button>
        </form>

        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-[11px] text-muted/70">
          <span className="text-muted/45">试试</span>
          {TRENDING.map((term) => (
            <button
              key={term}
              type="button"
              onClick={() => navigate(`/services?q=${encodeURIComponent(term)}`)}
              className="underline decoration-line-strong underline-offset-4 transition hover:text-ink hover:decoration-ink"
            >
              {term}
            </button>
          ))}
          <span className="ml-auto hidden items-center gap-1.5 text-[10px] text-muted/55 sm:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-mint" />
            USDT-TRC20 结算
          </span>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4 border-t border-line pt-4 sm:grid-cols-4">
          {[
            { value: catalog.total.toLocaleString('zh-CN'), label: '在售服务' },
            { value: String(platforms.length), label: '覆盖平台' },
            { value: `$${formatRate(lowestRate)}`, label: '1k 起价' },
            { value: String(catalog.types.length), label: '服务类型' },
          ].map((stat) => (
            <div key={stat.label}>
              <p className="num text-[17px] font-semibold tracking-[-0.03em] text-ink">
                {stat.value}
              </p>
              <p className="mt-0.5 text-[9.5px] text-muted/60">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
