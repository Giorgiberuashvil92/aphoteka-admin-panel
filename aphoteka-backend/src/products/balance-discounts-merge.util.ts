/**
 * იგივე ლოგიკა რაც `src/lib/api/balanceSync.ts` — მობილურის სიაზე Balance Discounts ცოცხლად,
 * თუ Mongo-ში ჯერ არ არის სინქით ჩაწერილი.
 */

export type BalanceDiscountForItem = {
  balanceDiscountUid?: string;
  balanceDiscountName?: string;
  balanceDiscountPercent?: number;
  balanceDiscountAmount?: number;
};

export type BalanceDiscountMaps = {
  byItemUid: Map<string, BalanceDiscountForItem>;
  unconditional?: BalanceDiscountForItem;
};

function getStr(item: Record<string, unknown>, ...keys: string[]): string {
  for (const k of keys) {
    const v = item[k];
    if (v !== null && v !== undefined && v !== '') return String(v).trim();
  }
  return '';
}

function getOptionalNum(
  item: Record<string, unknown>,
  ...keys: string[]
): number | undefined {
  for (const k of keys) {
    const v = item[k];
    if (v === null || v === undefined || v === '') continue;
    const n = Number(v);
    if (!Number.isNaN(n)) return n;
  }
  return undefined;
}

export function getBalanceItems(data: unknown): Record<string, unknown>[] {
  if (Array.isArray(data)) return data as Record<string, unknown>[];
  if (data && typeof data === 'object') {
    const o = data as Record<string, unknown>;
    if (Array.isArray(o.Items)) return o.Items as Record<string, unknown>[];
    if (Array.isArray(o.value)) return o.value as Record<string, unknown>[];
    if (Array.isArray(o.Value)) return o.Value as Record<string, unknown>[];
    if (Array.isArray(o.Source)) return o.Source as Record<string, unknown>[];
    const flatArrayKeys = [
      'data',
      'Data',
      'result',
      'Result',
      'Rows',
      'rows',
      'Records',
      'records',
    ] as const;
    for (const k of flatArrayKeys) {
      const v = o[k];
      if (Array.isArray(v)) return v as Record<string, unknown>[];
    }
    for (const k of ['value', 'Value', 'data', 'Data'] as const) {
      const inner = o[k];
      if (inner && typeof inner === 'object' && !Array.isArray(inner)) {
        const nested = getBalanceItems(inner);
        if (nested.length > 0) return nested;
      }
    }
  }
  return [];
}

function nomenclatureUidFromDiscountRow(
  row: Record<string, unknown>,
): string | undefined {
  const flat = getStr(
    row,
    'Item',
    'item',
    'ItemRef',
    'NomenclatureRef',
    'ProductRef',
    'Nomenclature',
    'nomenclature',
    'Product',
    'product',
  );
  if (flat && /^[0-9a-f-]{36}$/i.test(flat)) return flat;
  for (const k of ['Item', 'Nomenclature', 'Product', 'item'] as const) {
    const nested = row[k];
    if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
      const u = getStr(
        nested as Record<string, unknown>,
        'uid',
        'UID',
        'Ref',
        'UUID',
        'Uuid',
      );
      if (u && /^[0-9a-f-]{36}$/i.test(u)) return u;
    }
  }
  return undefined;
}

function balanceDiscountRuleActiveByPeriod(row: Record<string, unknown>): boolean {
  const start = getStr(row, 'StartDate', 'startDate');
  const end = getStr(row, 'EndDate', 'endDate');
  if (!start && !end) return true;
  const parseDdMmYyyy = (s: string): Date | undefined => {
    const m = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.exec(s.trim());
    if (!m) return undefined;
    const d = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
    return Number.isNaN(d.getTime()) ? undefined : d;
  };
  const now = new Date();
  now.setHours(12, 0, 0, 0);
  if (start) {
    const ds = parseDdMmYyyy(start);
    if (ds && now < ds) return false;
  }
  if (end) {
    const de = parseDdMmYyyy(end);
    if (de) {
      de.setHours(23, 59, 59, 999);
      if (now > de) return false;
    }
  }
  return true;
}

function balanceDiscountRuleIsActiveFlag(row: Record<string, unknown>): boolean {
  const v = String(row.IsActive ?? row.isActive ?? 'true')
    .trim()
    .toLowerCase();
  return v === 'true' || v === '1' || v === 'yes';
}

function percentFromDiscountRuleRow(
  row: Record<string, unknown>,
): number | undefined {
  const pctRaw = getOptionalNum(
    row,
    'Percentage',
    'percentage',
    'DiscountPercent',
    'discountPercent',
    'PercentDiscount',
    'percentDiscount',
    'Percent',
    'percent',
  );
  if (pctRaw !== undefined && pctRaw > 0) {
    if (pctRaw > 0 && pctRaw <= 1) return Math.round(pctRaw * 100);
    if (pctRaw <= 100) return Math.round(pctRaw);
  }
  const discVal = getOptionalNum(row, 'Discount', 'discount');
  if (discVal !== undefined && discVal > 0 && discVal <= 100)
    return Math.round(discVal);
  return undefined;
}

function discountEntryFromRuleRow(
  row: Record<string, unknown>,
): BalanceDiscountForItem | undefined {
  const name = getStr(
    row,
    'Name',
    'name',
    'Description',
    'Presentation',
    'DiscountName',
    'discountName',
  );
  const code = getStr(row, 'Code', 'code', 'uid', 'UID');
  const rowUid = getStr(row, 'uid', 'UUID', 'Uuid');
  const idForUid = code || rowUid;

  const balanceDiscountPercent = percentFromDiscountRuleRow(row);
  let balanceDiscountAmount: number | undefined;
  if (balanceDiscountPercent === undefined) {
    balanceDiscountAmount = getOptionalNum(
      row,
      'DiscountAmount',
      'discountAmount',
      'FixedDiscount',
      'fixedDiscount',
      'Amount',
      'Sum',
    );
    if (
      balanceDiscountAmount !== undefined &&
      balanceDiscountAmount <= 0
    ) {
      balanceDiscountAmount = undefined;
    }
  }

  const entry: BalanceDiscountForItem = {};
  if (idForUid) entry.balanceDiscountUid = idForUid;
  if (name) entry.balanceDiscountName = name;
  if (balanceDiscountPercent !== undefined)
    entry.balanceDiscountPercent = balanceDiscountPercent;
  if (balanceDiscountAmount !== undefined)
    entry.balanceDiscountAmount = balanceDiscountAmount;

  if (
    entry.balanceDiscountPercent === undefined &&
    entry.balanceDiscountAmount === undefined &&
    !entry.balanceDiscountName &&
    !entry.balanceDiscountUid
  ) {
    return undefined;
  }
  return entry;
}

function mergeDiscountPreferHigherPercent(
  a: BalanceDiscountForItem,
  b: BalanceDiscountForItem,
): BalanceDiscountForItem {
  const pa = a.balanceDiscountPercent ?? 0;
  const pb = b.balanceDiscountPercent ?? 0;
  if (pb > pa) return b;
  if (pa > pb) return a;
  return b;
}

export function buildDiscountMapsFromBalanceApi(
  data: unknown,
): BalanceDiscountMaps {
  return buildDiscountMapsFromBalanceDiscountRows(getBalanceItems(data));
}

function buildDiscountMapsFromBalanceDiscountRows(
  discountRows: Record<string, unknown>[],
): BalanceDiscountMaps {
  const byItemUid = new Map<string, BalanceDiscountForItem>();
  let unconditional: BalanceDiscountForItem | undefined;

  const setItemDisc = (itemUid: string, entry: BalanceDiscountForItem) => {
    const key = itemUid.trim().toLowerCase();
    const prev = byItemUid.get(key);
    byItemUid.set(
      key,
      prev ? mergeDiscountPreferHigherPercent(prev, entry) : entry,
    );
  };

  for (const row of discountRows) {
    if (!balanceDiscountRuleIsActiveFlag(row)) continue;
    if (!balanceDiscountRuleActiveByPeriod(row)) continue;

    const entry = discountEntryFromRuleRow(row);
    const itemsRaw = row.Items ?? row.items;

    if (Array.isArray(itemsRaw) && itemsRaw.length > 0) {
      if (!entry) continue;
      for (const el of itemsRaw) {
        if (!el || typeof el !== 'object') continue;
        const rec = el as Record<string, unknown>;
        const itemUid = getStr(rec, 'Item', 'item');
        if (!itemUid || !/^[0-9a-f-]{36}$/i.test(itemUid)) continue;
        setItemDisc(itemUid, { ...entry });
      }
      continue;
    }

    if (Array.isArray(itemsRaw) && itemsRaw.length === 0) {
      if (entry) {
        const pu = entry.balanceDiscountPercent ?? 0;
        const uu = unconditional?.balanceDiscountPercent ?? 0;
        if (!unconditional || pu > uu) {
          unconditional = { ...entry };
        }
      }
      continue;
    }

    const uuid = nomenclatureUidFromDiscountRow(row);
    if (uuid && entry) {
      setItemDisc(uuid, entry);
    }
  }

  return { byItemUid, unconditional };
}

/**
 * Mongo ობიექტებს (toObject) უმატებს balanceDiscount* ველებს, თუ ცარიელია და Balance წესი ემთხვევა.
 */
export function enrichProductsWithBalanceDiscounts(
  products: Record<string, unknown>[],
  maps: BalanceDiscountMaps,
): void {
  for (const p of products) {
    const hasPct = Number(p.balanceDiscountPercent) > 0;
    const hasAmt = Number(p.balanceDiscountAmount) > 0;
    if (hasPct || hasAmt) continue;

    const uidRaw = String(p.balanceNomenclatureItemUid ?? '').trim();
    const uid = uidRaw.toLowerCase();
    let disc: BalanceDiscountForItem | undefined =
      uid && /^[0-9a-f-]{36}$/i.test(uidRaw)
        ? maps.byItemUid.get(uid)
        : undefined;
    if (!disc && maps.unconditional) disc = maps.unconditional;
    if (!disc) continue;

    if (disc.balanceDiscountPercent != null) {
      p.balanceDiscountPercent = disc.balanceDiscountPercent;
    }
    if (disc.balanceDiscountAmount != null) {
      p.balanceDiscountAmount = disc.balanceDiscountAmount;
    }
    if (disc.balanceDiscountName) {
      p.balanceDiscountName = disc.balanceDiscountName;
    }
    if (disc.balanceDiscountUid) {
      p.balanceDiscountUid = disc.balanceDiscountUid;
    }
  }
}
