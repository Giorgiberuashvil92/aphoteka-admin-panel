"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";
import { parseExcelFile, convertToProducts, ExcelRowData } from "@/lib/utils/excelParser";
import { Product } from "@/types";
import { productsApi } from "@/lib/api";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import Button from "@/components/ui/button/Button";

export default function ProductsImportPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<ExcelRowData[]>([]);
  const [productsToImport, setProductsToImport] = useState<Partial<Product>[]>([]);
  const [importResults, setImportResults] = useState<{
    success: number;
    failed: number;
    errors: string[];
  } | null>(null);

  const onDrop = async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    setFileName(file.name);
    setLoading(true);

    try {
      // პარსავს Excel ფაილს
      const excelData = await parseExcelFile(file);
      setPreviewData(excelData);

      // Debug: ვნახოთ რა მონაცემები მოვიდა
      console.log("Excel parsed data:", excelData);
      console.log("Total rows:", excelData.length);
      if (excelData.length > 0) {
        console.log("First row sample:", excelData[0]);
      }

      // გარდაქმნის Product-ებად
      const products = convertToProducts(excelData);

      console.log("Converted products:", products);
      console.log("Products count:", products.length);

      if (products.length === 0) {
        // მეტი ინფორმაცია შეცდომის შესახებ
        const sampleRow = excelData[0] || {};
        const availableFields = Object.keys(sampleRow).filter(
          (key) => sampleRow[key as keyof typeof sampleRow]
        );
        const fieldValues = availableFields
          .map((key) => `${key}: ${sampleRow[key as keyof typeof sampleRow]}`)
          .join(", ");
        throw new Error(
          `Excel ფაილში პროდუქტები არ მოიძებნა. ` +
          `ნაპოვნია ${excelData.length} რიგი. ` +
          `პირველ რიგში ნაპოვნი ველები: ${fieldValues || "ველები არ მოიძებნა"}`
        );
      }

      setProductsToImport(products);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Excel ფაილის იმპორტის შეცდომა";
      console.error("Excel import error:", error);
      alert(errorMessage);
      setFileName(null);
      setPreviewData([]);
      setProductsToImport([]);
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
    disabled: loading,
    multiple: false,
  });

  const handleClear = () => {
    setFileName(null);
    setPreviewData([]);
    setProductsToImport([]);
    setImportResults(null);
  };

  const handleImport = async () => {
    if (productsToImport.length === 0) {
      alert("პროდუქტები არ მოიძებნა იმპორტისთვის");
      return;
    }

    setLoading(true);

    try {
      // Bulk create - ბევრად უფრო სწრაფი!
      const result = await productsApi.bulkCreate(productsToImport);

      const results = {
        success: result.success,
        failed: result.failed,
        errors: result.errors?.map((err) => 
          `Row ${err.index + 1}: ${err.message}`
        ) || [],
      };

      setImportResults(results);

      if (results.success > 0) {
        // წარმატებული იმპორტის შემდეგ, შეგვიძლია გადავიდეთ კატალოგზე
        setTimeout(() => {
          router.push("/products");
        }, 2000);
      }
    } catch (error) {
      console.error("Import error:", error);
      alert("იმპორტის პროცესში მოხდა შეცდომა");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageBreadCrumb pageTitle="Excel-იდან პროდუქტების იმპორტი" />

      {/* Excel Upload Section */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          Excel ფაილის ატვირთვა
        </h2>

        <div
          {...getRootProps()}
          className={`transition border border-gray-300 border-dashed cursor-pointer dark:hover:border-brand-500 dark:border-gray-700 rounded-xl hover:border-brand-500 ${
            loading ? "opacity-50 cursor-not-allowed" : ""
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

            {fileName && productsToImport.length > 0 && (
              <div className="mt-4 w-full">
                <div className="rounded-lg bg-green-50 dark:bg-green-900/20 p-3 text-sm text-green-800 dark:text-green-300">
                  ✅ {productsToImport.length} პროდუქტი ნაპოვნია Excel ფაილში
                </div>
              </div>
            )}
          </div>
        </div>

        {fileName && (
          <div className="mt-4 flex justify-end gap-2">
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

      {/* Preview Section */}
      {productsToImport.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            პროდუქტების პრევიუ ({productsToImport.length})
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                    სახელი
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                    SKU
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                    ფასი
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                    კატეგორია
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {productsToImport.slice(0, 10).map((product, index) => (
                  <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">
                      {product.name || "-"}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
                      {product.sku || "-"}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
                      ₾{product.price?.toFixed(2) || "0.00"}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
                      {product.category || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {productsToImport.length > 10 && (
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                და სხვა {productsToImport.length - 10} პროდუქტი...
              </p>
            )}
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={handleClear}
              disabled={loading}
            >
              გაუქმება
            </Button>
            <Button
              onClick={handleImport}
              disabled={loading || productsToImport.length === 0}
            >
              {loading ? "იმპორტირება..." : `იმპორტი (${productsToImport.length})`}
            </Button>
          </div>
        </div>
      )}

      {/* Import Results */}
      {importResults && (
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            იმპორტის შედეგები
          </h2>

          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-green-100 px-4 py-2 dark:bg-green-900/20">
                <span className="text-sm font-medium text-green-800 dark:text-green-200">
                  წარმატებული: {importResults.success}
                </span>
              </div>
              {importResults.failed > 0 && (
                <div className="rounded-lg bg-red-100 px-4 py-2 dark:bg-red-900/20">
                  <span className="text-sm font-medium text-red-800 dark:text-red-200">
                    შეცდომები: {importResults.failed}
                  </span>
                </div>
              )}
            </div>

            {importResults.errors.length > 0 && (
              <div className="rounded-lg bg-red-50 p-4 dark:bg-red-900/20">
                <h3 className="mb-2 text-sm font-medium text-red-800 dark:text-red-200">
                  შეცდომები:
                </h3>
                <ul className="list-disc list-inside space-y-1">
                  {importResults.errors.slice(0, 10).map((error, index) => (
                    <li key={index} className="text-sm text-red-700 dark:text-red-300">
                      {error}
                    </li>
                  ))}
                  {importResults.errors.length > 10 && (
                    <li className="text-sm text-red-700 dark:text-red-300">
                      და სხვა {importResults.errors.length - 10} შეცდომა...
                    </li>
                  )}
                </ul>
              </div>
            )}

            {importResults.success > 0 && (
              <div className="rounded-lg bg-green-50 p-4 dark:bg-green-900/20">
                <p className="text-sm text-green-800 dark:text-green-200">
                  ✅ წარმატებით იმპორტირდა {importResults.success} პროდუქტი.
                  {importResults.success === productsToImport.length && (
                    <span className="ml-2">გადამისამართება კატალოგზე...</span>
                  )}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
