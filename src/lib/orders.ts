import { paymentLabel } from '@/config';
import { itemSubtotalCents } from './pricing';
import { getService } from './catalog';
import type { PricingMode, Service } from './types';
import { readStorage, writeStorage } from './storage';

export interface CustomerInfo {
  name: string;
  contact: string;
  email: string;
  payment: string;
  note: string;
}

export interface OrderLine {
  serviceId: number;
  name: string;
  platform: string;
  platformName: string;
  quantity: number;
  target: string;
  rate: number;
  pricing: PricingMode;
  subtotalCents: number;
}

export interface Order {
  id: string;
  createdAt: string;
  channel: 'local' | 'telegram' | 'database';
  status: 'pending';
  customer: CustomerInfo;
  items: OrderLine[];
  totalCents: number;
}

const ORDERS_KEY = 'orders.v1';

export function createOrderId(now = new Date()): string {
  const stamp = now.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.random().toString(36).slice(2, 6).toUpperCase().padEnd(4, '0');
  return `TS-${stamp}-${random}`;
}

export function buildOrderLine(service: Service, quantity: number, target: string): OrderLine {
  return {
    serviceId: service.id,
    name: service.name,
    platform: service.platform,
    platformName: service.platformName,
    quantity,
    target: target.trim().slice(0, 500),
    rate: service.rate,
    pricing: service.pricing,
    subtotalCents: itemSubtotalCents(service, quantity),
  };
}

export function makeOrder(
  items: OrderLine[],
  customer: CustomerInfo,
  channel: Order['channel'],
): Order {
  return {
    id: createOrderId(),
    createdAt: new Date().toISOString(),
    channel,
    status: 'pending',
    customer,
    items,
    totalCents: items.reduce((sum, item) => sum + item.subtotalCents, 0),
  };
}

export function readOrders(): Order[] {
  const orders = readStorage<Order[]>(ORDERS_KEY, []);
  if (!Array.isArray(orders)) return [];
  return orders
    .filter((order) => order && typeof order.id === 'string' && Array.isArray(order.items))
    .slice(0, 100);
}

export function saveOrder(order: Order): void {
  const orders = readOrders().filter((existing) => existing.id !== order.id);
  writeStorage(ORDERS_KEY, [order, ...orders].slice(0, 100));
}

export function getOrder(id: string): Order | undefined {
  return readOrders().find((order) => order.id === id);
}

export function orderText(order: Order): string {
  const lines = [
    `TideSMM 订单 ${order.id}`,
    `创建时间：${new Date(order.createdAt).toLocaleString('zh-CN')}`,
    `称呼：${order.customer.name}`,
    `联系方式：${order.customer.contact}`,
    order.customer.email ? `邮箱：${order.customer.email}` : '',
    `支付方式：${paymentLabel(order.customer.payment)}`,
    '',
    '服务明细：',
  ].filter(Boolean);
  order.items.forEach((item, index) => {
    lines.push(
      `${index + 1}. ${item.name}`,
      `   数量：${item.quantity}${item.pricing === 'fixed' ? ' 件' : ' 次'}｜单价：¥${item.rate}${item.pricing === 'fixed' ? '/件' : '/千次'}`,
      `   目标：${item.target || '待补充'}`,
      `   小计：¥${(item.subtotalCents / 100).toFixed(2)}`,
    );
  });
  lines.push('', `合计：¥${(order.totalCents / 100).toFixed(2)}`);
  if (order.customer.note) lines.push(`备注：${order.customer.note}`);
  return lines.join('\n');
}

export function orderChannelLabel(channel: Order['channel']): string {
  switch (channel) {
    case 'telegram':
      return '已通知客服';
    case 'database':
      return '已提交后台';
    default:
      return '本机保存';
  }
}

export function orderStatusLabel(status: Order['status']): string {
  switch (status) {
    case 'pending':
      return '待客服确认';
    default:
      return status;
  }
}

export function orderItemsFromCart(
  items: Array<{ serviceId: number; quantity: number; target: string }>,
): OrderLine[] {
  return items.flatMap((item) => {
    const service = getService(item.serviceId);
    if (!service) return [];
    return [buildOrderLine(service, item.quantity, item.target)];
  });
}

export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fall through to the legacy path
  }
  try {
    const area = document.createElement('textarea');
    area.value = text;
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(area);
    return ok;
  } catch {
    return false;
  }
}
