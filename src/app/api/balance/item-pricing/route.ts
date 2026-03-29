import { fetchBalanceItemPricing } from '@/lib/api/balancePricing';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const data = await fetchBalanceItemPricing();
    return NextResponse.json({ ok: true as const, data });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { ok: false as const, error: message },
      { status: 502 }
    );
  }
}
