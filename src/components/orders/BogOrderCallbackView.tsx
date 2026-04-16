"use client";

import React from "react";
import type { Order } from "@/types";

function asRecord(v: unknown): Record<string, unknown> | undefined {
  if (v && typeof v === "object" && !Array.isArray(v)) {
    return v as Record<string, unknown>;
  }
  return undefined;
}

function callbackBody(raw: Record<string, unknown> | undefined): Record<string, unknown> | undefined {
  return asRecord(raw?.body);
}

function displayScalar(v: unknown): string | undefined {
  if (v === null || v === undefined) return undefined;
  if (typeof v === "string") {
    const t = v.trim();
    return t === "" ? undefined : t;
  }
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  return undefined;
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-gray-100 bg-gray-50/80 p-4 dark:border-gray-600 dark:bg-gray-900/50">
      <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">{title}</h3>
      {children}
    </section>
  );
}

function DefRow({ label, value }: { label: string; value: React.ReactNode }) {
  if (value === undefined || value === null || value === "") return null;
  return (
    <div className="grid grid-cols-1 gap-1 border-b border-gray-100 py-2 text-sm last:border-0 dark:border-gray-700 sm:grid-cols-[minmax(0,220px)_1fr] sm:gap-3">
      <div className="font-medium text-gray-500 dark:text-gray-400">{label}</div>
      <div className="break-all text-gray-900 dark:text-white">{value}</div>
    </div>
  );
}

function DefBlock({
  data,
  labelMap,
}: {
  data: Record<string, unknown> | undefined;
  labelMap?: Record<string, string>;
}) {
  if (!data) return null;
  const keys = Object.keys(data).sort((a, b) => a.localeCompare(b));
  return (
    <div className="divide-y divide-gray-100 dark:divide-gray-700">
      {keys.map((k) => {
        const v = data[k];
        const inner = asRecord(v);
        if (inner) {
          return (
            <div key={k} className="py-2">
              <div className="mb-2 text-sm font-medium text-gray-600 dark:text-gray-300">
                {labelMap?.[k] ?? k}
              </div>
              <div className="ml-0 rounded-md border border-gray-200 bg-white p-3 dark:border-gray-600 dark:bg-gray-800">
                <DefBlock data={inner} />
              </div>
            </div>
          );
        }
        if (Array.isArray(v)) {
          if (v.length === 0) return null;
          return (
            <div key={k} className="py-2">
              <div className="mb-1 text-sm font-medium text-gray-600 dark:text-gray-300">
                {labelMap?.[k] ?? k}
              </div>
              <ul className="list-inside list-disc text-sm text-gray-800 dark:text-gray-200">
                {v.map((item, i) => (
                  <li key={i}>{displayScalar(item) ?? (typeof item === "object" ? "—" : String(item))}</li>
                ))}
              </ul>
            </div>
          );
        }
        const text = displayScalar(v);
        if (text === undefined) return null;
        return <DefRow key={k} label={labelMap?.[k] ?? k} value={text} />;
      })}
    </div>
  );
}

const ROOT_LABELS: Record<string, string> = {
  event: "მოვლენა",
  request_time: "მოთხოვნის დრო",
  zoned_request_time: "დრო (UTC/ზონა)",
};

const BODY_TOP_LABELS: Record<string, string> = {
  order_id: "BOG order_id",
  external_order_id: "გარე შეკვეთის ID",
  buyer: "მყიდველი",
  lang: "ენა",
  industry: "ინდუსტრია",
  capture: "ჩაჭერა",
  reject_reason: "უარყოფის მიზეზი",
  code: "კოდი",
  code_description: "კოდის აღწერა",
};

const CLIENT_LABELS: Record<string, string> = {
  id: "კლიენტის ID",
  brand_ka: "ბრენდი (ქართ.)",
  brand_en: "ბრენდი (ინგლ.)",
  url: "URL",
  create_date: "შექმნის დრო",
  zoned_create_date: "შექმნა (ზონა)",
  expire_date: "ვადის გასვლა",
  zoned_expire_date: "ვადა (ზონა)",
};

const ORDER_STATUS_LABELS: Record<string, string> = {
  key: "სტატუსის კოდი",
  value: "სტატუსი (ტექსტი)",
};

const PAYMENT_DETAIL_LABELS: Record<string, string> = {
  transfer_method: "გადარიცხვის მეთოდი",
  transaction_id: "ტრანზაქციის ID",
  payer_identifier: "გადამხდელის იდენტიფიკატორი",
  payment_option: "გადახდის ტიპი",
  card_type: "ბარათის ტიპი",
  card_expiry_date: "ბარათის ვადა",
  auth_code: "ავტორიზაციის კოდი",
  pg_trx_id: "PG ტრანზაქცია",
  code: "კოდი",
  code_description: "აღწერა",
  request_account_tag: "ანგარიშის ტეგი (მოთხოვნა)",
  transfer_account_tag: "ანგარიშის ტეგი (გადარიცხვა)",
  saved_card_type: "შენახული ბარათის ტიპი",
  parent_order_id: "მშობელი შეკვეთის ID",
  actions: "მოქმედებები",
  disputes: "დისპუტები",
  split: "გაყოფა",
  discount: "ფასდაკლება",
};

const PURCHASE_UNITS_LABELS: Record<string, string> = {
  request_amount: "მოთხოვნილი თანხა",
  transfer_amount: "გადარიცხული თანხა",
  refund_amount: "დაბრუნებული თანხა",
  currency_code: "ვალუტა",
};

function TruncLink({ href, label }: { href: string; label: string }) {
  const short = href.length > 72 ? `${href.slice(0, 72)}…` : href;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-brand-600 underline decoration-brand-400/60 underline-offset-2 hover:text-brand-700 dark:text-brand-400"
      title={href}
    >
      {label}: {short}
    </a>
  );
}

export function BogOrderCallbackView({ order }: { order: Order }) {
  const raw = order.bogLastCallbackRaw;
  const body = callbackBody(raw);

  const orderStatus = asRecord(body?.order_status);
  const client = asRecord(body?.client);
  const redirectLinks = asRecord(body?.redirect_links);
  const payDetail = asRecord(body?.payment_detail);
  const purchaseUnits = asRecord(body?.purchase_units);
  const bankItems = Array.isArray(purchaseUnits?.items)
    ? (purchaseUnits!.items as unknown[])
    : [];
  const bankItemColumns: string[] = (() => {
    const s = new Set<string>();
    for (const row of bankItems) {
      const o = asRecord(row);
      if (o) Object.keys(o).forEach((k) => s.add(k));
    }
    return [...s].sort((a, b) => a.localeCompare(b));
  })();

  const shownBodyKeys = new Set([
    "order_id",
    "external_order_id",
    "order_status",
    "client",
    "buyer",
    "redirect_links",
    "payment_detail",
    "purchase_units",
  ]);

  const restBody: Record<string, unknown> = {};
  if (body) {
    for (const k of Object.keys(body)) {
      if (!shownBodyKeys.has(k)) restBody[k] = body[k]!;
    }
  }

  return (
    <div className="space-y-4">
      <Section title="ჩვენს ბაზაში (შეკვეთა)">
        <div>
          <DefRow label="BOG order_id" value={order.bogOrderId} />
          <DefRow label="გადახდის სტატუსი" value={order.bogPaymentStatus} />
          <DefRow
            label="ბოლო callback-ის დრო"
            value={
              order.bogLastCallbackAt
                ? order.bogLastCallbackAt.toLocaleString("ka-GE", {
                    dateStyle: "medium",
                    timeStyle: "medium",
                  })
                : undefined
            }
          />
        </div>
      </Section>

      {raw ? (
        <>
          <Section title="Callback — ზოგადი">
            <div>
              {Object.keys(ROOT_LABELS).map((k) => (
                <DefRow key={k} label={ROOT_LABELS[k]} value={displayScalar(raw[k])} />
              ))}
            </div>
          </Section>
          {(() => {
            const rest: Record<string, unknown> = {};
            for (const k of Object.keys(raw)) {
              if (k !== "event" && k !== "request_time" && k !== "zoned_request_time" && k !== "body") {
                rest[k] = raw[k]!;
              }
            }
            if (Object.keys(rest).length === 0) return null;
            return (
              <Section title="Callback — დანარჩენი (root)">
                <DefBlock data={rest} />
              </Section>
            );
          })()}
        </>
      ) : null}

      {body ? (
        <>
          <Section title="ბანკის შეკვეთა">
            <div>
              <DefRow label={BODY_TOP_LABELS.order_id} value={displayScalar(body.order_id)} />
              <DefRow
                label={BODY_TOP_LABELS.external_order_id}
                value={displayScalar(body.external_order_id)}
              />
              {asRecord(body.buyer) ? (
                <div className="border-b border-gray-100 py-2 dark:border-gray-700">
                  <div className="mb-2 text-sm font-medium text-gray-600 dark:text-gray-300">
                    {BODY_TOP_LABELS.buyer}
                  </div>
                  <div className="rounded-md border border-gray-200 bg-white p-3 dark:border-gray-600 dark:bg-gray-800">
                    <DefBlock data={asRecord(body.buyer)} />
                  </div>
                </div>
              ) : (
                <DefRow label={BODY_TOP_LABELS.buyer} value={displayScalar(body.buyer)} />
              )}
            </div>
          </Section>

          {client ? (
            <Section title="მერჩანტი / კლიენტი (BOG)">
              <DefBlock data={client} labelMap={CLIENT_LABELS} />
            </Section>
          ) : null}

          {orderStatus ? (
            <Section title="გადახდის სტატუსი (ბანკი)">
              <div>
                <DefRow label={ORDER_STATUS_LABELS.key} value={displayScalar(orderStatus.key)} />
                <DefRow
                  label={ORDER_STATUS_LABELS.value}
                  value={displayScalar(orderStatus.value)}
                />
              </div>
            </Section>
          ) : null}

          {redirectLinks ? (
            <Section title="Redirect ბმულები">
              <div className="space-y-2 text-sm">
                {typeof redirectLinks.success === "string" && redirectLinks.success.trim() ? (
                  <TruncLink href={redirectLinks.success.trim()} label="წარმატება" />
                ) : null}
                {typeof redirectLinks.fail === "string" && redirectLinks.fail.trim() ? (
                  <TruncLink href={redirectLinks.fail.trim()} label="შეცდომა" />
                ) : null}
              </div>
            </Section>
          ) : null}

          {payDetail ? (
            <Section title="გადახდის დეტალი">
              <DefBlock data={payDetail} labelMap={PAYMENT_DETAIL_LABELS} />
            </Section>
          ) : null}

          {purchaseUnits ? (
            <Section title="თანხა და პოზიციები (ბანკის პასუხი)">
              <div className="mb-4">
                {Object.keys(PURCHASE_UNITS_LABELS).map((k) => (
                  <DefRow
                    key={k}
                    label={PURCHASE_UNITS_LABELS[k]}
                    value={displayScalar(purchaseUnits[k])}
                  />
                ))}
              </div>
              {bankItems.length > 0 ? (
                <div className="overflow-x-auto rounded-md border border-gray-200 dark:border-gray-600">
                  <table className="min-w-full divide-y divide-gray-200 text-left text-sm dark:divide-gray-600">
                    <thead className="bg-gray-100 dark:bg-gray-800">
                      <tr>
                        <th className="px-3 py-2 font-medium text-gray-700 dark:text-gray-300">
                          #
                        </th>
                        {bankItemColumns.map((col) => (
                          <th
                            key={col}
                            className="px-3 py-2 font-medium text-gray-700 dark:text-gray-300"
                          >
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white dark:divide-gray-700 dark:bg-gray-900">
                      {bankItems.map((row, idx) => {
                        const o = asRecord(row);
                        if (!o) {
                          return (
                            <tr key={idx}>
                              <td className="px-3 py-2 text-gray-600">{idx + 1}</td>
                              <td
                                className="px-3 py-2"
                                colSpan={Math.max(1, bankItemColumns.length)}
                              >
                                {String(row)}
                              </td>
                            </tr>
                          );
                        }
                        return (
                          <tr key={idx}>
                            <td className="px-3 py-2 text-gray-500">{idx + 1}</td>
                            {bankItemColumns.map((col) => {
                              const cell = o[col];
                              return (
                                <td
                                  key={col}
                                  className="max-w-[220px] truncate px-3 py-2 text-gray-900 dark:text-gray-100"
                                  title={String(cell ?? "")}
                                >
                                  {displayScalar(cell) ?? (cell === null ? "—" : String(cell))}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : null}
            </Section>
          ) : null}

          {Object.keys(restBody).length > 0 ? (
            <Section title="სხვა ველები (body)">
              <DefBlock data={restBody} labelMap={BODY_TOP_LABELS} />
            </Section>
          ) : null}
        </>
      ) : raw ? (
        <Section title="Callback">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            body არ არის — მხოლოდ ზოგადი ველები ზემოთ.
          </p>
        </Section>
      ) : null}
    </div>
  );
}

export function hasBogDisplayData(order: Order): boolean {
  return Boolean(
    order.bogOrderId ||
      order.bogPaymentStatus ||
      order.bogLastCallbackAt ||
      order.bogLastCallbackRaw,
  );
}
