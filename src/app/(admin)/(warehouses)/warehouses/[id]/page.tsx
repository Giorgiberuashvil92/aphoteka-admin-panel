"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { PlusIcon, EyeIcon, TaskIcon, GroupIcon, BoxIcon } from "@/icons";
import Link from "next/link";
import { inventoryApi, ordersApi, warehousesApi } from "@/lib/api";

export default function WarehouseOverviewPage() {
  const params = useParams();
  const warehouseId = params.id as string;
  const [stats, setStats] = useState({
    inventoryCount: 0,
    ordersCount: 0,
    employeesCount: 0,
  });

  useEffect(() => {
    loadStats();
  }, [warehouseId]);

  const loadStats = async () => {
    try {
      // Load inventory count
      const inventoryResponse = await inventoryApi.getAll({ warehouseId });
      const inventoryCount = inventoryResponse.data.length;

      // Load orders count
      const ordersResponse = await ordersApi.getAll({ warehouseId });
      const ordersCount = ordersResponse.data?.length || 0;

      // Load employees count
      const employeesResponse = await warehousesApi.getEmployees(warehouseId);
      const employeesCount = employeesResponse.data.length;

      setStats({
        inventoryCount,
        ordersCount,
        employeesCount,
      });
    } catch (err) {
      console.error("Error loading stats:", err);
    }
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          საწყობის მიმოხილვა
        </h3>

        {/* Stats Cards */}
       

        {/* Quick Actions */}
    

        {/* Quick Links */}
        <div>
          <h4 className="mb-4 text-base font-semibold text-gray-900 dark:text-white">
            სწრაფი ბმულები
          </h4>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Link
              href={`/warehouses/${warehouseId}/inventory`}
              className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3 transition-colors hover:border-brand-500 hover:bg-brand-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-brand-500"
            >
              <span className="text-sm text-gray-700 dark:text-gray-300">ინვენტარის სია</span>
              <EyeIcon className="h-4 w-4 text-gray-400" />
            </Link>
            <Link
              href={`/warehouses/${warehouseId}/orders`}
              className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3 transition-colors hover:border-brand-500 hover:bg-brand-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-brand-500"
            >
              <span className="text-sm text-gray-700 dark:text-gray-300">შეკვეთების სია</span>
              <EyeIcon className="h-4 w-4 text-gray-400" />
            </Link>
            <Link
              href={`/orders?warehouseId=${warehouseId}`}
              className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3 transition-colors hover:border-brand-500 hover:bg-brand-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-brand-500"
            >
              <span className="text-sm text-gray-700 dark:text-gray-300">ყველა შეკვეთა (ამ საწყობის)</span>
              <EyeIcon className="h-4 w-4 text-gray-400" />
            </Link>
            <Link
              href={`/products?warehouseId=${warehouseId}`}
              className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3 transition-colors hover:border-brand-500 hover:bg-brand-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-brand-500"
            >
              <span className="text-sm text-gray-700 dark:text-gray-300">პროდუქტები (ამ საწყობის)</span>
              <EyeIcon className="h-4 w-4 text-gray-400" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
