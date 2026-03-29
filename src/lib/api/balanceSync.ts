import type { Product } from '@/types';

/** Balance პასუხიდან Items მასივის ამოღება (Items, value, Value, Source ან root მასივი) */
export function getBalanceItems(data: unknown): Record<string, unknown>[] {
  if (Array.isArray(data)) return data as Record<string, unknown>[];
  if (data && typeof data === 'object') {
    const o = data as Record<string, unknown>;
    if (Array.isArray(o.Items)) return o.Items as Record<string, unknown>[];
    if (Array.isArray(o.value)) return o.value as Record<string, unknown>[];
    if (Array.isArray(o.Value)) return o.Value as Record<string, unknown>[];
    /** Exchange/Prices დოკუმენტაცია: პასუხი ხშირად `{ Source: [ { PriceType, Item, Currency, Price } ] }` */
    if (Array.isArray(o.Source)) return o.Source as Record<string, unknown>[];
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
