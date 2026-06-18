'use client';

import React, { useEffect, useState } from 'react';
import {
  filterFieldsApi,
  FilterField,
  CreateFilterFieldDto,
  FilterFieldType,
} from '@/lib/api/filter-fields';

const TYPE_LABELS: Record<FilterFieldType, string> = {
  select: 'ერთი არჩევანი',
  multi: 'მრავალი არჩევანი',
  boolean: 'კი/არა',
  range: 'დიაპაზონი (ფასი)',
};

function hasSelectableOptions(type: FilterFieldType) {
  return type === 'select' || type === 'multi';
}

function OptionsEditor({
  options,
  onChange,
  placeholder = 'მაგ: Bayer',
}: {
  options: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState('');

  const addOption = () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    if (options.some((o) => o.toLowerCase() === trimmed.toLowerCase())) {
      alert('ეს ვარიანტი უკვე არსებობს');
      return;
    }
    onChange([...options, trimmed]);
    setDraft('');
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addOption();
            }
          }}
          className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
          placeholder={placeholder}
        />
        <button
          type="button"
          onClick={addOption}
          className="shrink-0 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
        >
          დამატება
        </button>
      </div>
      {options.length > 0 ? (
        <ul className="max-h-48 space-y-1 overflow-y-auto rounded-lg border border-gray-200 bg-gray-50 p-2">
          {options.map((opt) => (
            <li
              key={opt}
              className="flex items-center justify-between gap-2 rounded-md bg-white px-3 py-2 text-sm shadow-sm"
            >
              <span className="truncate text-gray-900">{opt}</span>
              <button
                type="button"
                onClick={() => onChange(options.filter((o) => o !== opt))}
                className="shrink-0 text-xs text-red-500 hover:text-red-600"
              >
                წაშლა
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-gray-500">ვარიანტები ჯერ არ არის დამატებული</p>
      )}
    </div>
  );
}

export default function FilterFieldsPage() {
  const [fields, setFields] = useState<FilterField[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<FilterField | null>(null);
  const [formData, setFormData] = useState<CreateFilterFieldDto>({
    key: '',
    label: '',
    type: 'select',
    options: [],
    sortOrder: 0,
    isActive: true,
    description: '',
  });
  const [optionsList, setOptionsList] = useState<string[]>([]);
  const [optionsModalField, setOptionsModalField] = useState<FilterField | null>(null);
  const [optionsModalList, setOptionsModalList] = useState<string[]>([]);
  const [savingOptions, setSavingOptions] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await filterFieldsApi.getAll();
      setFields(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading filter fields:', error);
      setFields([]);
      alert('მონაცემების ჩატვირთვა ვერ მოხერხდა');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditing(null);
    setFormData({
      key: '',
      label: '',
      type: 'select',
      options: [],
      sortOrder: fields.length,
      isActive: true,
      description: '',
    });
    setOptionsList([]);
    setShowModal(true);
  };

  const handleEdit = (field: FilterField) => {
    const id = field.id || field._id || '';
    setEditing({ ...field, id });
    setFormData({
      key: field.key,
      label: field.label,
      type: field.type,
      options: field.options ?? [],
      sortOrder: field.sortOrder ?? 0,
      isActive: field.isActive,
      description: field.description || '',
    });
    setOptionsList([...(field.options ?? [])]);
    setShowModal(true);
  };

  const handleManageOptions = (field: FilterField) => {
    const id = field.id || field._id || '';
    setOptionsModalField({ ...field, id });
    setOptionsModalList([...(field.options ?? [])]);
  };

  const handleSaveOptions = async () => {
    const id = optionsModalField?.id || optionsModalField?._id;
    if (!id) return;
    try {
      setSavingOptions(true);
      await filterFieldsApi.update(id, { options: optionsModalList });
      await loadData();
      setOptionsModalField(null);
    } catch (error) {
      console.error('Error saving options:', error);
      alert('ვარიანტების შენახვა ვერ მოხერხდა');
    } finally {
      setSavingOptions(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: CreateFilterFieldDto = {
      ...formData,
      key: formData.key.trim(),
      label: formData.label.trim(),
      options:
        formData.type === 'boolean' || formData.type === 'range'
          ? []
          : optionsList,
    };
    try {
      const id = editing?.id || editing?._id;
      if (editing && id) {
        await filterFieldsApi.update(id, payload);
      } else {
        await filterFieldsApi.create(payload);
      }
      await loadData();
      setShowModal(false);
    } catch (error: unknown) {
      console.error('Error saving filter field:', error);
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || 'შენახვა ვერ მოხერხდა';
      alert(message);
    }
  };

  const handleDelete = async (field: FilterField) => {
    const id = field.id || field._id;
    if (!id) return;
    if (!confirm(`დარწმუნებული ხართ რომ გსურთ "${field.label}" წაშლა?`)) return;
    try {
      await filterFieldsApi.delete(id);
      await loadData();
    } catch (error) {
      console.error('Error deleting filter field:', error);
      alert('წაშლა ვერ მოხერხდა');
    }
  };

  const handleToggleActive = async (field: FilterField) => {
    const id = field.id || field._id;
    if (!id) return;
    try {
      await filterFieldsApi.update(id, { isActive: !field.isActive });
      await loadData();
    } catch (error) {
      console.error('Error toggling active:', error);
      alert('სტატუსის შეცვლა ვერ მოხერხდა');
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-full w-full p-6">
        <div className="flex w-full items-center justify-center py-12">იტვირთება...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-full w-full flex-col p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ფილტრები</h1>
          <p className="mt-1 text-sm text-gray-600">
            განსაზღვრე ფილტრის ველები და ვარიანტები — შემდეგ პროდუქტებზე მიანიჭე
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
        >
          + ახალი ფილტრი
        </button>
      </div>

      <div className="flex-1 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="h-full w-full overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                სახელი
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                Key
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                ტიპი
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                ვარიანტები
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                სტატუსი
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">
                მოქმედება
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {fields.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  ფილტრები ჯერ არ არის დამატებული
                </td>
              </tr>
            ) : (
              fields.map((field) => {
                const id = field.id || field._id || field.key;
                return (
                  <tr key={id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {field.label}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">
                      {field.key}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {TYPE_LABELS[field.type]}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {hasSelectableOptions(field.type) ? (
                        <button
                          type="button"
                          onClick={() => handleManageOptions(field)}
                          className="text-left text-brand-600 hover:text-brand-700 hover:underline"
                        >
                          {field.options?.length ?? 0} ვარიანტი
                        </button>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleToggleActive(field)}
                        className={`rounded-full px-2 py-1 text-xs font-medium ${
                          field.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {field.isActive ? 'აქტიური' : 'გამორთული'}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleEdit(field)}
                        className="mr-2 text-sm text-brand-500 hover:text-brand-600"
                      >
                        რედაქტირება
                      </button>
                      <button
                        onClick={() => handleDelete(field)}
                        className="text-sm text-red-500 hover:text-red-600"
                      >
                        წაშლა
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        </div>
      </div>

      {optionsModalField && (
        <div className="fixed inset-0 z-100000 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
            <h2 className="mb-1 text-lg font-semibold">
              {optionsModalField.label} — ვარიანტები
            </h2>
            <p className="mb-4 text-sm text-gray-500">
              დაამატე ცალ-ცალკე (მაგ. ბრენდები). Enter-ითაც შეგიძლია დამატება.
            </p>
            <OptionsEditor
              options={optionsModalList}
              onChange={setOptionsModalList}
              placeholder={
                optionsModalField.key === 'brand'
                  ? 'ბრენდის სახელი'
                  : 'ახალი ვარიანტი'
              }
            />
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setOptionsModalField(null)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm"
              >
                გაუქმება
              </button>
              <button
                type="button"
                onClick={handleSaveOptions}
                disabled={savingOptions}
                className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
              >
                {savingOptions ? 'ინახება...' : 'შენახვა'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-100000 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-semibold">
              {editing ? 'ფილტრის რედაქტირება' : 'ახალი ფილტრი'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  სახელი (ქართულად)
                </label>
                <input
                  required
                  value={formData.label}
                  onChange={(e) =>
                    setFormData({ ...formData, label: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  placeholder="მაგ: ბრენდები"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Key (ინგლისურად, უნიკალური)
                </label>
                <input
                  required
                  value={formData.key}
                  onChange={(e) =>
                    setFormData({ ...formData, key: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm"
                  placeholder="brand"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  ტიპი
                </label>
                <select
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      type: e.target.value as FilterFieldType,
                    })
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="select">ერთი არჩევანი</option>
                  <option value="multi">მრავალი არჩევანი</option>
                  <option value="boolean">კი/არა</option>
                  <option value="range">დიაპაზონი (ფასი)</option>
                </select>
              </div>
              {hasSelectableOptions(formData.type) && (
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    ვარიანტები
                  </label>
                  <OptionsEditor
                    options={optionsList}
                    onChange={setOptionsList}
                    placeholder={
                      formData.key === 'brand'
                        ? 'მაგ: Bayer, Pfizer...'
                        : 'ახალი ვარიანტი'
                    }
                  />
                </div>
              )}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  რიგი (sortOrder)
                </label>
                <input
                  type="number"
                  min={0}
                  value={formData.sortOrder}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      sortOrder: parseInt(e.target.value, 10) || 0,
                    })
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) =>
                    setFormData({ ...formData, isActive: e.target.checked })
                  }
                />
                აქტიური
              </label>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm"
                >
                  გაუქმება
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
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
