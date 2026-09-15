/**
 * იგივე ლოგიკა რაც `src/lib/api/balanceSync.ts` — მობილურის სიაზე Balance Discounts ცოცხლად,
 * თუ Mongo-ში ჯერ არ არის სინქით ჩაწერილი.
 */

export type BalanceDiscountForItem = {
  balanceDiscountUid?: string;
  balanceDiscountName?: string;
  balanceDiscountPercent?: number;
  balanceDiscountAmount?: number;
  balanceDiscountRulePercent?: number;
  balanceDiscountRuleAmount?: number;
  balanceDiscountCondition?: string;
  balanceDiscountStartDate?: string;
  balanceDiscountEndDate?: string;
  balanceDiscountSchedule?: string;
  balanceDiscountComments?: string;
  balanceDiscountMinOrderAmount?: number;
  balanceLoyaltyCardType?: string;
  balancePointsAccrualMethod?: string;
  balancePointsValue?: number;
};

export type BalanceDiscountMaps = {
  byItemUid: Map<string, BalanceDiscountForItem>;
  unconditional?: BalanceDiscountForItem;
};

const NULL_GROUP_UID = '00000000-0000-0000-0000-000000000000';

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
    const n = Number(String(v).replace(/\s|\u00a0/g, '').replace(',', '.'));
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

function balanceDiscountRuleActiveByPeriod(
  row: Record<string, unknown>,
): boolean {
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

function balanceDiscountRuleIsActiveFlag(
  row: Record<string, unknown>,
): boolean {
  const v = String(row.IsActive ?? row.isActive ?? 'true')
    .trim()
    .toLowerCase();
  return v === 'true' || v === '1' || v === 'yes';
}

function balanceDiscountCondition(row: Record<string, unknown>): string {
  return getStr(row, 'DiscountCondition', 'discountCondition')
    .trim()
    .toLowerCase();
}

function balanceDiscountAppliesUnconditionally(
  row: Record<string, unknown>,
): boolean {
  const condition = balanceDiscountCondition(row);
  return !condition || condition === 'უპირობოდ';
}

function scheduleTextFromDiscountRow(row: Record<string, unknown>): string {
  const raw = row.Schedule ?? row.schedule ?? row.ScheduleDescription;
  const rows = Array.isArray(raw) ? raw : raw ? [raw] : [];
  return rows
    .map((value) => {
      if (!value || typeof value !== 'object') return String(value);
      const rec = value as Record<string, unknown>;
      const weekDay = getStr(rec, 'WeekDay', 'weekDay');
      const start = getStr(rec, 'StartPeriod', 'startPeriod');
      const end = getStr(rec, 'EndPeriod', 'endPeriod');
      const chosen = getStr(rec, 'IsChosen', 'isChosen').toLowerCase();
      return [
        weekDay || 'დღე',
        start || end ? `${start || '00:00:00'}-${end || '23:59:59'}` : '',
        chosen === 'yes' || chosen === 'true' || chosen === '1'
          ? ''
          : 'არ არის არჩეული',
      ]
        .filter(Boolean)
        .join(' · ');
    })
    .join('; ');
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
    if (balanceDiscountAmount !== undefined && balanceDiscountAmount <= 0) {
      balanceDiscountAmount = undefined;
    }
  }

  const entry: BalanceDiscountForItem = {};
  if (idForUid) entry.balanceDiscountUid = idForUid;
  if (name) entry.balanceDiscountName = name;
  if (balanceDiscountPercent !== undefined) {
    entry.balanceDiscountRulePercent = balanceDiscountPercent;
    entry.balanceDiscountPercent = balanceDiscountPercent;
  }
  if (balanceDiscountAmount !== undefined) {
    entry.balanceDiscountRuleAmount = balanceDiscountAmount;
    entry.balanceDiscountAmount = balanceDiscountAmount;
  }
  const condition = getStr(row, 'DiscountCondition', 'discountCondition');
  const startDate = getStr(row, 'StartDate', 'startDate');
  const endDate = getStr(row, 'EndDate', 'endDate');
  const schedule = scheduleTextFromDiscountRow(row);
  const comments = getStr(row, 'Comments', 'comments', 'Comment', 'comment');
  const minOrderAmount = getOptionalNum(
    row,
    'MinOrderAmount',
    'MinimumOrderAmount',
    'Amount',
    'OrderAmount',
    'OrderSum',
    'SumFrom',
    'MinAmount',
    'MinimumAmount',
    'Threshold',
    'OrderVolume',
    'OrderValue',
    'შეკვეთის მოცულობა',
    'შეკვეთის ჯამი',
  );
  const loyaltyCardType = getStr(row, 'LoyaltyCardType', 'loyaltyCardType');
  const pointsAccrualMethod = getStr(
    row,
    'PointsAccrualMethod',
    'pointsAccrualMethod',
  );
  const pointsValue = getOptionalNum(row, 'PointsValue', 'pointsValue');
  if (condition) entry.balanceDiscountCondition = condition;
  if (startDate) entry.balanceDiscountStartDate = startDate;
  if (endDate) entry.balanceDiscountEndDate = endDate;
  if (schedule) entry.balanceDiscountSchedule = schedule;
  if (comments) entry.balanceDiscountComments = comments;
  if (minOrderAmount !== undefined)
    entry.balanceDiscountMinOrderAmount = minOrderAmount;
  if (loyaltyCardType) entry.balanceLoyaltyCardType = loyaltyCardType;
  if (pointsAccrualMethod)
    entry.balancePointsAccrualMethod = pointsAccrualMethod;
  if (pointsValue !== undefined) entry.balancePointsValue = pointsValue;

  if (!balanceDiscountAppliesUnconditionally(row)) {
    delete entry.balanceDiscountPercent;
    delete entry.balanceDiscountAmount;
  }

  if (
    entry.balanceDiscountRulePercent === undefined &&
    entry.balanceDiscountRuleAmount === undefined &&
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
  const pa = a.balanceDiscountRulePercent ?? a.balanceDiscountPercent ?? 0;
  const pb = b.balanceDiscountRulePercent ?? b.balanceDiscountPercent ?? 0;
  if (pb > pa) return b;
  if (pa > pb) return a;
  return b;
}

export function buildDiscountMapsFromBalanceApi(
  data: unknown,
  catalogRows?: Record<string, unknown>[],
): BalanceDiscountMaps {
  return buildDiscountMapsFromBalanceDiscountRows(
    getBalanceItems(data),
    catalogRows,
  );
}

function buildDiscountMapsFromBalanceDiscountRows(
  discountRows: Record<string, unknown>[],
  catalogRows?: Record<string, unknown>[],
): BalanceDiscountMaps {
  const byItemUid = new Map<string, BalanceDiscountForItem>();
  let unconditional: BalanceDiscountForItem | undefined;
  const groupItemUids = catalogRows
    ? buildLeafItemUidsByGroupUid(catalogRows)
    : new Map<string, string[]>();

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
        const leafUids = groupItemUids.get(itemUid.trim().toLowerCase());
        if (leafUids?.length) {
          for (const leafUid of leafUids) setItemDisc(leafUid, { ...entry });
        } else {
          setItemDisc(itemUid, { ...entry });
        }
      }
      continue;
    }

    if (
      Array.isArray(itemsRaw) &&
      itemsRaw.length === 0 &&
      balanceDiscountAppliesUnconditionally(row)
    ) {
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

function isBalanceGroupRow(row: Record<string, unknown>): boolean {
  return String(row.IsGroup ?? row.isGroup ?? '').toLowerCase() === 'true';
}

function itemUuid(row: Record<string, unknown>): string | undefined {
  const uid = getStr(row, 'uid', 'UID', 'Uuid', 'UUID');
  return uid && /^[0-9a-f-]{36}$/i.test(uid) ? uid : undefined;
}

function buildLeafItemUidsByGroupUid(
  rows: Record<string, unknown>[],
): Map<string, string[]> {
  const byUid = new Map<string, Record<string, unknown>>();
  const out = new Map<string, string[]>();
  for (const row of rows) {
    const uid = itemUuid(row);
    if (uid) byUid.set(uid.toLowerCase(), row);
  }

  for (const row of rows) {
    if (isBalanceGroupRow(row)) continue;
    const leafUid = itemUuid(row);
    if (!leafUid) continue;
    let groupUid = getStr(row, 'Group', 'group', 'GroupRef');
    const seen = new Set<string>();

    for (let depth = 0; depth < 50; depth += 1) {
      if (!groupUid || groupUid === NULL_GROUP_UID) break;
      const key = groupUid.toLowerCase();
      if (seen.has(key)) break;
      seen.add(key);
      const list = out.get(key) ?? [];
      list.push(leafUid);
      out.set(key, list);
      const groupRow = byUid.get(key);
      groupUid = groupRow ? getStr(groupRow, 'Group', 'group', 'GroupRef') : '';
    }
  }

  return out;
}

/** Mongo ობიექტებს (toObject) უმატებს/უახლებს აქტიურ Balance Discounts ველებს. */
export function enrichProductsWithBalanceDiscounts(
  products: Record<string, unknown>[],
  maps: BalanceDiscountMaps,
): void {
  for (const p of products) {
    for (const key of [
      'balanceDiscountPercent',
      'balanceDiscountAmount',
      'balanceDiscountName',
      'balanceDiscountUid',
      'balanceDiscountRulePercent',
      'balanceDiscountRuleAmount',
      'balanceDiscountCondition',
      'balanceDiscountStartDate',
      'balanceDiscountEndDate',
      'balanceDiscountSchedule',
      'balanceDiscountComments',
      'balanceDiscountMinOrderAmount',
      'balanceLoyaltyCardType',
      'balancePointsAccrualMethod',
      'balancePointsValue',
    ] as const) {
      delete p[key];
    }

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
      delete p.balanceDiscountAmount;
    }
    if (disc.balanceDiscountAmount != null) {
      p.balanceDiscountAmount = disc.balanceDiscountAmount;
      delete p.balanceDiscountPercent;
    }
    if (disc.balanceDiscountName) {
      p.balanceDiscountName = disc.balanceDiscountName;
    }
    if (disc.balanceDiscountUid) {
      p.balanceDiscountUid = disc.balanceDiscountUid;
    }
    for (const key of [
      'balanceDiscountRulePercent',
      'balanceDiscountRuleAmount',
      'balanceDiscountCondition',
      'balanceDiscountStartDate',
      'balanceDiscountEndDate',
      'balanceDiscountSchedule',
      'balanceDiscountComments',
      'balanceDiscountMinOrderAmount',
      'balanceLoyaltyCardType',
      'balancePointsAccrualMethod',
      'balancePointsValue',
    ] as const) {
      if (disc[key] != null && disc[key] !== '') p[key] = disc[key];
    }
  }
}
