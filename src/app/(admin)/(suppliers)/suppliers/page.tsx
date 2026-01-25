"use client";

import React, { useState } from "react";
import { Supplier } from "@/types";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import { PlusIcon, PencilIcon, TrashBinIcon, EyeIcon } from "@/icons";
import Link from "next/link";

// Mock data
const mockSuppliers: Supplier[] = [
  {
    id: "1",
    name: "Supplier ABC",
    contactPerson: "გიორგი ბერიძე",
    phoneNumber: "+995555123456",
    email: "info@supplierabc.ge",
    address: "რუსთაველის გამზირი 1",
    city: "თბილისი",
    taxId: "123456789",
    certificateNumber: "CERT-001",
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "2",
    name: "Supplier XYZ",
    contactPerson: "ანა მელაძე",
    phoneNumber: "+995555654321",
    email: "info@supplierxyz.ge",
    address: "აღმაშენებლის გამზირი 10",
    city: "თბილისი",
    taxId: "987654321",
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>(mockSuppliers);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredSuppliers = suppliers.filter(
    (supplier) =>
      supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.phoneNumber.includes(searchTerm) ||
      supplier.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleSupplierStatus = (id: string) => {
    setSuppliers(
      suppliers.map((s) =>
        s.id === id ? { ...s, active: !s.active } : s
      )
    );
  };

  return (
    <div className="space-y-6">
      <PageBreadCrumb pageTitle="მომწოდებლების მენეჯმენტი" />

      {/* Header Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1">
          <input
            type="text"
            placeholder="ძიება სახელით, ტელეფონით ან ელფოსტით..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          />
        </div>
        <Link
          href="/suppliers/new"
          className="flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
        >
          <PlusIcon className="h-4 w-4" />
          ახალი მომწოდებელი
        </Link>
      </div>

      {/* Suppliers Table */}
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                  მომწოდებელი
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                  კონტაქტი
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                  მისამართი
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                  ს/კ
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
              {filteredSuppliers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-500">
                    მომწოდებლები არ მოიძებნა
                  </td>
                </tr>
              ) : (
                filteredSuppliers.map((supplier) => (
                  <tr
                    key={supplier.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {supplier.name}
                      </div>
                      {supplier.contactPerson && (
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {supplier.contactPerson}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <div className="text-gray-900 dark:text-white">
                          {supplier.phoneNumber}
                        </div>
                        {supplier.email && (
                          <div className="text-gray-500 dark:text-gray-400">
                            {supplier.email}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {supplier.address ? (
                        <div>
                          {supplier.address}
                          {supplier.city && <div>{supplier.city}</div>}
                        </div>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {supplier.taxId || "-"}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                          supplier.active
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                        }`}
                      >
                        {supplier.active ? "აქტიური" : "არააქტიური"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/suppliers/${supplier.id}`}
                          className="rounded p-1 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
                          title="ნახვა"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </Link>
                        <Link
                          href={`/suppliers/${supplier.id}/edit`}
                          className="rounded p-1 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
                          title="რედაქტირება"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => toggleSupplierStatus(supplier.id)}
                          className="rounded p-1 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
                          title={supplier.active ? "დეაქტივაცია" : "აქტივაცია"}
                        >
                          {supplier.active ? (
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
