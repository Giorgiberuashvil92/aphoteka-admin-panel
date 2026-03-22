import { ProductBottomSheet } from '@/src/components/common';
import { useCart, useFavorites } from '@/src/contexts';
import { theme } from '@/src/theme';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Image, ImageSourcePropType, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export interface ProductCardProps {
  id: string;
  name: string;
  currentPrice?: number;
  originalPrice?: number;
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
  showQuickAdd?: boolean; // Show bottom sheet on add to cart
}

export function ProductCard({
  id,
  name,
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
}: ProductCardProps) {
  const { addToCart } = useCart();
  const { addToFavorites, removeFromFavorites, isFavorite } = useFavorites();
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const hasDiscount = discount && discount > 0;
  const imageSource = typeof image === 'string' ? { uri: image } : image;
  const isInFavorites = isFavorite(id);

  const handleAddToCart = () => {
    if (showQuickAdd) {
      // Show bottom sheet for quick add
      setShowBottomSheet(true);
    } else if (onAddToCart) {
      onAddToCart();
    } else {
      // Default add to cart behavior
      addToCart({
        id,
        name,
        price: currentPrice || 0,
        originalPrice,
        discount,
        image: typeof image === 'string' ? image : '',
      });
    }
  };

  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Product Image Container */}
      <View style={styles.imageContainer}>
        {/* Discount Badge */}
        {hasDiscount && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>-{discount}%</Text>
            <Ionicons 
              name="information-circle-outline" 
              size={14} 
              color={theme.colors.white} 
            />
          </View>
        )}

        {/* Favorite Button on Image */}
        <TouchableOpacity 
          style={styles.favoriteOverlay}
          onPress={() => {
            if (isInFavorites) {
              removeFromFavorites(id);
            } else {
              addToFavorites({
                id,
                name,
                price: currentPrice || 0,
                originalPrice,
                discount,
                image: typeof image === 'string' ? image : '',
                rating,
                reviewCount,
                stock,
              });
            }
            onToggleWishlist?.();
          }}
          activeOpacity={0.7}
        >
          <View style={styles.favoriteIconContainer}>
            <Ionicons 
              name={isInFavorites ? "heart" : "heart-outline"}
              size={20}
              color={isInFavorites ? theme.colors.error : theme.colors.text.primary}
            />
          </View>
        </TouchableOpacity>

        {/* Product Image */}
        <Image
          source={imageSource}
          style={[
            styles.productImage,
            { backgroundColor: imageBackgroundColor || theme.colors.white }
          ]}
          resizeMode="cover"
        />
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Price Section */}
        <View style={styles.priceSection}>
          <View style={styles.currentPriceContainer}>
            <Text style={styles.currentPriceText} numberOfLines={1}>
              {currentPrice ? currentPrice.toFixed(2) : '0.00'}₾
            </Text>
          </View>

          {originalPrice && currentPrice && originalPrice > currentPrice && (
            <View style={styles.originalPriceContainer}>
              <Text style={styles.originalPriceText} numberOfLines={1}>
                {originalPrice.toFixed(2)}₾
              </Text>
            </View>
          )}
        </View>

        {/* Product Name */}
        <Text style={styles.productName} numberOfLines={2}>
          {name}
        </Text>
      </View>

      {/* Add to Cart Button */}
      <TouchableOpacity 
        style={styles.addToCartButton}
        onPress={handleAddToCart}
        activeOpacity={0.7}
      >
        <Ionicons 
          name="cart-outline" 
          size={20} 
          color={theme.colors.white} 
        />
      </TouchableOpacity>

      {/* Bottom Sheet Modal */}
      <ProductBottomSheet
        visible={showBottomSheet}
        product={
          showBottomSheet
            ? {
                id,
                name,
                price: currentPrice || 0,
                originalPrice,
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
    gap: 12,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
  },
  discountBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    zIndex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: theme.colors.error,
    backgroundColor: theme.colors.primaryDark,
  },
  discountText: {
    fontSize: 13,
    fontWeight: '400',
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
    top: 8,
    right: 8,
    zIndex: 2,
  },
  favoriteIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  content: {
    gap: 6,
    minHeight: 73,
  },
  priceSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  currentPriceContainer: {
    flex: 1,
  },
  currentPriceText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  originalPriceContainer: {
    flex: 1,
  },
  originalPriceText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.gray[1000],
    textDecorationLine: 'line-through',
  },
  productName: {
    fontSize: 16,
    fontWeight: '400',
    color: theme.colors.text.primary,
    lineHeight: 22,
  },
  addToCartButton: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
});
