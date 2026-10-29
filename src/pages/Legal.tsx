import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { usePageMeta } from '@/hooks/usePageMeta';
import { site } from '@/config';

type Section = { title: string; paragraphs: string[]; bullets?: string[] };

const terms: Section[] = [
  {
    title: '1. 关于本站',
    paragraphs: [
      'AU9922（全球社媒增长）是一个独立的第三方社交媒体增长服务商城。本站与 Telegram、Meta、TikTok、YouTube、X 等平台没有任何隶属、代理或授权关系，相关商标归其各自所有者。',
      '本站提供公开的服务目录、价格展示与订单请求功能。具体服务的可用性、交付方式与售后条件，以商品页说明及客服确认为准。',
    ],
  },
  {
    title: '2. 服务范围',
    paragraphs: [
      '本站展示的服务由运营方或合作供应方提供。提交订单代表你向运营方发出服务请求，并不代表服务已经自动开始。',
      '部分服务可能存在地区限制、账号状态要求或平台规则限制。下单前请阅读商品页的购买须知。',
    ],
  },
  {
    title: '3. 下单与支付',
    paragraphs: [
      '提交订单后，请按页面显示的 USDT-TRC20 收款地址转账。本站不会在页面上直接扣款，也不会收集银行卡密码。',
      '所有价格以美元（USD，$）展示，1 USD = 1 USDT。仅支持 TRC20 网络；请务必核对网络与地址，转错网络造成的损失无法追回。',
    ],
    bullets: [
      '转账后请把交易哈希（TxID）发送给 Telegram 客服，以便核对。',
      '未确认支付的订单不会进入交付队列。',
      '支付完成后请保留订单号与交易哈希，便于售后核对。',
      '请勿向任何非官方账号付款；如有疑问，先通过本站公布的 Telegram 客服核实。',
    ],
  },
  {
    title: '4. 交付',
    paragraphs: [
      '目标账号或内容需要处于公开状态。交付期间请勿修改隐私设置、用户名或删除内容，否则可能导致交付失败。',
      '商品页展示的参考时效来自目录平均值，不代表承诺完成时间。实际进度会受平台风控、账号状态、队列与供应情况影响。',
    ],
  },
  {
    title: '5. 补单与退款',
    paragraphs: [
      '不同服务的补单与退款政策不同，以商品页说明和客服确认信息为准。未开始交付的订单可以联系客服协商取消。',
      '已经开始排期、已部分交付或已完成的服务，通常不支持全额退款。若出现掉单，请在服务约定的售后时限内联系客服核查。',
    ],
  },
  {
    title: '6. 禁止用途',
    paragraphs: [
      '你不得将本站服务用于违法、侵权、欺诈、骚扰、仇恨内容或其他违反适用法律的活动。请自行确认目标平台的使用规则与当地法律要求。',
      '如果运营方有合理理由怀疑订单涉及违法或严重侵权内容，可以拒绝或暂停服务。',
    ],
  },
  {
    title: '7. 账号与凭证',
    paragraphs: [
      '本站不需要你的账号密码、二次验证码或登录凭证。请不要在订单备注、目标链接或聊天中发送这些信息。',
      '如果任何人以 AU9922 名义索要密码或验证码，请停止沟通并通过本站公布的联系方式举报。',
    ],
  },
  {
    title: '8. 责任限制',
    paragraphs: [
      '本站按现状提供服务目录与订单请求功能。对于因目标平台规则变化、账号状态、第三方支付或不可抗力导致的延迟、失败或损失，运营方在法律允许范围内不承担超出订单金额的责任。',
      '服务结果可能因内容、受众与平台算法而异。本站不保证特定的粉丝增长、转化率或商业结果。',
    ],
  },
  {
    title: '9. 变更与联系',
    paragraphs: [
      `我们可能会更新服务目录、价格与本条款。更新后的条款自发布之日起生效。`,
      `如有疑问，请通过 Telegram ${site.telegramHandle} 联系客服。`,
    ],
  },
];

const privacy: Section[] = [
  {
    title: '1. 我们收集什么',
    paragraphs: [
      '当你提交订单时，我们会收集你主动填写的信息：称呼、Telegram / WhatsApp 联系方式、邮箱（可选）、支付方式、订单备注，以及你为服务提供的目标链接或用户名。',
      '当前版本不要求注册账号，也不会收集账号密码、验证码或身份证件信息。',
    ],
  },
  {
    title: '2. 信息用途',
    paragraphs: [
      '这些信息仅用于确认订单、联系你、完成支付核对、交付服务与处理售后。',
      '我们不会将你的联系方式出售给第三方，也不会用于与服务无关的营销。',
    ],
  },
  {
    title: '3. 存储方式',
    paragraphs: [
      '提交订单后，订单信息会写入 Cloudflare D1 数据库，用于客服确认、交付与售后。订单记录也会在你当前浏览器的 localStorage 中保留一份，方便你在本机查看；清除浏览器数据会移除本机记录。',
      '如果站点启用了客服通知通道，订单详情还会通过 Cloudflare Worker 发送至运营方的 Telegram，用于及时跟进订单。',
    ],
  },
  {
    title: '4. 第三方服务',
    paragraphs: [
      '本站使用 Cloudflare 提供托管与网络服务，使用 Google Fonts 加载字体，并可能通过 Telegram 传递订单通知。这些服务会按照各自的隐私政策处理必要的技术信息。',
      '当你点击外部支付或 Telegram 链接时，将离开本站并适用对应平台的隐私政策。',
    ],
  },
  {
    title: '5. Cookie 与本地存储',
    paragraphs: [
      '本站不使用广告追踪 Cookie。我们使用 localStorage 保存购物车、本机订单记录与界面偏好，以维持基本功能。',
      '你可以在浏览器设置中清除这些数据；清除后购物车与订单记录将不再保留。',
    ],
  },
  {
    title: '6. 安全',
    paragraphs: [
      '我们不会索要账号密码或验证码，也建议你不要在订单备注中填写敏感个人信息。通过互联网传输信息不存在绝对安全，请自行判断提供哪些内容。',
    ],
  },
  {
    title: '7. 你的权利',
    paragraphs: [
      '你可以随时清除浏览器中的订单与购物车数据。如需查询、更正或删除已发送给客服的订单信息，请通过下方联系方式提出。',
    ],
  },
  {
    title: '8. 更新与联系',
    paragraphs: [
      '我们可能会更新本政策。重大变更会在本页标注新的更新日期。',
      `隐私相关问题请通过 Telegram ${site.telegramHandle} 联系客服。`,
    ],
  },
];

export function Legal({ kind }: { kind: 'terms' | 'privacy' }) {
  const isTerms = kind === 'terms';
  const sections = isTerms ? terms : privacy;
  usePageMeta(isTerms ? '服务条款' : '隐私政策');

  return (
    <section className="container-page py-12 sm:py-16">
      <div className="mx-auto max-w-3xl">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-[11px] font-medium text-muted transition hover:text-ink"
        >
          <ArrowLeft size={12} /> 返回首页
        </Link>
        <p className="eyebrow mt-6">{isTerms ? 'Terms of service' : 'Privacy policy'}</p>
        <h1 className="mt-4 font-display text-[42px] font-semibold leading-[1.1] tracking-[-0.03em] text-ink sm:text-[52px]">
          {isTerms ? '服务条款' : '隐私政策'}
        </h1>
        <p className="mt-3 text-[11px] text-muted">最后更新：2026 年 10 月 29 日</p>
        <p className="mt-6 text-[13px] leading-[1.9] text-muted">
          {isTerms
            ? '请在提交订单前阅读以下条款。提交订单即表示你理解并同意这些约定。'
            : '本政策说明我们在你使用 AU9922 时如何处理信息。我们尽量只收集完成订单所需的最少信息。'}
        </p>

        <div className="mt-10 space-y-8">
          {sections.map((section) => (
            <div key={section.title} className="border-t border-line pt-7">
              <h2 className="text-[15px] font-semibold text-ink">{section.title}</h2>
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph} className="mt-2.5 text-[12.5px] leading-[1.9] text-muted">
                  {paragraph}
                </p>
              ))}
              {section.bullets ? (
                <ul className="mt-3 space-y-1.5 pl-5">
                  {section.bullets.map((bullet) => (
                    <li
                      key={bullet}
                      className="list-disc text-[12px] leading-[1.8] text-muted marker:text-line-strong"
                    >
                      {bullet}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ))}
        </div>

        <div className="mt-10 rounded-2xl border border-line bg-cream p-5">
          <p className="text-[11px] leading-relaxed text-muted">
            本页为商城运营的基础条款与隐私说明，不构成法律意见。正式上线前，请根据你的经营主体、所在地区与支付方式，由专业人士审核并补充必要的经营者信息、退款政策与联系方式。
          </p>
        </div>
      </div>
    </section>
  );
}
