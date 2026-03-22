"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Order, OrderStatus, PaymentStatus } from "@/types";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import { EyeIcon } from "@/icons";
import Link from "next/link";
import { warehousesApi, ordersApi } from "@/lib/api";

// Mock data
const mockOrders: Order[] = [
  {
    id: "ORD-001",
    userId: "user-1",
    user: {
      id: "user-1",
      role: "consumer" as any,
      phoneNumber: "+995555123456",
      fullName: "გიორგი ბერიძე",
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    status: OrderStatus.CONFIRMED,
    totalAmount: 25.50,
    deliveryFee: 5.00,
    paymentStatus: PaymentStatus.COMPLETED,
    deliveryAddress: "რუსთაველის გამზირი 1, თბილისი",
    deliveryCity: "თბილისი",
    deliveryPhone: "+995555123456",
    warehouseLocation: "WAREHOUSE-1",
    createdAt: new Date("2024-01-20T10:00:00"),
    updatedAt: new Date("2024-01-20T10:05:00"),
    confirmedAt: new Date("2024-01-20T10:05:00"),
    items: [
      {
        id: "1",
        orderId: "ORD-001",
        productId: "1",
        quantity: 2,
        priceAtOrderTime: 5.99,
        batchNumber: "BATCH-2024-001",
      },
      {
        id: "2",
        orderId: "ORD-001",
        productId: "2",
        quantity: 1,
        priceAtOrderTime: 7.50,
        batchNumber: "BATCH-2024-003",
      },
    ],
  },
  {
    id: "ORD-002",
    userId: "user-2",
    user: {
      id: "user-2",
      role: "consumer" as any,
      phoneNumber: "+995555654321",
      fullName: "ანა მელაძე",
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    status: OrderStatus.OUT_FOR_DELIVERY,
    totalAmount: 15.99,
    deliveryFee: 5.00,
    paymentStatus: PaymentStatus.COMPLETED,
    deliveryAddress: "აღმაშენებლის გამზირი 10, თბილისი",
    deliveryCity: "თბილისი",
    deliveryPhone: "+995555654321",
    warehouseLocation: "WAREHOUSE-1",
    createdAt: new Date("2024-01-20T09:00:00"),
    updatedAt: new Date("2024-01-20T11:00:00"),
    confirmedAt: new Date("2024-01-20T09:05:00"),
    packedAt: new Date("2024-01-20T10:30:00"),
    dispatchedAt: new Date("2024-01-20T11:00:00"),
    items: [
      {
        id: "3",
        orderId: "ORD-002",
        productId: "1",
        quantity: 1,
        priceAtOrderTime: 5.99,
        batchNumber: "BATCH-2024-001",
      },
    ],
  },
];

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

const statusColors: Record<OrderStatus, string> = {
  [OrderStatus.CREATED]: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
  [OrderStatus.CONFIRMED]: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  [OrderStatus.PACKED]: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  [OrderStatus.OUT_FOR_DELIVERY]: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  [OrderStatus.DELIVERED]: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  [OrderStatus.CANCELLED]: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  [OrderStatus.FAILED]: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

function OrdersPageContent() {
  const searchParams = useSearchParams();
  const warehouseId = searchParams.get("warehouseId") || undefined;
  
  const [orders, setOrders] = useState<Order[]>(mockOrders);
  const [warehouse, setWarehouse] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterPaymentStatus, setFilterPaymentStatus] = useState<string>("all");

  // Load warehouse info if warehouseId is provided
  useEffect(() => {
    if (warehouseId) {
      warehousesApi.getById(warehouseId).then(response => {
        setWarehouse(response.data);
      });
      // Load orders for this warehouse
      ordersApi.getAll({ warehouseId }).then(response => {
        setOrders(response.data || []);
      }).catch(() => {
        // Fallback to mock data
      });
    }
  }, [warehouseId]);

  const filteredOrders = orders.filter((order) => {
    // Filter by warehouse if warehouseId is provided
    if (warehouseId && order.warehouseLocation !== warehouseId) {
      return false;
    }
    
    const matchesSearch =
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.user?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.user?.phoneNumber.includes(searchTerm);
    const matchesStatus = filterStatus === "all" || order.status === filterStatus;
    const matchesPaymentStatus =
      filterPaymentStatus === "all" || order.paymentStatus === filterPaymentStatus;
    return matchesSearch && matchesStatus && matchesPaymentStatus;
  });

  return (
    <div className="space-y-6">
      <PageBreadCrumb pageTitle={warehouse ? `${warehouse.name} - შეკვეთები` : "შეკვეთების მენეჯმენტი"} />

      {/* Warehouse Filter Info */}
      {warehouse && (
        <div className="rounded-lg border border-brand-200 bg-brand-50 p-4 dark:border-brand-800 dark:bg-brand-900/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-brand-900 dark:text-brand-200">
                ფილტრი: {warehouse.name}
              </p>
              <p className="text-xs text-brand-700 dark:text-brand-300">
                ნაჩვენებია მხოლოდ ამ საწყობის შეკვეთები ({filteredOrders.length})
              </p>
            </div>
            <Link
              href="/orders"
              className="text-sm text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
            >
              ფილტრის მოხსნა
            </Link>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <input
          type="text"
          placeholder="ძიება შეკვეთის ID, მომხმარებლის სახელით ან ტელეფონით..."
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
                  თარიღი
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                  ჯამი
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                  სტატუსი
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                  გადახდა
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                  მოქმედებები
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-sm text-gray-500">
                    შეკვეთები არ მოიძებნა
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {order.id}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {order.items.length} პროდუქტი
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {order.user?.fullName || "Unknown"}
                        </div>
                        <div className="text-gray-500 dark:text-gray-400">
                          {order.user?.phoneNumber}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {order.createdAt.toLocaleDateString("ka-GE", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        ₾{order.totalAmount.toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        მიტანა: ₾{order.deliveryFee.toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${statusColors[order.status]}`}
                      >
                        {statusLabels[order.status]}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                          order.paymentStatus === PaymentStatus.COMPLETED
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            : order.paymentStatus === PaymentStatus.FAILED
                            ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                            : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                        }`}
                      >
                        {paymentStatusLabels[order.paymentStatus]}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/orders/${order.id}`}
                        className="inline-flex items-center gap-1 rounded p-1 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
                        title="ნახვა"
                      >
                        <EyeIcon className="h-4 w-4" />
                        <span className="text-sm">ნახვა</span>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function OrdersPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[200px] items-center justify-center text-gray-500">
          იტვირთება...
        </div>
      }
    >
      <OrdersPageContent />
    </Suspense>
  );
}
