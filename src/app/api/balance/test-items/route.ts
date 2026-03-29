import {
  buildBalanceItemsTestUrl,
  fetchBalanceItemsTest,
} from '@/lib/api/balanceClient';
import { NextRequest, NextResponse } from 'next/server';

/**
 * სატესტო: `sm/a/Balance/7596/hs/Exchange/Items` — ნაგულისხმევად **უშველებლად** `uid`.
 * `uid` მხოლოდ თუ გადასცემ: `?uid=...`
 *
 * curl "http://localhost:3000/api/balance/test-items"
 * curl "http://localhost:3000/api/balance/test-items?uid=1370c388-1954-11f1-b18c-005056b136db"
 */
export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get('uid')?.trim();
  const uid = raw && raw.length > 0 ? raw : undefined;
  const url = buildBalanceItemsTestUrl(uid);
  try {
    const data = await fetchBalanceItemsTest(uid);
    return NextResponse.json({
      ok: true as const,
      url,
      ...(uid ? { uid } : {}),
      data,
    });
  } catch (e: unknown) {
    const err = e as {
      message?: string;
      response?: { status?: number; statusText?: string; data?: unknown };
    };
    const status = err.response?.status ?? 502;
    return NextResponse.json(
      {
        ok: false as const,
        url,
        ...(uid ? { uid } : {}),
        error: err.message ?? String(e),
        balanceStatus: err.response?.status,
        balanceStatusText: err.response?.statusText,
        balanceBody: err.response?.data,
      },
      { status }
    );
  }
}
