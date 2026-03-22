import { ProductCard, ProductCardProps } from '@/src/components/ui/ProductCard';
import { theme } from '@/src/theme';
import { useCallback, useRef, useState } from 'react';
import { Dimensions, FlatList, NativeScrollEvent, NativeSyntheticEvent, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SectionHeader } from './SectionHeader';

interface ProductsSliderProps {
  title: string;
  products: ProductCardProps[];
  onProductPress?: (product: ProductCardProps) => void;
  onViewAllPress?: () => void;
  showViewAll?: boolean;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export function ProductsSlider({ 
  title, 
  products, 
  onProductPress,
  onViewAllPress,
  showViewAll = true
}: ProductsSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  // Calculate card width and snap interval
  const productCardWidth = (SCREEN_WIDTH - 32 - 20) / 2; // padding + gap
  const snapInterval = productCardWidth + 20; // card width + gap

  const visibleItemsCount = 2;
  const maxScrollableIndex = Math.max(0, products.length - visibleItemsCount);

  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      flatListRef.current?.scrollToOffset({ 
        offset: newIndex * snapInterval, 
        animated: true 
      });
    }
  }, [currentIndex, snapInterval]);

  const handleNext = useCallback(() => {
    if (currentIndex < maxScrollableIndex) {
      const newIndex = currentIndex + 1;
      flatListRef.current?.scrollToOffset({ 
        offset: newIndex * snapInterval, 
        animated: true 
      });
    }
  }, [currentIndex, maxScrollableIndex, snapInterval]);

  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const newIndex = Math.round(offsetX / snapInterval);

    if (newIndex !== currentIndex && newIndex >= 0 && newIndex <= maxScrollableIndex) {
      setCurrentIndex(newIndex);
    }
  }, [currentIndex, maxScrollableIndex, snapInterval]);

  const renderItem = ({ item }: { item: ProductCardProps }) => (
    <View style={{ width: productCardWidth }}>
      <ProductCard
        {...item}
        onPress={() => onProductPress?.(item)}
      />
    </View>
  );

  const renderSeparator = () => <View style={{ width: 20 }} />;

  return (
    <View style={styles.container}>
      <SectionHeader
        title={title}
        currentIndex={currentIndex}
        totalItems={maxScrollableIndex + 1}
        onPrevious={handlePrevious}
        onNext={handleNext}
        showNavigation={products.length > 2}
      />

      <FlatList
        ref={flatListRef}
        data={products}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        ItemSeparatorComponent={renderSeparator}
        contentContainerStyle={styles.scrollContent}
        bounces={false}
        onScroll={handleScroll}
        pagingEnabled
        snapToInterval={snapInterval}
        decelerationRate="fast"
        scrollEventThrottle={16}
        disableIntervalMomentum
        maxToRenderPerBatch={4}
        windowSize={4}
        removeClippedSubviews
      />

      {showViewAll && (
        <TouchableOpacity style={styles.viewAllButton} onPress={onViewAllPress}>
          <Text style={styles.viewAllText}>ყველას ნახვა</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 32,
    backgroundColor: theme.colors.white,
  },
  scrollContent: {
    paddingHorizontal: 16,
    marginTop: 8,
  },
  viewAllButton: {
    marginHorizontal: 16,
    marginTop: 24,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: theme.colors.primaryDark,
    borderRadius: 4,
    alignItems: 'center',
    minHeight: 38,
    justifyContent: 'center',
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '500',
    color: theme.colors.white,
  },
});
