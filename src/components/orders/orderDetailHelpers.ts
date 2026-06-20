import { Order, OrderStatus, PaymentStatus, UserRole } from '@/types';
import type { User } from '@/types';

export const statusLabels: Record<OrderStatus, string> = {
  [OrderStatus.CREATED]: 'მოლოდინში',
  [OrderStatus.CONFIRMED]: 'დადასტურებული',
  [OrderStatus.PACKED]: 'დაფასოებული',
  [OrderStatus.OUT_FOR_DELIVERY]: 'გზაში',
  [OrderStatus.DELIVERED]: 'მიწოდებული',
  [OrderStatus.CANCELLED]: 'გაუქმებული',
  [OrderStatus.FAILED]: 'შეცდომა',
};

export const statusColors: Record<OrderStatus, string> = {
  [OrderStatus.CREATED]:
    'bg-red-100 text-red-900 dark:bg-red-950/80 dark:text-red-100',
  [OrderStatus.CONFIRMED]:
    'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  [OrderStatus.PACKED]:
    'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  [OrderStatus.OUT_FOR_DELIVERY]:
    'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  [OrderStatus.DELIVERED]:
    'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  [OrderStatus.CANCELLED]:
    'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  [OrderStatus.FAILED]:
    'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

export function paymentLabel(p: PaymentStatus): string {
  switch (p) {
    case PaymentStatus.COMPLETED:
      return 'გადახდილი';
    case PaymentStatus.FAILED:
      return 'შეცდომა';
    case PaymentStatus.PROCESSING:
      return 'დამუშავებაში';
    case PaymentStatus.REFUNDED:
      return 'დაბრუნებული';
    default:
      return 'მოლოდინში';
  }
}

export function orderNumberLabel(id: string): string {
  const short =
    id.replace(/[^a-fA-F0-9]/g, '').slice(-6).toUpperCase() ||
    id.slice(0, 8).toUpperCase();
  return `ORD-${short}`;
}

export function orderProductsTotal(order: Order): number {
  return order.items.reduce(
    (sum, it) => sum + it.priceAtOrderTime * it.quantity,
    0,
  );
}

export function orderDeliveryTotal(order: Order): number {
  return (
    (order.deliveryPrice ?? 0) +
    (order.deliveryServiceFee ?? order.deliveryFee ?? 0)
  );
}

export function orderGrandTotal(order: Order): number {
  return orderProductsTotal(order) + orderDeliveryTotal(order);
}

export function hasBogOrPaymentData(order: Order): boolean {
  return Boolean(
    order.bogOrderId ||
      order.bogPaymentStatus ||
      order.bogLastCallbackAt ||
      order.bogLastCallbackRaw ||
      order.bogProductsRefundAt ||
      (order.comment || '').toLowerCase().includes('ბანკ'),
  );
}

export function getNextStatuses(
  currentStatus: OrderStatus,
  role?: User['role'],
): OrderStatus[] {
  const isWarehouse = role === UserRole.WAREHOUSE_STAFF;
  if (isWarehouse) {
    const whFlow: Record<OrderStatus, OrderStatus[]> = {
      [OrderStatus.CREATED]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
      [OrderStatus.CONFIRMED]: [
        OrderStatus.OUT_FOR_DELIVERY,
        OrderStatus.CANCELLED,
      ],
      [OrderStatus.PACKED]: [
        OrderStatus.OUT_FOR_DELIVERY,
        OrderStatus.CANCELLED,
      ],
      [OrderStatus.OUT_FOR_DELIVERY]: [
        OrderStatus.DELIVERED,
        OrderStatus.CANCELLED,
      ],
      [OrderStatus.DELIVERED]: [],
      [OrderStatus.CANCELLED]: [],
      [OrderStatus.FAILED]: [],
    };
    return whFlow[currentStatus] ?? [];
  }
  const statusFlow: Record<OrderStatus, OrderStatus[]> = {
    [OrderStatus.CREATED]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
    [OrderStatus.CONFIRMED]: [
      OrderStatus.PACKED,
      OrderStatus.OUT_FOR_DELIVERY,
      OrderStatus.CANCELLED,
    ],
    [OrderStatus.PACKED]: [OrderStatus.OUT_FOR_DELIVERY, OrderStatus.CANCELLED],
    [OrderStatus.OUT_FOR_DELIVERY]: [
      OrderStatus.DELIVERED,
      OrderStatus.CANCELLED,
    ],
    [OrderStatus.DELIVERED]: [],
    [OrderStatus.CANCELLED]: [],
    [OrderStatus.FAILED]: [],
  };
  return statusFlow[currentStatus] ?? [];
}

export function userWarehouseId(u: User | null): string | undefined {
  if (!u?.warehouseId) return undefined;
  const w = u.warehouseId as unknown;
  if (typeof w === 'object' && w !== null && '_id' in w) {
    return String((w as { _id: unknown })._id);
  }
  return String(u.warehouseId);
}

/** BOG server callback-ის რეალური `order_status.key` — არა მხოლოდ შეკვეთის confirmed სტატუსი */
export function isBogPaymentCompleted(order: {
  bogPaymentStatus?: string;
}): boolean {
  const bog = (order.bogPaymentStatus || '').toLowerCase();
  return ['completed', 'success', 'paid', 'captured'].some((k) =>
    bog.includes(k),
  );
}
