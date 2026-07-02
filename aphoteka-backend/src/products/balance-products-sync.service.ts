import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BalanceExchangeService } from '../balance/balance-exchange.service';
import {
  aggregateExchangeStocksByItemUid,
  buildBalanceWarehouseNameByUuid,
  buildDiscountMapsFromBalanceApi,
  buildPriceByUuid,
  buildSkuToBalanceItemUid,
  buildTaxationByUuid,
  earliestExpiryIsoFromSeriesLines,
  formatSerialSummaryForBalanceSeries,
  getBalanceItems,
  getBalancePricesRows,
  getItemUuid,
  groupItemsSeriesByNomenclatureItemUid,
  isBalanceGroupRow,
  mapBalanceItemToProduct,
  mergeBalanceItemSeriesFromStocks,
  normalizeBalanceItemSeriesRows,
  stockLinesHaveSeriesUuid,
  type AggregatedBalanceStockForItem,
  type BalanceDiscountForItem,
  type BalanceItemSeriesLine,
  type BalanceSyncProductPatch,
} from '../balance/balance-sync.util';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product, ProductDocument } from './schemas/product.schema';

export type BalanceProductsSyncResult = {
  ok: boolean;
  created: number;
  updated: number;
  total: number;
  error?: string;
  errors?: string[];
  itemsSeriesBulkUsed?: boolean;
  itemsSeriesBulkLineCount?: number;
  skipped?: boolean;
  reason?: string;
};

/** Balance → MongoDB — იგივე ლოგიკა რაც admin `POST /api/balance/sync-stocks` */
@Injectable()
export class BalanceProductsSyncService {
  private readonly logger = new Logger(BalanceProductsSyncService.name);
  private syncInFlight = false;

  constructor(
    @InjectModel(Product.name)
    private productModel: Model<ProductDocument>,
    private readonly balanceExchange: BalanceExchangeService,
    private readonly config: ConfigService,
  ) {}

  isSyncEnabled(): boolean {
    const flag = this.config.get<string>('BALANCE_SYNC_ENABLED')?.trim();
    if (flag === '0' || flag?.toLowerCase() === 'false') return false;
    return true;
  }

  async syncFromBalance(): Promise<BalanceProductsSyncResult> {
    if (this.syncInFlight) {
      return {
        ok: true,
        created: 0,
        updated: 0,
        total: 0,
        skipped: true,
        reason: 'sync_already_in_progress',
      };
    }

    this.syncInFlight = true;
    const started = Date.now();

    try {
      const balanceData =
        await this.balanceExchange.fetchBalanceStocksForSync();
      if (balanceData == null) {
        return {
          ok: false,
          created: 0,
          updated: 0,
          total: 0,
          error: 'Balance Stocks/Items ვერ ჩაიტვირთა',
        };
      }

      const items = getBalanceItems(balanceData);
      const leafUuids = [
        ...new Set(
          items
            .filter((row) => !isBalanceGroupRow(row))
            .map((row) => getItemUuid(row))
            .filter((x): x is string => Boolean(x)),
        ),
      ];

      const perItemPrices = await Promise.allSettled(
        leafUuids.map((id) =>
          this.balanceExchange.fetchBalancePricesByUuidForSync(id),
        ),
      );
      let pricesRows = perItemPrices
        .filter(
          (r): r is PromiseFulfilledResult<unknown | null> =>
            r.status === 'fulfilled' && r.value != null,
        )
        .flatMap((r) => getBalancePricesRows(r.value));

      if (pricesRows.length === 0) {
        const pricesData =
          await this.balanceExchange.fetchBalancePricesForSync();
        if (pricesData != null) {
          pricesRows = getBalancePricesRows(pricesData);
        }
      }

      const priceByUuid = buildPriceByUuid(pricesRows);
      const taxationByUuid = buildTaxationByUuid(pricesRows);
      try {
        const itemPricingRaw =
          await this.balanceExchange.fetchBalanceItemPricingForSync();
        if (itemPricingRaw != null) {
          for (const [uid, tax] of buildTaxationByUuid(
            getBalanceItems(itemPricingRaw),
          )) {
            taxationByUuid.set(uid, tax);
          }
        }
      } catch {
        /* optional */
      }

      const leafItems = items.filter((row) => !isBalanceGroupRow(row));
      const products = leafItems.map((item, i) =>
        mapBalanceItemToProduct(item, i, items, priceByUuid, taxationByUuid),
      );
      const withSku = products.filter((p) => p.sku);

      let stockByItemUid = new Map<string, AggregatedBalanceStockForItem>();
      try {
        const whData =
          await this.balanceExchange.fetchBalanceWarehousesForSync();
        const whNames = whData
          ? buildBalanceWarehouseNameByUuid(whData)
          : new Map<string, string>();
        let exchangeRaw =
          await this.balanceExchange.fetchBalanceExchangeStocksForSync({
            docTemplate: true,
          });
        if (exchangeRaw == null) {
          exchangeRaw =
            await this.balanceExchange.fetchBalanceExchangeStocksForSync({
              total: false,
            });
        }
        if (exchangeRaw != null) {
          stockByItemUid = aggregateExchangeStocksByItemUid(
            getBalanceItems(exchangeRaw),
            whNames,
          );
        }
      } catch {
        /* optional */
      }

      const skuToBalanceItemUid = buildSkuToBalanceItemUid(leafItems);

      let discountByItemUid = new Map<string, BalanceDiscountForItem>();
      let discountUnconditional: BalanceDiscountForItem | undefined;
      try {
        const discountsRaw =
          await this.balanceExchange.fetchBalanceDiscountsForSync();
        if (discountsRaw != null) {
          const maps = buildDiscountMapsFromBalanceApi(discountsRaw);
          discountByItemUid = maps.byItemUid;
          discountUnconditional = maps.unconditional;
        }
      } catch {
        /* optional */
      }

      const seriesByItemUid = new Map<string, BalanceItemSeriesLine[]>();
      const seriesFetchOk = new Set<string>();
      let bulkGrouped = new Map<string, BalanceItemSeriesLine[]>();
      try {
        const fullList =
          await this.balanceExchange.fetchBalanceItemsSeriesFullListForSync();
        if (fullList != null) {
          bulkGrouped = groupItemsSeriesByNomenclatureItemUid(fullList);
        }
      } catch {
        /* optional */
      }

      for (const uid of leafUuids) {
        const fromBulk = bulkGrouped.get(uid.trim().toLowerCase());
        if (fromBulk?.length) {
          seriesByItemUid.set(uid, fromBulk);
          seriesFetchOk.add(uid);
        }
      }

      const missingSeriesUids = leafUuids.filter((uid) => !seriesFetchOk.has(uid));
      if (missingSeriesUids.length > 0) {
        const seriesSettled = await Promise.allSettled(
          missingSeriesUids.map((uid) =>
            this.balanceExchange.fetchBalanceItemsSeriesForItemForSync(uid),
          ),
        );
        missingSeriesUids.forEach((uid, i) => {
          const r = seriesSettled[i];
          if (r.status === 'fulfilled' && r.value != null) {
            seriesFetchOk.add(uid);
            seriesByItemUid.set(uid, normalizeBalanceItemSeriesRows(r.value));
          }
        });
      }

      if (withSku.length === 0) {
        return { ok: true, created: 0, updated: 0, total: 0 };
      }

      const existingList = await this.productModel
        .find({}, { _id: 1, sku: 1 })
        .lean()
        .exec();
      const bySku = new Map<string, string>();
      for (const p of existingList) {
        const sku = String(p.sku ?? '').trim();
        if (sku) bySku.set(sku, String(p._id));
      }

      let created = 0;
      let updated = 0;
      const errors: string[] = [];

      for (const product of withSku) {
        const sku = String(product.sku ?? '').trim();
        if (!sku) continue;

        const id = bySku.get(sku);
        const itemUid = skuToBalanceItemUid.get(sku) ?? '';
        const agg = itemUid ? stockByItemUid.get(itemUid) : undefined;
        const stockLines = agg?.lines ?? [];
        const apiSeries =
          itemUid && seriesFetchOk.has(itemUid)
            ? (seriesByItemUid.get(itemUid) ?? [])
            : [];
        const shouldPatchSeries =
          Boolean(itemUid) &&
          (seriesFetchOk.has(itemUid) || stockLinesHaveSeriesUuid(stockLines));
        const mergedSeries = shouldPatchSeries
          ? mergeBalanceItemSeriesFromStocks(apiSeries, stockLines)
          : undefined;
        const disc =
          (itemUid
            ? discountByItemUid.get(itemUid.trim().toLowerCase())
            : undefined) ?? discountUnconditional;

        const payload = this.buildPayload(
          product,
          itemUid,
          disc,
          mergedSeries,
          agg,
        );

        try {
          if (id) {
            await this.productModel
              .findByIdAndUpdate(id, payload as UpdateProductDto)
              .exec();
            updated++;
          } else {
            const doc = await this.productModel.create(
              payload as unknown as CreateProductDto,
            );
            created++;
            bySku.set(sku, String(doc._id));
          }
        } catch (e: unknown) {
          errors.push(
            `${sku}: ${e instanceof Error ? e.message : String(e)}`,
          );
        }
      }

      let itemsSeriesBulkLineCount = 0;
      for (const lines of bulkGrouped.values()) {
        itemsSeriesBulkLineCount += lines.length;
      }

      this.logger.log(
        `[sync] ${Date.now() - started}ms — created=${created} updated=${updated} total=${withSku.length}`,
      );

      return {
        ok: true,
        created,
        updated,
        total: withSku.length,
        errors: errors.length ? errors : undefined,
        itemsSeriesBulkUsed: bulkGrouped.size > 0,
        itemsSeriesBulkLineCount:
          bulkGrouped.size > 0 ? itemsSeriesBulkLineCount : undefined,
      };
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      this.logger.error(`[sync] ${message}`);
      return {
        ok: false,
        created: 0,
        updated: 0,
        total: 0,
        error: message,
      };
    } finally {
      this.syncInFlight = false;
    }
  }

  private buildPayload(
    product: BalanceSyncProductPatch,
    itemUid: string,
    disc: BalanceDiscountForItem | undefined,
    mergedSeries: BalanceItemSeriesLine[] | undefined,
    agg: AggregatedBalanceStockForItem | undefined,
  ): BalanceSyncProductPatch {
    return {
      ...product,
      ...(itemUid ? { balanceNomenclatureItemUid: itemUid } : {}),
      ...(disc
        ? {
            ...(disc.balanceDiscountPercent != null
              ? { balanceDiscountPercent: disc.balanceDiscountPercent }
              : {}),
            ...(disc.balanceDiscountAmount != null
              ? { balanceDiscountAmount: disc.balanceDiscountAmount }
              : {}),
            ...(disc.balanceDiscountName
              ? { balanceDiscountName: disc.balanceDiscountName }
              : {}),
            ...(disc.balanceDiscountUid
              ? { balanceDiscountUid: disc.balanceDiscountUid }
              : {}),
          }
        : {}),
      ...(mergedSeries !== undefined
        ? {
            balanceItemSeries: mergedSeries,
            serialNumber:
              mergedSeries.length > 0
                ? (formatSerialSummaryForBalanceSeries(mergedSeries) ??
                  product.serialNumber)
                : product.serialNumber,
            expiryDate:
              mergedSeries.length > 0
                ? (earliestExpiryIsoFromSeriesLines(mergedSeries) ??
                  product.expiryDate)
                : product.expiryDate,
          }
        : {}),
      ...(agg
        ? {
            quantity: agg.totalQuantity,
            reservedQuantity: agg.totalReserve,
            balanceStockBreakdown: agg.lines,
            totalPrice:
              product.price != null
                ? Number(product.price) * agg.totalQuantity
                : product.totalPrice,
          }
        : {}),
    };
  }
}
