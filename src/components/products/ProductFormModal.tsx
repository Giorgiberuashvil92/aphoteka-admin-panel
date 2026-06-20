"use client";

import React, { useState, useEffect } from "react";
import { Product } from "@/types";
import { productsApi, categoriesApi } from "@/lib/api";
import type { AdminCategory } from "@/lib/api/categories";
import { filterFieldsApi, type FilterField } from "@/lib/api/filter-fields";

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  product?: Product;
}

export default function ProductFormModal({
  isOpen,
  onClose,
  onSuccess,
  product,
}: ProductFormModalProps) {
  const initialFormData = {
    productCode: "",
    name: "",
    unitOfMeasure: "",
    quantity: "",
    price: "",
    totalPrice: "",
    taxation: "",
    active: true,
    description: "",
    sku: "",
    serialNumber: "",
    expiryDate: "",
    manufacturer: "",
    countryOfOrigin: "",
    genericName: "",
    productNameBrand: "",
    activeIngredients: "",
    usage: "",
    sideEffects: "",
    contraindications: "",
    storageConditions: "",
    strength: "",
    dosageForm: "",
    packSize: "",
    packagingType: "",
    mainCategory: "",
    subcategory: "",
    therapeuticClass: "",
  };

  const [formData, setFormData] = useState(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [subcategories, setSubcategories] = useState<AdminCategory[]>([]);
  const [loadingSubcategories, setLoadingSubcategories] = useState(false);
  const [filterFields, setFilterFields] = useState<FilterField[]>([]);
  const [filterValues, setFilterValues] = useState<
    Record<string, string | string[] | boolean>
  >({});

  useEffect(() => {
    let cancelled = false;
    categoriesApi.getRoots().then((list) => {
      if (!cancelled) setCategories(Array.isArray(list) ? list : []);
    });
    filterFieldsApi.getActive().then((list) => {
      if (!cancelled) setFilterFields(Array.isArray(list) ? list : []);
    });
    return () => { cancelled = true; };
  }, []);

  const resolveCategoryFields = (
    p: Product,
    mainCategoryNames: Set<string>,
  ): { mainCategory: string; subcategory: string; therapeuticClass: string } => {
    if (p.mainCategory?.trim()) {
      return {
        mainCategory: p.mainCategory.trim(),
        subcategory: p.subcategory?.trim() || "",
        therapeuticClass: p.category?.trim() || "",
      };
    }

    const cat = p.category?.trim() || "";
    if (cat && mainCategoryNames.has(cat)) {
      return {
        mainCategory: cat,
        subcategory: p.subcategory?.trim() || "",
        therapeuticClass: "",
      };
    }

    return {
      mainCategory: "",
      subcategory: p.subcategory?.trim() || "",
      therapeuticClass: cat,
    };
  };

  useEffect(() => {
    let cancelled = false;
    if (!formData.mainCategory) {
      setSubcategories([]);
      return;
    }
    const parent = categories.find((c) => c.name === formData.mainCategory);
    if (!parent) {
      setSubcategories([]);
      return;
    }
    setLoadingSubcategories(true);
    categoriesApi
      .getSubcategories(parent.id)
      .then((list) => {
        if (!cancelled) setSubcategories(Array.isArray(list) ? list : []);
      })
      .finally(() => {
        if (!cancelled) setLoadingSubcategories(false);
      });
    return () => {
      cancelled = true;
    };
  }, [formData.mainCategory, categories]);

  // Load product data when editing
  useEffect(() => {
    const formatDate = (date: Date | string | undefined) => {
      if (!date) return "";
      const d = new Date(date);
      return d.toISOString().split('T')[0];
    };

    if (product) {
      const mainCategoryNames = new Set(categories.map((c) => c.name));
      const { mainCategory, subcategory, therapeuticClass } = resolveCategoryFields(
        product,
        mainCategoryNames,
      );
      setFormData({
        productCode: product.productCode || "",
        name: product.name || "",
        unitOfMeasure: product.unitOfMeasure || "",
        quantity: product.quantity?.toString() || "",
        price: product.price?.toString() || "",
        totalPrice: product.totalPrice?.toString() || "",
        taxation: product.taxation || "",
        active: product.active ?? true,
        description: product.description || "",
        sku: product.sku || "",
        serialNumber: product.serialNumber || "",
        expiryDate: formatDate(product.expiryDate),
        manufacturer: product.manufacturer || "",
        countryOfOrigin: product.countryOfOrigin || "",
        genericName: product.genericName || "",
        productNameBrand: product.productNameBrand || "",
        activeIngredients: product.activeIngredients || "",
        usage: product.usage || "",
        sideEffects: Array.isArray(product.sideEffects)
          ? product.sideEffects.join(", ")
          : "",
        contraindications: Array.isArray(product.contraindications)
          ? product.contraindications.join(", ")
          : "",
        storageConditions: product.storageConditions || "",
        strength: product.strength || "",
        dosageForm: product.dosageForm || "",
        packSize: product.packSize || "",
        packagingType: product.packagingType || "",
        mainCategory,
        subcategory,
        therapeuticClass,
      });
      setFilterValues(product.filterValues ?? {});
    } else {
      setFormData({
        productCode: "",
        name: "",
        unitOfMeasure: "",
        quantity: "",
        price: "",
        totalPrice: "",
        taxation: "",
        active: true,
        description: "",
        sku: "",
        serialNumber: "",
        expiryDate: "",
        manufacturer: "",
        countryOfOrigin: "",
        genericName: "",
        productNameBrand: "",
        activeIngredients: "",
        usage: "",
        sideEffects: "",
        contraindications: "",
        storageConditions: "",
        strength: "",
        dosageForm: "",
        packSize: "",
        packagingType: "",
        mainCategory: "",
        subcategory: "",
        therapeuticClass: "",
      });
      setFilterValues({});
    }
  }, [product, categories]);

  const setFilterValue = (
    key: string,
    value: string | string[] | boolean | undefined,
  ) => {
    setFilterValues((prev) => {
      const next = { ...prev };
      if (
        value === undefined ||
        value === "" ||
        (Array.isArray(value) && value.length === 0)
      ) {
        delete next[key];
      } else {
        next[key] = value;
      }
      return next;
    });
  };

  const toggleMultiFilter = (key: string, option: string) => {
    setFilterValues((prev) => {
      const current = prev[key];
      const list = Array.isArray(current)
        ? [...current]
        : typeof current === "string"
          ? [current]
          : [];
      const idx = list.indexOf(option);
      if (idx >= 0) list.splice(idx, 1);
      else list.push(option);
      const next = { ...prev };
      if (list.length === 0) delete next[key];
      else next[key] = list;
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const priceNum = parseFloat(formData.price);
      if (!Number.isFinite(priceNum) || priceNum < 0) {
        alert("შეიყვანეთ სწორი ერთეულის ფასი (რიცხვი ≥ 0)");
        return;
      }

      const productId =
        product?.id ?? (product as { _id?: string } | undefined)?._id;
      if (product && !productId) {
        alert("პროდუქტის ID ვერ მოიძებნა — განაახლეთ გვერდი და სცადეთ ხელახლა");
        return;
      }

      const productData: Partial<Product> = {
        name: formData.name,
        description: formData.description || undefined,
        price: priceNum,
        mainCategory: formData.mainCategory || undefined,
        category: formData.therapeuticClass || undefined,
        subcategory: formData.subcategory || undefined,
        active: formData.active,
        sku: formData.sku || formData.productCode || `AUTO-${Date.now()}`,
        genericName: formData.genericName || undefined,
        strength: formData.strength || undefined,
        dosageForm: formData.dosageForm || undefined,
        packSize: formData.packSize || undefined,
        unitOfMeasure: formData.unitOfMeasure || undefined,
        manufacturer: formData.manufacturer || undefined,
        countryOfOrigin: formData.countryOfOrigin || undefined,
        productCode: formData.productCode || undefined,
        quantity: formData.quantity ? parseFloat(formData.quantity) : undefined,
        totalPrice: formData.totalPrice ? parseFloat(formData.totalPrice) : undefined,
        taxation: formData.taxation || undefined,
        serialNumber: formData.serialNumber || undefined,
        expiryDate: formData.expiryDate || undefined,
        packagingType: formData.packagingType || undefined,
        productNameBrand: formData.productNameBrand || undefined,
        activeIngredients: formData.activeIngredients || undefined,
        usage: formData.usage || undefined,
        sideEffects: formData.sideEffects
          ? formData.sideEffects
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          : undefined,
        contraindications: formData.contraindications
          ? formData.contraindications
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          : undefined,
        storageConditions: formData.storageConditions || undefined,
        filterValues:
          Object.keys(filterValues).length > 0 ? filterValues : undefined,
      };

      if (product && productId) {
        // Update existing product
        await productsApi.update(productId, productData);
        alert("პროდუქტი წარმატებით განახლდა");
      } else {
        // Create new product
        await productsApi.create(productData);
        alert("პროდუქტი წარმატებით შეიქმნა");
      }
      
      // Reset form
      setFormData(initialFormData);
      setFilterValues({});
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error saving product:", error);
      alert(product ? "პროდუქტის განახლებისას მოხდა შეცდომა" : "პროდუქტის შექმნისას მოხდა შეცდომა");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-100000 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-lg bg-white shadow-xl dark:bg-gray-800">
        <div className="sticky top-0 z-10 border-b border-gray-200 bg-white px-6 py-4 dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {product ? "პროდუქტის რედაქტირება" : "ახალი პროდუქტის დამატება"}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            {/* 1. საქონლის კოდი */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  საქონლის კოდი
                </label>
                <input
                  type="text"
                  value={formData.productCode}
                  onChange={(e) => setFormData({ ...formData, productCode: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  placeholder="საქონლის კოდი"
                />
              </div>

              {/* 2. საქონლის დასახელება */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  საქონლის დასახელება *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  placeholder="საქონლის დასახელება"
                />
              </div>
            </div>

            {/* 3. ზომის ერთეული & 4. რაოდ. */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  ზომის ერთეული
                </label>
                <input
                  type="text"
                  value={formData.unitOfMeasure}
                  onChange={(e) => setFormData({ ...formData, unitOfMeasure: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  placeholder="მაგ: ცალი, კგ, ლიტრი"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  რაოდ.
                </label>
                <input
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  placeholder="რაოდენობა"
                />
              </div>
            </div>

            {/* 5. ერთეულის ფასი & 6. საქონლის ფასი */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  ერთეულის ფასი *
                </label>
                <input
                  type="number"
                  required
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  საქონლის ფასი
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.totalPrice}
                  onChange={(e) => setFormData({ ...formData, totalPrice: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* 7. დაბეგვრა */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  დაბეგვრა
                </label>
                <input
                  type="text"
                  value={formData.taxation}
                  onChange={(e) => setFormData({ ...formData, taxation: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  placeholder="დაბეგვრა"
                />
              </div>
            </div>

            {/* 9. სტატუსი */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="active-modal"
                checked={formData.active}
                onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
              />
              <label htmlFor="active-modal" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                სტატუსი: აქტიური
              </label>
            </div>

            {/* 10. SKU / internal product code & 11. სერიის ნომერი */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  SKU / internal product code
                </label>
                <input
                  type="text"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  placeholder="SKU კოდი"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  სერიის ნომერი
                </label>
                <input
                  type="text"
                  value={formData.serialNumber}
                  onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  placeholder="სერიის ნომერი"
                />
              </div>
            </div>

            {/* 12. ვარგისიანობის ვადა & 13. მწარმოებელი */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  ვარგისიანობის ვადა
                </label>
                <input
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  მწარმოებელი (ქვეყანა)
                </label>
                <input
                  type="text"
                  value={formData.manufacturer}
                  onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  placeholder="მწარმოებელი"
                />
              </div>
            </div>

            {/* 14. ქვეყანა & 15. Generic name */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  ქვეყანა
                </label>
                <input
                  type="text"
                  value={formData.countryOfOrigin}
                  onChange={(e) => setFormData({ ...formData, countryOfOrigin: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  placeholder="მაგ: საქართველო, გერმანია"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Generic name
                </label>
                <input
                  type="text"
                  value={formData.genericName}
                  onChange={(e) => setFormData({ ...formData, genericName: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  placeholder="Generic name"
                />
              </div>
            </div>

            {/* Product name (brand) · აქტიური ნივთიერებები · Strength */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Product name (brand)
                </label>
                <input
                  type="text"
                  value={formData.productNameBrand}
                  onChange={(e) => setFormData({ ...formData, productNameBrand: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  placeholder="Product name (brand)"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  აქტიური ნივთიერებები
                </label>
                <textarea
                  rows={2}
                  value={formData.activeIngredients}
                  onChange={(e) =>
                    setFormData({ ...formData, activeIngredients: e.target.value })
                  }
                  className="w-full resize-y rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  placeholder="მაგ: პარაცეტამოლი, ასკორბინის მჟავა"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Strength (e.g., 500 mg)
                </label>
                <input
                  type="text"
                  value={formData.strength}
                  onChange={(e) => setFormData({ ...formData, strength: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  placeholder="500 mg"
                />
              </div>
            </div>

            {/* 16. Dosage form & 17. Pack size */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Dosage form (tablet, syrup, injection)
                </label>
                <select
                  value={formData.dosageForm}
                  onChange={(e) => setFormData({ ...formData, dosageForm: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">აირჩიეთ ფორმა</option>
                  <option value="tablet">Tablet (ტაბლეტი)</option>
                  <option value="ტაბლეტი">ტაბლეტი</option>
                  <option value="syrup">Syrup (სიროფი)</option>
                  <option value="სიროფი">სიროფი</option>
                  <option value="injection">Injection (ინექცია)</option>
                  <option value="ინექცია">ინექცია</option>
                  <option value="capsule">Capsule (კაფსული)</option>
                  <option value="კაფსული">კაფსული</option>
                  <option value="cream">Cream (კრემი)</option>
                  <option value="კრემი">კრემი</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Pack size (10 tablets, 100 ml)
                </label>
                <input
                  type="text"
                  value={formData.packSize}
                  onChange={(e) => setFormData({ ...formData, packSize: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  placeholder="10 tablets"
                />
              </div>
            </div>

            {/* 18. შეფუთვის სახეობა */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  შეფუთვის სახეობა
                </label>
                <input
                  type="text"
                  value={formData.packagingType}
                  onChange={(e) => setFormData({ ...formData, packagingType: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  placeholder="შეფუთვის სახეობა"
                />
              </div>
            </div>

            {/* აღწერა და ინსტრუქციები */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  აღწერა
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full resize-y rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  placeholder="პროდუქტის აღწერა"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  გამოყენება
                </label>
                <textarea
                  rows={3}
                  value={formData.usage}
                  onChange={(e) => setFormData({ ...formData, usage: e.target.value })}
                  className="w-full resize-y rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  placeholder="გამოყენების ინსტრუქცია"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  გვერდითი მოვლენები (მძიმით გამოყავი)
                </label>
                <textarea
                  rows={2}
                  value={formData.sideEffects}
                  onChange={(e) => setFormData({ ...formData, sideEffects: e.target.value })}
                  className="w-full resize-y rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  placeholder="მაგ: გულისრევა, თავბრუსხვევა"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  უკუჩვენებები (მძიმით გამოყავი)
                </label>
                <textarea
                  rows={2}
                  value={formData.contraindications}
                  onChange={(e) =>
                    setFormData({ ...formData, contraindications: e.target.value })
                  }
                  className="w-full resize-y rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  placeholder="მაგ: ორსულობა, ალერგია აქტიურ ნივთიერებაზე"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                შენახვის პირობები
              </label>
              <textarea
                rows={2}
                value={formData.storageConditions}
                onChange={(e) =>
                  setFormData({ ...formData, storageConditions: e.target.value })
                }
                className="w-full resize-y rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                placeholder="მაგ: შეინახეთ 25°C-ზე დაბალ ტემპერატურაზე"
              />
            </div>

            {/* მთავარი კატეგორია */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                მთავარი კატეგორია
              </label>
              <select
                value={formData.mainCategory}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    mainCategory: e.target.value,
                    subcategory: "",
                  })
                }
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                <option value="">— არ არის არჩეული —</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* საბკატეგორია — ადმინის საბკატეგორიებიდან */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                საბკატეგორია
              </label>
              <select
                value={formData.subcategory}
                onChange={(e) =>
                  setFormData({ ...formData, subcategory: e.target.value })
                }
                disabled={!formData.mainCategory || loadingSubcategories}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-brand-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                <option value="">
                  {!formData.mainCategory
                    ? "— ჯერ აირჩიეთ მთავარი კატეგორია —"
                    : loadingSubcategories
                      ? "იტვირთება..."
                      : "— არ არის არჩეული —"}
                </option>
                {formData.subcategory &&
                  !subcategories.some((s) => s.name === formData.subcategory) && (
                    <option value={formData.subcategory}>
                      {formData.subcategory} (არსებული)
                    </option>
                  )}
                {subcategories.map((sub) => (
                  <option key={sub.id} value={sub.name}>
                    {sub.name}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Norix/აპში ნავიგაციისთვის. საბკატეგორიების მართვა: კატეგორიები → საბკატეგორიები
              </p>
            </div>

            {/* Therapeutic Class — მედიკამენტებისთვის (Balance) */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Therapeutic Class
              </label>
              <input
                type="text"
                value={formData.therapeuticClass}
                onChange={(e) =>
                  setFormData({ ...formData, therapeuticClass: e.target.value })
                }
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                placeholder="მაგ: ანტიბიოტიკები, ანალგეტიკები"
              />
              <p className="mt-1 text-xs text-gray-500">
                მედიკამენტებისთვის — Balance-ის Therapeutic Class (საბკატეგორიასგან ცალკე)
              </p>
            </div>

            {filterFields.length > 0 && (
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-600 dark:bg-gray-900/40">
                <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
                  ფილტრები (მობაილური აპი)
                </h3>
                <div className="space-y-4">
                  {filterFields.map((field) => {
                    const key = field.key;
                    const value = filterValues[key];
                    if (field.type === "boolean") {
                      return (
                        <div key={key}>
                          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                            {field.label}
                          </label>
                          <select
                            value={
                              value === true
                                ? "true"
                                : value === false
                                  ? "false"
                                  : ""
                            }
                            onChange={(e) => {
                              const v = e.target.value;
                              setFilterValue(
                                key,
                                v === "true"
                                  ? true
                                  : v === "false"
                                    ? false
                                    : undefined,
                              );
                            }}
                            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                          >
                            <option value="">— არ არის —</option>
                            <option value="true">კი</option>
                            <option value="false">არა</option>
                          </select>
                        </div>
                      );
                    }
                    if (field.type === "range") {
                      return null;
                    }
                    if (field.type === "multi") {
                      return (
                        <div key={key}>
                          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                            {field.label}
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {(field.options ?? []).map((opt) => {
                              const selected = Array.isArray(value)
                                ? value.includes(opt)
                                : value === opt;
                              return (
                                <button
                                  key={opt}
                                  type="button"
                                  onClick={() => toggleMultiFilter(key, opt)}
                                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                                    selected
                                      ? "bg-brand-500 text-white"
                                      : "bg-white text-gray-700 ring-1 ring-gray-300 dark:bg-gray-700 dark:text-gray-200"
                                  }`}
                                >
                                  {opt}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    }
                    return (
                      <div key={key}>
                        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                          {field.label}
                        </label>
                        <select
                          value={typeof value === "string" ? value : ""}
                          onChange={(e) =>
                            setFilterValue(key, e.target.value || undefined)
                          }
                          className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        >
                          <option value="">— არ არის არჩეული —</option>
                          {(field.options ?? []).map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          </div>

          {/* Footer Buttons */}
          <div className="mt-6 flex justify-end gap-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
            >
              გაუქმება
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
            >
              {isSubmitting ? "შენახვა..." : (product ? "განახლება" : "შენახვა")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
