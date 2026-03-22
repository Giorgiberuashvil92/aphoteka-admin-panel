/** კლიენტიდან – ნაშთები Balance Exchange-იდან */
export async function getBalanceStocks(): Promise<unknown> {
  const res = await fetch('/api/balance/stocks', { cache: 'no-store' });
  const json = await res.json();
  if (!json.ok) throw new Error(json.error || 'Balance Stocks API შეცდომა');
  return json.data;
}

export function rowsFromBalanceStocks(data: unknown): Record<string, unknown>[] {
  return rowsFromBalanceData(data);
}

/** კლიენტიდან – ფასები Balance Exchange-იდან */
export async function getBalancePrices(): Promise<unknown> {
  const res = await fetch('/api/balance/prices', { cache: 'no-store' });
  const json = await res.json();
  if (!json.ok) throw new Error(json.error || 'Balance Prices API შეცდომა');
  return json.data;
}

export function rowsFromBalancePrices(data: unknown): Record<string, unknown>[] {
  return rowsFromBalanceData(data);
}

function rowsFromBalanceData(data: unknown): Record<string, unknown>[] {
  if (Array.isArray(data)) return data as Record<string, unknown>[];
  if (data && typeof data === 'object') {
    const o = data as Record<string, unknown>;
    if (Array.isArray(o.Items)) return o.Items as Record<string, unknown>[];
    if (Array.isArray(o.value)) return (o.value as Record<string, unknown>[]);
    if (Array.isArray(o.Value)) return (o.Value as Record<string, unknown>[]);
  }
  return [];
}
