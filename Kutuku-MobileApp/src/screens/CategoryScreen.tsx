import { AversiHeader } from '@/src/components/common/AversiHeader';
import { BottomNavigation } from '@/src/components/common/BottomNavigation';
import { CategoryService } from '@/src/services/category.service';
import type { CategoryItem } from '@/src/services/category.service';
import { theme } from '@/src/theme';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type CategoryScreenProps = {
  onSearch: () => void;
  /** გადაეცემა კატეგორიის სახელი (ნავიგაცია პროდუქტების სიაზე) */
  onCategoryPress: (categoryName: string) => void;
  onHomePress: () => void;
  onMyOrderPress: () => void;
  onFavoritePress?: () => void;
  onProfilePress?: () => void;
  onCartPress?: () => void;
};

const DEFAULT_COLOR = '#E8F5E9';
const DEFAULT_ICON = 'folder';
const CATEGORY_GRADIENTS = ['#EAF2FF', '#EEF7FF', '#EFFFF4', '#FFF4E8', '#F6EEFF', '#ECFFFC'];

const getCategoryVisual = (category: CategoryItem, index: number) => {
  const name = category.name.toLowerCase();
  if (name.includes('ვიტამ')) return { icon: 'nutrition-outline', accent: '#DFF4E6' };
  if (name.includes('გერმან') || name.includes('ბრენ')) return { icon: 'ribbon-outline', accent: '#EDEBFF' };
  if (name.includes('ბავშვ')) return { icon: 'happy-outline', accent: '#FFEEDB' };
  if (name.includes('ანტისეპ')) return { icon: 'medkit-outline', accent: '#E8F6FF' };
  return {
    icon: (category.icon as string) || DEFAULT_ICON,
    accent: CATEGORY_GRADIENTS[index % CATEGORY_GRADIENTS.length],
  };
};
const hexToRgba = (hex: string, alpha: number) => {
  const normalized = hex.replace('#', '');
  if (normalized.length !== 6) return `rgba(232,245,233,${alpha})`;
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
};

export function CategoryScreen({ onSearch, onCategoryPress, onHomePress, onMyOrderPress, onFavoritePress, onProfilePress, onCartPress }: CategoryScreenProps) {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const topCategoryNames = categories.slice(0, 3).map((c) => c.name);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    CategoryService.getCategories()
      .then((list) => {
        if (!cancelled) setCategories(list);
      })
      .catch((e) => {
        if (!cancelled) setCategories([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.white} />
      
      {/* Aversi Header */}
      <AversiHeader 
        onSearchPress={onSearch}
      />

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          <View style={styles.heroGlowOne} />
          <View style={styles.heroGlowTwo} />
          <View>
            <Text style={styles.heroTitle}>კატეგორიები</Text>
            <Text style={styles.heroSubtitle}>აირჩიე სასურველი მიმართულება და სწრაფად იპოვე პროდუქტი</Text>
          </View>
          <TouchableOpacity style={styles.heroAction} onPress={onMyOrderPress}>
            <Ionicons name="receipt-outline" size={16} color={theme.colors.primary} />
            <Text style={styles.heroActionText}>ჩემი შეკვეთები</Text>
          </TouchableOpacity>
        </View>

        {!loading && categories.length > 0 && (
          <>
            <View style={styles.metaRow}>
              <Text style={styles.metaTitle}>პოპულარული მიმართულებები</Text>
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{categories.length} კატეგორია</Text>
              </View>
            </View>
            <View style={styles.quickTagsRow}>
              {topCategoryNames.map((name) => (
                <TouchableOpacity
                  key={name}
                  style={styles.quickTag}
                  activeOpacity={0.85}
                  onPress={() => onCategoryPress(name)}
                >
                  <Text style={styles.quickTagText} numberOfLines={1}>{name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : categories.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="grid-outline" size={28} color={theme.colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>კატეგორიები ჯერ არ არის</Text>
            <Text style={styles.emptyText}>ცოტა ხანში სცადე თავიდან, მონაცემები ახლდება.</Text>
          </View>
        ) : (
          <View style={styles.categoriesGrid}>
            {categories.map((category, index) => {
              const visual = getCategoryVisual(category, index);
              return (
                <TouchableOpacity
                  key={category.id}
                  style={styles.categoryCard}
                  activeOpacity={0.9}
                  onPress={() => onCategoryPress(category.name)}
                >
                  <View style={[styles.categoryTopArea, { backgroundColor: hexToRgba(category.color || DEFAULT_COLOR, 0.2) }]}>
                    <View style={[styles.categoryTopGlow, { backgroundColor: hexToRgba(category.color || DEFAULT_COLOR, 0.35) }]} />
                    <View style={[styles.categorySoftLayer, { backgroundColor: visual.accent }]} />
                    <View style={[styles.categoryIconContainer, { backgroundColor: category.color || DEFAULT_COLOR }]}>
                      <Ionicons name={visual.icon as any} size={30} color={theme.colors.primary} />
                    </View>
                  </View>
                  <View style={styles.cardBody}>
                    <Text style={styles.categoryName} numberOfLines={2}>{category.name}</Text>
                    <View style={styles.cardFooter}>
                      <View style={styles.categoryCountBadge}>
                        <Text style={styles.categoryCount}>{category.productCount} პროდუქტი</Text>
                      </View>
                      <View style={styles.cardChevronWrap}>
                        <Ionicons name="chevron-forward" size={14} color={theme.colors.primary} />
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Bottom Navigation */}
      <BottomNavigation
        activeTab="categories"
        onHomePress={onHomePress}
        onWishlistPress={onFavoritePress}
        onCategoriesPress={undefined}
        onCartPress={onCartPress}
        onProfilePress={onProfilePress}
        wishlistCount={0}
        cartCount={0}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFBFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 28,
  },
  heroCard: {
    borderRadius: 16,
    padding: 12,
    backgroundColor: '#F5F9FF',
    borderWidth: 1,
    borderColor: '#D9E8FF',
    marginBottom: 10,
    gap: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  heroGlowOne: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(71,122,255,0.12)',
    top: -80,
    right: -50,
  },
  heroGlowTwo: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(71,122,255,0.08)',
    bottom: -52,
    left: -30,
  },
  heroTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  heroSubtitle: {
    fontSize: 12,
    lineHeight: 17,
    color: theme.colors.text.secondary,
  },
  heroAction: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: '#DCEAFE',
  },
  heroActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  metaRow: {
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metaTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  countBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: '#EEF3FF',
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  quickTagsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  quickTag: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DDE7FF',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    maxWidth: '33%',
  },
  quickTagText: {
    fontSize: 11,
    color: '#3E4A66',
    fontWeight: '600',
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.gray[100],
    backgroundColor: theme.colors.white,
    paddingVertical: 36,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  emptyIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#EEF3FF',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 10,
    overflow: 'hidden',
    minHeight: 148,
    borderWidth: 1,
    borderColor: theme.colors.gray[100],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  categoryTopArea: {
    width: '100%',
    height: 64,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  categoryTopGlow: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    top: -48,
    right: -22,
  },
  categorySoftLayer: {
    position: 'absolute',
    width: 84,
    height: 84,
    borderRadius: 42,
    bottom: -24,
    left: -20,
  },
  categoryIconContainer: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardBody: {
    flex: 1,
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 9,
  },
  categoryName: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.text.primary,
    textAlign: 'left',
    lineHeight: 17,
    minHeight: 35,
  },
  cardFooter: {
    marginTop: 'auto',
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 6,
  },
  categoryCountBadge: {
    backgroundColor: '#F3F7FF',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  cardChevronWrap: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EDF3FF',
  },
  categoryCount: {
    fontSize: 10,
    color: '#566384',
    fontWeight: '600',
  },
});
