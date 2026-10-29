import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Copy,
  Mail,
  Send,
  ShieldCheck,
  TriangleAlert,
} from 'lucide-react';
import { usePageMeta } from '@/hooks/usePageMeta';
import { PlatformBadge } from '@/components/PlatformIcon';
import { useToast } from '@/components/Toast';
import { copyText, getOrder, orderChannelLabel, orderText } from '@/lib/orders';
import type { Order } from '@/lib/orders';
import { formatMoney, formatRate } from '@/lib/pricing';
import { paymentLabel, site } from '@/config';

export function OrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState<Order | undefined>(() => getOrder(id ?? ''));
  const { toast } = useToast();
  usePageMeta(order ? `订单 ${order.id}` : '订单详情');

  useEffect(() => {
    setOrder(getOrder(id ?? ''));
  }, [id]);

  if (!order) {
    return (
      <section className="container-page py-24">
        <div className="mx-auto max-w-lg text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-ink/5 text-muted">
            <TriangleAlert size={22} />
          </span>
          <h1 className="mt-5 font-display text-[34px] font-semibold text-ink">找不到这笔订单</h1>
          <p className="mt-3 text-[13px] leading-relaxed text-muted">
            这个浏览器中没有这笔订单的本机记录。如果订单已经提交到后台，可以凭订单号联系客服查询；如果更换了设备或清除了浏览数据，也会出现这种情况。
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link to="/orders" className="btn btn-dark">
              查看本机订单
            </Link>
            <a href={site.telegram} target="_blank" rel="noreferrer" className="btn btn-outline">
              联系客服查询
            </a>
          </div>
        </div>
      </section>
    );
  }

  const createdAt = new Date(order.createdAt);
  const channelLabel = orderChannelLabel(order.channel);
  const steps = [
    {
      title: '订单已生成',
      body: `${createdAt.toLocaleString('zh-CN')} 创建订单 ${order.id}`,
      state: 'done',
    },
    {
      title: '等待客服确认',
      body:
        order.channel === 'telegram'
          ? '订单详情已发送至客服通知通道，客服会通过你留下的联系方式确认支付与目标链接。'
          : order.channel === 'database'
            ? '订单已提交到客服后台，客服会通过你留下的联系方式确认支付与目标链接。'
            : '订单尚未发送给客服。请复制订单信息，通过 Telegram 或邮件发送，等待客服确认。',
      state: 'current',
    },
    {
      title: '开始交付',
      body: '支付与目标链接确认后进入处理队列，实际进度受平台风控与队列影响。',
      state: 'todo',
    },
    {
      title: '订单完成',
      body: '服务完成后可在本机订单记录中查看；如需补单，请按服务约定联系客服。',
      state: 'todo',
    },
  ];

  const handleCopy = async () => {
    const ok = await copyText(orderText(order));
    toast(ok ? '订单信息已复制' : '复制失败，请手动选择订单信息', ok ? 'success' : 'error');
  };

  return (
    <section className="container-page py-10 sm:py-14">
      <Link
        to="/orders"
        className="inline-flex items-center gap-1.5 text-[11px] font-medium text-muted transition hover:text-ink"
      >
        <ArrowLeft size={12} /> 我的订单
      </Link>

      <div className="mt-5 overflow-hidden rounded-[28px] border border-line bg-cream">
        <div className="relative border-b border-line bg-ink px-6 py-8 text-cream sm:px-10 sm:py-10">
          <div className="hero-grid pointer-events-none absolute inset-0 opacity-60" aria-hidden="true" />
          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span className="inline-flex h-7 items-center gap-2 rounded-full border border-cream/15 bg-cream/[0.06] px-3 text-[10px] text-cream/65">
                <span className="h-1.5 w-1.5 rounded-full bg-lime" />
                {channelLabel}
              </span>
              <h1 className="mt-4 font-display text-[34px] font-semibold leading-tight tracking-[-0.02em] sm:text-[42px]">
                {order.channel === 'local' ? '订单已生成。' : '订单已提交。'}
              </h1>
              <p className="mt-2 text-[12px] text-cream/50">
                {order.channel === 'local'
                  ? '请把订单信息发送给客服，确认支付后开始交付。'
                  : '客服会尽快联系你确认支付与交付细节。'}
              </p>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-[9px] tracking-[0.16em] text-cream/35 uppercase">Order no.</p>
              <p className="num mt-1 text-[18px] font-semibold tracking-[0.02em] text-lime">
                {order.id}
              </p>
              <p className="mt-1 text-[10px] text-cream/40">{createdAt.toLocaleString('zh-CN')}</p>
            </div>
          </div>
        </div>

        <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:p-10">
          <div>
            {order.channel === 'local' ? (
              <div className="mb-6 flex items-start gap-3 rounded-2xl border border-lime/60 bg-lime/20 px-4 py-3.5">
                <TriangleAlert size={15} className="mt-0.5 shrink-0 text-ink" />
                <div>
                  <p className="text-[11px] font-semibold text-ink">这笔订单还没有发送给客服</p>
                  <p className="mt-0.5 text-[10.5px] leading-relaxed text-muted">
                    点击右侧「复制订单信息」，通过 Telegram 或邮件发送给客服，确认支付后开始排期。
                  </p>
                </div>
              </div>
            ) : null}

            <h2 className="text-[12px] font-semibold tracking-[0.12em] text-muted uppercase">
              订单进度
            </h2>
            <ol className="mt-4">
              {steps.map((step, index) => (
                <li key={step.title} className="relative flex gap-4 pb-6 last:pb-0">
                  {index < steps.length - 1 ? (
                    <span className="absolute left-[11px] top-6 h-full w-px bg-line" aria-hidden="true" />
                  ) : null}
                  <span
                    className={`relative z-10 mt-0.5 grid h-[23px] w-[23px] shrink-0 place-items-center rounded-full border text-[9px] ${
                      step.state === 'done'
                        ? 'border-ink bg-ink text-lime'
                        : step.state === 'current'
                          ? 'border-ink bg-cream text-ink'
                          : 'border-line bg-cream text-muted/40'
                    }`}
                  >
                    {step.state === 'done' ? (
                      <Check size={11} strokeWidth={3} />
                    ) : (
                      String(index + 1)
                    )}
                  </span>
                  <div>
                    <p
                      className={`text-[12.5px] font-semibold ${
                        step.state === 'todo' ? 'text-muted/50' : 'text-ink'
                      }`}
                    >
                      {step.title}
                      {step.state === 'current' ? (
                        <span className="ml-2 rounded-full bg-ink/[0.06] px-2 py-0.5 text-[9px] font-normal text-muted">
                          当前
                        </span>
                      ) : null}
                    </p>
                    <p className="mt-1 max-w-md text-[10.5px] leading-relaxed text-muted">
                      {step.body}
                    </p>
                  </div>
                </li>
              ))}
            </ol>

            <div className="mt-8 border-t border-line pt-6">
              <div className="flex items-center justify-between">
                <h2 className="text-[12px] font-semibold tracking-[0.12em] text-muted uppercase">
                  服务明细
                </h2>
                <span className="num text-[10px] text-muted">{order.items.length} 项</span>
              </div>
              <ul className="mt-3 divide-y divide-line">
                {order.items.map((item) => (
                  <li key={`${item.serviceId}-${item.target}`} className="flex gap-3 py-4">
                    <PlatformBadge platform={item.platform} size={38} />
                    <div className="min-w-0 flex-1">
                      <Link
                        to={`/service/${item.serviceId}`}
                        className="line-clamp-2 text-[12.5px] font-semibold leading-snug text-ink transition hover:text-violet"
                      >
                        {item.name}
                      </Link>
                      <p className="num mt-1 text-[10px] text-muted">
                        {item.quantity.toLocaleString('zh-CN')} {item.pricing === 'fixed' ? '件' : '次'} × ¥
                        {formatRate(item.rate)} / {item.pricing === 'fixed' ? '件' : '千次'}
                      </p>
                      <p className="mt-1 break-all text-[10px] text-muted">
                        目标：{item.target || '待补充'}
                      </p>
                    </div>
                    <span className="num shrink-0 text-[12px] font-semibold text-ink">
                      {formatMoney(item.subtotalCents)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-8 border-t border-line pt-6">
              <h2 className="text-[12px] font-semibold tracking-[0.12em] text-muted uppercase">
                联系信息
              </h2>
              <dl className="mt-3 grid gap-x-8 gap-y-3 sm:grid-cols-2">
                {[
                  ['称呼', order.customer.name],
                  ['联系方式', order.customer.contact],
                  ['邮箱', order.customer.email || '未填写'],
                  ['支付方式', paymentLabel(order.customer.payment)],
                  ['备注', order.customer.note || '无'],
                ].map(([label, value]) => (
                  <div key={label} className={label === '备注' ? 'sm:col-span-2' : ''}>
                    <dt className="text-[9px] tracking-[0.1em] text-muted/60 uppercase">{label}</dt>
                    <dd className="mt-1 break-all text-[11.5px] text-ink">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>

          <aside className="space-y-3">
            <div className="rounded-2xl border border-line bg-paper p-5">
              <div className="flex items-center justify-between text-[11px] text-muted">
                <span>商品小计</span>
                <span className="num text-ink">{formatMoney(order.totalCents)}</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-[11px] text-muted">
                <span>支付状态</span>
                <span className="text-ink">待确认</span>
              </div>
              <div className="mt-4 flex items-end justify-between border-t border-line pt-4">
                <span className="text-[12px] font-medium text-ink">订单合计</span>
                <span className="num text-[28px] font-semibold tracking-[-0.03em] text-ink">
                  {formatMoney(order.totalCents)}
                </span>
              </div>
              <button type="button" onClick={handleCopy} className="btn btn-dark mt-4 w-full">
                <Copy size={14} />
                复制订单信息
              </button>
              <a
                href={site.telegram}
                target="_blank"
                rel="noreferrer"
                className="btn btn-outline mt-2 w-full"
              >
                <Send size={14} />
                联系客服
              </a>
              <a
                href={`mailto:${site.email}?subject=${encodeURIComponent(`订单 ${order.id}`)}&body=${encodeURIComponent(orderText(order))}`}
                className="mt-2 flex w-full items-center justify-center gap-1.5 py-1 text-[10px] text-muted transition hover:text-ink"
              >
                <Mail size={11} /> 用邮件发送订单
              </a>
            </div>

            <div className="rounded-2xl border border-line bg-paper p-4">
              <p className="flex items-center gap-1.5 text-[10px] font-semibold text-ink">
                <ShieldCheck size={11} /> 安全提示
              </p>
              <p className="mt-1.5 text-[10px] leading-relaxed text-muted">
                客服不会索要账号密码或验证码。请不要把订单信息发送给非官方账号。
              </p>
            </div>

            <div className="rounded-2xl border border-line bg-paper p-4">
              <p className="text-[10px] font-semibold text-ink">订单记录</p>
              <p className="mt-1.5 text-[10px] leading-relaxed text-muted">
                {order.channel === 'telegram'
                  ? '订单已通知客服，同时在本机保留了一份记录。'
                  : order.channel === 'database'
                    ? '订单已提交到客服后台，同时在本机保留了一份记录。'
                    : '订单目前只保存在此浏览器。清除浏览数据会移除记录。'}
              </p>
              <Link
                to="/orders"
                className="mt-2.5 inline-flex items-center gap-1 text-[10px] font-medium text-ink underline underline-offset-2"
              >
                查看全部订单 <ArrowRight size={10} />
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
