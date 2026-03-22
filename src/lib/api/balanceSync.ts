import type { Product } from '@/types';

/** Balance პასუხიდან Items მასივის ამოღება (Items, value, Value ან root მასივი) */
export function getBalanceItems(data: unknown): Record<string, unknown>[] {
  if (Array.isArray(data)) return data as Record<string, unknown>[];
  if (data && typeof data === 'object') {
    const o = data as Record<string, unknown>;
    if (Array.isArray(o.Items)) return o.Items as Record<string, unknown>[];
    if (Array.isArray(o.value)) return o.value as Record<string, unknown>[];
    if (Array.isArray(o.Value)) return o.Value as Record<string, unknown>[];
  }
  return [];
}

export function getBalancePricesRows(data: unknown): Record<string, unknown>[] {
  return getBalanceItems(data);
}

export function getItemUuid(item: Record<string, unknown>): string | undefined {
  const v = getStr(item, 'Ref', 'UUID', 'Id', 'uuid', 'ref', 'ItemRef', 'NomenclatureRef', 'ProductRef');
  return v || undefined;
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

export function mapBalanceItemToProduct(
  item: Record<string, unknown>,
  index: number,
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
    category: getStr(item, 'Category', 'category') || undefined,
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
