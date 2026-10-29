import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { ArrowUpRight, Menu, Search, ShoppingBag, X } from 'lucide-react';
import clsx from 'clsx';
import { Logo } from './Logo';
import { PlatformBadge } from './PlatformIcon';
import { SearchDialog } from './SearchDialog';
import { useCart } from './CartProvider';
import { useLockBody } from '@/hooks/useLockBody';
import { platforms, catalog } from '@/lib/catalog';
import { nav, site } from '@/config';

function CartButton({ onClick }: { onClick: () => void }) {
  const { itemCount } = useCart();
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative grid h-10 w-10 place-items-center rounded-full border border-line bg-cream text-ink transition hover:border-ink"
      aria-label={`购物车，${itemCount} 项服务`}
    >
      <ShoppingBag size={17} strokeWidth={1.8} />
      {itemCount > 0 ? (
        <span className="num absolute -top-1 -right-1 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-ink px-1 text-[10px] font-semibold text-lime">
          {itemCount}
        </span>
      ) : null}
    </button>
  );
}

export function Header() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { itemCount, openCart } = useCart();
  const location = useLocation();
  useLockBody(menuOpen);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname, location.hash]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing =
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.isContentEditable;
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setSearchOpen(true);
      } else if (event.key === '/' && !typing) {
        event.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <>
      <div className="bg-ink text-cream/65">
        <div className="container-page flex h-9 items-center justify-between gap-4 text-[10.5px] font-medium tracking-wide">
          <span className="flex items-center gap-2">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-lime opacity-60" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-lime" />
            </span>
            独立第三方社媒增长服务商
          </span>
          <span className="hidden sm:block">
            10 个平台 · {catalog.total.toLocaleString('zh-CN')} 项服务 · 人民币计价
          </span>
        </div>
      </div>

      <header
        className={clsx(
          'sticky top-0 z-50 border-b bg-paper/85 backdrop-blur-xl transition-shadow duration-300',
          scrolled ? 'border-line shadow-[0_8px_30px_-24px_rgba(16,18,12,.5)]' : 'border-line/60',
        )}
      >
        <div className="container-page flex h-[70px] items-center gap-3">
          <Logo />

          <nav className="ml-7 hidden items-center gap-1 lg:flex">
            {nav.map((item) => {
              const to = item.to;
              const isRoute = to === '/services' || to === '/faq';
              return isRoute ? (
                <NavLink
                  key={item.label}
                  to={to}
                  className={({ isActive }) =>
                    clsx(
                      'rounded-full px-3.5 py-2 text-[13px] font-medium transition',
                      isActive ? 'bg-ink text-cream' : 'text-muted hover:bg-ink/5 hover:text-ink',
                    )
                  }
                >
                  {item.label}
                </NavLink>
              ) : (
                <Link
                  key={item.label}
                  to={to}
                  className="rounded-full px-3.5 py-2 text-[13px] font-medium text-muted transition hover:bg-ink/5 hover:text-ink"
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="hidden h-10 items-center gap-2 rounded-full border border-line bg-cream pr-2.5 pl-3.5 text-muted transition hover:border-ink hover:text-ink md:flex"
              aria-label="搜索服务"
            >
              <Search size={15} />
              <span className="text-[12px]">搜索服务</span>
              <kbd className="num ml-3 rounded-md border border-line bg-paper px-1.5 py-0.5 text-[9px] text-muted/80">
                ⌘K
              </kbd>
            </button>

            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="grid h-10 w-10 place-items-center rounded-full border border-line bg-cream text-ink transition hover:border-ink md:hidden"
              aria-label="搜索服务"
            >
              <Search size={17} />
            </button>

            <CartButton onClick={openCart} />

            <Link to="/services" className="btn btn-dark btn-sm hidden sm:inline-flex">
              开始选购
              <ArrowUpRight size={14} />
            </Link>

            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className="grid h-10 w-10 place-items-center rounded-full border border-line bg-cream text-ink transition hover:border-ink lg:hidden"
              aria-label="打开菜单"
            >
              <Menu size={18} />
            </button>
          </div>
        </div>
      </header>

      <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />

      {menuOpen
        ? createPortal(
            <div className="fixed inset-0 z-[105] flex flex-col bg-paper">
              <div className="flex h-[70px] shrink-0 items-center justify-between border-b border-line px-5">
                <Logo />
                <button
                  type="button"
                  onClick={() => setMenuOpen(false)}
                  className="grid h-10 w-10 place-items-center rounded-full border border-line bg-cream"
                  aria-label="关闭菜单"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-5 py-8">
                <nav className="flex flex-col">
                  {nav.map((item) => (
                    <Link
                      key={item.label}
                      to={item.to}
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center justify-between border-b border-line py-4 font-display text-[26px] font-semibold text-ink"
                    >
                      {item.label}
                      <ArrowUpRight size={20} className="text-muted" />
                    </Link>
                  ))}
                  <Link
                    to="/orders"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center justify-between border-b border-line py-4 font-display text-[26px] font-semibold text-ink"
                  >
                    我的订单
                    <ArrowUpRight size={20} className="text-muted" />
                  </Link>
                </nav>

                <p className="mt-8 text-[10px] font-semibold tracking-[0.16em] text-muted uppercase">
                  按平台选购
                </p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {platforms.map((platform) => (
                    <Link
                      key={platform.key}
                      to={`/services?platform=${platform.key}`}
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2.5 rounded-2xl border border-line bg-cream px-3 py-2.5"
                    >
                      <PlatformBadge platform={platform.key} size={30} />
                      <span className="min-w-0">
                        <span className="block truncate text-[12px] font-medium text-ink">
                          {platform.name}
                        </span>
                        <span className="num block text-[10px] text-muted">{platform.count} 项</span>
                      </span>
                    </Link>
                  ))}
                </div>

                <div className="mt-8 rounded-2xl bg-ink p-5 text-cream">
                  <p className="text-sm font-medium">需要帮忙选服务？</p>
                  <p className="mt-1 text-xs leading-relaxed text-cream/55">
                    把目标平台和预算发给我们，客服会给出搭配建议。
                  </p>
                  <a
                    href={site.telegram}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-lime"
                  >
                    联系客服 <ArrowUpRight size={13} />
                  </a>
                </div>
              </div>
              <div className="flex shrink-0 items-center justify-between border-t border-line px-5 py-4">
                <span className="text-[11px] text-muted">{itemCount} 项服务在购物车</span>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    openCart();
                  }}
                  className="btn btn-lime btn-sm"
                >
                  查看购物车
                </button>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
