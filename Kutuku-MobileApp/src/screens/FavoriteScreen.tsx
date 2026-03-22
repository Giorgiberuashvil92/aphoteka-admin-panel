import { BottomNavigation } from '@/src/components/common/BottomNavigation';
import { ProductCard } from '@/src/components/ui';
import { useCart, useFavorites } from '@/src/contexts';
import { theme } from '@/src/theme';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { FlatList, SafeAreaView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

type FavoriteScreenProps = {
  onSearch: () => void;
  onCategories: () => void;
  onProductPress: (productId: string) => void;
  onHomePress: () => void;
  onMyOrderPress: () => void;
  onProfilePress?: () => void;
  onCartPress?: () => void;
};

type SortOption = 'ყველა' | 'ფასი: ზრდადობით' | 'ფასი: კლებადობით' | 'რეიტინგი' | 'სახელი';

export function FavoriteScreen({ 
  onSearch, 
  onCategories, 
  onProductPress, 
  onHomePress, 
  onMyOrderPress, 
  onProfilePress, 
  onCartPress,
}: FavoriteScreenProps) {
  const { favorites, favoriteCount, clearFavorites } = useFavorites();
  const { itemCount } = useCart();
  const [filteredFavorites, setFilteredFavorites] = useState(favorites);
  const [selectedSort, setSelectedSort] = useState<SortOption>('ყველა');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    applyFilters();
  }, [favorites, selectedSort, searchQuery]);

  const applyFilters = () => {
    let result = [...favorites];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (item) =>
          item.name.toLowerCase().includes(query) ||
          item.category?.toLowerCase().includes(query)
      );
    }

    // Sorting
    switch (selectedSort) {
      case 'ფასი: ზრდადობით':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'ფასი: კლებადობით':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'რეიტინგი':
        result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'სახელი':
        result.sort((a, b) => a.name.localeCompare(b.name, 'ka'));
        break;
      default:
        // 'ყველა' - keep original order
        break;
    }

    setFilteredFavorites(result);
  };

  const sortOptions: SortOption[] = ['ყველა', 'ფასი: ზრდადობით', 'ფასი: კლებადობით', 'რეიტინგი', 'სახელი'];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.white} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>ფავორიტები</Text>
        {favoriteCount > 0 && (
          <TouchableOpacity onPress={clearFavorites}>
            <Text style={styles.clearButton}>გასუფთავება</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color={theme.colors.text.tertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder="ძებნა ფავორიტებში..."
            placeholderTextColor={theme.colors.text.tertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={theme.colors.text.tertiary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Sort Options */}
      {favoriteCount > 0 && (
        <View style={styles.sortContainer}>
          <Text style={styles.resultsCount}>{filteredFavorites.length} პროდუქტი</Text>
          <View style={styles.sortOptions}>
            {sortOptions.map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.sortChip,
                  selectedSort === option && styles.sortChipActive,
                ]}
                onPress={() => setSelectedSort(option)}
              >
                <Text
                  style={[
                    styles.sortChipText,
                    selectedSort === option && styles.sortChipTextActive,
                  ]}
                >
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Favorites List */}
      {favoriteCount === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="heart-outline" size={80} color={theme.colors.gray[300]} />
          <Text style={styles.emptyTitle}>ფავორიტები ცარიელია</Text>
          <Text style={styles.emptySubtitle}>
            დაამატეთ პროდუქტები ფავორიტებში რომ შეინახოთ მოგვიანებით
          </Text>
          <TouchableOpacity style={styles.browseButton} onPress={onHomePress}>
            <Text style={styles.browseButtonText}>პროდუქტების დათვალიერება</Text>
          </TouchableOpacity>
        </View>
      ) : filteredFavorites.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="search-outline" size={64} color={theme.colors.gray[300]} />
          <Text style={styles.emptyTitle}>პროდუქტი ვერ მოიძებნა</Text>
          <Text style={styles.emptySubtitle}>
            სცადეთ სხვა საძიებო სიტყვა
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredFavorites}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.productsList}
          columnWrapperStyle={styles.productsRow}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={styles.productCardWrapper}>
              <ProductCard
                id={item.id}
                name={item.name}
                currentPrice={item.price}
                originalPrice={item.originalPrice}
                discount={item.discount}
                image={item.image}
                rating={item.rating}
                reviewCount={item.reviewCount}
                stock={item.stock}
                onPress={() => onProductPress(item.id)}
                showQuickAdd={true}
              />
            </View>
          )}
        />
      )}

      {/* Bottom Navigation */}
      <BottomNavigation
        activeTab="wishlist"
        onHomePress={onHomePress}
        onWishlistPress={undefined}
        onCategoriesPress={onCategories}
        onCartPress={onCartPress}
        onProfilePress={onProfilePress}
        wishlistCount={favoriteCount}
        cartCount={itemCount}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.white,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray[100],
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  clearButton: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.gray[50],
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.text.primary,
  },
  sortContainer: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  resultsCount: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 12,
  },
  sortOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sortChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: theme.colors.gray[50],
    borderWidth: 1,
    borderColor: theme.colors.gray[200],
  },
  sortChipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  sortChipText: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    fontWeight: '500',
  },
  sortChipTextActive: {
    color: theme.colors.white,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginTop: 24,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  browseButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: theme.colors.primary,
  },
  browseButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.white,
  },
  productsList: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
  },
  productsRow: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  productCardWrapper: {
    width: '48%',
  },
});
