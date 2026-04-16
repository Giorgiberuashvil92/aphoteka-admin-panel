import {
  balanceGetJson,
  balanceItemsSeriesCloudBaseUrl,
  buildBalanceItemsSeriesUrlForBase,
} from '@/lib/api/balanceClient';
import { isAxiosError } from 'axios';
import { NextRequest, NextResponse } from 'next/server';

function balanceErrorBodySnippet(e: unknown): string | undefined {
  if (!isAxiosError(e) || e.response?.data == null) return undefined;
  const d = e.response.data;
  if (typeof d === 'string') return d.length > 2_000 ? `${d.slice(0, 2_000)}…` : d;
  try {
    const s = JSON.stringify(d);
    return s.length > 2_000 ? `${s.slice(0, 2_000)}…` : s;
  } catch {
    return undefined;
  }
}

/**
 * ItemsSeries — იგივე ბაზის GET სერვერზე Basic Auth-ით (`balanceGetJson`).
 *
 * Query:
 * - `Item` (ან `item`) — ნომენკლატურის GUID; **ხშირად სავალდებულოა** — ცარიელ GET-ზე Balance აბრუნებს **403**-ს.
 * - `StartingPeriod`, `EndingPeriod` — ოფციონალური.
 */
export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const item =
    sp.get('Item')?.trim() ||
    sp.get('item')?.trim() ||
    undefined;
  const starting = sp.get('StartingPeriod')?.trim();
  const ending = sp.get('EndingPeriod')?.trim();

  const url = item
    ? buildBalanceItemsSeriesUrlForBase(
        balanceItemsSeriesCloudBaseUrl(),
        item,
        {
          startingPeriod: starting || undefined,
          endingPeriod: ending || undefined,
        }
      )
    : (() => {
        const u = new URL(balanceItemsSeriesCloudBaseUrl());
        if (starting) u.searchParams.set('StartingPeriod', starting);
        if (ending) u.searchParams.set('EndingPeriod', ending);
        return u.toString();
      })();

  try {
    const data = await balanceGetJson(url);
    return NextResponse.json({
      ok: true as const,
      data,
      requestUrl: url,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    const httpStatus = isAxiosError(e) ? e.response?.status : undefined;
    const bodySnippet = balanceErrorBodySnippet(e);
    const hint403NoItem =
      httpStatus === 403 && !item
        ? 'Balance ხშირად აბრუნებს 403-ს ItemsSeries-ზე `Item` query-ის გარეშე. სცადე იგივე endpoint `?Item=<ნომენკლატურის_GUID>`-ით ან გამოიყენე `GET /api/balance/ItemSeries?Item=...`.'
        : httpStatus === 403 && item
          ? '403 მიუხედავად `Item`-ისა — შეამოწმე პაროლი, პუბლიკაციის ID და Balance-ში ამ რესურზე უფლება.'
          : undefined;

    return NextResponse.json(
      {
        ok: false as const,
        error: hint403NoItem ? `${message}\n\n${hint403NoItem}` : message,
        requestUrl: url,
        ...(httpStatus != null ? { httpStatus } : {}),
        ...(bodySnippet ? { balanceResponseBody: bodySnippet } : {}),
        ...(hint403NoItem ? { hint: hint403NoItem } : {}),
      },
      { status: 502 }
    );
  }
}
