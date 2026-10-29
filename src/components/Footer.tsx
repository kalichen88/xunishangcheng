import { Link } from 'react-router-dom';
import { ArrowUpRight, Mail, Send } from 'lucide-react';
import { Logo } from './Logo';
import { site } from '@/config';

const columns = [
  {
    title: '商城',
    links: [
      { label: '全部服务', to: '/services' },
      { label: '按平台选购', to: '/#platforms' },
      { label: '价格说明', to: '/#pricing' },
      { label: '购物车', to: '/cart' },
    ],
  },
  {
    title: '支持',
    links: [
      { label: '常见问题', to: '/faq' },
      { label: '我的订单', to: '/orders' },
      { label: '服务条款', to: '/terms' },
      { label: '隐私政策', to: '/privacy' },
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-4 overflow-hidden bg-ink text-cream">
      <div className="container-page pt-16 pb-8">
        <div className="grid gap-12 lg:grid-cols-[1.3fr_.7fr_.7fr_1fr]">
          <div>
            <Logo tone="light" />
            <p className="mt-5 max-w-[290px] text-[13px] leading-relaxed text-cream/50">
              独立第三方社媒增长服务商。10 个平台，3,959 项明码标价的服务，按需起量。
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <a
                href={site.telegram}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-9 items-center gap-2 rounded-full border border-cream/15 px-3.5 text-[11px] text-cream/75 transition hover:border-lime hover:text-lime"
              >
                <Send size={12} /> Telegram
              </a>
              <a
                href={`mailto:${site.email}`}
                className="inline-flex h-9 items-center gap-2 rounded-full border border-cream/15 px-3.5 text-[11px] text-cream/75 transition hover:border-lime hover:text-lime"
              >
                <Mail size={12} /> Email
              </a>
            </div>
          </div>

          {columns.map((column) => (
            <div key={column.title}>
              <p className="text-[10px] font-semibold tracking-[0.18em] text-cream/35 uppercase">
                {column.title}
              </p>
              <ul className="mt-4 space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.to}
                      className="text-[13px] text-cream/60 transition hover:text-lime"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <p className="text-[10px] font-semibold tracking-[0.18em] text-cream/35 uppercase">
              联系
            </p>
            <ul className="mt-4 space-y-2.5 text-[13px] text-cream/60">
              <li>
                <a
                  href={site.telegram}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 transition hover:text-lime"
                >
                  {site.telegramHandle} <ArrowUpRight size={12} />
                </a>
              </li>
              <li>
                <a href={`mailto:${site.email}`} className="transition hover:text-lime">
                  {site.email}
                </a>
              </li>
              <li className="pt-1 text-[11px] text-cream/35">{site.serviceHours}</li>
            </ul>
            <p className="mt-5 text-[10px] leading-relaxed text-cream/35">
              支付方式：USDT · 支付宝 · 微信支付 · 银行转账
              <br />
              以客服确认信息为准
            </p>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-3 border-t border-cream/10 pt-6 text-[10px] leading-relaxed text-cream/35 sm:flex-row sm:items-start sm:justify-between">
          <p>© {site.year} {site.name}. All rights reserved.</p>
          <p className="max-w-2xl sm:text-right">
            本站为独立第三方营销服务商，与 Telegram、Meta、TikTok、YouTube、X 等平台无隶属关系。
            所有商标归其各自所有者。服务仅限用于你拥有或有权推广的账号与内容。
          </p>
        </div>
      </div>

      <div className="pointer-events-none select-none px-3 pb-4" aria-hidden="true">
        <p className="font-grotesk text-center text-[clamp(64px,15.5vw,210px)] leading-[0.82] font-bold tracking-[-0.07em] text-cream/[0.055]">
          TIDESMM
        </p>
      </div>
    </footer>
  );
}
