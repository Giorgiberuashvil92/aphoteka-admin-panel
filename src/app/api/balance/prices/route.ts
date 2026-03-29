import { fetchBalancePrices, fetchBalancePricesByUuid } from '@/lib/api/balanceClient';
import { getBalancePricesRows } from '@/lib/api/balanceSync';
import { NextRequest, NextResponse } from 'next/server';

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

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      uuids?: unknown;
    };
    const raw = body.uuids;
    const uuids = Array.isArray(raw)
      ? raw.filter((x): x is string => typeof x === 'string' && x.trim() !== '')
      : [];
    if (uuids.length === 0) {
      return NextResponse.json(
        { ok: false as const, error: 'uuids მასივი სავალდებულოა' },
        { status: 400 }
      );
    }
    const settled = await Promise.allSettled(
      uuids.map((id) => fetchBalancePricesByUuid(id))
    );
    const rawChunks = settled
      .filter((r): r is PromiseFulfilledResult<unknown> => r.status === 'fulfilled')
      .map((r) => r.value);
    const fetchErrors = settled
      .map((r, i) =>
        r.status === 'rejected'
          ? {
              uuid: uuids[i],
              error:
                r.reason instanceof Error ? r.reason.message : String(r.reason),
            }
          : null
      )
      .filter((x): x is NonNullable<typeof x> => x !== null);
    const rows = rawChunks.flatMap((chunk) => getBalancePricesRows(chunk));
    return NextResponse.json({
      ok: true as const,
      data: rows,
      rawChunks,
      ...(fetchErrors.length ? { fetchErrors } : {}),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { ok: false as const, error: message },
      { status: 502 }
    );
  }
}
