import {
  buildBalanceItemsSeriesUrl,
  fetchBalanceItemsSeriesForItem,
  getBalanceItemsSeriesCandidateUrls,
} from '@/lib/api/balanceClient';
import { NextRequest, NextResponse } from 'next/server';

/** Balance ნომენკლატურის / Item ref — GUID (არა ქართული ტექსტი, არა „ნომენკლატურის_UUID“ პლეისჰოლდერი) */
const BALANCE_GUID_UID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(request: NextRequest) {
  const uid = request.nextUrl.searchParams.get('uid')?.trim();
  if (!uid) {
    return NextResponse.json(
      { ok: false as const, error: 'uid სავალდებულოა' },
      { status: 400 }
    );
  }
  if (!BALANCE_GUID_UID_RE.test(uid)) {
    return NextResponse.json(
      {
        ok: false as const,
        error:
          'uid უნდა იყოს რეალური GUID (მაგ. 4a686c46-ce32-11ed-80e0-000c29409daa). ჩასვი ზუსტად ის UUID, რაც Balance Items-შია — არა ქართული აღწერა და არა პლეისჰოლდერის ტექსტი.',
        example:
          "curl -sS 'http://localhost:3000/api/balance/items-series?uid=4a686c46-ce32-11ed-80e0-000c29409daa&StartingPeriod=&EndingPeriod='",
      },
      { status: 400 }
    );
  }
  const starting = request.nextUrl.searchParams.get('StartingPeriod') ?? '';
  const ending = request.nextUrl.searchParams.get('EndingPeriod') ?? '';
  const requestUrl = buildBalanceItemsSeriesUrl(uid, {
    startingPeriod: starting,
    endingPeriod: ending,
  });
  try {
    const data = await fetchBalanceItemsSeriesForItem(uid, {
      startingPeriod: starting,
      endingPeriod: ending,
    });
    const logItemsSeries =
      process.env.BALANCE_LOG_ITEMS_SERIES === '1' ||
      process.env.NODE_ENV === 'development';
    if (logItemsSeries) {
      try {
        const raw = JSON.stringify(data, null, 2);
        const max = 32_000;
        console.log(
          requestUrl,
          raw.length > max ? `${raw.slice(0, max)}… (${raw.length} სიმბოლო)` : raw
        );
      } catch {
        console.log('[Balance ItemsSeries]', requestUrl, data);
      }
    }
    return NextResponse.json({
      ok: true as const,
      data,
      requestUrl,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    if (
      process.env.BALANCE_LOG_ITEMS_SERIES === '1' ||
      process.env.NODE_ENV === 'development'
    ) {
      console.error('[Balance ItemsSeries] შეცდომა', requestUrl, message);
    }
    return NextResponse.json(
      {
        ok: false as const,
        error: message,
        requestUrl,
        triedUrls: getBalanceItemsSeriesCandidateUrls(uid, {
          startingPeriod: starting,
          endingPeriod: ending,
        }),
        hint:
          'თუ GUID სწორია მაგრამ 404: `uid` უნდა იყოს ნომენკლატურის Item ref (Balance Items — იგივე რაც სინქში SKU-სთან), არა სერიის UUID (Stocks-ის `seriesUuid`).',
      },
      { status: 502 }
    );
  }
}
