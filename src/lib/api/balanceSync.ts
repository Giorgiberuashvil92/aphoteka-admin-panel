import type { Product } from '@/types';

/** Balance პასუხიდან Items მასივის ამოღება (Items, value, Value, Source, data, Rows ან root მასივი) */
export function getBalanceItems(data: unknown): Record<string, unknown>[] {
  if (Array.isArray(data)) return data as Record<string, unknown>[];
  if (data && typeof data === 'object') {
    const o = data as Record<string, unknown>;
    if (Array.isArray(o.Items)) return o.Items as Record<string, unknown>[];
    if (Array.isArray(o.value)) return o.value as Record<string, unknown>[];
    if (Array.isArray(o.Value)) return o.Value as Record<string, unknown>[];
    /** Exchange/Prices დოკუმენტაცია: პასუხი ხშირად `{ Source: [ { PriceType, Item, Currency, Price } ] }` */
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

export function getBalancePricesRows(data: unknown): Record<string, unknown>[] {
  return getBalanceItems(data);
}

export function getItemUuid(item: Record<string, unknown>): string | undefined {
  const v = getStr(
    item,
    'uid',
    'UID',
    'Ref',
    'UUID',
    'Id',
    'uuid',
    'ref',
    'ItemRef',
    'NomenclatureRef',
    'ProductRef',
    /** ფასის ჩანაწერში ნომენკლატურის ბმა */
    'Item'
  );
  return v || undefined;
}

/** Items ფიდიდან: ნომენკლატურის `uid` → სახელი (Exchange/Stocks `Item` ველთან) */
export function buildBalanceItemNameByUid(
  itemRows: Record<string, unknown>[]
): Map<string, string> {
  const m = new Map<string, string>();
  for (const row of itemRows) {
    const uid = getItemUuid(row);
    if (!uid) continue;
    const name = getStr(row, 'Name', 'FullName') || uid;
    m.set(uid, name);
  }
  return m;
}

export function buildPriceByUuid(pricesRows: Record<string, unknown>[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const row of pricesRows) {
    const uuid = getItemUuid(row);
    if (!uuid) continue;
    const price = getNum(row, 'Price', 'price', 'Value', 'Cost', 'UnitPrice');
    map.set(uuid, price);
  }
  return map;
}

function getStr(item: Record<string, unknown>, ...keys: string[]): string {
  for (const k of keys) {
    const v = item[k];
    if (v !== null && v !== undefined && v !== '') return String(v).trim();
  }
  return '';
}

function getNum(item: Record<string, unknown>, ...keys: string[]): number {
  for (const k of keys) {
    const v = item[k];
    if (v === null || v === undefined) continue;
    const n = Number(v);
    if (!Number.isNaN(n)) return n;
  }
  return 0;
}

function getDate(item: Record<string, unknown>, ...keys: string[]): string | undefined {
  for (const k of keys) {
    const v = item[k];
    if (v === null || v === undefined) continue;
    if (typeof v === 'string') return v;
    if (v instanceof Date) return v.toISOString();
    return String(v);
  }
  return undefined;
}

const NULL_GROUP_UID = '00000000-0000-0000-0000-000000000000';

export function isBalanceGroupRow(row: Record<string, unknown>): boolean {
  return String(row.IsGroup ?? '').toLowerCase() === 'true';
}

/**
 * პროდუქტისთვის კატეგორია Balance-ის ხის მიხედვით:
 * `Group` → ჯგუფის `uid` (შეიძლება იყოს ცარიელი root `0000...`).
 * თუ ჯგუფები ჩანესტებულია, სახელები ` / `-ით იკრიბება (root → leaf).
 */
export function resolveBalanceCategoryForItem(
  item: Record<string, unknown>,
  allItems: Record<string, unknown>[]
): string | undefined {
  const explicit = getStr(item, 'Category', 'category');
  if (explicit) return explicit;

  const itemsByUid = new Map<string, Record<string, unknown>>();
  const groupNameByUid = new Map<string, string>();
  for (const row of allItems) {
    const uid = getItemUuid(row);
    if (!uid) continue;
    itemsByUid.set(uid, row);
    if (isBalanceGroupRow(row)) {
      const n = getStr(row, 'Name', 'FullName');
      if (n) groupNameByUid.set(uid, n);
    }
  }

  let gid = getStr(item, 'Group', 'group', 'GroupRef');
  if (!gid || gid === NULL_GROUP_UID) return undefined;

  const parts: string[] = [];
  const seen = new Set<string>();
  for (let depth = 0; depth < 20; depth++) {
    if (!gid || gid === NULL_GROUP_UID) break;
    if (seen.has(gid)) break;
    seen.add(gid);
    const name = groupNameByUid.get(gid);
    if (name) parts.unshift(name);
    const parentRow = itemsByUid.get(gid);
    gid = parentRow ? getStr(parentRow, 'Group', 'group', 'GroupRef') : '';
  }
  if (parts.length === 0) return undefined;
  return parts.join(' / ');
}

export function mapBalanceItemToProduct(
  item: Record<string, unknown>,
  index: number,
  allItems: Record<string, unknown>[],
  priceByUuid?: Map<string, number>
): Partial<Product> {
  const sku =
    getStr(item, 'Code', 'SKU', 'ProductCode', 'sku', 'code', 'Article') ||
    `BAL-${index + 1}`;
  const name =
    getStr(item, 'Name', 'Description', 'ProductName', 'name', 'Title') || sku;
  const uuid = getItemUuid(item);
  const priceFromItem = getNum(item, 'Price', 'price', 'UnitPrice', 'Cost');
  const price =
    (priceByUuid && uuid ? priceByUuid.get(uuid) : undefined) ??
    (priceFromItem || 0);
  const quantity = getNum(item, 'Quantity', 'quantity', 'Qty', 'Amount');
  const totalPrice = getNum(item, 'TotalPrice', 'totalPrice', 'Sum') || price * (quantity || 0);

  return {
    name,
    sku,
    price,
    active: true,
    quantity: quantity || undefined,
    totalPrice: totalPrice || undefined,
    unitOfMeasure: getStr(item, 'UnitOfMeasure', 'Unit', 'unitOfMeasure', 'UOM') || undefined,
    productCode: getStr(item, 'Code', 'ProductCode', 'productCode') || undefined,
    barcode: getStr(item, 'Barcode', 'barcode', 'GTIN') || undefined,
    genericName: getStr(item, 'GenericName', 'genericName') || undefined,
    productNameBrand: getStr(item, 'ProductNameBrand', 'Brand', 'productNameBrand') || undefined,
    strength: getStr(item, 'Strength', 'strength') || undefined,
    dosageForm: getStr(item, 'DosageForm', 'dosageForm') || undefined,
    packSize: getStr(item, 'PackSize', 'packSize') || undefined,
    manufacturer: getStr(item, 'Manufacturer', 'manufacturer') || undefined,
    countryOfOrigin: getStr(item, 'CountryOfOrigin', 'countryOfOrigin') || undefined,
    category: resolveBalanceCategoryForItem(item, allItems) || undefined,
    packagingType: getStr(item, 'PackagingType', 'packagingType') || undefined,
    taxation: getStr(item, 'Taxation', 'taxation') || undefined,
    invoiceNumber: getStr(item, 'InvoiceNumber', 'invoiceNumber') || undefined,
    serialNumber: getStr(item, 'SerialNumber', 'serialNumber') || undefined,
    documentNumber: getStr(item, 'DocumentNumber', 'documentNumber') || undefined,
    certificateNumber: getStr(item, 'CertificateNumber', 'certificateNumber') || undefined,
    expiryDate: getDate(item, 'ExpiryDate', 'expiryDate', 'Expiry') || undefined,
    activationDate: getDate(item, 'ActivationDate', 'activationDate') || undefined,
    transportStartDate: getDate(item, 'TransportStartDate', 'transportStartDate') || undefined,
    buyer: getStr(item, 'Buyer', 'buyer') || undefined,
    seller: getStr(item, 'Seller', 'seller') || undefined,
  };
}

export type BalanceStockBreakdownLine = {
  balanceWarehouseUuid: string;
  balanceBranchUuid?: string;
  balanceWarehouseName?: string;
  quantity: number;
  reserve: number;
  seriesUuid?: string;
};

export function stockLinesHaveSeriesUuid(lines: BalanceStockBreakdownLine[]): boolean {
  return lines.some((l) => l.seriesUuid && l.seriesUuid !== NULL_GROUP_UID);
}

export type AggregatedBalanceStockForItem = {
  totalQuantity: number;
  totalReserve: number;
  lines: BalanceStockBreakdownLine[];
};

/** Exchange/Warehouses → საწყობის UUID → სახელი */
export function buildBalanceWarehouseNameByUuid(warehousesData: unknown): Map<string, string> {
  const rows = getBalanceItems(warehousesData);
  const m = new Map<string, string>();
  for (const row of rows) {
    const uid = getItemUuid(row);
    if (!uid) continue;
    const name = getStr(row, 'Name', 'FullName', 'Description') || uid;
    m.set(uid, name);
  }
  return m;
}

/** Items leaf: Code (sku) → ნომენკლატურის uid (Exchange/Stocks `Item`) */
export function buildSkuToBalanceItemUid(
  leafItems: Record<string, unknown>[]
): Map<string, string> {
  const m = new Map<string, string>();
  for (const row of leafItems) {
    const sku = getStr(row, 'Code', 'code', 'SKU', 'sku');
    const uid = getItemUuid(row);
    if (sku && uid) m.set(sku, uid);
  }
  return m;
}

/** Exchange/Stocks ხაზების აგრეგაცია `Item` UUID-ით + საწყობის სახელი */
export function aggregateExchangeStocksByItemUid(
  stockRows: Record<string, unknown>[],
  warehouseNameByUuid: Map<string, string>
): Map<string, AggregatedBalanceStockForItem> {
  const map = new Map<string, AggregatedBalanceStockForItem>();
  for (const row of stockRows) {
    const itemUid = String(row.Item ?? '').trim();
    if (!itemUid) continue;
    const w = String(row.Warehouse ?? '').trim();
    const b = String(row.Branch ?? '').trim();
    const qRaw = Number(row.Quantity ?? 0);
    const qty = Number.isFinite(qRaw) ? qRaw : 0;
    const rRaw = Number(row.Reserve ?? 0);
    const res = Number.isFinite(rRaw) ? rRaw : 0;
    const seriesRaw = String(row.Series ?? '').trim();
    const seriesUuid =
      seriesRaw && seriesRaw !== NULL_GROUP_UID ? seriesRaw : undefined;

    const cur = map.get(itemUid) ?? {
      totalQuantity: 0,
      totalReserve: 0,
      lines: [] as BalanceStockBreakdownLine[],
    };
    cur.totalQuantity += qty;
    cur.totalReserve += res;
    cur.lines.push({
      balanceWarehouseUuid: w,
      balanceBranchUuid: b && b !== NULL_GROUP_UID ? b : undefined,
      balanceWarehouseName: w ? warehouseNameByUuid.get(w) : undefined,
      quantity: qty,
      reserve: res,
      seriesUuid,
    });
    map.set(itemUid, cur);
  }
  return map;
}

export type BalanceItemSeriesLine = {
  seriesNumber?: string;
  seriesUuid?: string;
  quantity?: number;
  expiryDate?: string;
  warehouseUuid?: string;
};

/** მაგ. Balance ItemsSeries `Name`: `123 - 31.12.2023` */
function tryParseItemsSeriesDisplayName(name: string): {
  seriesNumber?: string;
  expiryDate?: string;
} {
  const t = name.trim();
  if (!t) return {};
  const idx = t.lastIndexOf('-');
  if (idx <= 0 || idx >= t.length - 1) return {};
  const left = t.slice(0, idx).trim();
  const right = t.slice(idx + 1).trim();
  if (!left) return {};

  let expiryDate: string | undefined;
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(right);
  if (iso) {
    expiryDate = `${iso[1]}-${iso[2]}-${iso[3]}`;
  } else {
    const dmy = /^(\d{1,2})[./](\d{1,2})[./](\d{2,4})$/.exec(right);
    if (dmy) {
      const dd = dmy[1].padStart(2, '0');
      const mm = dmy[2].padStart(2, '0');
      let yyyy = dmy[3];
      if (yyyy.length === 2) yyyy = `20${yyyy}`;
      expiryDate = `${yyyy}-${mm}-${dd}`;
    }
  }
  if (!expiryDate) return {};
  return { seriesNumber: left, expiryDate };
}

function balanceSeriesUuidKey(u: string | undefined | null): string | undefined {
  if (!u || typeof u !== 'string') return undefined;
  const t = u.trim().toLowerCase();
  if (!t || t === NULL_GROUP_UID) return undefined;
  return t;
}

/** ItemsSeries (Balance): `SeriesNumber`, `ValidUntil`, `Item` (სერიის ref), ზოგადი `uid` = ნომენკლატურა */
export function normalizeBalanceItemSeriesRows(data: unknown): BalanceItemSeriesLine[] {
  const rows = getBalanceItems(data);
  const out: BalanceItemSeriesLine[] = [];
  for (const row of rows) {
    let sn = getStr(
      row,
      'SeriesNumber',
      'SerialNumber',
      'SerieNumber',
      'SeriesName',
      'Number'
    );
    const nameField = getStr(row, 'Name', 'Presentation', 'Description');
    const fromName =
      nameField && nameField.includes('-')
        ? tryParseItemsSeriesDisplayName(nameField)
        : {};
    if (!sn && fromName.seriesNumber) sn = fromName.seriesNumber;
    const su = getStr(
      row,
      'SeriesRef',
      'SeriesUUID',
      'Item',
      'item',
      'Series',
      'Ref',
      'UUID'
    );
    const suClean = su && su !== NULL_GROUP_UID ? su : undefined;
    const qRaw = Number(row.Quantity ?? row.Qty ?? row.Amount);
    const qty = Number.isFinite(qRaw) ? qRaw : undefined;
    const wh = getStr(row, 'Warehouse', 'warehouse');
    const expRaw = getDate(
      row,
      'ValidUntil',
      'ExpiryDate',
      'expiryDate',
      'ValidTo',
      'ShelfLifeEnd',
      'Date',
      'Expiry'
    );
    let expiryDate = expRaw
      ? /^(\d{4}-\d{2}-\d{2})/.exec(expRaw.trim())?.[1] ?? expRaw
      : undefined;
    if (!expiryDate && fromName.expiryDate) expiryDate = fromName.expiryDate;
    out.push({
      seriesNumber: sn || undefined,
      seriesUuid: suClean,
      quantity: qty,
      expiryDate,
      warehouseUuid: wh || undefined,
    });
  }
  return out;
}

export function formatSerialSummaryForBalanceSeries(
  lines: BalanceItemSeriesLine[]
): string | undefined {
  const nums = [
    ...new Set(lines.map((l) => l.seriesNumber).filter(Boolean) as string[]),
  ];
  if (nums.length === 0) return undefined;
  if (nums.length <= 3) return nums.join(', ');
  return `${nums.slice(0, 3).join(', ')} +${nums.length - 3}`;
}

/**
 * ItemsSeries (სერიის №, ვადა) + Exchange/Stocks ხაზები (`seriesUuid` = ItemsSeries `Item`).
 * თუ API ცარიელია, მაინც ივსება საწყობის ხაზებიდან (მინიმუმ uuid + რაოდენობა + საწყობო).
 * ერთი ItemsSeries ჩანაწერი + ერთი სერია საწყობში → №/ვადა ივსება ზუსტი `Item` თუ არ ემთხვევა.
 */
export function mergeBalanceItemSeriesFromStocks(
  itemsSeriesLines: BalanceItemSeriesLine[],
  stockLines: BalanceStockBreakdownLine[]
): BalanceItemSeriesLine[] {
  const withSeries = stockLines.filter(
    (l) => l.seriesUuid && l.seriesUuid !== NULL_GROUP_UID
  );
  const metaBySeriesRef = new Map<string, BalanceItemSeriesLine>();
  for (const line of itemsSeriesLines) {
    const key = balanceSeriesUuidKey(line.seriesUuid);
    if (key) metaBySeriesRef.set(key, line);
  }

  const distinctStockSeries = new Set(
    withSeries.map((s) => balanceSeriesUuidKey(s.seriesUuid)).filter(Boolean)
  );
  const singleCatalogRowApplies =
    itemsSeriesLines.length === 1 && distinctStockSeries.size === 1;
  const singleMeta = singleCatalogRowApplies ? itemsSeriesLines[0] : undefined;

  if (withSeries.length > 0) {
    return withSeries.map((sl) => {
      const su = sl.seriesUuid as string;
      const k = balanceSeriesUuidKey(su);
      const meta =
        singleMeta ?? (k ? metaBySeriesRef.get(k) : undefined);
      return {
        seriesNumber: meta?.seriesNumber,
        expiryDate: meta?.expiryDate,
        seriesUuid: su,
        quantity: sl.quantity,
        warehouseUuid: sl.balanceWarehouseUuid,
      };
    });
  }

  if (itemsSeriesLines.length > 0) return itemsSeriesLines;
  return [];
}
