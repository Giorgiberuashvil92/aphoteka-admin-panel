"use client";

import React, { useState } from "react";
import type { AuditLog } from "@/types";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";

// Mock data
const mockAuditLogs: AuditLog[] = [
  {
    id: "1",
    entityType: "order",
    entityId: "ORD-001",
    action: "status_updated",
    userId: "user-2",
    user: {
      id: "user-2",
      role: "operations" as any,
      phoneNumber: "+995555654321",
      fullName: "ანა მელაძე",
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    changes: { status: { from: "created", to: "confirmed" } },
    ipAddress: "192.168.1.1",
    createdAt: new Date("2024-01-20T10:05:00"),
  },
  {
    id: "2",
    entityType: "inventory",
    entityId: "inv-1",
    action: "quantity_adjusted",
    userId: "user-2",
    user: {
      id: "user-2",
      role: "operations" as any,
      phoneNumber: "+995555654321",
      fullName: "ანა მელაძე",
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    changes: { quantity: { from: 1000, to: 950 }, reason: "damage" },
    ipAddress: "192.168.1.1",
    createdAt: new Date("2024-01-19T14:30:00"),
  },
];

const entityTypeLabels: Record<string, string> = {
  order: "შეკვეთა",
  inventory: "ინვენტარი",
  payment: "გადახდა",
  user: "მომხმარებელი",
  product: "პროდუქტი",
};

const actionLabels: Record<string, string> = {
  status_updated: "სტატუსის განახლება",
  quantity_adjusted: "რაოდენობის რეგულირება",
  created: "შექმნა",
  updated: "განახლება",
  deleted: "წაშლა",
  payment_processed: "გადახდის დამუშავება",
};

export default function AuditReportsPage() {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(mockAuditLogs);
  const [filterEntityType, setFilterEntityType] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  const filteredLogs = auditLogs.filter((log: AuditLog) => {
    const matchesSearch =
      log.entityId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.user?.fullName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesEntityType = filterEntityType === "all" || log.entityType === filterEntityType;
    return matchesSearch && matchesEntityType;
  });

  return (
    <div className="space-y-6">
      <PageBreadCrumb pageTitle="აუდიტის ლოგი" />

      {/* Filters */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          ფილტრები
        </h2>
        <div className="flex flex-col gap-4 sm:flex-row">
          <input
            type="text"
            placeholder="ძიება Entity ID ან მომხმარებლის სახელით..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
          <select
            value={filterEntityType}
            onChange={(e) => setFilterEntityType(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          >
            <option value="all">ყველა ტიპი</option>
            {Object.entries(entityTypeLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                  თარიღი
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                  მომხმარებელი
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                  ტიპი
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                  Entity ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                  მოქმედება
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                  ცვლილებები
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                  IP მისამართი
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-sm text-gray-500">
                    აუდიტის ჩანაწერები არ მოიძებნა
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log: AuditLog) => (
                  <tr
                    key={log.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {log.createdAt.toLocaleDateString("ka-GE", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {log.user?.fullName || "Unknown"}
                        </div>
                        <div className="text-gray-500 dark:text-gray-400">
                          {log.user?.phoneNumber}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex rounded-full px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        {entityTypeLabels[log.entityType] || log.entityType}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                      {log.entityId}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {actionLabels[log.action] || log.action}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {log.changes ? (
                        <details className="cursor-pointer">
                          <summary className="text-brand-500 hover:text-brand-600">
                            ნახვა
                          </summary>
                          <pre className="mt-2 rounded bg-gray-100 p-2 text-xs dark:bg-gray-700">
                            {JSON.stringify(log.changes, null, 2)}
                          </pre>
                        </details>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {log.ipAddress || "-"}
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
