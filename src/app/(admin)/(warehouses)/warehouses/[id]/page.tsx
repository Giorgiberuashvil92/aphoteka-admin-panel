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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Link
            href={`/warehouses/${warehouseId}/inventory`}
            className="group rounded-lg border border-gray-200 bg-gray-50 p-4 transition-colors hover:border-brand-500 hover:bg-brand-50 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-brand-500 dark:hover:bg-gray-800"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">ინვენტარი</div>
                <div className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">
                  {stats.inventoryCount}
                </div>
              </div>
              <BoxIcon className="h-8 w-8 text-brand-500" />
            </div>
          </Link>
          <Link
            href={`/warehouses/${warehouseId}/orders`}
            className="group rounded-lg border border-gray-200 bg-gray-50 p-4 transition-colors hover:border-brand-500 hover:bg-brand-50 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-brand-500 dark:hover:bg-gray-800"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">შეკვეთები</div>
                <div className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">
                  {stats.ordersCount}
                </div>
              </div>
              <TaskIcon className="h-8 w-8 text-brand-500" />
            </div>
          </Link>
          <Link
            href={`/warehouses/${warehouseId}/employees`}
            className="group rounded-lg border border-gray-200 bg-gray-50 p-4 transition-colors hover:border-brand-500 hover:bg-brand-50 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-brand-500 dark:hover:bg-gray-800"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">თანამშრომლები</div>
                <div className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">
                  {stats.employeesCount}
                </div>
              </div>
              <GroupIcon className="h-8 w-8 text-brand-500" />
            </div>
          </Link>
        </div>

        {/* Quick Actions */}
        <div>
          <h4 className="mb-4 text-base font-semibold text-gray-900 dark:text-white">
            სწრაფი მოქმედებები
          </h4>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Link
              href={`/warehouses/${warehouseId}/receive`}
              className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-4 transition-colors hover:border-brand-500 hover:bg-brand-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-brand-500"
            >
              <PlusIcon className="h-5 w-5 text-brand-500" />
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                ინვენტარის მიღება
              </div>
            </Link>
            <Link
              href={`/warehouses/${warehouseId}/dispatch`}
              className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-4 transition-colors hover:border-brand-500 hover:bg-brand-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-brand-500"
            >
              <BoxIcon className="h-5 w-5 text-brand-500" />
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                ინვენტარის გაცემა
              </div>
            </Link>
            <Link
              href={`/products?warehouseId=${warehouseId}`}
              className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-4 transition-colors hover:border-brand-500 hover:bg-brand-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-brand-500"
            >
              <PlusIcon className="h-5 w-5 text-brand-500" />
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                პროდუქტის დამატება
              </div>
            </Link>
            <Link
              href={`/warehouses/${warehouseId}/reports`}
              className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-4 transition-colors hover:border-brand-500 hover:bg-brand-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-brand-500"
            >
              <EyeIcon className="h-5 w-5 text-brand-500" />
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                რეპორტების ნახვა
              </div>
            </Link>
          </div>
        </div>

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
