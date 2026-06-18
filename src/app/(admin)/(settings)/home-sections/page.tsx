'use client';

import React, { useEffect, useState } from 'react';
import {
  homeSectionsApi,
  HomeSection,
  CreateHomeSectionDto,
} from '@/lib/api/home-sections';
import { categoriesApi, AdminCategory } from '@/lib/api/categories';
import { sectionTypesApi, SectionType } from '@/lib/api/section-types';

export default function HomeSectionsPage() {
  const [sections, setSections] = useState<HomeSection[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [sectionTypes, setSectionTypes] = useState<SectionType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSection, setEditingSection] = useState<HomeSection | null>(
    null,
  );
  const [formData, setFormData] = useState<CreateHomeSectionDto>({
    title: '',
    type: 'category',
    categoryFilter: '',
    searchQuery: '',
    order: 1,
    isVisible: true,
    limit: 12,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [sectionsData, categoriesData, typesData] = await Promise.all([
        homeSectionsApi.getAll(),
        categoriesApi.getAll(),
        sectionTypesApi.getActive(),
      ]);
      setSections(Array.isArray(sectionsData) ? sectionsData : []);
      setCategories(
        Array.isArray(categoriesData)
          ? categoriesData.map((c: AdminCategory) => c.name)
          : []
      );
      setSectionTypes(Array.isArray(typesData) ? typesData : []);
    } catch (error) {
      console.error('Error loading data:', error);
      setSections([]);
      setCategories([]);
      setSectionTypes([]);
      alert('მონაცემების ჩატვირთვა ვერ მოხერხდა');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingSection(null);
    setFormData({
      title: '',
      type: 'category',
      categoryFilter: '',
      searchQuery: '',
      order: sections.length + 1,
      isVisible: true,
      limit: 12,
    });
    setShowModal(true);
  };

  const handleEdit = (section: HomeSection) => {
    setEditingSection(section);
    setFormData({
      title: section.title,
      type: section.type,
      categoryFilter: section.categoryFilter || '',
      searchQuery: section.searchQuery || '',
      order: section.order,
      isVisible: section.isVisible,
      limit: section.limit,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingSection) {
        await homeSectionsApi.update(editingSection._id, formData);
      } else {
        await homeSectionsApi.create(formData);
      }
      await loadData();
      setShowModal(false);
    } catch (error) {
      console.error('Error saving section:', error);
      alert('შენახვა ვერ მოხერხდა');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('დარწმუნებული ხართ რომ გსურთ წაშლა?')) return;
    try {
      await homeSectionsApi.delete(id);
      await loadData();
    } catch (error) {
      console.error('Error deleting section:', error);
      alert('წაშლა ვერ მოხერხდა');
    }
  };

  const handleToggleVisibility = async (section: HomeSection) => {
    try {
      await homeSectionsApi.update(section._id, {
        isVisible: !section.isVisible,
      });
      await loadData();
    } catch (error) {
      console.error('Error toggling visibility:', error);
      alert('სტატუსის შეცვლა ვერ მოხერხდა');
    }
  };

  const moveUp = async (index: number) => {
    if (index === 0) return;
    const newSections = [...sections];
    const temp = newSections[index];
    newSections[index] = newSections[index - 1];
    newSections[index - 1] = temp;
    
    const updates = newSections.map((s, i) => ({ id: s._id, order: i + 1 }));
    try {
      await homeSectionsApi.reorder(updates);
      await loadData();
    } catch (error) {
      console.error('Error reordering:', error);
      alert('გადალაგება ვერ მოხერხდა');
    }
  };

  const moveDown = async (index: number) => {
    if (index === sections.length - 1) return;
    const newSections = [...sections];
    const temp = newSections[index];
    newSections[index] = newSections[index + 1];
    newSections[index + 1] = temp;
    
    const updates = newSections.map((s, i) => ({ id: s._id, order: i + 1 }));
    try {
      await homeSectionsApi.reorder(updates);
      await loadData();
    } catch (error) {
      console.error('Error reordering:', error);
      alert('გადალაგება ვერ მოხერხდა');
    }
  };

  const getTypeLabel = (type: string) => {
    // Built-in type labels
    const builtInLabels: Record<string, string> = {
      category: 'კატეგორია',
      discounted: 'ფასდაკლებული',
      favorites: 'რჩეული',
      all: 'ყველა',
    };
    return builtInLabels[type] || type;
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">იტვირთება...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            მთავარი გვერდის სექციები
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            მართეთ მთავარ გვერდზე გამოსაჩენი სექციები და მათი რიგითობა
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
        >
          + ახალი სექცია
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                რიგითობა
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                სახელი
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                ტიპი
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                ფილტრი
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                ლიმიტი
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                სტატუსი
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                მოქმედებები
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sections && sections.length > 0 ? (
              sections.map((section, index) => (
              <tr key={section._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900">
                      {section.order}
                    </span>
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => moveUp(index)}
                        disabled={index === 0}
                        className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                      >
                        ↑
                      </button>
                      <button
                        onClick={() => moveDown(index)}
                        disabled={index === sections.length - 1}
                        className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                      >
                        ↓
                      </button>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {section.title}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                    {getTypeLabel(section.type)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {section.categoryFilter || section.searchQuery || '—'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {section.limit}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => handleToggleVisibility(section)}
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      section.isVisible
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {section.isVisible ? 'ხილვადი' : 'დამალული'}
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => handleEdit(section)}
                    className="text-blue-600 hover:text-blue-900 mr-4"
                  >
                    რედაქტირება
                  </button>
                  <button
                    onClick={() => handleDelete(section._id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    წაშლა
                  </button>
                </td>
              </tr>
            ))
            ) : null}
          </tbody>
        </table>

        {!loading && sections && sections.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            სექციები ჯერ არ არის დამატებული
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4">
              {editingSection ? 'სექციის რედაქტირება' : 'ახალი სექცია'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  სახელი
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ტიპი *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      type: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">— აირჩიეთ ტიპი —</option>
                  {sectionTypes.map((type) => (
                    <option key={type._id} value={type.key}>
                      {type.label} ({type.key})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  ახალი ტიპის დასამატებლად გადადით "სექციის ტიპები" გვერდზე
                </p>
              </div>

              {formData.type === 'category' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    კატეგორია
                  </label>
                  <select
                    value={formData.categoryFilter}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        categoryFilter: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">— ყველა —</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ლიმიტი
                </label>
                <input
                  type="number"
                  value={formData.limit}
                  onChange={(e) =>
                    setFormData({ ...formData, limit: Number(e.target.value) })
                  }
                  min="1"
                  max="50"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isVisible}
                  onChange={(e) =>
                    setFormData({ ...formData, isVisible: e.target.checked })
                  }
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label className="ml-2 text-sm text-gray-700">ხილვადი</label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                >
                  გაუქმება
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
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
