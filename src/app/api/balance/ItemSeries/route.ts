import {
  BALANCE_PUBLICATION_ID,
  buildBalanceItemsSeriesUrl,
  fetchBalanceExchangeStocks,
  fetchBalanceItemsSeriesForItemDetailed,
  fetchBalanceStocks,
  getBalanceItemsSeriesCandidateUrls,
} from '@/lib/api/balanceClient';
import {
  balanceSeriesUuidKey,
  exchangeStockRowNomenclatureItemUid,
  exchangeStockRowSeriesUid,
  getBalanceItems,
  nomenclatureUidForItemsSeriesFromBalanceItems,
  normalizeBalanceItemsSeriesApiRows,
} from '@/lib/api/balanceSync';
import { NextRequest, NextResponse } from 'next/server';

/** Balance ნომენკლატურის / Item ref — GUID (არა ქართული ტექსტი, არა „ნომენკლატურის_UUID“ პლეისჰოლდერი) */
const BALANCE_GUID_UID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function logItemsSeriesJson(label: string, url: string, data: unknown) {
  try {
    const raw = JSON.stringify(data, null, 2);
    const max = 48_000;
    console.log(
      `[Balance ItemsSeries] ${label}`,
      url,
      '\nJSON:\n',
      raw.length > max ? `${raw.slice(0, max)}… (${raw.length} chars)` : raw
    );
  } catch {
    console.log(`[Balance ItemsSeries] ${label}`, url, data);
  }
}

function optionalStockSeriesGuid(sp: URLSearchParams): string | undefined {
  const raw =
    sp.get('Series')?.trim() ||
    sp.get('series')?.trim() ||
    sp.get('stockSeries')?.trim() ||
    sp.get('seriesUuid')?.trim() ||
    '';
  return raw || undefined;
}

/** `seriesUuid` მარტო → Exchange/Stocks-დან იგივე ხაზის `Item` */
async function resolveItemUidFromExchangeStockSeries(
  seriesUuid: string
): Promise<string | null> {
  const target = balanceSeriesUuidKey(seriesUuid);
  if (!target) return null;
  let exchangeRaw: unknown;
  try {
    exchangeRaw = await fetchBalanceExchangeStocks({ docTemplate: true });
  } catch {
    exchangeRaw = await fetchBalanceExchangeStocks({ Total: false });
  }
  const rows = getBalanceItems(exchangeRaw);
  for (const row of rows) {
    const s = exchangeStockRowSeriesUid(row);
    if (s && balanceSeriesUuidKey(s) === target) {
      const item = exchangeStockRowNomenclatureItemUid(row);
      if (item) return item;
    }
  }
  return null;
}

/** ItemsSeries cloud: პარამეტრი `Item` = Exchange/Items კატალოგის Item (leaf `uid` ველის მნიშვნელობა). */
async function canonicalNomenclatureUidForItemsSeries(
  itemUid: string
): Promise<string> {
  try {
    const itemsRaw = await fetchBalanceStocks();
    return nomenclatureUidForItemsSeriesFromBalanceItems(
      itemUid,
      getBalanceItems(itemsRaw)
    );
  } catch {
    return itemUid.trim();
  }
}

/** სრული cloud URL JSON-ში — მხოლოდ ამით (არა ყოველთვის development-ში). */
const ITEM_SERIES_DEBUG_URLS =
  process.env.BALANCE_DEBUG_ITEMS_SERIES === '1';

/** ერთადერთი proxy path: `/api/balance/ItemSeries` (არა `item-series`). */
export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  /** canonical: `item=` → `Item=` */
  const legacyItemParam = sp.get('item')?.trim();
  const canonicalItemParam = sp.get('Item')?.trim();
  if (legacyItemParam !== undefined && legacyItemParam !== '' && !canonicalItemParam) {
    const url = request.nextUrl.clone();
    url.searchParams.delete('item');
    url.searchParams.set('Item', legacyItemParam);
    return NextResponse.redirect(url, 307);
  }

  const uid =
    sp.get('Item')?.trim() ||
    sp.get('item')?.trim() ||
    sp.get('nomenclatureItemUid')?.trim() ||
    undefined;
  const stockSeriesUid = optionalStockSeriesGuid(sp);
  const starting = sp.get('StartingPeriod') ?? '';
  const ending = sp.get('EndingPeriod') ?? '';

  if (stockSeriesUid && !BALANCE_GUID_UID_RE.test(stockSeriesUid)) {
    return NextResponse.json(
      {
        ok: false as const,
        error: 'საწყობის Series GUID არასწორია (seriesUuid / Series / stockSeries).',
      },
      { status: 400 }
    );
  }

  if (uid && !BALANCE_GUID_UID_RE.test(uid)) {
    return NextResponse.json(
      {
        ok: false as const,
        error:
          'Item-ის GUID არასწორია (`Item` პარამეტრი). ან გამოიყენე მხოლოდ `seriesUuid` — სერვერი იპოვის Item-ს Exchange/Stocks-იდან.',
      },
      { status: 400 }
    );
  }

  if (!uid && !stockSeriesUid) {
    return NextResponse.json(
      {
        ok: false as const,
        error:
          'სავალდებულია პარამეტრი `Item` (ნომენკლატურის Item, GUID) **ან** `seriesUuid` (საწყობის ხაზის Series — Item ავტომატურად).',
        example:
          'curl -sS "http://localhost:3000/api/balance/ItemSeries?seriesUuid=1196cf5d-1b18-11f1-b18c-005056b136db"',
        exampleItem:
          'curl -sS "http://localhost:3000/api/balance/ItemSeries?Item=3a160f3c-31f0-11f1-b18f-005056b136db"',
      },
      { status: 400 }
    );
  }

  let itemUidForBalance: string;
  if (uid) {
    itemUidForBalance = uid;
  } else {
    const r = await resolveItemUidFromExchangeStockSeries(stockSeriesUid!);
    if (!r) {
      return NextResponse.json(
        {
          ok: false as const,
          error:
            'ამ `seriesUuid`-ით ხაზი არ მოიძებნა Exchange/Stocks-ში — ვერ გამოვთვალე ნომენკლატურის Item.',
          balanceQueryUid: stockSeriesUid,
          fix: 'გადაამოწმე seriesUuid ან გამოიყენე ?Item=<Item_GUID>',
        },
        { status: 404 }
      );
    }
    itemUidForBalance = r;
  }

  itemUidForBalance = await canonicalNomenclatureUidForItemsSeries(
    itemUidForBalance
  );

  const requestUrl = buildBalanceItemsSeriesUrl(itemUidForBalance, {
    startingPeriod: starting,
    endingPeriod: ending,
  });

  try {
    const { data, resolvedUrl } = await fetchBalanceItemsSeriesForItemDetailed(
      itemUidForBalance,
      {
        startingPeriod: starting,
        endingPeriod: ending,
      }
    );
    const logItemsSeries =
      process.env.BALANCE_LOG_ITEMS_SERIES === '1' ||
      process.env.NODE_ENV === 'development';
    if (logItemsSeries) {
      logItemsSeriesJson(`OK item=${itemUidForBalance}`, resolvedUrl, data);
    }

    const itemsSeries = normalizeBalanceItemsSeriesApiRows(data);
    const lineCount = itemsSeries.length;
    const empty = lineCount === 0;

    return NextResponse.json({
      ok: true as const,
      data,
      itemsSeries,
      lineCount,
      empty,
      ...(empty
        ? {
            emptyNote:
              'Balance-მა სერიების ხაზები არ დააბრუნა — ნომენკლატურას შეიძლება სერია საერთოდ არ ჰქონდეს, ან სხვა Item GUID სჭირდებოდეს.',
          }
        : {}),
      balanceQueryUid: itemUidForBalance,
      nomenclatureItemUid: itemUidForBalance,
      ...(ITEM_SERIES_DEBUG_URLS ? { requestUrl: resolvedUrl } : {}),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    const looks404 = /404|Not Found/i.test(message);
    if (
      process.env.BALANCE_LOG_ITEMS_SERIES === '1' ||
      process.env.NODE_ENV === 'development'
    ) {
      console.error('[Balance ItemsSeries] შეცდომა', requestUrl, message);
    }

    const hintBase =
      'Balance ItemsSeries: პარამეტრი `Item` = ნომენკლატურის Item ref. პასუხის თითო ჩანაწერს აქვს თავისი `uid` — ეს ემთხვევა იმავე ხაზის `Series`-ს (სერიული № / ვადა იქიდან).';

    return NextResponse.json(
      {
        ok: false as const,
        error: message,
        balanceQueryUid: itemUidForBalance,
        nomenclatureItemUid: itemUidForBalance,
        balancePublicationId: BALANCE_PUBLICATION_ID,
        hint: hintBase,
        ...(looks404
          ? {
              hintPublication:
                `პუბლიკაცია Balance/${BALANCE_PUBLICATION_ID}. 404 ჩვეულებრივ არასწორი Item ref, Basic Auth, ან პუბლიკაციის ID.`,
              fix: 'curl -sS "http://localhost:3000/api/balance/ItemSeries?seriesUuid=<Stocks_Series>" ან ?Item=<Item_GUID>',
            }
          : {}),
        ...(ITEM_SERIES_DEBUG_URLS
          ? {
              requestUrl,
              triedUrls: getBalanceItemsSeriesCandidateUrls(itemUidForBalance, {
                startingPeriod: starting,
                endingPeriod: ending,
              }),
            }
          : {}),
      },
      { status: 502 }
    );
  }
}
