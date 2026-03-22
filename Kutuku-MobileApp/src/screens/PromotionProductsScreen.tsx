import { PromotionService } from '@/src/services/promotion.service';
import type { PromotionFromApi } from '@/src/services/promotion.service';
import { theme } from '@/src/theme';
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface PromotionProductsScreenProps {
  promotionId: string;
  onBack: () => void;
  onProductPress: (productId: string) => void;
}

export function PromotionProductsScreen({
  promotionId,
  onBack,
  onProductPress,
}: PromotionProductsScreenProps) {
  const [promotion, setPromotion] = useState<PromotionFromApi | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await PromotionService.getActivePromotions();
      const found = list.find((p) => p.id === promotionId) ?? null;
      setPromotion(found);
    } catch (e) {
      console.error('Error loading promotion:', e);
      setPromotion(null);
    } finally {
      setLoading(false);
    }
  }, [promotionId]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={theme.colors.white} />
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={theme.colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>აქციის პროდუქტები</Text>
        </View>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!promotion) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={theme.colors.white} />
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={theme.colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>აქცია</Text>
        </View>
        <View style={styles.centered}>
          <Text style={styles.emptyText}>აქცია ვერ მოიძებნა</Text>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>უკან დაბრუნება</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const products = promotion.products || [];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.white} />
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {promotion.name}
        </Text>
      </View>
      {promotion.description ? (
        <View style={styles.descriptionBlock}>
          <Text style={styles.descriptionText}>{promotion.description}</Text>
        </View>
      ) : null}
      {products.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>ამ აქციაში პროდუქტები არ არის</Text>
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.productRow}
              onPress={() => onProductPress(item.id)}
              activeOpacity={0.7}
            >
              <Image
                source={{ uri: item.image || undefined }}
                style={styles.productImage}
                resizeMode="cover"
              />
              <View style={styles.productInfo}>
                <Text style={styles.productName} numberOfLines={2}>
                  {item.name}
                </Text>
                <View style={styles.priceRow}>
                  <Text style={styles.currentPrice}>₾{item.currentPrice.toFixed(2)}</Text>
                  {item.originalPrice > item.currentPrice && (
                    <Text style={styles.originalPrice}>₾{item.originalPrice.toFixed(2)}</Text>
                  )}
                  {item.discount > 0 && (
                    <View style={styles.discountBadge}>
                      <Text style={styles.discountText}>-{item.discount}%</Text>
                    </View>
                  )}
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.colors.text.secondary} />
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },
  backBtn: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  descriptionBlock: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: theme.colors.background.purple.light,
  },
  descriptionText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    marginBottom: 16,
  },
  backButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.white,
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  productImage: {
    width: 72,
    height: 72,
    borderRadius: 8,
    backgroundColor: theme.colors.gray[100],
  },
  productInfo: {
    flex: 1,
    marginLeft: 12,
  },
  productName: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  currentPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  originalPrice: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    textDecorationLine: 'line-through',
  },
  discountBadge: {
    backgroundColor: theme.colors.error,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  discountText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.white,
  },
});
