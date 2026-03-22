"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { WarehouseEmployee, WarehouseEmployeeRole } from "@/types";
import { warehousesApi } from "@/lib/api";
import { PlusIcon, PencilIcon, TrashBinIcon } from "@/icons";
import Button from "@/components/ui/button/Button";

const roleLabels: Record<WarehouseEmployeeRole, string> = {
  [WarehouseEmployeeRole.MANAGER]: "მენეჯერი",
  [WarehouseEmployeeRole.WAREHOUSE_KEEPER]: "საწყობის მცველი",
  [WarehouseEmployeeRole.PICKER]: "შემკრები",
  [WarehouseEmployeeRole.DISPATCHER]: "გამგზავნი",
  [WarehouseEmployeeRole.RECEIVER]: "მიმღები",
};

export default function WarehouseEmployeesPage() {
  const params = useParams();
  const warehouseId = params.id as string;

  const [employees, setEmployees] = useState<WarehouseEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState<string>("all");
  const [filterActive, setFilterActive] = useState<string>("all");

  useEffect(() => {
    loadEmployees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [warehouseId]);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      const response = await warehousesApi.getEmployees(warehouseId);
      setEmployees(response.data);
    } catch (err) {
      console.error("Error loading employees:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (employeeId: string) => {
    try {
      await warehousesApi.toggleEmployeeStatus(employeeId);
      await loadEmployees();
    } catch (err) {
      console.error("Error toggling employee status:", err);
      alert("შეცდომა თანამშრომლის სტატუსის შეცვლისას");
    }
  };

  // Filter employees
  const filteredEmployees = employees.filter((employee) => {
    if (filterRole !== "all" && employee.role !== filterRole) {
      return false;
    }
    if (filterActive !== "all") {
      const isActive = filterActive === "active";
      if (employee.active !== isActive) {
        return false;
      }
    }
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        employee.user?.fullName?.toLowerCase().includes(search) ||
        employee.user?.phoneNumber.toLowerCase().includes(search) ||
        employee.user?.email?.toLowerCase().includes(search) ||
        roleLabels[employee.role].toLowerCase().includes(search)
      );
    }
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">მონაცემების ჩატვირთვა...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          თანამშრომლები
        </h2>
        <Button
          size="sm"
          startIcon={<PlusIcon className="h-4 w-4" />}
          onClick={() => {
            // TODO: Open modal to add employee
            alert("თანამშრომლის დამატების ფუნქციონალი მალე დაემატება");
          }}
        >
          თანამშრომლის დამატება
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <input
          type="text"
          placeholder="ძიება თანამშრომელში..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        />
        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        >
          <option value="all">ყველა როლი</option>
          {Object.entries(roleLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <select
          value={filterActive}
          onChange={(e) => setFilterActive(e.target.value)}
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        >
          <option value="all">ყველა სტატუსი</option>
          <option value="active">აქტიური</option>
          <option value="inactive">არააქტიური</option>
        </select>
      </div>

      {/* Employees Table */}
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="border-b border-gray-200 bg-gray-50 px-6 py-4 dark:border-gray-700 dark:bg-gray-900">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            თანამშრომლების სია ({filteredEmployees.length})
          </h3>
        </div>
        {filteredEmployees.length === 0 ? (
          <div className="px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
            თანამშრომლები არ მოიძებნა
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                    სახელი
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                    ტელეფონი
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                    როლი
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                    დაწყების თარიღი
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
                {filteredEmployees.map((employee) => (
                  <tr
                    key={employee.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {employee.user?.fullName || "უცნობი"}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                      {employee.user?.phoneNumber}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                      {employee.user?.email || "-"}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex rounded-full px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        {roleLabels[employee.role]}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {new Date(employee.startedAt).toLocaleDateString("ka-GE")}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                          employee.active
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                        }`}
                      >
                        {employee.active ? "აქტიური" : "არააქტიური"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            // TODO: Open modal to edit employee
                            alert("თანამშრომლის რედაქტირების ფუნქციონალი მალე დაემატება");
                          }}
                          className="inline-flex items-center gap-1 rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                          title="რედაქტირება"
                        >
                          <PencilIcon className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (
                              confirm(
                                `დარწმუნებული ხართ რომ გსურთ ${employee.active ? "დეაქტივაცია" : "აქტივაცია"}?`
                              )
                            ) {
                              handleToggleStatus(employee.id);
                            }
                          }}
                          className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium ${
                            employee.active
                              ? "bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900 dark:text-red-200 dark:hover:bg-red-800"
                              : "bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900 dark:text-green-200 dark:hover:bg-green-800"
                          }`}
                          title={employee.active ? "დეაქტივაცია" : "აქტივაცია"}
                        >
                          {employee.active ? "დეაქტივაცია" : "აქტივაცია"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
