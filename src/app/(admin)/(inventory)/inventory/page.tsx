"use client";

import React, { useState } from "react";
import { Inventory, InventoryState } from "@/types";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import { PlusIcon, PencilIcon, EyeIcon } from "@/icons";
import Link from "next/link";

// Mock data
const mockInventory: Inventory[] = [
  {
    id: "1",
    productId: "1",
    product: {
      id: "1",
      name: "Paracetamol 500mg",
      price: 5.99,
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    batchNumber: "BATCH-2024-001",
    expiryDate: new Date("2025-12-31"),
    quantity: 1000,
    availableQuantity: 850,
    reservedQuantity: 150,
    state: InventoryState.AVAILABLE,
    warehouseLocation: "WAREHOUSE-1",
    warehouseName: "თბილისი - ცენტრალური",
    receivedDate: new Date("2024-01-15"),
    supplier: "Supplier ABC",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "2",
    productId: "1",
    product: {
      id: "1",
      name: "Paracetamol 500mg",
      price: 5.99,
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    batchNumber: "BATCH-2024-002",
    expiryDate: new Date("2025-06-30"),
    quantity: 500,
    availableQuantity: 500,
    reservedQuantity: 0,
    state: InventoryState.AVAILABLE,
    warehouseLocation: "WAREHOUSE-1",
    warehouseName: "თბილისი - ცენტრალური",
    receivedDate: new Date("2024-02-01"),
    supplier: "Supplier ABC",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const stateLabels: Record<InventoryState, string> = {
  [InventoryState.RECEIVED_BLOCKED]: "მიღებული (დაბლოკილი)",
  [InventoryState.AVAILABLE]: "ხელმისაწვდომი",
  [InventoryState.RESERVED]: "დაჯავშნილი",
  [InventoryState.PICKED]: "აირჩევა",
  [InventoryState.DISPATCHED]: "გაგზავნილი",
  [InventoryState.CONSUMED]: "გაყიდული",
  [InventoryState.EXPIRED]: "ვადა გაუვიდა",
  [InventoryState.REJECTED]: "უარყოფილი",
};

export default function InventoryPage() {
  const [inventory, setInventory] = useState<Inventory[]>(mockInventory);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterWarehouse, setFilterWarehouse] = useState<string>("all");
  const [filterState, setFilterState] = useState<string>("all");

  const filteredInventory = inventory.filter((item) => {
    const matchesSearch =
      item.product?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.batchNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesWarehouse =
      filterWarehouse === "all" || item.warehouseLocation === filterWarehouse;
    const matchesState = filterState === "all" || item.state === filterState;
    return matchesSearch && matchesWarehouse && matchesState;
  });

  const getDaysUntilExpiry = (expiryDate: Date) => {
    const today = new Date();
    const diffTime = expiryDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getExpiryStatus = (expiryDate: Date) => {
    const days = getDaysUntilExpiry(expiryDate);
    if (days < 0) return { label: "ვადა გაუვიდა", color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" };
    if (days < 60) return { label: `ვადა გადის ${days} დღეში`, color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" };
    return { label: `ვადა: ${expiryDate.toLocaleDateString("ka-GE")}`, color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" };
  };

  return (
    <div className="space-y-6">
      <PageBreadCrumb pageTitle="ინვენტარის მენეჯმენტი" />

      {/* Header Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-4 sm:flex-row">
          <input
            type="text"
            placeholder="ძიება პროდუქტში ან batch-ში..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          />
          <select
            value={filterWarehouse}
            onChange={(e) => setFilterWarehouse(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          >
            <option value="all">ყველა საწყობი</option>
            <option value="WAREHOUSE-1">თბილისი - ცენტრალური</option>
          </select>
          <select
            value={filterState}
            onChange={(e) => setFilterState(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          >
            <option value="all">ყველა სტატუსი</option>
            {Object.entries(stateLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <Link
          href="/inventory/receive"
          className="flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
        >
          <PlusIcon className="h-4 w-4" />
          ახალი მიღება
        </Link>
      </div>

      {/* Inventory Table */}
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                  პროდუქტი
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                  Batch #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                  რაოდენობა
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                  ვადა
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                  საწყობი
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
              {filteredInventory.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-sm text-gray-500">
                    ინვენტარი არ მოიძებნა
                  </td>
                </tr>
              ) : (
                filteredInventory.map((item) => {
                  const expiryStatus = getExpiryStatus(item.expiryDate);
                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {item.product?.name || "Unknown"}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {item.batchNumber}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <div className="font-medium text-gray-900 dark:text-white">
                            ხელმისაწვდომი: {item.availableQuantity}
                          </div>
                          <div className="text-gray-500 dark:text-gray-400">
                            დაჯავშნილი: {item.reservedQuantity} / სულ: {item.quantity}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${expiryStatus.color}`}>
                          {expiryStatus.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {item.warehouseName || item.warehouseLocation}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex rounded-full px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                          {stateLabels[item.state]}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/inventory/${item.id}`}
                            className="rounded p-1 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
                            title="ნახვა"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </Link>
                          <Link
                            href={`/inventory/${item.id}/adjust`}
                            className="rounded p-1 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
                            title="რეგულირება"
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
