import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar, ScrollView, TextInput } from 'react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/src/theme';

type Language = {
  code: string;
  name: string;
  flag: string;
};

type LanguageScreenProps = {
  onBack: () => void;
  onLanguageSelect: (languageCode: string) => void;
  onMoreOptions?: () => void;
};

const languages: Language[] = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'id', name: 'Bahasa Indonesia', flag: '🇮🇩' },
  { code: 'zh', name: 'Chinese', flag: '🇨🇳' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
  { code: 'ko', name: '한국어', flag: '🇰🇷' },
];

export function LanguageScreen({ onBack, onLanguageSelect, onMoreOptions }: LanguageScreenProps) {
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredLanguages = languages.filter(lang =>
    lang.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleLanguageSelect = (code: string) => {
    setSelectedLanguage(code);
    onLanguageSelect(code);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.white} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Ionicons name="chevron-back" size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Language</Text>
        <TouchableOpacity style={styles.moreButton} onPress={onMoreOptions}>
          <Ionicons name="ellipsis-vertical" size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={20} color={theme.colors.text.secondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search language"
            placeholderTextColor={theme.colors.text.secondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {filteredLanguages.map((language) => (
          <TouchableOpacity
            key={language.code}
            style={[
              styles.languageItem,
              selectedLanguage === language.code && styles.languageItemSelected
            ]}
            onPress={() => handleLanguageSelect(language.code)}
          >
            <View style={styles.languageLeft}>
              <Text style={styles.flag}>{language.flag}</Text>
              <Text style={styles.languageName}>{language.name}</Text>
            </View>
            {selectedLanguage === language.code && (
              <Ionicons name="checkmark" size={24} color={theme.colors.primary} />
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
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
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.gray[50],
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  moreButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.gray[50],
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.gray[50],
    borderRadius: 12,
    paddingHorizontal: theme.spacing.md,
    height: 50,
  },
  searchInput: {
    flex: 1,
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.primary,
    marginLeft: theme.spacing.sm,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    borderRadius: 12,
    marginBottom: theme.spacing.sm,
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.gray[100],
  },
  languageItemSelected: {
    backgroundColor: theme.colors.primary + '10',
    borderColor: theme.colors.primary,
    borderWidth: 2,
  },
  languageLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  flag: {
    fontSize: 28,
    marginRight: theme.spacing.md,
  },
  languageName: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.primary,
    fontWeight: '500',
  },
});
