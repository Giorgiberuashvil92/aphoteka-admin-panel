"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Product } from "@/types";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import { PlusIcon, PencilIcon, TrashBinIcon, EyeIcon } from "@/icons";
import Link from "next/link";
import { useProducts } from "@/hooks/useProducts";
import { productsApi } from "@/lib/api";

export default function ProductsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  
  // Debounce search term to avoid too many API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);
  
  // API integration - მონაცემები მოდის ბაზიდან
  const { data, loading, error, execute } = useProducts({
    search: debouncedSearchTerm || undefined,
    limit: 100,
  });

  // Memoize products to avoid unnecessary re-renders
  const products = useMemo(() => data?.data || [], [data?.data]);

  // Client-side filtering is no longer needed since API handles search
  // But we keep it as fallback for better UX
  const filteredProducts = useMemo(() => {
    if (!debouncedSearchTerm) return products;
    
    const search = debouncedSearchTerm.toLowerCase();
    return products.filter(
      (product) =>
        product.name.toLowerCase().includes(search) ||
        product.genericName?.toLowerCase().includes(search) ||
        product.description?.toLowerCase().includes(search) ||
        product.sku?.toLowerCase().includes(search) ||
        product.manufacturer?.toLowerCase().includes(search) ||
        product.countryOfOrigin?.toLowerCase().includes(search)
    );
  }, [products, debouncedSearchTerm]);

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
      <PageBreadCrumb pageTitle="პროდუქტების კატალოგი" />

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
        <Link
          href="/products/new"
          className="flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
        >
          <PlusIcon className="h-4 w-4" />
          ახალი პროდუქტი
        </Link>
      </div>

      {/* Products Table */}
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                  პროდუქტი
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                  დოზირება
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                  მწარმოებელი
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                  კატეგორია
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                  ფასი
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                  სტატუსი
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                  მოქმედებები
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-sm text-gray-500">
                    პროდუქტები არ მოიძებნა
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => (
                  <tr
                    key={product.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {product.genericName || product.name}
                        </div>
                        {product.description && (
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {product.description}
                          </div>
                        )}
                        {product.sku && (
                          <div className="text-xs text-gray-400 dark:text-gray-500">
                            SKU: {product.sku}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                      <div className="font-medium">{product.strength || "-"}</div>
                      {product.dosageForm && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {product.dosageForm}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      <div>{product.manufacturer || "-"}</div>
                      {product.countryOfOrigin && (
                        <div className="text-xs text-gray-400 dark:text-gray-500">
                          {product.countryOfOrigin}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {product.category || "-"}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                      ₾{product.price.toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
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
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/products/${product.id}`}
                          className="rounded p-1 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
                          title="ნახვა"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </Link>
                        <Link
                          href={`/products/${product.id}/edit`}
                          className="rounded p-1 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
                          title="რედაქტირება"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => toggleProductStatus(product.id)}
                          className="rounded p-1 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
                          title={product.active ? "დეაქტივაცია" : "აქტივაცია"}
                        >
                          {product.active ? (
                            <TrashBinIcon className="h-4 w-4" />
                          ) : (
                            <EyeIcon className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
