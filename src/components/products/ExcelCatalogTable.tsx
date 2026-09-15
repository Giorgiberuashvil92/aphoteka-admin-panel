"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import { productsApi } from "@/lib/api/products";
import type { Product } from "@/types";

type CatalogMode = "common" | "pharmacist-source" | "pharmacist-stock" | "accountant" | "discounts";

type Cell = string | number | boolean | null | undefined;

function recordValue(product: Product, ...keys: string[]): Cell {
  const row = product as Product & Record<string, unknown>;
  for (const key of keys) {
    const direct = row[key];
    if (direct !== undefined && direct !== null && direct !== "") return direct as Cell;
    const filter = product.filterValues?.[key];
    if (filter !== undefined && filter !== null && filter !== "") {
      return Array.isArray(filter) ? filter.join(", ") : filter;
    }
  }
  return undefined;
}

function text(value: Cell): string {
  if (value === undefined || value === null || value === "") return "—";
  if (typeof value === "boolean") return value ? "Y" : "N";
  return String(value);
}

function money(value: Cell): string {
  const n = Number(value);
  return Number.isFinite(n) ? `₾${n.toFixed(2)}` : text(value);
}

function date(value: Cell): string {
  if (!value) return "—";
  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? text(value) : parsed.toLocaleDateString("ka-GE");
}

function productName(product: Product): string {
  return text(product.productNameBrand || product.name);
}

function productSku(product: Product): string {
  return text(product.internalSku || product.sku);
}

function category(product: Product): string {
  return text([product.mainCategory, product.subcategory].filter(Boolean).join(" / "));
}

const PHARMACIST_COLUMNS = [
  "InternalArticle", "Barcode", "Name", "Unit", "FullName", "Group",
  "ItemsSeriesNumber", "ItemsSeriesValidUntil",
  "Active Ingredient", "Dosage Form", "Strength", "Rx Required", "Manufacturer Brand",
  "Manufacturer country", "Product Description PDF", "Filters",
] as const;

const ACCOUNTANT_COLUMNS = [
  "InternalArticle", "Barcode", "Name", "Unit", "InventoriesAccount", "ExpensesAccount",
  "RevenuesAccount", "CostsAccount", "VATPayableAccount", "ProductionAccount",
  "Cost (GEL)", "გასაყიდი ფასი", "Discount Price (GEL)", "On Sale",
  "VAT Rate", "Commission %",
] as const;

const COMMON_COLUMNS = [
  "InternalArticle", "Barcode", "Name", "Unit", "FullName", "Group", "ItemsSeriesNumber", "ItemsSeriesValidUntil",
  "Active Ingredient", "Dosage Form", "Strength", "Rx Required", "Brand", "Manufacturer", "Product Description PDF",
  "Quantity", "საქონლის ფასი", "Reorder Level", "Warehouse", "Availability", "Weight",
  "InventoriesAccount", "ExpensesAccount", "RevenuesAccount", "CostsAccount", "VATPayableAccount", "ProductionAccount",
  "Cost (GEL)", "ერთეულის ფასი", "Discount Price (GEL)", "On Sale", "VAT Rate", "Commission %", "Discount Name",
  "IsActive", "StartDate", "EndDate", "DiscountType", "Percentage", "DiscountCondition", "Amount", "Currency", "Items",
  "Schedule", "Comments", "SpecialPrice", "LoyaltyCardType", "PointsAccrualMethod", "PointsValue", "RoundUp", "Rating", "მყიდველი",
] as const;

const PHARMACIST_STOCK_COLUMNS = [
  "InternalArticle", "Barcode", "Name", "Unit", "Qty on Hand", "Stock value (gel)", "Reorder Level", "Warehouse",
  "Availability", "Package Weight  kg.", "Rating",
] as const;

const DISCOUNT_COLUMNS = [
  "SKU", "Barcode", "Name", "Unit", "Discount Name", "IsActive", "StartDate", "EndDate", "DiscountType",
  "Percentage", "DiscountCondition", "Amount", "Currency", "Items", "Schedule", "Comments", "SpecialPrice",
  "LoyaltyCardType", "PointsAccrualMethod", "PointsValue", "RoundUp", "Rating",
] as const;

function genericRow(product: Product): Record<string, Cell> {
  const row = product as Product & Record<string, unknown>;
  const qty = recordValue(product, "quantity", "qtyOnHand", "Qty on Hand");
  const price = Number(product.price);
  const discountPercent = Number(recordValue(product, "balanceDiscountPercent", "percentage"));
  const discountAmount = Number(recordValue(product, "balanceDiscountAmount", "amount"));
  const discountPrice = Number.isFinite(price)
    ? Number.isFinite(discountPercent) ? Math.max(0, price * (1 - discountPercent / 100))
      : Number.isFinite(discountAmount) ? Math.max(0, price - discountAmount) : undefined
    : undefined;
  return {
    InternalArticle: productSku(product),
    SKU: productSku(product), Barcode: text(product.barcode), Name: text(product.name), Unit: text(product.unitOfMeasure),
    "FullName": productName(product), Group: category(product), ItemsSeriesNumber: text(product.balanceItemSeries?.[0]?.seriesNumber || product.serialNumber),
    ItemsSeriesValidUntil: date(product.balanceItemSeries?.[0]?.expiryDate || product.expiryDate),
    "Active Ingredient": text(product.activeIngredients || product.genericName),
    "Dosage Form": text(product.dosageForm), Strength: text(product.strength), "Rx Required": text(product.prescriptionRequired),
    Brand: text(product.productNameBrand), Manufacturer: text(product.manufacturer),
    "Product Description PDF": text(recordValue(product, "productDescriptionPdf", "descriptionPdf")),
    Quantity: text(qty), "Qty on Hand": text(qty),
    "საქონლის ფასი": money(product.totalPrice), "Stock value (gel)": money(product.totalPrice),
    "Reorder Level": text(product.reorderLevel),
    Warehouse: text(recordValue(product, "warehouse", "warehouseName")), Availability: text(recordValue(product, "availability")),
    Weight: text(recordValue(product, "packageWeight", "weight")),
    "Package Weight  kg.": text(recordValue(product, "packageWeight", "weight")),
    InventoriesAccount: text(product.balanceInventoriesAccount), ExpensesAccount: text(product.balanceExpensesAccount),
    RevenuesAccount: text(product.balanceRevenuesAccount), CostsAccount: text(row.balanceCostsAccount),
    VATPayableAccount: text(product.balanceVatPayableAccount), ProductionAccount: text(row.balanceProductionAccount),
    "Cost (GEL)": money(recordValue(product, "cost", "costPrice")),
    "ერთეულის ფასი": money(product.price), "Retail Price (GEL)": money(product.price),
    "Discount Price (GEL)": money(discountPrice), "On Sale": text(recordValue(product, "onSale", "isOnSale")),
    "VAT Rate": text(recordValue(product, "vatRate", "taxation")), "Commission %": text(recordValue(product, "commissionPercent", "commission")),
    "Discount Name": text(product.balanceDiscountName), IsActive: text(recordValue(product, "isActive") ?? product.active),
    StartDate: date(product.balanceDiscountStartDate), EndDate: date(product.balanceDiscountEndDate),
    DiscountType: text(recordValue(product, "discountType")), Percentage: text(product.balanceDiscountPercent),
    DiscountCondition: text(product.balanceDiscountCondition), Amount: text(product.balanceDiscountAmount),
    Currency: text(recordValue(product, "currency")), Items: text(recordValue(product, "items")),
    Schedule: text(product.balanceDiscountSchedule), Comments: text(product.balanceDiscountComments),
    SpecialPrice: text(recordValue(product, "specialPrice")), LoyaltyCardType: text(product.balanceLoyaltyCardType),
    PointsAccrualMethod: text(product.balancePointsAccrualMethod), PointsValue: text(product.balancePointsValue),
    RoundUp: text(recordValue(product, "roundUp")), Rating: text(recordValue(product, "rating")),
    "მყიდველი": text(product.buyer),
  };
}

function pharmacistRow(product: Product): Record<string, Cell> {
  const series = product.balanceItemSeries?.[0];
  return {
    InternalArticle: productSku(product),
    Barcode: text(product.barcode),
    Name: text(product.name),
    Unit: text(product.unitOfMeasure),
    FullName: productName(product),
    Group: category(product),
    ItemsSeriesNumber: text(series?.seriesNumber || product.serialNumber),
    ItemsSeriesValidUntil: date(series?.expiryDate || product.expiryDate),
    "Active Ingredient": text(product.activeIngredients || product.genericName),
    "Dosage Form": text(product.dosageForm),
    Strength: text(product.strength),
    "Rx Required": text(product.prescriptionRequired),
    "Manufacturer Brand": text(product.productNameBrand || product.manufacturer),
    "Manufacturer country": text(product.countryOfOrigin),
    "Product Description PDF": text(recordValue(product, "productDescriptionPdf", "descriptionPdf")),
    Filters: text(recordValue(product, "filters", "filter")),
  };
}

function accountantRow(product: Product): Record<string, Cell> {
  const row = product as Product & Record<string, unknown>;
  const discountPercent = Number(recordValue(product, "balanceDiscountPercent", "percentage"));
  const discountAmount = Number(recordValue(product, "balanceDiscountAmount", "amount"));
  const price = Number(product.price);
  const discountPrice = Number.isFinite(price)
    ? Number.isFinite(discountPercent)
      ? Math.max(0, price * (1 - discountPercent / 100))
      : Number.isFinite(discountAmount)
        ? Math.max(0, price - discountAmount)
        : undefined
    : undefined;
  return {
    InternalArticle: productSku(product),
    Barcode: text(product.barcode),
    Name: text(product.name),
    Unit: text(product.unitOfMeasure),
    InventoriesAccount: text(product.balanceInventoriesAccount),
    ExpensesAccount: text(product.balanceExpensesAccount),
    RevenuesAccount: text(product.balanceRevenuesAccount),
    CostsAccount: text(row.balanceCostsAccount),
    VATPayableAccount: text(row.balanceVatPayableAccount),
    ProductionAccount: text(row.balanceProductionAccount),
    "Cost (GEL)": money(recordValue(product, "cost", "costPrice")),
    "გასაყიდი ფასი": money(product.price),
    "Discount Price (GEL)": money(discountPrice),
    "On Sale": text(recordValue(product, "onSale", "isOnSale")),
    "VAT Rate": text(recordValue(product, "vatRate", "taxation")),
    "Commission %": text(recordValue(product, "commissionPercent", "commission")),
  };
}

export default function ExcelCatalogTable({ mode, title }: { mode: CatalogMode; title: string }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await productsApi.getAll({ limit: 10000 });
      setProducts(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "კატალოგის ჩატვირთვა ვერ მოხერხდა");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const columns = mode === "common" ? COMMON_COLUMNS : mode === "pharmacist-source" ? PHARMACIST_COLUMNS : mode === "pharmacist-stock" ? PHARMACIST_STOCK_COLUMNS : mode === "discounts" ? DISCOUNT_COLUMNS : ACCOUNTANT_COLUMNS;
  const rows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return products
      .map((product) => mode === "common" || mode === "pharmacist-stock" || mode === "discounts" ? genericRow(product) : mode === "pharmacist-source" ? pharmacistRow(product) : accountantRow(product))
      .filter((row) => !query || columns.some((column) => text(row[column]).toLowerCase().includes(query)));
  }, [columns, mode, products, search]);

  return (
    <div className="space-y-6">
      <PageBreadCrumb pageTitle={title} />
      <div className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Excel-ის შესაბამისი ველები · {rows.length} ჩანაწერი</p>
        </div>
        <div className="flex gap-2">
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="ძიება..." className="w-56 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-white" />
          <button type="button" onClick={() => void load()} className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600">განახლება</button>
        </div>
      </div>
      {error ? <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div> : null}
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-gray-50 dark:bg-gray-900"><tr>{columns.map((column) => <th key={column} className="whitespace-nowrap px-3 py-3 text-xs font-medium text-gray-600 dark:text-gray-300">{column}</th>)}</tr></thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? <tr><td colSpan={columns.length} className="px-6 py-8 text-center text-sm text-gray-500">იტვირთება...</td></tr> : rows.length === 0 ? <tr><td colSpan={columns.length} className="px-6 py-8 text-center text-sm text-gray-500">ჩანაწერები არ მოიძებნა</td></tr> : rows.map((row, index) => <tr key={`${text(row.SKU)}-${index}`} className="hover:bg-gray-50 dark:hover:bg-gray-700">{columns.map((column) => <td key={column} className="max-w-[220px] truncate px-3 py-3 text-gray-700 dark:text-gray-300" title={text(row[column])}>{text(row[column])}</td>)}</tr>)}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
