"use client";

/**
 * პროდუქტების გვერდი
 * 
 * curl მოთხოვნები პროდუქტების დასამატებლად:
 * 
 * 1. ცალ-ცალკე პროდუქტების დამატება:
 *    ./add-products.sh
 * 
 * 2. Bulk დამატება (ყველა ერთად):
 *    ./add-products-bulk.sh
 * 
 * ან ხელით curl მოთხოვნებით:
 * 
 * ლოკალური Nest: curl -X POST "http://localhost:3001/api/products" \
 *   -H "Content-Type: application/json" \
 *   -d '{
 *     "name": "პარაცეტამოლი 500მგ",
 *     "sku": "PAR-500-001",
 *     "price": 2.50,
 *     "quantity": 100,
 *     "totalPrice": 250.00,
 *     "unitOfMeasure": "ცალი",
 *     "genericName": "Paracetamol",
 *     "strength": "500 mg",
 *     "dosageForm": "tablet",
 *     "packSize": "10 tablets",
 *     "barcode": "1234567890123",
 *     "category": "Pain Relief",
 *     "manufacturer": "Bayer",
 *     "countryOfOrigin": "გერმანია",
 *     "productNameBrand": "Paracetamol 500mg - Bayer",
 *     "packagingType": "ფილმი",
 *     "active": true
 *   }'
 */

import React, { useState, useEffect, useMemo, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Product } from "@/types";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import { PlusIcon, PencilIcon, TrashBinIcon, EyeIcon } from "@/icons";
import Link from "next/link";
import { useProducts } from "@/hooks/useProducts";
import { productsApi, warehousesApi, inventoryApi } from "@/lib/api";
import {
  getBalanceStocks,
  getBalancePrices,
  rowsFromBalanceStocks,
  rowsFromBalancePrices,
} from "@/lib/api/balanceStocks";
import ProductFormModal from "@/components/products/ProductFormModal";
import AddToWarehouseModal from "@/components/inventory/AddToWarehouseModal";

function ProductsPageContent() {
  const searchParams = useSearchParams();
  const warehouseId = searchParams.get("warehouseId") || undefined;
  
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [warehouse, setWarehouse] = useState<any>(null);
  const [warehouseInventory, setWarehouseInventory] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);
  const [isWarehouseModalOpen, setIsWarehouseModalOpen] = useState(false);
  const [warehouseProduct, setWarehouseProduct] = useState<Product | null>(null);
  const [balanceStocksRows, setBalanceStocksRows] = useState<Record<string, unknown>[]>([]);
  const [balanceStocksRaw, setBalanceStocksRaw] = useState<unknown>(null);
  const [balanceStocksLoading, setBalanceStocksLoading] = useState(true);
  const [balanceStocksError, setBalanceStocksError] = useState<string | null>(null);
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncResult, setSyncResult] = useState<{
    created: number;
    updated: number;
    total: number;
    error?: string;
    errors?: string[];
  } | null>(null);
  const [balanceStocksCollapsed, setBalanceStocksCollapsed] = useState(false);
  const [balancePricesRows, setBalancePricesRows] = useState<Record<string, unknown>[]>([]);
  const [balancePricesRaw, setBalancePricesRaw] = useState<unknown>(null);
  const [balancePricesLoading, setBalancePricesLoading] = useState(true);
  const [balancePricesError, setBalancePricesError] = useState<string | null>(null);

  // Debounce search term to avoid too many API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Load warehouse info if warehouseId is provided
  useEffect(() => {
    if (warehouseId) {
      warehousesApi.getById(warehouseId).then(response => {
        setWarehouse(response.data);
      });
      inventoryApi.getAll({ warehouseId }).then(response => {
        setWarehouseInventory(response.data);
      });
    }
  }, [warehouseId]);

  useEffect(() => {
    (async () => {
      try {
        setBalanceStocksError(null);
        const data = await getBalanceStocks();
        setBalanceStocksRaw(data);
        setBalanceStocksRows(rowsFromBalanceStocks(data));
      } catch (err) {
        setBalanceStocksError(
          err instanceof Error ? err.message : "Balance Stocks-ის ჩატვირთვა ვერ მოხერხდა"
        );
      } finally {
        setBalanceStocksLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        setBalancePricesError(null);
        const data = await getBalancePrices();
        setBalancePricesRaw(data);
        setBalancePricesRows(rowsFromBalancePrices(data));
      } catch (err) {
        setBalancePricesError(
          err instanceof Error ? err.message : "Balance Prices-ის ჩატვირთვა ვერ მოხერხდა"
        );
      } finally {
        setBalancePricesLoading(false);
      }
    })();
  }, []);

  const syncBalanceToDb = async () => {
    setSyncLoading(true);
    setSyncResult(null);
    try {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
      const res = await fetch("/api/balance/sync-stocks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const json = await res.json();
      if (!res.ok) {
        setSyncResult({
          created: 0,
          updated: 0,
          total: 0,
          error: json.error || "სინქრონიზაცია ვერ მოხერხდა",
          errors: json.errors,
        });
        return;
      }
      setSyncResult({
        created: json.created ?? 0,
        updated: json.updated ?? 0,
        total: json.total ?? 0,
        error: json.error,
        errors: json.errors,
      });
      execute();
    } catch (err) {
      setSyncResult({
        created: 0,
        updated: 0,
        total: 0,
        error: err instanceof Error ? err.message : "შეცდომა",
      });
    } finally {
      setSyncLoading(false);
    }
  };

  const { data, loading, error, execute } = useProducts({
    search: debouncedSearchTerm || undefined,
    limit: 100,
  });

  const syncBalanceToDbRef = useRef(false);
  useEffect(() => {
    const twoHoursMs = 2 * 60 * 60 * 1000;
    const id = setInterval(() => {
      if (syncBalanceToDbRef.current) return;
      syncBalanceToDbRef.current = true;
      const token =
        typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
      fetch("/api/balance/sync-stocks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      })
        .then((r) => r.json())
        .then((json) => {
          if (json.ok) execute();
        })
        .finally(() => {
          syncBalanceToDbRef.current = false;
        });
    }, twoHoursMs);
    return () => clearInterval(id);
  }, [execute]);

  // Memoize products to avoid unnecessary re-renders
  const products = useMemo(() => {
    const prods = data?.data || [];
    if (prods.length > 0) {
      console.log('First product:', prods[0]);
      console.log('First product ID:', prods[0].id);
    }
    return prods;
  }, [data?.data]);

  // Filter products by warehouse if warehouseId is provided
  const filteredProducts = useMemo(() => {
    let filtered = products;
    
    // Filter by warehouse inventory
    if (warehouseId && warehouseInventory.length > 0) {
      const warehouseProductIds = new Set(warehouseInventory.map(item => item.productId));
      filtered = filtered.filter(product => warehouseProductIds.has(product.id));
    }
    
    // Filter by search term
    if (debouncedSearchTerm) {
      const search = debouncedSearchTerm.toLowerCase();
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(search) ||
          product.genericName?.toLowerCase().includes(search) ||
          product.description?.toLowerCase().includes(search) ||
          product.sku?.toLowerCase().includes(search) ||
          product.manufacturer?.toLowerCase().includes(search) ||
          product.countryOfOrigin?.toLowerCase().includes(search)
      );
    }
    
    return filtered;
  }, [products, debouncedSearchTerm, warehouseId, warehouseInventory]);

  const toggleProductStatus = async (id: string) => {
    try {
      await productsApi.toggleStatus(id);
      // Refresh data after status change
      execute();
    } catch (error) {
      console.error('Failed to toggle product status:', error);
      alert('შეცდომა: ვერ მოხერხდა პროდუქტის სტატუსის შეცვლა');
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('დარწმუნებული ხართ, რომ გსურთ ამ პროდუქტის წაშლა?')) {
      return;
    }

    setDeletingProductId(id);
    try {
      await productsApi.delete(id);
      // Refresh data after deletion
      execute();
      alert('პროდუქტი წარმატებით წაიშალა');
    } catch (error) {
      console.error('Failed to delete product:', error);
      alert('შეცდომა: ვერ მოხერხდა პროდუქტის წაშლა');
    } finally {
      setDeletingProductId(null);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const handleModalSuccess = () => {
    execute();
    handleModalClose();
  };

  const handleAddToWarehouse = (product: Product) => {
    setWarehouseProduct(product);
    setIsWarehouseModalOpen(true);
  };

  const handleWarehouseModalClose = () => {
    setIsWarehouseModalOpen(false);
    setWarehouseProduct(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">მონაცემების ჩატვირთვა...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageBreadCrumb pageTitle="პროდუქტების კატალოგი" />
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 dark:border-red-800 dark:bg-red-900/20">
          <h3 className="text-lg font-semibold text-red-800 dark:text-red-200">
            შეცდომა მონაცემების ჩატვირთვისას
          </h3>
          <p className="mt-2 text-red-600 dark:text-red-300">
            {error instanceof Error ? error.message : 'უცნობი შეცდომა'}
          </p>
          <button
            onClick={() => execute()}
            className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            ხელახლა ცდა
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageBreadCrumb pageTitle={warehouse ? `${warehouse.name} - პროდუქტები` : "პროდუქტების კატალოგი"} />

      {/* Warehouse Filter Info */}
      {warehouse && (
        <div className="rounded-lg border border-brand-200 bg-brand-50 p-4 dark:border-brand-800 dark:bg-brand-900/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-brand-900 dark:text-brand-200">
                ფილტრი: {warehouse.name}
              </p>
              <p className="text-xs text-brand-700 dark:text-brand-300">
                ნაჩვენებია მხოლოდ ამ საწყობში არსებული პროდუქტები ({filteredProducts.length})
              </p>
            </div>
            <Link
              href="/products"
              className="text-sm text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
            >
              ფილტრის მოხსნა
            </Link>
          </div>
        </div>
      )}

      {/* Header Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1">
          <input
            type="text"
            placeholder="ძიება პროდუქტებში..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          />
        </div>
        <div className="flex gap-2">
          <Link
            href="/products/import"
            className="flex items-center justify-center gap-2 rounded-lg border border-brand-500 bg-white px-4 py-2 text-sm font-medium text-brand-500 hover:bg-brand-50 dark:bg-gray-800 dark:hover:bg-gray-700"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            Excel Import
          </Link>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
          >
            <PlusIcon className="h-4 w-4" />
            ახალი პროდუქტი
          </button>
        </div>
      </div>

      {/* Balance – ნაშთები (Stocks) – აკეცვადი */}
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <button
          type="button"
          onClick={() => setBalanceStocksCollapsed((c) => !c)}
          className="flex w-full flex-wrap items-center justify-between gap-2 p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50"
        >
          <div className="flex items-center gap-2">
            <span
              className={`inline-block transition-transform ${balanceStocksCollapsed ? "" : "rotate-90"}`}
              aria-hidden
            >
              ▶
            </span>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Balance – ნაშთები (Stocks)
            </h2>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              syncBalanceToDb();
            }}
            disabled={syncLoading || balanceStocksLoading}
            className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
          >
            {syncLoading ? "იტვირთება..." : "განახლება ბაზა"}
          </button>
        </button>
        {!balanceStocksCollapsed && (
        <div className="border-t border-gray-200 px-4 pb-4 pt-0 dark:border-gray-700">
        {syncResult && (
          <div
            className={`mb-3 rounded-lg border p-3 text-sm ${
              syncResult.error
                ? "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20"
                : "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20"
            }`}
          >
            {syncResult.error ? (
              <p className="text-red-800 dark:text-red-200">{syncResult.error}</p>
            ) : (
              <p className="text-green-800 dark:text-green-200">
                დასრულდა: {syncResult.created} ახალი, {syncResult.updated} განახლებული, სულ{" "}
                {syncResult.total} ჩანაწერი.
              </p>
            )}
            {syncResult.errors && syncResult.errors.length > 0 && (
              <ul className="mt-2 list-inside list-disc text-red-700 dark:text-red-300">
                {syncResult.errors.slice(0, 5).map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
                {syncResult.errors.length > 5 && (
                  <li>... და კიდევ {syncResult.errors.length - 5} შეცდომა</li>
                )}
              </ul>
            )}
          </div>
        )}
        {balanceStocksLoading && (
          <p className="text-sm text-gray-500 dark:text-gray-400">იტვირთება...</p>
        )}
        {balanceStocksError && (
          <p className="text-sm text-red-600 dark:text-red-400">{balanceStocksError}</p>
        )}
        {!balanceStocksLoading && !balanceStocksError && balanceStocksRows.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-600">
                  {Object.keys(balanceStocksRows[0]).map((key) => (
                    <th
                      key={key}
                      className="whitespace-nowrap px-3 py-2 font-medium text-gray-700 dark:text-gray-300"
                    >
                      {key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {balanceStocksRows.map((row, i) => (
                  <tr
                    key={i}
                    className="border-b border-gray-100 dark:border-gray-700"
                  >
                    {Object.keys(balanceStocksRows[0]).map((key) => (
                      <td
                        key={key}
                        className="max-w-xs truncate px-3 py-2 text-gray-800 dark:text-gray-200"
                        title={String(row[key] ?? "")}
                      >
                        {row[key] === null || row[key] === undefined
                          ? "—"
                          : typeof row[key] === "object"
                            ? JSON.stringify(row[key])
                            : String(row[key])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!balanceStocksLoading && !balanceStocksError && balanceStocksRows.length === 0 && balanceStocksRaw != null && (
          <pre className="max-h-96 overflow-auto rounded bg-gray-50 p-3 text-xs dark:bg-gray-900 dark:text-gray-300">
            {typeof balanceStocksRaw === "string"
              ? balanceStocksRaw
              : JSON.stringify(balanceStocksRaw, null, 2)}
          </pre>
        )}

        {/* Balance – ფასები (Prices) */}
        <div className="mt-6 border-t border-gray-200 pt-4 dark:border-gray-700">
          <h3 className="mb-3 text-base font-semibold text-gray-900 dark:text-white">
            ფასები (Prices)
          </h3>
          {balancePricesLoading && (
            <p className="text-sm text-gray-500 dark:text-gray-400">იტვირთება...</p>
          )}
          {balancePricesError && (
            <p className="text-sm text-red-600 dark:text-red-400">{balancePricesError}</p>
          )}
          {!balancePricesLoading && !balancePricesError && balancePricesRows.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-600">
                    {Object.keys(balancePricesRows[0]).map((key) => (
                      <th
                        key={key}
                        className="whitespace-nowrap px-3 py-2 font-medium text-gray-700 dark:text-gray-300"
                      >
                        {key}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {balancePricesRows.map((row, i) => (
                    <tr
                      key={i}
                      className="border-b border-gray-100 dark:border-gray-700"
                    >
                      {Object.keys(balancePricesRows[0]).map((key) => (
                        <td
                          key={key}
                          className="max-w-xs truncate px-3 py-2 text-gray-800 dark:text-gray-200"
                          title={String(row[key] ?? "")}
                        >
                          {row[key] === null || row[key] === undefined
                            ? "—"
                            : typeof row[key] === "object"
                              ? JSON.stringify(row[key])
                              : String(row[key])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {!balancePricesLoading && !balancePricesError && balancePricesRows.length === 0 && balancePricesRaw != null && (
            <pre className="max-h-96 overflow-auto rounded bg-gray-50 p-3 text-xs dark:bg-gray-900 dark:text-gray-300">
              {typeof balancePricesRaw === "string"
                ? balancePricesRaw
                : JSON.stringify(balancePricesRaw, null, 2)}
            </pre>
          )}
        </div>
        </div>
        )}
      </div>

      {/* Products Table */}
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400 whitespace-nowrap">
                  საქონლის კოდი
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400 whitespace-nowrap">
                  საქონლის დასახელება
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400 whitespace-nowrap">
                  ზომის ერთეული
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400 whitespace-nowrap">
                  რაოდ.
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400 whitespace-nowrap">
                  ერთეულის ფასი
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400 whitespace-nowrap">
                  საქონლის ფასი
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400 whitespace-nowrap">
                  დაბეგვრა
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400 whitespace-nowrap">
                  ზედნადების ნომერი
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400 whitespace-nowrap">
                  სტატუსი
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400 whitespace-nowrap">
                  მყიდველი
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400 whitespace-nowrap">
                  გამყიდველი
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400 whitespace-nowrap">
                  გააქტიურების თარიღი
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400 whitespace-nowrap">
                  ტრანსპორტირების დაწყების თარიღი
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400 whitespace-nowrap">
                  ფირნიშის ან ცნობის ნომერი
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400 whitespace-nowrap">
                  დოკუმენტის N
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400 whitespace-nowrap">
                  SKU / internal product code
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400 whitespace-nowrap">
                  სერიის ნომერი
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400 whitespace-nowrap">
                  ვარგისიანობის ვადა
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400 whitespace-nowrap">
                  მწარმოებელი (ქვეყანა)
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400 whitespace-nowrap">
                  Generic name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400 whitespace-nowrap">
                  Product name (brand)
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400 whitespace-nowrap">
                  Strength (e.g., 500 mg)
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400 whitespace-nowrap">
                  Dosage form (tablet, syrup, injection)
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400 whitespace-nowrap">
                  Pack size (10 tablets, 100 ml)
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400 whitespace-nowrap">
                  Barcode (GTIN, if available)
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400 whitespace-nowrap">
                  შეფუთვის სახეობა
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400 whitespace-nowrap">
                  კატეგორია
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500 dark:text-gray-400 whitespace-nowrap">
                  მოქმედებები
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={28} className="px-6 py-8 text-center text-sm text-gray-500">
                    პროდუქტები არ მოიძებნა
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => {
                  // Debug: Log product to see what we have
                  if (!product.id) {
                    console.error('Product without ID:', product);
                  }
                  return (
                  <tr
                    key={product.id || (product as any)._id || Math.random()}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    {/* საქონლის კოდი */}
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                      {product.productCode || product.sku || "-"}
                    </td>
                    {/* საქონლის დასახელება */}
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                      {product.name || "-"}
                    </td>
                    {/* ზომის ერთეული */}
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      {product.unitOfMeasure || "-"}
                    </td>
                    {/* რაოდ. */}
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      {product.quantity || "-"}
                    </td>
                    {/* ერთეულის ფასი */}
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                      ₾{product.price.toFixed(2)}
                    </td>
                    {/* საქონლის ფასი */}
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                      {product.totalPrice ? `₾${product.totalPrice.toFixed(2)}` : `₾${product.price.toFixed(2)}`}
                    </td>
                    {/* დაბეგვრა */}
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      {product.taxation || "-"}
                    </td>
                    {/* ზედნადების ნომერი */}
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      {product.invoiceNumber || "-"}
                    </td>
                    {/* სტატუსი */}
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                          product.active
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                        }`}
                      >
                        {product.active ? "აქტიური" : "არააქტიური"}
                      </span>
                    </td>
                    {/* მყიდველი */}
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      {product.buyer || "-"}
                    </td>
                    {/* გამყიდველი */}
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      {product.seller || "-"}
                    </td>
                    {/* გააქტიურების თარიღი */}
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      {product.activationDate ? new Date(product.activationDate).toLocaleDateString('ka-GE') : "-"}
                    </td>
                    {/* ტრანსპორტირების დაწყების თარიღი */}
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      {product.transportStartDate ? new Date(product.transportStartDate).toLocaleDateString('ka-GE') : "-"}
                    </td>
                    {/* ფირნიშის ან ცნობის ნომერი */}
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      {product.certificateNumber || "-"}
                    </td>
                    {/* დოკუმენტის N */}
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      {product.documentNumber || "-"}
                    </td>
                    {/* SKU / internal product code */}
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      {product.sku || "-"}
                    </td>
                    {/* სერიის ნომერი */}
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      {product.serialNumber || "-"}
                    </td>
                    {/* ვარგისიანობის ვადა */}
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      {product.expiryDate ? new Date(product.expiryDate).toLocaleDateString('ka-GE') : "-"}
                    </td>
                    {/* მწარმოებელი (ქვეყანა) */}
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      {product.manufacturer || "-"}
                      {product.countryOfOrigin && (
                        <div className="text-xs text-gray-400 dark:text-gray-500">
                          ({product.countryOfOrigin})
                        </div>
                      )}
                    </td>
                    {/* Generic name */}
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      {product.genericName || "-"}
                    </td>
                    {/* Product name (brand) */}
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                      {product.productNameBrand || product.name || "-"}
                    </td>
                    {/* Strength (e.g., 500 mg) */}
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      {product.strength || "-"}
                    </td>
                    {/* Dosage form (tablet, syrup, injection) */}
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      {product.dosageForm || "-"}
                    </td>
                    {/* Pack size (10 tablets, 100 ml) */}
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      {product.packSize || "-"}
                    </td>
                    {/* Barcode (GTIN, if available) */}
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      {product.barcode || "-"}
                    </td>
                    {/* შეფუთვის სახეობა */}
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      {product.packagingType || "-"}
                    </td>
                    {/* კატეგორია */}
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      {product.category || "-"}
                    </td>
                    {/* მოქმედებები */}
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/products/${product.id}`}
                          className="rounded p-1 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
                          title="ნახვა"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => handleEdit(product)}
                          className="rounded p-1 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20"
                          title="რედაქტირება"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleAddToWarehouse(product)}
                          className="rounded p-1 text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/20"
                          title="საწყობში დამატება"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          disabled={deletingProductId === product.id}
                          className="rounded p-1 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="წაშლა"
                        >
                          {deletingProductId === product.id ? (
                            <div className="animate-spin h-4 w-4 border-2 border-red-600 border-t-transparent rounded-full" />
                          ) : (
                            <TrashBinIcon className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Product Form Modal */}
      <ProductFormModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
        product={editingProduct || undefined}
      />

      {/* Add to Warehouse Modal */}
      {warehouseProduct && (
        <AddToWarehouseModal
          isOpen={isWarehouseModalOpen}
          onClose={handleWarehouseModalClose}
          onSuccess={() => {
            handleWarehouseModalClose();
            // Optionally refresh inventory data
          }}
          product={warehouseProduct}
        />
      )}
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[200px] items-center justify-center text-gray-500">
          იტვირთება...
        </div>
      }
    >
      <ProductsPageContent />
    </Suspense>
  );
}
