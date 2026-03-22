import { searchHistoryService } from '@/src/services/searchHistory.service';
import { theme } from '@/src/theme';
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import { SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

type SearchScreenProps = {
  onBack: () => void;
  onSearch: (query: string) => void;
};

export function SearchScreen({ onBack, onSearch }: SearchScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  const loadHistory = useCallback(async () => {
    const list = await searchHistoryService.getHistory();
    setSearchHistory(list);
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleSearchItemPress = (item: string) => {
    setSearchQuery(item);
    searchHistoryService.addToHistory(item);
    onSearch(item);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  const handleSearch = (query: string) => {
    if (query.trim()) {
      searchHistoryService.addToHistory(query);
      onSearch(query);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.white} />
      
      {/* Search Header */}
      <View style={styles.searchHeader}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color={theme.colors.text.tertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder="რას ეძებ?"
            placeholderTextColor={theme.colors.text.tertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={() => handleSearch(searchQuery)}
            autoFocus
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={handleClearSearch}>
              <Ionicons name="close" size={20} color={theme.colors.text.tertiary} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.cancelButton}>გაუქმება</Text>
        </TouchableOpacity>
      </View>

      {/* Search History */}
      <ScrollView style={styles.content}>
        {searchHistory.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ბოლო მოძიებული</Text>

            <View style={styles.historyList}>
              {searchHistory.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.historyItem}
                onPress={() => handleSearchItemPress(item)}
              >
                <Ionicons name="search" size={20} color={theme.colors.text.secondary} />
                <Text style={styles.historyText}>{item}</Text>
                <Ionicons name="arrow-forward" size={20} color={theme.colors.text.tertiary} />
              </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.white,
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    backgroundColor: theme.colors.white,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.gray[200],
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: theme.colors.text.primary,
  },
  cancelButton: {
    fontSize: 15,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  section: {
    paddingTop: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.secondary,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  historyList: {
    gap: 0,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray[300],
  },
  historyText: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.text.primary,
  },
});
