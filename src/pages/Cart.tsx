import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, ShieldCheck, ShoppingBag, Trash2 } from 'lucide-react';
import { usePageMeta } from '@/hooks/usePageMeta';
import { PlatformBadge } from '@/components/PlatformIcon';
import { QuantityStepper } from '@/components/QuantityStepper';
import { useCart } from '@/components/CartProvider';
import { useToast } from '@/components/Toast';
import { shortTypeName } from '@/lib/catalog';
import { formatMoney, formatQuantity, formatServiceRate, rateUnit } from '@/lib/pricing';

export function Cart() {
  usePageMeta('购物车');
  const { detailed, itemCount, subtotalCents, setQuantity, setTarget, remove, clear } = useCart();
  const { toast } = useToast();
  const navigate = useNavigate();

  if (itemCount === 0) {
    return (
      <section className="container-page py-20 sm:py-28">
        <div className="mx-auto max-w-md text-center">
          <span className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-ink/[0.04] text-muted">
            <ShoppingBag size={32} strokeWidth={1.4} />
          </span>
          <p className="eyebrow mt-6 justify-center">Your cart</p>
          <h1 className="mt-3 font-display text-[38px] font-semibold tracking-[-0.02em] text-ink">
            购物车还是空的
          </h1>
          <p className="mt-3 text-[13px] leading-relaxed text-muted">
            从 3,959 项服务里挑一项开始。可以先小量尝试，再决定是否放量。
          </p>
          <div className="mt-7 flex justify-center gap-3">
            <Link to="/services" className="btn btn-dark">
              浏览全部服务
              <ArrowRight size={15} />
            </Link>
            <Link to="/faq" className="btn btn-outline">
              如何下单
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="container-page py-10 sm:py-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Your cart</p>
          <h1 className="mt-3 font-display text-[38px] font-semibold tracking-[-0.025em] text-ink sm:text-[48px]">
            购物车
          </h1>
          <p className="mt-2 text-[12px] text-muted">
            <span className="num">{itemCount}</span> 项服务 · 结算前可修改数量与目标链接
          </p>
        </div>
        <Link
          to="/services"
          className="inline-flex items-center gap-1.5 text-[12px] font-medium text-muted transition hover:text-ink"
        >
          <ArrowLeft size={13} /> 继续选购
        </Link>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-3">
          {detailed.map(({ line, service, subtotalCents: lineTotal }) => (
            <div key={service.id} className="rounded-[22px] border border-line bg-cream p-4 sm:p-5">
              <div className="flex items-start gap-3.5">
                <PlatformBadge platform={service.platform} size={46} />
                <div className="min-w-0 flex-1">
                  <Link
                    to={`/service/${service.id}`}
                    className="line-clamp-2 text-[14px] font-semibold leading-snug text-ink transition hover:text-violet"
                  >
                    {service.name}
                  </Link>
                  <p className="mt-1.5 text-[10.5px] text-muted">
                    {service.platformName} · {shortTypeName(service.type)} · 服务 #{service.id}
                  </p>
                  <p className="num mt-1 text-[10.5px] text-muted/70">
                    ${formatServiceRate(service)} / {rateUnit(service)} · 起订 {formatQuantity(service.min)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    remove(service.id);
                    toast('已从购物车移除', 'info');
                  }}
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-muted transition hover:bg-coral/10 hover:text-coral"
                  aria-label={`移除 ${service.name}`}
                >
                  <Trash2 size={15} />
                </button>
              </div>

              <div className="mt-4 grid gap-3 border-t border-line pt-4 sm:grid-cols-[1fr_auto] sm:items-end">
                <div>
                  <label
                    className="text-[10px] font-medium text-muted"
                    htmlFor={`target-${service.id}`}
                  >
                    目标链接 / 用户名
                  </label>
                  <input
                    id={`target-${service.id}`}
                    value={line.target}
                    onChange={(event) => setTarget(service.id, event.target.value)}
                    placeholder="可稍后补充，请不要填写密码或验证码"
                    className="mt-1.5 h-10 w-full rounded-xl border border-line bg-paper px-3 text-[11px] text-ink outline-none transition placeholder:text-muted/55 focus:border-ink focus:bg-white"
                  />
                </div>
                <div className="flex items-center justify-between gap-4 sm:justify-end">
                  <QuantityStepper
                    service={service}
                    value={line.quantity}
                    onChange={(value) => setQuantity(service.id, value)}
                    size="sm"
                  />
                  <div className="min-w-[82px] text-right">
                    <p className="text-[9px] text-muted">小计</p>
                    <p className="num text-[15px] font-semibold text-ink">{formatMoney(lineTotal)}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}

          <div className="flex items-center justify-between pt-2">
            <span className="text-[10px] text-muted/60">
              价格按当前目录实时计算，结算时再次校验。
            </span>
            <button
              type="button"
              onClick={() => {
                if (window.confirm('确定清空购物车中的全部服务吗？')) {
                  clear();
                  toast('购物车已清空', 'info');
                }
              }}
              className="text-[10px] text-muted transition hover:text-coral"
            >
              清空购物车
            </button>
          </div>
        </div>

        <aside className="self-start lg:sticky lg:top-24">
          <div className="rounded-[24px] border border-line bg-cream p-5 shadow-soft sm:p-6">
            <h2 className="text-[14px] font-semibold text-ink">订单摘要</h2>
            <dl className="mt-4 space-y-3 text-[12px]">
              <div className="flex items-center justify-between">
                <dt className="text-muted">服务数量</dt>
                <dd className="num text-ink">{itemCount} 项</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted">商品小计</dt>
                <dd className="num text-ink">{formatMoney(subtotalCents)}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted">网络手续费</dt>
                <dd className="text-[10px] text-muted">由付款方承担（TRC20）</dd>
              </div>
            </dl>
            <div className="mt-4 flex items-end justify-between border-t border-line pt-4">
              <span className="text-[12px] font-medium text-ink">合计</span>
              <span className="num text-[28px] font-semibold tracking-[-0.03em] text-ink">
                {formatMoney(subtotalCents)}
              </span>
            </div>
            <button
              type="button"
              onClick={() => navigate('/checkout')}
              className="btn btn-dark mt-4 w-full"
            >
              去结算
              <ArrowRight size={15} />
            </button>
            <p className="mt-3 flex items-start gap-1.5 text-[10px] leading-relaxed text-muted/70">
              <ShieldCheck size={12} className="mt-0.5 shrink-0" />
              提交后请按页面显示的 USDT-TRC20 地址转账，客服核对到账后开始排期。
            </p>
          </div>

          <div className="mt-3 rounded-2xl border border-line bg-paper px-4 py-3.5 text-[10.5px] leading-relaxed text-muted">
            不确定数量？先按起订量下单，客服确认时可以再调整。
          </div>
        </aside>
      </div>
    </section>
  );
}
