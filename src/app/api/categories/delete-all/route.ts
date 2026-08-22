import { getServerNestApiBaseUrl } from '@/lib/apiBaseUrl';
import { NextRequest, NextResponse } from 'next/server';

const API_BASE = getServerNestApiBaseUrl();

type AdminCategoryForDelete = {
  id: string;
  name: string;
};

export async function DELETE(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(authHeader ? { Authorization: authHeader } : {}),
  };

  try {
    const res = await fetch(`${API_BASE}/categories`, {
      method: 'GET',
      headers,
    });
    if (!res.ok) {
      throw new Error(`კატეგორიები ვერ ჩაიტვირთა: ${await res.text()}`);
    }

    const categories = (await res.json()) as AdminCategoryForDelete[];
    if (!Array.isArray(categories) || categories.length === 0) {
      return NextResponse.json({ ok: true as const, deleted: 0 });
    }

    let deleted = 0;
    const errors: string[] = [];

    for (const category of categories) {
      try {
        const del = await fetch(`${API_BASE}/categories/${category.id}`, {
          method: 'DELETE',
          headers,
        });
        if (!del.ok && del.status !== 404) {
          throw new Error(await del.text());
        }
        deleted++;
      } catch (e) {
        errors.push(
          `${category.name}: ${e instanceof Error ? e.message : String(e)}`
        );
      }
    }

    console.log(`[categories] delete-all: deleted=${deleted}`);

    return NextResponse.json({
      ok: errors.length === 0,
      deleted,
      errors: errors.length ? errors : undefined,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { ok: false as const, error: message },
      { status: 500 }
    );
  }
}
