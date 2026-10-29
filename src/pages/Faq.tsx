import { Link } from 'react-router-dom';
import { ArrowUpRight, Send } from 'lucide-react';
import { usePageMeta } from '@/hooks/usePageMeta';
import { FaqAccordion } from '@/components/FaqAccordion';
import { faqItems } from '@/content/faq';
import { site } from '@/config';

export function Faq() {
  usePageMeta('常见问题', 'AU9922 下单、支付、交付与售后常见问题。');
  return (
    <section className="container-page py-12 sm:py-16">
      <div className="grid gap-10 lg:grid-cols-[0.75fr_1.25fr]">
        <div className="self-start lg:sticky lg:top-28">
          <p className="eyebrow">Help center</p>
          <h1 className="mt-4 font-display text-[42px] font-semibold leading-[1.1] tracking-[-0.03em] text-ink sm:text-[52px]">
            常见问题
          </h1>
          <p className="mt-4 max-w-sm text-[13px] leading-relaxed text-muted">
            关于价格、支付、交付和售后，先把常见问题说清楚。找不到答案，直接联系客服。
          </p>

          <div className="mt-8 rounded-[24px] border border-line bg-cream p-5">
            <p className="text-[12px] font-semibold text-ink">还是不确定？</p>
            <p className="mt-1.5 text-[11px] leading-relaxed text-muted">
              把目标平台、链接和预算发给客服，我们会给出具体的服务建议。
            </p>
            <div className="mt-4 flex flex-col gap-2">
              <a
                href={site.telegram}
                target="_blank"
                rel="noreferrer"
                className="btn btn-dark btn-sm w-full"
              >
                <Send size={13} /> {site.telegramHandle}
              </a>
              <p className="rounded-xl border border-line bg-paper px-3 py-2 text-center text-[10px] text-muted">
                USDT-TRC20 · 1 USD = 1 USDT
              </p>
            </div>
            <p className="mt-3 text-[9.5px] text-muted/60">服务时间：{site.serviceHours}</p>
          </div>

          <Link
            to="/services"
            className="mt-5 inline-flex items-center gap-1.5 text-[11px] font-medium text-muted transition hover:text-ink"
          >
            去服务目录看看 <ArrowUpRight size={12} />
          </Link>
        </div>

        <div>
          <FaqAccordion items={faqItems} />
          <div className="mt-8 rounded-[24px] bg-lime p-6 text-ink">
            <p className="text-[10px] font-semibold tracking-[0.16em] uppercase text-ink/45">
              Before you order
            </p>
            <p className="mt-2 font-display text-[24px] font-semibold leading-tight">
              只需要公开链接，不需要账号密码。
            </p>
            <p className="mt-2 max-w-lg text-[11.5px] leading-relaxed text-ink/60">
              如果有人在聊天中向你索要登录凭证、验证码或要求安装软件，请立即停止并向我们举报。
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
