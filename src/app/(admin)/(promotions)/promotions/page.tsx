"use client";

import React, { useState } from "react";
import { Promotion } from "@/types";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import { PlusIcon, PencilIcon, TrashBinIcon, EyeIcon } from "@/icons";
import Link from "next/link";

// Mock data
const mockPromotions: Promotion[] = [
  {
    id: "1",
    name: "ზამთრის ფასდაკლება",
    description: "20% ფასდაკლება ყველა პროდუქტზე",
    type: "percentage",
    value: 20,
    applicableTo: "all",
    startDate: new Date("2024-01-01"),
    endDate: new Date("2024-03-31"),
    active: true,
    usageLimit: 1000,
    usageCount: 450,
    code: "WINTER20",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "2",
    name: "3-ის ფასად 2",
    description: "იყიდე 3, მიიღე 2-ის ფასად",
    type: "buy_x_get_y",
    value: 3,
    applicableTo: "category",
    categoryIds: ["1"],
    startDate: new Date("2024-02-01"),
    endDate: new Date("2024-02-29"),
    active: true,
    usageLimit: 500,
    usageCount: 120,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const typeLabels: Record<string, string> = {
  percentage: "პროცენტი",
  fixed_amount: "ფიქსირებული თანხა",
  buy_x_get_y: "იყიდე X, მიიღე Y",
};

export default function PromotionsPage() {
  const [promotions, setPromotions] = useState<Promotion[]>(mockPromotions);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const filteredPromotions = promotions.filter((promo) => {
    const matchesSearch =
      promo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      promo.code?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "active" && promo.active) ||
      (filterStatus === "inactive" && !promo.active);
    const now = new Date();
    const isActive = promo.active && promo.startDate <= now && promo.endDate >= now;
    const matchesFilter =
      filterStatus === "all" ||
      (filterStatus === "active" && isActive) ||
      (filterStatus === "expired" && promo.endDate < now) ||
      (filterStatus === "upcoming" && promo.startDate > now);
    return matchesSearch && matchesFilter;
  });

  const getPromotionStatus = (promo: Promotion) => {
    const now = new Date();
    if (!promo.active) return { label: "არააქტიური", color: "bg-gray-100 text-gray-800" };
    if (promo.endDate < now) return { label: "ვადა გაუვიდა", color: "bg-red-100 text-red-800" };
    if (promo.startDate > now) return { label: "მომავალი", color: "bg-blue-100 text-blue-800" };
    return { label: "აქტიური", color: "bg-green-100 text-green-800" };
  };

  return (
    <div className="space-y-6">
      <PageBreadCrumb pageTitle="ფასდაკლებების მენეჯმენტი" />

      {/* Header Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-4 sm:flex-row">
          <input
            type="text"
            placeholder="ძიება სახელით ან კოდით..."
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
            <option value="expired">ვადა გაუვიდა</option>
            <option value="upcoming">მომავალი</option>
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

      {/* Promotions Table */}
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                  სახელი
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                  ტიპი
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                  ღირებულება
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                  კოდი
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                  პერიოდი
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                  გამოყენება
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
              {filteredPromotions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-sm text-gray-500">
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
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {typeLabels[promo.type] || promo.type}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                        {promo.type === "percentage"
                          ? `${promo.value}%`
                          : promo.type === "fixed_amount"
                          ? `₾${promo.value.toFixed(2)}`
                          : `${promo.value} ცალი`}
                      </td>
                      <td className="px-6 py-4">
                        {promo.code ? (
                          <span className="inline-flex rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                            {promo.code}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                        <div>
                          {promo.startDate.toLocaleDateString("ka-GE")} -{" "}
                          {promo.endDate.toLocaleDateString("ka-GE")}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {promo.usageCount} / {promo.usageLimit || "∞"}
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
                            href={`/promotions/${promo.id}`}
                            className="rounded p-1 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
                            title="ნახვა"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </Link>
                          <Link
                            href={`/promotions/${promo.id}/edit`}
                            className="rounded p-1 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
                            title="რედაქტირება"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </Link>
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
