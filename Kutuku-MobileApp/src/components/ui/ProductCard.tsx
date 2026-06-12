import { ProductBottomSheet } from '@/src/components/common';
import { useCart, useFavorites } from '@/src/contexts';
import { theme } from '@/src/theme';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  Image,
  ImageSourcePropType,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

function coercePrice(value: number | string | undefined | null): number {
  if (value === undefined || value === null) return NaN;
  if (typeof value === 'number') return Number.isFinite(value) ? value : NaN;
  const n = parseFloat(String(value).trim().replace(',', '.'));
  return Number.isFinite(n) ? n : NaN;
}

function formatLari(value: number | string | undefined | null): string {
  const n = coercePrice(value);
  return Number.isFinite(n) ? n.toFixed(2) : '0.00';
}

export interface ProductCardProps {
  id: string;
  name: string;
  genericName?: string;
  currentPrice?: number | string;
  originalPrice?: number | string;
  discount?: number;
  image: ImageSourcePropType | string;
  onPress?: () => void;
  onAddToCart?: () => void;
  onToggleWishlist?: () => void;
  isInWishlist?: boolean;
  imageBackgroundColor?: string;
  rating?: number;
  reviewCount?: number;
  stock?: number;
  description?: string;
  showQuickAdd?: boolean;
  /** grid — ბარათი ჩარჩოთი (სია/გრიდი); inline — სლაიდერებისთვის */
  variant?: 'grid' | 'inline';
}

export function ProductCard({
  id,
  name,
  genericName,
  currentPrice,
  originalPrice,
  discount,
  image,
  onPress,
  onAddToCart,
  onToggleWishlist,
  isInWishlist = false,
  imageBackgroundColor,
  rating,
  reviewCount,
  stock,
  description,
  showQuickAdd = true,
  variant = 'grid',
}: ProductCardProps) {
  const { addToCart } = useCart();
  const { addToFavorites, removeFromFavorites, isFavorite } = useFavorites();
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const hasDiscount = Boolean(discount && discount > 0);
  const priceNum = coercePrice(currentPrice);
  const originalNum = coercePrice(originalPrice);
  const safePrice = Number.isFinite(priceNum) ? priceNum : 0;
  const safeOriginalPrice = Number.isFinite(originalNum) ? originalNum : undefined;
  const imageSource = typeof image === 'string' ? { uri: image } : image;
  const isInFavorites = isFavorite(id);
  const isGrid = variant === 'grid';

  const handleAddToCart = () => {
    if (showQuickAdd) {
      setShowBottomSheet(true);
    } else if (onAddToCart) {
      onAddToCart();
    } else {
      addToCart({
        id,
        name,
        price: safePrice,
        originalPrice: safeOriginalPrice,
        discount,
        image: typeof image === 'string' ? image : '',
      });
    }
  };

  const handleFavorite = () => {
    if (isInFavorites) {
      removeFromFavorites(id);
    } else {
      addToFavorites({
        id,
        name,
        price: safePrice,
        originalPrice: safeOriginalPrice,
        discount,
        image: typeof image === 'string' ? image : '',
        rating,
        reviewCount,
        stock,
      });
    }
    onToggleWishlist?.();
  };

  return (
    <TouchableOpacity
      style={[styles.container, isGrid && styles.containerGrid]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={styles.imageContainer}>
        {hasDiscount ? (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>-{discount}%</Text>
          </View>
        ) : null}

        <TouchableOpacity
          style={styles.favoriteOverlay}
          onPress={handleFavorite}
          activeOpacity={0.75}
          hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
        >
          <View style={styles.favoriteIconContainer}>
            <Ionicons
              name={isInFavorites ? 'heart' : 'heart-outline'}
              size={18}
              color={isInFavorites ? theme.colors.error : theme.colors.gray[1100]}
            />
          </View>
        </TouchableOpacity>

        <Image
          source={imageSource}
          style={[
            styles.productImage,
            { backgroundColor: imageBackgroundColor || '#F3F5FA' },
          ]}
          resizeMode="cover"
        />
      </View>

      <View style={styles.content}>
        <View style={styles.priceSection}>
          <Text style={styles.currentPriceText} numberOfLines={1}>
            {`${formatLari(currentPrice)}₾`}
          </Text>
          {Number.isFinite(originalNum) &&
          Number.isFinite(priceNum) &&
          originalNum > priceNum ? (
            <Text style={styles.originalPriceText} numberOfLines={1}>
              {`${formatLari(originalPrice)}₾`}
            </Text>
          ) : null}
        </View>

        <Text style={styles.productName} numberOfLines={2}>
          {name}
        </Text>
        {genericName ? (
          <Text style={styles.genericName} numberOfLines={1}>
            {genericName}
          </Text>
        ) : null}
      </View>

      <TouchableOpacity
        style={styles.addToCartButton}
        onPress={handleAddToCart}
        activeOpacity={0.8}
      >
        <Ionicons name="cart-outline" size={18} color={theme.colors.white} />
        {isGrid ? <Text style={styles.addToCartText}>კალათაში</Text> : null}
      </TouchableOpacity>

      <ProductBottomSheet
        visible={showBottomSheet}
        product={
          showBottomSheet
            ? {
                id,
                name,
                price: safePrice,
                originalPrice: safeOriginalPrice,
                discount,
                image: typeof image === 'string' ? image : '',
                rating,
                reviewCount,
                stock,
                description,
              }
            : null
        }
        onClose={() => setShowBottomSheet(false)}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    gap: 10,
  },
  containerGrid: {
    backgroundColor: theme.colors.white,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: theme.colors.gray[500],
    padding: 10,
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
  imageContainer: {
    position: 'relative',
    width: '100%',
  },
  discountBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    zIndex: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: theme.colors.error,
  },
  discountText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.white,
  },
  productImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 14,
    overflow: 'hidden',
  },
  favoriteOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 2,
  },
  favoriteIconContainer: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.gray[500],
  },
  content: {
    gap: 4,
    minHeight: 64,
  },
  priceSection: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    flexWrap: 'wrap',
  },
  currentPriceText: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.colors.gray[1200],
    letterSpacing: -0.2,
  },
  originalPriceText: {
    fontSize: 13,
    fontWeight: '500',
    color: theme.colors.gray[900],
    textDecorationLine: 'line-through',
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.gray[1200],
    lineHeight: 19,
  },
  genericName: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.colors.gray[1000],
    lineHeight: 16,
  },
  addToCartButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: theme.colors.primary,
  },
  addToCartText: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.white,
  },
});
