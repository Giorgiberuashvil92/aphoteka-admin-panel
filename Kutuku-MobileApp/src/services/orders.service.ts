import { API_CONFIG, getAuthHeaders } from '@/src/config/api.config';
import { UserService } from '@/src/services/user.service';
import type { OrderStatusUi } from '@/src/data/mockOrders';

const PLACEHOLDER_IMAGE =
  'https://placehold.co/100x100/f1f5f9/64748b/png?text=%E1%83%AC%E1%83%90%E1%83%A0';

export type ApiOrderItem = {
  productId?: string | { toString(): string };
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  imageUrl?: string;
  packSize?: string;
};

export type ApiOrder = {
  id?: string;
  _id?: string;
  items: ApiOrderItem[];
  totalAmount: number;
  status: string;
  shippingAddress?: string;
  phoneNumber?: string;
  comment?: string;
  createdAt?: string;
  updatedAt?: string;
  bogOrderId?: string;
  bogPaymentStatus?: string;
};

export type MyOrderListItem = {
  id: string;
  orderNumber: string;
  date: string;
  status: OrderStatusUi;
  items: {
    id: string;
    name: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
    image: string;
  }[];
  total: number;
  trackingNumber?: string;
  /** BOG ონლაინი — გადახდა ჯერ არ არის დასრულებული (UI ტაიმლაინი) */
  awaitingOnlinePayment?: boolean;
};

function normalizeId(raw: ApiOrder): string {
  if (raw.id) return String(raw.id);
  const oid = raw._id;
  if (oid && typeof oid === 'object' && 'toString' in oid) return String((oid as { toString(): string }).toString());
  if (oid != null) return String(oid);
  return '';
}

function normalizeStatus(s: string | undefined): OrderStatusUi {
  const v = (s || 'pending').toLowerCase();
  if (v === 'confirmed' || v === 'shipped' || v === 'delivered' || v === 'cancelled' || v === 'pending') {
    return v;
  }
  return 'pending';
}

/** შეკვეთა pending-ზეა, მაგრამ ონლაინ გადახდა (BOG) ჯერ არ დასრულებულა */
function computeAwaitingOnlinePayment(raw: ApiOrder): boolean {
  const status = (raw.status || '').toLowerCase();
  if (status !== 'pending') return false;
  const bogSt = (raw.bogPaymentStatus || '').toLowerCase();
  if (['completed', 'success', 'paid', 'captured'].includes(bogSt)) return false;
  if (['rejected', 'failed', 'cancelled', 'declined'].some((k) => bogSt.includes(k)))
    return false;
  if (raw.bogOrderId != null && String(raw.bogOrderId).trim() !== '') return true;
  const c = (raw.comment || '').toLowerCase();
  if (c.includes('საქართველოს ბანკი')) return true;
  if (c.includes('ონლაინ') && c.includes('ბანკი')) return true;
  return false;
}

function mapApiOrder(raw: ApiOrder): MyOrderListItem | null {
  const id = normalizeId(raw);
  if (!id || !Array.isArray(raw.items)) return null;

  const created = raw.createdAt ? new Date(raw.createdAt) : new Date();
  const short = id.replace(/[^a-fA-F0-9]/g, '').slice(-6) || id.slice(0, 8);

  return {
    id,
    orderNumber: `ORD-${short.toUpperCase()}`,
    date: created.toLocaleDateString('ka-GE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }),
    status: normalizeStatus(raw.status),
    items: raw.items.map((it, i) => {
      const pid = it.productId;
      const lineId =
        pid != null && typeof pid === 'object' && 'toString' in pid
          ? String((pid as { toString(): string }).toString())
          : pid != null
            ? String(pid)
            : `item-${i}`;
      const unit = Number(it.unitPrice);
      const qty = Number(it.quantity);
      const lineTotal = Number.isFinite(it.totalPrice)
        ? Number(it.totalPrice)
        : (Number.isFinite(unit) ? unit : 0) * (Number.isFinite(qty) ? qty : 0);
      return {
        id: lineId,
        name: it.productName || 'პროდუქტი',
        quantity: Number.isFinite(qty) ? qty : 0,
        unitPrice: Number.isFinite(unit) ? unit : 0,
        lineTotal,
        image: it.imageUrl?.trim() || PLACEHOLDER_IMAGE,
      };
    }),
    total: Number.isFinite(Number(raw.totalAmount)) ? Number(raw.totalAmount) : 0,
    trackingNumber: raw.comment?.trim() || undefined,
    awaitingOnlinePayment: computeAwaitingOnlinePayment(raw),
  };
}

export type FetchMyOrdersResult =
  | { ok: true; orders: MyOrderListItem[] }
  | { ok: false; orders: []; error: 'auth' | 'network' | 'unknown'; message?: string };

export type OrderDetailResult =
  | {
      ok: true;
      order: MyOrderListItem & { shippingAddress?: string; phoneNumber?: string };
    }
  | { ok: false; error: 'auth' | 'not_found' | 'network' | 'unknown'; message?: string };

/** Nest CreateOrderDto — ბექენდი ითვლის totalPrice ხაზზე და totalAmount */
export type CreateOrderLineInput = {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  imageUrl?: string;
  packSize?: string;
};

export type CreateOrderInput = {
  items: CreateOrderLineInput[];
  shippingAddress?: string;
  phoneNumber?: string;
  comment?: string;
};

export type CreateOrderResult =
  | { ok: true; orderId: string }
  | { ok: false; error: 'auth' | 'network' | 'validation' | 'unknown'; message?: string };

export type InitBogPaymentResult =
  | { ok: true; redirectUrl: string; bogOrderId: string }
  | {
      ok: false;
      error: 'auth' | 'network' | 'validation' | 'unknown';
      message?: string;
    };

function extractOrderIdFromCreateResponse(data: unknown): string | null {
  if (!data || typeof data !== 'object') return null;
  const o = data as Record<string, unknown>;
  if (typeof o.id === 'string' && o.id) return o.id;
  const raw = o._id;
  if (typeof raw === 'string' && raw) return raw;
  if (raw && typeof raw === 'object' && 'toString' in raw) {
    const s = String((raw as { toString(): string }).toString());
    return s || null;
  }
  return null;
}

/** Nest exception: message string | string[] */
function nestApiErrorMessage(data: unknown, status: number): string {
  if (data && typeof data === 'object' && 'message' in data) {
    const m = (data as { message: unknown }).message;
    if (typeof m === 'string' && m) return m;
    if (Array.isArray(m) && m.length) return m.map(String).join('; ');
  }
  if (status === 400) return 'მოთხოვნის ვალიდაცია ვერ გავიდა';
  return `HTTP ${status}`;
}

export const OrdersService = {
  async createOrder(input: CreateOrderInput): Promise<CreateOrderResult> {
    const token = await UserService.getAccessToken();
    if (!token) {
      return { ok: false, error: 'auth', message: 'საჭიროა შესვლა' };
    }
    if (!input.items?.length) {
      return { ok: false, error: 'validation', message: 'კალათა ცარიელია' };
    }

    try {
      const url = `${API_CONFIG.BASE_URL}${API_CONFIG.endpoints.orders.create}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: getAuthHeaders(token),
        body: JSON.stringify({
          items: input.items.map((it) => ({
            productId: it.productId.trim(),
            productName: it.productName,
            quantity: it.quantity,
            unitPrice: it.unitPrice,
            imageUrl: it.imageUrl,
            packSize: it.packSize,
          })),
          shippingAddress: input.shippingAddress,
          phoneNumber: input.phoneNumber,
          comment: input.comment,
        }),
      });

      if (res.status === 401 || res.status === 403) {
        return { ok: false, error: 'auth', message: 'სესია ვადაგასულია' };
      }

      let body: unknown;
      try {
        body = await res.json();
      } catch {
        body = null;
      }

      if (!res.ok) {
        const msg =
          body &&
          typeof body === 'object' &&
          'message' in body &&
          (typeof (body as { message: unknown }).message === 'string' ||
            Array.isArray((body as { message: unknown }).message))
            ? Array.isArray((body as { message: string[] }).message)
              ? (body as { message: string[] }).message.join(', ')
              : String((body as { message: string }).message)
            : res.status === 400
              ? 'მოთხოვნის ვალიდაცია ვერ გავიდა'
              : `HTTP ${res.status}`;
        return {
          ok: false,
          error: res.status === 400 ? 'validation' : 'unknown',
          message: msg,
        };
      }

      const orderId = extractOrderIdFromCreateResponse(body);
      if (!orderId) {
        return { ok: false, error: 'unknown', message: 'შეკვეთის ID ვერ მოვიდა' };
      }
      return { ok: true, orderId };
    } catch (e) {
      return {
        ok: false,
        error: 'network',
        message: e instanceof Error ? e.message : undefined,
      };
    }
  },

  /** JWT — BOG გადახდის გვერდის URL */
  async initBogPayment(
    orderId: string,
    options?: { successRedirectUrl?: string; failRedirectUrl?: string },
  ): Promise<InitBogPaymentResult> {
    const token = await UserService.getAccessToken();
    if (!token) {
      return { ok: false, error: 'auth', message: 'საჭიროა შესვლა' };
    }
    const id = orderId?.trim();
    if (!id) {
      return { ok: false, error: 'validation', message: 'შეკვეთის ID აკლია' };
    }
    try {
      const url = `${API_CONFIG.BASE_URL}${API_CONFIG.endpoints.orders.bogPayment(id)}`;
      const body: Record<string, string> = {};
      if (options?.successRedirectUrl?.trim()) {
        body.successRedirectUrl = options.successRedirectUrl.trim();
      }
      if (options?.failRedirectUrl?.trim()) {
        body.failRedirectUrl = options.failRedirectUrl.trim();
      }
      const res = await fetch(url, {
        method: 'POST',
        headers: getAuthHeaders(token),
        body: JSON.stringify(body),
      });
      if (res.status === 401 || res.status === 403) {
        return { ok: false, error: 'auth', message: 'სესია ვადაგასულია' };
      }
      let data: unknown;
      try {
        data = await res.json();
      } catch {
        data = null;
      }
      if (!res.ok) {
        const msg = nestApiErrorMessage(data, res.status);
        return {
          ok: false,
          error: res.status === 400 ? 'validation' : 'unknown',
          message: msg,
        };
      }
      if (!data || typeof data !== 'object') {
        return { ok: false, error: 'unknown', message: 'უცნობი პასუხი' };
      }
      const o = data as Record<string, unknown>;
      const redirectUrl =
        typeof o.redirectUrl === 'string' ? o.redirectUrl : '';
      const bogOrderId = typeof o.bogOrderId === 'string' ? o.bogOrderId : '';
      if (!redirectUrl) {
        return { ok: false, error: 'unknown', message: 'redirectUrl აკლია' };
      }
      return { ok: true, redirectUrl, bogOrderId: bogOrderId || '' };
    } catch (e) {
      return {
        ok: false,
        error: 'network',
        message: e instanceof Error ? e.message : undefined,
      };
    }
  },

  async fetchOrderById(orderId: string): Promise<OrderDetailResult> {
    const token = await UserService.getAccessToken();
    if (!token) {
      return { ok: false, error: 'auth' };
    }
    if (!orderId?.trim()) {
      return { ok: false, error: 'unknown', message: 'order id' };
    }
    try {
      const url = `${API_CONFIG.BASE_URL}${API_CONFIG.endpoints.orders.byId(orderId.trim())}`;
      const res = await fetch(url, {
        method: 'GET',
        headers: getAuthHeaders(token),
      });
      if (res.status === 401 || res.status === 403) {
        return { ok: false, error: 'auth' };
      }
      if (res.status === 404) {
        return { ok: false, error: 'not_found' };
      }
      if (!res.ok) {
        const message = await res.text().catch(() => '');
        return {
          ok: false,
          error: 'unknown',
          message: message || `HTTP ${res.status}`,
        };
      }
      const raw = (await res.json()) as ApiOrder;
      const mapped = mapApiOrder(raw);
      if (!mapped) {
        return { ok: false, error: 'unknown' };
      }
      return {
        ok: true,
        order: {
          ...mapped,
          shippingAddress: raw.shippingAddress,
          phoneNumber: raw.phoneNumber,
        },
      };
    } catch (e) {
      return {
        ok: false,
        error: 'network',
        message: e instanceof Error ? e.message : undefined,
      };
    }
  },

  async fetchMyOrders(): Promise<FetchMyOrdersResult> {
    const token = await UserService.getAccessToken();
    if (!token) {
      return { ok: false, orders: [], error: 'auth' };
    }

    try {
      const url = `${API_CONFIG.BASE_URL}${API_CONFIG.endpoints.orders.myOrders}`;
      const res = await fetch(url, {
        method: 'GET',
        headers: getAuthHeaders(token),
      });

      if (res.status === 401 || res.status === 403) {
        return { ok: false, orders: [], error: 'auth' };
      }

      if (!res.ok) {
        const message = await res.text().catch(() => '');
        return {
          ok: false,
          orders: [],
          error: 'unknown',
          message: message || `HTTP ${res.status}`,
        };
      }

      const data: unknown = await res.json();
      const list: ApiOrder[] = Array.isArray(data) ? data : [];
      const orders = list.map(mapApiOrder).filter(Boolean) as MyOrderListItem[];

      return { ok: true, orders };
    } catch (e) {
      return {
        ok: false,
        orders: [],
        error: 'network',
        message: e instanceof Error ? e.message : undefined,
      };
    }
  },

  /**
   * BOG callback-ის მოლოდინი — სერვერზე სტატუსი იცვლება ბანკის POST /callback-ის შემდეგ.
   */
  async waitForOrderPaymentConfirmed(
    orderId: string,
    options?: { maxAttempts?: number; intervalMs?: number },
  ): Promise<'confirmed' | 'timeout' | 'auth' | 'error'> {
    const maxAttempts = options?.maxAttempts ?? 20;
    const intervalMs = options?.intervalMs ?? 1500;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const r = await OrdersService.fetchOrderById(orderId);
      if (!r.ok) {
        if (r.error === 'auth') return 'auth';
        return 'error';
      }
      const s = r.order.status;
      if (s === 'confirmed' || s === 'shipped' || s === 'delivered') {
        return 'confirmed';
      }
      if (attempt < maxAttempts - 1) {
        await new Promise((resolve) => setTimeout(resolve, intervalMs));
      }
    }
    return 'timeout';
  },
};
