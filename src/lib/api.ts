import type { CustomerInfo } from './orders';

const API_TIMEOUT = 4500;

export type OrderChannel = 'telegram' | 'database' | 'none';

interface HealthResponse {
  ok?: boolean;
  orderChannel?: string;
}

let healthPromise: Promise<OrderChannel> | null = null;

function timeoutSignal(ms = API_TIMEOUT): AbortSignal | undefined {
  if (typeof AbortSignal !== 'undefined' && 'timeout' in AbortSignal) {
    return AbortSignal.timeout(ms);
  }
  return undefined;
}

export function getOrderChannel(): Promise<OrderChannel> {
  if (!healthPromise) {
    healthPromise = fetch('/api/health', {
      headers: { accept: 'application/json' },
      signal: timeoutSignal(2500),
    })
      .then(async (response) => {
        if (!response.ok) return 'none' as const;
        const data = (await response.json()) as HealthResponse;
        if (data.orderChannel === 'telegram') return 'telegram' as const;
        if (data.orderChannel === 'database') return 'database' as const;
        return 'none' as const;
      })
      .catch(() => 'none' as const);
  }
  return healthPromise;
}

export interface SubmitOrderLine {
  id: number;
  quantity: number;
  target: string;
}

export interface SubmitOrderInput {
  customer: CustomerInfo;
  items: SubmitOrderLine[];
}

export type SubmitOrderResult =
  | {
      ok: true;
      orderId: string;
      totalCents: number;
      stored: boolean;
      notified: boolean;
    }
  | { ok: false; reason: string };

export async function submitOrder(input: SubmitOrderInput): Promise<SubmitOrderResult> {
  try {
    const response = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify(input),
      signal: timeoutSignal(),
    });
    const data = (await response.json().catch(() => null)) as
      | {
          ok?: boolean;
          orderId?: string;
          totalCents?: number;
          stored?: boolean;
          notified?: boolean;
          error?: string;
        }
      | null;
    if (!response.ok || !data?.ok) {
      return { ok: false, reason: data?.error ?? `http_${response.status}` };
    }
    if (typeof data.orderId !== 'string' || typeof data.totalCents !== 'number') {
      return { ok: false, reason: 'invalid_response' };
    }
    return {
      ok: true,
      orderId: data.orderId,
      totalCents: data.totalCents,
      stored: Boolean(data.stored),
      notified: Boolean(data.notified),
    };
  } catch {
    return { ok: false, reason: 'network_error' };
  }
}

export interface AdminOrderLine {
  serviceId: number;
  name: string;
  platform: string;
  quantity: number;
  target: string;
  rate: number;
  pricing: 'per1000' | 'fixed';
  subtotalCents: number;
}

export interface AdminOrder {
  id: string;
  createdAt: string;
  customer: CustomerInfo;
  items: AdminOrderLine[];
  totalCents: number;
  telegramSent: boolean;
  channel: string;
}

export type AdminOrdersResult =
  | { ok: true; orders: AdminOrder[] }
  | { ok: false; reason: string };

export async function fetchAdminOrders(token: string, limit = 100): Promise<AdminOrdersResult> {
  try {
    const response = await fetch(`/api/admin/orders?limit=${limit}`, {
      headers: {
        accept: 'application/json',
        authorization: `Bearer ${token}`,
      },
      signal: timeoutSignal(8000),
    });
    const data = (await response.json().catch(() => null)) as
      | { ok?: boolean; orders?: AdminOrder[]; error?: string }
      | null;
    if (!response.ok || !data?.ok) {
      return { ok: false, reason: data?.error ?? `http_${response.status}` };
    }
    return { ok: true, orders: Array.isArray(data.orders) ? data.orders : [] };
  } catch {
    return { ok: false, reason: 'network_error' };
  }
}
