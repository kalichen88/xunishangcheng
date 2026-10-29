export const site = {
  name: 'TideSMM',
  cnName: '潮汐增长',
  tagline: '全球社媒增长服务商城',
  description:
    '覆盖 Telegram、Instagram、TikTok、YouTube、X、Facebook 等 10 个平台的社媒增长服务。3,959 项服务明码标价，按需起量。',
  url: 'https://tidesmm.kalichen80.workers.dev',
  email: 'hello@tidesmm.com',
  telegram: 'https://t.me/tidesmm',
  telegramHandle: '@tidesmm',
  serviceHours: '09:00 – 24:00（GMT+8）',
  year: 2026,
} as const;

export const nav = [
  { label: '全部服务', to: '/services' },
  { label: '平台', to: '/#platforms' },
  { label: '价格', to: '/#pricing' },
  { label: '常见问题', to: '/faq' },
] as const;

export const paymentMethods = [
  { key: 'usdt', label: 'USDT', hint: 'TRC20 / ERC20，客服确认汇率' },
  { key: 'alipay', label: '支付宝', hint: '客服发送收款码' },
  { key: 'wechat', label: '微信支付', hint: '客服发送收款码' },
  { key: 'bank', label: '银行转账', hint: '对公 / 个人账户，客服确认' },
] as const;

export type PaymentKey = (typeof paymentMethods)[number]['key'];

export function paymentLabel(key: string) {
  return paymentMethods.find((p) => p.key === key)?.label ?? key;
}
