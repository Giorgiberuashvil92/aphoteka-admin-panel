import { ProductCard } from '@/src/components/ui';
import { ProductService } from '@/src/services/product.service';
import { theme } from '@/src/theme';
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Modal, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type SearchResultsScreenProps = {
  searchQuery: string;
  /** კატეგორიის მიხედვით პროდუქტები (ადმინში შექმნილი კატეგორია) */
  initialCategory?: string;
  onBack: () => void;
  onProductPress: (productId: string) => void;
};

type SortOption = 'ყველა' | 'ფასი: ზრდადობით' | 'ფასი: კლებადობით' | 'რეიტინგი' | 'სახელი';

type DisplayMedicine = {
  id: string;
  name: string;
  genericName?: string;
  category: string;
  manufacturer: string;
  price: number;
  oldPrice?: number;
  discountPercentage?: number;
  description: string;
  activeIngredient: string;
  dosage: string;
  form: 'აბი' | 'კაფსულა' | 'სიროფი' | 'კრემი' | 'წვეთები' | 'ინექცია';
  packageSizes: string[];
  prescriptionRequired: boolean;
  stockQuantity: number;
  imageUrl: string;
  rating: number;
  reviewCount: number;
  usage: string;
  sideEffects: string[];
  contraindications: string[];
  storageConditions: string;
  expiryDate: string;
  barcode: string;
};

export function SearchResultsScreen({ searchQuery, initialCategory, onBack, onProductPress }: SearchResultsScreenProps) {
  const [products, setProducts] = useState<DisplayMedicine[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<DisplayMedicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilterModal, setShowFilterModal] = useState(false);

  const [selectedSort, setSelectedSort] = useState<SortOption>('ყველა');
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory || 'ყველა');
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(50);
  /** ფილტრის კატეგორიები API-დან */
  const [filterCategories, setFilterCategories] = useState<string[]>(['ყველა']);

  const mapApiToDisplay = (p: import('@/src/services/product.service').Product): DisplayMedicine => ({
    id: p.id,
    name: p.name,
    genericName: p.genericName?.trim() || undefined,
    category: p.category || '',
    manufacturer: p.manufacturer || '',
    price: p.price ?? 0,
    oldPrice: undefined,
    discountPercentage: undefined,
    description: p.description || '',
    activeIngredient: '',
    dosage: '',
    form: 'აბი',
    packageSizes: ['1 ცალი'],
    prescriptionRequired: false,
    stockQuantity: p.stockQuantity ?? 0,
    imageUrl: p.thumbnail || '',
    rating: p.rating ?? 4.5,
    reviewCount: p.reviewCount ?? 0,
    usage: '',
    sideEffects: [],
    contraindications: [],
    storageConditions: '',
    expiryDate: '',
    barcode: '',
  });

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await ProductService.getProductsFiltered({
        search: searchQuery?.trim() || undefined,
        category: initialCategory?.trim() || undefined,
        page: 1,
        limit: 100,
      });
      setProducts(data.map(mapApiToDisplay));
    } catch (e) {
      console.error('Error loading products:', e);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, initialCategory]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    if (initialCategory) setSelectedCategory(initialCategory);
  }, [initialCategory]);

  useEffect(() => {
    ProductService.getCategories().then((list) => {
      setFilterCategories(['ყველა', ...list.map((c) => c.name)]);
    });
  }, []);

  const applyFilters = useCallback(() => {
    let result = [...products];
    // ტექსტური სერჩი და კატეგორია უკვე API-დან მოდის (getProductsFiltered)

    // Category filter (ფილტრის მოდალიდან)
    if (selectedCategory !== 'ყველა') {
      result = result.filter((product) => product.category === selectedCategory);
    }

    // Price filter
    result = result.filter((product) => product.price >= minPrice && product.price <= maxPrice);

    // Sorting
    switch (selectedSort) {
      case 'ფასი: ზრდადობით':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'ფასი: კლებადობით':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'რეიტინგი':
        result.sort((a, b) => b.rating - a.rating);
        break;
      case 'სახელი':
        result.sort((a, b) => a.name.localeCompare(b.name, 'ka'));
        break;
      default:
        // 'ყველა' - no sorting
        break;
    }

    setFilteredProducts(result);
  }, [products, selectedSort, selectedCategory, minPrice, maxPrice]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const handleApplyFilters = () => {
    setShowFilterModal(false);
    applyFilters();
  };

  const handleResetFilters = () => {
    setSelectedSort('ყველა');
    setSelectedCategory('ყველა');
    setMinPrice(0);
    setMaxPrice(50);
  };

  const sortOptions: SortOption[] = ['ყველა', 'ფასი: ზრდადობით', 'ფასი: კლებადობით', 'რეიტინგი', 'სახელი'];

  const priceRanges = [
    { label: '₾0-₾10', min: 0, max: 10 },
    { label: '₾10-₾20', min: 10, max: 20 },
    { label: '₾20-₾50', min: 20, max: 50 },
    { label: '₾50+', min: 50, max: 1000 },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.white} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>

        <View style={styles.searchInfo}>
          <Ionicons name="search-outline" size={20} color={theme.colors.text.secondary} />
          <Text style={styles.searchQuery} numberOfLines={1}>
            {searchQuery || 'ყველა პროდუქტი'}
          </Text>
        </View>

        <TouchableOpacity onPress={() => setShowFilterModal(true)} style={styles.filterButton}>
          <Ionicons name="options-outline" size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
      </View>

      {/* Results Count & Sort */}
      <View style={styles.resultsBar}>
        <Text style={styles.resultsCount}>
          {filteredProducts.length} პროდუქტი
        </Text>
        <TouchableOpacity
          style={styles.sortButton}
          onPress={() => setShowFilterModal(true)}
        >
          <Ionicons name="swap-vertical" size={16} color={theme.colors.primary} />
          <Text style={styles.sortText}>{selectedSort}</Text>
        </TouchableOpacity>
      </View>

      {/* Products Grid */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : filteredProducts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="search-outline" size={64} color={theme.colors.gray[300]} />
          <Text style={styles.emptyTitle}>პროდუქტი ვერ მოიძებნა</Text>
          <Text style={styles.emptySubtitle}>
            სცადეთ სხვა საძიებო სიტყვა ან შეცვალეთ ფილტრები
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
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
                genericName={item.genericName}
                currentPrice={item.price}
                originalPrice={item.oldPrice}
                discount={item.discountPercentage}
                image={item.imageUrl}
                rating={item.rating}
                reviewCount={item.reviewCount}
                stock={item.stockQuantity}
                description={item.description}
                onPress={() => onProductPress(item.id)}
                showQuickAdd={true}
              />
            </View>
          )}
        />
      )}

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>ფილტრები</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <Ionicons name="close" size={24} color={theme.colors.text.primary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Sort Section */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>დალაგება</Text>
                <View style={styles.optionsGrid}>
                  {sortOptions.map((option) => (
                    <TouchableOpacity
                      key={option}
                      style={[
                        styles.optionChip,
                        selectedSort === option && styles.optionChipActive,
                      ]}
                      onPress={() => setSelectedSort(option)}
                    >
                      <Text
                        style={[
                          styles.optionChipText,
                          selectedSort === option && styles.optionChipTextActive,
                        ]}
                      >
                        {option}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Category Section */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>კატეგორია</Text>
                <View style={styles.optionsGrid}>
                  {filterCategories.map((category) => (
                    <TouchableOpacity
                      key={category}
                      style={[
                        styles.optionChip,
                        selectedCategory === category && styles.optionChipActive,
                      ]}
                      onPress={() => setSelectedCategory(category)}
                    >
                      <Text
                        style={[
                          styles.optionChipText,
                          selectedCategory === category && styles.optionChipTextActive,
                        ]}
                      >
                        {category}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Price Range Section */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>ფასის დიაპაზონი</Text>
                <View style={styles.optionsGrid}>
                  {priceRanges.map((range) => (
                    <TouchableOpacity
                      key={range.label}
                      style={[
                        styles.optionChip,
                        minPrice === range.min &&
                          maxPrice === range.max &&
                          styles.optionChipActive,
                      ]}
                      onPress={() => {
                        setMinPrice(range.min);
                        setMaxPrice(range.max);
                      }}
                    >
                      <Text
                        style={[
                          styles.optionChipText,
                          minPrice === range.min &&
                            maxPrice === range.max &&
                            styles.optionChipTextActive,
                        ]}
                      >
                        {range.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>

            {/* Modal Footer */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.resetButton}
                onPress={handleResetFilters}
              >
                <Text style={styles.resetButtonText}>გასუფთავება</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.applyButton}
                onPress={handleApplyFilters}
              >
                <Text style={styles.applyButtonText}>გამოყენება</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray[100],
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.gray[50],
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    gap: 8,
  },
  searchQuery: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.text.primary,
  },
  filterButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  resultsCount: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: theme.colors.gray[50],
  },
  sortText: {
    fontSize: 13,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 24,
    paddingBottom: 40,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  filterSection: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 16,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  optionChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: theme.colors.gray[50],
    borderWidth: 1,
    borderColor: theme.colors.gray[200],
  },
  optionChipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  optionChipText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    fontWeight: '500',
  },
  optionChipTextActive: {
    color: theme.colors.white,
    fontWeight: '600',
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: theme.colors.gray[100],
  },
  resetButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: theme.colors.gray[100],
    alignItems: 'center',
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  applyButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.white,
  },
});
