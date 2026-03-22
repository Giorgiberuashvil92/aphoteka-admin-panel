import { useRouter } from 'expo-router';
import { theme } from '@/src/theme';
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Image,
  ImageSourcePropType,
  ListRenderItem,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { ProductCard, ProductCardProps } from '../ui/ProductCard';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/** ყველა აქციის ბარათის ერთი სტანდარტული ფონი (API-ის backgroundColor იგნორირდება) */
const PROMO_CARD_BACKGROUND = theme.colors.background.purple.light; // #F5F5FF

interface BrandSlide {
  id: string;
  backgroundColor: string;
  description?: string;
  name?: string;
  logo?: ImageSourcePropType;
  products: ProductCardProps[];
}

interface BrandsSliderProps {
  title?: string;
  brands: BrandSlide[];
  onProductPress?: (product: ProductCardProps) => void;
  onViewAllPress?: (brandId: string) => void;
}

export function BrandsSlider({
  title = 'სპეციალური შეთავაზებები',
  brands,
  onProductPress,
  onViewAllPress,
}: BrandsSliderProps) {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const productCardWidth = (SCREEN_WIDTH - 32 - 40) / 2;

  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      flatListRef.current?.scrollToOffset({
        offset: newIndex * SCREEN_WIDTH,
        animated: true,
      });
    }
  }, [currentIndex]);

  const handleNext = useCallback(() => {
    if (currentIndex < brands.length - 1) {
      const newIndex = currentIndex + 1;
      flatListRef.current?.scrollToOffset({
        offset: newIndex * SCREEN_WIDTH,
        animated: true,
      });
    }
  }, [currentIndex, brands.length]);

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetX = event.nativeEvent.contentOffset.x;
      const newIndex = Math.round(offsetX / SCREEN_WIDTH);

      if (newIndex !== currentIndex && newIndex >= 0 && newIndex < brands.length) {
        setCurrentIndex(newIndex);
      }
    },
    [currentIndex, brands.length],
  );

  const renderBrandCard: ListRenderItem<BrandSlide> = ({ item: brand }) => (
    <View style={[styles.brandCardWrapper, { width: SCREEN_WIDTH }]}>
      <View style={[styles.brandCard, { backgroundColor: PROMO_CARD_BACKGROUND }]}>
        {/* Brand Header */}
        <View style={styles.brandHeader}>
          {brand.logo != null && (
            <Image source={brand.logo} style={styles.brandLogo} resizeMode="contain" />
          )}
          {(brand.name || brand.description) && (
            <View style={styles.brandInfo}>
              {brand.name && <Text style={styles.brandName}>{brand.name}</Text>}
              {brand.description && (
                <Text style={styles.brandDescription}>{brand.description}</Text>
              )}
            </View>
          )}
        </View>

        {/* Products Horizontal Scroll */}
        <View style={styles.productsSection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.productsScroll}
            snapToInterval={productCardWidth + 20}
            decelerationRate="fast"
          >
            {brand.products.map((product, index) => (
              <View key={product.id} style={[styles.productCardContainer, { width: productCardWidth }]}>
                <ProductCard
                  {...product}
                  onPress={() => onProductPress?.(product)}
                />
              </View>
            ))}
          </ScrollView>

          {/* Gradient Overlay */}
          <View style={styles.gradientOverlay} pointerEvents="none" />
        </View>

        {/* View All Button — გლობალური გვერდი /promotion/[id] */}
        <TouchableOpacity
          style={styles.viewAllButton}
          onPress={() => {
            if (onViewAllPress) onViewAllPress(brand.id);
            else router.push(`/promotion/${brand.id}` as any);
          }}
        >
          <Text style={styles.viewAllButtonText}>ყველა აქციური პროდუქტის ნახვა</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.navigation}>
          <Text style={styles.counter}>
            {currentIndex + 1}/{brands.length}
          </Text>
          <TouchableOpacity
            style={[styles.navButton, currentIndex === 0 && styles.navButtonDisabled]}
            onPress={handlePrevious}
            disabled={currentIndex === 0}
          >
            <Ionicons
              name="chevron-back"
              size={20}
              color={currentIndex === 0 ? theme.colors.gray[400] : theme.colors.text.primary}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.navButton,
              currentIndex === brands.length - 1 && styles.navButtonDisabled,
            ]}
            onPress={handleNext}
            disabled={currentIndex === brands.length - 1}
          >
            <Ionicons
              name="chevron-forward"
              size={20}
              color={
                currentIndex === brands.length - 1
                  ? theme.colors.gray[400]
                  : theme.colors.text.primary
              }
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Brands Slider */}
      <FlatList
        ref={flatListRef}
        data={brands}
        renderItem={renderBrandCard}
        keyExtractor={item => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        snapToInterval={SCREEN_WIDTH}
        decelerationRate="fast"
        onScroll={handleScroll}
        scrollEventThrottle={16}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.white,
    paddingVertical: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  navigation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  counter: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginRight: 8,
  },
  navButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  brandCardWrapper: {
    paddingHorizontal: 16,
  },
  brandCard: {
    borderRadius: 12,
    padding: 20,
    gap: 20,
  },
  brandHeader: {
    gap: 12,
  },
  brandLogo: {
    width: 141,
    height: 32,
  },
  brandInfo: {
    gap: 4,
  },
  brandName: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  brandDescription: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  productsSection: {
    position: 'relative',
  },
  productsScroll: {
    gap: 16,
    paddingRight: 100,
  },
  productCardContainer: {
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  gradientOverlay: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 100,
    backgroundColor: 'transparent',
  },
  viewAllButton: {
    backgroundColor: theme.colors.gray[100],
    borderWidth: 1,
    borderColor: theme.colors.gray[600],
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  viewAllButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text.primary,
  },
});
