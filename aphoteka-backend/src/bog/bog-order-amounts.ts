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
