import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Inbox, RefreshCw, Send } from 'lucide-react';
import { usePageMeta } from '@/hooks/usePageMeta';
import { PlatformBadge } from '@/components/PlatformIcon';
import { orderChannelLabel, readOrders } from '@/lib/orders';
import type { Order } from '@/lib/orders';
import { formatMoney } from '@/lib/pricing';
import { paymentLabel } from '@/config';

export function Orders() {
  usePageMeta('我的订单', '查看保存在本机的 TideSMM 订单记录。');
  const [orders, setOrders] = useState<Order[]>(() => readOrders());

  const refresh = () => setOrders(readOrders());

  useEffect(() => {
    refresh();
    const onFocus = () => refresh();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  return (
    <section className="container-page py-10 sm:py-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">My orders</p>
          <h1 className="mt-3 font-display text-[38px] font-semibold tracking-[-0.025em] text-ink sm:text-[48px]">
            我的订单
          </h1>
          <p className="mt-2 text-[12px] text-muted">
            订单记录保存在当前浏览器，共 <span className="num">{orders.length}</span> 笔。
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={refresh} className="btn btn-outline btn-sm">
            <RefreshCw size={13} /> 刷新
          </button>
          <Link to="/services" className="btn btn-dark btn-sm">
            继续选购 <ArrowRight size={13} />
          </Link>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="mt-8 rounded-[24px] border border-dashed border-line-strong bg-cream px-6 py-20 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-ink/5 text-muted">
            <Inbox size={22} />
          </span>
          <p className="mt-4 text-[15px] font-semibold text-ink">还没有订单记录</p>
          <p className="mx-auto mt-2 max-w-sm text-[12px] leading-relaxed text-muted">
            完成一次下单后，订单会出现在这里。订单只保存在当前浏览器；如已清除浏览数据，请通过订单号联系客服查询。
          </p>
          <Link to="/services" className="btn btn-dark mt-6">
            浏览全部服务 <ArrowRight size={14} />
          </Link>
        </div>
      ) : (
        <div className="mt-8 space-y-3">
          {orders.map((order) => (
            <Link
              key={order.id}
              to={`/order/${order.id}`}
              className="group block rounded-[22px] border border-line bg-cream p-5 transition hover:border-line-strong hover:shadow-soft sm:p-6"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="num text-[13px] font-semibold text-ink">{order.id}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[9px] font-medium ${
                      order.channel === 'telegram'
                        ? 'bg-mint/10 text-mint'
                        : order.channel === 'database'
                          ? 'bg-violet/10 text-violet'
                          : 'bg-ink/[0.06] text-muted'
                    }`}
                  >
                    {orderChannelLabel(order.channel)}
                  </span>
                </div>
                <span className="text-[10px] text-muted">
                  {new Date(order.createdAt).toLocaleString('zh-CN')}
                </span>
              </div>

              <div className="mt-4 grid gap-5 sm:grid-cols-[1.4fr_1fr_auto] sm:items-center">
                <div className="min-w-0">
                  <ul className="space-y-2">
                    {order.items.slice(0, 2).map((item) => (
                      <li key={`${item.serviceId}-${item.target}`} className="flex items-center gap-2">
                        <PlatformBadge platform={item.platform} size={26} rounded="rounded-[8px]" />
                        <span className="truncate text-[11.5px] text-ink">{item.name}</span>
                      </li>
                    ))}
                  </ul>
                  {order.items.length > 2 ? (
                    <p className="mt-1.5 num text-[10px] text-muted">
                      + {order.items.length - 2} 项服务
                    </p>
                  ) : null}
                </div>
                <div className="text-[10.5px] text-muted">
                  <p>
                    支付方式：<span className="text-ink">{paymentLabel(order.customer.payment)}</span>
                  </p>
                  <p className="mt-1">状态：待客服确认</p>
                </div>
                <div className="flex items-center justify-between gap-4 sm:justify-end">
                  <span className="num text-[20px] font-semibold tracking-[-0.02em] text-ink">
                    {formatMoney(order.totalCents)}
                  </span>
                  <span className="grid h-8 w-8 place-items-center rounded-full border border-line text-muted transition group-hover:border-ink group-hover:bg-ink group-hover:text-cream">
                    <ArrowRight size={13} />
                  </span>
                </div>
              </div>

              {order.channel === 'local' ? (
                <p className="mt-4 flex items-center gap-1.5 border-t border-line pt-3 text-[10px] text-muted/70">
                  <Send size={10} /> 这笔订单尚未通知客服，打开详情后可复制并发送。
                </p>
              ) : null}
            </Link>
          ))}
        </div>
      )}

      <p className="mt-6 text-center text-[10px] leading-relaxed text-muted/55">
        订单记录仅保存在当前浏览器。更换设备或清除浏览数据后，请通过订单号联系客服查询。
      </p>
    </section>
  );
}
