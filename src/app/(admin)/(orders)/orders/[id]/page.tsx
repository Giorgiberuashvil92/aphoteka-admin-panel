"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Order, OrderStatus, PaymentStatus } from "@/types";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";

// Mock data - სამომავლოდ API-დან მოვა
const mockOrder: Order = {
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
      product: {
        id: "1",
        productStrengthId: "ps-1",
        sku: "SKU-001",
        name: "Paracetamol 500mg",
        price: 5.99,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      quantity: 2,
      priceAtOrderTime: 5.99,
      batchNumber: "BATCH-2024-001",
    },
    {
      id: "2",
      orderId: "ORD-001",
      productId: "2",
      product: {
        id: "2",
        productStrengthId: "ps-2",
        sku: "SKU-002",
        name: "Ibuprofen 200mg",
        price: 7.50,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      quantity: 1,
      priceAtOrderTime: 7.50,
      batchNumber: "BATCH-2024-003",
    },
  ],
};

const statusLabels: Record<OrderStatus, string> = {
  [OrderStatus.CREATED]: "შექმნილი",
  [OrderStatus.CONFIRMED]: "დადასტურებული",
  [OrderStatus.PACKED]: "დაფასული",
  [OrderStatus.OUT_FOR_DELIVERY]: "გზაში",
  [OrderStatus.DELIVERED]: "მიწოდებული",
  [OrderStatus.CANCELLED]: "გაუქმებული",
  [OrderStatus.FAILED]: "შეცდომა",
};

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<Order>(mockOrder);
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus>(order.status);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleStatusUpdate = async () => {
    if (selectedStatus === order.status) return;

    setIsUpdating(true);
    // TODO: API call to update order status
    console.log("Updating order status:", selectedStatus);

    setTimeout(() => {
      setOrder({ ...order, status: selectedStatus });
      setIsUpdating(false);
    }, 1000);
  };

  const getNextStatuses = (currentStatus: OrderStatus): OrderStatus[] => {
    const statusFlow: Record<OrderStatus, OrderStatus[]> = {
      [OrderStatus.CREATED]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
      [OrderStatus.CONFIRMED]: [OrderStatus.PACKED, OrderStatus.CANCELLED],
      [OrderStatus.PACKED]: [OrderStatus.OUT_FOR_DELIVERY, OrderStatus.CANCELLED],
      [OrderStatus.OUT_FOR_DELIVERY]: [OrderStatus.DELIVERED, OrderStatus.FAILED],
      [OrderStatus.DELIVERED]: [],
      [OrderStatus.CANCELLED]: [],
      [OrderStatus.FAILED]: [],
    };
    return statusFlow[currentStatus] || [];
  };

  const nextStatuses = getNextStatuses(order.status);

  return (
    <div className="space-y-6">
      <PageBreadCrumb pageTitle={`შეკვეთა #${order.id}`} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              შეკვეთის პროდუქტები
            </h2>
            <div className="space-y-4">
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between border-b border-gray-200 pb-4 last:border-0 dark:border-gray-700"
                >
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 dark:text-white">
                      {item.product?.name || "Unknown Product"}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Batch: {item.batchNumber || "N/A"} | რაოდენობა: {item.quantity}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-gray-900 dark:text-white">
                      ₾{(item.priceAtOrderTime * item.quantity).toFixed(2)}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      ₾{item.priceAtOrderTime.toFixed(2)} / ერთეული
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-gray-200 pt-4 dark:border-gray-700">
              <span className="text-lg font-semibold text-gray-900 dark:text-white">
                სულ:
              </span>
              <span className="text-lg font-semibold text-gray-900 dark:text-white">
                ₾{order.totalAmount.toFixed(2)}
              </span>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              მიტანის ინფორმაცია
            </h2>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-500 dark:text-gray-400">მისამართი: </span>
                <span className="text-gray-900 dark:text-white">{order.deliveryAddress}</span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">ქალაქი: </span>
                <span className="text-gray-900 dark:text-white">{order.deliveryCity}</span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">ტელეფონი: </span>
                <span className="text-gray-900 dark:text-white">{order.deliveryPhone}</span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">მიტანის საფასური: </span>
                <span className="text-gray-900 dark:text-white">₾{order.deliveryFee.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Order Status */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              შეკვეთის სტატუსი
            </h2>
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  მიმდინარე სტატუსი
                </label>
                <div className="rounded-lg bg-gray-50 px-4 py-2 text-sm font-medium text-gray-900 dark:bg-gray-700 dark:text-white">
                  {statusLabels[order.status]}
                </div>
              </div>

              {nextStatuses.length > 0 && (
                <>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      შემდეგი სტატუსი
                    </label>
                    <select
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value as OrderStatus)}
                      className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    >
                      <option value={order.status}>{statusLabels[order.status]}</option>
                      {nextStatuses.map((status) => (
                        <option key={status} value={status}>
                          {statusLabels[status]}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={handleStatusUpdate}
                    disabled={isUpdating || selectedStatus === order.status}
                    className="w-full rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
                  >
                    {isUpdating ? "განახლება..." : "სტატუსის განახლება"}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Order Info */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              ინფორმაცია
            </h2>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-500 dark:text-gray-400">მომხმარებელი: </span>
                <span className="text-gray-900 dark:text-white">{order.user?.fullName}</span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">ტელეფონი: </span>
                <span className="text-gray-900 dark:text-white">{order.user?.phoneNumber}</span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">შექმნის თარიღი: </span>
                <span className="text-gray-900 dark:text-white">
                  {order.createdAt.toLocaleDateString("ka-GE", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              {order.confirmedAt && (
                <div>
                  <span className="text-gray-500 dark:text-gray-400">დადასტურების თარიღი: </span>
                  <span className="text-gray-900 dark:text-white">
                    {order.confirmedAt.toLocaleDateString("ka-GE", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              )}
              <div>
                <span className="text-gray-500 dark:text-gray-400">გადახდის სტატუსი: </span>
                <span
                  className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                    order.paymentStatus === PaymentStatus.COMPLETED
                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                      : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                  }`}
                >
                  {order.paymentStatus === PaymentStatus.COMPLETED ? "გადახდილი" : "მოლოდინში"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
