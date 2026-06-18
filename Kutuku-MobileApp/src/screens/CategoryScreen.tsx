import { BottomNavigation } from '@/src/components/common/BottomNavigation';
import { CategoryFilterModal } from '@/src/components/common/CategoryFilterModal';
import { MAIN_CATEGORY_API_NAMES, type MainCategoryType } from '@/src/components/common/MainCategoryCard';
import { CategoryService } from '@/src/services/category.service';
import type { CategoryItem, SubcategoryItem } from '@/src/services/category.service';
import { theme } from '@/src/theme';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ImageBackground,
} from 'react-native';
import { useTabNavigation } from '@/src/hooks/useTabNavigation';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type CategoryScreenProps = {
  onCategoryPress: (categoryName: string, subcategories?: string[]) => void;
  onHomePress: () => void;
  initialMainCategory?: MainCategoryType;
};

function displayCategoryName(raw: string): string {
  const t = raw.trim();
  if (!t) return '—';
  if (t.length >= 6 && t.length % 2 === 0) {
    const half = t.length / 2;
    if (t.slice(0, half) === t.slice(half)) return t.slice(0, half);
  }
  return t;
}

function dedupeCategories(list: CategoryItem[]): CategoryItem[] {
  const seen = new Set<string>();
  const out: CategoryItem[] = [];
  for (const c of list) {
    const key = displayCategoryName(c.name).toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ ...c, name: displayCategoryName(c.name) });
  }
  return out;
}

export function CategoryScreen({
  onCategoryPress,
  onHomePress,
  initialMainCategory,
}: CategoryScreenProps) {
  const insets = useSafeAreaInsets();
  const tabNav = useTabNavigation();
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<CategoryItem | null>(null);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [subcategories, setSubcategories] = useState<SubcategoryItem[]>([]);
  const [subcategoriesLoading, setSubcategoriesLoading] = useState(false);
  const [initialCategoryHandled, setInitialCategoryHandled] = useState(false);

  const displayList = useMemo(() => dedupeCategories(categories), [categories]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    CategoryService.getCategories()
      .then((list) => {
        if (!cancelled) setCategories(list);
      })
      .catch(() => {
        if (!cancelled) setCategories([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleCategoryPress = async (category: CategoryItem) => {
    setSelectedCategory(category);
    setFilterModalVisible(true);
    setSubcategoriesLoading(true);
    setSubcategories([]);
    
    try {
      const subs = await CategoryService.getSubcategories(category.id);
      setSubcategories(subs);
    } catch (error) {
      console.error('Error loading subcategories:', error);
      setSubcategories([]);
    } finally {
      setSubcategoriesLoading(false);
    }
  };

  useEffect(() => {
    if (!initialMainCategory || loading || initialCategoryHandled || displayList.length === 0) {
      return;
    }

    const targetName = MAIN_CATEGORY_API_NAMES[initialMainCategory];
    const match = displayList.find(
      (category) =>
        category.name === targetName ||
        displayCategoryName(category.name) === targetName,
    );

    if (match) {
      setInitialCategoryHandled(true);
      void handleCategoryPress(match);
    }
  }, [initialMainCategory, loading, initialCategoryHandled, displayList]);

  const handleApplyFilter = (selectedSubcategoryIds: string[]) => {
    if (!selectedCategory) return;
    const selectedNames = subcategories
      .filter((s) => selectedSubcategoryIds.includes(s.id))
      .map((s) => s.name);
    onCategoryPress(selectedCategory.name, selectedNames.length > 0 ? selectedNames : undefined);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 88 }]}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : displayList.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>კატეგორიები ჯერ არ არის</Text>
          </View>
        ) : (
          <View style={styles.gridContainer}>
            {displayList.map((category) => {
              const imageUrl = category.imageUrl || 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=400';
              
              return (
                <TouchableOpacity
                  key={category.id}
                  style={styles.gridCard}
                  activeOpacity={0.8}
                  onPress={() => handleCategoryPress(category)}
                >
                  <ImageBackground
                    source={{ uri: imageUrl }}
                    style={styles.cardImage}
                    imageStyle={styles.cardImageStyle}
                  >
                    <View style={styles.overlay} />
                  </ImageBackground>
                  <View style={styles.cardContent}>
                    <Text style={styles.gridTitle} numberOfLines={2}>
                      {category.name}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      <CategoryFilterModal
        visible={filterModalVisible}
        categoryName={selectedCategory?.name || ''}
        subcategories={subcategories}
        loading={subcategoriesLoading}
        onClose={() => setFilterModalVisible(false)}
        onApply={handleApplyFilter}
      />

      <BottomNavigation
        activeTab="categories"
        onHomePress={onHomePress}
        onCategoriesPress={undefined}
        onCabinetPress={tabNav.onCabinetPress}
        onCartPress={tabNav.onCartPress}
        onProfilePress={tabNav.onProfilePress}
        cartCount={tabNav.cartCount}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  loadingContainer: {
    paddingVertical: 48,
    alignItems: 'center',
  },
  emptyState: {
    paddingVertical: 36,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.gray[1200],
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingBottom: 16,
  },
  gridCard: {
    width: '48%',
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardImage: {
    width: '100%',
    height: 90,
  },
  cardImageStyle: {
    borderTopLeftRadius: 11,
    borderTopRightRadius: 11,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  cardContent: {
    padding: 10,
    alignItems: 'center',
  },
  gridTitle: {
    fontSize: 11,
    fontWeight: '400',
    color: theme.colors.gray[1100],
    textAlign: 'center',
    lineHeight: 14,
  },
});
