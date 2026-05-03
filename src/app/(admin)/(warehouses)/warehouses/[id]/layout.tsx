"use client";

import React, { useState, useEffect } from "react";
import { useParams, usePathname } from "next/navigation";
import { Warehouse } from "@/types";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import { BoxIcon, PencilIcon } from "@/icons";
import Link from "next/link";
import { warehousesApi } from "@/lib/api";

export default function WarehouseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const pathname = usePathname();
  const warehouseId = params.id as string;
  const [warehouse, setWarehouse] = useState<Warehouse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadWarehouse();
  }, [warehouseId]);

  const loadWarehouse = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await warehousesApi.getById(warehouseId);
      setWarehouse(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "შეცდომა მონაცემების ჩატვირთვისას");
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: "overview", name: "მიმოხილვა", path: `/warehouses/${warehouseId}` },
    { id: "orders", name: "შეკვეთები", path: `/warehouses/${warehouseId}/orders` },
    { id: "employees", name: "თანამშრომლები", path: `/warehouses/${warehouseId}/employees` },
    { id: "reports", name: "რეპორტები", path: `/warehouses/${warehouseId}/reports` },
  ];

  // Determine active tab based on pathname
  const getActiveTab = () => {
    if (pathname === `/warehouses/${warehouseId}`) return "overview";
    for (const tab of tabs) {
      if (pathname === tab.path) return tab.id;
    }
    return "overview";
  };

  const activeTab = getActiveTab();

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

  if (error || !warehouse) {
    return (
      <div className="space-y-6">
        <PageBreadCrumb pageTitle="საწყობის დეტალები" />
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 dark:border-red-800 dark:bg-red-900/20">
          <p className="text-red-800 dark:text-red-200">
            {error || "საწყობი არ მოიძებნა"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageBreadCrumb pageTitle={warehouse.name} />
        <div className="flex items-center gap-2">
          <Link
            href={`/warehouses/${warehouseId}/edit`}
            className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            <PencilIcon className="h-4 w-4" />
            რედაქტირება
          </Link>
        </div>
      </div>

      {/* Warehouse Info Card */}
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="border-b border-gray-200 bg-gray-50 px-6 py-4 dark:border-gray-700 dark:bg-gray-900">
          <div className="flex items-center gap-3">
            <BoxIcon className="h-6 w-6 text-brand-500" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {warehouse.name}
            </h2>
            <span
              className={`ml-auto inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                warehouse.active
                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                  : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
              }`}
            >
              {warehouse.active ? "აქტიური" : "არააქტიური"}
            </span>
          </div>
        </div>
        <div className="px-6 py-4">
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {warehouse.address && (
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  მისამართი
                </dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                  {warehouse.address}
                </dd>
              </div>
            )}
            {warehouse.city && (
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  ქალაქი
                </dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                  {warehouse.city}
                </dd>
              </div>
            )}
            {warehouse.phoneNumber && (
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  ტელეფონი
                </dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                  {warehouse.phoneNumber}
                </dd>
              </div>
            )}
            {warehouse.email && (
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Email
                </dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                  {warehouse.email}
                </dd>
              </div>
            )}
            {warehouse.manager && (
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  მენეჯერი
                </dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                  {warehouse.manager.fullName || warehouse.manager.phoneNumber}
                </dd>
              </div>
            )}
          </dl>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <Link
                key={tab.id}
                href={tab.path}
                className={`whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium transition-colors ${
                  isActive
                    ? "border-brand-500 text-brand-600 dark:text-brand-400"
                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                }`}
              >
                {tab.name}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {children}
    </div>
  );
}
