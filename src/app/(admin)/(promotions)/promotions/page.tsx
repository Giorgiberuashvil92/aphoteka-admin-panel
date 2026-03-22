"use client";

import React, { useState, useEffect, useCallback } from "react";
import { AdminPromotion, promotionsApi } from "@/lib/api";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import { PlusIcon, PencilIcon, TrashBinIcon } from "@/icons";
import Link from "next/link";

export default function PromotionsPage() {
  const [promotions, setPromotions] = useState<AdminPromotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadPromotions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const activeFilter =
        filterStatus === "active"
          ? true
          : filterStatus === "inactive"
          ? false
          : undefined;
      const list = await promotionsApi.getAll(
        activeFilter !== undefined ? { active: activeFilter } : undefined
      );
      setPromotions(Array.isArray(list) ? list : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "შეცდომა ჩატვირთვისას");
      setPromotions([]);
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => {
    loadPromotions();
  }, [loadPromotions]);

  const handleDelete = async (id: string) => {
    if (!confirm("დარწმუნებული ხართ, რომ გსურთ ამ აქციის წაშლა?")) return;
    setDeletingId(id);
    try {
      await promotionsApi.delete(id);
      setPromotions((prev) => prev.filter((p) => p.id !== id));
    } catch (e) {
      alert(e instanceof Error ? e.message : "წაშლა ვერ მოხერხდა");
    } finally {
      setDeletingId(null);
    }
  };

  const filteredPromotions = promotions.filter((promo) => {
    const matchesSearch =
      promo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (promo.description &&
        promo.description.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesSearch;
  });

  const getPromotionStatus = (promo: AdminPromotion) => {
    if (!promo.active)
      return { label: "არააქტიური", color: "bg-gray-100 text-gray-800" };
    const now = new Date();
    const end = promo.endDate ? new Date(promo.endDate) : null;
    if (end && end < now)
      return { label: "ვადა გაუვიდა", color: "bg-red-100 text-red-800" };
    const start = promo.startDate ? new Date(promo.startDate) : null;
    if (start && start > now)
      return { label: "მომავალი", color: "bg-blue-100 text-blue-800" };
    return { label: "აქტიური", color: "bg-green-100 text-green-800" };
  };

  const formatDate = (d: string | null | undefined) =>
    d ? new Date(d).toLocaleDateString("ka-GE") : "—";

  return (
    <div className="space-y-6">
      <PageBreadCrumb pageTitle="ფასდაკლებების მენეჯმენტი" />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-4 sm:flex-row">
          <input
            type="text"
            placeholder="ძიება სახელით ან აღწერით..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          >
            <option value="all">ყველა</option>
            <option value="active">აქტიური</option>
            <option value="inactive">არააქტიური</option>
          </select>
        </div>
        <Link
          href="/promotions/new"
          className="flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
        >
          <PlusIcon className="h-4 w-4" />
          ახალი ფასდაკლება
        </Link>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                  სახელი
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                  ფასდაკლება
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                  პროდუქტები
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                  პერიოდი
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
              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-8 text-center text-sm text-gray-500"
                  >
                    იტვირთება...
                  </td>
                </tr>
              ) : filteredPromotions.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-8 text-center text-sm text-gray-500"
                  >
                    ფასდაკლებები არ მოიძებნა
                  </td>
                </tr>
              ) : (
                filteredPromotions.map((promo) => {
                  const status = getPromotionStatus(promo);
                  return (
                    <tr
                      key={promo.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {promo.name}
                        </div>
                        {promo.description && (
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {promo.description}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                        {promo.discountPercent}%
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {Array.isArray(promo.productIds)
                          ? promo.productIds.length
                          : 0}{" "}
                        პროდუქტი
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(promo.startDate)} — {formatDate(promo.endDate)}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${status.color} dark:bg-opacity-20`}
                        >
                          {status.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/promotions/${promo.id}/edit`}
                            className="rounded p-1 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
                            title="რედაქტირება"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleDelete(promo.id)}
                            disabled={deletingId === promo.id}
                            className="rounded p-1 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-gray-700 disabled:opacity-50"
                            title="წაშლა"
                          >
                            <TrashBinIcon className="h-4 w-4" />
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
    </div>
  );
}
