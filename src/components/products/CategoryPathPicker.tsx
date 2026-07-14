"use client";

import React, { useMemo } from "react";
import type { AdminCategory } from "@/lib/api/categories";

type CategoryPathPickerProps = {
  categories: AdminCategory[];
  /** შერჩეული კვანძების id გზა root → … → leaf */
  pathIds: string[];
  onPathChange: (pathIds: string[]) => void;
  disabled?: boolean;
};

function childrenOf(
  categories: AdminCategory[],
  parentId: string | null,
): AdminCategory[] {
  if (parentId == null) {
    return categories.filter((c) => !c.parentId);
  }
  return categories.filter((c) => c.parentId === parentId);
}

export function resolveCategoryPathIds(
  categories: AdminCategory[],
  mainCategory: string,
  subcategory: string,
): string[] {
  const main = mainCategory.trim();
  const sub = subcategory.trim();
  if (!main) return [];

  const root = categories.find((c) => !c.parentId && c.name === main);
  if (!root) return [];

  if (!sub) return [root.id];

  const byId = new Map(categories.map((c) => [c.id, c]));
  const descendant =
    categories.find((c) => {
      if (c.name !== sub) return false;
      let cur: AdminCategory | undefined = c;
      const guard = new Set<string>();
      while (cur?.parentId) {
        if (guard.has(cur.id)) break;
        guard.add(cur.id);
        if (cur.parentId === root.id) return true;
        cur = byId.get(cur.parentId);
      }
      return false;
    }) ?? categories.find((c) => c.parentId === root.id && c.name === sub);

  if (!descendant) return [root.id];

  const path: string[] = [];
  let cur: AdminCategory | undefined = descendant;
  const guard = new Set<string>();
  while (cur) {
    if (guard.has(cur.id)) break;
    guard.add(cur.id);
    path.unshift(cur.id);
    if (!cur.parentId) break;
    cur = byId.get(cur.parentId);
  }
  if (path[0] !== root.id) {
    return [root.id, ...path.filter((id) => id !== root.id)];
  }
  return path;
}

export function pathIdsToCategoryFields(
  categories: AdminCategory[],
  pathIds: string[],
): { mainCategory: string; subcategory: string } {
  if (pathIds.length === 0) return { mainCategory: "", subcategory: "" };
  const byId = new Map(categories.map((c) => [c.id, c]));
  const main = byId.get(pathIds[0])?.name ?? "";
  if (pathIds.length === 1) return { mainCategory: main, subcategory: "" };
  const leaf = byId.get(pathIds[pathIds.length - 1])?.name ?? "";
  return { mainCategory: main, subcategory: leaf };
}

/** კატეგორიის გზის არჩევა (ნებისმიერი სიღრმე) */
export default function CategoryPathPicker({
  categories,
  pathIds,
  onPathChange,
  disabled,
}: CategoryPathPickerProps) {
  const activeOrAll = useMemo(() => {
    const active = categories.filter((c) => c.active !== false);
    return active.length > 0 ? active : categories;
  }, [categories]);

  const byId = useMemo(
    () => new Map(activeOrAll.map((c) => [c.id, c])),
    [activeOrAll],
  );

  const lastId = pathIds.length > 0 ? pathIds[pathIds.length - 1] : null;
  const lastHasChildren =
    lastId != null && childrenOf(activeOrAll, lastId).length > 0;

  const selectCount =
    pathIds.length === 0
      ? 1
      : pathIds.length + (lastHasChildren ? 1 : 0);

  const levelLabel = (level: number) => {
    if (level === 0) return "მთავარი კატეგორია";
    if (level === 1) return "ქვეკატეგორია";
    return `დონე ${level + 1}`;
  };

  return (
    <div className="space-y-3">
      {Array.from({ length: selectCount }, (_, level) => {
        const parentId = level === 0 ? null : pathIds[level - 1] ?? null;
        if (level > 0 && !parentId) return null;
        const options = childrenOf(activeOrAll, parentId);
        if (level > 0 && options.length === 0) return null;
        const value = pathIds[level] ?? "";

        return (
          <div key={`cat-level-${level}`}>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              {levelLabel(level)}
            </label>
            <select
              value={value}
              disabled={disabled || (level > 0 && !pathIds[level - 1])}
              onChange={(e) => {
                const nextId = e.target.value;
                if (!nextId) {
                  onPathChange(pathIds.slice(0, level));
                  return;
                }
                onPathChange([...pathIds.slice(0, level), nextId]);
              }}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-brand-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            >
              <option value="">
                {level === 0
                  ? "— არ არის არჩეული —"
                  : "— არ არის არჩეული (შემდეგი დონე) —"}
              </option>
              {value && !options.some((o) => o.id === value) && byId.get(value) ? (
                <option value={value}>
                  {byId.get(value)!.name} (არსებული)
                </option>
              ) : null}
              {options.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.name}
                </option>
              ))}
            </select>
          </div>
        );
      })}
      <p className="text-xs text-gray-500">
        აირჩიე გზა ნებისმიერ სიღრმემდე. პროდუქტი მიების მთავარ
        კატეგორიას და უკანასკნელ არჩეულ დონეს (მობაილის ფილტრისთვის).
      </p>
    </div>
  );
}
