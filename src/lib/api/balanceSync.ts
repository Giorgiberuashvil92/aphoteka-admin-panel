import type { BalanceItemsSeriesApiRow, Product } from '@/types';

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
    /** ერთი ItemsSeries ჩანაწერი ობიექტად (არა მასივი) */
    const u = getStr(o, 'uid', 'UID', 'UUID', 'Uuid');
    if (
      u &&
      (o.Item != null ||
        o.SeriesNumber != null ||
        o.ValidUntil != null ||
        (typeof o.Name === 'string' && o.Name.length > 0))
    ) {
      return [o];
    }
  }
  return [];
}

/** ItemsSeries `ValidUntil` — სტრინგი უცვლელად; `Date` → ლოკალური `YYYY-MM-DDTHH:mm:ss` (არა `toISOString()` UTC). */
function itemsSeriesValidUntilAsBalanceString(
  row: Record<string, unknown>
): string {
  for (const k of [
    'ValidUntil',
    'ValidTo',
    'validUntil',
    'ShelfLifeEnd',
  ] as const) {
    const v = row[k];
    if (v === null || v === undefined || v === '') continue;
    if (typeof v === 'string') return v;
    if (v instanceof Date) {
      const d = v;
      const p = (n: number) => String(n).padStart(2, '0');
      return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
    }
    return String(v);
  }
  return '';
}

/**
 * ItemsSeries ნელი პასუხი → ერთიანი მასივი იმავე ველებით, რაც Balance JSON-შია (ყველა string).
 * `ValidUntil` — იგივე ტექსტი რაც JSON-შია (მაგ. `2023-12-31T00:00:00`).
 */
export function normalizeBalanceItemsSeriesApiRows(
  data: unknown
): BalanceItemsSeriesApiRow[] {
  const rows = getBalanceItems(data);
  return rows.map((row) => ({
    uid: getStr(row, 'uid', 'UID', 'UUID', 'Uuid'),
    Item: getStr(row, 'Item', 'item'),
    Name: getStr(row, 'Name', 'name', 'Presentation', 'Description'),
    ValidUntil: itemsSeriesValidUntilAsBalanceString(row),
    SeriesNumber: getStr(
      row,
      'SeriesNumber',
      'SerialNumber',
      'SerieNumber',
      'SeriesName',
      'Number'
    ),
    ExtCode: getStr(row, 'ExtCode', 'extCode'),
    AdditionalRequisites1: getStr(
      row,
      'AdditionalRequisites1',
      'additionalRequisites1',
      'AdditionalRequisite1'
    ),
  }));
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

/**
 * ნომენკლატურის (Items) ხაზიდან `VATRate` — როგორც Balance აბრუნებს (არ ვაფორმატებთ % / ტექსტს).
 */
export function vatRateRawFromBalanceItemRow(
  row: Record<string, unknown>
): string | undefined {
  for (const k of ['VATRate', 'vatRate', 'VatRate'] as const) {
    const v = row[k];
    if (v === null || v === undefined || v === '') continue;
    const s = String(v).trim();
    if (s) return s;
  }
  return undefined;
}

/**
 * Balance Prices / ItemPricing / Items ხაზიდან დაბეგვრის ტექსტი (`VATRate` და ტოლფასი ველები).
 */
export function taxationDisplayFromBalanceRow(
  row: Record<string, unknown>
): string | undefined {
  const str = getStr(
    row,
    'VATRate',
    'vatRate',
    'VatRate',
    'TaxRate',
    'taxRate',
    'Taxation',
    'taxation',
    'VAT',
    'vat',
    'დაბეგვრა'
  );
  if (str) return str;
  for (const k of [
    'VATRate',
    'vatRate',
    'VatRate',
    'TaxRate',
    'Percent',
    'percent',
  ] as const) {
    const v = row[k];
    if (v === null || v === undefined || v === '') continue;
    const n = Number(v);
    if (Number.isNaN(n) || n === 0) continue;
    if (n > 0 && n <= 1) return `${Math.round(n * 100)}%`;
    return `${n}%`;
  }
  return undefined;
}

/** ნომენკლატურის `uid` → დაბეგვრა (უკანასკნელი არაცარიელი ხაზი იგებს, როგორც `buildPriceByUuid`) */
export function buildTaxationByUuid(rows: Record<string, unknown>[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const row of rows) {
    const uuid = getItemUuid(row);
    if (!uuid) continue;
    const t = taxationDisplayFromBalanceRow(row);
    if (t) map.set(uuid, t);
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
  priceByUuid?: Map<string, number>,
  taxationByUuid?: Map<string, string>
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
    taxation:
      vatRateRawFromBalanceItemRow(item) ??
      (taxationByUuid && uuid ? taxationByUuid.get(uuid) : undefined) ??
      taxationDisplayFromBalanceRow(item) ??
      (getStr(item, 'Taxation', 'taxation') || undefined),
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

const BALANCE_STOCK_SERIES_GUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Exchange/Stocks ხაზის სერიის ref (`Series` ველი) — ItemsSeries პასუხის ჩანაწერის `uid`-ს უნდა ემთხვეოდეს.
 * ItemsSeries GET query `Item` = ნომენკლატურის ref, არა Stocks `Series` UUID.
 */
export function exchangeStockRowSeriesUid(
  row: Record<string, unknown>
): string | undefined {
  const raw = String(
    row.Series ?? row.series ?? row.SeriesUUID ?? row.SeriesRef ?? ""
  ).trim();
  if (!raw || raw === NULL_GROUP_UID) return undefined;
  if (!BALANCE_STOCK_SERIES_GUID_RE.test(raw)) return undefined;
  return raw;
}

/** Exchange/Stocks `Item` — ნომენკლატურა; ItemsSeries იძახება სწორედ ამით (`?Item=<Item_GUID>`) */
export function exchangeStockRowNomenclatureItemUid(
  row: Record<string, unknown>
): string | undefined {
  const raw = String(row.Item ?? row.item ?? "").trim();
  if (!raw || raw === NULL_GROUP_UID) return undefined;
  if (!BALANCE_STOCK_SERIES_GUID_RE.test(raw)) return undefined;
  return raw;
}

/** უნიკალური სერიის uid-ები (პირველი გამოჩენის რეგისტრი) — max შეზღუდვა ოფციონალური */
export function uniqueExchangeStockSeriesUids(
  rows: Record<string, unknown>[],
  max?: number
): string[] {
  const canon = new Map<string, string>();
  for (const row of rows) {
    const u = exchangeStockRowSeriesUid(row);
    if (!u) continue;
    const k = u.toLowerCase();
    if (!canon.has(k)) canon.set(k, u);
  }
  const all = [...canon.values()];
  if (max != null && max > 0 && all.length > max) return all.slice(0, max);
  return all;
}

/** უნიკალური ნომენკლატურის Item — ItemsSeries ჩატვირთვისთვის */
export function uniqueExchangeStockNomenclatureItemUids(
  rows: Record<string, unknown>[],
  max?: number
): string[] {
  const canon = new Map<string, string>();
  for (const row of rows) {
    const u = exchangeStockRowNomenclatureItemUid(row);
    if (!u) continue;
    const k = u.toLowerCase();
    if (!canon.has(k)) canon.set(k, u);
  }
  const all = [...canon.values()];
  if (max != null && max > 0 && all.length > max) return all.slice(0, max);
  return all;
}

/**
 * Exchange/Stocks `Item` (ან სხვა იგივე ref) → Balance **Exchange/Items** ფიდის leaf ხაზის `uid`
 * (Balance-ის კატალოგიდან დაბრუნებული პროდუქტის UUID — ItemsSeries query `Item` სწორედ ეს უნდა იყოს).
 */
export function nomenclatureUidForItemsSeriesFromBalanceItems(
  exchangeOrRawItemUid: string,
  balanceItemsRows: Record<string, unknown>[]
): string {
  const raw = exchangeOrRawItemUid.trim();
  if (!raw) return raw;
  const t = raw.toLowerCase();
  for (const row of balanceItemsRows) {
    if (isBalanceGroupRow(row)) continue;
    const u = getItemUuid(row);
    if (u && u.toLowerCase() === t) return u.trim();
  }
  return raw;
}

/**
 * თითო ნომენკლატურის `Item` → პირველი არაცარიელი `Series` იმავე Exchange/Stocks ფიდიდან
 * (საჭიროებისამებრ `seriesUuid` მხოლოდ მაშინ, როცა `uid` არაა — პასუხის `balanceQueryUid` = ნომენკლატურის `uid`).
 */
export function mapFirstStockSeriesUidByNomenclatureItem(
  rows: Record<string, unknown>[]
): Map<string, string> {
  const m = new Map<string, string>();
  for (const row of rows) {
    const iu = exchangeStockRowNomenclatureItemUid(row);
    if (!iu) continue;
    const k = iu.toLowerCase();
    if (m.has(k)) continue;
    const s = exchangeStockRowSeriesUid(row);
    if (s) m.set(k, s);
  }
  return m;
}

export type BalanceItemSeriesLine = {
  seriesNumber?: string;
  /** დასაკავშირებლად Stocks `Series`-თან — ჩვეულებრივ ItemsSeries ჩანაწერის `uid` */
  seriesRowUid?: string;
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

export function balanceSeriesUuidKey(
  u: string | undefined | null
): string | undefined {
  if (!u || typeof u !== "string") return undefined;
  const t = u.trim().toLowerCase();
  if (!t || t === NULL_GROUP_UID) return undefined;
  return t;
}

/**
 * ItemsSeries ჩანაწერი: `uid` — სერიის კატალოგის ref (ხშირად Exchange/Stocks `Series`-თან ერთი);
 * `Item` — ნომენკლატურა. GET ItemsSeries იძახება `Item`-ით.
 */
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
    const catalogSeriesUidRaw = getStr(row, 'uid', 'UID', 'UUID', 'Uuid');
    const seriesRowUid =
      catalogSeriesUidRaw && catalogSeriesUidRaw !== NULL_GROUP_UID
        ? catalogSeriesUidRaw
        : undefined;
    const suFallback = getStr(
      row,
      'SeriesRef',
      'SeriesUUID',
      'Series',
      'Ref',
      'UUID',
      'Item',
      'item'
    );
    const suClean =
      (seriesRowUid ||
        (suFallback && suFallback !== NULL_GROUP_UID ? suFallback : undefined)) ??
      undefined;
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
      seriesRowUid,
      quantity: qty,
      expiryDate,
      warehouseUuid: wh || undefined,
    });
  }
  return out;
}

/**
 * სრული ItemsSeries პასუხი (მასივი) → ნომენკლატურის `Item` GUID-ით დაჯგუფებული ხაზები.
 * Map key = `Item`.toLowerCase() — sync-ში lookup `itemUid.trim().toLowerCase()`-ით.
 */
export function groupItemsSeriesByNomenclatureItemUid(
  data: unknown
): Map<string, BalanceItemSeriesLine[]> {
  const rows = getBalanceItems(data);
  const map = new Map<string, BalanceItemSeriesLine[]>();
  for (const row of rows) {
    const itemUid = getStr(row, 'Item', 'item').trim();
    if (!itemUid) continue;
    const lines = normalizeBalanceItemSeriesRows([row]);
    const line = lines[0];
    if (!line) continue;
    const k = itemUid.toLowerCase();
    const bucket = map.get(k) ?? [];
    bucket.push(line);
    map.set(k, bucket);
  }
  return map;
}

/** Stocks `Series` → ItemsSeries ხაზებიდან შესაბამისი (თუ ცარიელია stockSeries — ყველა ხაზი) */
export function pickItemsSeriesLinesForExchangeStockRow(
  allLines: BalanceItemSeriesLine[],
  stockSeriesUid: string | undefined
): BalanceItemSeriesLine[] {
  if (!stockSeriesUid?.trim()) return allLines;
  const ks = balanceSeriesUuidKey(stockSeriesUid);
  if (!ks) return allLines;
  const matched = allLines.filter((l) => {
    return (
      balanceSeriesUuidKey(l.seriesRowUid) === ks ||
      balanceSeriesUuidKey(l.seriesUuid) === ks
    );
  });
  return matched.length > 0 ? matched : [];
}

/** ადმინის ცხრილის ერთი უჯრისთვის — № + ვადა */
export function summarizeItemsSeriesLinesForTable(
  lines: BalanceItemSeriesLine[]
): string {
  if (lines.length === 0) return "—";
  const parts = lines
    .map((l) => {
      const n = l.seriesNumber?.trim();
      const d = l.expiryDate?.trim();
      if (n && d) return `${n} · ${d}`;
      return n || d || "";
    })
    .filter(Boolean);
  return parts.length > 0 ? parts.join("; ") : "—";
}

/** ცალკე სვეტი: Balance ItemsSeries `SeriesNumber` */
export function itemsSeriesNumbersForTable(lines: BalanceItemSeriesLine[]): string {
  if (lines.length === 0) return "—";
  const parts = [
    ...new Set(lines.map((l) => l.seriesNumber?.trim()).filter(Boolean) as string[]),
  ];
  return parts.length > 0 ? parts.join("; ") : "—";
}

/** ცალკე სვეტი: Balance ItemsSeries `ValidUntil` → `expiryDate` */
export function itemsSeriesValidUntilForTable(lines: BalanceItemSeriesLine[]): string {
  if (lines.length === 0) return "—";
  const parts = [
    ...new Set(lines.map((l) => l.expiryDate?.trim()).filter(Boolean) as string[]),
  ];
  return parts.length > 0 ? parts.join("; ") : "—";
}

/** საჩვენებლად, როცა სერიული № არაა — Balance `Series` ref (ItemsSeries `uid`) */
function shortSeriesRefForDisplay(uuid: string): string {
  const t = uuid.trim();
  if (t.length <= 13) return t;
  return `${t.slice(0, 8)}…${t.slice(-4)}`;
}

/**
 * სერიის სვეტის ტექსტი: ჯერ `SeriesNumber`, თუ არა — მოკლე `Series` UUID (როცა ItemsSeries ცარიელია).
 */
export function formatSerialSummaryForBalanceSeries(
  lines: BalanceItemSeriesLine[]
): string | undefined {
  const labels = lines
    .map((l) => {
      const n = l.seriesNumber?.trim();
      if (n) return n;
      const u = l.seriesUuid?.trim();
      if (u && u !== NULL_GROUP_UID) return shortSeriesRefForDisplay(u);
      return '';
    })
    .filter(Boolean);
  const parts = [...new Set(labels)];
  if (parts.length === 0) return undefined;
  if (parts.length <= 3) return parts.join(', ');
  return `${parts.slice(0, 3).join(', ')} +${parts.length - 3}`;
}

/** სინქი/PATCH: უადრესი ვადა ISO-ით */
export function earliestExpiryIsoFromSeriesLines(
  lines: BalanceItemSeriesLine[]
): string | undefined {
  const dates = lines.map((l) => l.expiryDate?.trim()).filter(Boolean) as string[];
  if (dates.length === 0) return undefined;
  let best: string | undefined;
  let bestT = Infinity;
  for (const iso of dates) {
    const t = new Date(iso).getTime();
    if (!Number.isNaN(t) && t < bestT) {
      bestT = t;
      best = iso;
    }
  }
  return best ?? dates[0];
}

function syntheticSeriesLinesFromBreakdown(
  breakdown?: Array<{ seriesUuid?: string }>
): BalanceItemSeriesLine[] {
  if (!breakdown?.length) return [];
  const uuids = [
    ...new Set(
      breakdown
        .map((l) => l.seriesUuid?.trim())
        .filter((u): u is string => Boolean(u && u !== NULL_GROUP_UID))
    ),
  ];
  return uuids.map((seriesUuid) => ({ seriesUuid }));
}

/**
 * ცხრილი: სერიის ნომერი — DB `serialNumber` ან Balance `Series` ref (Stocks ხაზიდან / merge).
 */
export function productBalanceSerialDisplay(product: {
  serialNumber?: string | null;
  balanceItemSeries?: BalanceItemSeriesLine[];
  balanceStockBreakdown?: Array<{ seriesUuid?: string }>;
}): string {
  const direct = product.serialNumber?.trim();
  if (direct) return direct;
  const lines =
    product.balanceItemSeries && product.balanceItemSeries.length > 0
      ? product.balanceItemSeries
      : syntheticSeriesLinesFromBreakdown(product.balanceStockBreakdown);
  return formatSerialSummaryForBalanceSeries(lines)?.trim() ?? '';
}

/**
 * ცხრილი: ვადა — DB `expiryDate` ან ItemsSeries-იდან გაერთიანებული თარიღები.
 */
export function productBalanceExpiryDisplay(product: {
  expiryDate?: Date | string | null;
  balanceItemSeries?: BalanceItemSeriesLine[];
}): string {
  if (product.expiryDate != null && String(product.expiryDate).trim() !== '') {
    const d =
      product.expiryDate instanceof Date
        ? product.expiryDate
        : new Date(String(product.expiryDate));
    if (!Number.isNaN(d.getTime())) return d.toLocaleDateString('ka-GE');
  }
  const lines = product.balanceItemSeries ?? [];
  const dates = [
    ...new Set(lines.map((l) => l.expiryDate?.trim()).filter(Boolean) as string[]),
  ];
  if (dates.length === 0) return '';
  const formatted = dates.map((iso) => {
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString('ka-GE');
  });
  if (formatted.length <= 2) return formatted.join('; ');
  return `${formatted.slice(0, 2).join('; ')} +${formatted.length - 2}`;
}

/**
 * ItemsSeries (სერიის №, ვადა) + Exchange/Stocks ხაზები.
 * `stockLines[].seriesUuid` = Stocks ხაზის `Series` (ემთხვევა ItemsSeries პასუხის ჩანაწერის `uid`-ს), არა ნომენკლატურის `Item`.
 * თუ API ცარიელია, მაინც ივსება საწყობის ხაზებიდან (მინიმუმ uuid + რაოდენობა + საწყობო).
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
    const kRow = balanceSeriesUuidKey(line.seriesRowUid);
    const kSu = balanceSeriesUuidKey(line.seriesUuid);
    if (kRow) metaBySeriesRef.set(kRow, line);
    if (kSu && kSu !== kRow) metaBySeriesRef.set(kSu, line);
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
