import { useCallback, useEffect, useState } from 'react';
import {
  KeyRound,
  Loader2,
  LogOut,
  RefreshCw,
  ShieldCheck,
  ShoppingBag,
} from 'lucide-react';
import { usePageMeta } from '@/hooks/usePageMeta';
import { fetchAdminOrders, type AdminOrder } from '@/lib/api';
import { formatMoney, formatQuantity, formatRate } from '@/lib/pricing';
import { paymentLabel } from '@/config';

const TOKEN_KEY = 'tidesmm:admin-token';

function errorMessage(reason: string): string {
  switch (reason) {
    case 'unauthorized':
      return '管理令牌不正确，请重新输入。';
    case 'admin_not_configured':
      return '后台尚未配置 ADMIN_TOKEN。请在项目目录运行 wrangler secret put ADMIN_TOKEN，再刷新本页。';
    case 'store_not_configured':
      return '订单数据库尚未绑定，请检查 wrangler.jsonc 的 D1 配置。';
    case 'network_error':
      return '无法连接订单接口，请检查网络或稍后再试。';
    case 'http_503':
      return '订单后台暂时不可用，请稍后再试。';
    default:
      return `加载失败（${reason}）。请稍后再试。`;
  }
}

export function Admin() {
  usePageMeta('订单后台');
  const [token, setToken] = useState('');
  const [authed, setAuthed] = useState(false);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex,nofollow';
    document.head.appendChild(meta);
    return () => {
      document.head.removeChild(meta);
    };
  }, []);

  const load = useCallback(async (value: string, remember: boolean) => {
    setLoading(true);
    setError('');
    const result = await fetchAdminOrders(value);
    if (result.ok) {
      setOrders(result.orders);
      setAuthed(true);
      setToken(value);
      if (remember) window.sessionStorage.setItem(TOKEN_KEY, value);
    } else {
      setAuthed(false);
      setError(errorMessage(result.reason));
      if (result.reason === 'unauthorized') window.sessionStorage.removeItem(TOKEN_KEY);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const saved = window.sessionStorage.getItem(TOKEN_KEY);
    if (saved) void load(saved, false);
  }, [load]);

  const totalRevenue = orders.reduce((sum, order) => sum + order.totalCents, 0);
  const notifiedCount = orders.filter((order) => order.telegramSent).length;

  if (!authed) {
    return (
      <section className="container-page py-16 sm:py-24">
        <div className="mx-auto max-w-md">
          <p className="eyebrow justify-center">Admin</p>
          <h1 className="mt-4 text-center font-display text-[38px] font-semibold tracking-[-0.02em] text-ink">
            订单后台
          </h1>
          <p className="mt-3 text-center text-[12px] leading-relaxed text-muted">
            输入 Worker 的 ADMIN_TOKEN 查看订单。令牌只保存在当前标签页的 sessionStorage。
          </p>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              if (token.trim()) void load(token.trim(), true);
            }}
            className="mt-8 rounded-[24px] border border-line bg-cream p-6 shadow-soft"
          >
            <label className="field-label" htmlFor="admin-token">
              管理令牌
            </label>
            <div className="relative">
              <KeyRound
                size={15}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
              />
              <input
                id="admin-token"
                type="password"
                value={token}
                onChange={(event) => setToken(event.target.value)}
                className="field pl-10"
                placeholder="ADMIN_TOKEN"
                autoComplete="current-password"
              />
            </div>
            {error ? (
              <p className="mt-3 rounded-xl bg-coral/10 px-3 py-2 text-[10.5px] leading-relaxed text-coral">
                {error}
              </p>
            ) : null}
            <button
              type="submit"
              disabled={loading || !token.trim()}
              className="btn btn-dark mt-4 w-full disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
              {loading ? '正在验证…' : '进入后台'}
            </button>
          </form>

          <p className="mt-4 text-center text-[10px] leading-relaxed text-muted/60">
            首次使用：运行 <code className="rounded bg-ink/5 px-1 py-0.5">wrangler secret put ADMIN_TOKEN</code>
            ，设置一个足够长的随机值。
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="container-page py-10 sm:py-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Admin</p>
          <h1 className="mt-3 font-display text-[38px] font-semibold tracking-[-0.025em] text-ink sm:text-[46px]">
            订单后台
          </h1>
          <p className="mt-2 text-[11px] text-muted">
            最近 {orders.length} 笔订单 · 数据来自 Cloudflare D1
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => void load(token, false)}
            disabled={loading}
            className="btn btn-outline btn-sm"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            刷新
          </button>
          <button
            type="button"
            onClick={() => {
              window.sessionStorage.removeItem(TOKEN_KEY);
              setAuthed(false);
              setOrders([]);
              setToken('');
            }}
            className="btn btn-ghost btn-sm"
          >
            <LogOut size={13} /> 退出
          </button>
        </div>
      </div>

      <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: '订单数', value: String(orders.length) },
          { label: '订单总额', value: formatMoney(totalRevenue) },
          { label: '待确认', value: String(orders.length) },
          { label: '已通知 Telegram', value: String(notifiedCount) },
        ].map((item) => (
          <div key={item.label} className="rounded-2xl border border-line bg-cream p-4">
            <p className="text-[9px] tracking-[0.12em] text-muted/70 uppercase">{item.label}</p>
            <p className="num mt-1.5 text-[20px] font-semibold text-ink">{item.value}</p>
          </div>
        ))}
      </div>

      {error ? (
        <p className="mt-4 rounded-xl bg-coral/10 px-4 py-3 text-[11px] text-coral">{error}</p>
      ) : null}

      {orders.length === 0 ? (
        <div className="mt-6 rounded-[24px] border border-dashed border-line-strong bg-cream px-6 py-20 text-center">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-ink/5 text-muted">
            <ShoppingBag size={20} />
          </span>
          <p className="mt-4 text-[14px] font-semibold text-ink">还没有订单</p>
          <p className="mt-1.5 text-[11px] text-muted">新订单会出现在这里。</p>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {orders.map((order) => (
            <div key={order.id} className="rounded-[22px] border border-line bg-cream p-4 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="num text-[13px] font-semibold text-ink">{order.id}</p>
                  <p className="mt-1 text-[10px] text-muted">
                    {new Date(order.createdAt).toLocaleString('zh-CN')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[9px] ${
                      order.telegramSent
                        ? 'bg-mint/10 text-mint'
                        : 'bg-ink/[0.06] text-muted'
                    }`}
                  >
                    {order.telegramSent ? 'Telegram 已通知' : '仅入库'}
                  </span>
                  <span className="num text-[16px] font-semibold text-ink">
                    {formatMoney(order.totalCents)}
                  </span>
                </div>
              </div>

              <div className="mt-3 grid gap-3 text-[11px] sm:grid-cols-3">
                <div>
                  <p className="text-[9px] text-muted/60">客户</p>
                  <p className="mt-0.5 text-ink">{order.customer.name}</p>
                </div>
                <div>
                  <p className="text-[9px] text-muted/60">联系方式</p>
                  <p className="mt-0.5 break-all text-ink">{order.customer.contact}</p>
                </div>
                <div>
                  <p className="text-[9px] text-muted/60">支付方式</p>
                  <p className="mt-0.5 text-ink">{paymentLabel(order.customer.payment)}</p>
                </div>
              </div>

              <details className="mt-3 border-t border-line pt-3">
                <summary className="cursor-pointer text-[10.5px] font-medium text-muted transition hover:text-ink">
                  查看 {order.items.length} 项服务明细
                </summary>
                <ul className="mt-3 divide-y divide-line">
                  {order.items.map((item, index) => (
                    <li key={`${item.serviceId}-${index}`} className="flex gap-3 py-2.5">
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-medium text-ink">{item.name}</p>
                        <p className="num mt-0.5 text-[10px] text-muted">
                          {formatQuantity(item.quantity)} × ${formatRate(item.rate)} /{' '}
                          {item.pricing === 'fixed' ? '件' : '1k'} · 目标：
                          {item.target || '待补充'}
                        </p>
                      </div>
                      <span className="num text-[11px] text-ink">
                        {formatMoney(item.subtotalCents)}
                      </span>
                    </li>
                  ))}
                </ul>
              </details>

              {order.customer.note ? (
                <p className="mt-2 rounded-lg bg-paper px-3 py-2 text-[10px] text-muted">
                  备注：{order.customer.note}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      )}

      <p className="mt-6 text-center text-[10px] text-muted/50">
        订单数据存储在 Cloudflare D1 · 页面不索引 · 令牌仅保存在当前标签页
      </p>
    </section>
  );
}
