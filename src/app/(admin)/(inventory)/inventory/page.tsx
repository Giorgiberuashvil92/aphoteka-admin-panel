"use client";

import React, { useState, useMemo } from "react";
import { Inventory, InventoryState, Warehouse } from "@/types";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import { PlusIcon, BoxIcon } from "@/icons";
import Link from "next/link";
import { mockInventory, mockWarehouses } from "@/lib/api/mockData";

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
  const [inventory] = useState<Inventory[]>(mockInventory);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterWarehouse, setFilterWarehouse] = useState<string>("all");
  const [filterState, setFilterState] = useState<string>("all");

  // საწყობების მონაცემების დაჯგუფება
  const warehouseData = useMemo(() => {
    // დაჯგუფება საწყობების მიხედვით
    const warehouses = filterWarehouse === "all" 
      ? mockWarehouses 
      : mockWarehouses.filter(w => w.id === filterWarehouse);

    const result: { warehouse: Warehouse; itemCount: number }[] = [];

    warehouses.forEach(warehouse => {
      const warehouseInventory = inventory.filter(item => {
        if (item.warehouseLocation !== warehouse.id) return false;
        if (filterState !== "all" && item.state !== filterState) return false;
        
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = 
          !searchTerm ||
          item.product?.name.toLowerCase().includes(searchLower) ||
          item.batchNumber.toLowerCase().includes(searchLower) ||
          item.product?.genericName?.toLowerCase().includes(searchLower) ||
          item.product?.manufacturer?.toLowerCase().includes(searchLower) ||
          item.product?.strength?.toLowerCase().includes(searchLower);

        return matchesSearch;
      });
      
      if (warehouseInventory.length === 0 && searchTerm) return; // თუ ძიებაა და არაფერი მოიძებნა, არ ჩანდეს
      if (filterWarehouse !== "all" && warehouseInventory.length === 0) return;

      result.push({
        warehouse,
        itemCount: warehouseInventory.length,
      });
    });

    return result;
  }, [inventory, searchTerm, filterWarehouse, filterState]);



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
            {mockWarehouses.map(warehouse => (
              <option key={warehouse.id} value={warehouse.id}>
                {warehouse.name}
              </option>
            ))}
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

      {/* საწყობების ქარდები */}
      {warehouseData.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white px-6 py-8 text-center text-sm text-gray-500 shadow-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
          ინვენტარი არ მოიძებნა
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
          {warehouseData.map((warehouseInfo) => (
            <Link
              key={warehouseInfo.warehouse.id}
              href={`/inventory/warehouse/${warehouseInfo.warehouse.id}`}
              className="group overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
            >
              {/* საწყობის header */}
              <div className="border-b border-gray-200 bg-gray-50 px-6 py-4 transition-colors group-hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-900 dark:group-hover:bg-gray-800">
                <div className="flex items-center gap-3">
                  <BoxIcon className="h-5 w-5 text-brand-500" />
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {warehouseInfo.warehouse.name}
                    </h3>
                    {warehouseInfo.warehouse.address && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {warehouseInfo.warehouse.address}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* საწყობის სტატისტიკა */}
              <div className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    პროდუქტების რაოდენობა
                  </span>
                  <span className="text-lg font-semibold text-gray-900 dark:text-white">
                    {warehouseInfo.itemCount}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
