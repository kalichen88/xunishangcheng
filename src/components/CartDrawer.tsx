import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ShoppingBag, Trash2, X } from 'lucide-react';
import { PlatformBadge } from './PlatformIcon';
import { QuantityStepper } from './QuantityStepper';
import { useCart } from './CartProvider';
import { useLockBody } from '@/hooks/useLockBody';
import { formatMoney, formatRate } from '@/lib/pricing';

export function CartDrawer() {
  const {
    detailed,
    itemCount,
    subtotalCents,
    isOpen,
    closeCart,
    setQuantity,
    setTarget,
    remove,
  } = useCart();
  const navigate = useNavigate();
  useLockBody(isOpen);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeCart();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, closeCart]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[108]" role="presentation">
      <div
        className="absolute inset-0 bg-ink/45 backdrop-blur-[2px]"
        onMouseDown={closeCart}
        aria-hidden="true"
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="购物车"
        className="absolute top-0 right-0 flex h-full w-full max-w-[460px] flex-col bg-paper shadow-lift"
      >
        <div className="flex h-[70px] shrink-0 items-center justify-between border-b border-line px-5">
          <div className="flex items-baseline gap-2">
            <h2 className="font-display text-[22px] font-semibold text-ink">购物车</h2>
            <span className="num text-[11px] text-muted">{itemCount} 项</span>
          </div>
          <button
            type="button"
            onClick={closeCart}
            className="grid h-9 w-9 place-items-center rounded-full border border-line bg-cream text-ink transition hover:border-ink"
            aria-label="关闭购物车"
          >
            <X size={17} />
          </button>
        </div>

        {detailed.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
            <span className="grid h-16 w-16 place-items-center rounded-full bg-ink/5 text-muted">
              <ShoppingBag size={26} strokeWidth={1.6} />
            </span>
            <p className="mt-5 text-base font-semibold text-ink">购物车还是空的</p>
            <p className="mt-2 max-w-[260px] text-[13px] leading-relaxed text-muted">
              从 3,959 项服务里挑一项，按需起量。先加购，再核对目标链接。
            </p>
            <button
              type="button"
              onClick={() => {
                closeCart();
                navigate('/services');
              }}
              className="btn btn-dark mt-6"
            >
              浏览全部服务
              <ArrowRight size={15} />
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-5 py-4">
              <ul className="space-y-3">
                {detailed.map(({ line, service, subtotalCents: lineTotal }) => (
                  <li key={service.id} className="rounded-2xl border border-line bg-cream p-4">
                    <div className="flex items-start gap-3">
                      <PlatformBadge platform={service.platform} size={38} />
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 text-[13px] font-semibold leading-snug text-ink">
                          {service.name}
                        </p>
                        <p className="mt-1 text-[11px] text-muted">
                          ${formatRate(service.rate)} / {service.pricing === 'fixed' ? '件' : '千次'} · 起订{' '}
                          {service.min}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => remove(service.id)}
                        className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-muted transition hover:bg-coral/10 hover:text-coral"
                        aria-label={`移除 ${service.name}`}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    <input
                      value={line.target}
                      onChange={(event) => setTarget(service.id, event.target.value)}
                      placeholder="目标链接 / 用户名（可稍后填写）"
                      className="mt-3 h-9 w-full rounded-xl border border-line bg-paper px-3 text-[11px] text-ink outline-none transition placeholder:text-muted/60 focus:border-ink focus:bg-white"
                    />

                    <div className="mt-3 flex items-center justify-between gap-2">
                      <QuantityStepper
                        service={service}
                        value={line.quantity}
                        onChange={(value) => setQuantity(service.id, value)}
                        size="sm"
                      />
                      <span className="num text-[13px] font-semibold text-ink">
                        {formatMoney(lineTotal)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>

              <p className="mt-4 text-center text-[10px] leading-relaxed text-muted/70">
                价格按当前目录实时计算；结算前请核对数量与目标链接。
              </p>
            </div>

            <div className="shrink-0 border-t border-line bg-cream px-5 py-4">
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-muted">合计</span>
                <span className="num text-[24px] font-semibold tracking-[-0.02em] text-ink">
                  {formatMoney(subtotalCents)}
                </span>
              </div>
              <p className="mt-0.5 text-right text-[10px] text-muted/70">
                不含支付渠道可能产生的手续费
              </p>
              <button
                type="button"
                onClick={() => {
                  closeCart();
                  navigate('/checkout');
                }}
                className="btn btn-dark mt-4 w-full"
              >
                去结算
                <ArrowRight size={15} />
              </button>
              <button
                type="button"
                onClick={() => {
                  closeCart();
                  navigate('/cart');
                }}
                className="mt-2 w-full py-1 text-center text-[11px] font-medium text-muted transition hover:text-ink"
              >
                查看购物车详情
              </button>
            </div>
          </>
        )}
      </aside>
    </div>,
    document.body,
  );
}
