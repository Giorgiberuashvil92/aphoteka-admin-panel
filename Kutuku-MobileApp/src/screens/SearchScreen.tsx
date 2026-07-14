import { searchHistoryService } from '@/src/services/searchHistory.service';
import { ProductService, type Product } from '@/src/services/product.service';
import { theme } from '@/src/theme';
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

type SearchScreenProps = {
  onBack: () => void;
  onSearch: (query: string) => void;
  onProductPress?: (productId: string) => void;
};

const POPULAR_SEARCHES = [
  'ვიტამინი C',
  'ომეპრაზოლი',
  'სურდო',
  'პარაცეტამოლი',
  'მაგნიუმი',
  'ომეგა 3',
];

const SUGGEST_LIMIT = 8;
const DEBOUNCE_MS = 300;
const MIN_QUERY_LEN = 2;

export function SearchScreen({
  onBack,
  onSearch,
  onProductPress,
}: SearchScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const requestIdRef = useRef(0);

  const loadHistory = useCallback(async () => {
    const list = await searchHistoryService.getHistory();
    setSearchHistory(list);
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery.trim()), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    if (debouncedQuery.length < MIN_QUERY_LEN) {
      setSuggestions([]);
      setSuggestLoading(false);
      return;
    }

    const reqId = ++requestIdRef.current;
    setSuggestLoading(true);

    void ProductService.getProductsFiltered({
      search: debouncedQuery,
      page: 1,
      limit: SUGGEST_LIMIT,
    })
      .then(({ data }) => {
        if (reqId !== requestIdRef.current) return;
        setSuggestions(data);
      })
      .catch(() => {
        if (reqId !== requestIdRef.current) return;
        setSuggestions([]);
      })
      .finally(() => {
        if (reqId !== requestIdRef.current) return;
        setSuggestLoading(false);
      });
  }, [debouncedQuery]);

  const handleSearchItemPress = (item: string) => {
    setSearchQuery(item);
    void searchHistoryService.addToHistory(item);
    onSearch(item);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setSuggestions([]);
  };

  const handleSearch = (query: string) => {
    if (query.trim()) {
      void searchHistoryService.addToHistory(query);
      onSearch(query);
    }
  };

  const handleClearHistory = async () => {
    await searchHistoryService.clearHistory();
    setSearchHistory([]);
  };

  const handleSuggestionPress = (product: Product) => {
    void searchHistoryService.addToHistory(searchQuery.trim() || product.name);
    onProductPress?.(product.id);
  };

  const showSuggestions = debouncedQuery.length >= MIN_QUERY_LEN;
  const showBrowseSections = !showSuggestions;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.white} />

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.searchHeader}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={20} color={theme.colors.text.tertiary} />
            <TextInput
              style={styles.searchInput}
              placeholder="მედიკამენტი, ბრენდი ან სიმპტომი"
              placeholderTextColor={theme.colors.text.tertiary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={() => handleSearch(searchQuery)}
              autoFocus
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={handleClearSearch} style={styles.clearInputButton}>
                <Ionicons name="close" size={16} color={theme.colors.text.secondary} />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity onPress={onBack}>
            <Text style={styles.cancelButton}>გაუქმება</Text>
          </TouchableOpacity>
        </View>

        {showSuggestions ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>შეთავაზებები</Text>
              {suggestLoading ? (
                <ActivityIndicator size="small" color={theme.colors.primary} />
              ) : null}
            </View>

            {suggestions.length === 0 && !suggestLoading ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>შედეგი ვერ მოიძებნა</Text>
                <Text style={styles.emptySubtitle}>
                  სცადე სხვა სიტყვა ან გახსენი სრული შედეგები.
                </Text>
              </View>
            ) : (
              <View style={styles.suggestionsCard}>
                {suggestions.map((product, index) => (
                  <TouchableOpacity
                    key={product.id}
                    style={[
                      styles.suggestionItem,
                      index === suggestions.length - 1 && styles.suggestionItemLast,
                    ]}
                    onPress={() => handleSuggestionPress(product)}
                    activeOpacity={0.85}
                  >
                    <Image
                      source={{ uri: product.thumbnail }}
                      style={styles.suggestionThumb}
                    />
                    <View style={styles.suggestionTextWrap}>
                      <Text style={styles.suggestionName} numberOfLines={2}>
                        {product.name}
                      </Text>
                      <Text style={styles.suggestionPrice}>
                        {Number(product.price ?? 0).toFixed(2)} ₾
                      </Text>
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={18}
                      color={theme.colors.text.tertiary}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <TouchableOpacity
              style={styles.seeAllButton}
              onPress={() => handleSearch(searchQuery)}
              activeOpacity={0.85}
            >
              <Text style={styles.seeAllButtonText}>ყველა შედეგი</Text>
              <Ionicons name="arrow-forward" size={16} color={theme.colors.white} />
            </TouchableOpacity>
          </View>
        ) : null}

        {showBrowseSections ? (
          <>
            <View style={styles.quickActionsCard}>
              <View style={styles.quickActionsHeader}>
                <Text style={styles.quickActionsTitle}>პოპულარული ძიებები</Text>
                <Ionicons name="sparkles-outline" size={16} color={theme.colors.primary} />
              </View>
              <View style={styles.tagsWrap}>
                {POPULAR_SEARCHES.map((tag) => (
                  <TouchableOpacity
                    key={tag}
                    style={styles.tagChip}
                    onPress={() => handleSearchItemPress(tag)}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.tagChipText}>{tag}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {searchHistory.length > 0 ? (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>ბოლო მოძიებული</Text>
                  <TouchableOpacity onPress={() => void handleClearHistory()}>
                    <Text style={styles.clearAllText}>გასუფთავება</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.historyCard}>
                  {searchHistory.map((item, index) => (
                    <TouchableOpacity
                      key={`${item}-${index}`}
                      style={[
                        styles.historyItem,
                        index === searchHistory.length - 1 && styles.historyItemLast,
                      ]}
                      onPress={() => handleSearchItemPress(item)}
                      activeOpacity={0.85}
                    >
                      <View style={styles.historyLeft}>
                        <View style={styles.historyIconBadge}>
                          <Ionicons
                            name="time-outline"
                            size={16}
                            color={theme.colors.primary}
                          />
                        </View>
                        <Text style={styles.historyText}>{item}</Text>
                      </View>
                      <Ionicons
                        name="arrow-forward"
                        size={18}
                        color={theme.colors.text.tertiary}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ) : (
              <View style={styles.emptyState}>
                <View style={styles.emptyIconBadge}>
                  <Ionicons name="search-outline" size={24} color={theme.colors.primary} />
                </View>
                <Text style={styles.emptyTitle}>მოძიების ისტორია ჯერ ცარიელია</Text>
                <Text style={styles.emptySubtitle}>
                  პოპულარული ტეგებიდან აირჩიე ან დაიწყე ძიება ზემოდან.
                </Text>
              </View>
            )}
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFF',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 28,
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF2FA',
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F5FB',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: '#E6ECF6',
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: theme.colors.text.primary,
  },
  clearInputButton: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E9EEF8',
  },
  cancelButton: {
    fontSize: 15,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  quickActionsCard: {
    marginTop: 14,
    marginHorizontal: 16,
    borderRadius: 16,
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: '#EAF0FB',
    padding: 14,
  },
  quickActionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  quickActionsTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  tagsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagChip: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: '#F2F6FF',
    borderWidth: 1,
    borderColor: '#E2EBFF',
  },
  tagChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5C81',
  },
  section: {
    paddingTop: 18,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  clearAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  suggestionsCard: {
    borderRadius: 16,
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: '#EAF0FB',
    overflow: 'hidden',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF2FA',
  },
  suggestionItemLast: {
    borderBottomWidth: 0,
  },
  suggestionThumb: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#F2F5FB',
  },
  suggestionTextWrap: {
    flex: 1,
    gap: 2,
  },
  suggestionName: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  suggestionPrice: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  seeAllButton: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
  },
  seeAllButtonText: {
    color: theme.colors.white,
    fontSize: 15,
    fontWeight: '700',
  },
  historyCard: {
    borderRadius: 16,
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: '#EAF0FB',
    overflow: 'hidden',
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF2FA',
  },
  historyItemLast: {
    borderBottomWidth: 0,
  },
  historyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  historyIconBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F2F6FF',
  },
  historyText: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.text.primary,
  },
  emptyState: {
    marginTop: 8,
    alignItems: 'center',
    padding: 22,
    borderRadius: 16,
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: '#EAF0FB',
  },
  emptyIconBadge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#F1F6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 18,
  },
});
