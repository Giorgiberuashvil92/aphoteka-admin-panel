import {
  BALANCE_PUBLICATION_ID,
  balanceExchangeUrl,
  balanceProbeGet,
} from '@/lib/api/balanceClient';
import { NextRequest, NextResponse } from 'next/server';

const BALANCE_GUID_UID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * დებაგი: ItemsSeries ნედლი HTTP პასუხი (სტატუსი + body ტექსტი).
 * ბრაუზერიდან პირდაპირ cloud.balance.ge → CORS; ეს route სერვერზე იძახის იგივე URL-ს.
 *
 * - ნაგულისხმევად: Basic Auth (`BALANCE_USER_NAME` / `BALANCE_USER_PASSWORD`)
 * - `skipAuth=1` — უსათაუროდ (როგორც ცარიელი Authorization სნიპეტში); 401/403 სანახავად
 *
 * curl "http://localhost:3000/api/balance/items-series/probe?uid=4a686c46-ce32-11ed-80e0-000c29409daa"
 * curl "http://localhost:3000/api/balance/items-series/probe?uid=...&skipAuth=1"
 */
export async function GET(request: NextRequest) {
  const uid = request.nextUrl.searchParams.get('uid')?.trim();
  if (!uid || !BALANCE_GUID_UID_RE.test(uid)) {
    return NextResponse.json(
      {
        ok: false as const,
        error: 'uid სავალდებულოა (GUID)',
        example: `GET /api/balance/items-series/probe?uid=4a686c46-ce32-11ed-80e0-000c29409daa`,
      },
      { status: 400 }
    );
  }

  const mode =
    request.nextUrl.searchParams.get('mode') === 'o' ? ('o' as const) : ('a' as const);
  const skipAuth = request.nextUrl.searchParams.get('skipAuth') === '1';
  const starting = request.nextUrl.searchParams.get('StartingPeriod')?.trim() ?? '';
  const ending = request.nextUrl.searchParams.get('EndingPeriod')?.trim() ?? '';

  const base = balanceExchangeUrl(mode, 'ItemsSeries');
  const u = new URL(base);
  u.searchParams.set('uid', uid);
  if (starting) u.searchParams.set('StartingPeriod', starting);
  if (ending) u.searchParams.set('EndingPeriod', ending);
  const url = u.toString();

  const probe = await balanceProbeGet(url, { skipAuth });

  return NextResponse.json({
    ok: true as const,
    balancePublicationId: BALANCE_PUBLICATION_ID,
    mode,
    note:
      'პირდაპირ browser fetch cloud.balance.ge-ზე ჩვეულებრივ CORS-ით ჩაიჭრება. აქ ნაჩვენებია რას აბრუნებს Balance (httpStatus + bodyText). GET-ზე body არ უნდა იყოს — სნიპეტში body საერთოდ არ გამოიყენო.',
    ...probe,
  });
}
