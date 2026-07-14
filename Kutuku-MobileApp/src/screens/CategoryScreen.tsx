import { BottomNavigation } from '@/src/components/common/BottomNavigation';
import { MAIN_CATEGORY_API_NAMES, type MainCategoryType } from '@/src/components/common/MainCategoryCard';
import { CategoryService } from '@/src/services/category.service';
import type { CategoryItem } from '@/src/services/category.service';
import { theme } from '@/src/theme';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ImageBackground,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTabNavigation } from '@/src/hooks/useTabNavigation';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type CategoryScreenProps = {
  onCategoryPress: (categoryName: string, subcategories?: string[]) => void;
  onHomePress: () => void;
  initialMainCategory?: MainCategoryType;
  /** ადმინიდან დაბმული კატეგორიის id */
  initialCategoryId?: string;
};

type StackEntry = { id: string; name: string };

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=400';

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

export function CategoryScreen({
  onCategoryPress,
  onHomePress,
  initialMainCategory,
  initialCategoryId,
}: CategoryScreenProps) {
  const insets = useSafeAreaInsets();
  const tabNav = useTabNavigation();
  const hasDeepLink = Boolean(initialCategoryId || initialMainCategory);
  const [rootCategories, setRootCategories] = useState<CategoryItem[]>([]);
  const [rootsLoading, setRootsLoading] = useState(true);
  const [stack, setStack] = useState<StackEntry[]>([]);
  const [childCategories, setChildCategories] = useState<CategoryItem[]>([]);
  const [childrenLoading, setChildrenLoading] = useState(false);
  const [deepLinkLoading, setDeepLinkLoading] = useState(hasDeepLink);

  const atRoot = stack.length === 0;
  const currentTitle = atRoot ? 'კატეგორიები' : stack[stack.length - 1].name;

  const displayList = useMemo(
    () => dedupeCategories(atRoot ? rootCategories : childCategories),
    [atRoot, rootCategories, childCategories],
  );

  const loading = deepLinkLoading || (atRoot ? rootsLoading : childrenLoading);

  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      setRootsLoading(true);
      if (hasDeepLink) setDeepLinkLoading(true);

      try {
        const list = await CategoryService.getCategories();
        if (cancelled) return;

        const roots = dedupeCategories(list);
        setRootCategories(list);

        if (!hasDeepLink) {
          return;
        }

        let matchId: string | undefined;
        let matchName: string | undefined;

        if (initialCategoryId) {
          matchId = initialCategoryId;
        } else if (initialMainCategory) {
          const targetName = MAIN_CATEGORY_API_NAMES[initialMainCategory];
          const match = roots.find(
            (category) =>
              category.name === targetName ||
              displayCategoryName(category.name) === targetName,
          );
          if (match) {
            matchId = match.id;
            matchName = match.name;
          }
        }

        if (!matchId) {
          setDeepLinkLoading(false);
          return;
        }

        let navigatedAway = false;
        try {
          const path = await CategoryService.getPath(matchId);
          if (cancelled) return;

          const pathEntries: StackEntry[] =
            path.length > 0
              ? path.map((p) => ({
                  id: p.id,
                  name: displayCategoryName(p.name),
                }))
              : matchName
                ? [{ id: matchId, name: displayCategoryName(matchName) }]
                : [{ id: matchId, name: 'კატეგორია' }];

          const target = pathEntries[pathEntries.length - 1];
          const root = pathEntries[0];
          const subs = await CategoryService.getSubcategories(target.id);
          if (cancelled) return;
          const normalized = dedupeCategories(subs);

          if (normalized.length === 0) {
            navigatedAway = true;
            if (pathEntries.length <= 1) {
              onCategoryPress(target.name);
            } else {
              onCategoryPress(root.name, [target.name]);
            }
            return;
          }

          setStack(pathEntries);
          setChildCategories(normalized);
        } catch (error) {
          console.error('Error loading deep-link subcategories:', error);
          if (!cancelled) {
            navigatedAway = true;
            onCategoryPress(matchName || 'კატეგორია');
          }
        } finally {
          if (!cancelled && !navigatedAway) {
            setDeepLinkLoading(false);
          }
        }
      } catch {
        if (!cancelled) {
          setRootCategories([]);
          setDeepLinkLoading(false);
        }
      } finally {
        if (!cancelled) setRootsLoading(false);
      }
    };

    void bootstrap();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- მხოლოდ mount / deep-link პარამებზე
  }, [hasDeepLink, initialCategoryId, initialMainCategory]);

  /** კატალოგი არჩეული ქვეკატეგორიისთვის (ან root-ისთვის, თუ შვილი აღარ აქვს) */
  const openCatalogForItem = useCallback(
    (item: CategoryItem) => {
      if (stack.length === 0) {
        onCategoryPress(item.name);
        return;
      }
      onCategoryPress(stack[0].name, [item.name]);
    },
    [onCategoryPress, stack],
  );

  /** კატალოგი მიმდინარე (სტეკის ბოლო) კატეგორიისთვის — ცარიელი დონის ღილაკი */
  const openCatalogForCurrentLevel = useCallback(() => {
    if (stack.length === 0) return;
    const current = stack[stack.length - 1];
    if (stack.length === 1) {
      onCategoryPress(current.name);
      return;
    }
    onCategoryPress(stack[0].name, [current.name]);
  }, [onCategoryPress, stack]);

  const drillInto = useCallback(
    async (category: CategoryItem) => {
      setChildrenLoading(true);
      try {
        const subs = await CategoryService.getSubcategories(category.id);
        const normalized = dedupeCategories(subs);
        if (normalized.length === 0) {
          openCatalogForItem(category);
          return;
        }
        setStack((prev) => [...prev, { id: category.id, name: category.name }]);
        setChildCategories(normalized);
      } catch (error) {
        console.error('Error loading subcategories:', error);
        openCatalogForItem(category);
      } finally {
        setChildrenLoading(false);
      }
    },
    [openCatalogForItem],
  );

  const handleCategoryPress = useCallback(
    (category: CategoryItem) => {
      void drillInto(category);
    },
    [drillInto],
  );

  const handleBack = useCallback(async () => {
    if (stack.length === 0) return;
    const nextStack = stack.slice(0, -1);
    setStack(nextStack);
    if (nextStack.length === 0) {
      setChildCategories([]);
      return;
    }
    const parent = nextStack[nextStack.length - 1];
    setChildrenLoading(true);
    try {
      const subs = await CategoryService.getSubcategories(parent.id);
      setChildCategories(dedupeCategories(subs));
    } catch {
      setChildCategories([]);
    } finally {
      setChildrenLoading(false);
    }
  }, [stack]);

  if (deepLinkLoading) {
    return (
      <View style={[styles.container, styles.deepLinkLoader, { paddingTop: insets.top }]}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.deepLinkLoaderText}>იტვირთება...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {!atRoot ? (
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => void handleBack()}
            style={styles.backButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel="უკან"
          >
            <Text style={styles.backChevron}>‹</Text>
            <Text style={styles.backLabel}>უკან</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {currentTitle}
          </Text>
          <View style={styles.headerSpacer} />
        </View>
      ) : null}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 88 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : displayList.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>
              {atRoot ? 'კატეგორიები ჯერ არ არის' : 'ქვეკატეგორიები არ არის'}
            </Text>
            {!atRoot ? (
              <TouchableOpacity
                style={styles.catalogButton}
                activeOpacity={0.85}
                onPress={openCatalogForCurrentLevel}
              >
                <Text style={styles.catalogButtonText}>პროდუქტების ნახვა</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : (
          <View style={styles.gridContainer}>
            {displayList.map((category) => {
              const imageUrl = category.imageUrl || FALLBACK_IMAGE;

              return (
                <TouchableOpacity
                  key={category.id}
                  style={styles.gridCard}
                  activeOpacity={0.8}
                  onPress={() => handleCategoryPress(category)}
                >
                  <ImageBackground
                    source={{ uri: imageUrl }}
                    style={styles.cardImage}
                    imageStyle={styles.cardImageStyle}
                  >
                    <View style={styles.overlay} />
                  </ImageBackground>
                  <View style={styles.cardContent}>
                    <Text style={styles.gridTitle} numberOfLines={2}>
                      {category.name}
                    </Text>
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
        onCategoriesPress={undefined}
        onCabinetPress={tabNav.onCabinetPress}
        onCartPress={tabNav.onCartPress}
        onProfilePress={tabNav.onProfilePress}
        cartCount={tabNav.cartCount}
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 72,
  },
  backChevron: {
    fontSize: 28,
    lineHeight: 30,
    color: theme.colors.primary,
    marginRight: 2,
    marginTop: -2,
  },
  backLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: theme.colors.primary,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.gray[1200],
    paddingHorizontal: 8,
  },
  headerSpacer: {
    minWidth: 72,
  },
  scrollView: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  loadingContainer: {
    paddingVertical: 48,
    alignItems: 'center',
  },
  deepLinkLoader: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  deepLinkLoaderText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.gray[1000],
  },
  emptyState: {
    paddingVertical: 36,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.gray[1200],
  },
  catalogButton: {
    marginTop: 16,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  catalogButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingBottom: 16,
  },
  gridCard: {
    width: '48%',
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardImage: {
    width: '100%',
    height: 90,
  },
  cardImageStyle: {
    borderTopLeftRadius: 11,
    borderTopRightRadius: 11,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  cardContent: {
    padding: 10,
    alignItems: 'center',
  },
  gridTitle: {
    fontSize: 11,
    fontWeight: '400',
    color: theme.colors.gray[1100],
    textAlign: 'center',
    lineHeight: 14,
  },
});
