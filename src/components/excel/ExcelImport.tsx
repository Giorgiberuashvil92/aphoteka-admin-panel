"use client";

import React, { useState } from "react";
import { useDropzone } from "react-dropzone";
import { parseExcelFile, convertToWarehouseReceiptItems, ExcelRowData } from "@/lib/utils/excelParser";
import { WarehouseReceiptItem } from "@/types";
import Button from "@/components/ui/button/Button";

interface ExcelImportProps {
  onImport: (items: Partial<WarehouseReceiptItem>[]) => void;
  onError?: (error: string) => void;
  productIdMap?: Map<string, string>; // SKU ან productCode -> productId
  disabled?: boolean;
}

export default function ExcelImport({
  onImport,
  onError,
  productIdMap,
  disabled = false,
}: ExcelImportProps) {
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<ExcelRowData[]>([]);

  const onDrop = async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    setFileName(file.name);
    setLoading(true);

    try {
      // პარსავს Excel ფაილს
      const excelData = await parseExcelFile(file);
      setPreviewData(excelData);

      // გარდაქმნის WarehouseReceiptItem-ებად
      const items = convertToWarehouseReceiptItems(excelData, productIdMap);

      if (items.length === 0) {
        throw new Error("Excel ფაილში მონაცემები არ მოიძებნა");
      }

      // გადასცემს მშობელ კომპონენტს
      onImport(items);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Excel ფაილის იმპორტის შეცდომა";
      console.error("Excel import error:", error);
      if (onError) {
        onError(errorMessage);
      } else {
        alert(errorMessage);
      }
      setFileName(null);
      setPreviewData([]);
    } finally {
      setLoading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
      "application/vnd.ms-excel": [".xls"],
    },
    disabled,
    multiple: false,
  });

  const handleClear = () => {
    setFileName(null);
    setPreviewData([]);
  };

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`transition border border-gray-300 border-dashed cursor-pointer dark:hover:border-brand-500 dark:border-gray-700 rounded-xl hover:border-brand-500 ${
          disabled ? "opacity-50 cursor-not-allowed" : ""
        } ${
          isDragActive
            ? "border-brand-500 bg-gray-100 dark:bg-gray-800"
            : "border-gray-300 bg-gray-50 dark:border-gray-700 dark:bg-gray-900"
        }`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center p-6 lg:p-10">
          {/* Icon */}
          <div className="mb-4 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-400">
              <svg
                className="fill-current"
                width="32"
                height="32"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" />
                <path d="M14 2v6h6" />
                <path d="M16 13H8" />
                <path d="M16 17H8" />
                <path d="M10 9H8" />
              </svg>
            </div>
          </div>

          {/* Text Content */}
          <h4 className="mb-2 font-semibold text-gray-800 text-lg dark:text-white/90">
            {loading
              ? "მიმდინარეობს..."
              : isDragActive
              ? "გაათავისუფლეთ ფაილი"
              : fileName
              ? fileName
              : "Excel ფაილის ატვირთვა"}
          </h4>

          {!fileName && (
            <span className="text-center mb-4 block w-full max-w-md text-sm text-gray-700 dark:text-gray-400">
              გადაიტანეთ Excel ფაილი აქ ან დააჭირეთ ღილაკს ფაილის ასარჩევად
            </span>
          )}

          {!fileName && (
            <span className="font-medium underline text-sm text-brand-500">
              ფაილის არჩევა
            </span>
          )}

          {fileName && previewData.length > 0 && (
            <div className="mt-4 w-full">
              <div className="rounded-lg bg-green-50 dark:bg-green-900/20 p-3 text-sm text-green-800 dark:text-green-300">
                ✅ {previewData.length} პროდუქტი ნაპოვნია Excel ფაილში
              </div>
            </div>
          )}
        </div>
      </div>

      {fileName && (
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleClear}
            disabled={loading}
          >
            გასუფთავება
          </Button>
        </div>
      )}
    </div>
  );
}
