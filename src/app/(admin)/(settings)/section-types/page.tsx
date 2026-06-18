'use client';

import React, { useEffect, useState } from 'react';
import {
  sectionTypesApi,
  SectionType,
  CreateSectionTypeDto,
} from '@/lib/api/section-types';

export default function SectionTypesPage() {
  const [types, setTypes] = useState<SectionType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingType, setEditingType] = useState<SectionType | null>(null);
  const [formData, setFormData] = useState<CreateSectionTypeDto>({
    key: '',
    label: '',
    description: '',
    isActive: true,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await sectionTypesApi.getAll();
      setTypes(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading section types:', error);
      setTypes([]);
      alert('მონაცემების ჩატვირთვა ვერ მოხერხდა');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingType(null);
    setFormData({
      key: '',
      label: '',
      description: '',
      isActive: true,
    });
    setShowModal(true);
  };

  const handleEdit = (type: SectionType) => {
    setEditingType(type);
    setFormData({
      key: type.key,
      label: type.label,
      description: type.description || '',
      isActive: type.isActive,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingType) {
        await sectionTypesApi.update(editingType._id, formData);
      } else {
        await sectionTypesApi.create(formData);
      }
      await loadData();
      setShowModal(false);
    } catch (error: any) {
      console.error('Error saving section type:', error);
      const message = error?.response?.data?.message || 'შენახვა ვერ მოხერხდა';
      alert(message);
    }
  };

  const handleDelete = async (type: SectionType) => {
    if (type.isBuiltIn) {
      alert('ჩაშენებული ტიპის წაშლა შეუძლებელია');
      return;
    }
    if (!confirm(`დარწმუნებული ხართ რომ გსურთ "${type.label}" ტიპის წაშლა?`))
      return;
    try {
      await sectionTypesApi.delete(type._id);
      await loadData();
    } catch (error) {
      console.error('Error deleting section type:', error);
      alert('წაშლა ვერ მოხერხდა');
    }
  };

  const handleToggleActive = async (type: SectionType) => {
    try {
      await sectionTypesApi.update(type._id, {
        isActive: !type.isActive,
      });
      await loadData();
    } catch (error) {
      console.error('Error toggling active:', error);
      alert('სტატუსის შეცვლა ვერ მოხერხდა');
    }
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
          <h1 className="text-2xl font-bold text-gray-900">სექციის ტიპები</h1>
          <p className="text-sm text-gray-600 mt-1">
            მართეთ სექციების ტიპები მთავარი გვერდისთვის
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
        >
          + ახალი ტიპი
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Key
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                დასახელება
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                აღწერა
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                ტიპი
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
            {types && types.length > 0 ? (
              types.map((type) => (
                <tr key={type._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <code className="text-sm font-mono text-gray-900 bg-gray-100 px-2 py-1 rounded">
                      {type.key}
                    </code>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-gray-900">
                      {type.label}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600">
                      {type.description || '—'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {type.isBuiltIn ? (
                      <span className="inline-flex px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                        ჩაშენებული
                      </span>
                    ) : (
                      <span className="inline-flex px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
                        კასტომური
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleToggleActive(type)}
                      className={`inline-flex px-2 py-1 text-xs font-medium rounded ${
                        type.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {type.isActive ? 'აქტიური' : 'გამორთული'}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    <button
                      onClick={() => handleEdit(type)}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      რედაქტირება
                    </button>
                    {!type.isBuiltIn && (
                      <button
                        onClick={() => handleDelete(type)}
                        className="text-red-600 hover:text-red-900"
                      >
                        წაშლა
                      </button>
                    )}
                  </td>
                </tr>
              ))
            ) : null}
          </tbody>
        </table>

        {!loading && types && types.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            ტიპები ჯერ არ არის დამატებული
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4">
              {editingType ? 'ტიპის რედაქტირება' : 'ახალი ტიპი'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Key (ინგლისურად) *
                </label>
                <input
                  type="text"
                  value={formData.key}
                  onChange={(e) =>
                    setFormData({ ...formData, key: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                  placeholder="მაგ: new-arrivals"
                  required
                  disabled={editingType?.isBuiltIn}
                />
                <p className="text-xs text-gray-500 mt-1">
                  დაბალი რეგისტრი, tire-case (მაგ: new-arrivals)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  დასახელება (ქართულად) *
                </label>
                <input
                  type="text"
                  value={formData.label}
                  onChange={(e) =>
                    setFormData({ ...formData, label: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="მაგ: ახალი პროდუქტები"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  აღწერა
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="ოფციონალური აღწერა"
                  rows={3}
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) =>
                    setFormData({ ...formData, isActive: e.target.checked })
                  }
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label
                  htmlFor="isActive"
                  className="ml-2 text-sm text-gray-700"
                >
                  აქტიური
                </label>
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  შენახვა
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
                >
                  გაუქმება
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
