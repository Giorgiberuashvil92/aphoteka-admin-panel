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

export function CategoryScreen({ onSearch, onCategoryPress, onHomePress, onMyOrderPress, onFavoritePress, onProfilePress, onCartPress }: CategoryScreenProps) {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);

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
        {/* Categories Grid */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : (
          <View style={styles.categoriesGrid}>
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={styles.categoryCard}
                onPress={() => onCategoryPress(category.name)}
              >
                <View style={[styles.categoryIconContainer, { backgroundColor: category.color || DEFAULT_COLOR }]}>
                  <Ionicons name={(category.icon as any) || DEFAULT_ICON} size={32} color={theme.colors.primary} />
                </View>
                <Text style={styles.categoryName} numberOfLines={2}>{category.name}</Text>
                <Text style={styles.categoryCount}>{category.productCount} პროდუქტი</Text>
              </TouchableOpacity>
            ))}
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
    backgroundColor: theme.colors.white,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 20,
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  categoryCard: {
    width: '47%',
    backgroundColor: theme.colors.white,
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    height: 160,
    borderWidth: 1,
    borderColor: theme.colors.gray[100],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: 4,
  },
  categoryCount: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
});
