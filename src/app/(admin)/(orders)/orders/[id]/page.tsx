"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Order, OrderStatus, PaymentStatus, User, UserRole } from "@/types";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import {
  BogOrderCallbackView,
  hasBogDisplayData,
} from "@/components/orders/BogOrderCallbackView";
import {
  getNextStatuses,
  hasBogOrPaymentData,
  orderDeliveryTotal,
  orderGrandTotal,
  orderNumberLabel,
  orderProductsTotal,
  paymentLabel,
  statusColors,
  statusLabels,
  userWarehouseId,
  isBogPaymentCompleted,
} from "@/components/orders/orderDetailHelpers";
import { authApi, ordersApi, warehousesApi } from "@/lib/api";
import type {
  DeliveryAddressPreviewResult,
  DeliveryRedispatchPreviewResult,
} from "@/lib/api/orders";
import { ApiError } from "@/lib/api/client";
import type { Warehouse } from "@/types";

type DeliveryAddressForm = {
  streetName: string;
  cityName: string;
  latitude: string;
  longitude: string;
};

function initDeliveryAddressForm(order: Order): DeliveryAddressForm {
  const da = order.deliveryAddress_quickshipper;
  return {
    streetName: da?.streetName?.trim() || order.deliveryAddress?.split(",")[0]?.trim() || "",
    cityName: da?.cityName?.trim() || order.deliveryCity?.trim() || "",
    latitude: da?.latitude != null ? String(da.latitude) : "",
    longitude: da?.longitude != null ? String(da.longitude) : "",
  };
}

function parseDeliveryAddressPayload(form: DeliveryAddressForm) {
  const lat = Number(form.latitude);
  const lng = Number(form.longitude);
  if (!form.streetName.trim() || !form.cityName.trim()) {
    return { error: "ქუჩა და ქალაქი სავალდებულოა" as const };
  }
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return { error: "latitude / longitude სავალდებულოა (რიცხვები)" as const };
  }
  return {
    payload: {
      streetName: form.streetName.trim(),
      cityName: form.cityName.trim(),
      latitude: lat,
      longitude: lng,
      shippingAddress: `${form.streetName.trim()}, ${form.cityName.trim()}`,
    },
  };
}

export default function OrderDetailPage() {
  const params = useParams();
  const orderId = typeof params.id === "string" ? params.id : params.id?.[0];

  const [order, setOrder] = useState<Order | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus>(OrderStatus.CREATED);
  const [isUpdating, setIsUpdating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [panelUser, setPanelUser] = useState<User | null>(null);
  const [sendingToQuickshipper, setSendingToQuickshipper] = useState(false);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [assigningWarehouse, setAssigningWarehouse] = useState(false);
  const [redispatchWarehouseId, setRedispatchWarehouseId] = useState("");
  const [redispatchPreview, setRedispatchPreview] =
    useState<DeliveryRedispatchPreviewResult | null>(null);
  const [redispatchLoading, setRedispatchLoading] = useState(false);
  const [redispatchApplying, setRedispatchApplying] = useState(false);
  const [markingRedispatchPaid, setMarkingRedispatchPaid] = useState(false);
  const [balanceRetrying, setBalanceRetrying] = useState<
    "sale" | "credit" | "delivery" | null
  >(null);
  const [bogRefundPreview, setBogRefundPreview] = useState<{
    productsAmount: number;
    deliveryTotal: number;
    fullAmount: number;
    canRefundProducts: boolean;
    canRefundFull: boolean;
    alreadyRefunded: boolean;
    refundKind: "products" | "full" | null;
  } | null>(null);
  const [bogRefundLoading, setBogRefundLoading] = useState(false);
  const [bogRefunding, setBogRefunding] = useState<"products" | "full" | null>(
    null,
  );
  const [refundCreditRetrying, setRefundCreditRetrying] = useState(false);
  const [addrForm, setAddrForm] = useState<DeliveryAddressForm>({
    streetName: "",
    cityName: "",
    latitude: "",
    longitude: "",
  });
  const [addrPreview, setAddrPreview] =
    useState<DeliveryAddressPreviewResult | null>(null);
  const [addrPreviewLoading, setAddrPreviewLoading] = useState(false);
  const [addrSaving, setAddrSaving] = useState(false);

  const isAdmin = panelUser?.role === UserRole.ADMIN;

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
      setAddrForm(initDeliveryAddressForm(res.data));
      setAddrPreview(null);
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

  useEffect(() => {
    if (!isAdmin) return;
    void warehousesApi.getAll({ active: true }).then((res) => {
      setWarehouses(res.data || []);
    });
  }, [isAdmin]);

  useEffect(() => {
    if (!orderId || !isAdmin || !order) return;
    if (!isBogPaymentCompleted(order) && !order.bogProductsRefundAt) {
      setBogRefundPreview(null);
      return;
    }
    let cancelled = false;
    setBogRefundLoading(true);
    ordersApi
      .previewBogProductsRefund(orderId)
      .then((preview) => {
        if (!cancelled) setBogRefundPreview(preview);
      })
      .catch(() => {
        if (!cancelled) setBogRefundPreview(null);
      })
      .finally(() => {
        if (!cancelled) setBogRefundLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [
    orderId,
    isAdmin,
    order,
    order?.bogOrderId,
    order?.bogPaymentStatus,
    order?.bogProductsRefundAt,
  ]);

  const warehouseNameById = useMemo(() => {
    const m = new Map<string, string>();
    warehouses.forEach((w) => m.set(w.id, w.name));
    return m;
  }, [warehouses]);

  const handleAssignWarehouse = async (warehouseId: string) => {
    if (!orderId || !warehouseId) return;
    setAssigningWarehouse(true);
    try {
      const res = await ordersApi.assignWarehouse(orderId, warehouseId);
      setOrder(res.data);
      window.alert("საწყობი მინიჭებულია — pickup მისამართი განახლდა");
    } catch (e) {
      const msg =
        e instanceof ApiError && typeof e.data?.message === "string"
          ? e.data.message
          : "საწყობის მინიჭება ვერ მოხერხდა";
      window.alert(msg);
    } finally {
      setAssigningWarehouse(false);
    }
  };

  const handleRedispatchPreview = async () => {
    if (!orderId || !redispatchWarehouseId) return;
    setRedispatchLoading(true);
    setRedispatchPreview(null);
    try {
      const preview = await ordersApi.previewDeliveryRedispatch(
        orderId,
        redispatchWarehouseId,
      );
      setRedispatchPreview(preview);
    } catch (e) {
      const msg =
        e instanceof ApiError && typeof e.data?.message === "string"
          ? e.data.message
          : "ფასის გადათვლა ვერ მოხერხდა";
      window.alert(msg);
    } finally {
      setRedispatchLoading(false);
    }
  };

  const handleRedispatchApply = async () => {
    if (!orderId || !redispatchWarehouseId || !redispatchPreview) return;
    if (
      !window.confirm(
        `Quickshipper-ზე ძველი შეკვეთა გაუქმდება (DELETE v1/order), თუ კურიერი არ არის მიბმული. მომხმარებელს გადასახდელი იქნება ₾${redispatchPreview.amountDue.toFixed(2)}. გავაგრძელოთ?`,
      )
    ) {
      return;
    }
    setRedispatchApplying(true);
    try {
      const result = await ordersApi.applyDeliveryRedispatch(
        orderId,
        redispatchWarehouseId,
        redispatchPreview.providerPriceId,
      );
      window.alert(result.message || "განახლდა");
      setRedispatchPreview(null);
      setRedispatchWarehouseId("");
      await loadOrder();
    } catch (e) {
      const msg =
        e instanceof ApiError && typeof e.data?.message === "string"
          ? e.data.message
          : "გადაგზავნის მოთხოვნა ვერ მოხერხდა";
      window.alert(msg);
    } finally {
      setRedispatchApplying(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!orderId || !order || selectedStatus === order.status) return;
    const isWarehouse = panelUser?.role === UserRole.WAREHOUSE_STAFF;
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

  const handleSendToQuickshipper = async () => {
    if (!orderId || !order) return;
    if (!order.deliveryProvider || !order.deliveryAddress_quickshipper) {
      window.alert("შეკვეთას არ აქვს Quickshipper მიტანის ინფორმაცია");
      return;
    }
    if (order.quickshipperOrderId) {
      window.alert(
        `შეკვეთა უკვე გაგზავნილია Quickshipper-ზე: ${order.quickshipperOrderId}`,
      );
      return;
    }
    if (
      !window.confirm("დარწმუნებული ხართ რომ გსურთ შეკვეთის გაგზავნა Quickshipper-ზე?")
    ) {
      return;
    }
    setSendingToQuickshipper(true);
    try {
      const result = await ordersApi.sendToQuickshipper(orderId);
      window.alert(result.message || "შეკვეთა წარმატებით გაიგზავნა!");
      await loadOrder();
    } catch (e) {
      const msg =
        e instanceof ApiError && typeof e.data?.message === "string"
          ? e.data.message
          : "Quickshipper-ზე გაგზავნა ვერ მოხერხდა";
      window.alert(msg);
    } finally {
      setSendingToQuickshipper(false);
    }
  };

  const handleMarkRedispatchPaid = async () => {
    if (!orderId) return;
    if (
      !window.confirm(
        "ტესტი: გადახდა მონიშნულია (BOG-ის ნაცვლად). შემდეგ დააჭირე Quickshipper POST-ს.",
      )
    ) {
      return;
    }
    setMarkingRedispatchPaid(true);
    try {
      const result = await ordersApi.markDeliveryRedispatchPaid(orderId);
      window.alert(result.message || "OK");
      await loadOrder();
    } catch (e) {
      const msg =
        e instanceof ApiError && typeof e.data?.message === "string"
          ? e.data.message
          : "ვერ მოხერხდა";
      window.alert(msg);
    } finally {
      setMarkingRedispatchPaid(false);
    }
  };

  const handleBalanceRetry = async (kind: "sale" | "credit" | "delivery") => {
    if (!orderId) return;
    setBalanceRetrying(kind);
    try {
      const fn =
        kind === "sale"
          ? ordersApi.retryBalanceSale
          : kind === "credit"
            ? ordersApi.retryWarehouseCredit
            : ordersApi.retryDeliveryBalanceSale;
      const result = await fn(orderId);
      window.alert(result.message);
      await loadOrder();
    } catch (e) {
      const errMsg =
        e instanceof ApiError && typeof e.data?.message === "string"
          ? e.data.message
          : "Balance PUT ვერ მოხერხდა";
      window.alert(errMsg);
    } finally {
      setBalanceRetrying(null);
    }
  };

  const handleBogRefund = async (kind: "products" | "full") => {
    if (!orderId || !bogRefundPreview) return;
    const amount =
      kind === "products"
        ? bogRefundPreview.productsAmount
        : bogRefundPreview.fullAmount;
    const confirmText =
      kind === "products"
        ? `BOG-ზე დაბრუნდება მხოლოდ პროდუქტების თანხა ₾${amount.toFixed(2)}.\nმიტანა ₾${bogRefundPreview.deliveryTotal.toFixed(2)} არ ბრუნდება.\n\nგავაგრძელოთ?`
        : `BOG-ზე სრულად დაბრუნდება ₾${amount.toFixed(2)}:\n• პროდუქტები ₾${bogRefundPreview.productsAmount.toFixed(2)}\n• მიტანა ₾${bogRefundPreview.deliveryTotal.toFixed(2)}\n\nBalance SalesCredit-შიც მიტანის ხაზი ჩაიწერება.\n\nგავაგრძელოთ?`;
    if (!window.confirm(confirmText)) return;

    setBogRefunding(kind);
    try {
      const fn =
        kind === "products"
          ? ordersApi.refundBogProducts
          : ordersApi.refundBogFull;
      const result = await fn(orderId);
      window.alert(result.message);
      await loadOrder();
    } catch (e) {
      const errMsg =
        e instanceof ApiError && typeof e.data?.message === "string"
          ? e.data.message
          : "BOG refund ვერ მოხერხდა";
      window.alert(errMsg);
    } finally {
      setBogRefunding(null);
    }
  };

  const handleRefundCreditRetry = async () => {
    if (!orderId) return;
    setRefundCreditRetrying(true);
    try {
      const result = await ordersApi.retryRefundBalanceCredit(orderId);
      window.alert(result.message);
      await loadOrder();
    } catch (e) {
      const errMsg =
        e instanceof ApiError && typeof e.data?.message === "string"
          ? e.data.message
          : "Balance Refund SalesCredit ვერ მოხერხდა";
      window.alert(errMsg);
    } finally {
      setRefundCreditRetrying(false);
    }
  };

  const canEditDeliveryAddress =
    isAdmin &&
    !order?.quickshipperOrderId &&
    order?.deliveryRedispatch?.status !== "pending_payment";

  const handleAddrPreview = async () => {
    if (!orderId) return;
    const parsed = parseDeliveryAddressPayload(addrForm);
    if ("error" in parsed) {
      window.alert(parsed.error);
      return;
    }
    setAddrPreviewLoading(true);
    setAddrPreview(null);
    try {
      const preview = await ordersApi.previewDeliveryAddressUpdate(
        orderId,
        parsed.payload,
      );
      setAddrPreview(preview);
    } catch (e) {
      const msg =
        e instanceof ApiError && typeof e.data?.message === "string"
          ? e.data.message
          : "Quickshipper ფასის გადათვლა ვერ მოხერხდა";
      window.alert(msg);
    } finally {
      setAddrPreviewLoading(false);
    }
  };

  const handleAddrSave = async () => {
    if (!orderId) return;
    const parsed = parseDeliveryAddressPayload(addrForm);
    if ("error" in parsed) {
      window.alert(parsed.error);
      return;
    }
    if (
      !window.confirm(
        "მისამართი შეიცვლება და Quickshipper-ის მიტანის ფასი განახლდება. გავაგრძელოთ?",
      )
    ) {
      return;
    }
    setAddrSaving(true);
    try {
      const result = await ordersApi.applyDeliveryAddressUpdate(
        orderId,
        parsed.payload,
      );
      window.alert(result.message || "შენახულია");
      setAddrPreview(null);
      await loadOrder();
    } catch (e) {
      const msg =
        e instanceof ApiError && typeof e.data?.message === "string"
          ? e.data.message
          : "მისამართის შენახვა ვერ მოხერხდა";
      window.alert(msg);
    } finally {
      setAddrSaving(false);
    }
  };

  const whIdNav = userWarehouseId(panelUser);
  const ordersListHref =
    panelUser?.role === UserRole.WAREHOUSE_STAFF && whIdNav
      ? `/warehouses/${whIdNav}/orders`
      : "/orders";

  if (loading) {
    return (
      <div className="flex min-h-60 items-center justify-center text-gray-500">
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
        <Link href={ordersListHref} className="text-sm text-brand-600 hover:underline">
          ← შეკვეთების სია
        </Link>
      </div>
    );
  }

  const productsTotal = orderProductsTotal(order);
  const deliveryTotal = orderDeliveryTotal(order);
  const grandTotal = orderGrandTotal(order);
  const nextStatuses = getNextStatuses(order.status, panelUser?.role);
  const rd = order.deliveryRedispatch;
  const bogCompleted = isBogPaymentCompleted(order);
  const showSalesCreditStep = Boolean(rd && order.balanceSalePostedAt);
  const showRedispatchDeliverySale = Boolean(
    rd && (rd.status === "paid" || rd.status === "completed"),
  );
  const balanceSalePending =
    bogCompleted && !order.balanceSalePostedAt && !order.balanceSalePostError;

  const workflowSteps = [
    {
      label: "BOG გადახდა",
      done: bogCompleted,
      warn:
        !bogCompleted &&
        (order.paymentStatus === PaymentStatus.COMPLETED ||
          order.status !== OrderStatus.CREATED),
    },
    {
      label: "Balance Sale (პროდუქტი + მიტანა)",
      done: Boolean(order.balanceSalePostedAt),
      warn:
        Boolean(order.balanceSalePostError) ||
        (bogCompleted && !order.balanceSalePostedAt),
    },
    ...(showSalesCreditStep
      ? [
          {
            label: "SalesCredit (საწყობი)",
            done: Boolean(
              rd?.warehouseCreditPostedAt ||
                order.balanceWarehouseCreditPostedAt,
            ),
            warn: Boolean(
              rd?.warehouseCreditPostError ||
                order.balanceWarehouseCreditPostError,
            ),
          },
        ]
      : []),
    ...(showRedispatchDeliverySale
      ? [
          {
            label: "Balance Sale მიტანა (redispatch)",
            done: Boolean(rd?.balanceDeliverySalePostedAt),
            warn: Boolean(rd?.balanceDeliverySalePostError),
          },
        ]
      : []),
    {
      label: "დადასტურება",
      done: order.status !== OrderStatus.CREATED,
    },
    {
      label: "საწყობი",
      done: Boolean(order.warehouseLocation || order.dispatchWarehouseId),
    },
    {
      label: "Quickshipper",
      done: Boolean(order.quickshipperOrderId),
    },
    {
      label: "მიწოდება",
      done: order.status === OrderStatus.DELIVERED,
    },
  ];

  const hasQuickshipperData =
    Boolean(order.deliveryProvider) && Boolean(order.deliveryAddress_quickshipper);
  const showRedispatchForm =
    isAdmin &&
    order.deliveryRedispatch?.status !== "pending_payment" &&
    order.deliveryRedispatch?.status !== "paid";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <PageBreadCrumb pageTitle={orderNumberLabel(order.id)} />
          <p className="mt-1 font-mono text-xs text-gray-500 dark:text-gray-400">
            {order.id}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={ordersListHref}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            ← სია
          </Link>
          <button
            type="button"
            onClick={() => void loadOrder()}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            განახლება
          </button>
          <span
            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusColors[order.status]}`}
          >
            {statusLabels[order.status]}
          </span>
          <span
            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
              order.paymentStatus === PaymentStatus.COMPLETED
                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                : order.paymentStatus === PaymentStatus.REFUNDED
                  ? "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
                  : order.paymentStatus === PaymentStatus.FAILED
                    ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                    : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
            }`}
          >
            {paymentLabel(order.paymentStatus)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* პროდუქტები + ფინანსები */}
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
            <div className="mt-4 space-y-2 border-t border-gray-200 pt-4 text-sm dark:border-gray-700">
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>პროდუქტები</span>
                <span>₾{productsTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>მიტანა</span>
                <span>₾{deliveryTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-semibold text-gray-900 dark:text-white">
                <span>სულ (აპი)</span>
                <span>₾{grandTotal.toFixed(2)}</span>
              </div>
              {Math.abs(grandTotal - order.totalAmount) > 0.01 ? (
                <div className="flex justify-between text-xs text-gray-500">
                  <span>DB totalAmount</span>
                  <span>₾{order.totalAmount.toFixed(2)}</span>
                </div>
              ) : null}
            </div>
          </div>

          {/* მიტანის ინფო */}
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
              {order.deliveryAddress_quickshipper ? (
                <div className="font-mono text-xs text-gray-500 dark:text-gray-400">
                  coords: {order.deliveryAddress_quickshipper.latitude},{" "}
                  {order.deliveryAddress_quickshipper.longitude}
                </div>
              ) : null}
            </div>

            {isAdmin ? (
              <div className="mt-6 border-t border-gray-200 pt-4 dark:border-gray-700">
                <h3 className="mb-2 text-sm font-semibold text-gray-900 dark:text-white">
                  მისამართის ჩანაცვლება (Quickshipper)
                </h3>
                {!canEditDeliveryAddress ? (
                  <p className="text-xs text-amber-700 dark:text-amber-300">
                    {order.quickshipperOrderId
                      ? "Quickshipper-ზე უკვე გაგზავნილია — გამოიყენე redispatch."
                      : order.deliveryRedispatch?.status === "pending_payment"
                        ? "აქტიურია redispatch გადახდა — ჯერ დაასრულე."
                        : "რედაქტირება არ არის ხელმისაწვდომი."}
                  </p>
                ) : (
                  <>
                    <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">
                      შეიყვანე სწორი ქუჩა/ქალაქი და კოორდინატები — Quickshipper
                      გადაითვლის მიტანის ფასს pickup-იდან.
                    </p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="block text-sm sm:col-span-2">
                        <span className="mb-1 block text-gray-600 dark:text-gray-400">
                          ქუჩა / სახელი
                        </span>
                        <input
                          type="text"
                          value={addrForm.streetName}
                          onChange={(e) => {
                            setAddrForm((f) => ({ ...f, streetName: e.target.value }));
                            setAddrPreview(null);
                          }}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                        />
                      </label>
                      <label className="block text-sm">
                        <span className="mb-1 block text-gray-600 dark:text-gray-400">
                          ქალაქი
                        </span>
                        <input
                          type="text"
                          value={addrForm.cityName}
                          onChange={(e) => {
                            setAddrForm((f) => ({ ...f, cityName: e.target.value }));
                            setAddrPreview(null);
                          }}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                        />
                      </label>
                      <label className="block text-sm">
                        <span className="mb-1 block text-gray-600 dark:text-gray-400">
                          latitude
                        </span>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={addrForm.latitude}
                          onChange={(e) => {
                            setAddrForm((f) => ({ ...f, latitude: e.target.value }));
                            setAddrPreview(null);
                          }}
                          placeholder="41.7151"
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                        />
                      </label>
                      <label className="block text-sm">
                        <span className="mb-1 block text-gray-600 dark:text-gray-400">
                          longitude
                        </span>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={addrForm.longitude}
                          onChange={(e) => {
                            setAddrForm((f) => ({ ...f, longitude: e.target.value }));
                            setAddrPreview(null);
                          }}
                          placeholder="44.7664"
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                        />
                      </label>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => void handleAddrPreview()}
                        disabled={addrPreviewLoading}
                        className="rounded-lg border border-brand-600 px-3 py-2 text-sm font-medium text-brand-700 hover:bg-brand-50 disabled:opacity-50 dark:text-brand-300"
                      >
                        {addrPreviewLoading ? "ითვლება..." : "Quickshipper ფასის გადათვლა"}
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleAddrSave()}
                        disabled={addrSaving || !addrPreview}
                        className="rounded-lg bg-brand-500 px-3 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
                      >
                        {addrSaving ? "ინახება..." : "მისამართის შენახვა"}
                      </button>
                    </div>
                    {addrPreview ? (
                      <div className="mt-3 rounded-lg bg-gray-50 p-3 text-sm dark:bg-gray-900/50">
                        <div>
                          მანძილი: ~{addrPreview.distanceKm.toFixed(1)} კმ (
                          {addrPreview.newDeliveryProvider.providerName})
                        </div>
                        <div>
                          ძველი მიტანა: ₾
                          {addrPreview.previousDeliveryTotal.toFixed(2)} → ახალი: ₾
                          {addrPreview.newDeliveryTotal.toFixed(2)}
                        </div>
                        <div className="text-xs text-gray-500">{addrPreview.note}</div>
                      </div>
                    ) : null}
                  </>
                )}
              </div>
            ) : null}
          </div>

          {/* Quickshipper */}
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-6 shadow-sm dark:border-blue-900 dark:bg-blue-950/30">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Quickshipper მიტანა
              </h2>
              {order.quickshipperOrderId ? (
                <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-200">
                  გაგზავნილია
                </span>
              ) : hasQuickshipperData ? (
                <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                  მოლოდინში
                </span>
              ) : (
                <span className="rounded-full bg-gray-200 px-3 py-1 text-xs font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                  მონაცემები არ არის
                </span>
              )}
            </div>

            {!hasQuickshipperData ? (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                ამ შეკვეთას არ აქვს Quickshipper provider/მისამართი (მობილური აპიდან
                checkout-ის დროს).
              </p>
            ) : (
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  {order.deliveryProvider?.providerLogoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={order.deliveryProvider.providerLogoUrl}
                      alt={order.deliveryProvider.providerName}
                      className="h-8 w-8 rounded object-contain"
                    />
                  ) : null}
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {order.deliveryProvider?.providerName}
                    </div>
                    <div className="text-gray-600 dark:text-gray-400">
                      {order.deliverySpeed || "სტანდარტული"}
                    </div>
                  </div>
                </div>
                {order.deliveryAddress_quickshipper ? (
                  <div className="border-t border-blue-200 pt-2 dark:border-blue-800">
                    <div className="mb-1 text-xs text-gray-500">მიტანის მისამართი</div>
                    <div className="text-gray-700 dark:text-gray-300">
                      {order.deliveryAddress_quickshipper.streetName},{" "}
                      {order.deliveryAddress_quickshipper.cityName}
                    </div>
                  </div>
                ) : null}
                {order.pickupAddress ? (
                  <div className="border-t border-blue-200 pt-2 dark:border-blue-800">
                    <div className="mb-1 text-xs text-gray-500">
                      Pickup
                      {order.pickupAddress.warehouseName
                        ? ` — ${order.pickupAddress.warehouseName}`
                        : ""}
                    </div>
                    <div className="text-gray-700 dark:text-gray-300">
                      {order.pickupAddress.streetName}, {order.pickupAddress.cityName}
                    </div>
                  </div>
                ) : null}
                {order.deliveryPrice !== undefined ? (
                  <div>
                    მიტანის ღირებულება:{" "}
                    <span className="font-semibold">₾{deliveryTotal.toFixed(2)}</span>
                  </div>
                ) : null}
                {order.quickshipperOrderId ? (
                  <div className="rounded-lg bg-blue-100 p-3 dark:bg-blue-900/50">
                    <div className="text-xs text-gray-600">Tracking ID</div>
                    <div className="font-mono text-sm font-semibold">
                      {order.quickshipperOrderId}
                    </div>
                    {order.quickshipperStatus ? (
                      <div className="mt-1 text-xs">სტატუსი: {order.quickshipperStatus}</div>
                    ) : null}
                    {order.quickshipperSentAt ? (
                      <div className="mt-1 text-xs text-gray-500">
                        გაგზავნილია: {order.quickshipperSentAt.toLocaleString("ka-GE")}
                      </div>
                    ) : null}
                  </div>
                ) : isAdmin ? (
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleSendToQuickshipper}
                      disabled={
                        sendingToQuickshipper ||
                        order.status !== OrderStatus.CONFIRMED ||
                        order.deliveryRedispatch?.status === "pending_payment"
                      }
                      className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
                    >
                      {sendingToQuickshipper
                        ? "გაგზავნა..."
                        : order.deliveryRedispatch?.status === "paid"
                          ? "POST v1/order — ახალი Quickshipper შეკვეთა"
                          : "გაგზავნა Quickshipper-ზე"}
                    </button>
                    {order.deliveryRedispatch?.status === "pending_payment" ? (
                      <p className="mt-2 text-xs text-amber-700 dark:text-amber-300">
                        მომხმარებელმა ჯერ უნდა გადაიხადოს redispatch-ის თანხა.
                      </p>
                    ) : order.status !== OrderStatus.CONFIRMED ? (
                      <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                        * სტატუსი უნდა იყოს „დადასტურებული“
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </div>
            )}
          </div>

          {/* Redispatch სტატუსი */}
          {order.deliveryRedispatch ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 dark:border-amber-900 dark:bg-amber-950/30">
              <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">
                მიტანის გადაგზავნა (Redispatch)
              </h2>
              <div
                className={`rounded-lg p-4 ${
                  order.deliveryRedispatch.status === "pending_payment"
                    ? "bg-amber-100 dark:bg-amber-900/40"
                    : "bg-white/80 dark:bg-gray-900/50"
                }`}
              >
                <div className="text-sm font-semibold uppercase tracking-wide">
                  {order.deliveryRedispatch.status === "pending_payment"
                    ? "გადასახდელი — მომხმარებელს აპში ჩანს"
                    : order.deliveryRedispatch.status}
                </div>
                <div className="mt-2 text-sm">
                  ახალი საწყობი: {order.deliveryRedispatch.newWarehouseName}
                </div>
                <div className="text-sm font-semibold">
                  გადასახდელი: ₾{order.deliveryRedispatch.amountDue.toFixed(2)}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  ძველი მიტანა ₾
                  {order.deliveryRedispatch.previousDeliveryTotal.toFixed(2)} — არ უბრუნდება
                </div>
                {order.deliveryRedispatch.newPickupAddress ? (
                  <div className="mt-2 text-xs">
                    ახალი pickup: {order.deliveryRedispatch.newPickupAddress.streetName},{" "}
                    {order.deliveryRedispatch.newPickupAddress.cityName}
                  </div>
                ) : null}
                {order.deliveryRedispatch.cancelledQuickshipperOrderId ? (
                  <div className="mt-2 font-mono text-xs">
                    DELETE QS: {order.deliveryRedispatch.cancelledQuickshipperOrderId}
                  </div>
                ) : null}
                {order.deliveryRedispatch.paidAt ? (
                  <div className="mt-2 text-xs text-green-700 dark:text-green-300">
                    გადახდილი: {order.deliveryRedispatch.paidAt.toLocaleString("ka-GE")}
                  </div>
                ) : null}
                {order.deliveryRedispatch.status === "pending_payment" && isAdmin ? (
                  <button
                    type="button"
                    onClick={handleMarkRedispatchPaid}
                    disabled={markingRedispatchPaid}
                    className="mt-3 rounded-lg border border-amber-700 px-3 py-2 text-sm font-medium text-amber-900 hover:bg-amber-200/60 disabled:opacity-50 dark:text-amber-100"
                  >
                    {markingRedispatchPaid
                      ? "..."
                      : "ტესტი: გადახდა მონიშნულია (BOG-ის ნაცვლად)"}
                  </button>
                ) : null}
                {order.deliveryRedispatch.status === "paid" ? (
                  <p className="mt-2 text-xs font-medium text-green-800 dark:text-green-200">
                    გადახდილია — Quickshipper ბლოკში დააჭირე POST v1/order
                  </p>
                ) : null}
              </div>
            </div>
          ) : null}

          {/* Redispatch ფორმა */}
          {showRedispatchForm && hasQuickshipperData ? (
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <h2 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
                სხვა საწყობიდან გადაგზავნა
              </h2>
              <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                DELETE ძველი Quickshipper → მომხმარებელი იხდის ახალ მიტანას BOG-ით → POST
                ახალი შეკვეთა.
              </p>
              <select
                value={redispatchWarehouseId}
                onChange={(e) => {
                  setRedispatchWarehouseId(e.target.value);
                  setRedispatchPreview(null);
                }}
                className="mb-3 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              >
                <option value="">აირჩიეთ საწყობი...</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} — {w.address}, {w.city}
                  </option>
                ))}
              </select>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleRedispatchPreview}
                  disabled={!redispatchWarehouseId || redispatchLoading}
                  className="rounded-lg border border-brand-600 px-3 py-2 text-sm font-medium text-brand-700 hover:bg-brand-50 disabled:opacity-50 dark:text-brand-300"
                >
                  {redispatchLoading ? "ითვლება..." : "ფასის გადათვლა"}
                </button>
                {redispatchPreview ? (
                  <button
                    type="button"
                    onClick={handleRedispatchApply}
                    disabled={redispatchApplying}
                    className="rounded-lg bg-amber-600 px-3 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50"
                  >
                    {redispatchApplying
                      ? "ინახება..."
                      : `მოთხოვნა — ₾${redispatchPreview.amountDue.toFixed(2)}`}
                  </button>
                ) : null}
              </div>
              {redispatchPreview ? (
                <div className="mt-4 rounded-lg bg-gray-50 p-3 text-sm dark:bg-gray-900/50">
                  <div>მანძილი: ~{redispatchPreview.distanceKm.toFixed(1)} კმ</div>
                  <div>
                    Pickup: {redispatchPreview.pickupAddress.streetName},{" "}
                    {redispatchPreview.pickupAddress.cityName}
                  </div>
                  <div>
                    ₾{redispatchPreview.previousDeliveryTotal.toFixed(2)} → ₾
                    {redispatchPreview.amountDue.toFixed(2)}
                  </div>
                  {redispatchPreview.note ? (
                    <div className="text-xs text-gray-500">{redispatchPreview.note}</div>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}

          {/* BOG + Refund */}
          {hasBogOrPaymentData(order) || hasBogDisplayData(order) ? (
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                ონლაინ გადახდა (BOG)
              </h2>
              {hasBogDisplayData(order) ? (
                <BogOrderCallbackView order={order} />
              ) : (
                <p className="text-sm text-gray-500">Callback მონაცემები ჯერ არ მოვიდა.</p>
              )}

              {isAdmin &&
              (bogCompleted || order.bogProductsRefundAt || bogRefundPreview) ? (
                <div className="mt-4 rounded-lg border border-gray-100 p-4 dark:border-gray-700">
                  <h3 className="mb-2 text-sm font-semibold text-gray-900 dark:text-white">
                    BOG Refund
                  </h3>

                  {order.bogProductsRefundAt ? (
                    <>
                      <p className="text-sm text-green-700 dark:text-green-300">
                        ✓ დაბრუნებულია ₾
                        {(order.bogProductsRefundAmount ?? 0).toFixed(2)} ·{" "}
                        {order.bogProductsRefundAt.toLocaleString("ka-GE")}
                        {order.bogRefundKind === "full"
                          ? " (სრული — პროდუქტები + მიტანა)"
                          : order.bogRefundKind === "products"
                            ? " (მხოლოდ პროდუქტები)"
                            : null}
                      </p>
                      {order.balanceRefundCreditPostedAt ? (
                        <p className="mt-2 text-sm text-green-700 dark:text-green-300">
                          ✓ Balance SalesCredit ·{" "}
                          {order.balanceRefundCreditPostedAt.toLocaleString("ka-GE")}
                          {order.balanceRefundCreditPutResponseStatus != null
                            ? ` · HTTP ${order.balanceRefundCreditPutResponseStatus}`
                            : null}
                          {order.balanceRefundCreditDocuments?.length ? (
                            <span className="block font-mono text-xs text-gray-500 dark:text-gray-400">
                              {order.balanceRefundCreditDocuments.map((d) => (
                                <span key={d.uid} className="block">
                                  {d.warehouse}: {d.uid.slice(0, 8)}…
                                </span>
                              ))}
                            </span>
                          ) : null}
                        </p>
                      ) : order.balanceRefundCreditPostError ? (
                        <>
                          <pre className="mt-2 max-h-24 overflow-auto rounded bg-red-50 p-2 text-xs text-red-800 dark:bg-red-950/40 dark:text-red-200">
                            {order.balanceRefundCreditPostError}
                          </pre>
                          <button
                            type="button"
                            onClick={() => void handleRefundCreditRetry()}
                            disabled={refundCreditRetrying}
                            className="mt-2 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                          >
                            {refundCreditRetrying
                              ? "..."
                              : "Balance SalesCredit PUT (retry)"}
                          </button>
                        </>
                      ) : order.balanceSalePostedAt ? (
                        <p className="mt-2 text-sm text-yellow-800 dark:text-yellow-200">
                          Balance SalesCredit მოლოდინში / გამოტოვებული — retry.
                          <button
                            type="button"
                            onClick={() => void handleRefundCreditRetry()}
                            disabled={refundCreditRetrying}
                            className="ml-2 rounded-lg bg-indigo-600 px-2 py-1 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                          >
                            {refundCreditRetrying ? "..." : "PUT"}
                          </button>
                        </p>
                      ) : null}
                    </>
                  ) : bogRefundLoading ? (
                    <p className="text-sm text-gray-500">იტვირთება...</p>
                  ) : bogRefundPreview ? (
                    <>
                      <ul className="mb-3 space-y-1 text-sm text-gray-600 dark:text-gray-300">
                        <li>
                          პროდუქტები: ₾
                          {bogRefundPreview.productsAmount.toFixed(2)}
                        </li>
                        <li>
                          მიტანა: ₾{bogRefundPreview.deliveryTotal.toFixed(2)}
                        </li>
                        <li className="font-medium text-gray-900 dark:text-white">
                          სრული თანხა: ₾
                          {bogRefundPreview.fullAmount.toFixed(2)}
                        </li>
                      </ul>
                      <div className="flex flex-wrap gap-2">
                        {bogRefundPreview.canRefundProducts ? (
                          <button
                            type="button"
                            onClick={() => void handleBogRefund("products")}
                            disabled={bogRefunding !== null}
                            className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-700 disabled:opacity-50"
                          >
                            {bogRefunding === "products"
                              ? "..."
                              : `Refund პროდუქტები (₾${bogRefundPreview.productsAmount.toFixed(2)})`}
                          </button>
                        ) : null}
                        {bogRefundPreview.canRefundFull ? (
                          <button
                            type="button"
                            onClick={() => void handleBogRefund("full")}
                            disabled={bogRefunding !== null}
                            className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
                          >
                            {bogRefunding === "full"
                              ? "..."
                              : `Refund სრული (₾${bogRefundPreview.fullAmount.toFixed(2)})`}
                          </button>
                        ) : null}
                      </div>
                      <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                        «პროდუქტები» — მხოლოდ პროდუქტის თანხა BOG-ზე; მიტანა არ ბრუნდება.
                        «სრული» — პროდუქტები + მიტანა (₾
                        {bogRefundPreview.deliveryTotal.toFixed(2)}) BOG-ზე და Balance
                        SalesCredit-ში. Refund-ის შემდეგ SalesCredit ავტომატურად
                        იგზავნება.
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-gray-500">
                      Refund მხოლოდ BOG completed გადახდისთვისაა.
                    </p>
                  )}
                </div>
              ) : null}
            </div>
          ) : null}

          {/* Balance — Sale / SalesCredit / redispatch მიტანა */}
          {isAdmin &&
          (order.balanceSalePostedAt ||
            order.balanceSalePostError ||
            order.paymentStatus === PaymentStatus.COMPLETED ||
            rd) ? (
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                Balance (Exchange)
              </h2>
              <div className="space-y-4">
                <div className="rounded-lg border border-gray-100 p-4 dark:border-gray-700">
                  <h3 className="mb-2 text-sm font-semibold">1. Sale — პროდუქტი + მიტანა</h3>
                  {order.balanceSalePostedAt ? (
                    <p className="text-sm text-green-700 dark:text-green-300">
                      ✓ {order.balanceSalePostedAt.toLocaleString("ka-GE")}
                      {order.balanceSalePutResponseStatus != null
                        ? ` · HTTP ${order.balanceSalePutResponseStatus}`
                        : null}
                    </p>
                  ) : (
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      {balanceSalePending
                        ? "BOG completed — Balance PUT მიმდინარეობს ან callback გამოტოვებულია. განახლე გვერდს."
                        : bogCompleted
                          ? "BOG completed — Balance Sale ჯერ არ ჩაწერილა."
                          : "BOG completed-ის შემდეგ ავტომატურად."}
                    </p>
                  )}
                  {order.balanceSaleDocuments?.length ? (
                    <ul className="mt-2 font-mono text-xs text-gray-600 dark:text-gray-400">
                      {order.balanceSaleDocuments.map((d) => (
                        <li key={`${d.warehouse}-${d.uid}`}>
                          {d.warehouse}: {d.uid.slice(0, 8)}…
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  {order.balanceSalePostError ? (
                    <pre className="mt-2 max-h-24 overflow-auto rounded bg-red-50 p-2 text-xs text-red-800 dark:bg-red-950/40 dark:text-red-200">
                      {order.balanceSalePostError}
                    </pre>
                  ) : null}
                  {!order.balanceSalePostedAt && bogCompleted ? (
                    <button
                      type="button"
                      onClick={() => void handleBalanceRetry("sale")}
                      disabled={balanceRetrying === "sale"}
                      className="mt-2 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                    >
                      {balanceRetrying === "sale"
                        ? "..."
                        : "Balance Sale PUT (ახლა)"}
                    </button>
                  ) : null}
                </div>

                {showSalesCreditStep ? (
                  <div className="rounded-lg border border-gray-100 p-4 dark:border-gray-700">
                    <h3 className="mb-2 text-sm font-semibold">
                      2. SalesCredit — საწყობის ცვლილება
                    </h3>
                    {rd?.warehouseCreditPostedAt ||
                    order.balanceWarehouseCreditPostedAt ? (
                      <p className="text-sm text-green-700 dark:text-green-300">
                        ✓{" "}
                        {(
                          rd?.warehouseCreditPostedAt ||
                          order.balanceWarehouseCreditPostedAt
                        )?.toLocaleString("ka-GE")}
                      </p>
                    ) : rd?.warehouseCreditPostError ||
                      order.balanceWarehouseCreditPostError ? (
                      <>
                        <pre className="max-h-24 overflow-auto rounded bg-red-50 p-2 text-xs text-red-800 dark:bg-red-950/40 dark:text-red-200">
                          {rd?.warehouseCreditPostError ||
                            order.balanceWarehouseCreditPostError}
                        </pre>
                        <button
                          type="button"
                          onClick={() => void handleBalanceRetry("credit")}
                          disabled={balanceRetrying === "credit"}
                          className="mt-2 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                        >
                          {balanceRetrying === "credit"
                            ? "..."
                            : "ხელახალი SalesCredit PUT"}
                        </button>
                      </>
                    ) : (
                      <p className="text-sm text-gray-500">
                        redispatch apply-ზე (საწყობის ცვლილებისას) ავტომატურად.
                      </p>
                    )}
                  </div>
                ) : null}

                {showRedispatchDeliverySale ? (
                  <div className="rounded-lg border border-gray-100 p-4 dark:border-gray-700">
                    <h3 className="mb-2 text-sm font-semibold">
                      3. Sale — redispatch მიტანა (₾{rd?.amountDue?.toFixed(2)})
                    </h3>
                    {rd?.balanceDeliverySalePostedAt ? (
                      <p className="text-sm text-green-700 dark:text-green-300">
                        ✓ {rd.balanceDeliverySalePostedAt.toLocaleString("ka-GE")}
                      </p>
                    ) : (
                      <p className="text-sm text-yellow-800 dark:text-yellow-200">
                        BOG redispatch completed / mark-paid-ის შემდეგ.
                      </p>
                    )}
                    {rd?.balanceDeliverySalePostError ? (
                      <>
                        <pre className="mt-2 max-h-24 overflow-auto rounded bg-red-50 p-2 text-xs text-red-800 dark:bg-red-950/40 dark:text-red-200">
                          {rd.balanceDeliverySalePostError}
                        </pre>
                        <button
                          type="button"
                          onClick={() => void handleBalanceRetry("delivery")}
                          disabled={balanceRetrying === "delivery"}
                          className="mt-2 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                        >
                          {balanceRetrying === "delivery"
                            ? "..."
                            : "ხელახალი მიტანის Sale PUT"}
                        </button>
                      </>
                    ) : !rd?.balanceDeliverySalePostedAt ? (
                      <button
                        type="button"
                        onClick={() => void handleBalanceRetry("delivery")}
                        disabled={balanceRetrying === "delivery"}
                        className="mt-2 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                      >
                        {balanceRetrying === "delivery"
                          ? "..."
                          : "მიტანის Sale PUT"}
                      </button>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Workflow */}
          {isAdmin ? (
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <h2 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
                პროცესის ნაბიჯები
              </h2>
              <ul className="space-y-2">
                {workflowSteps.map((step) => (
                  <li key={step.label} className="flex items-center gap-2 text-sm">
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs ${
                        step.done
                          ? "bg-green-500 text-white"
                          : step.warn
                            ? "bg-amber-400 text-white"
                            : "bg-gray-200 text-gray-600 dark:bg-gray-600 dark:text-gray-300"
                      }`}
                    >
                      {step.done ? "✓" : step.warn ? "!" : "·"}
                    </span>
                    <span
                      className={
                        step.done
                          ? "text-gray-700 dark:text-gray-300"
                          : "text-gray-500 dark:text-gray-400"
                      }
                    >
                      {step.label}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {/* სტატუსი */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              შეკვეთის სტატუსი
            </h2>
            <div className="space-y-4">
              <div className="rounded-lg bg-gray-50 px-4 py-2 text-sm font-medium dark:bg-gray-700">
                {statusLabels[order.status]}
              </div>
              {nextStatuses.length > 0 ? (
                <>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value as OrderStatus)}
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  >
                    <option value={order.status}>{statusLabels[order.status]}</option>
                    {nextStatuses.map((status) => (
                      <option key={status} value={status}>
                        {statusLabels[status]}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={handleStatusUpdate}
                    disabled={isUpdating || selectedStatus === order.status}
                    className="w-full rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
                  >
                    {isUpdating ? "..." : "სტატუსის განახლება"}
                  </button>
                </>
              ) : null}
            </div>
          </div>

          {/* საწყობი */}
          {isAdmin ? (
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">
                საწყობი / Pickup
              </h2>
              <div className="mb-3 text-sm text-gray-600 dark:text-gray-400">
                {order.warehouseLocation || order.dispatchWarehouseId ? (
                  <span className="font-medium text-brand-700 dark:text-brand-300">
                    {warehouseNameById.get(
                      order.dispatchWarehouseId || order.warehouseLocation || "",
                    ) ||
                      order.pickupAddress?.warehouseName ||
                      "მინიჭებულია"}
                  </span>
                ) : (
                  <span className="text-amber-600">არ არის მინიჭებული</span>
                )}
              </div>
              <select
                value={order.dispatchWarehouseId || order.warehouseLocation || ""}
                disabled={assigningWarehouse}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v) void handleAssignWarehouse(v);
                }}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                <option value="">
                  {assigningWarehouse ? "იტვირთება..." : "მისაინე საწყობზე..."}
                </option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-xs text-gray-500">
                მინიჭება აახლებს pickup მისამართს Quickshipper-ისთვის.
              </p>
            </div>
          ) : null}

          {/* მომხმარებელი */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              ინფორმაცია
            </h2>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-500">მომხმარებელი: </span>
                {order.user?.fullName || "—"}
              </div>
              <div>
                <span className="text-gray-500">ტელეფონი: </span>
                {order.user?.phoneNumber || "—"}
              </div>
              <div>
                <span className="text-gray-500">შექმნა: </span>
                {order.createdAt.toLocaleString("ka-GE")}
              </div>
              <div>
                <span className="text-gray-500">გადახდა: </span>
                {paymentLabel(order.paymentStatus)}
              </div>
              {order.bogOrderId ? (
                <div className="font-mono text-xs break-all">BOG: {order.bogOrderId}</div>
              ) : null}
              {order.bogPaymentStatus ? (
                <div className="font-mono text-xs">BOG status: {order.bogPaymentStatus}</div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
