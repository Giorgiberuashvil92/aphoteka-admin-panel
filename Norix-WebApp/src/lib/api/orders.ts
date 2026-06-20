import { API_CONFIG } from "@/config/api.config";
import { getAccessToken } from "@/lib/auth/session";

export interface CreateOrderItemInput {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  imageUrl?: string;
  unitLabel?: string;
}

export interface CreateOrderDeliveryInput {
  provider: {
    providerId: number;
    providerName: string;
    providerLogoUrl?: string;
  };
  address: {
    streetName: string;
    cityName: string;
    latitude: number;
    longitude: number;
  };
  deliveryPrice: number;
  deliveryServiceFee: number;
  deliverySpeed: string;
}

export interface CreateOrderInput {
  items: CreateOrderItemInput[];
  shippingAddress: string;
  phoneNumber?: string;
  comment?: string;
  delivery?: CreateOrderDeliveryInput;
}

type OrderApiError = "auth" | "validation" | "network" | "unknown" | "not_found";

function authHeaders(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

function nestApiErrorMessage(data: unknown, status: number): string {
  if (data && typeof data === "object" && "message" in data) {
    const message = (data as { message: unknown }).message;
    if (typeof message === "string" && message) return message;
    if (Array.isArray(message) && message.length) {
      return message.map(String).join("; ");
    }
  }
  if (status === 400) return "მოთხოვნის ვალიდაცია ვერ გავიდა";
  return `HTTP ${status}`;
}

function extractOrderId(body: unknown): string | null {
  if (!body || typeof body !== "object") return null;
  const record = body as Record<string, unknown>;
  if (typeof record.id === "string" && record.id) return record.id;
  const raw = record._id;
  if (typeof raw === "string" && raw) return raw;
  if (raw && typeof raw === "object" && "toString" in raw) {
    const value = String((raw as { toString(): string }).toString());
    return value || null;
  }
  return null;
}

export async function createOrder(
  input: CreateOrderInput,
): Promise<
  | { ok: true; orderId: string }
  | { ok: false; error: OrderApiError; message?: string }
> {
  const token = getAccessToken();
  if (!token) {
    return { ok: false, error: "auth", message: "საჭიროა შესვლა" };
  }
  if (!input.items.length) {
    return { ok: false, error: "validation", message: "კალათა ცარიელია" };
  }

  try {
    const res = await fetch(`${API_CONFIG.BASE_URL}/orders`, {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify({
        items: input.items.map((item) => ({
          productId: item.productId.trim(),
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          imageUrl: item.imageUrl,
          packSize: item.unitLabel,
        })),
        shippingAddress: input.shippingAddress,
        phoneNumber: input.phoneNumber,
        comment: input.comment,
        ...(input.delivery
          ? {
              deliveryProvider: {
                providerId: input.delivery.provider.providerId,
                providerName: input.delivery.provider.providerName,
                providerLogoUrl: input.delivery.provider.providerLogoUrl,
              },
              deliveryAddress: input.delivery.address,
              deliveryPrice: input.delivery.deliveryPrice,
              deliveryServiceFee: input.delivery.deliveryServiceFee,
              deliverySpeed: input.delivery.deliverySpeed,
            }
          : {}),
      }),
    });

    let body: unknown;
    try {
      body = await res.json();
    } catch {
      body = null;
    }

    if (res.status === 401 || res.status === 403) {
      return { ok: false, error: "auth", message: "სესია ვადაგასულია" };
    }

    if (!res.ok) {
      return {
        ok: false,
        error: res.status === 400 ? "validation" : "unknown",
        message: nestApiErrorMessage(body, res.status),
      };
    }

    const orderId = extractOrderId(body);
    if (!orderId) {
      return { ok: false, error: "unknown", message: "შეკვეთის ID ვერ მოვიდა" };
    }

    return { ok: true, orderId };
  } catch (error) {
    return {
      ok: false,
      error: "network",
      message: error instanceof Error ? error.message : undefined,
    };
  }
}

export async function initBogPayment(
  orderId: string,
  options?: { successRedirectUrl?: string; failRedirectUrl?: string },
): Promise<
  | { ok: true; redirectUrl: string; bogOrderId: string }
  | { ok: false; error: OrderApiError; message?: string }
> {
  const token = getAccessToken();
  if (!token) {
    return { ok: false, error: "auth", message: "საჭიროა შესვლა" };
  }

  const id = orderId.trim();
  if (!id) {
    return { ok: false, error: "validation", message: "შეკვეთის ID აკლია" };
  }

  try {
    const payload: Record<string, string> = {};
    if (options?.successRedirectUrl?.trim()) {
      payload.successRedirectUrl = options.successRedirectUrl.trim();
    }
    if (options?.failRedirectUrl?.trim()) {
      payload.failRedirectUrl = options.failRedirectUrl.trim();
    }

    const res = await fetch(`${API_CONFIG.BASE_URL}/orders/${id}/payment/bog`, {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify(payload),
    });

    let body: unknown;
    try {
      body = await res.json();
    } catch {
      body = null;
    }

    if (res.status === 401 || res.status === 403) {
      return { ok: false, error: "auth", message: "სესია ვადაგასულია" };
    }

    if (!res.ok) {
      return {
        ok: false,
        error: res.status === 400 ? "validation" : "unknown",
        message: nestApiErrorMessage(body, res.status),
      };
    }

    if (!body || typeof body !== "object") {
      return { ok: false, error: "unknown", message: "უცნობი პასუხი" };
    }

    const record = body as Record<string, unknown>;
    const redirectUrl =
      typeof record.redirectUrl === "string" ? record.redirectUrl : "";
    const bogOrderId =
      typeof record.bogOrderId === "string" ? record.bogOrderId : "";

    if (!redirectUrl) {
      return { ok: false, error: "unknown", message: "redirectUrl აკლია" };
    }

    return { ok: true, redirectUrl, bogOrderId };
  } catch (error) {
    return {
      ok: false,
      error: "network",
      message: error instanceof Error ? error.message : undefined,
    };
  }
}

export async function fetchOrderById(orderId: string): Promise<
  | { ok: true; status: string }
  | { ok: false; error: OrderApiError; message?: string }
> {
  const token = getAccessToken();
  if (!token) {
    return { ok: false, error: "auth" };
  }

  const id = orderId.trim();
  if (!id) {
    return { ok: false, error: "unknown", message: "order id" };
  }

  try {
    const res = await fetch(`${API_CONFIG.BASE_URL}/orders/${id}`, {
      method: "GET",
      headers: authHeaders(token),
    });

    if (res.status === 401 || res.status === 403) {
      return { ok: false, error: "auth" };
    }
    if (res.status === 404) {
      return { ok: false, error: "not_found" };
    }
    if (!res.ok) {
      const message = await res.text().catch(() => "");
      return {
        ok: false,
        error: "unknown",
        message: message || `HTTP ${res.status}`,
      };
    }

    const body = (await res.json()) as Record<string, unknown>;
    const status = typeof body.status === "string" ? body.status : "";
    return { ok: true, status };
  } catch (error) {
    return {
      ok: false,
      error: "network",
      message: error instanceof Error ? error.message : undefined,
    };
  }
}

export async function ensureBalanceSalePosted(
  orderId: string,
): Promise<{ ok: boolean; message?: string }> {
  const token = getAccessToken();
  if (!token) {
    return { ok: false, message: "საჭიროა შესვლა" };
  }

  const id = orderId.trim();
  if (!id) {
    return { ok: false, message: "შეკვეთის ID აკლია" };
  }

  try {
    const res = await fetch(
      `${API_CONFIG.BASE_URL}/orders/${id}/payment/bog/ensure-balance-sale`,
      {
        method: "POST",
        headers: authHeaders(token),
        body: "{}",
      },
    );

    let body: unknown;
    try {
      body = await res.json();
    } catch {
      body = null;
    }

    if (res.status === 401 || res.status === 403) {
      return { ok: false, message: "სესია ვადაგასულია" };
    }

    const message =
      body &&
      typeof body === "object" &&
      "message" in body &&
      typeof (body as { message: unknown }).message === "string"
        ? String((body as { message: string }).message)
        : undefined;

    if (!res.ok) {
      return {
        ok: false,
        message: message || nestApiErrorMessage(body, res.status),
      };
    }

    return { ok: true, message };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "ქსელი",
    };
  }
}

export async function waitForOrderPaymentConfirmed(
  orderId: string,
  options?: { maxAttempts?: number; intervalMs?: number },
): Promise<"confirmed" | "timeout" | "auth" | "error"> {
  const maxAttempts = options?.maxAttempts ?? 20;
  const intervalMs = options?.intervalMs ?? 1500;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const result = await fetchOrderById(orderId);
    if (!result.ok) {
      if (result.error === "auth") return "auth";
      return "error";
    }

    if (
      result.status === "confirmed" ||
      result.status === "shipped" ||
      result.status === "delivered"
    ) {
      return "confirmed";
    }

    if (attempt < maxAttempts - 1) {
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
  }

  return "timeout";
}

export function buildBogRedirectUrls(orderId: string): {
  successRedirectUrl?: string;
  failRedirectUrl?: string;
} {
  if (typeof window === "undefined") return {};

  const origin = window.location.origin;
  if (origin.startsWith("https://")) {
    const encoded = encodeURIComponent(orderId);
    return {
      successRedirectUrl: `${origin}/checkout/success?orderId=${encoded}`,
      failRedirectUrl: `${origin}/checkout/fail?orderId=${encoded}`,
    };
  }

  const apiBase = API_CONFIG.BASE_URL.replace(/\/api$/, "");
  if (apiBase.toLowerCase().startsWith("https://")) {
    return {
      successRedirectUrl: `${apiBase}/api/payments/bog/mobile-return/success`,
      failRedirectUrl: `${apiBase}/api/payments/bog/mobile-return/fail`,
    };
  }

  return {};
}
