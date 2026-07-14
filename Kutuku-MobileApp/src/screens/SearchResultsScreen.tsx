import { BottomNavigation } from '@/src/components/common/BottomNavigation';
import { ProductFilterSheet } from '@/src/components/common/ProductFilterSheet';
import { ProductCard } from '@/src/components/ui';
import { useTabNavigation } from '@/src/hooks/useTabNavigation';
import {
  filterFieldsService,
  type FilterField,
  type ProductFilterValues,
} from '@/src/services/filter-fields.service';
import { ProductService } from '@/src/services/product.service';
import type { Product } from '@/src/services/product.service';
import { theme } from '@/src/theme';
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type SearchResultsScreenProps = {
  searchQuery: string;
  initialCategory?: string;
  initialSubcategories?: string[];
  onBack: () => void;
  onProductPress: (productId: string) => void;
};

type SortOption = 'პოპულარობით' | 'ფასი: ზრდადობით' | 'ფასი: კლებადობით' | 'სახელი';

const SORT_OPTIONS: SortOption[] = [
  'პოპულარობით',
  'ფასი: ზრდადობით',
  'ფასი: კლებადობით',
  'სახელი',
];

export function SearchResultsScreen({
  searchQuery,
  initialCategory,
  initialSubcategories = [],
  onBack,
  onProductPress,
}: SearchResultsScreenProps) {
  const insets = useSafeAreaInsets();
  const tabNav = useTabNavigation();
  const [query, setQuery] = useState(searchQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(searchQuery);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSort, setSelectedSort] = useState<SortOption>('პოპულარობით');
  const [activeSubcategories, setActiveSubcategories] = useState<string[]>(initialSubcategories);
  const [filterFields, setFilterFields] = useState<FilterField[]>([]);
  const [attributeFilters, setAttributeFilters] = useState<ProductFilterValues>({});
  const [showSortModal, setShowSortModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);

  useEffect(() => {
    filterFieldsService.getActive().then(setFilterFields);
  }, []);

  useEffect(() => {
    setActiveSubcategories(initialSubcategories);
  }, [initialSubcategories]);

  useEffect(() => {
    setQuery(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 350);
    return () => clearTimeout(timer);
  }, [query]);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const subcategoryParam =
        activeSubcategories.length > 0
          ? activeSubcategories.join(',')
          : undefined;
      const { data } = await ProductService.getProductsFiltered({
        search: debouncedQuery?.trim() || undefined,
        category: initialCategory?.trim() || undefined,
        subcategory: subcategoryParam,
        filters:
          Object.keys(attributeFilters).length > 0 ? attributeFilters : undefined,
        page: 1,
        limit: 100,
      });
      setProducts(data);
    } catch (e) {
      console.error('Error loading products:', e);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedQuery, initialCategory, attributeFilters, activeSubcategories]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const filteredProducts = useMemo(() => {
    const result = [...products];

    switch (selectedSort) {
      case 'ფასი: ზრდადობით':
        result.sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
        break;
      case 'ფასი: კლებადობით':
        result.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
        break;
      case 'სახელი':
        result.sort((a, b) => a.name.localeCompare(b.name, 'ka'));
        break;
      default:
        result.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
        break;
    }

    return result;
  }, [products, selectedSort]);

  const removeAttributeFilter = (key: string, value?: string) => {
    setAttributeFilters((prev) => {
      const next = { ...prev };
      if (!value) {
        delete next[key];
        return next;
      }
      const current = next[key];
      if (Array.isArray(current)) {
        const filtered = current.filter((v) => v !== value);
        if (filtered.length === 0) delete next[key];
        else next[key] = filtered;
      } else if (current === value) {
        delete next[key];
      }
      return next;
    });
  };

  const categoryTitle =
    activeSubcategories.length > 0
      ? activeSubcategories.join(' · ')
      : initialCategory?.trim() || '';

  const attributeChips = useMemo(() => {
    const chips: { id: string; label: string; onRemove: () => void }[] = [];
    for (const [key, value] of Object.entries(attributeFilters)) {
      const field = filterFields.find((f) => f.key === key);
      const prefix = field?.label ? `${field.label}: ` : '';
      if (Array.isArray(value)) {
        value.forEach((v) => {
          chips.push({
            id: `${key}-${v}`,
            label: `${prefix}${v}`,
            onRemove: () => removeAttributeFilter(key, v),
          });
        });
      } else if (typeof value === 'boolean') {
        chips.push({
          id: key,
          label: `${prefix}${value ? 'კი' : 'არა'}`,
          onRemove: () => removeAttributeFilter(key),
        });
      } else {
        chips.push({
          id: key,
          label: `${prefix}${value}`,
          onRemove: () => removeAttributeFilter(key),
        });
      }
    }
    return chips;
  }, [attributeFilters, filterFields]);

  const activeFilterCount = activeSubcategories.length + attributeChips.length;

  const listHeader = (
    <View style={styles.listHeaderWrap}>
      <Text style={styles.resultCount} numberOfLines={1}>
        {loading ? '…' : `${filteredProducts.length} პროდუქტი`}
        {attributeChips.length > 0
          ? ` · ${attributeChips.map((c) => c.label).join(', ')}`
          : ''}
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={onBack} style={styles.backButton} activeOpacity={0.75}>
            <Ionicons name="chevron-back" size={24} color="#2A3A7A" />
          </TouchableOpacity>
          {categoryTitle ? (
            <Text style={styles.headerTitle} numberOfLines={1}>
              {categoryTitle}
            </Text>
          ) : (
            <View style={styles.headerTitleSpacer} />
          )}
          {attributeChips.length > 0 ? (
            <TouchableOpacity
              onPress={() => setAttributeFilters({})}
              hitSlop={8}
              activeOpacity={0.7}
              style={styles.headerAction}
            >
              <Text style={styles.headerActionText}>გასუფთავება</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.headerActionSpacer} />
          )}
        </View>

        <View style={styles.searchPill}>
          <Ionicons name="search-outline" size={18} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder={categoryTitle ? 'ძიება ამ კატეგორიაში...' : 'ძიება...'}
            placeholderTextColor="#9CA3AF"
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
          />
          {query.length > 0 ? (
            <TouchableOpacity
              onPress={() => setQuery('')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close-circle" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          ) : null}
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
            <Ionicons name="search-outline" size={32} color={theme.colors.primary} />
            <Text style={styles.emptyTitle}>პროდუქტი ვერ მოიძებნა</Text>
            <Text style={styles.emptySubtitle}>სცადე სხვა ფილტრი ან ფილტრის მოხსნა</Text>
          </View>
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => item.id}
          numColumns={2}
          ListHeaderComponent={listHeader}
          style={styles.productsFlatList}
          contentContainerStyle={[
            styles.productsList,
            { paddingBottom: insets.bottom + 150 },
          ]}
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
                image={item.thumbnail}
                rating={item.rating}
                reviewCount={item.reviewCount}
                stock={item.stockQuantity}
                description={item.description}
                countryOfOrigin={item.countryOfOrigin}
                onPress={() => onProductPress(item.id)}
                showQuickAdd
                variant="catalog"
              />
            </View>
          )}
        />
      )}

      <View style={[styles.floatingBar, { bottom: insets.bottom + 100 }]}>
        <TouchableOpacity
          style={styles.floatingBarBtn}
          onPress={() => setShowSortModal(true)}
          activeOpacity={0.85}
        >
          <Ionicons name="swap-vertical" size={18} color={theme.colors.white} />
          <Text style={styles.floatingBarText}>სორტირება</Text>
        </TouchableOpacity>
        <View style={styles.floatingBarDivider} />
        <TouchableOpacity
          style={styles.floatingBarBtn}
          onPress={() => setShowFilterModal(true)}
          activeOpacity={0.85}
        >
          <Ionicons name="funnel-outline" size={18} color={theme.colors.white} />
          <Text style={styles.floatingBarText}>ფილტრი</Text>
          {activeFilterCount > 0 ? (
            <View style={styles.floatingBadge}>
              <Text style={styles.floatingBadgeText}>{activeFilterCount}</Text>
            </View>
          ) : null}
        </TouchableOpacity>
      </View>

      <BottomNavigation
        activeTab="categories"
        onHomePress={tabNav.onHomePress}
        onCategoriesPress={tabNav.onCategoriesPress}
        onCabinetPress={tabNav.onCabinetPress}
        onCartPress={tabNav.onCartPress}
        onProfilePress={tabNav.onProfilePress}
        cartCount={tabNav.cartCount}
      />

      <Modal
        visible={showSortModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSortModal(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setShowSortModal(false)}>
          <View style={[styles.sortSheet, { paddingBottom: insets.bottom + 16 }]}>
            <Text style={styles.sheetTitle}>სორტირება</Text>
            {SORT_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option}
                style={styles.sheetOption}
                onPress={() => {
                  setSelectedSort(option);
                  setShowSortModal(false);
                }}
              >
                <Text
                  style={[
                    styles.sheetOptionText,
                    selectedSort === option && styles.sheetOptionTextActive,
                  ]}
                >
                  {option}
                </Text>
                {selectedSort === option && (
                  <Ionicons name="checkmark" size={18} color={theme.colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>

      <ProductFilterSheet
        visible={showFilterModal}
        fields={filterFields}
        values={attributeFilters}
        onClose={() => setShowFilterModal(false)}
        onApply={(values) => {
          setAttributeFilters(values);
          setShowFilterModal(false);
        }}
        onClear={() => {
          setAttributeFilters({});
          setShowFilterModal(false);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingHorizontal: 12,
    paddingBottom: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#EEF0F3',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 40,
    marginBottom: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    color: '#1A1A2E',
    textAlign: 'center',
    paddingHorizontal: 4,
  },
  headerTitleSpacer: {
    flex: 1,
  },
  headerAction: {
    paddingHorizontal: 4,
    minWidth: 36,
    alignItems: 'flex-end',
  },
  headerActionSpacer: {
    width: 36,
  },
  headerActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2A3A7A',
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F2F3F5',
    paddingHorizontal: 14,
  },
  searchPillText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '400',
    color: '#9CA3AF',
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '400',
    color: '#1A1A2E',
    padding: 0,
  },
  listHeaderWrap: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 6,
  },
  resultCount: {
    fontSize: 13,
    fontWeight: '500',
    color: '#8B8C8E',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  emptyWrap: {
    flex: 1,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A2E',
  },
  emptySubtitle: {
    fontSize: 13,
    fontWeight: '400',
    color: '#9CA3AF',
    textAlign: 'center',
  },
  productsFlatList: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  productsList: {
    paddingHorizontal: 16,
    paddingTop: 0,
  },
  productsRow: {
    justifyContent: 'space-between',
    marginBottom: 6,
    gap: 10,
  },
  productCardWrapper: {
    width: '47.5%',
  },
  floatingBar: {
    position: 'absolute',
    left: 20,
    right: 20,
    flexDirection: 'row',
    backgroundColor: '#2A3A7A',
    borderRadius: 28,
    paddingVertical: 13,
    shadowColor: '#2A3A7A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  floatingBarBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  floatingBarText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.white,
  },
  floatingBarDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  floatingBadge: {
    minWidth: 18,
    height: 18,
    paddingHorizontal: 5,
    borderRadius: 9,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2A3A7A',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sortSheet: {
    backgroundColor: theme.colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  filterSheet: {
    backgroundColor: theme.colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D1D5DB',
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.gray[1200],
    marginBottom: 16,
  },
  sheetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  sheetOptionText: {
    fontSize: 15,
    color: theme.colors.gray[1200],
  },
  sheetOptionTextActive: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  noFiltersText: {
    fontSize: 14,
    color: theme.colors.gray[1000],
    marginBottom: 16,
  },
  sheetChipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  sheetChipText: {
    fontSize: 15,
    color: theme.colors.gray[1200],
  },
  clearFiltersBtn: {
    marginTop: 20,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#E8EEF8',
    alignItems: 'center',
  },
  clearFiltersText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary,
  },
});
