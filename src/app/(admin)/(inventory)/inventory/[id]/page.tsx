"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { InventoryState, Inventory } from "@/types";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import { ChevronLeftIcon, PencilIcon } from "@/icons";
import Link from "next/link";
import { inventoryApi } from "@/lib/api";

const stateLabels: Record<InventoryState, string> = {
  [InventoryState.RECEIVED_BLOCKED]: "მიღებული (დაბლოკილი)",
  [InventoryState.AVAILABLE]: "ხელმისაწვდომი",
  [InventoryState.RESERVED]: "დაჯავშნილი",
  [InventoryState.PICKED]: "აირჩევა",
  [InventoryState.DISPATCHED]: "გაგზავნილი",
  [InventoryState.CONSUMED]: "გაყიდული",
  [InventoryState.EXPIRED]: "ვადა გაუვიდა",
  [InventoryState.REJECTED]: "უარყოფილი",
};

export default function InventoryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const inventoryId = params.id as string;

  const [inventoryItem, setInventoryItem] = useState<Inventory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        setLoading(true);
        const response = await inventoryApi.getById(inventoryId);
        console.log('Inventory detail response:', JSON.stringify(response, null, 2));
        console.log('Product data:', response.data?.product);
        console.log('Warehouse data:', (response.data as any)?.warehouseId);
        setInventoryItem(response.data as any);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        setError(error);
      } finally {
        setLoading(false);
      }
    };

    if (inventoryId) {
      fetchInventory();
    }
  }, [inventoryId]);

  if (loading) {
    return (
      <div className="space-y-6">
        <PageBreadCrumb pageTitle="ინვენტარის დეტალები" />
        <div className="rounded-lg border border-gray-200 bg-white px-6 py-8 text-center text-sm text-gray-500 shadow-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
          იტვირთება...
        </div>
      </div>
    );
  }

  if (error || !inventoryItem) {
    return (
      <div className="space-y-6">
        <PageBreadCrumb pageTitle="ინვენტარის დეტალები" />
        <div className="rounded-lg border border-gray-200 bg-white px-6 py-8 text-center text-sm text-gray-500 shadow-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
          {error ? `შეცდომა: ${error.message}` : "ინვენტარი არ მოიძებნა"}
        </div>
      </div>
    );
  }

  // Backend returns populated productId and warehouseId
  const product = (inventoryItem as any).productId || inventoryItem.product;
  const warehouse = (inventoryItem as any).warehouseId || (inventoryItem as any).warehouse;
  
  console.log('Rendering with product:', product);
  console.log('Rendering with warehouse:', warehouse);
  console.log('Full inventory item:', inventoryItem);
  
  const getDaysUntilExpiry = (expiryDate: Date | string) => {
    const today = new Date();
    const expiry = expiryDate instanceof Date ? expiryDate : new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getExpiryStatus = (expiryDate: Date | string) => {
    const days = getDaysUntilExpiry(expiryDate);
    const expiry = expiryDate instanceof Date ? expiryDate : new Date(expiryDate);
    if (days < 0) return { label: "ვადა გაუვიდა", color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" };
    if (days < 60) return { label: `ვადა გადის ${days} დღეში`, color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" };
    return { label: `ვადა: ${expiry.toLocaleDateString("ka-GE")}`, color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" };
  };

  const expiryStatus = getExpiryStatus(inventoryItem.expiryDate);
  const expiryDate = inventoryItem.expiryDate instanceof Date ? inventoryItem.expiryDate : new Date(inventoryItem.expiryDate);
  const receivedDate = inventoryItem.receivedDate instanceof Date ? inventoryItem.receivedDate : new Date(inventoryItem.receivedDate);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageBreadCrumb pageTitle="ინვენტარის დეტალები" />
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          <ChevronLeftIcon className="h-4 w-4" />
          უკან
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* მთავარი ინფორმაცია */}
        <div className="lg:col-span-2 space-y-6">
          {/* პროდუქტის ინფორმაცია */}
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="border-b border-gray-200 bg-gray-50 px-6 py-4 dark:border-gray-700 dark:bg-gray-900">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                პროდუქტის ინფორმაცია
              </h2>
            </div>
            <div className="px-6 py-4">
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    პროდუქტის სახელი
                  </dt>
                  <dd className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                    {product?.name || "უცნობი"}
                  </dd>
                </div>
                {product?.description && (
                  <div className="sm:col-span-2">
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      აღწერა
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                      {product.description}
                    </dd>
                  </div>
                )}
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    გენერიკული სახელი
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                    {product?.genericName || "უცნობი"}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    მწარმოებელი
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                    {product?.manufacturer || "უცნობი"}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    ქვეყანა
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                    {product?.countryOfOrigin || "უცნობი"}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    დოზირება
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                    {product?.strength || "უცნობი"}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    ფორმა
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                    {product?.dosageForm || "უცნობი"}
                  </dd>
                </div>
                {product?.packSize && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      შეფუთვა
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                      {product.packSize}
                    </dd>
                  </div>
                )}
                {product?.sku && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      SKU
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                      {product.sku}
                    </dd>
                  </div>
                )}
                {product?.barcode && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Barcode
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                      {product.barcode}
                    </dd>
                  </div>
                )}
                {product?.price && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      ერთეულის ფასი
                    </dt>
                    <dd className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                      {typeof product.price === 'number' ? product.price.toFixed(2) : product.price} ₾
                    </dd>
                  </div>
                )}
                {product?.quantity !== undefined && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      რაოდენობა
                    </dt>
                    <dd className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                      {product.quantity} {product?.unitOfMeasure || "ცალი"}
                    </dd>
                  </div>
                )}
                {product?.totalPrice !== undefined && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      სულ ღირებულება
                    </dt>
                    <dd className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                      {typeof product.totalPrice === 'number' ? product.totalPrice.toFixed(2) : product.totalPrice} ₾
                    </dd>
                  </div>
                )}
                {product?.productCode && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      საქონლის კოდი
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                      {product.productCode}
                    </dd>
                  </div>
                )}
                {product?.productNameBrand && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      ბრენდის სახელი
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                      {product.productNameBrand}
                    </dd>
                  </div>
                )}
                {product?.taxation && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      დაბეგვრა
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                      {product.taxation}
                    </dd>
                  </div>
                )}
                {product?.invoiceNumber && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      ზედნადების ნომერი
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                      {product.invoiceNumber}
                    </dd>
                  </div>
                )}
                {product?.buyer && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      მყიდველი
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                      {product.buyer}
                    </dd>
                  </div>
                )}
                {product?.seller && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      გამყიდველი
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                      {product.seller}
                    </dd>
                  </div>
                )}
                {product?.activationDate && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      გააქტიურების თარიღი
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                      {new Date(product.activationDate).toLocaleDateString("ka-GE")}
                    </dd>
                  </div>
                )}
                {product?.transportStartDate && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      ტრანსპორტირების დაწყების თარიღი
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                      {new Date(product.transportStartDate).toLocaleDateString("ka-GE")}
                    </dd>
                  </div>
                )}
                {product?.certificateNumber && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      ფირნიშის/ცნობის ნომერი
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                      {product.certificateNumber}
                    </dd>
                  </div>
                )}
                {product?.documentNumber && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      დოკუმენტის ნომერი
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                      {product.documentNumber}
                    </dd>
                  </div>
                )}
                {product?.serialNumber && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      სერიის ნომერი
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                      {product.serialNumber}
                    </dd>
                  </div>
                )}
                {product?.packagingType && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      შეფუთვის ტიპი
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                      {product.packagingType}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          </div>

          {/* ინვენტარის ინფორმაცია */}
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="border-b border-gray-200 bg-gray-50 px-6 py-4 dark:border-gray-700 dark:bg-gray-900">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                ინვენტარის ინფორმაცია
              </h2>
            </div>
            <div className="px-6 py-4">
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Batch ნომერი
                  </dt>
                  <dd className="mt-1 text-sm font-medium text-gray-900 dark:text-white">
                    {inventoryItem.batchNumber}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    სტატუსი
                  </dt>
                  <dd className="mt-1">
                    <span className="inline-flex rounded-full px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      {stateLabels[inventoryItem.state]}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    სულ რაოდენობა
                  </dt>
                  <dd className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                    {inventoryItem.quantity}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    ხელმისაწვდომი რაოდენობა
                  </dt>
                  <dd className="mt-1 text-sm font-semibold text-green-600 dark:text-green-400">
                    {inventoryItem.availableQuantity}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    დაჯავშნილი რაოდენობა
                  </dt>
                  <dd className="mt-1 text-sm font-semibold text-yellow-600 dark:text-yellow-400">
                    {inventoryItem.reservedQuantity}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    ვადის სტატუსი
                  </dt>
                  <dd className="mt-1">
                    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${expiryStatus.color}`}>
                      {expiryStatus.label}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    ვადის გასვლის თარიღი
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                    {expiryDate.toLocaleDateString("ka-GE")}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    მიღების თარიღი
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                    {receivedDate.toLocaleDateString("ka-GE")}
                  </dd>
                </div>
                {inventoryItem.supplier && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      მომწოდებელი
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                      {inventoryItem.supplier}
                    </dd>
                  </div>
                )}
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    საწყობი
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                    {warehouse?.name || inventoryItem.warehouseName || inventoryItem.warehouseLocation || "უცნობი"}
                  </dd>
                </div>
                {warehouse?.address && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      საწყობის მისამართი
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                      {warehouse.address}
                    </dd>
                  </div>
                )}
                {warehouse?.city && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      ქალაქი
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                      {warehouse.city}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          </div>

          {/* საწყობის ინფორმაცია */}
          {warehouse && (
            <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <div className="border-b border-gray-200 bg-gray-50 px-6 py-4 dark:border-gray-700 dark:bg-gray-900">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  საწყობის ინფორმაცია
                </h2>
              </div>
              <div className="px-6 py-4">
                <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      საწყობის სახელი
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                      {warehouse.name || "უცნობი"}
                    </dd>
                  </div>
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
                        ელ. ფოსტა
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                        {warehouse.email}
                      </dd>
                    </div>
                  )}
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      სტატუსი
                    </dt>
                    <dd className="mt-1">
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                        warehouse.active 
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                      }`}>
                        {warehouse.active ? "აქტიური" : "არააქტიური"}
                      </span>
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          )}
        </div>

        {/* მოქმედებები */}
        <div className="space-y-6">
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="border-b border-gray-200 bg-gray-50 px-6 py-4 dark:border-gray-700 dark:bg-gray-900">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                მოქმედებები
              </h2>
            </div>
            <div className="px-6 py-4 space-y-3">
              <Link
                href={`/inventory/${inventoryItem.id}/adjust`}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              >
                <PencilIcon className="h-4 w-4" />
                რეგულირება
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
