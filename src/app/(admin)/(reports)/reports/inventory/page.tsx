"use client";

import React, { useState } from "react";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";

export default function InventoryReportsPage() {
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>("all");

  // Mock data
  const inventoryData = {
    totalValue: 500000,
    totalItems: 15000,
    lowStockItems: 25,
    expiringSoon: 10,
    stockMovements: [
      {
        id: "1",
        product: "Paracetamol 500mg",
        batch: "BATCH-2024-001",
        movementType: "inbound",
        quantity: 1000,
        date: new Date("2024-01-15"),
      },
      {
        id: "2",
        product: "Ibuprofen 200mg",
        batch: "BATCH-2024-002",
        movementType: "outbound",
        quantity: -50,
        date: new Date("2024-01-18"),
      },
    ],
  };

  const movementTypeLabels: Record<string, string> = {
    inbound: "მიღება",
    outbound: "გაყიდვა",
    adjustment: "რეგულირება",
    reservation: "დაჯავშნა",
    release: "გათავისუფლება",
    expiry: "ვადის გასვლა",
  };

  return (
    <div className="space-y-6">
      <PageBreadCrumb pageTitle="ინვენტარის რეპორტი" />

      {/* Filters */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          ფილტრები
        </h2>
        <div className="flex gap-4">
          <select
            value={selectedWarehouse}
            onChange={(e) => setSelectedWarehouse(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          >
            <option value="all">ყველა საწყობი</option>
            <option value="WAREHOUSE-1">თბილისი - ცენტრალური</option>
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="text-sm text-gray-500 dark:text-gray-400">ინვენტარის ჯამური ღირებულება</div>
          <div className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
            ₾{inventoryData.totalValue.toLocaleString()}
          </div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="text-sm text-gray-500 dark:text-gray-400">სულ ერთეული</div>
          <div className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
            {inventoryData.totalItems.toLocaleString()}
          </div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="text-sm text-gray-500 dark:text-gray-400">დაბალი მარაგი</div>
          <div className="mt-2 text-2xl font-bold text-yellow-600 dark:text-yellow-400">
            {inventoryData.lowStockItems}
          </div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="text-sm text-gray-500 dark:text-gray-400">ვადა გადის მალე</div>
          <div className="mt-2 text-2xl font-bold text-red-600 dark:text-red-400">
            {inventoryData.expiringSoon}
          </div>
        </div>
      </div>

      {/* Stock Movements */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          მარაგის მოძრაობები
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                  თარიღი
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                  პროდუქტი
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                  Batch
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                  ტიპი
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                  რაოდენობა
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {inventoryData.stockMovements.map((movement) => (
                <tr key={movement.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {movement.date.toLocaleDateString("ka-GE")}
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                    {movement.product}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {movement.batch}
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex rounded-full px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      {movementTypeLabels[movement.movementType] || movement.movementType}
                    </span>
                  </td>
                  <td
                    className={`px-6 py-4 font-medium ${
                      movement.quantity > 0
                        ? "text-green-600 dark:text-green-400"
                        : "text-red-600 dark:text-red-400"
                    }`}
                  >
                    {movement.quantity > 0 ? "+" : ""}
                    {movement.quantity}
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
