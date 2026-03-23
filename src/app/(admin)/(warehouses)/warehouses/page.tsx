"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Warehouse } from "@/types";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import { PlusIcon, PencilIcon, EyeIcon, BoxIcon } from "@/icons";
import Link from "next/link";
import { warehousesApi } from "@/lib/api";
import {
  getBalanceWarehouses,
  rowsFromBalanceWarehouses,
} from "@/lib/api/balanceWarehouses";
import { getAuthToken } from "@/lib/authToken";

export default function WarehousesPage() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCity, setFilterCity] = useState<string>("all");
  const [filterActive, setFilterActive] = useState<string>("all");
  const [balanceRows, setBalanceRows] = useState<Record<string, unknown>[]>([]);
  const [balanceRaw, setBalanceRaw] = useState<unknown>(null);
  const [balanceLoading, setBalanceLoading] = useState(true);
  const [balanceError, setBalanceError] = useState<string | null>(null);
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncResult, setSyncResult] = useState<{
    created: number;
    updated: number;
    total: number;
    error?: string;
    errors?: string[];
  } | null>(null);

  useEffect(() => {
    loadWarehouses();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        setBalanceError(null);
        const data = await getBalanceWarehouses();
        setBalanceRaw(data);
        const rows = rowsFromBalanceWarehouses(data);
        setBalanceRows(rows);
      } catch (err) {
        setBalanceError(
          err instanceof Error ? err.message : "Balance API-დან ჩატვირთვა ვერ მოხერხდა"
        );
      } finally {
        setBalanceLoading(false);
      }
    })();
  }, []);

  const loadWarehouses = async () => {
    try {
      setLoading(true);
      setError(null);
      const params: any = {};
      if (searchTerm) params.search = searchTerm;
      if (filterCity !== "all") params.city = filterCity;
      if (filterActive !== "all") params.active = filterActive === "active";
      
      const response = await warehousesApi.getAll(params);
      setWarehouses(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "შეცდომა მონაცემების ჩატვირთვისას");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadWarehouses();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, filterCity, filterActive]);

  const cities = useMemo(() => {
    const citySet = new Set(warehouses.map(w => w.city).filter(Boolean));
    return Array.from(citySet).sort();
  }, [warehouses]);

  const toggleStatus = async (id: string) => {
    try {
      await warehousesApi.toggleStatus(id);
      loadWarehouses();
    } catch (err) {
      alert("შეცდომა: ვერ მოხერხდა საწყობის სტატუსის შეცვლა");
    }
  };

  const syncBalanceWarehouses = async () => {
    setSyncLoading(true);
    setSyncResult(null);
    try {
      const token = getAuthToken();
      const res = await fetch("/api/balance/sync-warehouses", {
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
      loadWarehouses();
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

  return (
    <div className="space-y-6">
      <PageBreadCrumb pageTitle="საწყობების მენეჯმენტი" />

      {/* Header Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-4 sm:flex-row">
          <input
            type="text"
            placeholder="ძიება საწყობებში..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          />
          <select
            value={filterCity}
            onChange={(e) => setFilterCity(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          >
            <option value="all">ყველა ქალაქი</option>
            {cities.map(city => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
          <select
            value={filterActive}
            onChange={(e) => setFilterActive(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          >
            <option value="all">ყველა სტატუსი</option>
            <option value="active">აქტიური</option>
            <option value="inactive">არააქტიური</option>
          </select>
        </div>
        <Link
          href="/warehouses/new"
          className="flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
        >
          <PlusIcon className="h-4 w-4" />
          ახალი საწყობი
        </Link>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
          <p className="text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {/* Balance.ge – საწყობები → მონგო */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Balance – საწყობები (Exchange)
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              ბალანსიდან წამოსული საწყობები ჩაიწერება ჩვენს ბაზაში (მონგო) და ქვემოთ იგივე ფორმატით გამოჩნდება.
            </p>
          </div>
          <button
            type="button"
            onClick={syncBalanceWarehouses}
            disabled={syncLoading || balanceLoading}
            className="shrink-0 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
          >
            {syncLoading ? "იტვირთება..." : "Balance საწყობების ჩასმა მონგოში"}
          </button>
        </div>
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
                {syncResult.total} საწყობი.
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
        {balanceLoading && (
          <p className="text-sm text-gray-500 dark:text-gray-400">იტვირთება...</p>
        )}
        {balanceError && (
          <p className="text-sm text-red-600 dark:text-red-400">{balanceError}</p>
        )}
        {!balanceLoading && !balanceError && balanceRows.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-600">
                  {Object.keys(balanceRows[0]).map((key) => (
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
                {balanceRows.map((row, i) => (
                  <tr
                    key={i}
                    className="border-b border-gray-100 dark:border-gray-700"
                  >
                    {Object.keys(balanceRows[0]).map((key) => (
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
        {!balanceLoading && !balanceError && balanceRows.length === 0 && balanceRaw != null && (
          <pre className="max-h-96 overflow-auto rounded bg-gray-50 p-3 text-xs dark:bg-gray-900 dark:text-gray-300">
            {typeof balanceRaw === "string"
              ? balanceRaw
              : JSON.stringify(balanceRaw, null, 2)}
          </pre>
        )}
      </div>

      {/* საწყობები ჩვენი ბაზიდან (მონგო) – იგივე ფორმატი როგორც Balance-დან ჩასმის შემდეგ */}
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
        საწყობები (ჩვენი ბაზა)
      </h2>
      {warehouses.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white px-6 py-8 text-center text-sm text-gray-500 shadow-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
          საწყობები არ მოიძებნა. Balance-დან „ჩასმა მონგოში“ დააჭირეთ, რომ საწყობები ჩაიწეროს.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
          {warehouses.map((warehouse, index) => (
            <div
              key={warehouse.id || (warehouse as any)._id || `warehouse-${index}`}
              className="group overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
            >
              {/* Warehouse Header */}
              <div className="border-b border-gray-200 bg-gray-50 px-6 py-4 transition-colors group-hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-900 dark:group-hover:bg-gray-800">
                <div className="flex items-center gap-3">
                  <BoxIcon className="h-5 w-5 text-brand-500" />
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {warehouse.name}
                    </h3>
                    {warehouse.city && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {warehouse.city}
                      </p>
                    )}
                  </div>
                  <span
                    className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                      warehouse.active
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                        : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                    }`}
                  >
                    {warehouse.active ? "აქტიური" : "არააქტიური"}
                  </span>
                </div>
              </div>

              {/* Warehouse Info */}
              <div className="px-6 py-4 space-y-2">
                {warehouse.address && (
                  <div className="text-sm">
                    <span className="text-gray-500 dark:text-gray-400">მისამართი: </span>
                    <span className="text-gray-900 dark:text-white">{warehouse.address}</span>
                  </div>
                )}
                {warehouse.phoneNumber && (
                  <div className="text-sm">
                    <span className="text-gray-500 dark:text-gray-400">ტელეფონი: </span>
                    <span className="text-gray-900 dark:text-white">{warehouse.phoneNumber}</span>
                  </div>
                )}
                {warehouse.email && (
                  <div className="text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Email: </span>
                    <span className="text-gray-900 dark:text-white">{warehouse.email}</span>
                  </div>
                )}
                {warehouse.manager && (
                  <div className="text-sm">
                    <span className="text-gray-500 dark:text-gray-400">მენეჯერი: </span>
                    <span className="text-gray-900 dark:text-white">{warehouse.manager.fullName || warehouse.manager.phoneNumber}</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="border-t border-gray-200 bg-gray-50 px-6 py-4 dark:border-gray-700 dark:bg-gray-900">
                <div className="flex items-center justify-between gap-2">
                  <Link
                    href={`/warehouses/${warehouse.id}`}
                    className="flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
                  >
                    <EyeIcon className="h-4 w-4" />
                    ნახვა
                  </Link>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/warehouses/${warehouse.id}/edit`}
                      className="rounded p-1 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
                      title="რედაქტირება"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </Link>
                    <button
                      onClick={() => toggleStatus(warehouse.id)}
                      className="rounded p-1 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
                      title={warehouse.active ? "დეაქტივაცია" : "აქტივაცია"}
                    >
                      {warehouse.active ? "🚫" : "✅"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
