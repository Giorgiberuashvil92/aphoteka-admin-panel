"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Order, OrderStatus, PaymentStatus, User, UserRole } from "@/types";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import {
  BogOrderCallbackView,
  hasBogDisplayData,
} from "@/components/orders/BogOrderCallbackView";
import { authApi, ordersApi } from "@/lib/api";
import { ApiError } from "@/lib/api/client";

function userWarehouseId(u: User | null): string | undefined {
  if (!u?.warehouseId) return undefined;
  const w = u.warehouseId as unknown;
  if (typeof w === "object" && w !== null && "_id" in w) {
    return String((w as { _id: unknown })._id);
  }
  return String(u.warehouseId);
}

const statusLabels: Record<OrderStatus, string> = {
  [OrderStatus.CREATED]: "მოლოდინში",
  [OrderStatus.CONFIRMED]: "დადასტურებული",
  [OrderStatus.PACKED]: "დაფასოებული",
  [OrderStatus.OUT_FOR_DELIVERY]: "გზაში",
  [OrderStatus.DELIVERED]: "მიწოდებული",
  [OrderStatus.CANCELLED]: "გაუქმებული",
  [OrderStatus.FAILED]: "შეცდომა",
};

const paymentLabel = (p: PaymentStatus) => {
  switch (p) {
    case PaymentStatus.COMPLETED:
      return "გადახდილი";
    case PaymentStatus.FAILED:
      return "შეცდომა";
    case PaymentStatus.PROCESSING:
      return "დამუშავებაში";
    case PaymentStatus.REFUNDED:
      return "დაბრუნებული";
    default:
      return "მოლოდინში";
  }
};

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = typeof params.id === "string" ? params.id : params.id?.[0];

  const [order, setOrder] = useState<Order | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus>(OrderStatus.CREATED);
  const [isUpdating, setIsUpdating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [panelUser, setPanelUser] = useState<User | null>(null);

  const loadOrder = useCallback(async () => {
    if (!orderId) {
      setError("შეკვეთის ID არ არის");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const me = await authApi.getCurrentUser();
      setPanelUser(me);
      const res =
        me.role === UserRole.WAREHOUSE_STAFF
          ? await ordersApi.getWarehouseOrderById(orderId)
          : await ordersApi.getById(orderId);
      setOrder(res.data);
      setSelectedStatus(res.data.status);
    } catch (e) {
      setOrder(null);
      if (e instanceof ApiError) {
        setError(
          typeof e.data?.message === "string"
            ? e.data.message
            : `შეკვეთა ვერ ჩაიტვირთა (${e.status})`,
        );
      } else {
        setError("შეკვეთა ვერ ჩაიტვირთა");
      }
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    loadOrder();
  }, [loadOrder]);

  const handleStatusUpdate = async () => {
    if (!orderId || !order || selectedStatus === order.status) return;

    const isWarehouse = panelUser?.role === UserRole.WAREHOUSE_STAFF;
    const balanceOnShipped =
      selectedStatus === OrderStatus.OUT_FOR_DELIVERY &&
      order.status !== OrderStatus.OUT_FOR_DELIVERY;
    if (balanceOnShipped) {
      window.alert(
        "სტატუსი „გზაში“ (გაგზავნილი): სისტემა ეცდება გაყიდვის ჩაწერას Balance-ში, თუ გადახდა დასრულებულია და ეს შეკვეთა ჯერ არ არის ჩაწერილი იქ.",
      );
    }

    setIsUpdating(true);
    try {
      const res = isWarehouse
        ? await ordersApi.updateWarehouseOrderStatus(orderId, selectedStatus)
        : await ordersApi.updateStatus(orderId, selectedStatus);
      setOrder(res.data);
      setSelectedStatus(res.data.status);
    } catch (e) {
      const msg =
        e instanceof ApiError && typeof e.data?.message === "string"
          ? e.data.message
          : "სტატუსის განახლება ვერ მოხერხდა";
      window.alert(msg);
    } finally {
      setIsUpdating(false);
    }
  };

  const getNextStatuses = (currentStatus: OrderStatus): OrderStatus[] => {
    const isWarehouse = panelUser?.role === UserRole.WAREHOUSE_STAFF;
    if (isWarehouse) {
      const whFlow: Record<OrderStatus, OrderStatus[]> = {
        [OrderStatus.CREATED]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
        [OrderStatus.CONFIRMED]: [OrderStatus.OUT_FOR_DELIVERY, OrderStatus.CANCELLED],
        [OrderStatus.PACKED]: [OrderStatus.OUT_FOR_DELIVERY, OrderStatus.CANCELLED],
        [OrderStatus.OUT_FOR_DELIVERY]: [OrderStatus.DELIVERED, OrderStatus.CANCELLED],
        [OrderStatus.DELIVERED]: [],
        [OrderStatus.CANCELLED]: [],
        [OrderStatus.FAILED]: [],
      };
      return whFlow[currentStatus] ?? [];
    }
    const statusFlow: Record<OrderStatus, OrderStatus[]> = {
      [OrderStatus.CREATED]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
      [OrderStatus.CONFIRMED]: [
        OrderStatus.PACKED,
        OrderStatus.OUT_FOR_DELIVERY,
        OrderStatus.CANCELLED,
      ],
      [OrderStatus.PACKED]: [OrderStatus.OUT_FOR_DELIVERY, OrderStatus.CANCELLED],
      [OrderStatus.OUT_FOR_DELIVERY]: [OrderStatus.DELIVERED, OrderStatus.CANCELLED],
      [OrderStatus.DELIVERED]: [],
      [OrderStatus.CANCELLED]: [],
      [OrderStatus.FAILED]: [],
    };
    return statusFlow[currentStatus] ?? [];
  };

  const whIdNav = userWarehouseId(panelUser);
  const ordersListHref =
    panelUser?.role === UserRole.WAREHOUSE_STAFF && whIdNav
      ? `/warehouses/${whIdNav}/orders`
      : "/orders";

  if (loading) {
    return (
      <div className="flex min-h-[240px] items-center justify-center text-gray-500">
        იტვირთება...
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="space-y-4">
        <PageBreadCrumb pageTitle="შეკვეთა" />
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200">
          {error || "შეკვეთა ვერ მოიძებნა"}
        </div>
        <button
          type="button"
          onClick={() => router.push(ordersListHref)}
          className="text-sm text-brand-600 hover:underline"
        >
          ← შეკვეთების სია
        </button>
      </div>
    );
  }

  const nextStatuses = getNextStatuses(order.status);

  return (
    <div className="space-y-6">
      <PageBreadCrumb pageTitle={`შეკვეთა ${order.id}`} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
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
                      {item.product?.name || "პროდუქტი"}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {item.product?.packSize ? `${item.product.packSize} · ` : null}
                      რაოდენობა: {item.quantity}
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
              {order.comment ? (
                <div>
                  <span className="text-gray-500 dark:text-gray-400">შენიშვნა / გადახდა: </span>
                  <span className="text-gray-900 dark:text-white">{order.comment}</span>
                </div>
              ) : null}
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
                <span className="text-gray-500 dark:text-gray-400">მიტანის საფასური (აპი): </span>
                <span className="text-gray-900 dark:text-white">₾{order.deliveryFee.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {hasBogDisplayData(order) ? (
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                ონლაინ გადახდა (საქართველოს ბანკი / BOG)
              </h2>
              <BogOrderCallbackView order={order} />
            </div>
          ) : null}
        </div>

        <div className="space-y-6">
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
                    type="button"
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

          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              ინფორმაცია
            </h2>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-500 dark:text-gray-400">მომხმარებელი: </span>
                <span className="text-gray-900 dark:text-white">
                  {order.user?.fullName || "—"}
                </span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">ტელეფონი: </span>
                <span className="text-gray-900 dark:text-white">
                  {order.user?.phoneNumber || "—"}
                </span>
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
              <div>
                <span className="text-gray-500 dark:text-gray-400">გადახდის სტატუსი: </span>
                <span
                  className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                    order.paymentStatus === PaymentStatus.COMPLETED
                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                      : order.paymentStatus === PaymentStatus.FAILED
                        ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                        : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                  }`}
                >
                  {paymentLabel(order.paymentStatus)}
                </span>
              </div>
              {order.bogPaymentStatus ? (
                <div>
                  <span className="text-gray-500 dark:text-gray-400">BOG სტატუსი: </span>
                  <span className="font-mono text-xs text-gray-900 dark:text-white">
                    {order.bogPaymentStatus}
                  </span>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
