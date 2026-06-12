import { ProductCard } from '@/src/components/ui';
import { ProductService } from '@/src/services/product.service';
import { theme } from '@/src/theme';
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type SearchResultsScreenProps = {
  searchQuery: string;
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

const SORT_OPTIONS: SortOption[] = [
  'ყველა',
  'ფასი: ზრდადობით',
  'ფასი: კლებადობით',
  'რეიტინგი',
  'სახელი',
];

const PRICE_RANGES = [
  { label: '₾0–10', min: 0, max: 10 },
  { label: '₾10–20', min: 10, max: 20 },
  { label: '₾20–50', min: 20, max: 50 },
  { label: '₾50+', min: 50, max: 1000 },
];

function pageTitle(searchQuery: string, initialCategory?: string): string {
  if (initialCategory?.trim()) return initialCategory.trim();
  if (searchQuery?.trim()) return searchQuery.trim();
  return 'ყველა პროდუქტი';
}

export function SearchResultsScreen({
  searchQuery,
  initialCategory,
  onBack,
  onProductPress,
}: SearchResultsScreenProps) {
  const insets = useSafeAreaInsets();
  const [products, setProducts] = useState<DisplayMedicine[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<DisplayMedicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilterModal, setShowFilterModal] = useState(false);

  const [selectedSort, setSelectedSort] = useState<SortOption>('ყველა');
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory || 'ყველა');
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(50);
  const [filterCategories, setFilterCategories] = useState<string[]>(['ყველა']);

  const title = useMemo(() => pageTitle(searchQuery, initialCategory), [searchQuery, initialCategory]);
  const subtitle = useMemo(() => {
    if (initialCategory) return 'კატეგორიის პროდუქტები';
    if (searchQuery?.trim()) return 'საძიებო შედეგები';
    return 'აფთიაქის კატალოგი';
  }, [initialCategory, searchQuery]);

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

    if (selectedCategory !== 'ყველა') {
      result = result.filter((product) => product.category === selectedCategory);
    }

    result = result.filter((product) => product.price >= minPrice && product.price <= maxPrice);

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
    setSelectedCategory(initialCategory || 'ყველა');
    setMinPrice(0);
    setMaxPrice(50);
  };

  const listHeader = (
    <View style={styles.listHeader}>
      <View style={styles.intro}>
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>

      <View style={styles.toolbar}>
        <View style={styles.countBadge}>
          <Text style={styles.countBadgeText}>{filteredProducts.length}</Text>
        </View>
        <Text style={styles.resultsCount}>{filteredProducts.length} პროდუქტი</Text>
        <TouchableOpacity
          style={styles.filterBtn}
          onPress={() => setShowFilterModal(true)}
          activeOpacity={0.75}
        >
          <Ionicons name="options-outline" size={18} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.sortRow}
      >
        {SORT_OPTIONS.map((option) => {
          const active = selectedSort === option;
          return (
            <TouchableOpacity
              key={option}
              style={[styles.sortChip, active && styles.sortChipActive]}
              onPress={() => setSelectedSort(option)}
              activeOpacity={0.8}
            >
              <Text style={[styles.sortChipText, active && styles.sortChipTextActive]}>
                {option}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FC" />
      <View style={styles.accentLine} pointerEvents="none" />

      <View style={styles.topBar}>
        <TouchableOpacity onPress={onBack} style={styles.backButton} activeOpacity={0.75}>
          <Ionicons name="chevron-back" size={22} color={theme.colors.gray[1200]} />
        </TouchableOpacity>
        <View style={styles.searchPill}>
          <Ionicons name="search-outline" size={18} color={theme.colors.gray[900]} />
          <Text style={styles.searchPillText} numberOfLines={1}>
            {title}
          </Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : filteredProducts.length === 0 ? (
        <View style={styles.emptyWrap}>
          {listHeader}
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="search-outline" size={28} color={theme.colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>პროდუქტი ვერ მოიძებნა</Text>
            <Text style={styles.emptySubtitle}>
              სცადე სხვა საძიებო სიტყვა ან შეცვალე ფილტრები
            </Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={handleResetFilters}>
              <Text style={styles.emptyBtnText}>ფილტრების გასუფთავება</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => item.id}
          numColumns={2}
          ListHeaderComponent={listHeader}
          contentContainerStyle={[styles.productsList, { paddingBottom: insets.bottom + 24 }]}
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
                showQuickAdd
                variant="grid"
              />
            </View>
          )}
        />
      )}

      <Modal
        visible={showFilterModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>ფილტრები</Text>
              <TouchableOpacity
                onPress={() => setShowFilterModal(false)}
                style={styles.modalClose}
                hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
              >
                <Ionicons name="close" size={22} color={theme.colors.gray[1200]} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>დალაგება</Text>
                <View style={styles.optionsGrid}>
                  {SORT_OPTIONS.map((option) => (
                    <TouchableOpacity
                      key={option}
                      style={[styles.optionChip, selectedSort === option && styles.optionChipActive]}
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

              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>ფასის დიაპაზონი</Text>
                <View style={styles.optionsGrid}>
                  {PRICE_RANGES.map((range) => {
                    const active = minPrice === range.min && maxPrice === range.max;
                    return (
                      <TouchableOpacity
                        key={range.label}
                        style={[styles.optionChip, active && styles.optionChipActive]}
                        onPress={() => {
                          setMinPrice(range.min);
                          setMaxPrice(range.max);
                        }}
                      >
                        <Text
                          style={[styles.optionChipText, active && styles.optionChipTextActive]}
                        >
                          {range.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.resetButton} onPress={handleResetFilters}>
                <Text style={styles.resetButtonText}>გასუფთავება</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.applyButton} onPress={handleApplyFilters}>
                <Text style={styles.applyButtonText}>გამოყენება</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FC',
  },
  accentLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: theme.colors.primary,
    opacity: 0.85,
    zIndex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: theme.colors.white,
    borderWidth: 1.5,
    borderColor: theme.colors.gray[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 46,
    borderRadius: 14,
    backgroundColor: theme.colors.white,
    borderWidth: 1.5,
    borderColor: theme.colors.gray[500],
    paddingHorizontal: 14,
  },
  searchPillText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.gray[1200],
  },
  listHeader: {
    marginBottom: 6,
  },
  intro: {
    marginBottom: 14,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.gray[1200],
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.gray[1000],
    lineHeight: 20,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  countBadge: {
    minWidth: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: theme.colors.purple[100],
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  countBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  resultsCount: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.gray[1100],
  },
  filterBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: theme.colors.white,
    borderWidth: 1.5,
    borderColor: theme.colors.purple[300],
    alignItems: 'center',
    justifyContent: 'center',
  },
  sortRow: {
    gap: 8,
    paddingBottom: 14,
  },
  sortChip: {
    backgroundColor: theme.colors.white,
    borderWidth: 1.5,
    borderColor: theme.colors.gray[500],
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  sortChipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  sortChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.gray[1100],
  },
  sortChipTextActive: {
    color: theme.colors.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyWrap: {
    flex: 1,
    paddingHorizontal: 20,
  },
  emptyState: {
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: theme.colors.gray[500],
    backgroundColor: theme.colors.white,
    paddingVertical: 36,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  emptyIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.purple[100],
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.gray[1200],
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: theme.colors.gray[1000],
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  emptyBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: theme.colors.purple[100],
  },
  emptyBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  productsList: {
    paddingHorizontal: 20,
    paddingTop: 4,
  },
  productsRow: {
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 12,
  },
  productCardWrapper: {
    width: '48%',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#F8F9FC',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    maxHeight: '88%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.gray[1200],
  },
  modalClose: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: theme.colors.white,
    borderWidth: 1.5,
    borderColor: theme.colors.gray[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterSection: {
    paddingHorizontal: 20,
    marginBottom: 22,
  },
  filterSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.gray[1100],
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 12,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: theme.colors.white,
    borderWidth: 1.5,
    borderColor: theme.colors.gray[500],
  },
  optionChipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  optionChipText: {
    fontSize: 13,
    color: theme.colors.gray[1100],
    fontWeight: '600',
  },
  optionChipTextActive: {
    color: theme.colors.white,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1.5,
    borderTopColor: theme.colors.gray[500],
  },
  resetButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: theme.colors.white,
    borderWidth: 1.5,
    borderColor: theme.colors.gray[500],
    alignItems: 'center',
  },
  resetButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.gray[1200],
  },
  applyButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: { elevation: 2 },
    }),
  },
  applyButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.white,
  },
});
