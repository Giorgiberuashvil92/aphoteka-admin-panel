"use client";

import type { FilterField } from "@/lib/api/filter-fields";
import type { Product } from "@/types";

type Values = NonNullable<Product["filterValues"]>;

export function CatalogFilterPicker({ fields, values, onChange, disabled, error }: {
  fields: FilterField[];
  values: Values;
  onChange: (values: Values) => void;
  disabled: boolean;
  error: string | null;
}) {
  const set = (key: string, value: string | string[] | boolean | undefined) => {
    const next = { ...values };
    if (value === undefined || value === "" || (Array.isArray(value) && !value.length)) delete next[key];
    else next[key] = value;
    onChange(next);
  };
  return <fieldset disabled={disabled} className="space-y-4 rounded-lg border border-gray-200 p-4 sm:col-span-2 dark:border-gray-700">
    <legend className="px-2 text-sm font-semibold text-gray-900 dark:text-white">ფილტრები</legend>
    {error ? <p role="alert" className="text-sm text-red-600">{error}</p> : !fields.length ? <p className="text-sm text-gray-500">აქტიური ფილტრები არ არის დამატებული.</p> : null}
    {fields.map((field) => {
      const value = values[field.key];
      if (field.type === "range") return <p key={field.key} className="text-sm text-gray-500">{field.label} — პროდუქტის ფასის მიხედვით</p>;
      if (field.type === "multi") return <fieldset key={field.key} className="space-y-2">
        <legend className="text-sm text-gray-700 dark:text-gray-300">{field.label}</legend>
        {field.description && <p className="text-xs text-gray-500">{field.description}</p>}
        <div className="flex flex-wrap gap-3">{field.options.map((option) => <label key={option} className="flex items-center gap-2 text-sm dark:text-gray-300">
          <input type="checkbox" checked={Array.isArray(value) ? value.includes(option) : value === option} onChange={(event) => {
            const selected = Array.isArray(value) ? value : typeof value === "string" && value ? [value] : [];
            set(field.key, event.target.checked ? [...new Set([...selected, option])] : selected.filter((item) => item !== option));
          }} />{option}
        </label>)}</div>
      </fieldset>;
      return <label key={field.key} className="block text-sm text-gray-700 dark:text-gray-300">
        <span>{field.label}</span>
        {field.description && <span className="ml-2 text-xs text-gray-500">{field.description}</span>}
        <select value={field.type === "boolean" ? value === true ? "true" : value === false ? "false" : "" : typeof value === "string" ? value : ""} onChange={(event) => set(field.key, field.type === "boolean" ? event.target.value === "" ? undefined : event.target.value === "true" : event.target.value)} className="mt-1 w-full rounded-lg border border-gray-300 p-2 dark:border-gray-700 dark:bg-gray-800">
          <option value="">არ არის არჩეული</option>
          {field.type === "boolean" ? <><option value="true">კი</option><option value="false">არა</option></> : field.options.map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
      </label>;
    })}
  </fieldset>;
}
