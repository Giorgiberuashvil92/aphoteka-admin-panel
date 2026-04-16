import {
  balanceGetJson,
  BALANCE_ITEMS_SERIES_ITEM_QUERY_PARAM,
  balanceItemsSeriesCloudBaseUrl,
} from '@/lib/api/balanceClient';
import { normalizeBalanceItemsSeriesApiRows } from '@/lib/api/balanceSync';
import type { BalanceItemsSeriesApiRow } from '@/types';
import { NextResponse } from 'next/server';

/**
 * Balance Exchange — ItemsSeries (ხელით სია)
 *
 * **Header:** Basic Auth (`balanceGetJson` → `balanceClient` კონსტანტები).
 *
 * **Query:** მხოლოდ პარამეტრი `Item` — ნომენკლატურის Item ref (StartingPeriod / EndingPeriod არ ემატება).
 */
/** იგივე ბაზა რაც ItemsSeries fetch (`sm/a/Balance/…/ItemsSeries`). */
const ITEMS_SERIES_BASE = balanceItemsSeriesCloudBaseUrl();

/** ხელით — ყველა ეს uuid ერთბაშად ItemsSeries-ზე */
const MANUAL_NOMENCLATURE_UIDS = [
  '1370c388-1954-11f1-b18c-005056b136db',
  '1370c389-1954-11f1-b18c-005056b136db',
  '1370c38a-1954-11f1-b18c-005056b136db',
  '1370c38b-1954-11f1-b18c-005056b136db',
  '1370c38c-1954-11f1-b18c-005056b136db',
  '1370c38d-1954-11f1-b18c-005056b136db',
  '1370c38e-1954-11f1-b18c-005056b136db',
  '1370c38f-1954-11f1-b18c-005056b136db',
  '1370c390-1954-11f1-b18c-005056b136db',
  'f9569e45-31ef-11f1-b18f-005056b136db',
  '3a160f3c-31f0-11f1-b18f-005056b136db',
] as const;

function buildUrlItemOnly(nomenclatureUid: string): string {
  const u = new URL(ITEMS_SERIES_BASE);
  u.searchParams.set(BALANCE_ITEMS_SERIES_ITEM_QUERY_PARAM, String(nomenclatureUid));
  return u.toString();
}

export async function GET() {
  const results: Array<
    | {
        uid: string;
        requestUrl: string;
        ok: true;
        lineCount: number;
        data: unknown;
        itemsSeries: BalanceItemsSeriesApiRow[];
      }
    | {
        uid: string;
        requestUrl: string;
        ok: false;
        error: string;
      }
  > = [];

  for (const uid of MANUAL_NOMENCLATURE_UIDS) {
    const requestUrl = buildUrlItemOnly(uid);
    try {
      const data = await balanceGetJson(requestUrl);
      const itemsSeries = normalizeBalanceItemsSeriesApiRows(data);
      results.push({
        uid,
        requestUrl,
        ok: true,
        lineCount: itemsSeries.length,
        data,
        itemsSeries,
      });
    } catch (e) {
      const error = e instanceof Error ? e.message : String(e);
      results.push({
        uid,
        requestUrl,
        ok: false,
        error,
      });
    }
  }

  const firstNonEmpty = results.find(
    (r): r is Extract<(typeof results)[number], { ok: true }> =>
      r.ok === true && r.lineCount > 0
  );

  return NextResponse.json({
    ok: true as const,
    base: ITEMS_SERIES_BASE,
    queryNote: 'მხოლოდ query პარამეტრი `Item` — ნომენკლატურის Item (GUID).',
    authNote:
      'Authorization: Basic — იგივეა, რაც balanceClient-შია გაწერილი.',
    tried: MANUAL_NOMENCLATURE_UIDS.length,
    firstNonEmptyUid: firstNonEmpty?.uid ?? null,
    firstNonEmptyLineCount: firstNonEmpty?.lineCount ?? 0,
    firstNonEmpty:
      firstNonEmpty && firstNonEmpty.ok
        ? {
            uid: firstNonEmpty.uid,
            requestUrl: firstNonEmpty.requestUrl,
            lineCount: firstNonEmpty.lineCount,
            data: firstNonEmpty.data,
            itemsSeries: firstNonEmpty.itemsSeries,
          }
        : null,
    results,
  });
}
