import {
  BALANCE_DISCOUNTS_URL,
  fetchBalanceDiscounts,
} from '@/lib/api/balanceClient';
import { NextResponse } from 'next/server';

/**
 * Balance Exchange — `GET …/Exchange/Discounts` (იგივე auth რაც Prices).
 * ბრაუზერიდან: `/api/balance/discounts`
 */
export async function GET() {
  try {
    const data = await fetchBalanceDiscounts();
    return NextResponse.json({
      ok: true as const,
      data,
      requestUrl: BALANCE_DISCOUNTS_URL,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { ok: false as const, error: message, requestUrl: BALANCE_DISCOUNTS_URL },
      { status: 502 }
    );
  }
}
