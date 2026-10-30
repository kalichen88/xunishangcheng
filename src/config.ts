export const site = {
  name: 'AU9922',
  cnName: '全球社媒增长',
  tagline: '全球社媒增长服务商城',
  description:
    '覆盖 Telegram、Instagram、TikTok、YouTube、X、Facebook 等 9 个平台的社媒增长服务。3,943 项服务明码标价，按需起量，USDT-TRC20 结算。',
  url: 'https://tidesmm.kalichen80.workers.dev',
  telegram: 'https://t.me/Au9922',
  telegramHandle: '@Au9922',
  usdtAddress: 'TVfJbW6i4ERnTbexfJZgRu3ect91ZyDBVX',
  usdtNetwork: 'TRC-20',
  serviceHours: '09:00 – 24:00（GMT+8）',
  year: 2026,
} as const;

export const payment = {
  key: 'usdt',
  label: 'USDT-TRC20',
  network: 'TRC-20',
  address: site.usdtAddress,
  hint: '仅支持 TRC20 网络，1 USD = 1 USDT',
} as const;

export type PaymentKey = typeof payment.key;

export function paymentLabel(key: string): string {
  return key === 'usdt' ? payment.label : key;
}

export const nav = [
  { label: '全部服务', to: '/services' },
  { label: '平台', to: '/#platforms' },
  { label: '价格', to: '/#pricing' },
  { label: '常见问题', to: '/faq' },
] as const;
