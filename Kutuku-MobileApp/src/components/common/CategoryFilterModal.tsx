import { theme } from '@/src/theme';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from 'react-native';

interface Subcategory {
  id: string;
  name: string;
}

interface CategoryFilterModalProps {
  visible: boolean;
  categoryName: string;
  subcategories: Subcategory[];
  loading?: boolean;
  onClose: () => void;
  onApply: (selectedSubcategories: string[]) => void;
}

export function CategoryFilterModal({
  visible,
  categoryName,
  subcategories,
  loading = false,
  onClose,
  onApply,
}: CategoryFilterModalProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggleSubcategory = (id: string) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === subcategories.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(subcategories.map((s) => s.id)));
    }
  };

  const allSelected =
    subcategories.length > 0 && selectedIds.size === subcategories.length;

  const handleApply = () => {
    onApply(Array.from(selectedIds));
    setSelectedIds(new Set());
    onClose();
  };

  const handleClose = () => {
    setSelectedIds(new Set());
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View style={styles.backdrop}>
        <Pressable style={styles.backdropTouchable} onPress={handleClose} />
        
        <View style={styles.sheetContainer}>
          {/* Drag Handle */}
          <View style={styles.handleContainer}>
            <View style={styles.handle} />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={handleClose}
              style={styles.backButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="chevron-back" size={24} color={theme.colors.text.primary} />
            </TouchableOpacity>

            <Text style={styles.headerTitle} numberOfLines={1}>
              {categoryName}
            </Text>

            <TouchableOpacity
              onPress={handleClose}
              style={styles.closeButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={24} color={theme.colors.text.primary} />
            </TouchableOpacity>
          </View>

          {/* Subcategories List */}
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={styles.loadingText}>იტვირთება...</Text>
              </View>
            ) : subcategories.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>ქვეკატეგორიები არ მოიძებნა</Text>
              </View>
            ) : (
              <>
                <TouchableOpacity
                  style={styles.checkboxRow}
                  onPress={toggleSelectAll}
                  activeOpacity={0.7}
                >
                  <View style={[styles.checkbox, allSelected && styles.checkboxChecked]}>
                    {allSelected && (
                      <Ionicons name="checkmark" size={16} color={theme.colors.white} />
                    )}
                  </View>
                  <Text style={styles.checkboxLabel}>ყველას მონიშვნა</Text>
                </TouchableOpacity>

                {subcategories.map((subcategory) => (
                  <TouchableOpacity
                    key={subcategory.id}
                    style={styles.checkboxRow}
                    onPress={() => toggleSubcategory(subcategory.id)}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.checkbox,
                        selectedIds.has(subcategory.id) && styles.checkboxChecked,
                      ]}
                    >
                      {selectedIds.has(subcategory.id) && (
                        <Ionicons name="checkmark" size={16} color={theme.colors.white} />
                      )}
                    </View>
                    <Text style={styles.checkboxLabel}>{subcategory.name}</Text>
                  </TouchableOpacity>
                ))}
              </>
            )}
          </ScrollView>

          {/* Apply Button */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.applyButton}
              onPress={handleApply}
              activeOpacity={0.8}
            >
              <Text style={styles.applyButtonText}>გაფილტრვა</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  backdropTouchable: {
    flex: 1,
  },
  sheetContainer: {
    backgroundColor: theme.colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 20,
  },
  handleContainer: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 8,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#D1D5DB',
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backButton: {
    width: 40,
    alignItems: 'flex-start',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginHorizontal: 8,
  },
  closeButton: {
    width: 40,
    alignItems: 'flex-end',
  },
  scrollView: {
    maxHeight: 400,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  checkboxLabel: {
    fontSize: 15,
    fontWeight: '400',
    color: theme.colors.text.primary,
    flex: 1,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  applyButton: {
    backgroundColor: '#8B9DC3',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.white,
  },
});
