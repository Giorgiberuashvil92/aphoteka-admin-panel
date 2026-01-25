"use client";

import React, { useState } from "react";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import { SystemSettings } from "@/types";

// Mock data
const mockSettings: SystemSettings[] = [
  {
    id: "1",
    key: "app_name",
    value: "აფთიაქა",
    category: "general",
    description: "აპლიკაციის სახელი",
    updatedAt: new Date(),
  },
  {
    id: "2",
    key: "min_order_amount",
    value: "20",
    category: "delivery",
    description: "მინიმალური შეკვეთის თანხა",
    updatedAt: new Date(),
  },
  {
    id: "3",
    key: "expiry_warning_days",
    value: "60",
    category: "inventory",
    description: "ვადის გასვლის გაფრთხილების დღეები",
    updatedAt: new Date(),
  },
  {
    id: "4",
    key: "reservation_timeout_minutes",
    value: "15",
    category: "inventory",
    description: "ინვენტარის დაჯავშნის timeout (წუთებში)",
    updatedAt: new Date(),
  },
];

const categoryLabels: Record<string, string> = {
  general: "ზოგადი",
  payment: "გადახდა",
  delivery: "მიტანა",
  notification: "შეტყობინებები",
  inventory: "ინვენტარი",
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<SystemSettings[]>(mockSettings);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const [filterCategory, setFilterCategory] = useState<string>("all");

  const filteredSettings = settings.filter(
    (setting) => filterCategory === "all" || setting.category === filterCategory
  );

  const groupedSettings = filteredSettings.reduce((acc, setting) => {
    if (!acc[setting.category]) {
      acc[setting.category] = [];
    }
    acc[setting.category].push(setting);
    return acc;
  }, {} as Record<string, SystemSettings[]>);

  const startEditing = (setting: SystemSettings) => {
    setEditingId(setting.id);
    setEditValue(setting.value);
  };

  const saveSetting = (id: string) => {
    setSettings(
      settings.map((s) =>
        s.id === id ? { ...s, value: editValue, updatedAt: new Date() } : s
      )
    );
    setEditingId(null);
    setEditValue("");
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditValue("");
  };

  return (
    <div className="space-y-6">
      <PageBreadCrumb pageTitle="სისტემის პარამეტრები" />

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        >
          <option value="all">ყველა კატეგორია</option>
          {Object.entries(categoryLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* Settings by Category */}
      <div className="space-y-6">
        {Object.entries(groupedSettings).map(([category, categorySettings]) => (
          <div
            key={category}
            className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800"
          >
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              {categoryLabels[category] || category}
            </h2>
            <div className="space-y-4">
              {categorySettings.map((setting) => (
                <div
                  key={setting.id}
                  className="flex items-center justify-between border-b border-gray-200 pb-4 last:border-0 dark:border-gray-700"
                >
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 dark:text-white">
                      {setting.key}
                    </div>
                    {setting.description && (
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {setting.description}
                      </div>
                    )}
                  </div>
                  <div className="ml-4 flex items-center gap-2">
                    {editingId === setting.id ? (
                      <>
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="rounded-lg border border-gray-300 bg-white px-3 py-1 text-sm focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        />
                        <button
                          onClick={() => saveSetting(setting.id)}
                          className="rounded-lg bg-brand-500 px-3 py-1 text-sm text-white hover:bg-brand-600"
                        >
                          შენახვა
                        </button>
                        <button
                          onClick={cancelEditing}
                          className="rounded-lg border border-gray-300 bg-white px-3 py-1 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300"
                        >
                          გაუქმება
                        </button>
                      </>
                    ) : (
                      <>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {setting.value}
                        </span>
                        <button
                          onClick={() => startEditing(setting)}
                          className="rounded px-2 py-1 text-sm text-brand-600 hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-900/30"
                        >
                          რედაქტირება
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
