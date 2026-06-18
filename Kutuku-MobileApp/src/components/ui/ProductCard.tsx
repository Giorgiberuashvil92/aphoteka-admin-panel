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
  countryOfOrigin?: string;
  /** grid — ბარათი ჩარჩოთი; catalog — პროდუქტების კატალოგი; inline — სლაიდერები */
  variant?: 'grid' | 'catalog' | 'inline';
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
  countryOfOrigin,
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
  const isCatalog = variant === 'catalog';

  const countryFlag = (() => {
    const name = countryOfOrigin?.trim();
    if (!name) return '';
    const flags: Record<string, string> = {
      გერმანია: '🇩🇪',
      საქართველო: '🇬🇪',
      თურქეთი: '🇹🇷',
      იტალია: '🇮🇹',
      საფრანგეთი: '🇫🇷',
      აშშ: '🇺🇸',
      ინგლისი: '🇬🇧',
    };
    return flags[name] || '🌍';
  })();

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
      style={[
        styles.container,
        isGrid && styles.containerGrid,
        isCatalog && styles.containerCatalog,
      ]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={[styles.imageContainer, isCatalog && styles.imageContainerCatalog]}>
        {hasDiscount ? (
          <View style={[styles.discountBadge, isCatalog && styles.discountBadgeCatalog]}>
            <Text style={styles.discountText}>-{discount}%</Text>
          </View>
        ) : null}

        {!isCatalog ? (
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
        ) : null}

        <Image
          source={imageSource}
          style={[
            styles.productImage,
            isCatalog && styles.productImageCatalog,
            { backgroundColor: imageBackgroundColor || (isCatalog ? '#F3F4F6' : '#F8F9FC') },
          ]}
          resizeMode={isCatalog ? 'cover' : 'contain'}
        />
      </View>

      <View style={[styles.content, isCatalog && styles.contentCatalog]}>
        {isCatalog ? (
          <Text style={styles.catalogProductName} numberOfLines={2}>
            {name}
          </Text>
        ) : null}

        <View style={styles.priceSection}>
          <Text
            style={[styles.currentPriceText, isCatalog && styles.catalogCurrentPrice]}
            numberOfLines={1}
          >
            {`${formatLari(currentPrice)}₾`}
          </Text>
          {Number.isFinite(originalNum) &&
          Number.isFinite(priceNum) &&
          originalNum > priceNum ? (
            <Text
              style={[styles.originalPriceText, isCatalog && styles.catalogOriginalPrice]}
              numberOfLines={1}
            >
              {`${formatLari(originalPrice)}₾`}
            </Text>
          ) : null}
        </View>

        {!isCatalog ? (
          <Text style={styles.productName} numberOfLines={2}>
            {name}
          </Text>
        ) : null}
        {!isCatalog && genericName ? (
          <Text style={styles.genericName} numberOfLines={1}>
            {genericName}
          </Text>
        ) : null}

        {isCatalog && countryOfOrigin ? (
          <View style={styles.originRow}>
            <Text style={styles.originFlag}>{countryFlag}</Text>
            <Text style={styles.originText} numberOfLines={1}>
              {countryOfOrigin}
            </Text>
          </View>
        ) : null}
      </View>

      {isCatalog ? (
        <View style={styles.catalogFooter}>
          <TouchableOpacity
            style={styles.catalogCartButton}
            onPress={handleAddToCart}
            activeOpacity={0.8}
          >
            <Ionicons name="bag-outline" size={14} color={theme.colors.primary} />
            <Text style={styles.catalogCartText}>კალათაში</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.catalogFavoriteButton}
            onPress={handleFavorite}
            activeOpacity={0.75}
          >
            <Ionicons
              name={isInFavorites ? 'heart' : 'heart-outline'}
              size={18}
              color={isInFavorites ? theme.colors.error : theme.colors.gray[900]}
            />
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.addToCartButton}
          onPress={handleAddToCart}
          activeOpacity={0.8}
        >
          <Ionicons name="cart-outline" size={18} color={theme.colors.white} />
          {isGrid ? <Text style={styles.addToCartText}>კალათაში</Text> : null}
        </TouchableOpacity>
      )}

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
    gap: 8,
  },
  containerGrid: {
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: theme.colors.gray[500],
    padding: 6,
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
    top: 8,
    left: 8,
    zIndex: 1,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: theme.colors.error,
  },
  discountText: {
    fontSize: 9,
    fontWeight: '600',
    color: theme.colors.white,
  },
  productImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  favoriteOverlay: {
    position: 'absolute',
    top: 6,
    right: 6,
    zIndex: 2,
  },
  favoriteIconContainer: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.gray[500],
  },
  content: {
    gap: 3,
    minHeight: 56,
  },
  priceSection: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    flexWrap: 'wrap',
  },
  currentPriceText: {
    fontSize: 17,
    fontWeight: '500',
    color: theme.colors.gray[1200],
    letterSpacing: -0.2,
  },
  originalPriceText: {
    fontSize: 12,
    fontWeight: '400',
    color: theme.colors.gray[900],
    textDecorationLine: 'line-through',
  },
  productName: {
    fontSize: 14,
    fontWeight: '400',
    color: theme.colors.gray[1200],
    lineHeight: 18,
  },
  genericName: {
    fontSize: 11,
    fontWeight: '400',
    color: theme.colors.gray[1000],
    lineHeight: 14,
  },
  addToCartButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: theme.colors.primary,
  },
  addToCartText: {
    fontSize: 13,
    fontWeight: '500',
    color: theme.colors.white,
  },
  containerCatalog: {
    backgroundColor: theme.colors.white,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#EEEEEE',
    padding: 0,
    gap: 0,
    overflow: 'hidden',
  },
  imageContainerCatalog: {
    marginHorizontal: 0,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    overflow: 'hidden',
  },
  productImageCatalog: {
    width: '100%',
    aspectRatio: 1.25,
    borderRadius: 0,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  discountBadgeCatalog: {
    top: 4,
    right: 4,
    left: 'auto',
    backgroundColor: '#8B3FA8',
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  contentCatalog: {
    gap: 2,
    minHeight: 0,
    paddingHorizontal: 6,
    paddingTop: 6,
  },
  catalogProductName: {
    fontSize: 11,
    fontWeight: '400',
    color: '#1A1A2E',
    lineHeight: 14,
    minHeight: 28,
  },
  catalogCurrentPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: '#7B2D8E',
    letterSpacing: -0.2,
  },
  catalogOriginalPrice: {
    fontSize: 10,
    fontWeight: '400',
    color: '#9CA3AF',
  },
  originRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  originFlag: {
    fontSize: 12,
  },
  originText: {
    fontSize: 11,
    fontWeight: '400',
    color: '#9CA3AF',
    flex: 1,
  },
  catalogFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
    paddingHorizontal: 6,
    paddingBottom: 6,
  },
  catalogCartButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#E8EAF6',
  },
  catalogCartText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#2A3A7A',
  },
  catalogFavoriteButton: {
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
