"use client";

import React, { useState } from "react";
import { DeliveryZone } from "@/types";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import { PlusIcon, PencilIcon, TrashBinIcon, EyeIcon } from "@/icons";
import Link from "next/link";

// Mock data
const mockDeliveryZones: DeliveryZone[] = [
  {
    id: "1",
    name: "თბილისი - ცენტრი",
    description: "ცენტრალური რაიონები",
    city: "თბილისი",
    areas: ["ვაკე", "საბურთალო", "ისანი", "ნაძალადევი"],
    deliveryFee: 5.00,
    minOrderAmount: 50,
    estimatedDeliveryTime: 2,
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "2",
    name: "თბილისი - გარეუბნები",
    description: "გარეუბნები",
    city: "თბილისი",
    areas: ["დიდგორი", "გლდანი", "ვარკეთილი"],
    deliveryFee: 10.00,
    minOrderAmount: 100,
    estimatedDeliveryTime: 4,
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export default function DeliveryZonesPage() {
  const [zones, setZones] = useState<DeliveryZone[]>(mockDeliveryZones);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredZones = zones.filter(
    (zone) =>
      zone.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      zone.city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleZoneStatus = (id: string) => {
    setZones(
      zones.map((z) =>
        z.id === id ? { ...z, active: !z.active } : z
      )
    );
  };

  return (
    <div className="space-y-6">
      <PageBreadCrumb pageTitle="მიტანის ზონების მენეჯმენტი" />

      {/* Header Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1">
          <input
            type="text"
            placeholder="ძიება ზონებში..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          />
        </div>
        <Link
          href="/delivery-zones/new"
          className="flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
        >
          <PlusIcon className="h-4 w-4" />
          ახალი ზონა
        </Link>
      </div>

      {/* Delivery Zones Table */}
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                  ზონა
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                  ქალაქი
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                  რაიონები
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                  მიტანის საფასური
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                  მინ. შეკვეთა
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                  დრო
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
              {filteredZones.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-sm text-gray-500">
                    ზონები არ მოიძებნა
                  </td>
                </tr>
              ) : (
                filteredZones.map((zone) => (
                  <tr
                    key={zone.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {zone.name}
                      </div>
                      {zone.description && (
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {zone.description}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {zone.city}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex flex-wrap gap-1">
                        {zone.areas.slice(0, 2).map((area, idx) => (
                          <span
                            key={idx}
                            className="inline-flex rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                          >
                            {area}
                          </span>
                        ))}
                        {zone.areas.length > 2 && (
                          <span className="text-xs text-gray-400">
                            +{zone.areas.length - 2} მეტი
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                      ₾{zone.deliveryFee.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {zone.minOrderAmount ? `₾${zone.minOrderAmount}` : "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {zone.estimatedDeliveryTime} საათი
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                          zone.active
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                        }`}
                      >
                        {zone.active ? "აქტიური" : "არააქტიური"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/delivery-zones/${zone.id}`}
                          className="rounded p-1 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
                          title="ნახვა"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </Link>
                        <Link
                          href={`/delivery-zones/${zone.id}/edit`}
                          className="rounded p-1 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
                          title="რედაქტირება"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => toggleZoneStatus(zone.id)}
                          className="rounded p-1 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
                          title={zone.active ? "დეაქტივაცია" : "აქტივაცია"}
                        >
                          {zone.active ? (
                            <TrashBinIcon className="h-4 w-4" />
                          ) : (
                            <EyeIcon className="h-4 w-4" />
                          )}
                        </button>
                      </div>
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
