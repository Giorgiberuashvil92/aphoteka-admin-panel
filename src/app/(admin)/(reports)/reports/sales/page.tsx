"use client";

import React, { useState } from "react";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";

export default function SalesReportsPage() {
  const [dateRange, setDateRange] = useState({
    start: "",
    end: "",
  });

  // Mock data
  const salesData = {
    totalSales: 125000,
    totalOrders: 1250,
    averageOrderValue: 100,
    topProducts: [
      { name: "Paracetamol 500mg", sales: 5000, quantity: 2500 },
      { name: "Ibuprofen 200mg", sales: 3500, quantity: 1500 },
    ],
  };

  return (
    <div className="space-y-6">
      <PageBreadCrumb pageTitle="გაყიდვების რეპორტი" />

      {/* Filters */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          ფილტრები
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              დაწყების თარიღი
            </label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              დასრულების თარიღი
            </label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div className="flex items-end">
            <button className="w-full rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600">
              რეპორტის გენერირება
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="text-sm text-gray-500 dark:text-gray-400">სულ გაყიდვები</div>
          <div className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
            ₾{salesData.totalSales.toLocaleString()}
          </div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="text-sm text-gray-500 dark:text-gray-400">შეკვეთების რაოდენობა</div>
          <div className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
            {salesData.totalOrders.toLocaleString()}
          </div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="text-sm text-gray-500 dark:text-gray-400">საშუალო შეკვეთის ღირებულება</div>
          <div className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
            ₾{salesData.averageOrderValue.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Top Products */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          ტოპ პროდუქტები
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                  პროდუქტი
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                  გაყიდული რაოდენობა
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                  გაყიდვების ჯამი
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {salesData.topProducts.map((product, index) => (
                <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                    {product.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {product.quantity.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                    ₾{product.sales.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
