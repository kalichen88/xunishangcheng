import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ArrowUpRight,
  BadgePercent,
  Layers3,
  Link2,
  PackageCheck,
  ReceiptText,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { usePageMeta } from '@/hooks/usePageMeta';
import { Reveal } from '@/components/Reveal';
import { SectionHeading } from '@/components/SectionHeading';
import { PlatformBadge } from '@/components/PlatformIcon';
import { ServiceCard } from '@/components/ServiceCard';
import { FaqAccordion } from '@/components/FaqAccordion';
import { HeroCarousel } from '@/components/HeroCarousel';
import { HeroSearch } from '@/components/HeroSearch';
import {
  catalog,
  featuredServices,
  getService,
  minRateForPlatform,
  platforms,
  shortTypeName,
} from '@/lib/catalog';
import {
  deliveryLabel,
  formatMoney,
  formatQuantity,
  formatRate,
  formatServiceRate,
  itemSubtotalCents,
} from '@/lib/pricing';
import { faqItems } from '@/content/faq';

const heroService = getService(885) ?? featuredServices[0];

const whyFeatures = [
  {
    icon: BadgePercent,
    title: '价格写在明面上',
    body: '每万次或整包的单价、起订量、参考时效都展示在商品页。下单前就能算清总价，不用先问价再猜预算。',
  },
  {
    icon: TrendingUp,
    title: '起量不必从大开始',
    body: '多数服务 10–100 起订。先用小预算验证内容与受众，再逐步放量，把试错成本留在可控范围内。',
  },
  {
    icon: ReceiptText,
    title: '订单有迹可循',
    body: '每笔订单生成独立编号，目标链接、数量、单价与金额完整留档，随时回到「我的订单」核对。',
  },
  {
    icon: ShieldCheck,
    title: '售后按服务约定',
    body: '是否支持补单、补单时限与退款条件随服务说明展示。我们不会索要账号密码或验证码。',
  },
];

const steps = [
  {
    icon: Layers3,
    title: '选一项服务',
    body: '按平台或场景筛选，确认起订量、单价与参考时效。拿不准就发给客服，帮你搭配。',
  },
  {
    icon: Link2,
    title: '填目标链接',
    body: '把公开的频道、帖子或视频链接填进购物车，核对数量与金额，提交订单。',
  },
  {
    icon: PackageCheck,
    title: '确认并交付',
    body: '按页面显示的 USDT-TRC20 地址转账，客服核对后开始排期。订单进度与售后都围绕订单号跟进。',
  },
];

function PlatformStrip() {
  return (
    <div className="container-page mt-6">
      <div className="border-y border-line py-4">
        <p className="mb-3 text-[9px] font-semibold tracking-[0.18em] text-muted/70 uppercase">
          覆盖平台
        </p>
        <div className="no-scrollbar -mx-5 flex items-center gap-5 overflow-x-auto px-5 sm:-mx-8 sm:px-8 lg:mx-0 lg:grid lg:grid-cols-5 lg:gap-x-6 lg:gap-y-3 lg:overflow-visible lg:px-0">
          {platforms.map((platform) => {
            const minRate = minRateForPlatform(platform.key);
            return (
              <Link
                key={platform.key}
                to={`/services?platform=${platform.key}`}
                className="group flex shrink-0 items-center gap-2 text-[11px] text-muted transition hover:text-ink lg:shrink"
              >
                <PlatformBadge platform={platform.key} size={22} rounded="rounded-[7px]" />
                <span className="font-medium">{platform.name}</span>
                <span className="num text-[10px] text-muted/50 group-hover:text-muted">
                  {minRate !== null ? `$${formatRate(minRate)} 万次起` : `${platform.count} 项`}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function PlatformsSection() {
  return (
    <section id="platforms" className="section scroll-mt-24">
      <div className="container-page">
        <SectionHeading
          eyebrow="Platforms"
          title={
            <>
              一个购物车，
              <br className="hidden sm:block" />
              逛遍 {platforms.length} 个平台
            </>
          }
          description="从频道成员到视频播放，按平台筛选，按需求起量。每个平台都有独立的服务目录与价格区间。"
          action={
            <Link to="/services" className="btn btn-outline">
              查看完整目录
              <ArrowRight size={15} />
            </Link>
          }
        />

        <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {platforms.map((platform, index) => {
            const minRate = minRateForPlatform(platform.key);
            return (
              <Reveal key={platform.key} delay={index * 35}>
                <Link
                  to={`/services?platform=${platform.key}`}
                  className="group relative flex h-full flex-col overflow-hidden rounded-[22px] border border-line bg-cream p-5 transition duration-300 hover:-translate-y-1 hover:border-line-strong hover:shadow-soft"
                >
                  <div className="flex items-start justify-between">
                    <PlatformBadge platform={platform.key} size={46} />
                    <ArrowUpRight
                      size={16}
                      className="text-muted opacity-0 transition group-hover:opacity-100"
                    />
                  </div>
                  <div className="mt-7">
                    <p className="text-[15px] font-semibold tracking-[-0.01em] text-ink">
                      {platform.name}
                    </p>
                    <p className="num mt-1 text-[11px] text-muted">{platform.count} 项服务</p>
                  </div>
                  <p className="mt-4 text-[10px] text-muted/70">
                    {minRate !== null ? `$${formatRate(minRate)} 起 / 万次` : '整包服务'}
                  </p>
                </Link>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function FeaturedSection() {
  return (
    <section className="section pt-0">
      <div className="container-page">
        <SectionHeading
          eyebrow="Editor's picks"
          title="先看这几项"
          description={`从 ${catalog.total.toLocaleString('zh-CN')} 项服务里，挑出覆盖面广、起订友好的 ${featuredServices.length} 项。`}
          action={
            <Link to="/services" className="btn btn-dark">
              全部服务
              <ArrowUpRight size={15} />
            </Link>
          }
        />
        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {featuredServices.map((service, index) => (
            <Reveal key={service.id} delay={(index % 4) * 45}>
              <ServiceCard service={service} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function WhySection() {
  return (
    <section className="section pt-0">
      <div className="container-page">
        <Reveal className="overflow-hidden rounded-[30px] border border-line bg-cream p-6 sm:p-10 lg:p-14">
          <div className="grid gap-12 lg:grid-cols-[.92fr_1.08fr]">
            <div className="self-start lg:sticky lg:top-28">
              <p className="eyebrow">Why AU9922</p>
              <h2 className="mt-4 font-display text-[34px] font-semibold leading-[1.16] tracking-[-0.02em] text-ink sm:text-[44px]">
                把复杂的事，
                <br />
                留在后台。
              </h2>
              <p className="mt-5 max-w-md text-[14px] leading-relaxed text-muted">
                社媒增长不该是一张看不懂的报价单。我们把服务、价格和流程拆开摆好，让你在下单前就知道会发生什么。
              </p>
              <Link to="/faq" className="btn btn-outline mt-7">
                查看常见问题
                <ArrowRight size={15} />
              </Link>
            </div>

            <div className="divide-y divide-line">
              {whyFeatures.map((feature, index) => (
                <div
                  key={feature.title}
                  className="grid grid-cols-[42px_1fr] gap-4 py-6 first:pt-0 last:pb-0"
                >
                  <div className="flex flex-col items-start gap-3">
                    <span className="num text-[10px] text-muted/60">0{index + 1}</span>
                    <span className="grid h-9 w-9 place-items-center rounded-full bg-ink text-lime">
                      <feature.icon size={16} strokeWidth={1.8} />
                    </span>
                  </div>
                  <div>
                    <h3 className="text-[15px] font-semibold text-ink">{feature.title}</h3>
                    <p className="mt-1.5 text-[12.5px] leading-[1.85] text-muted">{feature.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function PricingSection() {
  const rows = featuredServices.slice(0, 6);
  return (
    <section id="pricing" className="section scroll-mt-24 pt-0">
      <div className="container-page">
        <SectionHeading
          eyebrow="Transparent pricing"
          title="价格长什么样？"
          description="以下是目录中的真实条目。没有套餐迷雾：单价 × 数量就是总价。最终金额以购物车与客服确认为准。"
          action={
            <Link to="/services?sort=price-asc" className="btn btn-outline">
              按价格浏览
              <ArrowRight size={15} />
            </Link>
          }
        />

        <Reveal className="mt-10 overflow-hidden rounded-[26px] border border-line bg-cream">
          <div className="divide-y divide-line md:hidden">
            {rows.map((service) => (
              <Link
                key={service.id}
                to={`/service/${service.id}`}
                className="flex items-start gap-3 px-4 py-4 transition hover:bg-paper/60"
              >
                <PlatformBadge platform={service.platform} size={34} />
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-[12.5px] font-medium leading-snug text-ink">
                    {service.name}
                  </p>
                  <p className="mt-1 text-[10px] text-muted">
                    {shortTypeName(service.type)} · 起订 {formatQuantity(service.min)} ·{' '}
                    {deliveryLabel(service)}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="num text-[13px] font-semibold text-ink">
                    ${formatServiceRate(service)}
                  </p>
                  <p className="text-[9px] text-muted">
                    /{service.pricing === 'fixed' ? '件' : '万次'}
                  </p>
                </div>
              </Link>
            ))}
          </div>

          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[760px] border-collapse text-left">
              <thead>
                <tr className="border-b border-line text-[9px] font-semibold tracking-[0.16em] text-muted/70 uppercase">
                  <th className="px-6 py-4 font-semibold">平台</th>
                  <th className="px-4 py-4 font-semibold">服务</th>
                  <th className="px-4 py-4 font-semibold">单价</th>
                  <th className="px-4 py-4 font-semibold">起订</th>
                  <th className="px-4 py-4 font-semibold">参考时效</th>
                  <th className="px-6 py-4 text-right font-semibold">查看</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((service) => (
                  <tr
                    key={service.id}
                    className="group border-b border-line/70 transition last:border-b-0 hover:bg-paper/60"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <PlatformBadge platform={service.platform} size={32} />
                        <span className="text-[12px] font-medium text-ink">
                          {service.platformName}
                        </span>
                      </div>
                    </td>
                    <td className="max-w-[300px] px-4 py-4">
                      <p className="truncate text-[12.5px] font-medium text-ink">{service.name}</p>
                      <p className="mt-0.5 text-[10px] text-muted">
                        {shortTypeName(service.type)}
                      </p>
                    </td>
                    <td className="num px-4 py-4 text-[13px] font-semibold text-ink">
                      ${formatServiceRate(service)}
                      <span className="ml-1 text-[10px] font-normal text-muted">
                        /{service.pricing === 'fixed' ? '件' : '万次'}
                      </span>
                    </td>
                    <td className="num px-4 py-4 text-[12px] text-muted">{formatQuantity(service.min)}</td>
                    <td className="px-4 py-4 text-[11px] text-muted">
                      {deliveryLabel(service)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        to={`/service/${service.id}`}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-line text-muted transition group-hover:border-ink group-hover:bg-ink group-hover:text-cream"
                        aria-label={`查看 ${service.name}`}
                      >
                        <ArrowUpRight size={13} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-col gap-2 border-t border-line bg-paper/50 px-6 py-4 text-[11px] text-muted sm:flex-row sm:items-center sm:justify-between">
            <span className="flex items-center gap-2">
              <Sparkles size={13} className="text-ink" />
              示例：10,000 次 × ${formatServiceRate(heroService)} / 万次 ={' '}
              {formatMoney(itemSubtotalCents(heroService, 10000))}
            </span>
            <span className="text-muted/60">以上为目录真实条目，最终金额以购物车为准</span>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function StepsSection() {
  return (
    <section className="section pt-0">
      <div className="container-page">
        <SectionHeading
          eyebrow="How it works"
          title={
            <>
              像点外卖一样，
              <br className="hidden sm:block" />
              下单一项增长服务
            </>
          }
          description="不需要注册复杂账号，也不需要研究后台。选服务、填链接、完成 USDT 转账，三步完成。"
        />
        <div className="mt-10 grid gap-3 md:grid-cols-3">
          {steps.map((step, index) => (
            <Reveal key={step.title} delay={index * 70}>
              <div className="relative h-full overflow-hidden rounded-[24px] border border-line bg-cream p-7">
                <div className="flex items-center justify-between">
                  <span className="num text-[10px] tracking-[0.14em] text-muted/60">
                    STEP 0{index + 1}
                  </span>
                  <span className="num text-[10px] text-muted/40">0{index + 1} / 03</span>
                </div>
                <div className="mt-10 grid h-12 w-12 place-items-center rounded-2xl bg-lime text-ink">
                  <step.icon size={21} strokeWidth={1.8} />
                </div>
                <h3 className="mt-5 text-[17px] font-semibold tracking-[-0.01em] text-ink">
                  {step.title}
                </h3>
                <p className="mt-2 text-[12.5px] leading-[1.85] text-muted">{step.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function FaqSection() {
  return (
    <section className="section pt-0">
      <div className="container-page">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <Reveal>
            <p className="eyebrow">FAQ</p>
            <h2 className="mt-4 font-display text-[34px] font-semibold leading-[1.16] tracking-[-0.02em] sm:text-[42px]">
              下单前，
              <br />
              你可能会问
            </h2>
            <p className="mt-4 max-w-sm text-[13px] leading-relaxed text-muted">
              关于支付、交付与售后，先把常见问题说清楚。还有疑问，直接联系客服。
            </p>
            <Link to="/faq" className="mt-6 inline-flex items-center gap-1.5 text-[12px] font-semibold text-ink">
              查看全部问题 <ArrowRight size={13} />
            </Link>
          </Reveal>
          <Reveal delay={80}>
            <FaqAccordion items={faqItems.slice(0, 5)} />
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function CtaSection() {
  return (
    <section className="container-page pb-16 sm:pb-20">
      <Reveal className="relative overflow-hidden rounded-[30px] bg-lime px-6 py-12 text-ink sm:rounded-[36px] sm:px-12 sm:py-16">
        <div
          className="pointer-events-none absolute -right-10 -bottom-20 h-72 w-72 rounded-full border border-ink/10"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -right-2 -bottom-10 h-48 w-48 rounded-full border border-ink/10"
          aria-hidden="true"
        />
        <ArrowUpRight
          className="pointer-events-none absolute right-8 top-8 text-ink/15"
          size={84}
          strokeWidth={1}
          aria-hidden="true"
        />
        <div className="relative max-w-2xl">
          <p className="text-[10px] font-semibold tracking-[0.18em] text-ink/45 uppercase">
            Start here
          </p>
          <h2 className="mt-4 font-display text-[36px] font-semibold leading-[1.12] tracking-[-0.025em] sm:text-[52px]">
            下一波流量，
            <br />
            接住它。
          </h2>
          <p className="mt-5 max-w-lg text-[13.5px] leading-relaxed text-ink/60">
            浏览 {catalog.total.toLocaleString('zh-CN')} 项服务，或者先从参考价格开始。
            不确定选哪项？把目标平台和预算发给客服。
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/services" className="btn btn-dark">
              开始选购
              <ArrowRight size={15} />
            </Link>
            <Link
              to="/#pricing"
              className="btn border border-ink/20 bg-transparent text-ink hover:border-ink hover:bg-ink/5"
            >
              先看价格
            </Link>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

export function Home() {
  usePageMeta();
  return (
    <>
      <HeroCarousel />
      <HeroSearch />
      <PlatformStrip />
      <PlatformsSection />
      <FeaturedSection />
      <WhySection />
      <PricingSection />
      <StepsSection />
      <FaqSection />
      <CtaSection />
    </>
  );
}
