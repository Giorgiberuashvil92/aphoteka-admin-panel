import type { Order } from '../orders/schemas/order.schema';

function roundGel(n: number): number {
  return Math.round(n * 100) / 100;
}

/** პროდუქტების ჯამი (BOG refund — მხოლოდ ეს ნაწილი) */
export function computeOrderProductsTotal(order: Pick<Order, 'items'>): number {
  const sum = (order.items || []).reduce(
    (acc, it) => acc + (Number(it.totalPrice) || 0),
    0,
  );
  return roundGel(sum);
}

/** მიტანის საფასური + სერვისის ფი (refund-ში არ ბრუნდება) */
export function computeOrderDeliveryTotal(
  order: Pick<Order, 'deliveryPrice' | 'deliveryServiceFee'>,
): number {
  return roundGel(
    (Number(order.deliveryPrice) || 0) +
      (Number(order.deliveryServiceFee) || 0),
  );
}

/** BOG-ზე დაბრუნებადი თანხა — პროდუქტები, მიტანის გარეშე */
export function computeBogProductsRefundAmount(
  order: Pick<Order, 'items' | 'deliveryPrice' | 'deliveryServiceFee'>,
): number {
  return computeOrderProductsTotal(order);
}

/** BOG-ზე სრული დაბრუნება — პროდუქტები + მიტანა */
export function computeBogFullRefundAmount(
  order: Pick<Order, 'items' | 'deliveryPrice' | 'deliveryServiceFee'>,
): number {
  return computeOrderGrandTotal(order);
}

/** შეკვეთის სრული თანხა BOG-ზე (გადახდა / სრული refund) — პროდუქტები + მიტანა */
export function computeOrderGrandTotal(
  order: Pick<Order, 'items' | 'deliveryPrice' | 'deliveryServiceFee'>,
): number {
  return roundGel(
    computeOrderProductsTotal(order) + computeOrderDeliveryTotal(order),
  );
}

/** BOG callback snapshot-იდან ჩამოჭრილი თანხა (purchase_units.total_amount) */
export function parseBogChargedAmountFromCallback(
  raw?: Record<string, unknown>,
): number | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const candidates: unknown[] = [raw];
  const body = raw.body;
  if (body && typeof body === 'object') {
    candidates.push(body);
  }
  for (const src of candidates) {
    if (!src || typeof src !== 'object') {
      continue;
    }
    const row = src as Record<string, unknown>;
    const pu = row.purchase_units as Record<string, unknown> | undefined;
    const total = pu?.total_amount ?? row.total_amount ?? row.amount;
    if (typeof total === 'number' && Number.isFinite(total) && total > 0) {
      return roundGel(total);
    }
    if (typeof total === 'string') {
      const n = Number.parseFloat(total);
      if (Number.isFinite(n) && n > 0) {
        return roundGel(n);
      }
    }
  }
  return null;
}
