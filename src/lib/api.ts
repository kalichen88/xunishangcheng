import type { CustomerInfo } from './orders';

const API_TIMEOUT = 4500;

export type OrderChannel = 'telegram' | 'none';

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
        return data.orderChannel === 'telegram' ? ('telegram' as const) : ('none' as const);
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
  | { ok: true; orderId: string; totalCents: number }
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
      | { ok?: boolean; orderId?: string; totalCents?: number; error?: string }
      | null;
    if (!response.ok || !data?.ok) {
      return { ok: false, reason: data?.error ?? `http_${response.status}` };
    }
    if (typeof data.orderId !== 'string' || typeof data.totalCents !== 'number') {
      return { ok: false, reason: 'invalid_response' };
    }
    return { ok: true, orderId: data.orderId, totalCents: data.totalCents };
  } catch {
    return { ok: false, reason: 'network_error' };
  }
}
