import { AversiHeader } from '@/src/components/common/AversiHeader';
import { BottomNavigation } from '@/src/components/common/BottomNavigation';
import { CategoryService } from '@/src/services/category.service';
import type { CategoryItem } from '@/src/services/category.service';
import { theme } from '@/src/theme';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type CategoryScreenProps = {
  onSearch: () => void;
  onCategoryPress: (categoryName: string) => void;
  onHomePress: () => void;
  onMyOrderPress: () => void;
  onFavoritePress?: () => void;
  onProfilePress?: () => void;
  onCartPress?: () => void;
};

const CATEGORY_ACCENTS = [
  theme.colors.purple[100],
  '#EAF2FF',
  '#EFFFF4',
  '#FFF4E8',
  '#F6EEFF',
];

/** DB-ში შეცდომით გაორმაგებული სახელი — ეკრანზე გამოსაჩენად */
function displayCategoryName(raw: string): string {
  const t = raw.trim();
  if (!t) return '—';
  if (t.length >= 6 && t.length % 2 === 0) {
    const half = t.length / 2;
    if (t.slice(0, half) === t.slice(half)) return t.slice(0, half);
  }
  return t;
}

function dedupeCategories(list: CategoryItem[]): CategoryItem[] {
  const seen = new Set<string>();
  const out: CategoryItem[] = [];
  for (const c of list) {
    const key = displayCategoryName(c.name).toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ ...c, name: displayCategoryName(c.name) });
  }
  return out;
}

function getCategoryIcon(name: string): keyof typeof Ionicons.glyphMap {
  const n = name.toLowerCase();
  if (n.includes('ვიტამ')) return 'nutrition-outline';
  if (n.includes('ანტისეპ') || n.includes('სეპტ')) return 'medkit-outline';
  if (n.includes('ბავშვ')) return 'happy-outline';
  if (n.includes('ბრენ') || n.includes('გერმან')) return 'ribbon-outline';
  if (n.includes('კოსმეტ')) return 'sparkles-outline';
  if (n.includes('აქსესუარ')) return 'bandage-outline';
  return 'grid-outline';
}

export function CategoryScreen({
  onSearch,
  onCategoryPress,
  onHomePress,
  onMyOrderPress,
  onFavoritePress,
  onProfilePress,
  onCartPress,
}: CategoryScreenProps) {
  const insets = useSafeAreaInsets();
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const displayList = useMemo(() => dedupeCategories(categories), [categories]);
  const topNames = useMemo(() => displayList.slice(0, 6).map((c) => c.name), [displayList]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    CategoryService.getCategories()
      .then((list) => {
        if (!cancelled) setCategories(list);
      })
      .catch(() => {
        if (!cancelled) setCategories([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FC" />
      <View style={styles.accentLine} pointerEvents="none" />

      <AversiHeader onSearchPress={onSearch} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.intro}>
          <Text style={styles.title}>კატეგორიები</Text>
          <Text style={styles.subtitle}>აირჩიე მიმართულება და იპოვე საჭირო პროდუქტი</Text>
        </View>

        <TouchableOpacity style={styles.ordersBtn} onPress={onMyOrderPress} activeOpacity={0.75}>
          <Ionicons name="receipt-outline" size={18} color={theme.colors.primary} />
          <Text style={styles.ordersBtnText}>ჩემი შეკვეთები</Text>
          <Ionicons name="chevron-forward" size={16} color={theme.colors.gray[900]} />
        </TouchableOpacity>

        {!loading && displayList.length > 0 ? (
          <>
            <View style={styles.metaRow}>
              <Text style={styles.metaTitle}>პოპულარული</Text>
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{displayList.length}</Text>
              </View>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipsRow}
            >
              {topNames.map((name) => (
                <TouchableOpacity
                  key={name}
                  style={styles.chip}
                  activeOpacity={0.8}
                  onPress={() => onCategoryPress(name)}
                >
                  <Text style={styles.chipText} numberOfLines={1}>
                    {name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </>
        ) : null}

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : displayList.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="grid-outline" size={28} color={theme.colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>კატეგორიები ჯერ არ არის</Text>
            <Text style={styles.emptyText}>სცადე თავიდან ცოტა ხანში.</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {displayList.map((category, index) => {
              const accent = CATEGORY_ACCENTS[index % CATEGORY_ACCENTS.length];
              const icon = getCategoryIcon(category.name);
              const count = category.productCount ?? 0;
              return (
                <TouchableOpacity
                  key={category.id}
                  style={styles.rowCard}
                  activeOpacity={0.85}
                  onPress={() => onCategoryPress(category.name)}
                >
                  <View style={[styles.rowIcon, { backgroundColor: accent }]}>
                    <Ionicons name={icon} size={22} color={theme.colors.primary} />
                  </View>
                  <View style={styles.rowBody}>
                    <Text style={styles.rowTitle} numberOfLines={1} ellipsizeMode="tail">
                      {category.name}
                    </Text>
                    <Text style={[styles.rowCount, count === 0 && styles.rowCountMuted]}>
                      {count} პროდუქტი
                    </Text>
                  </View>
                  <View style={styles.rowChevron}>
                    <Ionicons name="chevron-forward" size={18} color={theme.colors.gray[900]} />
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

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
  scrollView: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  intro: {
    marginBottom: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: theme.colors.gray[1200],
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    color: theme.colors.gray[1000],
    lineHeight: 22,
  },
  ordersBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: theme.colors.white,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: theme.colors.gray[500],
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 22,
    ...Platform.select({
      ios: {
        shadowColor: '#1F2021',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
      },
      android: { elevation: 1 },
    }),
  },
  ordersBtnText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.gray[1200],
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  metaTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.gray[1100],
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  countBadge: {
    minWidth: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.purple[100],
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  countBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  chipsRow: {
    gap: 8,
    paddingBottom: 18,
  },
  chip: {
    backgroundColor: theme.colors.white,
    borderWidth: 1.5,
    borderColor: theme.colors.purple[300],
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    maxWidth: 160,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.gray[1100],
  },
  loadingContainer: {
    paddingVertical: 48,
    alignItems: 'center',
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
  emptyText: {
    fontSize: 13,
    color: theme.colors.gray[1000],
    textAlign: 'center',
  },
  list: {
    gap: 10,
  },
  rowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: theme.colors.gray[500],
    padding: 12,
    gap: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#1F2021',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
      },
      android: { elevation: 1 },
    }),
  },
  rowIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rowBody: {
    flex: 1,
    minWidth: 0,
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.gray[1200],
    marginBottom: 2,
  },
  rowCount: {
    fontSize: 13,
    fontWeight: '500',
    color: theme.colors.primary,
  },
  rowCountMuted: {
    color: theme.colors.gray[900],
  },
  rowChevron: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: theme.colors.purple[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
});
