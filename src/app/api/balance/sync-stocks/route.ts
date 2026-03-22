import { fetchBalancePrices, fetchBalanceStocks } from '@/lib/api/balanceClient';
import { getApiBaseUrl } from '@/lib/apiBaseUrl';
import {
  buildPriceByUuid,
  getBalanceItems,
  getBalancePricesRows,
  mapBalanceItemToProduct,
} from '@/lib/api/balanceSync';
import { NextRequest, NextResponse } from 'next/server';

const API_BASE = getApiBaseUrl();

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');

  try {
    const [balanceData, pricesData] = await Promise.all([
      fetchBalanceStocks(),
      fetchBalancePrices(),
    ]);
    const items = getBalanceItems(balanceData);
    const pricesRows = getBalancePricesRows(pricesData);
    const priceByUuid = buildPriceByUuid(pricesRows);
    const products = items.map((item, i) =>
      mapBalanceItemToProduct(item, i, priceByUuid)
    );
    const withSku = products.filter((p) => p.sku);

    if (withSku.length === 0) {
      return NextResponse.json({
        ok: true,
        created: 0,
        updated: 0,
        total: 0,
        message: 'Balance-დან ჩანაწერი არ მოიძებნა ან Items ცარიელია.',
      });
    }

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(authHeader ? { Authorization: authHeader } : {}),
    };

    const existingRes = await fetch(`${API_BASE}/products?limit=10000`, {
      method: 'GET',
      headers,
    });
    if (!existingRes.ok) {
      const err = await existingRes.text();
      return NextResponse.json(
        { ok: false, error: `ბაზიდან პროდუქტების წამოღება ვერ მოხერხდა: ${err}` },
        { status: 502 }
      );
    }
    const existingJson = await existingRes.json();
    const existingList: { id: string; sku?: string }[] = existingJson.data ?? existingJson ?? [];
    const bySku = new Map<string | undefined, string>();
    for (const p of existingList) {
      if (p.sku) bySku.set(p.sku, p.id);
    }

    let created = 0;
    let updated = 0;
    const errors: string[] = [];

    for (const product of withSku) {
      const id = bySku.get(product.sku!);
      const body = JSON.stringify(product);

      if (id) {
        const res = await fetch(`${API_BASE}/products/${id}`, {
          method: 'PATCH',
          headers,
          body,
        });
        if (res.ok) updated++;
        else errors.push(`${product.sku}: ${await res.text()}`);
      } else {
        const res = await fetch(`${API_BASE}/products`, {
          method: 'POST',
          headers,
          body,
        });
        if (res.ok) {
          created++;
          const data = await res.json().catch(() => ({}));
          const newId = data?.data?.id ?? data?.id;
          if (newId && product.sku) bySku.set(product.sku, newId);
        } else errors.push(`${product.sku}: ${await res.text()}`);
      }
    }

    return NextResponse.json({
      ok: true,
      created,
      updated,
      total: withSku.length,
      errors: errors.length ? errors : undefined,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 }
    );
  }
}
