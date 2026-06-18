import { theme } from '@/src/theme';
import type { FilterField, ProductFilterValues } from '@/src/services/filter-fields.service';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

type ProductFilterSheetProps = {
  visible: boolean;
  fields: FilterField[];
  values: ProductFilterValues;
  onClose: () => void;
  onApply: (values: ProductFilterValues) => void;
  onClear: () => void;
};

function formatValueSummary(
  field: FilterField,
  value: string | string[] | boolean | undefined,
): string {
  if (value === undefined || value === '') return 'აირჩიეთ';
  if (typeof value === 'boolean') return value ? 'კი' : 'არა';
  if (Array.isArray(value)) return value.length > 0 ? value.join(', ') : 'აირჩიეთ';
  return String(value);
}

export function ProductFilterSheet({
  visible,
  fields,
  values,
  onClose,
  onApply,
  onClear,
}: ProductFilterSheetProps) {
  const [draft, setDraft] = useState<ProductFilterValues>(values);
  const [pickerField, setPickerField] = useState<FilterField | null>(null);

  useEffect(() => {
    if (visible) setDraft(values);
  }, [visible, values]);

  const visibleFields = useMemo(
    () => fields.filter((f) => f.isActive && f.type !== 'range'),
    [fields],
  );

  const openPicker = (field: FilterField) => {
    setDraft((prev) => ({ ...prev }));
    setPickerField(field);
  };

  const setDraftValue = (
    key: string,
    value: string | string[] | boolean | undefined,
  ) => {
    setDraft((prev) => {
      const next = { ...prev };
      if (
        value === undefined ||
        value === '' ||
        (Array.isArray(value) && value.length === 0)
      ) {
        delete next[key];
      } else {
        next[key] = value;
      }
      return next;
    });
  };

  const toggleMulti = (key: string, option: string) => {
    setDraft((prev) => {
      const current = prev[key];
      const list = Array.isArray(current)
        ? [...current]
        : typeof current === 'string'
          ? [current]
          : [];
      const idx = list.indexOf(option);
      if (idx >= 0) list.splice(idx, 1);
      else list.push(option);
      const next = { ...prev };
      if (list.length === 0) delete next[key];
      else next[key] = list;
      return next;
    });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.title}>ფილტრი</Text>
              <Ionicons name="chevron-down" size={16} color="#2A3A7A" />
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close" size={22} color="#2A3A7A" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
            {visibleFields.map((field) => (
              <TouchableOpacity
                key={field.key}
                style={styles.row}
                onPress={() => openPicker(field)}
                activeOpacity={0.75}
              >
                <Text style={styles.rowLabel}>{field.label}</Text>
                <View style={styles.rowRight}>
                  <Text style={styles.rowValue} numberOfLines={1}>
                    {formatValueSummary(field, draft[field.key])}
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.clearBtn} onPress={onClear} activeOpacity={0.8}>
              <Ionicons name="trash-outline" size={20} color="#EB5757" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.applyBtn}
              onPress={() => onApply(draft)}
              activeOpacity={0.85}
            >
              <Text style={styles.applyText}>გაფილტვრა</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>

      <Modal
        visible={pickerField !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setPickerField(null)}
      >
        <Pressable style={styles.pickerBackdrop} onPress={() => setPickerField(null)}>
          <View style={styles.pickerSheet}>
            <Text style={styles.pickerTitle}>{pickerField?.label}</Text>
            {pickerField?.type === 'boolean' ? (
              <>
                {(['კი', 'არა'] as const).map((label, i) => {
                  const boolVal = i === 0;
                  const selected = draft[pickerField.key] === boolVal;
                  return (
                    <TouchableOpacity
                      key={label}
                      style={styles.pickerOption}
                      onPress={() => {
                        setDraftValue(pickerField.key, boolVal);
                        setPickerField(null);
                      }}
                    >
                      <Text style={[styles.pickerOptionText, selected && styles.pickerOptionActive]}>
                        {label}
                      </Text>
                      {selected ? (
                        <Ionicons name="checkmark" size={18} color={theme.colors.primary} />
                      ) : null}
                    </TouchableOpacity>
                  );
                })}
                <TouchableOpacity
                  style={styles.pickerOption}
                  onPress={() => {
                    setDraftValue(pickerField.key, undefined);
                    setPickerField(null);
                  }}
                >
                  <Text style={styles.pickerOptionText}>გასუფთავება</Text>
                </TouchableOpacity>
              </>
            ) : pickerField?.type === 'multi' ? (
              <>
                {(pickerField.options ?? []).map((opt) => {
                  const current = draft[pickerField.key];
                  const selected = Array.isArray(current)
                    ? current.includes(opt)
                    : current === opt;
                  return (
                    <TouchableOpacity
                      key={opt}
                      style={styles.pickerOption}
                      onPress={() => toggleMulti(pickerField.key, opt)}
                    >
                      <Text style={[styles.pickerOptionText, selected && styles.pickerOptionActive]}>
                        {opt}
                      </Text>
                      {selected ? (
                        <Ionicons name="checkmark" size={18} color={theme.colors.primary} />
                      ) : null}
                    </TouchableOpacity>
                  );
                })}
                <TouchableOpacity
                  style={styles.pickerDone}
                  onPress={() => setPickerField(null)}
                >
                  <Text style={styles.pickerDoneText}>დახურვა</Text>
                </TouchableOpacity>
              </>
            ) : pickerField ? (
              <>
                {(pickerField.options ?? []).map((opt) => {
                  const selected = draft[pickerField.key] === opt;
                  return (
                    <TouchableOpacity
                      key={opt}
                      style={styles.pickerOption}
                      onPress={() => {
                        setDraftValue(pickerField.key, opt);
                        setPickerField(null);
                      }}
                    >
                      <Text style={[styles.pickerOptionText, selected && styles.pickerOptionActive]}>
                        {opt}
                      </Text>
                      {selected ? (
                        <Ionicons name="checkmark" size={18} color={theme.colors.primary} />
                      ) : null}
                    </TouchableOpacity>
                  );
                })}
                <TouchableOpacity
                  style={styles.pickerOption}
                  onPress={() => {
                    setDraftValue(pickerField.key, undefined);
                    setPickerField(null);
                  }}
                >
                  <Text style={styles.pickerOptionText}>გასუფთავება</Text>
                </TouchableOpacity>
              </>
            ) : null}
          </View>
        </Pressable>
      </Modal>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    paddingBottom: 24,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D1D5DB',
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A2E',
  },
  list: {
    maxHeight: 420,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  rowLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#1A1A2E',
    marginRight: 12,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    maxWidth: '50%',
  },
  rowValue: {
    fontSize: 13,
    color: '#9CA3AF',
    flexShrink: 1,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  clearBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FDE8E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyBtn: {
    flex: 1,
    backgroundColor: '#2A3A7A',
    borderRadius: 24,
    paddingVertical: 14,
    alignItems: 'center',
  },
  applyText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  pickerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  pickerSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 28,
    maxHeight: '60%',
  },
  pickerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A2E',
    marginBottom: 12,
  },
  pickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  pickerOptionText: {
    fontSize: 15,
    color: '#1A1A2E',
  },
  pickerOptionActive: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  pickerDone: {
    marginTop: 12,
    backgroundColor: '#E8EAF6',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  pickerDoneText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2A3A7A',
  },
});
