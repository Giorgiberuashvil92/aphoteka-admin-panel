"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";

type BalanceRawResponse = {
  ok?: boolean;
  data?: unknown;
  requestUrl?: string;
  error?: string;
  [key: string]: unknown;
};

type BalanceRequestDefinition = {
  key: string;
  title: string;
  description: string;
  proxyEndpoint: string;
};

type BalanceRequestState = {
  loading: boolean;
  error: string | null;
  payload: BalanceRawResponse | null;
  loadedAt: string | null;
};

const BALANCE_REQUESTS: BalanceRequestDefinition[] = [
  {
    key: "items",
    title: "Exchange/Items",
    description: "ნომენკლატურა / პროდუქტების raw ფიდი.",
    proxyEndpoint: "/api/balance/stocks",
  },
  {
    key: "prices",
    title: "Exchange/Prices",
    description: "ფასების raw ფიდი, სანამ SKU/uid-ზე მიებმება.",
    proxyEndpoint: "/api/balance/prices",
  },
  {
    key: "item-pricing",
    title: "Exchange/ItemPricing",
    description: "დამატებითი pricing/VAT raw მონაცემი.",
    proxyEndpoint: "/api/balance/item-pricing",
  },
  {
    key: "warehouses",
    title: "Exchange/Warehouses",
    description: "Balance საწყობების raw სია.",
    proxyEndpoint: "/api/balance/warehouses",
  },
  {
    key: "exchange-stocks",
    title: "Exchange/Stocks",
    description: "რაოდენობები საწყობების/სერიების მიხედვით, დაჯამებამდე.",
    proxyEndpoint: "/api/balance/exchange-stocks",
  },
  {
    key: "discounts",
    title: "Exchange/Discounts",
    description: "ფასდაკლების წესების raw ფიდი.",
    proxyEndpoint: "/api/balance/discounts",
  },
  {
    key: "items-series",
    title: "Exchange/ItemsSeries",
    description: "სერიები/ვადები raw ფორმით, merge-მდე.",
    proxyEndpoint: "/api/balance/items-series-bare",
  },
];

function initialRequestState(): Record<string, BalanceRequestState> {
  return Object.fromEntries(
    BALANCE_REQUESTS.map((request) => [
      request.key,
      {
        loading: true,
        error: null,
        payload: null,
        loadedAt: null,
      },
    ])
  );
}

function stringifyJson(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function rawRowCount(data: unknown): number | null {
  if (Array.isArray(data)) return data.length;
  if (!data || typeof data !== "object") return null;
  const obj = data as Record<string, unknown>;
  for (const key of [
    "Items",
    "value",
    "Value",
    "Source",
    "data",
    "Data",
    "Rows",
    "rows",
    "Records",
    "records",
  ]) {
    if (Array.isArray(obj[key])) return obj[key].length;
  }
  return null;
}

async function fetchRawBalanceRequest(
  request: BalanceRequestDefinition
): Promise<BalanceRawResponse> {
  const response = await fetch(request.proxyEndpoint, {
    cache: "no-store",
    headers: { Accept: "application/json" },
  });
  const json = (await response.json().catch(() => null)) as
    | BalanceRawResponse
    | null;

  if (!response.ok || !json?.ok) {
    throw new Error(
      json?.error ||
        `Request failed: HTTP ${response.status} ${response.statusText}`
    );
  }

  return json;
}

export default function BalanceRawRequestsPage() {
  const [states, setStates] = useState<Record<string, BalanceRequestState>>(
    () => initialRequestState()
  );

  const loadedCount = useMemo(
    () =>
      BALANCE_REQUESTS.filter((request) => {
        const state = states[request.key];
        return state && !state.loading && !state.error && state.payload;
      }).length,
    [states]
  );

  const fetchAll = useCallback(() => {
    for (const request of BALANCE_REQUESTS) {
      fetchRawBalanceRequest(request)
        .then((payload) => {
          setStates((prev) => ({
            ...prev,
            [request.key]: {
              loading: false,
              error: null,
              payload,
              loadedAt: new Date().toLocaleString("ka-GE"),
            },
          }));
        })
        .catch((err) => {
          setStates((prev) => ({
            ...prev,
            [request.key]: {
              loading: false,
              error:
                err instanceof Error
                  ? err.message
                  : "Balance request-ის ჩატვირთვა ვერ მოხერხდა",
              payload: null,
              loadedAt: new Date().toLocaleString("ka-GE"),
            },
          }));
        });
    }
  }, []);

  const refreshAll = useCallback(() => {
    setStates(initialRequestState());
    fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return (
    <div>
      <PageBreadCrumb pageTitle="Balance raw request-ები" />

      <div className="mb-6 flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
            Balance raw request-ები
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            ყველა Balance request ცალ-ცალკე, mapping/grouping/შეჯამების გარეშე.
          </p>
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-500">
            ჩატვირთულია {loadedCount}/{BALANCE_REQUESTS.length}
          </p>
        </div>
        <button
          type="button"
          onClick={refreshAll}
          className="inline-flex h-10 items-center justify-center rounded-lg bg-brand-500 px-4 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60"
        >
          განახლება
        </button>
      </div>

      <div className="space-y-5">
        {BALANCE_REQUESTS.map((request) => {
          const state = states[request.key];
          const payload = state?.payload;
          const data = payload?.data;
          const count = rawRowCount(data);

          return (
            <section
              key={request.key}
              className="rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]"
            >
              <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                    {request.title}
                  </h2>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {request.description}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  {state?.loading ? (
                    <span className="rounded-full bg-warning-50 px-3 py-1 font-medium text-warning-700 dark:bg-warning-500/15 dark:text-warning-400">
                      იტვირთება
                    </span>
                  ) : state?.error ? (
                    <span className="rounded-full bg-error-50 px-3 py-1 font-medium text-error-700 dark:bg-error-500/15 dark:text-error-400">
                      შეცდომა
                    </span>
                  ) : (
                    <span className="rounded-full bg-success-50 px-3 py-1 font-medium text-success-700 dark:bg-success-500/15 dark:text-success-400">
                      OK
                    </span>
                  )}
                  {count !== null ? (
                    <span className="rounded-full bg-gray-100 px-3 py-1 font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                      {count} row
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="mb-3 space-y-2 rounded-lg bg-gray-50 p-3 text-xs dark:bg-gray-900/60">
                <div>
                  <span className="font-semibold text-gray-700 dark:text-gray-300">
                    Admin endpoint:
                  </span>{" "}
                  <code className="break-all text-gray-700 dark:text-gray-300">
                    {request.proxyEndpoint}
                  </code>
                </div>
                {typeof payload?.requestUrl === "string" ? (
                  <div>
                    <span className="font-semibold text-gray-700 dark:text-gray-300">
                      Balance endpoint:
                    </span>{" "}
                    <code className="break-all text-gray-700 dark:text-gray-300">
                      {payload.requestUrl}
                    </code>
                  </div>
                ) : null}
                {state?.loadedAt ? (
                  <div className="text-gray-500 dark:text-gray-500">
                    ბოლო ჩატვირთვა: {state.loadedAt}
                  </div>
                ) : null}
              </div>

              {state?.error ? (
                <pre className="max-h-[360px] overflow-auto rounded-lg border border-error-200 bg-error-50 p-4 text-xs text-error-700 dark:border-error-500/20 dark:bg-error-500/10 dark:text-error-300">
                  {state.error}
                </pre>
              ) : (
                <pre className="max-h-[520px] overflow-auto rounded-lg border border-gray-200 bg-gray-950 p-4 text-xs leading-5 text-gray-100 dark:border-gray-800">
                  {state?.loading
                    ? "იტვირთება..."
                    : stringifyJson(data ?? payload)}
                </pre>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
