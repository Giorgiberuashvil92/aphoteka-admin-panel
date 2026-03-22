import type { Warehouse } from '@/types';

/** კლიენტიდან – პროქსი სერვერზე (Basic auth Balance-ზე არ გამოდის ბრაუზერში) */
export async function getBalanceWarehouses(): Promise<unknown> {
  const res = await fetch('/api/balance/warehouses', { cache: 'no-store' });
  const json = await res.json();
  if (!json.ok) throw new Error(json.error || 'Balance API შეცდომა');
  return json.data;
}

function getStr(item: Record<string, unknown>, ...keys: string[]): string {
  for (const k of keys) {
    const v = item[k];
    if (v !== null && v !== undefined && v !== '') return String(v).trim();
  }
  return '';
}

export function rowsFromBalanceWarehouses(data: unknown): Record<string, unknown>[] {
  if (Array.isArray(data)) return data as Record<string, unknown>[];
  if (data && typeof data === 'object') {
    const o = data as Record<string, unknown>;
    if (Array.isArray(o.Items)) return o.Items as Record<string, unknown>[];
    if (Array.isArray(o.value)) return o.value as Record<string, unknown>[];
    if (Array.isArray(o.Value)) return o.Value as Record<string, unknown>[];
  }
  return [];
}

/** Balance warehouse ჩანაწერის გადაკეთება ჩვენი Warehouse ტიპზე – ფორმატი "ქალაქი - საწყობი" */
export function mapBalanceWarehouseToWarehouse(
  row: Record<string, unknown>
): Partial<Warehouse> {
  const city = getStr(row, 'City', 'city', 'Town', 'ქალაქი') || '';
  const warehousePart =
    getStr(row, 'Name', 'Description', 'WarehouseName', 'Title', 'name', 'Type') || 'საწყობი';
  const name = city ? `${city} - ${warehousePart}` : warehousePart;

  const addressRaw = getStr(row, 'Address', 'address', 'Location', 'Street', 'მისამართი');
  const address = addressRaw
    ? addressRaw.startsWith('ქ.')
      ? addressRaw
      : city
        ? `ქ. ${city}, ${addressRaw}`
        : addressRaw
    : city
      ? `ქ. ${city}`
      : '';

  const phoneNumber = getStr(row, 'Phone', 'PhoneNumber', 'phone', 'Tel', 'ტელეფონი') || undefined;
  const email = getStr(row, 'Email', 'email', 'Mail') || undefined;

  return {
    name,
    address: address || name,
    city: city || '—',
    phoneNumber: phoneNumber || undefined,
    email: email || undefined,
    active: false,
  };
}
