"use client";

import React, { useState } from "react";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import { PlusIcon, PencilIcon, TrashBinIcon, CheckCircleIcon, AlertIcon, EyeIcon, EyeCloseIcon } from "@/icons";
import { mockProducts, mockCategories } from "@/lib/api/mockData";
import { getApiBaseUrl } from "@/lib/apiBaseUrl";

// Mobile App Version
interface MobileAppVersion {
  id: string;
  platform: "ios" | "android";
  version: string;
  buildNumber: string;
  minRequiredVersion: boolean;
  forceUpdate: boolean;
  releaseNotes: string;
  releaseDate: Date;
  active: boolean;
}

// Mobile App Banner
interface MobileAppBanner {
  id: string;
  title: string;
  message: string;
  type: "info" | "warning" | "promotion" | "maintenance";
  startDate: Date;
  endDate: Date;
  active: boolean;
  targetAudience: "all" | "ios" | "android";
}

// Mock data
const mockVersions: MobileAppVersion[] = [
  {
    id: "1",
    platform: "ios",
    version: "1.2.0",
    buildNumber: "120",
    minRequiredVersion: true,
    forceUpdate: false,
    releaseNotes: "ახალი ფუნქციები და გაუმჯობესებები",
    releaseDate: new Date("2024-01-15"),
    active: true,
  },
  {
    id: "2",
    platform: "android",
    version: "1.2.0",
    buildNumber: "120",
    minRequiredVersion: true,
    forceUpdate: false,
    releaseNotes: "ახალი ფუნქციები და გაუმჯობესებები",
    releaseDate: new Date("2024-01-15"),
    active: true,
  },
  {
    id: "3",
    platform: "ios",
    version: "1.1.5",
    buildNumber: "115",
    minRequiredVersion: false,
    forceUpdate: false,
    releaseNotes: "ბაგების გასწორება",
    releaseDate: new Date("2024-01-01"),
    active: false,
  },
];

const mockBanners: MobileAppBanner[] = [
  {
    id: "1",
    title: "ახალი ფუნქცია",
    message: "ახლა შეგიძლიათ შეუკვეთოთ წამლები ონლაინ!",
    type: "promotion",
    startDate: new Date("2024-01-01"),
    endDate: new Date("2024-12-31"),
    active: true,
    targetAudience: "all",
  },
  {
    id: "2",
    title: "მოვლა",
    message: "სისტემა იქნება მოვლაში 15 იანვარს 02:00-04:00 საათებში",
    type: "maintenance",
    startDate: new Date("2024-01-15"),
    endDate: new Date("2024-01-15"),
    active: true,
    targetAudience: "all",
  },
];

const platformLabels: Record<string, string> = {
  ios: "iOS",
  android: "Android",
};

const bannerTypeLabels: Record<string, string> = {
  info: "ინფორმაცია",
  warning: "გაფრთხილება",
  promotion: "პრომოცია",
  maintenance: "მოვლა",
};

export default function MobileAppPage() {
  const [versions, setVersions] = useState<MobileAppVersion[]>(mockVersions);
  const [banners, setBanners] = useState<MobileAppBanner[]>(mockBanners);
  const [activeTab, setActiveTab] = useState<"versions" | "banners" | "content">("versions");
  
  // პროდუქტების ხილვადობა მობილურ აპლიკაციაში
  const [productVisibility, setProductVisibility] = useState<Map<string, boolean>>(
    new Map(mockProducts.slice(0, 10).map(p => [p.id, p.active]))
  );
  
  // კატეგორიების ხილვადობა მობილურ აპლიკაციაში
  const [categoryVisibility, setCategoryVisibility] = useState<Map<string, boolean>>(
    new Map(mockCategories.map(c => [c.id, c.active]))
  );
  
  // ფუნქციების ჩართვა/გამორთვა
  const [features, setFeatures] = useState({
    orders: true,
    promotions: true,
    delivery: true,
    reviews: true,
    favorites: true,
    notifications: true,
  });

  const toggleVersionActive = (id: string) => {
    setVersions(versions.map(v => v.id === id ? { ...v, active: !v.active } : v));
  };

  const toggleBannerActive = (id: string) => {
    setBanners(banners.map(b => b.id === id ? { ...b, active: !b.active } : b));
  };

  const deleteBanner = (id: string) => {
    setBanners(banners.filter(b => b.id !== id));
  };

  const adminApiBase = getApiBaseUrl();

  return (
    <div className="space-y-6">
      <PageBreadCrumb pageTitle="მობილური აპლიკაციის მართვა" />

      <div className="rounded-xl border border-brand-200 bg-brand-50/80 p-5 dark:border-brand-800 dark:bg-brand-950/30">
        <h2 className="text-base font-semibold text-brand-900 dark:text-brand-100">
          Expo — Kutuku (მონორეპო)
        </h2>
        <p className="mt-2 text-sm text-brand-800 dark:text-brand-200">
          კოდი: <code className="rounded bg-white/60 px-1.5 py-0.5 text-xs dark:bg-black/30">Kutuku-MobileApp/</code>
          · iOS bundle / Android package: <code className="rounded bg-white/60 px-1.5 py-0.5 text-xs dark:bg-black/30">app.json</code> → expo.ios.bundleIdentifier, expo.android.package
        </p>
        <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-brand-800 dark:text-brand-200">
          <li>
            გაშვება root-იდან:{" "}
            <code className="rounded bg-white/60 px-1.5 py-0.5 text-xs dark:bg-black/30">npm run expo</code> · iOS:{" "}
            <code className="rounded bg-white/60 px-1.5 py-0.5 text-xs dark:bg-black/30">npm run expo:ios</code> · Android:{" "}
            <code className="rounded bg-white/60 px-1.5 py-0.5 text-xs dark:bg-black/30">npm run expo:android</code>
          </li>
          <li>
            API (იგივე Nest რაც admin): admin აქ იყენებს{" "}
            <code className="rounded bg-white/60 px-1.5 py-0.5 text-xs dark:bg-black/30">{adminApiBase}</code>
          </li>
          <li>
            მობილური API დროებით ყოველთვის Railway (იგივე Nest); override:{" "}
            <code className="rounded bg-white/60 px-1.5 py-0.5 text-xs dark:bg-black/30">EXPO_PUBLIC_API_URL</code>{" "}
            <code className="rounded bg-white/60 px-1.5 py-0.5 text-xs dark:bg-black/30">Kutuku-MobileApp/.env</code> · EAS:{" "}
            <code className="rounded bg-white/60 px-1.5 py-0.5 text-xs dark:bg-black/30">eas.json</code>
          </li>
          <li>
            Build: <code className="rounded bg-white/60 px-1.5 py-0.5 text-xs dark:bg-black/30">cd Kutuku-MobileApp && npx eas-cli build --platform all</code>
          </li>
        </ul>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab("versions")}
            className={`whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium ${
              activeTab === "versions"
                ? "border-brand-500 text-brand-600 dark:text-brand-400"
                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            }`}
          >
            ვერსიები
          </button>
          <button
            onClick={() => setActiveTab("banners")}
            className={`whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium ${
              activeTab === "banners"
                ? "border-brand-500 text-brand-600 dark:text-brand-400"
                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            }`}
          >
            ბანერები
          </button>
          <button
            onClick={() => setActiveTab("content")}
            className={`whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium ${
              activeTab === "content"
                ? "border-brand-500 text-brand-600 dark:text-brand-400"
                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            }`}
          >
            კონტენტი
          </button>
        </nav>
      </div>

      {/* Versions Tab */}
      {activeTab === "versions" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              აპლიკაციის ვერსიები
            </h2>
            <button className="flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600">
              <PlusIcon className="h-4 w-4" />
              ახალი ვერსია
            </button>
          </div>

          {/* iOS Versions */}
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="border-b border-gray-200 bg-gray-50 px-6 py-4 dark:border-gray-700 dark:bg-gray-900">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                iOS ვერსიები
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                      ვერსია
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                      Build #
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                      მინ. ვერსია
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                      Force Update
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                      გამოშვების თარიღი
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
                  {versions
                    .filter(v => v.platform === "ios")
                    .map((version) => (
                      <tr key={version.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900 dark:text-white">
                            {version.version}
                          </div>
                          {version.releaseNotes && (
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {version.releaseNotes}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                          {version.buildNumber}
                        </td>
                        <td className="px-6 py-4">
                          {version.minRequiredVersion ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-200">
                              <CheckCircleIcon className="h-3 w-3" />
                              დიახ
                            </span>
                          ) : (
                            <span className="text-sm text-gray-500 dark:text-gray-400">არა</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {version.forceUpdate ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-800 dark:bg-red-900 dark:text-red-200">
                              <AlertIcon className="h-3 w-3" />
                              დიახ
                            </span>
                          ) : (
                            <span className="text-sm text-gray-500 dark:text-gray-400">არა</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                          {version.releaseDate.toLocaleDateString("ka-GE")}
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => toggleVersionActive(version.id)}
                            className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                              version.active
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                            }`}
                          >
                            {version.active ? "აქტიური" : "არააქტიური"}
                          </button>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button className="rounded p-1 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700">
                            <PencilIcon className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Android Versions */}
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="border-b border-gray-200 bg-gray-50 px-6 py-4 dark:border-gray-700 dark:bg-gray-900">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Android ვერსიები
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                      ვერსია
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                      Build #
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                      მინ. ვერსია
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                      Force Update
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                      გამოშვების თარიღი
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
                  {versions
                    .filter(v => v.platform === "android")
                    .map((version) => (
                      <tr key={version.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900 dark:text-white">
                            {version.version}
                          </div>
                          {version.releaseNotes && (
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {version.releaseNotes}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                          {version.buildNumber}
                        </td>
                        <td className="px-6 py-4">
                          {version.minRequiredVersion ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-200">
                              <CheckCircleIcon className="h-3 w-3" />
                              დიახ
                            </span>
                          ) : (
                            <span className="text-sm text-gray-500 dark:text-gray-400">არა</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {version.forceUpdate ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-800 dark:bg-red-900 dark:text-red-200">
                              <AlertIcon className="h-3 w-3" />
                              დიახ
                            </span>
                          ) : (
                            <span className="text-sm text-gray-500 dark:text-gray-400">არა</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                          {version.releaseDate.toLocaleDateString("ka-GE")}
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => toggleVersionActive(version.id)}
                            className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                              version.active
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                            }`}
                          >
                            {version.active ? "აქტიური" : "არააქტიური"}
                          </button>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button className="rounded p-1 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700">
                            <PencilIcon className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Banners Tab */}
      {activeTab === "banners" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              აპლიკაციის ბანერები
            </h2>
            <button className="flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600">
              <PlusIcon className="h-4 w-4" />
              ახალი ბანერი
            </button>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {banners.map((banner) => (
              <div
                key={banner.id}
                className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800"
              >
                <div className={`border-b px-6 py-4 ${
                  banner.type === "info" ? "bg-blue-50 dark:bg-blue-900/20" :
                  banner.type === "warning" ? "bg-yellow-50 dark:bg-yellow-900/20" :
                  banner.type === "promotion" ? "bg-green-50 dark:bg-green-900/20" :
                  "bg-red-50 dark:bg-red-900/20"
                }`}>
                  <div className="flex items-center justify-between">
                    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                      banner.type === "info" ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" :
                      banner.type === "warning" ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" :
                      banner.type === "promotion" ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" :
                      "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                    }`}>
                      {bannerTypeLabels[banner.type]}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleBannerActive(banner.id)}
                        className={`rounded px-2 py-1 text-xs font-medium ${
                          banner.active
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                        }`}
                      >
                        {banner.active ? "აქტიური" : "არააქტიური"}
                      </button>
                      <button
                        onClick={() => deleteBanner(banner.id)}
                        className="rounded p-1 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                      >
                        <TrashBinIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
                <div className="px-6 py-4">
                  <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
                    {banner.title}
                  </h3>
                  <p className="mb-4 text-sm text-gray-700 dark:text-gray-300">
                    {banner.message}
                  </p>
                  <div className="space-y-2 text-xs text-gray-500 dark:text-gray-400">
                    <div>
                      <span className="font-medium">სამიზნე აუდიტორია:</span>{" "}
                      {banner.targetAudience === "all" ? "ყველა" : platformLabels[banner.targetAudience]}
                    </div>
                    <div>
                      <span className="font-medium">დაწყება:</span>{" "}
                      {banner.startDate.toLocaleDateString("ka-GE")}
                    </div>
                    <div>
                      <span className="font-medium">დასრულება:</span>{" "}
                      {banner.endDate.toLocaleDateString("ka-GE")}
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-2">
                    <button className="rounded p-1 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700">
                      <PencilIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Content Tab */}
      {activeTab === "content" && (
        <div className="space-y-6">
          {/* ფუნქციების ჩართვა/გამორთვა */}
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="border-b border-gray-200 bg-gray-50 px-6 py-4 dark:border-gray-700 dark:bg-gray-900">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                ფუნქციების მართვა
              </h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                აირჩიეთ რა ფუნქციები უნდა იყოს ხელმისაწვდომი მობილურ აპლიკაციაში
              </p>
            </div>
            <div className="px-6 py-4">
              <div className="space-y-4">
                {Object.entries(features).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between border-b border-gray-200 pb-4 last:border-0 dark:border-gray-700">
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {key === "orders" && "შეკვეთები"}
                        {key === "promotions" && "ფასდაკლებები"}
                        {key === "delivery" && "მიტანა"}
                        {key === "reviews" && "რევიუები"}
                        {key === "favorites" && "ფავორიტები"}
                        {key === "notifications" && "შეტყობინებები"}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {key === "orders" && "მომხმარებლებს შეუძლიათ შეუკვეთონ პროდუქტები"}
                        {key === "promotions" && "ფასდაკლებების ჩვენება და გამოყენება"}
                        {key === "delivery" && "მიტანის სერვისის გამოყენება"}
                        {key === "reviews" && "პროდუქტებზე რევიუების დატოვება"}
                        {key === "favorites" && "პროდუქტების ფავორიტებში დამატება"}
                        {key === "notifications" && "შეტყობინებების მიღება"}
                      </div>
                    </div>
                    <label className="relative inline-flex cursor-pointer items-center">
                      <input
                        type="checkbox"
                        checked={value}
                        onChange={(e) => setFeatures({ ...features, [key]: e.target.checked })}
                        className="peer sr-only"
                      />
                      <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-brand-500 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-300 dark:border-gray-600 dark:bg-gray-700 dark:peer-focus:ring-brand-800"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* კატეგორიების ხილვადობა */}
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="border-b border-gray-200 bg-gray-50 px-6 py-4 dark:border-gray-700 dark:bg-gray-900">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                კატეგორიების ხილვადობა
              </h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                აირჩიეთ რა კატეგორიები უნდა გამოჩნდეს მობილურ აპლიკაციაში
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                      კატეგორია
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                      აღწერა
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                      ხილვადობა
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {mockCategories.map((category) => (
                    <tr key={category.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {category.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {category.description || "-"}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => {
                            const newMap = new Map(categoryVisibility);
                            newMap.set(category.id, !newMap.get(category.id));
                            setCategoryVisibility(newMap);
                          }}
                          className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium ${
                            categoryVisibility.get(category.id)
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                              : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                          }`}
                        >
                          {categoryVisibility.get(category.id) ? (
                            <>
                              <EyeIcon className="h-3.5 w-3.5" />
                              ჩანს
                            </>
                          ) : (
                            <>
                              <EyeCloseIcon className="h-3.5 w-3.5" />
                              დამალული
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* პროდუქტების ხილვადობა */}
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="border-b border-gray-200 bg-gray-50 px-6 py-4 dark:border-gray-700 dark:bg-gray-900">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    პროდუქტების ხილვადობა
                  </h2>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    აირჩიეთ რა პროდუქტები უნდა გამოჩნდეს მობილურ აპლიკაციაში
                  </p>
                </div>
                <input
                  type="text"
                  placeholder="ძიება პროდუქტში..."
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                      პროდუქტი
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                      კატეგორია
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                      ფასი
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                      ხილვადობა
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {mockProducts.slice(0, 20).map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {product.name}
                        </div>
                        {product.genericName && (
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {product.genericName}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {product.category || "-"}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                        {product.price.toFixed(2)} ₾
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => {
                            const newMap = new Map(productVisibility);
                            newMap.set(product.id, !newMap.get(product.id));
                            setProductVisibility(newMap);
                          }}
                          className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium ${
                            productVisibility.get(product.id)
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                              : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                          }`}
                        >
                          {productVisibility.get(product.id) ? (
                            <>
                              <EyeIcon className="h-3.5 w-3.5" />
                              ჩანს
                            </>
                          ) : (
                            <>
                              <EyeCloseIcon className="h-3.5 w-3.5" />
                              დამალული
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
