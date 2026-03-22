"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { WarehouseDispatchItem, WarehouseDispatch, Inventory } from "@/types";
import { inventoryApi, ordersApi } from "@/lib/api";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Select from "@/components/form/Select";
import DatePicker from "@/components/form/date-picker";
import Button from "@/components/ui/button/Button";
import { PlusIcon, TrashBinIcon } from "@/icons";
import Form from "@/components/form/Form";

export default function WarehouseDispatchPage() {
  const params = useParams();
  const router = useRouter();
  const warehouseId = params.id as string;

  const [loading, setLoading] = useState(false);
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    appInvoiceNumber: "",
    salesInvoiceId: "",
    orderId: "",
    dispatchedDate: new Date(),
    notes: "",
  });
  const [items, setItems] = useState<Partial<WarehouseDispatchItem>[]>([
    {
      inventoryId: "",
      quantity: 0,
      unitPrice: 0,
    },
  ]);

  useEffect(() => {
    loadData();
  }, [warehouseId]);

  const loadData = async () => {
    try {
      // Load available inventory
      const inventoryResponse = await inventoryApi.getAll({
        warehouseId,
        state: "available",
      });
      setInventory(inventoryResponse.data);

      // Load orders for this warehouse
      const ordersResponse = await ordersApi.getAll({});
      // Filter orders by warehouseLocation
      const warehouseOrders = ordersResponse.data.filter(
        (order) => order.warehouseLocation === warehouseId
      );
      setOrders(warehouseOrders);
    } catch (err) {
      console.error("Error loading data:", err);
    }
  };

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        inventoryId: "",
        quantity: 0,
        unitPrice: 0,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (
    index: number,
    field: keyof WarehouseDispatchItem,
    value: any
  ) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };

    // If inventory changed, update inventory-related fields
    if (field === "inventoryId" && value) {
      const inv = inventory.find((i) => i.id === value);
      if (inv && inv.product) {
        newItems[index] = {
          ...newItems[index],
          productId: inv.productId,
          productName: inv.product.name,
          productCode: inv.product.sku,
          unitOfMeasure: inv.product.unitOfMeasure,
          batchNumber: inv.batchNumber,
          expiryDate: inv.expiryDate,
          genericName: inv.product.genericName,
          strength: inv.product.strength,
          dosageForm: inv.product.dosageForm,
          packSize: inv.product.packSize,
          barcode: inv.product.barcode,
          manufacturer: inv.product.manufacturer,
          unitPrice: inv.product.price,
        };
      }
    }

    // Calculate totalPrice and validate quantity
    if (field === "quantity") {
      const inv = inventory.find((i) => i.id === newItems[index].inventoryId);
      if (inv && value > inv.availableQuantity) {
        alert(`მაქსიმალური რაოდენობა: ${inv.availableQuantity}`);
        value = inv.availableQuantity;
      }
      const quantity = value;
      const unitPrice = newItems[index].unitPrice || 0;
      newItems[index].totalPrice = quantity * unitPrice;
    }

    if (field === "unitPrice") {
      const quantity = newItems[index].quantity || 0;
      const unitPrice = value;
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
      if (!item.inventoryId || !item.quantity) {
        alert(`გთხოვთ შეავსოთ ყველა ველი ${i + 1}-ე პროდუქტისთვის`);
        return;
      }

      const inv = inventory.find((i) => i.id === item.inventoryId);
      if (inv && item.quantity! > inv.availableQuantity) {
        alert(`${i + 1}-ე პროდუქტის რაოდენობა აღემატება ხელმისაწვდომ რაოდენობას`);
        return;
      }
    }

    try {
      setLoading(true);
      const dispatchData: Partial<WarehouseDispatch> = {
        warehouseId,
        appInvoiceNumber: formData.appInvoiceNumber || undefined,
        salesInvoiceId: formData.salesInvoiceId || undefined,
        orderId: formData.orderId || undefined,
        dispatchedDate: formData.dispatchedDate,
        notes: formData.notes || undefined,
        items: items.map((item) => ({
          inventoryId: item.inventoryId!,
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
        })) as WarehouseDispatchItem[],
      };

      await inventoryApi.dispatch(dispatchData);
      router.push(`/warehouses/${warehouseId}/inventory`);
    } catch (err) {
      console.error("Error dispatching inventory:", err);
      alert("შეცდომა ინვენტარის გაცემისას");
    } finally {
      setLoading(false);
    }
  };

  const inventoryOptions = inventory.map((inv) => ({
    value: inv.id,
    label: `${inv.product?.name || "უცნობი"} - Batch: ${inv.batchNumber} (ხელმისაწვდომი: ${inv.availableQuantity})`,
  }));

  const orderOptions = orders.map((order) => ({
    value: order.id,
    label: `შეკვეთა #${order.id} - ${order.totalAmount}₾`,
  }));

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <h2 className="mb-6 text-xl font-semibold text-gray-900 dark:text-white">
          ინვენტარის გაცემა
        </h2>

        <Form onSubmit={handleSubmit}>
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <Label htmlFor="appInvoiceNumber">აპის ინვოისის ნომერი</Label>
                <Input
                  type="text"
                  id="appInvoiceNumber"
                  placeholder="INV-2024-001"
                  defaultValue={formData.appInvoiceNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, appInvoiceNumber: e.target.value })
                  }
                />
              </div>

              <div>
                <Label htmlFor="salesInvoiceId">გაყიდვის ინვოისის ID</Label>
                <Input
                  type="text"
                  id="salesInvoiceId"
                  placeholder="sales-invoice-id"
                  defaultValue={formData.salesInvoiceId}
                  onChange={(e) =>
                    setFormData({ ...formData, salesInvoiceId: e.target.value })
                  }
                />
              </div>

              <div>
                <Label htmlFor="orderId">შეკვეთა</Label>
                <div className="relative">
                  <Select
                    options={[
                      { value: "", label: "არა" },
                      ...orderOptions,
                    ]}
                    placeholder="აირჩიეთ შეკვეთა"
                    defaultValue={formData.orderId}
                    onChange={(value) =>
                      setFormData({ ...formData, orderId: value })
                    }
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="dispatchedDate">გაცემის თარიღი</Label>
                <DatePicker
                  id="dispatchedDate"
                  defaultDate={formData.dispatchedDate}
                  onChange={(selectedDates) => {
                    if (selectedDates && selectedDates.length > 0) {
                      setFormData({
                        ...formData,
                        dispatchedDate: selectedDates[0] as Date,
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
                {items.map((item, index) => {
                  const selectedInventory = inventory.find(
                    (inv) => inv.id === item.inventoryId
                  );
                  return (
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
                          <Label>ინვენტარი (Batch) *</Label>
                          <div className="relative">
                            <Select
                              options={inventoryOptions}
                              placeholder="აირჩიეთ ინვენტარი"
                              defaultValue={item.inventoryId || ""}
                              onChange={(value) =>
                                handleItemChange(index, "inventoryId", value)
                              }
                            />
                          </div>
                          {selectedInventory && (
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                              ხელმისაწვდომი: {selectedInventory.availableQuantity} / სულ: {selectedInventory.quantity}
                            </p>
                          )}
                        </div>

                        <div>
                          <Label>რაოდენობა *</Label>
                          <Input
                            type="number"
                            min="1"
                            max={selectedInventory?.availableQuantity ? String(selectedInventory.availableQuantity) : undefined}
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

                        {selectedInventory && (
                          <>
                            <div>
                              <Label>Batch ნომერი</Label>
                              <Input
                                type="text"
                                defaultValue={selectedInventory.batchNumber}
                                disabled
                                className="bg-gray-100 dark:bg-gray-800"
                              />
                            </div>

                            <div>
                              <Label>ვადის გასვლის თარიღი</Label>
                              <Input
                                type="text"
                                defaultValue={selectedInventory.expiryDate.toLocaleDateString("ka-GE")}
                                disabled
                                className="bg-gray-100 dark:bg-gray-800"
                              />
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
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
                {loading ? "მიმდინარეობს..." : "გაცემა"}
              </button>
            </div>
          </div>
        </Form>
      </div>
    </div>
  );
}
