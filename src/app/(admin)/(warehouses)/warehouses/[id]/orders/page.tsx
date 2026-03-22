"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import { Order, OrderStatus, PaymentStatus } from "@/types";
import { ordersApi } from "@/lib/api";
import { EyeIcon } from "@/icons";
import Link from "next/link";

const statusLabels: Record<OrderStatus, string> = {
  [OrderStatus.CREATED]: "შექმნილი",
  [OrderStatus.CONFIRMED]: "დადასტურებული",
  [OrderStatus.PACKED]: "დაფასული",
  [OrderStatus.OUT_FOR_DELIVERY]: "გზაში",
  [OrderStatus.DELIVERED]: "მიწოდებული",
  [OrderStatus.CANCELLED]: "გაუქმებული",
  [OrderStatus.FAILED]: "შეცდომა",
};

const paymentStatusLabels: Record<PaymentStatus, string> = {
  [PaymentStatus.PENDING]: "მოლოდინში",
  [PaymentStatus.PROCESSING]: "დამუშავებაში",
  [PaymentStatus.COMPLETED]: "გადახდილი",
  [PaymentStatus.FAILED]: "შეცდომა",
  [PaymentStatus.REFUNDED]: "დაბრუნებული",
};

export default function WarehouseOrdersPage() {
  const params = useParams();
  const warehouseId = params.id as string;

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterPaymentStatus, setFilterPaymentStatus] = useState<string>("all");

  useEffect(() => {
    loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [warehouseId]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const response = await ordersApi.getAll({});
      // Filter orders by warehouseLocation
      const warehouseOrders = response.data.filter(
        (order) => order.warehouseLocation === warehouseId
      );
      setOrders(warehouseOrders);
    } catch (err) {
      console.error("Error loading orders:", err);
    } finally {
      setLoading(false);
    }
  };

  // Filter orders
  const filteredOrders = useMemo(() => {
    let filtered = orders;

    if (filterStatus !== "all") {
      filtered = filtered.filter((order) => order.status === filterStatus);
    }

    if (filterPaymentStatus !== "all") {
      filtered = filtered.filter(
        (order) => order.paymentStatus === filterPaymentStatus
      );
    }

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (order) =>
          order.id.toLowerCase().includes(search) ||
          order.deliveryAddress.toLowerCase().includes(search) ||
          order.user?.fullName?.toLowerCase().includes(search) ||
          order.user?.phoneNumber.toLowerCase().includes(search)
      );
    }

    return filtered;
  }, [orders, filterStatus, filterPaymentStatus, searchTerm]);

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.CREATED:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
      case OrderStatus.CONFIRMED:
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case OrderStatus.PACKED:
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      case OrderStatus.OUT_FOR_DELIVERY:
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case OrderStatus.DELIVERED:
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case OrderStatus.CANCELLED:
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case OrderStatus.FAILED:
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const getPaymentStatusColor = (status: PaymentStatus) => {
    switch (status) {
      case PaymentStatus.PENDING:
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case PaymentStatus.PROCESSING:
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case PaymentStatus.COMPLETED:
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case PaymentStatus.FAILED:
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case PaymentStatus.REFUNDED:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
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
      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <input
          type="text"
          placeholder="ძიება შეკვეთაში..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        >
          <option value="all">ყველა სტატუსი</option>
          {Object.entries(statusLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <select
          value={filterPaymentStatus}
          onChange={(e) => setFilterPaymentStatus(e.target.value)}
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        >
          <option value="all">ყველა გადახდის სტატუსი</option>
          {Object.entries(paymentStatusLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* Orders Table */}
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="border-b border-gray-200 bg-gray-50 px-6 py-4 dark:border-gray-700 dark:bg-gray-900">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            შეკვეთები ({filteredOrders.length})
          </h2>
        </div>
        {filteredOrders.length === 0 ? (
          <div className="px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
            შეკვეთები არ მოიძებნა
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                    შეკვეთის ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                    მომხმარებელი
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                    მისამართი
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                    სულ თანხა
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                    სტატუსი
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                    გადახდის სტატუსი
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                    თარიღი
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                    მოქმედებები
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900 dark:text-white">
                        #{order.id.slice(0, 8)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {order.user?.fullName || "უცნობი"}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {order.user?.phoneNumber}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                      {order.deliveryAddress}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {order.totalAmount.toFixed(2)} ₾
                      </div>
                      {order.deliveryFee > 0 && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          + მიწოდება: {order.deliveryFee.toFixed(2)} ₾
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(
                          order.status
                        )}`}
                      >
                        {statusLabels[order.status]}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${getPaymentStatusColor(
                          order.paymentStatus
                        )}`}
                      >
                        {paymentStatusLabels[order.paymentStatus]}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {new Date(order.createdAt).toLocaleDateString("ka-GE")}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/orders/${order.id}`}
                        className="inline-flex items-center gap-1 rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-600"
                        title="ნახვა"
                      >
                        <EyeIcon className="h-3.5 w-3.5" />
                        ნახვა
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
