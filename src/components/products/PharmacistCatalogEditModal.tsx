"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { productsApi } from "@/lib/api/products";
import type { CatalogProduct } from "@/lib/api/catalogBalance";
import type { Product } from "@/types";
import type { FilterField } from "@/lib/api/filter-fields";
import { CatalogFilterPicker } from "./CatalogFilterPicker";

const FIELDS: Record<string, { key: string; type?: "boolean" | "number"; extra?: boolean; sources?: string[] }> = {
  "Active Ingredient": { key: "activeIngredients", sources: ["ActiveIngredients", "GenericName"] },
  "Dosage Form": { key: "dosageForm", sources: ["DosageForm"] },
  Strength: { key: "strength", sources: ["Strength"] },
  "Rx Required": { key: "prescriptionRequired", type: "boolean", sources: ["PrescriptionRequired"] },
  "Manufacturer Brand": { key: "productNameBrand", sources: ["Brand", "ProductNameBrand"] },
  "Manufacturer country": { key: "countryOfOrigin", sources: ["CountryOfOrigin"] },
  "Product Description PDF": { key: "productDescriptionPdf", extra: true, sources: ["ProductDescriptionPDF"] },
  "Reorder Level": { key: "reorderLevel", type: "number", sources: ["ReorderLevel"] },
  Availability: { key: "availability", extra: true },
  Rating: { key: "rating", extra: true, type: "number" },
};

export function PharmacistCatalogEditModal({ product, columns, displayValues, filterFields, filterError, onClose, onSaved }: {
  product: CatalogProduct;
  columns: readonly string[];
  displayValues: Record<string, unknown>;
  filterFields: FilterField[];
  filterError: string | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const editable = columns.filter((column) => {
    const field = FIELDS[column];
    if (!field) return false;
    // Presence, including blank values, means Balance owns the field.
    return ![column, field.key, ...(field.sources ?? [])].some((key) =>
      Object.prototype.hasOwnProperty.call(product.balanceCatalogItem ?? {}, key));
  });
  const initialValues: Record<string, string> = Object.fromEntries(editable.map((column) => {
    const field = FIELDS[column];
    const value = field.extra ? product.filterValues?.[field.key] : product[field.key as keyof Product];
    return [column, Array.isArray(value) ? value.join(", ") : value == null ? "" : String(value)];
  }));
  const [values, setValues] = useState<Record<string, string>>(initialValues);
  const [selectedFilters, setSelectedFilters] = useState({ ...product.filterValues });
  const canEditFilters = columns.includes("Filters") && !["Filters", "filters"].some((key) => Object.prototype.hasOwnProperty.call(product.balanceCatalogItem ?? {}, key));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const patch: Record<string, unknown> = {};
      const filterValues = { ...(canEditFilters ? selectedFilters : product.filterValues) };
      for (const column of editable) {
        const field = FIELDS[column];
        const raw = values[column].trim();
        if (raw === initialValues[column]) continue;
        if (field.type === "number" && raw !== "" && (!Number.isFinite(Number(raw)) || Number(raw) < 0)) {
          throw new Error(`${column}: შეიყვანეთ რიცხვი, რომელიც არ არის უარყოფითი`);
        }
        if (field.extra) filterValues[field.key] = raw;
        else patch[field.key] = field.type === "boolean" ? (raw === "" ? null : raw === "true") : field.type === "number" ? (raw === "" ? null : Number(raw)) : raw;
      }
      patch.filterValues = filterValues;
      const id = product.id || (product as Product & { _id?: string })._id;
      if (id && /^[0-9a-f]{24}$/i.test(id)) {
        await productsApi.update(id, patch as Partial<Product>);
      } else {
        await productsApi.create({
          ...patch,
          name: String(product.balanceCatalogItem?.Name ?? product.name),
          sku: product.sku,
          price: Number(product.balanceCatalogItem?.Price ?? product.price ?? 0),
          balanceNomenclatureItemUid: product.balanceNomenclatureItemUid,
        } as Partial<Product>);
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "შენახვა ვერ მოხერხდა");
    } finally {
      setSaving(false);
    }
  };

  return <Modal isOpen onClose={() => { if (!saving) onClose(); }} className="mx-4 max-w-3xl p-6">
    <form onSubmit={save} role="dialog" aria-modal="true" aria-labelledby="pharmacist-edit-title">
      <h2 id="pharmacist-edit-title" className="pr-12 text-xl font-semibold text-gray-900 dark:text-white">პროდუქტის რედაქტირება</h2>
      <p className="mt-2 text-sm text-gray-500">{String(product.balanceCatalogItem?.Name ?? product.name)} · ბალანსის ველები ჩაკეტილია</p>
      <div className="my-6 grid max-h-[60vh] gap-4 overflow-y-auto sm:grid-cols-2">
        {columns.map((column) => {
          if (column === "Filters" && canEditFilters) return <CatalogFilterPicker key={column} fields={filterFields} values={selectedFilters} onChange={setSelectedFilters} disabled={saving || !!filterError} error={filterError} />;
          const enabled = editable.includes(column);
          const field = FIELDS[column];
          return <label key={column} className="block text-sm text-gray-700 dark:text-gray-300">
            <span>{column}{!enabled ? " · ბალანსი" : ""}</span>
            {enabled && field.type === "boolean" ? <select disabled={saving} value={values[column]} onChange={(event) => setValues({ ...values, [column]: event.target.value })} className="mt-1 w-full rounded-lg border p-2 dark:bg-gray-800">
              <option value="">აირჩიეთ</option><option value="true">კი</option><option value="false">არა</option>
            </select> : <input disabled={!enabled || saving} type={enabled && field.type === "number" ? "number" : "text"} min={field?.type === "number" ? 0 : undefined} step="any" value={enabled ? values[column] : String(displayValues[column] ?? "—")} onChange={(event) => setValues({ ...values, [column]: event.target.value })} className="mt-1 w-full rounded-lg border border-gray-300 p-2 disabled:bg-gray-100 disabled:text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:disabled:bg-gray-900" />}
          </label>;
        })}
      </div>
      {error && <p role="alert" className="mb-4 text-sm text-red-600">{error}</p>}
      <div className="flex justify-end gap-3"><button type="button" disabled={saving} onClick={onClose} className="rounded-lg border px-4 py-2 dark:text-white">გაუქმება</button><button disabled={saving || (!editable.length && !canEditFilters)} className="rounded-lg bg-brand-500 px-4 py-2 text-white disabled:opacity-50">{saving ? "ინახება…" : "შენახვა"}</button></div>
    </form>
  </Modal>;
}
