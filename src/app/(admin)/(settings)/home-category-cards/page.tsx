'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  homeCategoryCardsApi,
  HomeCategoryCard,
  CreateHomeCategoryCardDto,
} from '@/lib/api/home-category-cards';
import { categoriesApi, AdminCategory } from '@/lib/api/categories';
import CategoryPathPicker from '@/components/products/CategoryPathPicker';

const ICON_OPTIONS = [
  { value: 'pills', label: 'პილულები' },
  { value: 'flower-outline', label: 'ყვავილი' },
  { value: 'heart', label: 'გული' },
  { value: 'medical-outline', label: 'მედიცინა' },
  { value: 'leaf-outline', label: 'ფოთოლი' },
  { value: 'baby-outline', label: 'ბავშვი' },
  { value: 'fitness-outline', label: 'ფიტნესი' },
  { value: 'water-outline', label: 'წყალი' },
];

const emptyForm = (order: number): CreateHomeCategoryCardDto => ({
  title: '',
  subtitle: '',
  backgroundColor: '#EAF7FF',
  iconKey: 'pills',
  iconUrl: '',
  iconColor: '#24B7B4',
  categoryId: '',
  order,
  isVisible: true,
});

function categoryIdOf(card: HomeCategoryCard): string {
  const raw = card.categoryId as unknown;
  if (typeof raw === 'string') return raw;
  if (raw && typeof raw === 'object' && '_id' in (raw as object)) {
    return String((raw as { _id: string })._id);
  }
  return String(raw ?? '');
}

function pathIdsFromLeaf(
  categories: AdminCategory[],
  leafId: string,
): string[] {
  if (!leafId) return [];
  const byId = new Map(categories.map((c) => [c.id, c]));
  const path: string[] = [];
  let cur = byId.get(leafId);
  const guard = new Set<string>();
  while (cur) {
    if (guard.has(cur.id)) break;
    guard.add(cur.id);
    path.unshift(cur.id);
    cur = cur.parentId ? byId.get(cur.parentId) : undefined;
  }
  return path;
}

function categoryPathLabel(
  categories: AdminCategory[],
  leafId: string,
): string {
  const path = pathIdsFromLeaf(categories, leafId);
  if (path.length === 0) return leafId || '—';
  const byId = new Map(categories.map((c) => [c.id, c]));
  return path.map((id) => byId.get(id)?.name || id).join(' › ');
}

export default function HomeCategoryCardsPage() {
  const [cards, setCards] = useState<HomeCategoryCard[]>([]);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<HomeCategoryCard | null>(null);
  const [formData, setFormData] = useState<CreateHomeCategoryCardDto>(emptyForm(1));
  const [pathIds, setPathIds] = useState<string[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [cardsData, categoriesData] = await Promise.all([
        homeCategoryCardsApi.getAll(),
        categoriesApi.getAll(),
      ]);
      setCards(Array.isArray(cardsData) ? cardsData : []);
      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
    } catch (error) {
      console.error('Error loading home category cards:', error);
      setCards([]);
      setCategories([]);
      alert('მონაცემების ჩატვირთვა ვერ მოხერხდა');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditing(null);
    setFormData(emptyForm(cards.length + 1));
    setPathIds([]);
    setShowModal(true);
  };

  const handleEdit = (card: HomeCategoryCard) => {
    const leafId = categoryIdOf(card);
    setEditing(card);
    setFormData({
      title: card.title,
      subtitle: card.subtitle || '',
      backgroundColor: card.backgroundColor || '#EAF7FF',
      iconKey: card.iconKey || 'pills',
      iconUrl: card.iconUrl || '',
      iconColor: card.iconColor || '#24B7B4',
      categoryId: leafId,
      order: card.order,
      isVisible: card.isVisible,
    });
    setPathIds(pathIdsFromLeaf(categories, leafId));
    setShowModal(true);
  };

  const handlePathChange = (nextPath: string[]) => {
    setPathIds(nextPath);
    setFormData((prev) => ({
      ...prev,
      categoryId: nextPath[nextPath.length - 1] || '',
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.categoryId) {
      alert('აირჩიეთ კატეგორია (ნებისმიერ დონეზე)');
      return;
    }
    try {
      if (editing) {
        await homeCategoryCardsApi.update(editing._id, formData);
      } else {
        await homeCategoryCardsApi.create(formData);
      }
      await loadData();
      setShowModal(false);
    } catch (error) {
      console.error('Error saving card:', error);
      alert('შენახვა ვერ მოხერხდა');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('დარწმუნებული ხართ რომ გსურთ წაშლა?')) return;
    try {
      await homeCategoryCardsApi.delete(id);
      await loadData();
    } catch (error) {
      console.error('Error deleting card:', error);
      alert('წაშლა ვერ მოხერხდა');
    }
  };

  const handleToggleVisibility = async (card: HomeCategoryCard) => {
    try {
      await homeCategoryCardsApi.update(card._id, {
        isVisible: !card.isVisible,
      });
      await loadData();
    } catch (error) {
      console.error('Error toggling visibility:', error);
      alert('სტატუსის შეცვლა ვერ მოხერხდა');
    }
  };

  const move = async (index: number, direction: -1 | 1) => {
    const next = index + direction;
    if (next < 0 || next >= cards.length) return;
    const reordered = [...cards];
    const temp = reordered[index];
    reordered[index] = reordered[next];
    reordered[next] = temp;
    const updates = reordered.map((c, i) => ({ id: c._id, order: i + 1 }));
    try {
      await homeCategoryCardsApi.reorder(updates);
      await loadData();
    } catch (error) {
      console.error('Error reordering:', error);
      alert('გადალაგება ვერ მოხერხდა');
    }
  };

  const selectedPathLabel = useMemo(
    () => categoryPathLabel(categories, formData.categoryId),
    [categories, formData.categoryId],
  );

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">იტვირთება...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6 flex justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            მთავარი კატეგორიის ბარათები
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            მართეთ მთავარ გვერდზე კატეგორიის ბანერები — შეგიძლია root ან ნებისმიერი
            სუბკატეგორია მიბმა
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium whitespace-nowrap"
        >
          + ახალი ბარათი
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                რიგი
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                პრევიუ
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                სათაური
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                კატეგორია
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                სტატუსი
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                მოქმედებები
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {cards.map((card, index) => (
              <tr key={card._id} className="hover:bg-gray-50">
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{card.order}</span>
                    <div className="flex flex-col gap-1">
                      <button
                        type="button"
                        onClick={() => move(index, -1)}
                        disabled={index === 0}
                        className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => move(index, 1)}
                        disabled={index === cards.length - 1}
                        className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                      >
                        ↓
                      </button>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{
                      backgroundColor: card.backgroundColor || '#EAF7FF',
                      color: card.iconColor || '#24B7B4',
                    }}
                  >
                    {card.iconUrl ? 'img' : (card.iconKey || '•').slice(0, 4)}
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="text-sm font-medium text-gray-900">
                    {card.title}
                  </div>
                  <div className="text-xs text-gray-500">{card.subtitle}</div>
                </td>
                <td className="px-4 py-4 text-sm text-gray-600">
                  {categoryPathLabel(categories, categoryIdOf(card))}
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => handleToggleVisibility(card)}
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      card.isVisible
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {card.isVisible ? 'ხილვადი' : 'დამალული'}
                  </button>
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    type="button"
                    onClick={() => handleEdit(card)}
                    className="text-blue-600 hover:text-blue-900 mr-4"
                  >
                    რედაქტირება
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(card._id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    წაშლა
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {cards.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            ბარათები ჯერ არ არის — დაამატეთ ან გაუშვით seed
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {editing ? 'ბარათის რედაქტირება' : 'ახალი ბარათი'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  სათაური
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ქვესათაური
                </label>
                <input
                  type="text"
                  value={formData.subtitle || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, subtitle: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <p className="block text-sm font-medium text-gray-700 mb-2">
                  გადასვლის კატეგორია (ნებისმიერი დონე)
                </p>
                <CategoryPathPicker
                  categories={categories}
                  pathIds={pathIds}
                  onPathChange={handlePathChange}
                />
                {formData.categoryId ? (
                  <p className="mt-2 text-xs text-gray-500">
                    არჩეული: {selectedPathLabel}
                  </p>
                ) : null}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ფონის ფერი
                  </label>
                  <input
                    type="color"
                    value={formData.backgroundColor || '#EAF7FF'}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        backgroundColor: e.target.value,
                      })
                    }
                    className="w-full h-10 border border-gray-300 rounded-lg cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    აიქონის ფერი
                  </label>
                  <input
                    type="color"
                    value={formData.iconColor || '#24B7B4'}
                    onChange={(e) =>
                      setFormData({ ...formData, iconColor: e.target.value })
                    }
                    className="w-full h-10 border border-gray-300 rounded-lg cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  აიქონი
                </label>
                <select
                  value={formData.iconKey || 'pills'}
                  onChange={(e) =>
                    setFormData({ ...formData, iconKey: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  {ICON_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  აიქონის URL (ოფციონალური)
                </label>
                <input
                  type="url"
                  value={formData.iconUrl || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, iconUrl: e.target.value })
                  }
                  placeholder="https://..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isVisible ?? true}
                  onChange={(e) =>
                    setFormData({ ...formData, isVisible: e.target.checked })
                  }
                  className="rounded border-gray-300 text-blue-600"
                />
                <label className="ml-2 text-sm text-gray-700">ხილვადი</label>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
                >
                  გაუქმება
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg"
                >
                  შენახვა
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
