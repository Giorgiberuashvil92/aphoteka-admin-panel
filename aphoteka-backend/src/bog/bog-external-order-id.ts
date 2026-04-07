/**
 * BOG `external_order_id` — მობილაპთან იგივე ეტიკეტი: `ORD-` + Mongo _id-ის ბოლო 6 ჰექსი.
 * (იხ. Kutuku `orders.service.ts` mapApiOrder.)
 * ბანკის ამონაწერზე პირველი ~25 სიმბოლო (BOG დოკი).
 * Callback-ში შეკვეთა ეძებება `order_id` (bogOrderId); ORD- ფორმატიდან _id არ იკითხება.
 */
const MONGO_ID_RE = /^[a-fA-F0-9]{24}$/;

/** მობილაპის „შეკვეთის ნომერი“ — ORD-XXXXXX */
export function orderNumberLabelFromMongoId(mongoOrderId: string): string {
  const id = mongoOrderId.trim();
  const hex = id.replace(/[^a-fA-F0-9]/g, '');
  const short = (hex.slice(-6) || id.slice(0, 8)).toUpperCase();
  return `ORD-${short}`;
}

/** მხოლოდ ORD-XXXXXX — საბანკო აღწერისთვის */
export function buildBogExternalOrderIdForStatement(
  orderMongoId: string,
): string {
  return orderNumberLabelFromMongoId(orderMongoId);
}

/** Callback / legacy: Mongo _id external-იდან */
export function parseMongoOrderIdFromBogExternal(
  externalOrderId: string | undefined,
): string | null {
  const t = externalOrderId?.trim();
  if (!t) return null;
  if (MONGO_ID_RE.test(t)) return t;
  const pipe = t.lastIndexOf('|');
  if (pipe >= 0) {
    const tail = t.slice(pipe + 1).trim();
    if (MONGO_ID_RE.test(tail)) return tail;
  }
  const tailHex = /([a-fA-F0-9]{24})\s*$/.exec(t);
  if (tailHex) return tailHex[1];
  return null;
}
