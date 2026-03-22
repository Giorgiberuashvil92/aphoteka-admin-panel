"use client";

import React, { useState, useEffect } from "react";
import { Product } from "@/types";
import { productsApi, categoriesApi } from "@/lib/api";
import type { AdminCategory } from "@/lib/api/categories";

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
    invoiceNumber: "",
    active: true,
    buyer: "",
    seller: "",
    activationDate: "",
    transportStartDate: "",
    certificateNumber: "",
    documentNumber: "",
    sku: "",
    serialNumber: "",
    expiryDate: "",
    manufacturer: "",
    countryOfOrigin: "",
    genericName: "",
    productNameBrand: "",
    strength: "",
    dosageForm: "",
    packSize: "",
    barcode: "",
    packagingType: "",
    category: "",
    description: "",
  };

  const [formData, setFormData] = useState(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState<AdminCategory[]>([]);

  useEffect(() => {
    let cancelled = false;
    categoriesApi.getAll({ active: true }).then((list) => {
      if (!cancelled) setCategories(Array.isArray(list) ? list : []);
    });
    return () => { cancelled = true; };
  }, []);

  // Load product data when editing
  useEffect(() => {
    const formatDate = (date: Date | string | undefined) => {
      if (!date) return "";
      const d = new Date(date);
      return d.toISOString().split('T')[0];
    };

    if (product) {
      setFormData({
        productCode: product.productCode || "",
        name: product.name || "",
        unitOfMeasure: product.unitOfMeasure || "",
        quantity: product.quantity?.toString() || "",
        price: product.price?.toString() || "",
        totalPrice: product.totalPrice?.toString() || "",
        taxation: product.taxation || "",
        invoiceNumber: product.invoiceNumber || "",
        active: product.active ?? true,
        buyer: product.buyer || "",
        seller: product.seller || "",
        activationDate: formatDate(product.activationDate),
        transportStartDate: formatDate(product.transportStartDate),
        certificateNumber: product.certificateNumber || "",
        documentNumber: product.documentNumber || "",
        sku: product.sku || "",
        serialNumber: product.serialNumber || "",
        expiryDate: formatDate(product.expiryDate),
        manufacturer: product.manufacturer || "",
        countryOfOrigin: product.countryOfOrigin || "",
        genericName: product.genericName || "",
        productNameBrand: product.productNameBrand || "",
        strength: product.strength || "",
        dosageForm: product.dosageForm || "",
        packSize: product.packSize || "",
        barcode: product.barcode || "",
        packagingType: product.packagingType || "",
        category: product.category || "",
        description: product.description || "",
      });
    } else {
      setFormData({
        productCode: "",
        name: "",
        unitOfMeasure: "",
        quantity: "",
        price: "",
        totalPrice: "",
        taxation: "",
        invoiceNumber: "",
        active: true,
        buyer: "",
        seller: "",
        activationDate: "",
        transportStartDate: "",
        certificateNumber: "",
        documentNumber: "",
        sku: "",
        serialNumber: "",
        expiryDate: "",
        manufacturer: "",
        countryOfOrigin: "",
        genericName: "",
        productNameBrand: "",
        strength: "",
        dosageForm: "",
        packSize: "",
        barcode: "",
        packagingType: "",
        category: "",
        description: "",
      });
    }
  }, [product]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const productData: Partial<Product> = {
        name: formData.name,
        description: formData.description || undefined,
        price: parseFloat(formData.price),
        category: formData.category || undefined,
        active: formData.active,
        sku: formData.sku || formData.productCode || `AUTO-${Date.now()}`,
        barcode: formData.barcode || undefined,
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
        invoiceNumber: formData.invoiceNumber || undefined,
        buyer: formData.buyer || undefined,
        seller: formData.seller || undefined,
        activationDate: formData.activationDate || undefined,
        transportStartDate: formData.transportStartDate || undefined,
        certificateNumber: formData.certificateNumber || undefined,
        documentNumber: formData.documentNumber || undefined,
        serialNumber: formData.serialNumber || undefined,
        expiryDate: formData.expiryDate || undefined,
        packagingType: formData.packagingType || undefined,
        productNameBrand: formData.productNameBrand || undefined,
      };

      if (product) {
        // Update existing product
        await productsApi.update(product.id, productData);
        alert("პროდუქტი წარმატებით განახლდა");
      } else {
        // Create new product
        await productsApi.create(productData);
        alert("პროდუქტი წარმატებით შეიქმნა");
      }
      
      // Reset form
      setFormData(initialFormData);
      
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
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

            {/* 7. დაბეგვრა & 8. ზედნადების ნომერი */}
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

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  ზედნადების ნომერი
                </label>
                <input
                  type="text"
                  value={formData.invoiceNumber}
                  onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  placeholder="ზედნადების ნომერი"
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

            {/* 10. მყიდველი & 11. გამყიდველი */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  მყიდველი
                </label>
                <input
                  type="text"
                  value={formData.buyer}
                  onChange={(e) => setFormData({ ...formData, buyer: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  placeholder="მყიდველი"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  გამყიდველი
                </label>
                <input
                  type="text"
                  value={formData.seller}
                  onChange={(e) => setFormData({ ...formData, seller: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  placeholder="გამყიდველი"
                />
              </div>
            </div>

            {/* 12. გააქტიურების თარიღი & 13. ტრანსპორტირების დაწყების თარიღი */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  გააქტიურების თარიღი
                </label>
                <input
                  type="date"
                  value={formData.activationDate}
                  onChange={(e) => setFormData({ ...formData, activationDate: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  ტრანსპორტირების დაწყების თარიღი
                </label>
                <input
                  type="date"
                  value={formData.transportStartDate}
                  onChange={(e) => setFormData({ ...formData, transportStartDate: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            {/* 14. ფირნიშის ან ცნობის ნომერი & 15. დოკუმენტის N */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  ფირნიშის ან ცნობის ნომერი
                </label>
                <input
                  type="text"
                  value={formData.certificateNumber}
                  onChange={(e) => setFormData({ ...formData, certificateNumber: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  placeholder="ფირნიშის ნომერი"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  დოკუმენტის N
                </label>
                <input
                  type="text"
                  value={formData.documentNumber}
                  onChange={(e) => setFormData({ ...formData, documentNumber: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  placeholder="დოკუმენტის ნომერი"
                />
              </div>
            </div>

            {/* 16. SKU / internal product code & 17. სერიის ნომერი */}
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

            {/* 18. ვარგისიანობის ვადა & 19. მწარმოებელი */}
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

            {/* 20. ქვეყანა & 21. Generic name */}
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

            {/* 22. Product name (brand) & 23. Strength */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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

            {/* 24. Dosage form & 25. Pack size */}
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

            {/* 26. Barcode & 27. შეფუთვის სახეობა */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Barcode (GTIN, if available)
                </label>
                <input
                  type="text"
                  value={formData.barcode}
                  onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  placeholder="Barcode"
                />
              </div>

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

            {/* 28. კატეგორია (ადმინში შექმნილი კატეგორიებიდან) */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                კატეგორია
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                <option value="">— არ არის არჩეული —</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name} ({c.productCount} პროდუქტი)
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">
                კატეგორიების დამატება/რედაქტირება: კატეგორიები მენიუ
              </p>
            </div>

            {/* აღწერა (დამატებითი) */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                აღწერა
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                placeholder="პროდუქტის აღწერა"
              />
            </div>
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
