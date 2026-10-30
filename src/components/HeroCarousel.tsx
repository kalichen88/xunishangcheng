import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { catalog, platforms } from '@/lib/catalog';
import { PlatformBadge } from './PlatformIcon';

const TOTAL = catalog.total.toLocaleString('zh-CN');
const PLATFORM_NAMES = [
  'Telegram',
  'Instagram',
  'TikTok',
  'YouTube',
  'X / Twitter',
  'Facebook',
  'WhatsApp',
  'Discord',
  'LinkedIn',
  'Threads',
];

function Ticker({ dark = false }: { dark?: boolean }) {
  return (
    <div
      className={`mt-10 flex flex-wrap items-center gap-x-5 gap-y-2 border-t pt-4 text-[9px] font-semibold uppercase tracking-[0.2em] ${
        dark ? 'border-cream/15 text-cream/45' : 'border-ink/15 text-ink/45'
      }`}
    >
      {PLATFORM_NAMES.map((name) => (
        <span key={name}>{name}</span>
      ))}
    </div>
  );
}

export function HeroCarousel() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const touchStart = useRef<number | null>(null);
  const count = 3;

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener?.('change', update);
    return () => media.removeEventListener?.('change', update);
  }, []);

  useEffect(() => {
    if (paused || reducedMotion) return;
    const timer = window.setInterval(() => setIndex((value) => (value + 1) % count), 6500);
    return () => window.clearInterval(timer);
  }, [paused, reducedMotion, count]);

  const go = (direction: number) => setIndex((value) => (value + direction + count) % count);

  return (
    <section
      className="relative w-full overflow-hidden bg-ink"
      aria-roledescription="carousel"
      aria-label="AU9922 商城亮点"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      onTouchStart={(event) => {
        touchStart.current = event.touches[0]?.clientX ?? null;
      }}
      onTouchEnd={(event) => {
        if (touchStart.current === null) return;
        const delta = (event.changedTouches[0]?.clientX ?? 0) - touchStart.current;
        if (Math.abs(delta) > 50) go(delta > 0 ? -1 : 1);
        touchStart.current = null;
      }}
    >
      <div
        className="flex transition-transform duration-700 ease-[cubic-bezier(.22,1,.36,1)] motion-reduce:transition-none"
        style={{ transform: `translateX(-${index * 100}%)` }}
      >
        <article
          className="relative w-full shrink-0 overflow-hidden bg-lime text-ink"
          aria-hidden={index !== 0}
          inert={index !== 0}
        >
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.09]"
            style={{
              backgroundImage:
                'linear-gradient(to right, #10120c 1px, transparent 1px), linear-gradient(to bottom, #10120c 1px, transparent 1px)',
              backgroundSize: '64px 64px',
            }}
            aria-hidden="true"
          />
          <div className="container-page relative grid min-h-[620px] items-center gap-10 pb-20 pt-14 lg:min-h-[640px] lg:grid-cols-[1.1fr_.9fr] lg:gap-16">
            <div>
              <p className="text-[10px] font-semibold tracking-[0.22em] text-ink/50 uppercase">
                01 / Social growth, made simple
              </p>
              <h1 className="mt-5 max-w-[780px] font-display text-[48px] font-semibold leading-[1.02] tracking-[-0.045em] sm:text-[68px] lg:text-[84px]">
                流量不是玄学，
                <br />
                <span className="relative inline-block">
                  增长可以算清。
                  <span className="absolute bottom-2 left-0 h-3 w-full rounded-full bg-ink/15" />
                </span>
              </h1>
              <p className="mt-6 max-w-[520px] text-[14px] leading-8 text-ink/65">
                {platforms.length} 个平台，{TOTAL} 项服务。单价、起订量、参考时效都摆在明面上——
                先小量试，再放心放量。
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-2.5">
                <Link to="/services" className="btn btn-dark">
                  逛全部服务 <ArrowRight size={15} />
                </Link>
                <Link
                  to="/faq"
                  className="btn btn-outline border-ink/25 text-ink hover:border-ink hover:bg-ink hover:text-lime"
                >
                  怎么下单 <ArrowUpRight size={14} />
                </Link>
                <span className="ml-1 inline-flex items-center gap-2 text-[10px] font-medium text-ink/50">
                  <span className="h-1.5 w-1.5 rounded-full bg-ink" />
                  USDT-TRC20 · 1 USD = 1 USDT
                </span>
              </div>
              <Ticker />
            </div>

            <div className="relative hidden min-h-[430px] lg:block" aria-hidden="true">
              <div className="absolute right-2 top-0 w-[330px] rotate-[2.5deg] rounded-[30px] bg-ink p-6 text-cream shadow-lift">
                <div className="flex items-center justify-between text-[9px] font-semibold tracking-[0.18em] text-cream/35 uppercase">
                  <span>AU Index</span>
                  <span>2026</span>
                </div>
                <p className="num mt-8 text-[76px] font-semibold leading-none tracking-[-0.07em]">
                  {TOTAL}
                </p>
                <p className="mt-2 text-[13px] font-medium text-cream/70">项服务，随时可下单</p>
                <div className="mt-7 flex h-20 items-end gap-1.5">
                  {[34, 48, 42, 60, 53, 70, 62, 84, 76, 96].map((height, barIndex) => (
                    <span
                      key={barIndex}
                      className={`flex-1 rounded-t-[3px] ${
                        barIndex === 9 ? 'bg-lime' : 'bg-cream/20'
                      }`}
                      style={{ height: `${height}%` }}
                    />
                  ))}
                </div>
              </div>

              <div className="absolute bottom-0 left-0 w-[330px] -rotate-[2deg] rounded-[26px] border border-ink/10 bg-cream p-5 text-ink shadow-lift">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-semibold tracking-[0.16em] text-muted uppercase">
                    今日可下单
                  </span>
                  <span className="rounded-full bg-ink px-2 py-1 text-[9px] font-semibold text-lime">
                    即时报价
                  </span>
                </div>
                <div className="mt-4 flex items-center gap-3">
                  <PlatformBadge platform="telegram" size={42} />
                  <div>
                    <p className="text-[12px] font-semibold">Telegram 成员</p>
                    <p className="mt-0.5 text-[10px] text-muted">90 天不掉落 · 59 分钟起</p>
                  </div>
                </div>
                <div className="mt-4 flex items-end justify-between border-t border-line pt-3">
                  <span className="text-[10px] text-muted">每万次起</span>
                  <span className="num text-[20px] font-semibold">$0.87</span>
                </div>
              </div>
            </div>
          </div>
        </article>

        <article
          className="relative w-full shrink-0 overflow-hidden bg-[#5a4bff] text-cream"
          aria-hidden={index !== 1}
          inert={index !== 1}
        >
          <div
            className="pointer-events-none absolute -right-20 top-1/2 h-[560px] w-[560px] -translate-y-1/2 rounded-full border border-cream/15"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -right-10 top-1/2 h-[360px] w-[360px] -translate-y-1/2 rounded-full border border-cream/15"
            aria-hidden="true"
          />
          <div className="container-page relative grid min-h-[620px] items-center gap-10 pb-20 pt-14 lg:min-h-[640px] lg:grid-cols-[1.05fr_.95fr] lg:gap-16">
            <div>
              <p className="text-[10px] font-semibold tracking-[0.22em] text-cream/45 uppercase">
                02 / One cart, ten platforms
              </p>
              <h2 className="mt-5 max-w-[760px] font-display text-[48px] font-semibold leading-[1.02] tracking-[-0.045em] sm:text-[68px] lg:text-[84px]">
                今天起量，
                <br />
                <span className="text-lime">明天被看见。</span>
              </h2>
              <p className="mt-6 max-w-[520px] text-[14px] leading-8 text-cream/65">
                你负责内容，我们负责把第一波人带到你面前。Telegram、Instagram、TikTok、YouTube……
                一个购物车，逛遍所有主流平台。
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-2.5">
                <Link to="/services" className="btn btn-lime">
                  按平台挑服务 <ArrowRight size={15} />
                </Link>
                <Link
                  to="/#pricing"
                  className="btn btn-outline border-cream/25 text-cream hover:border-cream hover:bg-cream hover:text-ink"
                >
                  看看价格 <ArrowUpRight size={14} />
                </Link>
              </div>
              <Ticker dark />
            </div>

            <div className="relative hidden lg:block" aria-hidden="true">
              <div className="rounded-[30px] border border-cream/15 bg-cream/[0.07] p-6 backdrop-blur">
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-[9px] font-semibold tracking-[0.18em] text-cream/40 uppercase">
                      Platform coverage
                    </p>
                    <p className="num mt-2 text-[54px] font-semibold leading-none tracking-[-0.06em] text-lime">
                      {platforms.length}
                    </p>
                  </div>
                  <p className="max-w-[120px] text-right text-[11px] leading-relaxed text-cream/50">
                    个主流平台，
                    <br />
                    一个地方挑完
                  </p>
                </div>
                <div className="mt-6 grid grid-cols-2 gap-2">
                  {platforms.slice(0, 8).map((platform) => (
                    <Link
                      key={platform.key}
                      to={`/services?platform=${platform.key}`}
                      tabIndex={index === 1 ? 0 : -1}
                      className="flex items-center gap-2.5 rounded-xl border border-cream/10 bg-ink/10 px-2.5 py-2 transition hover:border-lime/40 hover:bg-ink/20"
                    >
                      <PlatformBadge platform={platform.key} size={24} rounded="rounded-[7px]" />
                      <span className="min-w-0 flex-1 truncate text-[10.5px] font-medium">
                        {platform.name}
                      </span>
                      <span className="num text-[9px] text-cream/35">{platform.count}</span>
                    </Link>
                  ))}
                </div>
                <div className="mt-5 flex items-center justify-between border-t border-cream/10 pt-4 text-[10px] text-cream/40">
                  <span>全部明码标价</span>
                  <span>多数 100 起</span>
                </div>
              </div>
            </div>
          </div>
        </article>

        <article
          className="relative w-full shrink-0 overflow-hidden bg-paper text-ink"
          aria-hidden={index !== 2}
          inert={index !== 2}
        >
          <div
            className="pointer-events-none absolute -right-24 -top-24 h-[480px] w-[480px] rounded-full bg-coral/15 blur-3xl"
            aria-hidden="true"
          />
          <div className="container-page relative grid min-h-[620px] items-center gap-10 pb-20 pt-14 lg:min-h-[640px] lg:grid-cols-[1.05fr_.95fr] lg:gap-16">
            <div>
              <p className="text-[10px] font-semibold tracking-[0.22em] text-ink/40 uppercase">
                03 / No sign-up. No waiting.
              </p>
              <h2 className="mt-5 max-w-[760px] font-display text-[48px] font-semibold leading-[1.02] tracking-[-0.045em] sm:text-[68px] lg:text-[84px]">
                不用注册，
                <br />
                <span className="text-[#e4563f]">三步就开跑。</span>
              </h2>
              <p className="mt-6 max-w-[520px] text-[14px] leading-8 text-ink/65">
                选服务 → 填链接 → USDT-TRC20 付款。订单自动生成编号，客服核对到账后开始排期。
                不收集账号密码，也不需要等待人工报价。
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-2.5">
                <Link to="/services" className="btn btn-dark">
                  开始选购 <ArrowRight size={15} />
                </Link>
                <Link
                  to="/faq"
                  className="btn btn-outline border-ink/20 text-ink hover:border-ink hover:bg-ink hover:text-lime"
                >
                  常见问题 <ArrowUpRight size={14} />
                </Link>
              </div>
              <Ticker />
            </div>

            <div className="relative hidden lg:block" aria-hidden="true">
              <div className="mx-auto w-[330px] rotate-[2deg] rounded-[30px] border border-ink/10 bg-cream p-6 shadow-lift">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-semibold tracking-[0.16em] text-muted uppercase">
                    订单已生成
                  </span>
                  <span className="rounded-full bg-lime px-2 py-1 text-[9px] font-semibold text-ink">
                    待支付
                  </span>
                </div>
                <div className="mt-5 flex items-center gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-2xl bg-ink text-lime">
                    <span className="text-[11px] font-bold">U</span>
                  </span>
                  <div>
                    <p className="text-[12px] font-semibold">USDT · TRC-20</p>
                    <p className="mt-0.5 text-[9px] text-muted">1 USD = 1 USDT</p>
                  </div>
                </div>
                <p className="num mt-5 text-[42px] font-semibold leading-none tracking-[-0.05em]">
                  $0.01
                </p>
                <p className="mt-1 text-[10px] text-muted">= 0.01 USDT · 扫码或复制地址</p>
                <div className="mt-5 space-y-2 border-t border-line pt-4">
                  {['选一项服务', '填目标链接', 'USDT-TRC20 付款'].map((step, stepIndex) => (
                    <div key={step} className="flex items-center gap-2.5 text-[11px]">
                      <span className="num grid h-5 w-5 place-items-center rounded-full bg-ink text-[9px] text-lime">
                        {stepIndex + 1}
                      </span>
                      <span className="text-muted">{step}</span>
                      <span className="ml-auto text-[9px] text-muted/50">无需注册</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </article>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-5 z-20">
        <div className="container-page flex justify-center">
          <div className="pointer-events-auto flex items-center gap-1 rounded-full border border-cream/15 bg-ink/85 p-1.5 text-cream shadow-lift backdrop-blur">
            <button
              type="button"
              onClick={() => go(-1)}
              className="grid h-8 w-8 place-items-center rounded-full transition hover:bg-cream/10 hover:text-lime"
              aria-label="上一张"
            >
              <ChevronLeft size={15} />
            </button>
            <span className="num min-w-[48px] text-center text-[10px] text-cream/55">
              {String(index + 1).padStart(2, '0')} / 03
            </span>
            <button
              type="button"
              onClick={() => go(1)}
              className="grid h-8 w-8 place-items-center rounded-full transition hover:bg-cream/10 hover:text-lime"
              aria-label="下一张"
            >
              <ChevronRight size={15} />
            </button>
            <span className="mx-2 h-4 w-px bg-cream/15" />
            <div className="flex items-center gap-1.5">
              {[0, 1, 2].map((slide) => (
                <button
                  key={slide}
                  type="button"
                  onClick={() => setIndex(slide)}
                  aria-label={`第 ${slide + 1} 张`}
                  aria-current={index === slide}
                  className={`h-1.5 rounded-full transition-all ${
                    index === slide ? 'w-6 bg-lime' : 'w-1.5 bg-cream/30 hover:bg-cream/60'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
