"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import {
  getBalanceExchangeStocks,
  getBalanceDiscounts,
  getBalancePrices,
  getBalanceStocks,
  rowsFromBalanceExchangeStocks,
  rowsFromBalanceDiscounts,
  rowsFromBalancePrices,
  rowsFromBalanceStocks,
} from "@/lib/api/balanceStocks";
import { productsApi } from "@/lib/api/products";
import {
  aggregateExchangeStocksByItemUid,
  buildPriceByUuid,
  getItemUuid,
  groupItemsSeriesByNomenclatureItemUid,
  itemsSeriesValidUntilForTable,
} from "@/lib/api/balanceSync";
import type { Product } from "@/types";

const COLUMNS = [
  "ItemName",
  "Name",
  "Code",
  "IsActive",
  "StartDate",
  "EndDate",
  "DiscountType",
  "Percentage",
  "DiscountCondition",
  "Amount",
  "Currency",
  "Schedule",
  "Comments",
] as const;

type ColumnKey = (typeof COLUMNS)[number];
type BalanceDiscountRow = Record<string, unknown>;
type CatalogItem = {
  name: string;
  code: string;
  unitOfMeasure: string;
  quantity: string;
  unitPrice: string;
  totalPrice: string;
  expiryDate: string;
  sku: string;
  isGroup: boolean;
};
type ResolvedDiscountItem = CatalogItem & {
  uid: string;
  type: "group" | "product";
};
type CatalogMeta = {
  byUid: Map<string, CatalogItem>;
  leafUidsByGroupUid: Map<string, string[]>;
};

const EMPTY_CATALOG_META: CatalogMeta = {
  byUid: new Map(),
  leafUidsByGroupUid: new Map(),
};
const NULL_GROUP_UID = "00000000-0000-0000-0000-000000000000";

function stringField(row: Record<string, unknown>, ...keys: string[]): string {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
  }
  return "";
}

function numberField(row: Record<string, unknown>, ...keys: string[]): number | undefined {
  for (const key of keys) {
    const value = row[key];
    if (value === null || value === undefined || value === "") continue;
    const numberValue = Number(value);
    if (Number.isFinite(numberValue)) return numberValue;
  }
  return undefined;
}

function moneyValue(value: number | undefined): string {
  return value === undefined ? "" : `₾${value.toFixed(2)}`;
}

function parseMoneyValue(value: string): number | undefined {
  const parsed = Number(value.replace(/[^\d.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : undefined;
}

function discountedPrice(
  unitPrice: number | undefined,
  quantity: number | undefined,
  row: BalanceDiscountRow,
): { unitPrice: string; totalPrice: string } {
  if (unitPrice === undefined) {
    return { unitPrice: "", totalPrice: "" };
  }

  const percentage = numberField(row, "Percentage", "percentage");
  const amount = numberField(row, "Amount", "amount");
  let discountedUnit = unitPrice;

  if (percentage !== undefined && percentage > 0) {
    discountedUnit = Math.max(0, Math.round(unitPrice * (1 - percentage / 100) * 100) / 100);
  } else if (amount !== undefined && amount > 0) {
    discountedUnit = Math.max(0, Math.round((unitPrice - amount) * 100) / 100);
  }

  return {
    unitPrice: moneyValue(discountedUnit),
    totalPrice:
      quantity === undefined ? "" : moneyValue(Math.round(discountedUnit * quantity * 100) / 100),
  };
}

function isGroupRow(row: BalanceDiscountRow): boolean {
  return String(row.IsGroup ?? row.isGroup ?? "").toLowerCase() === "true";
}

function buildLocalSkuByBalanceUid(products: Product[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const product of products) {
    const uid = product.balanceNomenclatureItemUid?.trim().toLowerCase();
    const sku = product.internalSku?.trim();
    if (uid && sku) map.set(uid, sku);
  }
  return map;
}

function buildCatalogMeta(
  rows: BalanceDiscountRow[],
  priceByUid: Map<string, number>,
  localSkuByUid: Map<string, string>,
  quantityByUid: Map<string, number>,
  expiryByUid: Map<string, string>,
): CatalogMeta {
  const byUid = new Map<string, CatalogItem>();
  const byRawUid = new Map<string, BalanceDiscountRow>();
  const leafUidsByGroupUid = new Map<string, string[]>();

  for (const row of rows) {
    const rawUid = getItemUuid(row)?.trim();
    if (!rawUid) continue;
    const uid = rawUid.toLowerCase();
    const quantity =
      quantityByUid.get(uid) ??
      numberField(row, "Quantity", "quantity", "Qty", "Amount");
    const unitPrice =
      priceByUid.get(uid) ??
      numberField(row, "Price", "price", "UnitPrice", "Cost");
    const totalPrice =
      numberField(row, "TotalPrice", "totalPrice", "Sum") ??
      (quantity !== undefined && unitPrice !== undefined ? quantity * unitPrice : undefined);
    byRawUid.set(uid, row);
    byUid.set(uid, {
      name: stringField(row, "Name", "FullName", "ProductName", "Description"),
      code: stringField(row, "Code", "SKU", "ProductCode", "Article", "code"),
      unitOfMeasure: stringField(row, "UnitOfMeasure", "Unit", "unitOfMeasure", "UOM"),
      quantity: quantity === undefined ? "" : String(quantity),
      unitPrice: moneyValue(unitPrice),
      totalPrice: moneyValue(totalPrice),
      expiryDate:
        expiryByUid.get(uid) ||
        stringField(row, "ValidUntil", "ExpiryDate", "expiryDate", "Expiry"),
      sku: localSkuByUid.get(uid) || "",
      isGroup: isGroupRow(row),
    });
  }

  for (const row of rows) {
    if (isGroupRow(row)) continue;
    const leafUid = getItemUuid(row)?.trim();
    if (!leafUid) continue;
    let groupUid = stringField(row, "Group", "group", "GroupRef");
    const seen = new Set<string>();

    for (let depth = 0; depth < 50; depth += 1) {
      if (!groupUid || groupUid === NULL_GROUP_UID) break;
      const key = groupUid.toLowerCase();
      if (seen.has(key)) break;
      seen.add(key);
      const list = leafUidsByGroupUid.get(key) ?? [];
      list.push(leafUid);
      leafUidsByGroupUid.set(key, list);
      const groupRow = byRawUid.get(key);
      groupUid = groupRow ? stringField(groupRow, "Group", "group", "GroupRef") : "";
    }
  }

  return { byUid, leafUidsByGroupUid };
}

async function fetchItemsSeriesBare(): Promise<unknown> {
  const response = await fetch("/api/balance/items-series-bare", {
    cache: "no-store",
  });
  if (!response.ok) return null;
  const json = (await response.json()) as { ok?: boolean; data?: unknown };
  return json.ok ? json.data : null;
}

function discountItemUids(row: BalanceDiscountRow): string[] {
  const rawItems = row.Items;
  if (!Array.isArray(rawItems)) return [];
  return rawItems
    .map((item) => {
      if (typeof item === "string") return item.trim();
      if (!item || typeof item !== "object") return "";
      return stringField(item as Record<string, unknown>, "Item", "item", "uid", "UID");
    })
    .filter(Boolean);
}

function itemLabel(uid: string, catalog: CatalogMeta): string {
  const item = catalog.byUid.get(uid.toLowerCase());
  if (!item) return uid;
  return [item.code, item.name].filter(Boolean).join(" - ") || uid;
}

function resolvedDiscountItems(
  row: BalanceDiscountRow,
  catalog: CatalogMeta,
): ResolvedDiscountItem[] {
  const out: ResolvedDiscountItem[] = [];
  const seen = new Set<string>();
  for (const uid of discountItemUids(row)) {
    const key = uid.toLowerCase();
    const directItem = catalog.byUid.get(key);
    if (directItem?.isGroup && !seen.has(`group:${key}`)) {
      seen.add(`group:${key}`);
      out.push({ ...directItem, uid, type: "group" });
    }

    const leafUids = catalog.leafUidsByGroupUid.get(key);
    const nextUids = leafUids?.length ? leafUids : [uid];
    for (const nextUid of nextUids) {
      const nextKey = nextUid.toLowerCase();
      if (seen.has(`product:${nextKey}`)) continue;
      seen.add(`product:${nextKey}`);
      const item = catalog.byUid.get(nextKey);
      const quantity = numberField(item ?? {}, "quantity");
      const unitPrice = parseMoneyValue(item?.unitPrice || "");
      const priced = discountedPrice(unitPrice, quantity, row);
      out.push({
        uid: nextUid,
        type: "product",
        isGroup: false,
        unitOfMeasure: item?.unitOfMeasure || "",
        quantity: item?.quantity || "",
        unitPrice: priced.unitPrice || item?.unitPrice || "",
        totalPrice: priced.totalPrice || item?.totalPrice || "",
        expiryDate: item?.expiryDate || "",
        sku: item?.sku || "",
        code: item?.code || "",
        name: item?.name || nextUid,
      });
    }
  }
  return out;
}

function resolvedItemName(row: BalanceDiscountRow, catalog: CatalogMeta): string {
  const names = discountItemUids(row)
    .map((uid) => catalog.byUid.get(uid.toLowerCase())?.name)
    .filter(Boolean);
  return names.length > 0 ? names.join(", ") : displayValue(row.ItemName);
}

function displayValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  return String(value);
}

function rowSearchText(row: BalanceDiscountRow): string {
  return COLUMNS.map((column) => displayValue(row[column])).join(" ").toLowerCase();
}

export default function SalesCatalogPage() {
  const [rows, setRows] = useState<BalanceDiscountRow[]>([]);
  const [catalogMeta, setCatalogMeta] = useState<CatalogMeta>(EMPTY_CATALOG_META);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loadedAt, setLoadedAt] = useState<Date | null>(null);

  const loadDiscounts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [
        discountsData,
        catalogData,
        pricesData,
        exchangeStocksData,
        itemsSeriesData,
        productsResponse,
      ] = await Promise.all([
        getBalanceDiscounts(),
        getBalanceStocks(),
        getBalancePrices(),
        getBalanceExchangeStocks({ docTemplate: true }).catch(() =>
          getBalanceExchangeStocks({ Total: false }),
        ),
        fetchItemsSeriesBare().catch(() => null),
        productsApi.getAll({ limit: 10000 }).catch(() => ({ data: [] })),
      ]);
      const catalogRows = rowsFromBalanceStocks(catalogData);
      const pricesRows = rowsFromBalancePrices(pricesData);
      const stockByUid = aggregateExchangeStocksByItemUid(
        rowsFromBalanceExchangeStocks(exchangeStocksData),
        new Map(),
      );
      const quantityByUid = new Map<string, number>();
      for (const [uid, stock] of stockByUid) {
        quantityByUid.set(uid.toLowerCase(), stock.totalQuantity);
      }
      const seriesByUid = groupItemsSeriesByNomenclatureItemUid(itemsSeriesData);
      const expiryByUid = new Map<string, string>();
      for (const [uid, lines] of seriesByUid) {
        const expiry = itemsSeriesValidUntilForTable(lines);
        if (expiry && expiry !== "—") expiryByUid.set(uid.toLowerCase(), expiry);
      }
      const products = Array.isArray(productsResponse.data) ? productsResponse.data : [];
      setCatalogMeta(
        buildCatalogMeta(
          catalogRows,
          buildPriceByUuid(pricesRows),
          buildLocalSkuByBalanceUid(products),
          quantityByUid,
          expiryByUid,
        ),
      );
      setRows(rowsFromBalanceDiscounts(discountsData));
      setLoadedAt(new Date());
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "ფასდაკლებების კატალოგის ჩატვირთვა ვერ მოხერხდა",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDiscounts();
  }, [loadDiscounts]);

  const filteredRows = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();
    if (!search) return rows;
    return rows.filter((row) => {
      const resolvedText = [
        rowSearchText(row),
        resolvedItemName(row, catalogMeta),
        resolvedDiscountItems(row, catalogMeta)
          .map((item) => `${item.code} ${item.name} ${item.uid}`)
          .join(" "),
      ]
        .join(" ")
        .toLowerCase();
      return resolvedText.includes(search);
    });
  }, [catalogMeta, rows, searchTerm]);

  const cellClass = (column: ColumnKey) => {
    if (column === "Schedule" || column === "Comments") {
      return "max-w-[260px] truncate px-3 py-3 text-xs text-gray-600 dark:text-gray-300";
    }
    if (column === "Code") {
      return "max-w-[140px] truncate px-3 py-3 font-mono text-xs text-gray-700 dark:text-gray-300";
    }
    if (column === "Percentage" || column === "Amount") {
      return "whitespace-nowrap px-3 py-3 text-right text-sm tabular-nums text-gray-700 dark:text-gray-300";
    }
    return "max-w-[180px] truncate px-3 py-3 text-sm text-gray-700 dark:text-gray-300";
  };

  const renderItemsPanel = (row: BalanceDiscountRow) => {
    const items = resolvedDiscountItems(row, catalogMeta);
    const groups = items.filter((item) => item.type === "group");
    const products = items.filter((item) => item.type === "product");

    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900/40">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              ფასდაკლება ვრცელდება
            </p>
            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
              {groups.length > 0
                ? `${groups.length} ჯგუფი · ${products.length} აითემი`
                : `${products.length} აითემი`}
            </p>
          </div>
          {groups.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {groups.map((group) => (
                <span
                  key={group.uid}
                  className="rounded-full border border-brand-200 bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700 dark:border-brand-800 dark:bg-brand-950/30 dark:text-brand-300"
                  title={group.uid}
                >
                  {group.code ? `${group.code} · ` : ""}
                  {group.name}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        {products.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            პროდუქტები ვერ მოიძებნა კატალოგში.
          </p>
        ) : (
          <div className="max-h-80 overflow-auto rounded-md border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-white text-xs uppercase text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                <tr>
                  <th className="px-3 py-2 font-medium">საქონლის კოდი</th>
                  <th className="px-3 py-2 font-medium">დასახელება (მყიდველისგან)</th>
                  <th className="px-3 py-2 font-medium">ზომის ერთეული</th>
                  <th className="px-3 py-2 text-right font-medium">რაოდენობა</th>
                  <th className="px-3 py-2 text-right font-medium">ერთეულის ფასი</th>
                  <th className="px-3 py-2 text-right font-medium">საქონლის ფასი</th>
                  <th className="px-3 py-2 font-medium">ვარგისია -მდე</th>
                  <th className="px-3 py-2 font-medium">SKU</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {products.map((item) => (
                  <tr key={item.uid} className="text-gray-700 dark:text-gray-200">
                    <td className="max-w-[120px] truncate px-3 py-2 font-mono text-xs" title={item.code || undefined}>
                      {item.code || "—"}
                    </td>
                    <td className="min-w-[260px] px-3 py-2" title={item.name}>
                      {item.name}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2">
                      {item.unitOfMeasure || "—"}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums">
                      {item.quantity || "—"}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums">
                      {item.unitPrice || "—"}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums">
                      {item.totalPrice || "—"}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2">
                      {item.expiryDate || "—"}
                    </td>
                    <td className="max-w-[120px] truncate px-3 py-2 font-mono text-xs" title={item.sku || item.uid}>
                      {item.sku || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <PageBreadCrumb pageTitle="კატალოგი გაყიდვებისთვის" />

      <div className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
            Discounts
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Balance Exchange/Discounts + catalog · {rows.length} ჩანაწერი
            {loadedAt ? ` · ${loadedAt.toLocaleString("ka-GE")}` : ""}
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ძიება discounts-ში..."
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-900 dark:text-white sm:w-72"
          />
          <button
            type="button"
            onClick={() => void loadDiscounts()}
            disabled={loading}
            className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "იტვირთება..." : "განახლება"}
          </button>
        </div>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                {COLUMNS.map((column) => (
                  <th
                    key={column}
                    className="whitespace-nowrap px-3 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300"
                  >
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td
                    colSpan={COLUMNS.length}
                    className="px-6 py-8 text-center text-sm text-gray-500"
                  >
                    იტვირთება...
                  </td>
                </tr>
              ) : filteredRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={COLUMNS.length}
                    className="px-6 py-8 text-center text-sm text-gray-500"
                  >
                    discounts არ მოიძებნა
                  </td>
                </tr>
              ) : (
                filteredRows.map((row, index) => {
                  const key = `${displayValue(row.Code)}-${displayValue(row.Name)}-${index}`;
                  return (
                    <React.Fragment key={key}>
                      <tr className="bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700">
                        {COLUMNS.map((column) => {
                          const value =
                            column === "ItemName"
                              ? resolvedItemName(row, catalogMeta)
                              : displayValue(row[column]);
                          return (
                            <td
                              key={column}
                              className={cellClass(column)}
                              title={value === "—" ? undefined : value}
                            >
                              {value}
                            </td>
                          );
                        })}
                      </tr>
                      <tr className="bg-white dark:bg-gray-800">
                        <td colSpan={COLUMNS.length} className="px-3 pb-5 pt-0">
                          {renderItemsPanel(row)}
                        </td>
                      </tr>
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
