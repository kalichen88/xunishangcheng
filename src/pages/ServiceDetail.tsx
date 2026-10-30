import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowRight,
  ChevronRight,
  Clock3,
  Info,
  Link2,
  Lock,
  ShieldCheck,
  ShoppingBag,
} from 'lucide-react';
import { usePageMeta } from '@/hooks/usePageMeta';
import { PlatformBadge } from '@/components/PlatformIcon';
import { QuantityStepper } from '@/components/QuantityStepper';
import { ServiceCard } from '@/components/ServiceCard';
import { useCart } from '@/components/CartProvider';
import {
  getPlatform,
  getService,
  relatedServices,
  shortTypeName,
  typeName,
} from '@/lib/catalog';
import {
  clampQuantity,
  defaultQuantity,
  deliveryLabel,
  formatCnyRate,
  formatMoney,
  formatQuantity,
  formatServiceRate,
  itemSubtotalCents,
  pricingModeLabel,
  quantityPresets,
  quantityUnit,
  rateUnit,
  targetPlaceholder,
} from '@/lib/pricing';
import { site } from '@/config';

const notices = [
  {
    icon: Link2,
    text: '目标账号或内容需要处于公开状态。交付期间请勿修改隐私设置、用户名或删除内容。',
  },
  {
    icon: Clock3,
    text: '参考时效来自目录平均值，实际进度受平台风控与队列影响，不构成完成时间承诺。',
  },
  {
    icon: ShieldCheck,
    text: '补单与退款条件随服务不同，以商品说明及客服确认为准；未开始交付的订单可协商取消。',
  },
  {
    icon: Lock,
    text: '我们不会索要账号密码或验证码。请只提交你拥有或有权推广的公开链接。',
  },
];

function MissingService() {
  usePageMeta('服务不存在');
  return (
    <section className="container-page py-24 text-center">
      <p className="eyebrow justify-center">404 service</p>
      <h1 className="mt-4 font-display text-4xl font-semibold text-ink">这项服务不在目录里</h1>
      <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted">
        服务可能已下架，或链接有误。回到全部服务重新筛选，或联系客服确认。
      </p>
      <div className="mt-7 flex justify-center gap-3">
        <Link to="/services" className="btn btn-dark">
          浏览全部服务
        </Link>
        <a href={site.telegram} target="_blank" rel="noreferrer" className="btn btn-outline">
          联系客服
        </a>
      </div>
    </section>
  );
}

export function ServiceDetail() {
  const { id } = useParams();
  const service = getService(id);
  const navigate = useNavigate();
  const { add, openCart } = useCart();
  const [quantity, setQuantity] = useState(() => (service ? defaultQuantity(service) : 1));
  const [target, setTarget] = useState('');

  usePageMeta(
    service?.name,
    service
      ? `${service.name}：${service.platformName} 社媒增长服务，$${formatServiceRate(service)} / ${rateUnit(service)}，起订 ${formatQuantity(service.min)}。`
      : undefined,
  );

  useEffect(() => {
    if (!service) return;
    setQuantity(defaultQuantity(service));
    setTarget('');
  }, [service]);

  if (!service) return <MissingService />;

  const platform = getPlatform(service.platform);
  const unit = quantityUnit(service);
  const totalCents = itemSubtotalCents(service, quantity);
  const related = relatedServices(service, 4);
  const presets = quantityPresets(service);

  const handleAdd = (buyNow = false) => {
    add(service, quantity, target);
    if (buyNow) {
      navigate('/checkout');
      return;
    }
    openCart();
  };

  return (
    <>
      <div className="container-page pt-6 pb-24 lg:pb-0">
        <nav className="flex items-center gap-1.5 text-[10px] text-muted/70" aria-label="面包屑">
          <Link to="/" className="transition hover:text-ink">
            首页
          </Link>
          <ChevronRight size={10} />
          <Link to="/services" className="transition hover:text-ink">
            全部服务
          </Link>
          <ChevronRight size={10} />
          <Link
            to={`/services?platform=${service.platform}`}
            className="transition hover:text-ink"
          >
            {platform?.name ?? service.platformName}
          </Link>
          <ChevronRight size={10} />
          <span className="max-w-[220px] truncate text-ink/60">{service.name}</span>
        </nav>

        <div className="mt-7 grid gap-10 lg:grid-cols-[minmax(0,1fr)_400px]">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <PlatformBadge platform={service.platform} size={42} />
              <div>
                <p className="text-[11px] font-medium text-muted">{service.platformName}</p>
                <div className="mt-0.5 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-ink/[0.05] px-2 py-0.5 text-[10px] text-muted">
                    {shortTypeName(service.type)}
                  </span>
                  {service.hot ? (
                    <span className="rounded-full bg-lime px-2 py-0.5 text-[10px] font-semibold text-ink">
                      热门
                    </span>
                  ) : null}
                  <span className="num text-[10px] text-muted/60">#{service.id}</span>
                </div>
              </div>
            </div>

            <h1 className="mt-5 break-keep font-display text-[30px] font-semibold leading-[1.24] tracking-[-0.02em] text-ink sm:text-[38px]">
              {service.name}
            </h1>

            <p className="mt-5 max-w-3xl text-[13.5px] leading-[1.9] text-muted">
              {service.name} 是面向 {service.platformName} 的{shortTypeName(service.type)}
              服务，当前目录参考价为{' '}
              <span className="font-medium text-ink">
                ${formatServiceRate(service)} / {rateUnit(service)}
              </span>
              <span className="ml-1 text-[11px] text-muted">
                （原站 {formatCnyRate(service)} / {rateUnit(service)}）
              </span>
              。起订 {formatQuantity(service.min)} {unit}，单次最多 {formatQuantity(service.max)} {unit}，参考交付时间{' '}
              {deliveryLabel(service)}。下单时提供公开的目标链接或用户名即可，USDT 到账与排期由客服确认。
            </p>

            <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                { label: '单价', value: `$${formatServiceRate(service)}` },
                { label: '起订', value: `${formatQuantity(service.min)} ${unit}` },
                { label: '单次上限', value: `${formatQuantity(service.max)} ${unit}` },
                { label: '参考时效', value: deliveryLabel(service) },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl border border-line bg-cream px-4 py-3.5">
                  <p className="text-[9px] tracking-[0.12em] text-muted/70 uppercase">{item.label}</p>
                  <p className="num mt-1.5 truncate text-[13px] font-semibold text-ink">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>

            <section className="mt-10">
              <h2 className="text-[14px] font-semibold text-ink">服务参数</h2>
              <dl className="mt-3 overflow-hidden rounded-2xl border border-line bg-cream">
                {[
                  ['平台', service.platformName],
                  ['服务类型', typeName(service.type)],
                  ['目录分类', service.category],
                  ['计费方式', pricingModeLabel(service)],
                  ['单价', `$${formatServiceRate(service)} / ${rateUnit(service)}`],
                  ['原站单价', `${formatCnyRate(service)} / ${rateUnit(service)}`],
                  ['起订 / 上限', `${formatQuantity(service.min)} – ${formatQuantity(service.max)} ${unit}`],
                  ['参考交付', deliveryLabel(service)],
                  ['服务编号', `#${service.id}`],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="grid grid-cols-[100px_1fr] gap-4 border-b border-line px-4 py-3 last:border-b-0 sm:grid-cols-[140px_1fr] sm:px-5"
                  >
                    <dt className="text-[11px] text-muted">{label}</dt>
                    <dd className="text-[12px] font-medium text-ink">{value}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-2 text-[10px] text-muted/60">
                目录快照更新于 2026-10-30。价格、时效与说明可能随供应变化，结算时以购物车为准。
              </p>
            </section>

            <section className="mt-10">
              <h2 className="text-[14px] font-semibold text-ink">购买说明</h2>
              <dl className="mt-3 overflow-hidden rounded-2xl border border-line bg-cream">
                {[
                  ['开始', service.description.start],
                  ['速度', service.description.speed],
                  ['掉落', service.description.drop],
                  ['补充', service.description.refill],
                  ['链接', service.description.link],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="grid grid-cols-[64px_1fr] gap-4 border-b border-line px-4 py-3 last:border-b-0 sm:grid-cols-[96px_1fr] sm:px-5"
                  >
                    <dt className="text-[11px] text-muted">{label}</dt>
                    <dd className="text-[12px] font-medium text-ink">{value}</dd>
                  </div>
                ))}
              </dl>
              <div className="mt-3 rounded-2xl border border-line bg-lime/25 p-4">
                <p className="text-[11px] font-semibold text-ink">注意</p>
                <ul className="mt-2 space-y-1.5">
                  {service.description.notes.map((note, index) => (
                    <li key={note} className="text-[11px] leading-relaxed text-muted">
                      {index + 1}. {note}
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            <section className="mt-10">
              <h2 className="text-[14px] font-semibold text-ink">购买须知</h2>
              <ul className="mt-3 space-y-2.5">
                {notices.map((notice) => (
                  <li
                    key={notice.text}
                    className="flex gap-3 rounded-2xl border border-line bg-cream px-4 py-3.5"
                  >
                    <notice.icon size={15} className="mt-0.5 shrink-0 text-muted" />
                    <p className="text-[12px] leading-[1.8] text-muted">{notice.text}</p>
                  </li>
                ))}
              </ul>
            </section>

            {related.length ? (
              <section className="mt-12">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="eyebrow">Related</p>
                    <h2 className="mt-2 text-[18px] font-semibold text-ink">同类服务</h2>
                  </div>
                  <Link
                    to={`/services?platform=${service.platform}&type=${service.type}`}
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-muted transition hover:text-ink"
                  >
                    查看更多 <ArrowRight size={12} />
                  </Link>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {related.map((item) => (
                    <ServiceCard key={item.id} service={item} />
                  ))}
                </div>
              </section>
            ) : null}
          </div>

          <aside id="order-card" className="scroll-mt-24 self-start lg:sticky lg:top-24">
            <div className="rounded-[26px] border border-line bg-cream p-5 shadow-soft sm:p-6">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <p className="text-[9px] font-semibold tracking-[0.14em] text-muted/70 uppercase">
                    当前单价
                  </p>
                  <p className="mt-1 flex items-baseline gap-1">
                    <span className="num text-[38px] font-semibold leading-none tracking-[-0.04em] text-ink">
                      ${formatServiceRate(service)}
                    </span>
                    <span className="text-[11px] text-muted">/ {rateUnit(service)}</span>
                  </p>
                  <p className="mt-1 text-[10px] text-muted/70">
                    原站 {formatCnyRate(service)} / {rateUnit(service)}
                  </p>
                </div>
                <span className="rounded-full border border-line px-2.5 py-1 text-[10px] text-muted">
                  {pricingModeLabel(service)}
                </span>
              </div>

              <div className="mt-6">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-semibold text-ink" htmlFor="quantity">
                    购买数量
                  </label>
                  <span className="num text-[10px] text-muted">
                    {formatQuantity(service.min)} – {formatQuantity(service.max)} {unit}
                  </span>
                </div>
                <div className="mt-2 flex items-stretch gap-2">
                  <QuantityStepper
                    service={service}
                    value={quantity}
                    onChange={(value) => setQuantity(clampQuantity(service, value))}
                    className="flex-1 justify-between"
                  />
                </div>
                {quantity >= 10000 ? (
                  <p className="num mt-1 text-right text-[9px] text-muted/60">
                    = {formatQuantity(quantity)} {unit}
                  </p>
                ) : null}
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {presets.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setQuantity(preset)}
                      className={`num h-7 rounded-full border px-2.5 text-[10px] transition ${
                        quantity === preset
                          ? 'border-ink bg-ink text-cream'
                          : 'border-line bg-transparent text-muted hover:border-ink hover:text-ink'
                      }`}
                    >
                      {formatQuantity(preset)}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setQuantity(service.max)}
                    className={`num h-7 rounded-full border px-2.5 text-[10px] transition ${
                      quantity === service.max
                        ? 'border-ink bg-ink text-cream'
                        : 'border-line bg-transparent text-muted hover:border-ink hover:text-ink'
                    }`}
                  >
                    最大
                  </button>
                </div>
              </div>

              <div className="mt-5">
                <label className="text-[11px] font-semibold text-ink" htmlFor="target">
                  目标链接 / 用户名
                </label>
                <textarea
                  id="target"
                  value={target}
                  onChange={(event) => setTarget(event.target.value.slice(0, 500))}
                  rows={3}
                  placeholder={targetPlaceholder(service.platform)}
                  className="mt-2 w-full resize-none rounded-xl border border-line bg-paper px-3 py-2.5 text-[12px] leading-relaxed text-ink outline-none transition placeholder:text-muted/55 focus:border-ink focus:bg-white"
                />
                <p className="mt-1.5 text-[10px] leading-relaxed text-muted/65">
                  可先留空，加入购物车后再补充。请勿填写密码或验证码。
                </p>
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-line pt-4">
                <div>
                  <p className="text-[10px] text-muted">小计</p>
                  <p className="num mt-0.5 text-[26px] font-semibold tracking-[-0.03em] text-ink">
                    {formatMoney(totalCents)}
                  </p>
                </div>
                <span className="num text-[10px] text-muted">
                  {formatQuantity(quantity)} {unit}
                </span>
              </div>

              <button
                type="button"
                onClick={() => handleAdd(false)}
                className="btn btn-dark mt-4 w-full"
              >
                <ShoppingBag size={15} />
                加入购物车
              </button>
              <button
                type="button"
                onClick={() => handleAdd(true)}
                className="btn btn-outline mt-2 w-full"
              >
                立即购买
                <ArrowRight size={14} />
              </button>

              <div className="mt-3 flex items-center justify-center gap-1.5 text-[9.5px] text-muted/65">
                <Lock size={10} /> 不需要账号密码 · USDT 到账后开始排期
              </div>
            </div>

            <div className="mt-3 rounded-2xl border border-line bg-paper px-4 py-3.5">
              <p className="flex items-center gap-1.5 text-[10px] font-semibold text-ink">
                <Info size={11} /> 下单流程
              </p>
              <p className="mt-1.5 text-[10.5px] leading-relaxed text-muted">
                提交订单后，请按页面显示的 USDT-TRC20 地址转账，并把 TxID 发给客服；客服核对到账与目标链接后开始排期。
              </p>
            </div>
          </aside>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-cream/95 px-4 py-3 backdrop-blur lg:hidden">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="num text-[18px] font-semibold text-ink">{formatMoney(totalCents)}</p>
            <p className="text-[10px] text-muted">
              {formatQuantity(quantity)} {unit} · 参考 {deliveryLabel(service)}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleAdd(false)}
              className="btn btn-outline btn-sm"
            >
              加购
            </button>
            <button
              type="button"
              onClick={() => handleAdd(true)}
              className="btn btn-dark btn-sm"
            >
              立即购买
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
