"use client";

import React, { useState } from "react";
import { Notification } from "@/types";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import { BellIcon } from "@/icons";

// Mock data
const mockNotifications: Notification[] = [
  {
    id: "1",
    type: "order",
    title: "ახალი შეკვეთა",
    message: "შექმნილია ახალი შეკვეთა #ORD-001",
    read: false,
    actionUrl: "/orders/ORD-001",
    createdAt: new Date("2024-01-20T10:00:00"),
  },
  {
    id: "2",
    type: "inventory",
    title: "დაბალი მარაგი",
    message: "Paracetamol 500mg-ის მარაგი დაბალია (50 ერთეული)",
    read: false,
    actionUrl: "/inventory",
    createdAt: new Date("2024-01-20T09:30:00"),
  },
  {
    id: "3",
    type: "promotion",
    title: "ფასდაკლება დასრულდა",
    message: "ზამთრის ფასდაკლება დასრულდა",
    read: true,
    createdAt: new Date("2024-01-19T18:00:00"),
  },
];

const typeLabels: Record<string, string> = {
  order: "შეკვეთა",
  inventory: "ინვენტარი",
  promotion: "ფასდაკლება",
  system: "სისტემა",
  payment: "გადახდა",
};

const typeColors: Record<string, string> = {
  order: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  inventory: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  promotion: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  system: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
  payment: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [filterType, setFilterType] = useState<string>("all");
  const [filterRead, setFilterRead] = useState<string>("all");

  const filteredNotifications = notifications.filter((notif) => {
    const matchesType = filterType === "all" || notif.type === filterType;
    const matchesRead =
      filterRead === "all" ||
      (filterRead === "read" && notif.read) ||
      (filterRead === "unread" && !notif.read);
    return matchesType && matchesRead;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications(
      notifications.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, read: true })));
  };

  return (
    <div className="space-y-6">
      <PageBreadCrumb pageTitle="შეტყობინებები" />

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <BellIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            შეტყობინებები
            {unreadCount > 0 && (
              <span className="ml-2 rounded-full bg-red-500 px-2 py-1 text-xs text-white">
                {unreadCount}
              </span>
            )}
          </h2>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
          >
            ყველას წაკითხულად მონიშვნა
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        >
          <option value="all">ყველა ტიპი</option>
          {Object.entries(typeLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <select
          value={filterRead}
          onChange={(e) => setFilterRead(e.target.value)}
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        >
          <option value="all">ყველა</option>
          <option value="unread">წაუკითხავი</option>
          <option value="read">წაკითხული</option>
        </select>
      </div>

      {/* Notifications List */}
      <div className="space-y-2">
        {filteredNotifications.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white p-8 text-center dark:border-gray-700 dark:bg-gray-800">
            <p className="text-sm text-gray-500">შეტყობინებები არ მოიძებნა</p>
          </div>
        ) : (
          filteredNotifications.map((notif) => (
            <div
              key={notif.id}
              className={`rounded-lg border p-4 transition-colors ${
                notif.read
                  ? "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"
                  : "border-brand-200 bg-brand-50 dark:border-brand-800 dark:bg-brand-900/20"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${typeColors[notif.type]}`}
                    >
                      {typeLabels[notif.type] || notif.type}
                    </span>
                    {!notif.read && (
                      <span className="h-2 w-2 rounded-full bg-brand-500"></span>
                    )}
                  </div>
                  <h3 className="mt-2 font-medium text-gray-900 dark:text-white">
                    {notif.title}
                  </h3>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    {notif.message}
                  </p>
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-500">
                    {notif.createdAt.toLocaleDateString("ka-GE", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <div className="ml-4 flex items-start gap-2">
                  {notif.actionUrl && (
                    <a
                      href={notif.actionUrl}
                      className="rounded px-3 py-1 text-sm text-brand-600 hover:bg-brand-100 dark:text-brand-400 dark:hover:bg-brand-900/30"
                    >
                      ნახვა
                    </a>
                  )}
                  {!notif.read && (
                    <button
                      onClick={() => markAsRead(notif.id)}
                      className="rounded px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
                    >
                      წაკითხული
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
