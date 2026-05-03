"use client";

import React, { useState, useEffect, Suspense, useMemo, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Order, OrderStatus, PaymentStatus, Warehouse } from "@/types";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import { EyeIcon } from "@/icons";
import Link from "next/link";
import { warehousesApi, ordersApi } from "@/lib/api";

const statusLabels: Record<OrderStatus, string> = {
  [OrderStatus.CREATED]: "მოლოდინში",
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
  [OrderStatus.CREATED]:
    "bg-red-100 text-red-900 dark:bg-red-950/80 dark:text-red-100",
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

  const [orders, setOrders] = useState<Order[]>([]);
  const [warehouse, setWarehouse] = useState<{ name?: string } | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterPaymentStatus, setFilterPaymentStatus] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [warehouseOptions, setWarehouseOptions] = useState<Warehouse[]>([]);
  const [assigningId, setAssigningId] = useState<string | null>(null);

  const warehouseNameById = useMemo(() => {
    const m = new Map<string, string>();
    warehouseOptions.forEach((w) => m.set(w.id, w.name));
    return m;
  }, [warehouseOptions]);

  useEffect(() => {
    warehousesApi
      .getAll({ active: true })
      .then((res) => setWarehouseOptions(res.data ?? []))
      .catch(() => setWarehouseOptions([]));
  }, []);

  useEffect(() => {
    if (warehouseId) {
      warehousesApi
        .getById(warehouseId)
        .then((response) => setWarehouse(response.data))
        .catch(() => setWarehouse(null));
    } else {
      setWarehouse(null);
    }
  }, [warehouseId]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    const loader = warehouseId
      ? ordersApi.getAdminByWarehouse(warehouseId)
      : ordersApi.getAll();
    loader
      .then((response) => {
        if (!cancelled) setOrders(response.data ?? []);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setOrders([]);
          const msg =
            err && typeof err === "object" && "data" in err
              ? JSON.stringify((err as { data?: unknown }).data)
              : err instanceof Error
                ? err.message
                : "შეკვეთების ჩატვირთვა ვერ მოხერხდა";
          setLoadError(msg);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [warehouseId]);

  const handleAssignWarehouse = useCallback(async (orderId: string, wid: string) => {
    if (!wid) return;
    setAssigningId(orderId);
    try {
      const res = await ordersApi.assignWarehouse(orderId, wid);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? res.data : o)));
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "data" in err
          ? JSON.stringify((err as { data?: unknown }).data)
          : err instanceof Error
            ? err.message
            : "მისაინი ვერ შესრულდა";
      window.alert(msg);
    } finally {
      setAssigningId(null);
    }
  }, []);

  const filteredOrders = orders.filter((order) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      order.id.toLowerCase().includes(q) ||
      order.user?.fullName?.toLowerCase().includes(q) ||
      (order.user?.phoneNumber?.includes(searchTerm) ?? false) ||
      (order.user?.email?.toLowerCase().includes(q) ?? false) ||
      order.items.some((it) => it.product?.name?.toLowerCase().includes(q));
    const matchesStatus = filterStatus === "all" || order.status === filterStatus;
    const matchesPaymentStatus =
      filterPaymentStatus === "all" || order.paymentStatus === filterPaymentStatus;
    return matchesSearch && matchesStatus && matchesPaymentStatus;
  });

  const isAwaitingStaffAction = (order: Order) =>
    order.status === OrderStatus.CREATED;

  return (
    <div className="space-y-6">
      <PageBreadCrumb
        pageTitle={
          warehouse?.name ? `${warehouse.name} - შეკვეთები` : "შეკვეთების მენეჯმენტი"
        }
      />

      {loadError && (
        <div
          className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200"
          role="alert"
        >
          <strong className="font-semibold">API შეცდომა:</strong> {loadError}
          <p className="mt-1 text-xs opacity-90">
            შეამოწმეთ რომ ხართ შესული და <code className="rounded bg-red-100 px-1 dark:bg-red-900">NEXT_PUBLIC_API_URL</code> მიუთითებს Nest API-ზე (მაგ. Railway).
          </p>
        </div>
      )}

      {warehouse && (
        <div className="rounded-lg border border-brand-200 bg-brand-50 p-4 dark:border-brand-800 dark:bg-brand-900/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-brand-900 dark:text-brand-200">
                ფილტრი: {warehouse.name}
              </p>
              <p className="text-xs text-brand-700 dark:text-brand-300">
                ნაჩვენებია მხოლოდ ამ საწყობზე მისაინდი შეკვეთები.
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

      <div className="flex flex-col gap-4 sm:flex-row">
        <input
          type="text"
          placeholder="ძიება ID, სახელი, ტელეფონი, ელფოსტა..."
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
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                  საწყობი
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                  მოქმედებები
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-sm text-gray-500">
                    იტვირთება...
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-sm text-gray-500">
                    შეკვეთები არ მოიძებნა
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const urgent = isAwaitingStaffAction(order);
                  return (
                  <tr
                    key={order.id}
                    className={
                      urgent
                        ? "border-l-4 border-l-red-500 bg-red-50/90 hover:bg-red-100/90 dark:border-l-red-400 dark:bg-red-950/35 dark:hover:bg-red-950/50"
                        : "hover:bg-gray-50 dark:hover:bg-gray-700"
                    }
                  >
                    <td className="px-6 py-4">
                      <div
                        className="max-w-[140px] truncate font-mono text-sm font-medium text-gray-900 dark:text-white"
                        title={order.id}
                      >
                        {order.id}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {order.items.length} პოზიცია
                      </div>
                      <div
                        className="mt-1 line-clamp-2 max-w-[min(100%,320px)] text-xs leading-snug text-gray-600 dark:text-gray-300"
                        title={order.items
                          .map((it) => `${it.product?.name ?? "—"} ×${it.quantity}`)
                          .join(", ")}
                      >
                        {order.items
                          .map((it) => `${it.product?.name ?? "—"} ×${it.quantity}`)
                          .join(" · ")}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {order.user?.fullName || "—"}
                        </div>
                        <div className="text-gray-500 dark:text-gray-400">
                          {order.user?.phoneNumber || order.deliveryPhone || "—"}
                        </div>
                        {order.user?.email ? (
                          <div className="text-xs text-gray-400">{order.user.email}</div>
                        ) : null}
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
                    <td className="px-6 py-4 align-top">
                      <div className="flex min-w-[200px] flex-col gap-2">
                        {order.warehouseLocation ? (
                          <span
                            className="text-xs font-medium text-brand-700 dark:text-brand-300"
                            title={order.warehouseLocation}
                          >
                            {warehouseNameById.get(order.warehouseLocation) ??
                              `${order.warehouseLocation.slice(0, 10)}…`}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400 dark:text-gray-500">
                            არ არის მისაინდ
                          </span>
                        )}
                        <select
                          value={order.warehouseLocation ?? ""}
                          disabled={assigningId === order.id}
                          onChange={(e) => {
                            const v = e.target.value;
                            if (v) void handleAssignWarehouse(order.id, v);
                          }}
                          className="rounded-md border border-gray-300 bg-white px-2 py-1.5 text-xs focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                        >
                          <option value="">
                            {assigningId === order.id ? "იტვირთება…" : "მისაინე საწყობზე…"}
                          </option>
                          {warehouseOptions.map((w) => (
                            <option key={w.id} value={w.id}>
                              {w.name}
                            </option>
                          ))}
                        </select>
                      </div>
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
