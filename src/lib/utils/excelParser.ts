import * as XLSX from "xlsx";
import { WarehouseReceiptItem, Product } from "@/types";

export interface ExcelRowData {
  // Product and Transaction Details
  productCode?: string; // საქონლის კოდი
  productName?: string; // საქონლის დასახელება
  unitOfMeasure?: string; // ზომის ერთეული
  quantity?: number; // რაოდენობა
  unitPrice?: number; // ერთეულის ფასი
  productPrice?: number; // საქონლის ფასი
  taxation?: string; // დაბეგვრა
  invoiceNumber?: string; // ზედნადების ნომერი
  status?: string; // სტატუსი
  buyer?: string; // მყიდველი
  seller?: string; // გამყიდველი
  activationDate?: string; // გააქტიურების თარიღი
  transportStartDate?: string; // ტრანსპორტირების დაწყების თარიღი

  // Unique Identification
  certificateNumber?: string; // ფირნიშის ან ცნობის ნომერი
  documentNumber?: string; // დოკუმენტის N
  sku?: string; // SKU / internal product code

  // Additional Product Information
  serialNumber?: string; // სერიის ნომერი
  expiryDate?: string; // ვარგისიანობის ვადა
  manufacturer?: string; // მწარმოებელი (ქვეყანა)

  // Internal Additional Information
  genericName?: string; // Generic name
  productNameBrand?: string; // Product name (brand)
  strength?: string; // Strength (e.g., 500 mg)
  dosageForm?: string; // Dosage form (tablet, syrup, injection)
  packSize?: string; // Pack size (10 tablets, 100 ml)
  barcode?: string; // Barcode (GTIN, if available)
  packagingType?: string; // შეფუთვის სახეობა
  category?: string; // კატეგორია / კატალოგი
}

/**
 * პარსავს Excel ფაილს და აბრუნებს მონაცემების მასივს
 */
export function parseExcelFile(file: File): Promise<ExcelRowData[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: "binary" });

        // იღებს პირველ sheet-ს
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // გარდაქმნის JSON-ად - იწყება row 4-დან (header row)
        // range: 'A4:Q1000' - იწყება row 4-დან სადაც არის column headers
        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
          raw: false, // ყველაფერი string-ად
          defval: "", // default მნიშვნელობა
          range: 3, // იწყება row 4-დან (0-indexed, ასე რომ 3 = row 4)
        });

        // Debug: ვნახოთ რა ველები არის Excel-ში
        if (jsonData.length > 0) {
          console.log("Excel column headers:", Object.keys(jsonData[0] as Record<string, any>));
          console.log("First row raw data:", jsonData[0]);
        }

        // გარდაქმნის ExcelRowData ტიპად
        const parsedData: ExcelRowData[] = jsonData.map((row: any) => {
          // ვიღებთ ყველა column-ს Excel-იდან
          const allColumns = Object.keys(row);
          console.log("Available columns in row:", allColumns);
          
          // ვეძებთ ველებს case-insensitive და სხვადასხვა ვარიანტებით
          const getField = (variants: string[]) => {
            for (const variant of variants) {
              // ვეძებთ exact match
              if (row[variant] !== undefined && row[variant] !== null && row[variant] !== "") {
                return row[variant];
              }
              // ვეძებთ case-insensitive
              const lowerVariant = variant.toLowerCase();
              for (const key in row) {
                if (key.toLowerCase() === lowerVariant && row[key] !== undefined && row[key] !== null && row[key] !== "") {
                  return row[key];
                }
              }
            }
            return undefined;
          };

          // ვეძებთ რიცხვით ველებს (მხარდაჭერა comma decimal separator-ისთვის)
          const getNumericField = (variants: string[], defaultValue: number = 0) => {
            const value = getField(variants);
            if (value === undefined || value === null || value === "") return defaultValue;
            // ვცვლით comma-ს dot-ად decimal separator-ისთვის
            const normalized = String(value).replace(/,/g, ".");
            const num = parseFloat(normalized.replace(/[^\d.-]/g, ""));
            return isNaN(num) ? defaultValue : num;
          };

          // Excel-ის კატალოგის headers-ის მიხედვით პირდაპირი მაპინგი
          // ვიყენებთ exact column names რომლებიც Excel-ში არის (კატალოგის headers)
          return {
            // პირველი 4 column (კატალოგის ძირითადი ველები)
            productCode: getField(["საქონლის კოდი"]),
            productName: getField(["საქონლის დასახელება"]),
            unitOfMeasure: getField(["ზომის ერთეული"]),
            quantity: getNumericField(["რაოდ."], 0),
            
            // ფასები
            unitPrice: getNumericField(["ერთეულის ფასი"], 0),
            productPrice: getNumericField(["საქონლის ფასი"], 0),
            
            // სხვა ველები
            taxation: getField(["დაბეგვრა"]),
            invoiceNumber: getField(["ზედნადების ნომერი"]),
            status: getField(["სტატუსი"]),
            buyer: getField(["მყიდველი"]),
            seller: getField(["გამყიდველი"]),
            activationDate: getField(["გააქტიურების თარიღი"]),
            transportStartDate: getField(["ტრანსპორტირების დაწყების თარიღი"]),
            certificateNumber: getField(["ფირნიშის ან ცნობის ნომერი"]),
            documentNumber: getField(["დოკუმენტის N"]),
            sku: getField(["SKU / internal product code"]),
            serialNumber: getField(["სერიის ნომერი"]),
            expiryDate: getField(["ვარგისიანობის ვადა"]),
            manufacturer: getField(["მწარმოებელი (ქვეყანა)"]),
            
            // დამატებითი პროდუქტის ინფორმაცია
            genericName: getField(["Generic name"]),
            productNameBrand: getField(["Product name (brand)"]),
            strength: getField(["Strength (e.g., 500 mg)"]),
            dosageForm: getField(["Dosage form (tablet, syrup, injection)"]),
            packSize: getField(["Pack size (10 tablets, 100 ml)"]),
            barcode: getField(["Barcode (GTIN, if available)"]),
            packagingType: getField(["შეფუთვის სახეობა"]),
            category: getField(["კატეგორია", "კატალოგი"]),
          };
        });

        resolve(parsedData);
      } catch (error) {
        reject(new Error(`Excel ფაილის პარსირების შეცდომა: ${error}`));
      }
    };

    reader.onerror = () => {
      reject(new Error("ფაილის წაკითხვის შეცდომა"));
    };

    reader.readAsBinaryString(file);
  });
}

/**
 * გარდაქმნის ExcelRowData-ს WarehouseReceiptItem-ად
 */
export function convertToWarehouseReceiptItems(
  excelData: ExcelRowData[],
  productIdMap?: Map<string, string> // SKU ან productCode -> productId
): Partial<WarehouseReceiptItem>[] {
  return excelData
    .filter((row) => {
      // ფილტრავს ცარიელ რიგებს
      return (
        row.productCode ||
        row.productName ||
        row.quantity ||
        row.serialNumber
      );
    })
    .map((row) => {
      // თარიღების პარსირება
      let expiryDate: Date | undefined;
      if (row.expiryDate) {
        // სხვადასხვა ფორმატის მხარდაჭერა
        const dateStr = row.expiryDate.toString().trim();
        expiryDate = parseDate(dateStr);
      }

      // თუ expiryDate არ არის, დავაყენოთ default
      if (!expiryDate) {
        expiryDate = new Date();
        expiryDate.setFullYear(expiryDate.getFullYear() + 1); // +1 წელი default
      }

      const item: Partial<WarehouseReceiptItem> = {
        productId: productIdMap?.get(row.sku || row.productCode || "") || "",
        productCode: row.productCode,
        productName: row.productName || row.productNameBrand,
        unitOfMeasure: row.unitOfMeasure,
        quantity: row.quantity || 0,
        unitPrice: row.unitPrice || 0,
        totalPrice: row.productPrice || (row.quantity || 0) * (row.unitPrice || 0),
        tax: parseTax(row.taxation),
        batchNumber: row.serialNumber || "",
        expiryDate: expiryDate,
        manufacturer: row.manufacturer,
        sku: row.sku,
        genericName: row.genericName,
        strength: row.strength,
        dosageForm: row.dosageForm,
        packSize: row.packSize,
        barcode: row.barcode,
      };

      return item;
    });
}

/**
 * პარსავს თარიღს სხვადასხვა ფორმატიდან
 */
function parseDate(dateStr: string): Date | undefined {
  if (!dateStr) return undefined;

  // Excel serial date number (თუ რიცხვია)
  // Excel serial date: დღეების რაოდენობა 1900-01-01-დან
  if (!isNaN(Number(dateStr))) {
    const serialDate = Number(dateStr);
    // Excel-ის serial date range: 1 (1900-01-01) to ~2958465 (9999-12-31)
    if (serialDate >= 1 && serialDate < 2958465) {
      // Excel-ის epoch: 1899-12-30 (რადგან Excel 1900-01-01 = 1)
      const excelEpoch = new Date(1899, 11, 30);
      const days = Math.floor(serialDate);
      const date = new Date(excelEpoch);
      date.setDate(date.getDate() + days);
      return date;
    }
  }

  // DD.MM.YYYY
  const ddmmyyyy = dateStr.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (ddmmyyyy) {
    return new Date(
      parseInt(ddmmyyyy[3]),
      parseInt(ddmmyyyy[2]) - 1,
      parseInt(ddmmyyyy[1])
    );
  }

  // DD/MM/YYYY
  const ddmmyyyySlash = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (ddmmyyyySlash) {
    return new Date(
      parseInt(ddmmyyyySlash[3]),
      parseInt(ddmmyyyySlash[2]) - 1,
      parseInt(ddmmyyyySlash[1])
    );
  }

  // YYYY-MM-DD
  const yyyymmdd = dateStr.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (yyyymmdd) {
    return new Date(
      parseInt(yyyymmdd[1]),
      parseInt(yyyymmdd[2]) - 1,
      parseInt(yyyymmdd[3])
    );
  }

  // ISO format
  const isoDate = new Date(dateStr);
  if (!isNaN(isoDate.getTime())) {
    return isoDate;
  }

  return undefined;
}

/**
 * პარსავს დაბეგვრის ინფორმაციას
 */
function parseTax(taxation?: string): number | undefined {
  if (!taxation) return undefined;

  // თუ "დაუბეგრავი" ან "untaxed"
  if (
    taxation.toLowerCase().includes("დაუბეგრავი") ||
    taxation.toLowerCase().includes("untaxed")
  ) {
    return 0;
  }

  // პროცენტის ამოღება
  const percentMatch = taxation.match(/(\d+(?:\.\d+)?)%/);
  if (percentMatch) {
    return parseFloat(percentMatch[1]);
  }

  // რიცხვის ამოღება
  const numberMatch = taxation.match(/(\d+(?:\.\d+)?)/);
  if (numberMatch) {
    return parseFloat(numberMatch[1]);
  }

  return undefined;
}

/**
 * გარდაქმნის ExcelRowData-ს Product-ად (პროდუქტების კატალოგისთვის)
 */
export function convertToProducts(
  excelData: ExcelRowData[]
): Partial<Product>[] {
  if (!excelData || excelData.length === 0) {
    return [];
  }

  // Debug: ვნახოთ რა მონაცემები გვაქვს
  console.log("convertToProducts - Input data sample:", excelData[0]);
  console.log("convertToProducts - Total rows:", excelData.length);

  return excelData
    .filter((row) => {
      // ფილტრავს ცარიელ რიგებს და notes/ინსტრუქციების rows-ს
      
      // შევამოწმოთ რიცხვითი ველები - მინიმუმ ერთი უნდა იყოს 0-ზე მეტი
      const hasNonZeroQuantity = !!(row.quantity && row.quantity > 0);
      const hasNonZeroPrice = !!(row.unitPrice && row.unitPrice > 0) || !!(row.productPrice && row.productPrice > 0);
      
      // შევამოწმოთ ტექსტური ველები
      const productName = row.productName || row.productNameBrand || row.genericName || "";
      const productCode = row.productCode || row.sku || "";
      
      // თუ productName ძალიან გრძელია (notes/ინსტრუქცია), გამოვტოვოთ
      const isLongTextNote = productName.length > 100;
      
      // თუ productCode არის მხოლოდ რიცხვი 1-3 (notes rows), გამოვტოვოთ
      const isNoteRow = /^[123]$/.test(productCode) && !hasNonZeroQuantity && !hasNonZeroPrice;
      
      // პროდუქტი უნდა აკმაყოფილებდეს:
      // 1. აქვს რაიმე რიცხვითი მონაცემი (quantity > 0 ან price > 0)
      // 2. აქვს productCode/SKU (და არ არის note row)
      // 3. არ არის გრძელი note text
      const isValid = 
        (hasNonZeroQuantity || hasNonZeroPrice) && 
        productCode && 
        !isNoteRow && 
        !isLongTextNote;
      
      if (!isValid) {
        console.log("Filtered out row:", {
          reason: isNoteRow ? "note row" : isLongTextNote ? "long text note" : "no valid data",
          productCode,
          quantity: row.quantity,
          price: row.unitPrice || row.productPrice,
        });
      }
      
      return isValid;
    })
    .map((row) => {
      // პროდუქტის სახელი - სხვადასხვა ვარიანტი
      const name = 
        row.productNameBrand || 
        row.productName || 
        row.genericName || 
        "";
      
      // SKU - სხვადასხვა ვარიანტი
      const sku = 
        row.sku || 
        row.productCode || 
        row.barcode || 
        "";
      
      // ფასი - სხვადასხვა ვარიანტი
      const price = 
        row.unitPrice || 
        (row.productPrice && row.quantity ? row.productPrice / row.quantity : 0) ||
        row.productPrice ||
        0;

      // Description - შევაერთოთ რამდენიმე ველი
      const descriptionParts: string[] = [];
      if (row.genericName && row.genericName !== name) descriptionParts.push(row.genericName);
      if (row.strength) descriptionParts.push(`სიძლიერე: ${row.strength}`);
      if (row.dosageForm) descriptionParts.push(`ფორმა: ${row.dosageForm}`);
      if (row.manufacturer) descriptionParts.push(`მწარმოებელი: ${row.manufacturer}`);
      const description = descriptionParts.length > 0 
        ? descriptionParts.join(", ") 
        : (row.productName || row.genericName || undefined);

      const product: Partial<Product> = {
        name: name || sku || "უსახელო პროდუქტი", // თუ სახელი არ არის, გამოვიყენოთ SKU ან default
        sku: sku || `AUTO-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // თუ SKU არ არის, შევქმნათ
        price: price,
        description: description,
        category: row.category,
        unitOfMeasure: row.unitOfMeasure,
        packSize: row.packSize,
        barcode: row.barcode,
        active: true, // default-ად აქტიური
      };

      return product;
    });
}
