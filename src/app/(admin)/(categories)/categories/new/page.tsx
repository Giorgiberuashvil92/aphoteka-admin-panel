"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import {
  categoriesApi,
  type AdminCategory,
  type CreateCategoryPayload,
} from "@/lib/api";

function NewCategoryPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const parentIdParam = searchParams.get("parentId")?.trim() || "";

  const [parent, setParent] = useState<AdminCategory | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [color, setColor] = useState("#E8F5E9");
  const [icon, setIcon] = useState("folder");
  const [sortOrder, setSortOrder] = useState(0);
  const [active, setActive] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!parentIdParam) {
      setParent(null);
      return;
    }
    let cancelled = false;
    categoriesApi
      .getById(parentIdParam)
      .then((p) => {
        if (!cancelled) setParent(p);
      })
      .catch(() => {
        if (!cancelled) setParent(null);
      });
    return () => {
      cancelled = true;
    };
  }, [parentIdParam]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: CreateCategoryPayload = {
        name,
        description: description || undefined,
        imageUrl: imageUrl.trim() || undefined,
        color: color || undefined,
        icon: icon || undefined,
        sortOrder,
        active,
      };
      if (parentIdParam) {
        payload.parentId = parentIdParam;
      }
      await categoriesApi.create(payload);
      alert(parentIdParam ? "ქვეკატეგორია შეიქმნა!" : "კატეგორია შეიქმნა!");
      if (parentIdParam) {
        router.push(`/categories?parent=${encodeURIComponent(parentIdParam)}`);
      } else {
        router.push("/categories");
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "შეცდომა");
    } finally {
      setSaving(false);
    }
  };

  const cancelHref = parentIdParam
    ? `/categories?parent=${encodeURIComponent(parentIdParam)}`
    : "/categories";

  return (
    <div className="space-y-6">
      <PageBreadCrumb
        pageTitle={parentIdParam ? "ახალი ქვეკატეგორია" : "ახალი კატეგორია"}
      />

      {parentIdParam ? (
        <p className="text-sm text-gray-600 dark:text-gray-300">
          მშობელი:{" "}
          <span className="font-medium text-gray-900 dark:text-white">
            {parent?.name ?? "…"}
          </span>
        </p>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                სახელი *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                აღწერა
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                ფოტოს ლინკი (imageUrl)
              </label>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://..."
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
              {imageUrl.trim() ? (
                <div className="mt-3 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-600">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imageUrl.trim()}
                    alt="პრევიუ"
                    className="h-36 w-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                </div>
              ) : null}
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  ფერი (მობილური)
                </label>
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="h-10 w-full rounded border border-gray-300"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  ხატულა (Ionicons სახელი)
                </label>
                <input
                  type="text"
                  value={icon}
                  onChange={(e) => setIcon(e.target.value)}
                  placeholder="medkit, nutrition, folder..."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  სორტირების რიგი
                </label>
                <input
                  type="number"
                  min={0}
                  value={sortOrder}
                  onChange={(e) => setSortOrder(Number(e.target.value))}
                  className="w-24 rounded-lg border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div className="flex items-center gap-2 pt-8">
                <input
                  type="checkbox"
                  id="active"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                />
                <label
                  htmlFor="active"
                  className="text-sm text-gray-700 dark:text-gray-300"
                >
                  აქტიური
                </label>
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
          >
            {saving ? "იგზავნება..." : "შექმნა"}
          </button>
          <a
            href={cancelHref}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            გაუქმება
          </a>
        </div>
      </form>
    </div>
  );
}

export default function NewCategoryPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[200px] items-center justify-center text-gray-500">
          იტვირთება...
        </div>
      }
    >
      <NewCategoryPageContent />
    </Suspense>
  );
}
