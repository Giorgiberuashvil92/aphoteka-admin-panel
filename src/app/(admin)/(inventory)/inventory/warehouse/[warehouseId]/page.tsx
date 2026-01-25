"use client";

import React, { useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { InventoryState, Inventory } from "@/types";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import { ChevronLeftIcon, EyeIcon } from "@/icons";
import Link from "next/link";
import { mockInventory, mockWarehouses } from "@/lib/api/mockData";

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

export default function WarehouseInventoryPage() {
  const params = useParams();
  const router = useRouter();
  const warehouseId = params.warehouseId as string;

  const warehouse = mockWarehouses.find(w => w.id === warehouseId);

  const warehouseInventory = useMemo(() => {
    return mockInventory.filter(item => item.warehouseLocation === warehouseId);
  }, [warehouseId]);

  // იერარქიული დაჯგუფება: Generic Name -> Strength -> Country/Manufacturer -> Products
  const hierarchicalData = useMemo(() => {
    // 1. დაჯგუფება Generic Name-ის მიხედვით
    const byGenericName = new Map<string, Inventory[]>();
    warehouseInventory.forEach(item => {
      const genericName = item.product?.genericName || 'უცნობი';
      if (!byGenericName.has(genericName)) {
        byGenericName.set(genericName, []);
      }
      byGenericName.get(genericName)!.push(item);
    });

    const result: Array<{
      genericName: string;
      strengths: Array<{
        strength: string;
        countries: Array<{
          country: string;
          manufacturer: string;
          products: Array<{
            productName: string;
            inventory: Inventory[];
          }>;
        }>;
      }>;
    }> = [];

    byGenericName.forEach((items, genericName) => {
      // 2. დაჯგუფება Strength-ის მიხედვით
      const byStrength = new Map<string, Inventory[]>();
      items.forEach(item => {
        const strength = item.product?.strength || 'უცნობი';
        if (!byStrength.has(strength)) {
          byStrength.set(strength, []);
        }
        byStrength.get(strength)!.push(item);
      });

      const strengths: Array<{
        strength: string;
        countries: Array<{
          country: string;
          manufacturer: string;
          products: Array<{
            productName: string;
            inventory: Inventory[];
          }>;
        }>;
      }> = [];

      byStrength.forEach((strengthItems, strength) => {
        // 3. დაჯგუფება Country/Manufacturer-ის მიხედვით
        const byCountry = new Map<string, Inventory[]>();
        strengthItems.forEach(item => {
          const country = item.product?.countryOfOrigin || 'უცნობი';
          const manufacturer = item.product?.manufacturer || '';
          const key = `${country}|||${manufacturer}`;
          if (!byCountry.has(key)) {
            byCountry.set(key, []);
          }
          byCountry.get(key)!.push(item);
        });

        const countries: Array<{
          country: string;
          manufacturer: string;
          products: Array<{
            productName: string;
            inventory: Inventory[];
          }>;
        }> = [];

        byCountry.forEach((countryItems, key) => {
          const [country, manufacturer] = key.split('|||');
          
          // 4. დაჯგუფება კონკრეტული პროდუქტების მიხედვით
          const byProduct = new Map<string, Inventory[]>();
          countryItems.forEach(item => {
            const productName = item.product?.name || 'უცნობი';
            if (!byProduct.has(productName)) {
              byProduct.set(productName, []);
            }
            byProduct.get(productName)!.push(item);
          });

          const products = Array.from(byProduct.entries()).map(([productName, inventory]) => ({
            productName,
            inventory,
          }));

          countries.push({
            country,
            manufacturer,
            products,
          });
        });

        strengths.push({
          strength,
          countries,
        });
      });

      result.push({
        genericName,
        strengths,
      });
    });

    return result;
  }, [warehouseInventory]);

  if (!warehouse) {
    return (
      <div className="space-y-6">
        <PageBreadCrumb pageTitle="საწყობის ინვენტარი" />
        <div className="rounded-lg border border-gray-200 bg-white px-6 py-8 text-center text-sm text-gray-500 shadow-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
          საწყობი არ მოიძებნა
        </div>
      </div>
    );
  }

  const getDaysUntilExpiry = (expiryDate: Date) => {
    const today = new Date();
    const diffTime = expiryDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getExpiryStatus = (expiryDate: Date) => {
    const days = getDaysUntilExpiry(expiryDate);
    if (days < 0) return { label: "ვადა გაუვიდა", color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" };
    if (days < 60) return { label: `ვადა გადის ${days} დღეში`, color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" };
    return { label: `ვადა: ${expiryDate.toLocaleDateString("ka-GE")}`, color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageBreadCrumb pageTitle={`${warehouse.name} - ინვენტარი`} />
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          <ChevronLeftIcon className="h-4 w-4" />
          უკან
        </button>
      </div>

      {/* საწყობის ინფორმაცია */}
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
                {warehouse.name}
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
          </dl>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="border-b border-gray-200 bg-gray-50 px-6 py-4 dark:border-gray-700 dark:bg-gray-900">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            წამლების ჩამონათვალი
          </h2>
        </div>
        {hierarchicalData.length === 0 ? (
          <div className="px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
            ამ საწყობში ინვენტარი არ მოიძებნა
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                    წამლის სახელწოდება
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                    Batch #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                    რაოდენობა
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                    ვადა
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                    სტატუსი
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                    მოქმედებები
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {hierarchicalData.map((genericGroup, genericIdx) => (
                  <React.Fragment key={`generic-${genericIdx}`}>
                    {/* Generic Name Row */}
                    <tr className="bg-gray-100 dark:bg-gray-900">
                      <td colSpan={6} className="px-6 py-3">
                        <div className="text-lg font-semibold text-gray-900 dark:text-white">
                          {genericGroup.genericName}
                        </div>
                      </td>
                    </tr>
                    {genericGroup.strengths.map((strengthGroup, strengthIdx) => (
                      <React.Fragment key={`strength-${strengthIdx}`}>
                        {/* Strength Row */}
                        <tr className="bg-gray-50 dark:bg-gray-800">
                          <td colSpan={6} className="px-6 py-2 pl-12">
                            <div className="text-base font-medium text-gray-800 dark:text-gray-200">
                              დოზირება: {strengthGroup.strength}
                            </div>
                          </td>
                        </tr>
                        {strengthGroup.countries.map((countryGroup, countryIdx) => (
                          <React.Fragment key={`country-${countryIdx}`}>
                            {/* Country/Manufacturer Row */}
                            <tr className="bg-gray-50/50 dark:bg-gray-800/50">
                              <td colSpan={6} className="px-6 py-2 pl-20">
                                <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                  {countryGroup.country}
                                  {countryGroup.manufacturer && ` - ${countryGroup.manufacturer}`}
                                </div>
                              </td>
                            </tr>
                            {/* Products Rows */}
                            {countryGroup.products.map((product) =>
                              product.inventory.map((item) => {
                                const expiryStatus = getExpiryStatus(item.expiryDate);
                                return (
                                  <tr
                                    key={item.id}
                                    className="hover:bg-gray-50 dark:hover:bg-gray-700"
                                  >
                                    <td className="px-6 py-4 pl-28">
                                      <div className="font-medium text-gray-900 dark:text-white">
                                        {product.productName}
                                      </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                                      {item.batchNumber}
                                    </td>
                                    <td className="px-6 py-4">
                                      <div className="text-sm">
                                        <div className="font-medium text-gray-900 dark:text-white">
                                          ხელმისაწვდომი: {item.availableQuantity}
                                        </div>
                                        <div className="text-gray-500 dark:text-gray-400">
                                          დაჯავშნილი: {item.reservedQuantity} / სულ: {item.quantity}
                                        </div>
                                      </div>
                                    </td>
                                    <td className="px-6 py-4">
                                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${expiryStatus.color}`}>
                                        {expiryStatus.label}
                                      </span>
                                    </td>
                                    <td className="px-6 py-4">
                                      <span className="inline-flex rounded-full px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                        {stateLabels[item.state as InventoryState]}
                                      </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                      <Link
                                        href={`/inventory/${item.id}`}
                                        className="inline-flex items-center gap-1 rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-600"
                                        title="ნახვა"
                                      >
                                        <EyeIcon className="h-3.5 w-3.5" />
                                        ნახვა
                                      </Link>
                                    </td>
                                  </tr>
                                );
                              })
                            )}
                          </React.Fragment>
                        ))}
                      </React.Fragment>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
