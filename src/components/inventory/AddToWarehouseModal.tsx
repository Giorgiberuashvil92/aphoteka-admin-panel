"use client";

import React, { useState, useEffect } from "react";
import { Product } from "@/types";
import { inventoryApi, warehousesApi } from "@/lib/api";
import { useProductInventory } from "@/hooks/useInventory";

interface AddToWarehouseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  product: Product;
}

interface WarehouseAllocation {
  warehouseId: string;
  warehouseName: string;
  quantity: string;
  unitPrice: string;
}

export default function AddToWarehouseModal({
  isOpen,
  onClose,
  onSuccess,
  product,
}: AddToWarehouseModalProps) {
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [allocations, setAllocations] = useState<WarehouseAllocation[]>([]);
  const [receivedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [warehouseStock, setWarehouseStock] = useState<Record<string, number>>({});
  
  // Use hook for inventory data
  const { 
    data: inventoryItems, 
    loading: loadingStock, 
    execute: refreshInventory 
  } = useProductInventory(product.id, { immediate: isOpen });
  
  // Calculate current stock from inventory or fallback to product.quantity
  const currentStock = React.useMemo(() => {
    if (inventoryItems.length > 0) {
      const total = inventoryItems.reduce((sum: number, item: any) => {
        const qty = item.availableQuantity || item.quantity || 0;
        return sum + qty;
      }, 0);
      return total;
    }
    return product.quantity || 0;
  }, [inventoryItems, product.quantity]);

  // Calculate stock per warehouse
  useEffect(() => {
    if (inventoryItems.length > 0) {
      const stockMap: Record<string, number> = {};
      inventoryItems.forEach((item: any) => {
        const warehouseId = item.warehouseLocation || item.warehouseId;
        if (warehouseId) {
          const qty = item.availableQuantity || item.quantity || 0;
          stockMap[warehouseId] = (stockMap[warehouseId] || 0) + qty;
        }
      });
      setWarehouseStock(stockMap);
    } else {
      setWarehouseStock({});
    }
  }, [inventoryItems]);

  useEffect(() => {
    if (isOpen) {
      // Load warehouses
      warehousesApi.getAll({ active: true }).then(response => {
        const warehouses = response.data || [];
        console.log('Loaded warehouses (raw):', warehouses);
        console.log('Warehouse IDs:', warehouses.map(w => ({ 
          id: w.id, 
          _id: (w as any)._id,
          name: w.name 
        })));
        
        // Ensure all warehouses have 'id' field (transform _id to id if needed)
        const transformedWarehouses = warehouses.map(w => {
          if (!w.id && (w as any)._id) {
            return { ...w, id: (w as any)._id.toString() };
          }
          return w;
        });
        
        console.log('Transformed warehouses:', transformedWarehouses);
        setWarehouses(transformedWarehouses);
      }).catch(err => {
        console.error('Failed to load warehouses:', err);
      });
      
      // Reset form when opening
      setAllocations([]);
    }
  }, [isOpen]);

  const addWarehouse = () => {
    setAllocations([
      ...allocations,
      {
        warehouseId: "",
        warehouseName: "",
        quantity: "",
        unitPrice: product.price?.toString() || "",
      },
    ]);
  };

  const removeWarehouse = (index: number) => {
    setAllocations(allocations.filter((_, i) => i !== index));
  };

  const updateAllocation = (index: number, field: keyof WarehouseAllocation, value: string) => {
    const newAllocations = [...allocations];
    newAllocations[index] = { ...newAllocations[index], [field]: value };
    
    // Update warehouse name when warehouse is selected
    if (field === "warehouseId") {
      const warehouse = warehouses.find(w => w.id === value);
      if (warehouse) {
        newAllocations[index].warehouseName = `${warehouse.name} - ${warehouse.city}`;
      }
    }
    
    setAllocations(newAllocations);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (allocations.length === 0) {
      alert("გთხოვთ დაამატოთ მინიმუმ ერთი საწყობი");
      return;
    }

    // Validate allocations
    for (let i = 0; i < allocations.length; i++) {
      const alloc = allocations[i];
      if (!alloc.warehouseId || !alloc.quantity) {
        alert(`გთხოვთ შეავსოთ ყველა ველი ${i + 1}-ე საწყობისთვის`);
        return;
      }
      const qty = parseFloat(alloc.quantity || "0");
      if (isNaN(qty) || qty <= 0) {
        alert(`რაოდენობა უნდა იყოს 0-ზე მეტი ${i + 1}-ე საწყობისთვის`);
        return;
      }
    }

    setIsSubmitting(true);

    try {
      // Create separate receipt for each warehouse
      const promises = allocations.map(async (alloc, index) => {
        // Convert receivedDate to ISO string
        const receivedDateISO = new Date(receivedDate).toISOString();
        
        // Calculate expiry date (2 years from now) as ISO string
        const expiryDate = new Date();
        expiryDate.setFullYear(expiryDate.getFullYear() + 2);
        const expiryDateISO = expiryDate.toISOString();
        
        // Generate unique receipt number
        const receiptSuffix = alloc.warehouseId && typeof alloc.warehouseId === 'string' && alloc.warehouseId.length >= 4 
          ? alloc.warehouseId.slice(-4) 
          : String(index).padStart(4, '0');
        
        console.log('Allocation warehouseId:', alloc.warehouseId, 'Type:', typeof alloc.warehouseId);
        console.log('Product ID:', product.id, 'Type:', typeof product.id);
        
        const receiptData = {
          warehouseId: alloc.warehouseId,
          receivedDate: receivedDateISO,
          receiptNumber: `REC-${Date.now()}-${receiptSuffix}`,
          items: [{
            productId: product.id,
            productName: product.name,
            productCode: product.productCode || product.sku,
            unitOfMeasure: product.unitOfMeasure,
            quantity: parseFloat(alloc.quantity || "0"),
            unitPrice: parseFloat(alloc.unitPrice || "0") || 0,
            totalPrice: parseFloat(alloc.quantity || "0") * (parseFloat(alloc.unitPrice || "0") || 0),
            batchNumber: `BATCH-${Date.now()}-${index}`,
            expiryDate: expiryDateISO,
            genericName: product.genericName,
            strength: product.strength,
            dosageForm: product.dosageForm,
            packSize: product.packSize,
            barcode: product.barcode,
            manufacturer: product.manufacturer,
          }] as any,
        };

        console.log("Sending receipt data:", receiptData);
        return inventoryApi.receive(receiptData as any);
      });

      await Promise.all(promises);
      
      const totalQty = allocations.reduce((sum, a) => sum + (parseFloat(a.quantity || "0") || 0), 0);
      alert(`პროდუქტი წარმატებით დაემატა ${allocations.length} საწყობს (სულ: ${totalQty} ცალი)`);
      
      // Refresh inventory data after successful receive
      await refreshInventory();
      
      // Reset form
      setAllocations([]);
      
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Error adding to warehouses:", error);
      console.error("Error details:", {
        message: error?.message,
        response: error?.response?.data,
        status: error?.response?.status,
      });
      const errorMessage = error?.response?.data?.message || error?.message || "უცნობი შეცდომა";
      alert(`შეცდომა: ვერ მოხერხდა პროდუქტის საწყობებში დამატება\n\n${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-100000 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white shadow-xl dark:bg-gray-800">
        <div className="sticky top-0 z-10 border-b border-gray-200 bg-white px-6 py-4 dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              საწყობში დამატება
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
          {/* Product Info */}
          <div className="mb-6 rounded-lg bg-brand-50 p-4 dark:bg-brand-900/20">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="mb-2 text-sm font-semibold text-brand-900 dark:text-brand-200">
                  პროდუქტი
                </h3>
                <p className="text-lg font-medium text-gray-900 dark:text-white">
                  {product.name}
                </p>
                {product.genericName && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {product.genericName}
                  </p>
                )}
                {product.sku && (
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    SKU: {product.sku}
                  </p>
                )}
              </div>
              
              {/* Current Stock Display */}
              <div className="ml-4 rounded-lg border-2 border-brand-500 bg-white px-4 py-3 text-center dark:border-brand-600 dark:bg-gray-800">
                <p className="text-xs font-medium text-brand-700 dark:text-brand-300">
                  მიმდინარე მარაგი
                </p>
                {loadingStock ? (
                  <div className="mt-1 flex items-center justify-center">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent"></div>
                  </div>
                ) : (
                  <>
                    <p className="mt-1 text-3xl font-bold text-brand-600 dark:text-brand-400">
                      {currentStock}
                    </p>
                    <p className="text-xs text-brand-600 dark:text-brand-400">
                      ცალი
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Warehouse Allocations */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                საწყობები და რაოდენობები
              </h3>
              <button
                type="button"
                onClick={addWarehouse}
                className="flex items-center gap-1 rounded-lg bg-brand-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-600"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                საწყობის დამატება
              </button>
            </div>

            {allocations.length === 0 ? (
              <div className="rounded-lg border-2 border-dashed border-gray-300 p-8 text-center dark:border-gray-600">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  დააჭირეთ &quot;საწყობის დამატება&quot; ღილაკს რათა დაიწყოთ განაწილება
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {allocations.map((allocation, index) => (
                  <div
                    key={index}
                    className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        საწყობი #{index + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeWarehouse(index)}
                        className="text-red-600 hover:text-red-700 dark:text-red-400"
                        title="წაშლა"
                      >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <div className="sm:col-span-1">
                        <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                          საწყობი *
                        </label>
                        <select
                          required
                          value={allocation.warehouseId}
                          onChange={(e) => updateAllocation(index, "warehouseId", e.target.value)}
                          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        >
                          <option value="">აირჩიეთ</option>
                          {warehouses
                            .filter(w => !allocations.some((a, i) => i !== index && a.warehouseId === w.id))
                            .map((warehouse) => {
                              const stockInWarehouse = warehouseStock[warehouse.id] || 0;
                              return (
                                <option key={warehouse.id} value={warehouse.id}>
                                  {warehouse.name} - {warehouse.city} {stockInWarehouse > 0 && `(${stockInWarehouse} ცალი)`}
                                </option>
                              );
                            })}
                        </select>
                        {allocation.warehouseId && warehouseStock[allocation.warehouseId] !== undefined && (
                          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            მარაგი ამ საწყობში: <span className="font-semibold text-brand-600 dark:text-brand-400">{warehouseStock[allocation.warehouseId] || 0} ცალი</span>
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                          რაოდენობა *
                        </label>
                        <input
                          type="number"
                          required
                          min="0.01"
                          step="0.01"
                          value={allocation.quantity}
                          onChange={(e) => {
                            const value = e.target.value;
                            // Allow empty string for typing, but validate on submit
                            updateAllocation(index, "quantity", value);
                          }}
                          onBlur={(e) => {
                            // Ensure value is valid number on blur
                            const value = e.target.value;
                            if (value && parseFloat(value) <= 0) {
                              updateAllocation(index, "quantity", "");
                            }
                          }}
                          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                          placeholder="0"
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                          ერთეულის ფასი
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={allocation.unitPrice}
                          onChange={(e) => updateAllocation(index, "unitPrice", e.target.value)}
                          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                          placeholder="0.00"
                        />
                      </div>
                    </div>

                    {allocation.quantity && parseFloat(allocation.quantity) > 0 && allocation.unitPrice && parseFloat(allocation.unitPrice) > 0 && (
                      <div className="mt-2 text-right text-sm text-gray-600 dark:text-gray-400">
                        სულ: <span className="font-semibold text-brand-600 dark:text-brand-400">
                          ₾{(parseFloat(allocation.quantity || "0") * parseFloat(allocation.unitPrice || "0")).toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Total Summary */}
            {allocations.length > 0 && (
              <div className="space-y-4">
                {/* Stock Comparison */}
                <div className="rounded-lg border border-gray-300 bg-gray-50 p-4 dark:border-gray-600 dark:bg-gray-700/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          მიმდინარე მარაგი
                        </p>
                        <p className="text-2xl font-bold text-gray-700 dark:text-gray-300">
                          {currentStock}
                        </p>
                      </div>
                      <div className="text-2xl text-gray-400">→</div>
                      <div>
                        <p className="text-xs text-green-600 dark:text-green-400">
                          დამატების შემდეგ
                        </p>
                        <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                          {currentStock + allocations.reduce((sum, a) => sum + (parseFloat(a.quantity || "0") || 0), 0)}
                        </p>
                      </div>
                    </div>
                    <div className="rounded-lg bg-green-100 px-3 py-2 dark:bg-green-900/30">
                      <p className="text-xs text-green-700 dark:text-green-300">
                        ემატება
                      </p>
                      <p className="text-xl font-bold text-green-600 dark:text-green-400">
                        +{allocations.reduce((sum, a) => sum + (parseFloat(a.quantity || "0") || 0), 0)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Allocation Summary */}
                <div className="rounded-lg border-2 border-brand-500 bg-brand-50 p-6 dark:border-brand-600 dark:bg-brand-900/30">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="text-center">
                      <p className="text-sm font-medium text-brand-700 dark:text-brand-300">
                        ახლა ემატება
                      </p>
                      <p className="mt-2 text-4xl font-bold text-brand-600 dark:text-brand-400">
                        {allocations.reduce((sum, a) => sum + (parseFloat(a.quantity || "0") || 0), 0)}
                      </p>
                      <p className="mt-1 text-sm text-brand-600 dark:text-brand-400">
                        ცალი
                      </p>
                      <p className="mt-2 text-xs text-brand-700 dark:text-brand-300">
                        📦 {allocations.length} საწყობში
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-brand-700 dark:text-brand-300">
                        სულ ღირებულება
                      </p>
                      <p className="mt-2 text-4xl font-bold text-brand-600 dark:text-brand-400">
                        ₾{allocations.reduce((sum, a) => sum + ((parseFloat(a.quantity || "0") || 0) * (parseFloat(a.unitPrice || "0") || 0)), 0).toFixed(2)}
                      </p>
                      <p className="mt-1 text-sm text-brand-600 dark:text-brand-400">
                        ლარი
                      </p>
                      <p className="mt-2 text-xs text-brand-700 dark:text-brand-300">
                        💰 საშუალო: ₾{(() => {
                          const totalQty = allocations.reduce((sum, a) => sum + (parseFloat(a.quantity || "0") || 0), 0);
                          const totalPrice = allocations.reduce((sum, a) => sum + ((parseFloat(a.quantity || "0") || 0) * (parseFloat(a.unitPrice || "0") || 0)), 0);
                          return totalQty > 0 ? (totalPrice / totalQty).toFixed(2) : "0.00";
                        })()}/ცალი
                      </p>
                    </div>
                  </div>
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
              {isSubmitting ? "დამატება..." : "საწყობში დამატება"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
