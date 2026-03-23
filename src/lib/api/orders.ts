import {
  Order,
  OrderItem,
  OrderStatus,
  PaymentStatus,
  Product,
  User,
  UserRole,
} from '@/types';
import { api } from './client';

export interface OrdersResponse {
  data: Order[];
  total: number;
  page: number;
  limit: number;
}

export interface OrderResponse {
  data: Order;
}

type ApiOrderItem = {
  /** ObjectId სტრიქონი ან populate-ილი პროდუქტი { _id, name, ... } */
  productId?: unknown;
  productName?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  imageUrl?: string;
  packSize?: string;
};

type ApiOrder = {
  id?: string;
  _id?: { toString(): string };
  userId?: unknown;
  items: ApiOrderItem[];
  totalAmount: number;
  status: string;
  shippingAddress?: string;
  phoneNumber?: string;
  comment?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
};

function oid(raw: unknown): string {
  if (raw == null) return '';
  if (typeof raw === 'string') return raw;
  if (typeof raw === 'object' && raw !== null && 'toString' in raw) {
    return String((raw as { toString(): string }).toString());
  }
  return String(raw);
}

/** Nest OrderStatus → UI OrderStatus */
export function mapBackendOrderStatusToUi(status: string): OrderStatus {
  const s = (status || '').toLowerCase();
  switch (s) {
    case 'pending':
      return OrderStatus.CREATED;
    case 'confirmed':
      return OrderStatus.CONFIRMED;
    case 'shipped':
      return OrderStatus.OUT_FOR_DELIVERY;
    case 'delivered':
      return OrderStatus.DELIVERED;
    case 'cancelled':
      return OrderStatus.CANCELLED;
    default:
      return OrderStatus.CREATED;
  }
}

/** UI → Nest OrderStatus (სქემის enum სტრიქონები) */
export function mapUiOrderStatusToBackend(status: OrderStatus): string {
  switch (status) {
    case OrderStatus.CREATED:
      return 'pending';
    case OrderStatus.CONFIRMED:
    case OrderStatus.PACKED:
      return 'confirmed';
    case OrderStatus.OUT_FOR_DELIVERY:
      return 'shipped';
    case OrderStatus.DELIVERED:
      return 'delivered';
    case OrderStatus.CANCELLED:
    case OrderStatus.FAILED:
      return 'cancelled';
    default:
      return 'pending';
  }
}

function mapPopulatedUser(u: unknown): User | undefined {
  if (!u || typeof u !== 'object') return undefined;
  const o = u as Record<string, unknown>;
  const id = o.id != null ? String(o.id) : oid(o._id);
  if (!id) return undefined;
  return {
    id,
    role: (o.role as User['role']) || UserRole.CONSUMER,
    phoneNumber: String(o.phoneNumber ?? ''),
    email: o.email != null ? String(o.email) : undefined,
    fullName: o.fullName != null ? String(o.fullName) : undefined,
    status: (o.status as User['status']) || 'active',
    createdAt: o.createdAt ? new Date(o.createdAt as string) : new Date(),
    updatedAt: o.updatedAt ? new Date(o.updatedAt as string) : new Date(),
  };
}

/** ხაზიდან: შენახული სახელი ან კატალოგიდან populate-ის name */
function resolveLineProductMeta(it: ApiOrderItem): {
  productId: string;
  displayName: string;
  packSize?: string;
} {
  const raw = it.productId;
  const savedName = it.productName?.trim();
  if (
    raw &&
    typeof raw === 'object' &&
    !Array.isArray(raw) &&
    ('name' in raw || 'sku' in raw || 'packSize' in raw)
  ) {
    const o = raw as Record<string, unknown>;
    const id = o.id != null ? String(o.id) : oid(o._id);
    const fromCatalog =
      o.name != null ? String(o.name).trim() : '';
    const packFromLine = it.packSize?.trim();
    const packFromCatalog =
      o.packSize != null ? String(o.packSize).trim() : '';
    return {
      productId: id,
      displayName: savedName || fromCatalog || 'პროდუქტი',
      packSize: packFromLine || packFromCatalog || undefined,
    };
  }
  const id = oid(raw);
  return {
    productId: id,
    displayName: savedName || 'პროდუქტი',
    packSize: it.packSize?.trim() || undefined,
  };
}

function stubProduct(
  id: string,
  name: string,
  unitPrice: number,
  packSize?: string,
): Product {
  const now = new Date();
  return {
    id: id || 'unknown',
    productStrengthId: id || 'unknown',
    name,
    price: unitPrice,
    active: true,
    sku: (id || 'sku').slice(0, 24),
    packSize,
    createdAt: now,
    updatedAt: now,
  };
}

export function normalizeOrderFromApi(raw: ApiOrder): Order {
  const orderId = raw.id || oid(raw._id);
  const populatedUser = mapPopulatedUser(raw.userId);
  const userIdStr =
    populatedUser?.id ||
    (raw.userId && typeof raw.userId === 'object' && raw.userId !== null && '_id' in raw.userId
      ? oid((raw.userId as { _id: unknown })._id)
      : oid(raw.userId));

  const items: OrderItem[] = (raw.items || []).map((it, idx) => {
    const { productId: pid, displayName, packSize: linePack } =
      resolveLineProductMeta(it);
    const lineId = `${orderId}-line-${idx}`;
    const unit = Number(it.unitPrice) || 0;
    return {
      id: lineId,
      orderId,
      productId: pid,
      quantity: Number(it.quantity) || 0,
      priceAtOrderTime: unit,
      product: stubProduct(
        pid || `p-${idx}`,
        displayName,
        unit,
        linePack,
      ),
    };
  });

  const deliveryAddr = raw.shippingAddress?.trim() || '—';
  const cityGuess = deliveryAddr.includes(',')
    ? deliveryAddr.split(',').pop()?.trim()
    : undefined;

  return {
    id: orderId,
    userId: userIdStr,
    user: populatedUser,
    status: mapBackendOrderStatusToUi(raw.status),
    totalAmount: Number(raw.totalAmount) || 0,
    deliveryFee: 0,
    paymentStatus: PaymentStatus.PENDING,
    deliveryAddress: deliveryAddr,
    deliveryCity: cityGuess || '—',
    deliveryPhone: raw.phoneNumber?.trim() || populatedUser?.phoneNumber || '—',
    warehouseLocation: undefined,
    createdAt: raw.createdAt ? new Date(raw.createdAt) : new Date(),
    updatedAt: raw.updatedAt ? new Date(raw.updatedAt) : new Date(),
    items,
  };
}

export const ordersApi = {
  getAll: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    paymentStatus?: string;
    search?: string;
    warehouseId?: string;
  }): Promise<OrdersResponse> => {
    const raw = await api.get<ApiOrder[]>(`/orders/admin/all`);
    const list = Array.isArray(raw) ? raw : [];
    let mapped = list.map(normalizeOrderFromApi);

    if (params?.status && params.status !== 'all') {
      mapped = mapped.filter((o) => o.status === params.status);
    }
    if (params?.paymentStatus && params.paymentStatus !== 'all') {
      mapped = mapped.filter((o) => o.paymentStatus === params.paymentStatus);
    }
    if (params?.search?.trim()) {
      const q = params.search.trim().toLowerCase();
      mapped = mapped.filter(
        (o) =>
          o.id.toLowerCase().includes(q) ||
          (o.user?.fullName?.toLowerCase().includes(q) ?? false) ||
          (o.user?.phoneNumber?.includes(q) ?? false) ||
          (o.user?.email?.toLowerCase().includes(q) ?? false) ||
          o.items.some((it) => it.product?.name?.toLowerCase().includes(q)),
      );
    }
    if (params?.warehouseId) {
      mapped = mapped.filter((o) => o.warehouseLocation === params.warehouseId);
    }

    return {
      data: mapped,
      total: mapped.length,
      page: params?.page ?? 1,
      limit: params?.limit ?? (mapped.length || 1),
    };
  },

  getById: async (id: string): Promise<OrderResponse> => {
    const raw = await api.get<ApiOrder>(
      `/orders/admin/${encodeURIComponent(id)}`,
    );
    return { data: normalizeOrderFromApi(raw) };
  },

  updateStatus: async (id: string, status: OrderStatus): Promise<OrderResponse> => {
    const backendStatus = mapUiOrderStatusToBackend(status);
    const raw = await api.patch<ApiOrder>(
      `/orders/admin/${encodeURIComponent(id)}`,
      { status: backendStatus },
    );
    return { data: normalizeOrderFromApi(raw) };
  },

  cancel: async (id: string, _reason?: string): Promise<OrderResponse> => {
    return ordersApi.updateStatus(id, OrderStatus.CANCELLED);
  },
};
