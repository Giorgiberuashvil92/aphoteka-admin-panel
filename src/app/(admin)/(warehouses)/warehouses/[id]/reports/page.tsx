"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { inventoryApi, ordersApi } from "@/lib/api";
import { Inventory, Order, OrderStatus } from "@/types";
import { EyeIcon, DownloadIcon } from "@/icons";

export default function WarehouseReportsPage() {
  const params = useParams();
  const warehouseId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalInventory: 0,
    totalValue: 0,
    totalOrders: 0,
    totalRevenue: 0,
    lowStockItems: 0,
    expiringSoonItems: 0,
  });

  useEffect(() => {
    loadReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [warehouseId]);

  const loadReports = async () => {
    try {
      setLoading(true);

      // Load inventory
      const inventoryResponse = await inventoryApi.getAll({ warehouseId });
      const inventory: Inventory[] = inventoryResponse.data;

      // Load orders
      const ordersResponse = await ordersApi.getAll({});
      const warehouseOrders: Order[] = ordersResponse.data.filter(
        (order) => order.warehouseLocation === warehouseId
      );

      // Calculate stats
      const totalInventory = inventory.length;
      const totalValue = inventory.reduce(
        (sum, inv) => sum + (inv.product?.price || 0) * inv.availableQuantity,
        0
      );
      const totalOrders = warehouseOrders.length;
      const totalRevenue = warehouseOrders
        .filter((order) => order.status === OrderStatus.DELIVERED)
        .reduce((sum, order) => sum + order.totalAmount, 0);

      // Low stock items (availableQuantity < 10)
      const lowStockItems = inventory.filter(
        (inv) => inv.availableQuantity < 10
      ).length;

      // Expiring soon items (within 60 days)
      const today = new Date();
      const sixtyDaysFromNow = new Date();
      sixtyDaysFromNow.setDate(today.getDate() + 60);
      const expiringSoonItems = inventory.filter((inv) => {
        const expiryDate = new Date(inv.expiryDate);
        return expiryDate <= sixtyDaysFromNow && expiryDate >= today;
      }).length;

      setStats({
        totalInventory,
        totalValue,
        totalOrders,
        totalRevenue,
        lowStockItems,
        expiringSoonItems,
      });
    } catch (err) {
      console.error("Error loading reports:", err);
    } finally {
      setLoading(false);
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
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          რეპორტები
        </h2>
        <button
          onClick={() => {
            alert("რეპორტის ექსპორტის ფუნქციონალი მალე დაემატება");
          }}
          className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
        >
          <DownloadIcon className="h-4 w-4" />
          ექსპორტი
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                სულ ინვენტარი
              </p>
              <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">
                {stats.totalInventory}
              </p>
            </div>
            <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-900">
              <EyeIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                ინვენტარის ღირებულება
              </p>
              <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">
                {stats.totalValue.toFixed(2)} ₾
              </p>
            </div>
            <div className="rounded-full bg-green-100 p-3 dark:bg-green-900">
              <DownloadIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                სულ შეკვეთები
              </p>
              <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">
                {stats.totalOrders}
              </p>
            </div>
            <div className="rounded-full bg-purple-100 p-3 dark:bg-purple-900">
              <EyeIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                სულ შემოსავალი
              </p>
              <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">
                {stats.totalRevenue.toFixed(2)} ₾
              </p>
            </div>
            <div className="rounded-full bg-yellow-100 p-3 dark:bg-yellow-900">
              <DownloadIcon className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                დაბალი მარაგი
              </p>
              <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">
                {stats.lowStockItems}
              </p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                &lt; 10 ერთეული
              </p>
            </div>
            <div className="rounded-full bg-red-100 p-3 dark:bg-red-900">
              <EyeIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                ვადა გადის მალე
              </p>
              <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">
                {stats.expiringSoonItems}
              </p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                &lt; 60 დღე
              </p>
            </div>
            <div className="rounded-full bg-orange-100 p-3 dark:bg-orange-900">
              <EyeIcon className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Additional Reports Section */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          დეტალური რეპორტები
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <button
            onClick={() => {
              alert("ინვენტარის რეპორტის ფუნქციონალი მალე დაემატება");
            }}
            className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 transition-colors hover:border-brand-500 hover:bg-brand-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-brand-500"
          >
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              ინვენტარის რეპორტი
            </span>
            <EyeIcon className="h-4 w-4 text-gray-400" />
          </button>
          <button
            onClick={() => {
              alert("გაყიდვების რეპორტის ფუნქციონალი მალე დაემატება");
            }}
            className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 transition-colors hover:border-brand-500 hover:bg-brand-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-brand-500"
          >
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              გაყიდვების რეპორტი
            </span>
            <EyeIcon className="h-4 w-4 text-gray-400" />
          </button>
          <button
            onClick={() => {
              alert("მოძრაობის რეპორტის ფუნქციონალი მალე დაემატება");
            }}
            className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 transition-colors hover:border-brand-500 hover:bg-brand-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-brand-500"
          >
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              მოძრაობის რეპორტი
            </span>
            <EyeIcon className="h-4 w-4 text-gray-400" />
          </button>
          <button
            onClick={() => {
              alert("ვადის გასვლის რეპორტის ფუნქციონალი მალე დაემატება");
            }}
            className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 transition-colors hover:border-brand-500 hover:bg-brand-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-brand-500"
          >
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              ვადის გასვლის რეპორტი
            </span>
            <EyeIcon className="h-4 w-4 text-gray-400" />
          </button>
        </div>
      </div>
    </div>
  );
}
