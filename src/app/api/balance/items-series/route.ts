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

/** ItemsSeries `uid` = Exchange/Items კატალოგის leaf `uid` (იგივე რაც Balance პროდუქტზეა) */
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

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  /** სტანდარტი: `uid`. `nomenclatureItemUid` — მხოლოდ ძველი/ალტერნატიული სახელი (იგივე მნიშვნელობა). */
  const uid =
    sp.get('uid')?.trim() ||
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
          'Item `uid` GUID არასწორია. ან გამოიყენე მხოლოდ `seriesUuid` — სერვერი იპოვის Item-ს Exchange/Stocks-იდან.',
      },
      { status: 400 }
    );
  }

  if (!uid && !stockSeriesUid) {
    return NextResponse.json(
      {
        ok: false as const,
        error:
          'სავალდებულია `uid` (ნომენკლატურის Item) **ან** `seriesUuid` (საწყობის ხაზის Series — Item ავტომატურად).',
        example:
          'curl -sS "http://localhost:3000/api/balance/items-series?seriesUuid=1196cf5d-1b18-11f1-b18c-005056b136db"',
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
          fix: 'გადაამოწმე seriesUuid ან გამოიყენე ?uid=<Item_UUID>',
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

    return NextResponse.json({
      ok: true as const,
      data,
      requestUrl: resolvedUrl,
      balanceQueryUid: itemUidForBalance,
      nomenclatureItemUid: itemUidForBalance,
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
      'Balance ItemsSeries `?uid=` = მხოლოდ ნომენკლატურის ref (Exchange/Stocks ხაზის `Item`). პასუხის თითო ჩანაწერს აქვს თავისი `uid` — ეს ემთხვევა იმავე ხაზის `Series`-ს (სერიული № / ვადა იქიდან).';

    return NextResponse.json(
      {
        ok: false as const,
        error: message,
        requestUrl,
        balanceQueryUid: itemUidForBalance,
        nomenclatureItemUid: itemUidForBalance,
        balancePublicationId: BALANCE_PUBLICATION_ID,
        triedUrls: getBalanceItemsSeriesCandidateUrls(itemUidForBalance, {
          startingPeriod: starting,
          endingPeriod: ending,
        }),
        hint: hintBase,
        ...(looks404
          ? {
              hintPublication:
                `URL-ში პუბლიკაცია: Balance/${BALANCE_PUBLICATION_ID} (პროექტისთვის ნაგულისხმევი 7596). 404 ჩვეულებრივ არასწორი \`uid\` (უნდა იყოს Item, არა Series), Basic Auth, ან ცარიელი სერიების კატალოგია.`,
              fix: 'curl -sS "http://localhost:3000/api/balance/items-series?seriesUuid=<Stocks_Series>"',
            }
          : {}),
      },
      { status: 502 }
    );
  }
}
