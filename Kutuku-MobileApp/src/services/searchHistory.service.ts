import AsyncStorage from '@react-native-async-storage/async-storage';

const SEARCH_HISTORY_KEY = '@kutuku_search_history';
const MAX_ITEMS = 15;

export const searchHistoryService = {
  async getHistory(): Promise<string[]> {
    try {
      const raw = await AsyncStorage.getItem(SEARCH_HISTORY_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error('Error reading search history:', e);
      return [];
    }
  },

  async addToHistory(query: string): Promise<void> {
    const trimmed = query.trim();
    if (!trimmed) return;
    try {
      let list = await this.getHistory();
      list = list.filter((q) => q !== trimmed);
      list.unshift(trimmed);
      list = list.slice(0, MAX_ITEMS);
      await AsyncStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(list));
    } catch (e) {
      console.error('Error saving search history:', e);
    }
  },

  async clearHistory(): Promise<void> {
    try {
      await AsyncStorage.removeItem(SEARCH_HISTORY_KEY);
    } catch (e) {
      console.error('Error clearing search history:', e);
    }
  },
};
