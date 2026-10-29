import rawCatalog from '../src/data/catalog.json';

interface ServiceRecord {
  id: number;
  name: string;
  platformName: string;
  rate: number;
  min: number;
  max: number;
  pricing: 'per1000' | 'fixed';
}

interface CatalogJson {
  services: ServiceRecord[];
}

interface Env {
  ASSETS: Fetcher;
  TELEGRAM_BOT_TOKEN?: string;
  TELEGRAM_CHAT_ID?: string;
  TELEGRAM_API_BASE?: string;
}

interface IncomingItem {
  id: number;
  quantity: number;
  target: string;
}

interface IncomingOrder {
  customer: {
    name: string;
    contact: string;
    email: string;
    payment: string;
    note: string;
  };
  items: IncomingItem[];
}

const SERVICES = new Map<number, ServiceRecord>(
  (rawCatalog as unknown as CatalogJson).services.map((service) => [service.id, service]),
);

const PAYMENTS = new Set(['usdt', 'alipay', 'wechat', 'bank']);
const PAYMENT_LABELS: Record<string, string> = {
  usdt: 'USDT',
  alipay: '支付宝',
  wechat: '微信支付',
  bank: '银行转账',
};

const SECURITY_HEADERS: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-Frame-Options': 'DENY',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Strict-Transport-Security': 'max-age=31536000',
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      ...SECURITY_HEADERS,
    },
  });
}

function clean(value: unknown, max: number): string {
  if (typeof value !== 'string') return '';
  return value.replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, max);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function makeOrderId(now = new Date()): string {
  const stamp = now.toISOString().slice(0, 10).replace(/-/g, '');
  const bytes = new Uint8Array(4);
  crypto.getRandomValues(bytes);
  const suffix = Array.from(bytes, (byte) => (byte % 36).toString(36))
    .join('')
    .toUpperCase();
  return `TS-${stamp}-${suffix}`;
}

function itemTotalCents(service: ServiceRecord, quantity: number): number {
  const yuan =
    service.pricing === 'fixed' ? service.rate * quantity : (service.rate * quantity) / 1000;
  return Math.max(1, Math.round(yuan * 100));
}

function money(cents: number): string {
  return `¥${(cents / 100).toFixed(2)}`;
}

function parseOrder(raw: unknown): { ok: true; order: IncomingOrder } | { ok: false; error: string } {
  if (!raw || typeof raw !== 'object') return { ok: false, error: 'invalid_payload' };
  const input = raw as Record<string, unknown>;
  const customerRaw = input.customer;
  if (!customerRaw || typeof customerRaw !== 'object') return { ok: false, error: 'invalid_customer' };
  const customer = customerRaw as Record<string, unknown>;

  const name = clean(customer.name, 80);
  const contact = clean(customer.contact, 160);
  const email = clean(customer.email, 160);
  const payment = clean(customer.payment, 20);
  const note = clean(customer.note, 500);

  if (name.length < 1) return { ok: false, error: 'name_required' };
  if (contact.length < 3) return { ok: false, error: 'contact_required' };
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, error: 'email_invalid' };
  if (!PAYMENTS.has(payment)) return { ok: false, error: 'payment_invalid' };

  if (!Array.isArray(input.items) || input.items.length === 0 || input.items.length > 30) {
    return { ok: false, error: 'items_invalid' };
  }

  const items: IncomingItem[] = [];
  for (const entry of input.items) {
    if (!entry || typeof entry !== 'object') return { ok: false, error: 'item_invalid' };
    const item = entry as Record<string, unknown>;
    const id = Number(item.id);
    const quantity = Number(item.quantity);
    const service = SERVICES.get(id);
    if (!service) return { ok: false, error: 'service_not_found' };
    if (!Number.isInteger(quantity) || quantity < service.min || quantity > service.max) {
      return { ok: false, error: 'quantity_invalid' };
    }
    items.push({ id, quantity, target: clean(item.target, 500) });
  }

  return {
    ok: true,
    order: {
      customer: { name, contact, email, payment, note },
      items,
    },
  };
}

function buildMessage(order: IncomingOrder, orderId: string, totalCents: number): string {
  const lines: string[] = [
    '<b>🛒 TideSMM 新订单</b>',
    `<b>${escapeHtml(orderId)}</b>`,
    `客户：${escapeHtml(order.customer.name)}`,
    `联系：${escapeHtml(order.customer.contact)}`,
  ];
  if (order.customer.email) lines.push(`邮箱：${escapeHtml(order.customer.email)}`);
  lines.push(`支付：${escapeHtml(PAYMENT_LABELS[order.customer.payment] ?? order.customer.payment)}`);
  lines.push('', '<b>服务明细</b>');

  order.items.forEach((item, index) => {
    const service = SERVICES.get(item.id);
    if (!service) return;
    const unit = service.pricing === 'fixed' ? '件' : '千次';
    const subtotal = itemTotalCents(service, item.quantity);
    lines.push(
      `${index + 1}. ${escapeHtml(service.name.slice(0, 120))}`,
      `   ${item.quantity} × ¥${service.rate} / ${unit} = ${money(subtotal)}`,
    );
    if (item.target) lines.push(`   目标：${escapeHtml(item.target.slice(0, 220))}`);
  });

  lines.push('', `<b>合计：${money(totalCents)}</b>`);
  if (order.customer.note) lines.push(`备注：${escapeHtml(order.customer.note)}`);
  lines.push(`时间：${new Date().toISOString()}`);
  return lines.join('\n');
}

function splitMessage(text: string, limit = 3600): string[] {
  if (text.length <= limit) return [text];
  const chunks: string[] = [];
  let current = '';
  for (const line of text.split('\n')) {
    if (current.length + line.length + 1 > limit) {
      if (current) chunks.push(current);
      current = line.length > limit ? line.slice(0, limit) : line;
    } else {
      current = current ? `${current}\n${line}` : line;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

async function notifyTelegram(env: Env, message: string): Promise<boolean> {
  const token = env.TELEGRAM_BOT_TOKEN;
  const chatId = env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return false;

  const chunks = splitMessage(message);
  const apiBase = env.TELEGRAM_API_BASE ?? 'https://api.telegram.org';
  for (let index = 0; index < chunks.length; index += 1) {
    const prefix =
      chunks.length > 1 ? `<i>(${index + 1}/${chunks.length})</i>\n` : '';
    const response = await fetch(`${apiBase}/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: prefix + chunks[index],
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      console.error('telegram_notify_failed', response.status, detail.slice(0, 200));
      return false;
    }
  }
  return true;
}

async function handleOrder(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') return json({ ok: false, error: 'method_not_allowed' }, 405);
  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) {
    return json({ ok: false, error: 'orders_not_configured' }, 503);
  }
  const contentType = request.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) {
    return json({ ok: false, error: 'content_type_invalid' }, 415);
  }

  const body = await request.text();
  if (body.length > 64_000) return json({ ok: false, error: 'payload_too_large' }, 413);

  let raw: unknown;
  try {
    raw = JSON.parse(body);
  } catch {
    return json({ ok: false, error: 'json_invalid' }, 400);
  }

  const parsed = parseOrder(raw);
  if (!parsed.ok) return json({ ok: false, error: parsed.error }, 400);

  const totalCents = parsed.order.items.reduce((sum, item) => {
    const service = SERVICES.get(item.id);
    return service ? sum + itemTotalCents(service, item.quantity) : sum;
  }, 0);
  const orderId = makeOrderId();
  const message = buildMessage(parsed.order, orderId, totalCents);

  const sent = await notifyTelegram(env, message);
  if (!sent) return json({ ok: false, error: 'notify_failed' }, 502);

  return json({ ok: true, orderId, totalCents });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/api/health') {
      return json({
        ok: true,
        orderChannel:
          env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID ? 'telegram' : 'none',
        version: '1.0.0',
      });
    }

    if (url.pathname === '/api/orders') {
      return handleOrder(request, env);
    }

    if (url.pathname.startsWith('/api/')) {
      return json({ ok: false, error: 'not_found' }, 404);
    }

    const response = await env.ASSETS.fetch(request);
    const headers = new Headers(response.headers);
    for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
      headers.set(key, value);
    }
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  },
};
