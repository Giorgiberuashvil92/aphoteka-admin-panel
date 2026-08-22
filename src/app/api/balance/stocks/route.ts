import { fetchBalanceStocks } from '@/lib/api/balanceClient';
import { getBalanceItems, isBalanceGroupRow } from '@/lib/api/balanceSync';
import { NextRequest, NextResponse } from 'next/server';

function compactBalanceRow(row: Record<string, unknown>): Record<string, unknown> {
  const keys = [
    'uid',
    'Name',
    'FullName',
    'Group',
    'InternalArticle',
    'Unit',
    'ItemType',
    'VATRate',
    'InventoriesAccount',
    'ExpensesAccount',
    'RevenuesAccount',
    'CostsAccount',
    'VATPayableAccount',
    'OverwriteAccountsByGroup',
    'New',
    'ExpireDate',
    'DefaultSpecification',
    'ImportTaxRate',
    'LoadingPerVehicle',
    'UseSeries',
    'VATArticle',
    'UnitCost',
    'ExtCode',
    'Code',
    'Packages',
  ];
  return Object.fromEntries(keys.map((key) => [key, row[key]]));
}

function logBalanceItemsDebug(data: unknown) {
  const rows = getBalanceItems(data);
  const groups = rows.filter(isBalanceGroupRow);
  const products = rows.filter((row) => !isBalanceGroupRow(row));
  const keys = [...new Set(rows.flatMap((row) => Object.keys(row)))].sort();
  const productWithSeries =
    products.find((row) => String(row.UseSeries ?? '').toLowerCase() === 'true') ??
    products[0];
  const productWithPackages =
    products.find(
      (row) => Array.isArray(row.Packages) && row.Packages.length > 0
    ) ?? products[0];

  console.log(
    '[Balance Exchange/Items DEBUG]',
    JSON.stringify(
      {
        totalRows: rows.length,
        groupRows: groups.length,
        productRows: products.length,
        keys,
        sampleGroup: groups[0] ? compactBalanceRow(groups[0]) : null,
        sampleProduct: products[0] ? compactBalanceRow(products[0]) : null,
        sampleProductWithSeries: productWithSeries
          ? compactBalanceRow(productWithSeries)
          : null,
        sampleProductWithPackages: productWithPackages
          ? compactBalanceRow(productWithPackages)
          : null,
      },
      null,
      2
    )
  );
}

export async function GET(request: NextRequest) {
  try {
    const data = await fetchBalanceStocks();
    if (
      request.nextUrl.searchParams.get('debug') === '1' ||
      process.env.BALANCE_LOG_ITEMS === '1'
    ) {
      logBalanceItemsDebug(data);
    }
    return NextResponse.json({ ok: true as const, data });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { ok: false as const, error: message },
      { status: 502 }
    );
  }
}
