import { fetchBalancePrices } from '@/lib/api/balanceClient';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const data = await fetchBalancePrices();
    return NextResponse.json({ ok: true as const, data });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { ok: false as const, error: message },
      { status: 502 }
    );
  }
}
