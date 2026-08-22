import { fetchBalanceStocks } from '@/lib/api/balanceClient';
import { getServerNestApiBaseUrl } from '@/lib/apiBaseUrl';
import {
  getBalanceItems,
  getItemUuid,
  isBalanceGroupRow,
} from '@/lib/api/balanceSync';
import { NextRequest, NextResponse } from 'next/server';

const API_BASE = getServerNestApiBaseUrl();
const NULL_BALANCE_UID = '00000000-0000-0000-0000-000000000000';

type AdminCategoryForSync = {
  id: string;
  name: string;
  parentId?: string | null;
  balanceUid?: string;
  balanceParentUid?: string;
};

function rowStr(row: Record<string, unknown>, ...keys: string[]): string {
  for (const key of keys) {
    const value = row[key];
    if (value !== null && value !== undefined && value !== '') {
      return String(value).trim();
    }
  }
  return '';
}

function groupParentUid(row: Record<string, unknown>): string {
  return rowStr(row, 'Group', 'group', 'GroupRef');
}

function groupName(row: Record<string, unknown>): string {
  return (
    rowStr(row, 'Name', 'FullName', 'Description') ||
    rowStr(row, 'Code', 'InternalArticle') ||
    getItemUuid(row) ||
    'Balance group'
  );
}

function groupDepth(
  row: Record<string, unknown>,
  groupByUid: Map<string, Record<string, unknown>>
): number {
  let parentUid = groupParentUid(row);
  const seen = new Set<string>();
  let depth = 0;
  while (parentUid && parentUid !== NULL_BALANCE_UID && depth < 50) {
    const key = parentUid.toLowerCase();
    if (seen.has(key)) break;
    seen.add(key);
    const parent = groupByUid.get(key);
    if (!parent) break;
    depth++;
    parentUid = groupParentUid(parent);
  }
  return depth;
}

async function deleteExistingCategories(headers: HeadersInit): Promise<number> {
  const res = await fetch(`${API_BASE}/categories`, { method: 'GET', headers });
  if (!res.ok) {
    throw new Error(`არსებული კატეგორიები ვერ ჩაიტვირთა: ${await res.text()}`);
  }
  const categories = (await res.json()) as AdminCategoryForSync[];
  if (!Array.isArray(categories) || categories.length === 0) return 0;

  let deleted = 0;
  for (const category of categories) {
    const del = await fetch(`${API_BASE}/categories/${category.id}`, {
      method: 'DELETE',
      headers,
    });
    if (!del.ok && del.status !== 404) {
      throw new Error(`${category.name}: წაშლა ვერ მოხერხდა — ${await del.text()}`);
    }
    deleted++;
  }
  return deleted;
}

async function createBalanceCategories(
  items: Record<string, unknown>[],
  headers: HeadersInit
) {
  const groups = items.filter(isBalanceGroupRow);
  const groupByUid = new Map<string, Record<string, unknown>>();
  for (const row of groups) {
    const uid = getItemUuid(row);
    if (uid) groupByUid.set(uid.toLowerCase(), row);
  }

  const sortedGroups = [...groups].sort(
    (a, b) => groupDepth(a, groupByUid) - groupDepth(b, groupByUid)
  );

  const createdByBalanceUid = new Map<string, AdminCategoryForSync>();
  const errors: string[] = [];
  let created = 0;

  for (const row of sortedGroups) {
    const balanceUid = getItemUuid(row);
    if (!balanceUid) continue;

    const parentBalanceUid = groupParentUid(row);
    const parentCategory =
      parentBalanceUid && parentBalanceUid !== NULL_BALANCE_UID
        ? createdByBalanceUid.get(parentBalanceUid.toLowerCase())
        : undefined;

    const payload = {
      name: groupName(row),
      parentId: parentCategory?.id,
      balanceUid,
      balanceParentUid:
        parentBalanceUid && parentBalanceUid !== NULL_BALANCE_UID
          ? parentBalanceUid
          : undefined,
      active: true,
      sortOrder: Number(row.Code ?? row.SortOrder ?? 0) || 0,
    };

    try {
      const res = await fetch(`${API_BASE}/categories`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());
      const category = (await res.json()) as AdminCategoryForSync;
      createdByBalanceUid.set(balanceUid.toLowerCase(), category);
      created++;
    } catch (e) {
      errors.push(`${payload.name}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  return {
    created,
    total: groups.length,
    errors: errors.length ? errors : undefined,
  };
}

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(authHeader ? { Authorization: authHeader } : {}),
  };

  try {
    const balanceData = await fetchBalanceStocks();
    const items = getBalanceItems(balanceData);
    const deleted = await deleteExistingCategories(headers);
    const categories = await createBalanceCategories(items, headers);

    console.log(
      `[sync-categories] Balance categories replaced: deleted=${deleted} created=${categories.created} total=${categories.total}`
    );

    return NextResponse.json({
      ok: true as const,
      deleted,
      ...categories,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { ok: false as const, error: message },
      { status: 500 }
    );
  }
}
