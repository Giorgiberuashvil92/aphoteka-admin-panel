import { fetchBalanceWarehouses } from '@/lib/api/balanceClient';
import { getServerNestApiBaseUrl } from '@/lib/apiBaseUrl';
import {
  mapBalanceWarehouseToWarehouse,
  rowsFromBalanceWarehouses,
} from '@/lib/api/balanceWarehouses';
import { NextRequest, NextResponse } from 'next/server';

const API_BASE = getServerNestApiBaseUrl();

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');

  try {
    const balanceData = await fetchBalanceWarehouses();
    const rows = rowsFromBalanceWarehouses(balanceData);
    const warehouses = rows.map(mapBalanceWarehouseToWarehouse).filter((w) => w.name);

    if (warehouses.length === 0) {
      return NextResponse.json({
        ok: true,
        created: 0,
        updated: 0,
        total: 0,
        message: 'Balance-დან საწყობი არ მოიძებნა.',
      });
    }

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(authHeader ? { Authorization: authHeader } : {}),
    };

    const existingRes = await fetch(`${API_BASE}/warehouses`, {
      method: 'GET',
      headers,
    });
    if (!existingRes.ok) {
      const err = await existingRes.text();
      return NextResponse.json(
        { ok: false, error: `ბაზიდან საწყობების წამოღება ვერ მოხერხდა: ${err}` },
        { status: 502 }
      );
    }
    const existingJson = await existingRes.json();
    const existingList: { id: string; name?: string }[] =
      existingJson.data ?? existingJson ?? [];
    const byName = new Map<string, string>();
    for (const w of existingList) {
      if (w.name) byName.set(w.name.trim().toLowerCase(), w.id);
    }

    let created = 0;
    let updated = 0;
    const errors: string[] = [];

    for (const warehouse of warehouses) {
      const name = warehouse.name!;
      const id = byName.get(name.trim().toLowerCase());
      const body = JSON.stringify(warehouse);

      if (id) {
        const res = await fetch(`${API_BASE}/warehouses/${id}`, {
          method: 'PUT',
          headers,
          body,
        });
        if (res.ok) updated++;
        else errors.push(`${name}: ${await res.text()}`);
      } else {
        const res = await fetch(`${API_BASE}/warehouses`, {
          method: 'POST',
          headers,
          body,
        });
        if (res.ok) {
          created++;
          const data = await res.json().catch(() => ({}));
          const newId = data?.data?.id ?? data?.id;
          if (newId && name) byName.set(name.trim().toLowerCase(), newId);
        } else errors.push(`${name}: ${await res.text()}`);
      }
    }

    return NextResponse.json({
      ok: true,
      created,
      updated,
      total: warehouses.length,
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
