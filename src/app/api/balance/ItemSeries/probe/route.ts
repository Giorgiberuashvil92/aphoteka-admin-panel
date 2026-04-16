import {
  BALANCE_ITEMS_SERIES_ITEM_QUERY_PARAM,
  BALANCE_PUBLICATION_ID,
  balanceItemsSeriesCloudBaseUrl,
  balanceProbeGet,
} from '@/lib/api/balanceClient';
import { NextRequest, NextResponse } from 'next/server';

const BALANCE_GUID_UID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * დებაგი: ItemsSeries ნედლი HTTP პასუხი (სტატუსი + body ტექსტი).
 *
 * curl "http://localhost:3000/api/balance/ItemSeries/probe?Item=4a686c46-ce32-11ed-80e0-000c29409daa"
 */
export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const itemGuid =
    sp.get('Item')?.trim() ||
    sp.get('item')?.trim();
  if (!itemGuid || !BALANCE_GUID_UID_RE.test(itemGuid)) {
    return NextResponse.json(
      {
        ok: false as const,
        error: 'Item სავალდებულოა: პარამეტრი `Item` (GUID; ძველი alias: `item`)',
        example: `GET /api/balance/ItemSeries/probe?Item=4a686c46-ce32-11ed-80e0-000c29409daa`,
      },
      { status: 400 }
    );
  }

  const skipAuth = request.nextUrl.searchParams.get('skipAuth') === '1';
  const starting = request.nextUrl.searchParams.get('StartingPeriod')?.trim() ?? '';
  const ending = request.nextUrl.searchParams.get('EndingPeriod')?.trim() ?? '';

  const base = balanceItemsSeriesCloudBaseUrl();
  const u = new URL(base);
  u.searchParams.set(BALANCE_ITEMS_SERIES_ITEM_QUERY_PARAM, itemGuid);
  if (starting) u.searchParams.set('StartingPeriod', starting);
  if (ending) u.searchParams.set('EndingPeriod', ending);
  const url = u.toString();

  const probe = await balanceProbeGet(url, { skipAuth });

  return NextResponse.json({
    ok: true as const,
    balancePublicationId: BALANCE_PUBLICATION_ID,
    mode: 'a' as const,
    note:
      'პირდაპირ browser fetch cloud.balance.ge-ზე ჩვეულებრივ CORS-ით ჩაიჭრება. აქ ნაჩვენებია რას აბრუნებს Balance (httpStatus + bodyText). GET-ზე body არ უნდა იყოს — სნიპეტში body საერთოდ არ გამოიყენო.',
    ...probe,
  });
}
