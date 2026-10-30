import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight, CornerDownLeft, Search, X } from 'lucide-react';
import { PlatformBadge } from './PlatformIcon';
import { shortTypeName } from '@/lib/catalog';
import { searchServices } from '@/lib/catalog';
import { formatQuantity, formatServiceRate, rateUnit } from '@/lib/pricing';
import { useLockBody } from '@/hooks/useLockBody';

const TRENDING = ['Telegram 成员', 'Instagram 关注', 'TikTok 播放', 'YouTube 订阅'];

export function SearchDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const navigate = useNavigate();
  useLockBody(open);

  const results = useMemo(() => searchServices(query, 8), [query]);

  useEffect(() => {
    if (!open) return;
    setQuery('');
    setSelected(0);
    const timer = window.setTimeout(() => inputRef.current?.focus(), 40);
    return () => window.clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    setSelected(0);
  }, [query]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setSelected((current) => Math.min(results.length - 1, current + 1));
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        setSelected((current) => Math.max(0, current - 1));
      }
      if (event.key === 'Enter' && results[selected]) {
        event.preventDefault();
        navigate(`/service/${results[selected].id}`);
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, results, selected, navigate, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[110]" role="presentation">
      <div
        className="absolute inset-0 bg-ink/55 backdrop-blur-[3px]"
        onMouseDown={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="搜索服务"
        className="animate-fade-up relative mx-auto mt-[9vh] w-[calc(100%-28px)] max-w-[640px] overflow-hidden rounded-[26px] border border-line bg-cream shadow-lift"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-line px-5">
          <Search size={18} className="shrink-0 text-muted" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜索 3,959 项服务、平台或场景…"
            className="h-[62px] w-full bg-transparent text-[15px] text-ink outline-none placeholder:text-muted/65"
            aria-label="搜索服务"
            autoComplete="off"
          />
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-muted transition hover:bg-ink/5 hover:text-ink"
            aria-label="关闭搜索"
          >
            <X size={16} />
          </button>
        </div>

        {!query ? (
          <div className="flex flex-wrap items-center gap-2 px-5 pt-4">
            <span className="mr-1 text-[11px] font-medium text-muted">热门搜索</span>
            {TRENDING.map((term) => (
              <button
                key={term}
                type="button"
                onClick={() => setQuery(term)}
                className="chip hover:border-ink"
              >
                {term}
              </button>
            ))}
          </div>
        ) : null}

        <div className="max-h-[54vh] overflow-y-auto px-2 py-3">
          <p className="px-3 pb-2 text-[10px] font-semibold tracking-[0.16em] text-muted/70 uppercase">
            {query ? `搜索结果 · ${results.length}` : '编辑精选'}
          </p>
          {results.length ? (
            <div role="listbox" aria-label="搜索结果">
              {results.map((service, index) => (
                <button
                  key={service.id}
                  type="button"
                  role="option"
                  aria-selected={index === selected}
                  onMouseEnter={() => setSelected(index)}
                  onClick={() => {
                    navigate(`/service/${service.id}`);
                    onClose();
                  }}
                  className={`flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition ${
                    index === selected ? 'bg-ink text-cream' : 'text-ink hover:bg-ink/5'
                  }`}
                >
                  <PlatformBadge platform={service.platform} size={36} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-medium">{service.name}</span>
                    <span
                      className={`mt-0.5 block text-[11px] ${
                        index === selected ? 'text-cream/55' : 'text-muted'
                      }`}
                    >
                      {service.platformName} · {shortTypeName(service.type)} · 起订 {formatQuantity(service.min)}
                    </span>
                  </span>
                  <span className="num shrink-0 text-[13px] font-semibold">
                    ${formatServiceRate(service)}
                    <span
                      className={`ml-0.5 text-[10px] font-normal ${
                        index === selected ? 'text-cream/50' : 'text-muted'
                      }`}
                    >
                      /{rateUnit(service)}
                    </span>
                  </span>
                  <ArrowUpRight size={14} className="shrink-0 opacity-45" />
                </button>
              ))}
            </div>
          ) : (
            <div className="px-4 py-12 text-center">
              <p className="text-sm font-medium text-ink">没有找到匹配的服务</p>
              <p className="mt-1.5 text-xs text-muted">试试平台名称，或换一个更短的关键词。</p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-line bg-paper/60 px-5 py-2.5 text-[10px] text-muted">
          <span className="flex items-center gap-1.5">
            <CornerDownLeft size={11} /> 打开
            <span className="mx-1 opacity-40">·</span>
            ↑↓ 选择
            <span className="mx-1 opacity-40">·</span>
            ESC 关闭
          </span>
          <span>{query ? '按 Enter 进入详情' : '输入关键词开始搜索'}</span>
        </div>
      </div>
    </div>,
    document.body,
  );
}
