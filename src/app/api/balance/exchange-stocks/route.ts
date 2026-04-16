import {
  buildBalanceExchangeStocksUrl,
  fetchBalanceExchangeStocks,
  type BalanceExchangeStocksQuery,
} from '@/lib/api/balanceClient';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Balance Exchange/Stocks — რაოდენობები (Item, Warehouse, Quantity, Reserve, …)
 * Basic Auth: `balanceClient` (კოდში გაწერილი user/password)
 *
 * `docTemplate=1` → `?uid=&StartingPeriod=&EndingPeriod=&Source=&Total=false` (დოკუმენტაცია)
 * უსასათაუროდ: სტანდარტული uid + Total=false
 *
 * curl "http://localhost:3000/api/balance/exchange-stocks?docTemplate=1"
 */
export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const query: BalanceExchangeStocksQuery = {};

  if (sp.get('docTemplate') === '1') {
    query.docTemplate = true;
    const uid = sp.get('uid');
    if (uid !== null) query.uid = uid;
    const starting = sp.get('StartingPeriod');
    if (starting !== null) query.StartingPeriod = starting;
    const ending = sp.get('EndingPeriod');
    if (ending !== null) query.EndingPeriod = ending;
    const source = sp.get('Source');
    if (source !== null) query.Source = source;
    const totalRaw = sp.get('Total');
    if (totalRaw !== null) {
      query.Total = totalRaw === 'true' || totalRaw === '1';
    }
  } else {
    const uid = sp.get('uid');
    if (uid !== null && uid !== '') query.uid = uid;

    const starting = sp.get('StartingPeriod');
    if (starting) query.StartingPeriod = starting;

    const ending = sp.get('EndingPeriod');
    if (ending) query.EndingPeriod = ending;

    const source = sp.get('Source');
    if (source) query.Source = source;

    const totalRaw = sp.get('Total');
    if (totalRaw !== null) {
      query.Total = totalRaw === 'true' || totalRaw === '1';
    }
  }

  try {
    const data = await fetchBalanceExchangeStocks(query);
    return NextResponse.json({
      ok: true as const,
      data,
      requestUrl: buildBalanceExchangeStocksUrl(query),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { ok: false as const, error: message },
      { status: 502 }
    );
  }
}
