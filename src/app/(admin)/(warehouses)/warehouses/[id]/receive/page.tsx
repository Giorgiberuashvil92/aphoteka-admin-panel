"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { WarehouseReceiptItem, WarehouseReceipt, Product } from "@/types";
import { inventoryApi, productsApi } from "@/lib/api";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Select from "@/components/form/Select";
import DatePicker from "@/components/form/date-picker";
import Button from "@/components/ui/button/Button";
import { PlusIcon, TrashBinIcon } from "@/icons";
import Form from "@/components/form/Form";
import ExcelImport from "@/components/excel/ExcelImport";

export default function WarehouseReceivePage() {
  const params = useParams();
  const router = useRouter();
  const warehouseId = params.id as string;

  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [formData, setFormData] = useState({
    supplierInvoiceNumber: "",
    purchaseInvoiceId: "",
    receivedDate: new Date(),
    notes: "",
  });
  const [items, setItems] = useState<Partial<WarehouseReceiptItem>[]>([
    {
      productId: "",
      quantity: 0,
      unitPrice: 0,
      batchNumber: "",
      expiryDate: new Date(),
    },
  ]);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const response = await productsApi.getAll({ active: true });
      setProducts(response.data);
    } catch (err) {
      console.error("Error loading products:", err);
    }
  };

  // შექმნის productIdMap SKU-ს მიხედვით Excel import-ისთვის
  const productIdMap = new Map<string, string>();
  products.forEach((product) => {
    if (product.sku) {
      productIdMap.set(product.sku, product.id);
    }
    if (product.id) {
      productIdMap.set(product.id, product.id);
    }
  });

  // Excel-იდან იმპორტირებული მონაცემების დამუშავება
  const handleExcelImport = (importedItems: Partial<WarehouseReceiptItem>[]) => {
    // თუ items-ში მხოლოდ ერთი ცარიელი item არის, შევცვალოთ იმპორტირებული items-ით
    if (items.length === 1 && !items[0].productId && items[0].quantity === 0) {
      setItems(importedItems);
    } else {
      // წინააღმდეგ შემთხვევაში, დავამატოთ ახალ items-ს
      setItems([...items, ...importedItems]);
    }
  };

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        productId: "",
        quantity: 0,
        unitPrice: 0,
        batchNumber: "",
        expiryDate: new Date(),
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (
    index: number,
    field: keyof WarehouseReceiptItem,
    value: any
  ) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // If product changed, update product-related fields
    if (field === "productId" && value) {
      const product = products.find((p) => p.id === value);
      if (product) {
        newItems[index] = {
          ...newItems[index],
          productName: product.name,
          productCode: product.sku,
          unitOfMeasure: product.unitOfMeasure,
          genericName: product.genericName,
          strength: product.strength,
          dosageForm: product.dosageForm,
          packSize: product.packSize,
          barcode: product.barcode,
        };
      }
    }
    
    // Calculate totalPrice
    if (field === "quantity" || field === "unitPrice") {
      const quantity = field === "quantity" ? value : newItems[index].quantity || 0;
      const unitPrice = field === "unitPrice" ? value : newItems[index].unitPrice || 0;
      newItems[index].totalPrice = quantity * unitPrice;
    }
    
    setItems(newItems);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (items.length === 0) {
      alert("გთხოვთ დაამატოთ მინიმუმ ერთი პროდუქტი");
      return;
    }

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.productId || !item.quantity || !item.batchNumber || !item.expiryDate) {
        alert(`გთხოვთ შეავსოთ ყველა ველი ${i + 1}-ე პროდუქტისთვის`);
        return;
      }
    }

    try {
      setLoading(true);
      const receiptData: Partial<WarehouseReceipt> = {
        warehouseId,
        supplierInvoiceNumber: formData.supplierInvoiceNumber || undefined,
        purchaseInvoiceId: formData.purchaseInvoiceId || undefined,
        receivedDate: formData.receivedDate,
        notes: formData.notes || undefined,
        items: items.map((item) => ({
          productId: item.productId!,
          quantity: item.quantity!,
          unitPrice: item.unitPrice || 0,
          totalPrice: item.totalPrice || (item.quantity! * (item.unitPrice || 0)),
          batchNumber: item.batchNumber!,
          expiryDate: item.expiryDate!,
          productName: item.productName,
          productCode: item.productCode,
          unitOfMeasure: item.unitOfMeasure,
          genericName: item.genericName,
          strength: item.strength,
          dosageForm: item.dosageForm,
          packSize: item.packSize,
          barcode: item.barcode,
        })) as WarehouseReceiptItem[],
      };

      await inventoryApi.receive(receiptData);
      router.push(`/warehouses/${warehouseId}/inventory`);
    } catch (err) {
      console.error("Error receiving inventory:", err);
      alert("შეცდომა ინვენტარის მიღებისას");
    } finally {
      setLoading(false);
    }
  };

  const productOptions = products.map((product) => ({
    value: product.id,
    label: `${product.name}${product.genericName ? ` (${product.genericName})` : ""}`,
  }));

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <h2 className="mb-6 text-xl font-semibold text-gray-900 dark:text-white">
          ინვენტარის მიღება
        </h2>

        <Form onSubmit={handleSubmit}>
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <Label htmlFor="supplierInvoiceNumber">
                  მომწოდებლის ინვოისის ნომერი
                </Label>
                <Input
                  type="text"
                  id="supplierInvoiceNumber"
                  placeholder="INV-2024-001"
                  defaultValue={formData.supplierInvoiceNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, supplierInvoiceNumber: e.target.value })
                  }
                />
              </div>

              <div>
                <Label htmlFor="purchaseInvoiceId">შესყიდვის ინვოისის ID</Label>
                <Input
                  type="text"
                  id="purchaseInvoiceId"
                  placeholder="purchase-invoice-id"
                  defaultValue={formData.purchaseInvoiceId}
                  onChange={(e) =>
                    setFormData({ ...formData, purchaseInvoiceId: e.target.value })
                  }
                />
              </div>

              <div>
                <Label htmlFor="receivedDate">მიღების თარიღი</Label>
                <DatePicker
                  id="receivedDate"
                  defaultDate={formData.receivedDate}
                  onChange={(selectedDates) => {
                    if (selectedDates && selectedDates.length > 0) {
                      setFormData({
                        ...formData,
                        receivedDate: selectedDates[0] as Date,
                      });
                    }
                  }}
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <Label htmlFor="notes">შენიშვნები</Label>
              <textarea
                id="notes"
                rows={3}
                className="h-auto w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                placeholder="დამატებითი ინფორმაცია..."
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
              />
            </div>

            {/* Excel Import */}
            <div>
              <Label className="mb-2 block">Excel-იდან იმპორტი</Label>
              <ExcelImport
                onImport={handleExcelImport}
                onError={(error) => alert(error)}
                productIdMap={productIdMap}
                disabled={loading}
              />
            </div>

            {/* Items */}
            <div>
              <div className="mb-4 flex items-center justify-between">
                <Label>პროდუქტები</Label>
                <Button
                  size="sm"
                  startIcon={<PlusIcon className="h-4 w-4" />}
                  onClick={handleAddItem}
                >
                  პროდუქტის დამატება
                </Button>
              </div>

              <div className="space-y-4">
                {items.map((item, index) => (
                  <div
                    key={index}
                    className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900"
                  >
                    <div className="mb-4 flex items-center justify-between">
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        პროდუქტი #{index + 1}
                      </h4>
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(index)}
                          className="text-red-600 hover:text-red-700 dark:text-red-400"
                        >
                          <TrashBinIcon className="h-5 w-5" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      <div className="sm:col-span-2">
                        <Label>პროდუქტი *</Label>
                        <div className="relative">
                          <Select
                            options={productOptions}
                            placeholder="აირჩიეთ პროდუქტი"
                            defaultValue={item.productId || ""}
                            onChange={(value) =>
                              handleItemChange(index, "productId", value)
                            }
                          />
                        </div>
                      </div>

                      <div>
                        <Label>რაოდენობა *</Label>
                        <Input
                          type="number"
                          min="1"
                          placeholder="0"
                          defaultValue={item.quantity || ""}
                          onChange={(e) =>
                            handleItemChange(
                              index,
                              "quantity",
                              parseInt(e.target.value) || 0
                            )
                          }
                        />
                      </div>

                      <div>
                        <Label>ერთეულის ფასი</Label>
                        <Input
                          type="number"
                          min="0"
                          step={0.01}
                          placeholder="0.00"
                          defaultValue={item.unitPrice ? String(item.unitPrice) : ""}
                          onChange={(e) =>
                            handleItemChange(
                              index,
                              "unitPrice",
                              parseFloat(e.target.value) || 0
                            )
                          }
                        />
                      </div>

                      <div>
                        <Label>სულ ფასი</Label>
                        <Input
                          type="number"
                          defaultValue={item.totalPrice || 0}
                          disabled
                          className="bg-gray-100 dark:bg-gray-800"
                        />
                      </div>

                      <div>
                        <Label>Batch ნომერი *</Label>
                        <Input
                          type="text"
                          placeholder="BATCH-001"
                          defaultValue={item.batchNumber || ""}
                          onChange={(e) =>
                            handleItemChange(index, "batchNumber", e.target.value)
                          }
                        />
                      </div>

                      <div>
                        <Label>ვადის გასვლის თარიღი *</Label>
                        <DatePicker
                          id={`expiryDate-${index}`}
                          defaultDate={item.expiryDate}
                          onChange={(selectedDates) => {
                            if (selectedDates && selectedDates.length > 0) {
                              handleItemChange(
                                index,
                                "expiryDate",
                                selectedDates[0] as Date
                              );
                            }
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-4">
              <Button
                variant="outline"
                onClick={() => router.back()}
                disabled={loading}
              >
                გაუქმება
              </Button>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-5 py-3.5 text-sm font-medium text-white shadow-theme-xs transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:bg-brand-300 disabled:opacity-50"
              >
                {loading ? "მიმდინარეობს..." : "მიღება"}
              </button>
            </div>
          </div>
        </Form>
      </div>
    </div>
  );
}
