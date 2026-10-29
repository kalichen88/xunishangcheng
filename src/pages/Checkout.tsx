import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Loader2, Lock, ShieldCheck } from 'lucide-react';
import { usePageMeta } from '@/hooks/usePageMeta';
import { PlatformBadge } from '@/components/PlatformIcon';
import { useCart } from '@/components/CartProvider';
import { useToast } from '@/components/Toast';
import { buildOrderLine, makeOrder, saveOrder, type CustomerInfo } from '@/lib/orders';
import type { Order } from '@/lib/orders';
import { formatMoney } from '@/lib/pricing';
import { getOrderChannel, submitOrder, type OrderChannel } from '@/lib/api';
import { paymentLabel, paymentMethods, site } from '@/config';

type Errors = Partial<Record<'name' | 'contact' | 'email' | 'agree', string>>;

const steps = ['购物车', '填写信息', '完成'];

export function Checkout() {
  usePageMeta('结算', '填写联系方式与支付方式，提交 TideSMM 订单。');
  const { detailed, itemCount, subtotalCents, clear } = useCart();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [email, setEmail] = useState('');
  const [payment, setPayment] = useState('usdt');
  const [note, setNote] = useState('');
  const [agree, setAgree] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [channel, setChannel] = useState<OrderChannel | 'checking'>('checking');

  useEffect(() => {
    let alive = true;
    getOrderChannel().then((value) => {
      if (alive) setChannel(value);
    });
    return () => {
      alive = false;
    };
  }, []);

  if (itemCount === 0) {
    return (
      <section className="container-page py-24 text-center">
        <p className="eyebrow justify-center">Checkout</p>
        <h1 className="mt-3 font-display text-[38px] font-semibold text-ink">购物车是空的</h1>
        <p className="mt-3 text-[13px] text-muted">先选一项服务，再回来结算。</p>
        <Link to="/services" className="btn btn-dark mt-6">
          浏览全部服务 <ArrowRight size={15} />
        </Link>
      </section>
    );
  }

  const validate = (): Errors => {
    const next: Errors = {};
    if (!name.trim()) next.name = '请填写称呼，方便客服联系你。';
    if (!contact.trim() || contact.trim().length < 3) {
      next.contact = '请填写 Telegram、WhatsApp 或邮箱中的至少一种联系方式。';
    }
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      next.email = '邮箱格式看起来不太对，请检查一下。';
    }
    if (!agree) next.agree = '请先阅读并同意服务条款。';
    return next;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    setSubmitting(true);

    const customer: CustomerInfo = {
      name: name.trim(),
      contact: contact.trim(),
      email: email.trim(),
      payment,
      note: note.trim().slice(0, 500),
    };
    const lines = detailed.map(({ line, service }) =>
      buildOrderLine(service, line.quantity, line.target),
    );
    const localTotal = lines.reduce((sum, item) => sum + item.subtotalCents, 0);

    let order: Order;
    if (channel === 'telegram' || channel === 'database') {
      const result = await submitOrder({
        customer,
        items: detailed.map(({ line }) => ({
          id: line.serviceId,
          quantity: line.quantity,
          target: line.target,
        })),
      });
      if (result.ok) {
        order = {
          id: result.orderId,
          createdAt: new Date().toISOString(),
          channel: result.notified ? 'telegram' : 'database',
          status: 'pending',
          customer,
          items: lines,
          totalCents: result.totalCents || localTotal,
        };
      } else {
        order = makeOrder(lines, customer, 'local');
        toast('客服通道暂时不可用，订单已保存在本机', 'info');
      }
    } else {
      order = makeOrder(lines, customer, 'local');
    }

    saveOrder(order);
    clear();
    navigate(`/order/${order.id}`, { replace: true });
  };

  return (
    <section className="container-page py-10 sm:py-14">
      <div className="flex flex-wrap items-center gap-2 text-[10px] text-muted/60">
        {steps.map((step, index) => (
          <span key={step} className="flex items-center gap-2">
            <span
              className={`grid h-5 w-5 place-items-center rounded-full text-[9px] ${
                index === 0
                  ? 'bg-ink text-cream'
                  : index === 1
                    ? 'bg-lime text-ink'
                    : 'border border-line text-muted/50'
              }`}
            >
              {index === 0 ? <Check size={10} strokeWidth={3} /> : index + 1}
            </span>
            <span className={index === 1 ? 'font-medium text-ink' : ''}>{step}</span>
            {index < steps.length - 1 ? <span className="mx-1 text-line-strong">/</span> : null}
          </span>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Checkout</p>
          <h1 className="mt-3 font-display text-[38px] font-semibold tracking-[-0.025em] text-ink sm:text-[48px]">
            填写订单信息
          </h1>
          <p className="mt-2 text-[12px] text-muted">
            {itemCount} 项服务 · 合计{' '}
            <span className="num font-semibold text-ink">{formatMoney(subtotalCents)}</span>
          </p>
        </div>
        <Link
          to="/cart"
          className="inline-flex items-center gap-1.5 text-[12px] font-medium text-muted transition hover:text-ink"
        >
          <ArrowLeft size={13} /> 返回购物车
        </Link>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="rounded-[24px] border border-line bg-cream p-5 sm:p-7">
            <div className="flex items-center gap-3">
              <span className="num grid h-7 w-7 place-items-center rounded-full bg-ink text-[10px] text-cream">
                01
              </span>
              <div>
                <h2 className="text-[15px] font-semibold text-ink">联系方式</h2>
                <p className="text-[10.5px] text-muted">客服会通过这里确认支付与交付。</p>
              </div>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="field-label" htmlFor="name">
                  称呼 <span className="text-coral">*</span>
                </label>
                <input
                  id="name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className={`field ${errors.name ? 'border-coral' : ''}`}
                  placeholder="怎么称呼你"
                  autoComplete="name"
                  aria-invalid={Boolean(errors.name)}
                />
                {errors.name ? <p className="mt-1.5 text-[10px] text-coral">{errors.name}</p> : null}
              </div>
              <div>
                <label className="field-label" htmlFor="contact">
                  Telegram / WhatsApp <span className="text-coral">*</span>
                </label>
                <input
                  id="contact"
                  value={contact}
                  onChange={(event) => setContact(event.target.value)}
                  className={`field ${errors.contact ? 'border-coral' : ''}`}
                  placeholder="@username 或 +86…"
                  autoComplete="off"
                  aria-invalid={Boolean(errors.contact)}
                />
                {errors.contact ? (
                  <p className="mt-1.5 text-[10px] text-coral">{errors.contact}</p>
                ) : null}
              </div>
              <div className="sm:col-span-2">
                <label className="field-label" htmlFor="email">
                  邮箱 <span className="font-normal text-muted/60">（可选，用于订单备份）</span>
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className={`field ${errors.email ? 'border-coral' : ''}`}
                  placeholder="you@example.com"
                  autoComplete="email"
                  aria-invalid={Boolean(errors.email)}
                />
                {errors.email ? (
                  <p className="mt-1.5 text-[10px] text-coral">{errors.email}</p>
                ) : null}
              </div>
            </div>
          </div>

          <div className="rounded-[24px] border border-line bg-cream p-5 sm:p-7">
            <div className="flex items-center gap-3">
              <span className="num grid h-7 w-7 place-items-center rounded-full bg-ink text-[10px] text-cream">
                02
              </span>
              <div>
                <h2 className="text-[15px] font-semibold text-ink">支付方式</h2>
                <p className="text-[10.5px] text-muted">提交后由客服发送收款信息，本页不会直接扣款。</p>
              </div>
            </div>

            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              {paymentMethods.map((method) => {
                const selected = payment === method.key;
                return (
                  <label
                    key={method.key}
                    className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-3.5 transition ${
                      selected
                        ? 'border-ink bg-ink text-cream'
                        : 'border-line bg-paper/60 text-ink hover:border-line-strong'
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value={method.key}
                      checked={selected}
                      onChange={() => setPayment(method.key)}
                      className="sr-only"
                    />
                    <span
                      className={`mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full border ${
                        selected ? 'border-lime bg-lime text-ink' : 'border-line-strong'
                      }`}
                    >
                      {selected ? <Check size={9} strokeWidth={3} /> : null}
                    </span>
                    <span>
                      <span className="block text-[12px] font-semibold">{method.label}</span>
                      <span
                        className={`mt-0.5 block text-[10px] leading-relaxed ${
                          selected ? 'text-cream/50' : 'text-muted'
                        }`}
                      >
                        {method.hint}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="rounded-[24px] border border-line bg-cream p-5 sm:p-7">
            <div className="flex items-center gap-3">
              <span className="num grid h-7 w-7 place-items-center rounded-full bg-ink text-[10px] text-cream">
                03
              </span>
              <div>
                <h2 className="text-[15px] font-semibold text-ink">补充说明</h2>
                <p className="text-[10.5px] text-muted">可以写目标地区、交付节奏或特殊要求。</p>
              </div>
            </div>
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value.slice(0, 500))}
              rows={4}
              placeholder="例如：分两天交付；目标链接稍后补充；需要指定国家…"
              className="field mt-5 resize-none"
            />
            <p className="mt-1.5 text-right text-[10px] text-muted/50">{note.length} / 500</p>
          </div>

          <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-line bg-paper/60 p-4">
            <input
              type="checkbox"
              checked={agree}
              onChange={(event) => setAgree(event.target.checked)}
              className="sr-only"
            />
            <span
              className={`mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-[5px] border ${
                agree ? 'border-ink bg-ink text-lime' : 'border-line-strong'
              }`}
            >
              {agree ? <Check size={10} strokeWidth={3} /> : null}
            </span>
            <span className="text-[10.5px] leading-relaxed text-muted">
              我已阅读并同意
              <Link to="/terms" className="mx-1 text-ink underline underline-offset-2">
                服务条款
              </Link>
              与
              <Link to="/privacy" className="mx-1 text-ink underline underline-offset-2">
                隐私政策
              </Link>
              ，确认提交的是我拥有或有权推广的公开链接。
            </span>
          </label>
          {errors.agree ? <p className="text-[10px] text-coral">{errors.agree}</p> : null}

          <button
            type="submit"
            disabled={submitting || channel === 'checking'}
            className="btn btn-dark w-full disabled:cursor-wait disabled:opacity-60"
          >
            {submitting ? (
              <>
                <Loader2 size={15} className="animate-spin" /> 正在提交…
              </>
            ) : channel === 'checking' ? (
              <>
                <Loader2 size={15} className="animate-spin" /> 正在连接客服通道…
              </>
            ) : (
              <>
                提交订单
                <ArrowRight size={15} />
              </>
            )}
          </button>

          <div className="flex flex-col items-center gap-2 text-center">
            <p className="flex items-center gap-1.5 text-[10px] text-muted/65">
              <Lock size={10} /> 不会收集账号密码或验证码
            </p>
            <p className="text-[10px] text-muted/55">
              {channel === 'telegram'
                ? '订单会实时发送给客服，请留意你的联系方式。'
                : channel === 'database'
                  ? '订单会提交到客服后台，请等待确认支付与交付细节。'
                  : channel === 'none'
                    ? '当前为本机订单模式：提交后请复制订单信息，通过客服渠道发送。'
                    : '正在检测订单通知通道…'}
            </p>
          </div>
        </form>

        <aside className="self-start lg:sticky lg:top-24">
          <div className="rounded-[24px] border border-line bg-cream p-5 shadow-soft sm:p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-[14px] font-semibold text-ink">订单摘要</h2>
              <span className="num text-[10px] text-muted">{itemCount} 项</span>
            </div>
            <ul className="mt-4 space-y-3">
              {detailed.map(({ line, service, subtotalCents: lineTotal }) => (
                <li key={service.id} className="flex items-start gap-2.5">
                  <PlatformBadge platform={service.platform} size={32} />
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-[11px] font-medium leading-snug text-ink">
                      {service.name}
                    </p>
                    <p className="num mt-0.5 text-[9.5px] text-muted">
                      {line.quantity.toLocaleString('zh-CN')}{' '}
                      {service.pricing === 'fixed' ? '件' : '次'}
                      {line.target ? (
                        <span className="ml-1 text-mint">· 目标已填</span>
                      ) : (
                        <span className="ml-1 text-muted/60">· 目标待补充</span>
                      )}
                    </p>
                  </div>
                  <span className="num shrink-0 text-[11px] font-semibold text-ink">
                    {formatMoney(lineTotal)}
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-5 border-t border-line pt-4">
              <div className="flex items-center justify-between text-[11px] text-muted">
                <span>商品小计</span>
                <span className="num text-ink">{formatMoney(subtotalCents)}</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-[11px] text-muted">
                <span>支付方式</span>
                <span className="text-ink">{paymentLabel(payment)}</span>
              </div>
              <div className="mt-4 flex items-end justify-between border-t border-line pt-4">
                <span className="text-[12px] font-medium text-ink">应付合计</span>
                <span className="num text-[28px] font-semibold tracking-[-0.03em] text-ink">
                  {formatMoney(subtotalCents)}
                </span>
              </div>
            </div>
            <p className="mt-4 flex items-start gap-1.5 text-[10px] leading-relaxed text-muted/70">
              <ShieldCheck size={12} className="mt-0.5 shrink-0" />
              最终金额以客服确认的支付信息为准。未开始交付前可联系客服协商取消。
            </p>
          </div>

          <div className="mt-3 rounded-2xl border border-line bg-paper px-4 py-3.5 text-[10.5px] leading-relaxed text-muted">
            需要改数量或目标链接？
            <Link to="/cart" className="ml-1 font-medium text-ink underline underline-offset-2">
              返回购物车
            </Link>
            ，或提交后在客服确认时提出。
          </div>

          <div className="mt-3 rounded-2xl border border-line bg-paper px-4 py-3.5 text-[10.5px] leading-relaxed text-muted">
            客服：{site.telegramHandle} · {site.email}
          </div>
        </aside>
      </div>
    </section>
  );
}
