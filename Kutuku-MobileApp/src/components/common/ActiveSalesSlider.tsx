import { theme } from '@/src/theme';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
    Dimensions,
    FlatList,
    Image,
    ImageSourcePropType,
    NativeScrollEvent,
    NativeSyntheticEvent,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SectionHeader } from './SectionHeader';

interface ActiveSale {
  id: string;
  title: string;
  description: string;
  image: ImageSourcePropType | string;
  endDate: Date;
}

interface ActiveSalesSliderProps {
  sales: ActiveSale[];
  onLearnMore?: (sale: ActiveSale) => void;
  onViewAll?: () => void;
}

interface CountdownTime {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export function ActiveSalesSlider({ 
  sales, 
  onLearnMore,
  onViewAll 
}: ActiveSalesSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [countdowns, setCountdowns] = useState<{ [key: string]: CountdownTime }>({});
  const flatListRef = useRef<FlatList>(null);

  const cardWidth = SCREEN_WIDTH - 32;
  const snapInterval = cardWidth + 16;
  const maxScrollableIndex = Math.max(0, sales.length - 1);

  // Calculate countdown
  const calculateCountdown = useCallback((endDate: Date): CountdownTime => {
    const now = new Date().getTime();
    const end = new Date(endDate).getTime();
    const diff = end - now;

    if (diff <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return { days, hours, minutes, seconds };
  }, []);

  // Update countdowns every second
  useEffect(() => {
    const updateCountdowns = () => {
      const newCountdowns: { [key: string]: CountdownTime } = {};
      sales.forEach(sale => {
        newCountdowns[sale.id] = calculateCountdown(sale.endDate);
      });
      setCountdowns(newCountdowns);
    };

    updateCountdowns();
    const interval = setInterval(updateCountdowns, 1000);

    return () => clearInterval(interval);
  }, [sales, calculateCountdown]);

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

  const formatTimeNumber = (num: number): string => {
    return num.toString().padStart(2, '0');
  };

  const renderSale = ({ item }: { item: ActiveSale }) => {
    const imageSource = typeof item.image === 'string' 
      ? { uri: item.image } 
      : item.image;
    
    const countdown = countdowns[item.id] || { days: 0, hours: 0, minutes: 0, seconds: 0 };

    return (
      <View style={[styles.saleCard, { width: cardWidth }]}>
        <Image source={imageSource} style={styles.saleImage} resizeMode="cover" />
        
        <View style={styles.saleContent}>
          <Text style={styles.saleTitle} numberOfLines={2}>{item.title}</Text>
          <Text style={styles.saleDescription} numberOfLines={2}>
            {item.description}
          </Text>

          {/* Countdown Timer */}
          <View style={styles.countdownContainer}>
            <View style={styles.countdownItem}>
              <Text style={styles.countdownNumber}>{formatTimeNumber(countdown.days)}</Text>
              <Text style={styles.countdownLabel}>დღე</Text>
            </View>
            <Text style={styles.countdownSeparator}>:</Text>
            
            <View style={styles.countdownItem}>
              <Text style={styles.countdownNumber}>{formatTimeNumber(countdown.hours)}</Text>
              <Text style={styles.countdownLabel}>სთ</Text>
            </View>
            <Text style={styles.countdownSeparator}>:</Text>
            
            <View style={styles.countdownItem}>
              <Text style={styles.countdownNumber}>{formatTimeNumber(countdown.minutes)}</Text>
              <Text style={styles.countdownLabel}>წთ</Text>
            </View>
            <Text style={styles.countdownSeparator}>:</Text>
            
            <View style={styles.countdownItem}>
              <Text style={styles.countdownNumber}>{formatTimeNumber(countdown.seconds)}</Text>
              <Text style={styles.countdownLabel}>წმ</Text>
            </View>
          </View>

          <TouchableOpacity 
            style={styles.learnMoreButton}
            onPress={() => onLearnMore?.(item)}
          >
            <Text style={styles.learnMoreText}>მეტის ნახვა</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderSeparator = () => <View style={{ width: 16 }} />;

  if (sales.length === 0) return null;

  return (
    <View style={styles.container}>
      <SectionHeader
        title="აქტიური გაყიდვები"
        currentIndex={currentIndex}
        totalItems={maxScrollableIndex + 1}
        onPrevious={handlePrevious}
        onNext={handleNext}
        showNavigation={sales.length > 1}
      />

      <FlatList
        ref={flatListRef}
        data={sales}
        renderItem={renderSale}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        ItemSeparatorComponent={renderSeparator}
        contentContainerStyle={styles.listContent}
        bounces={false}
        onScroll={handleScroll}
        pagingEnabled
        snapToInterval={snapInterval}
        decelerationRate="fast"
        scrollEventThrottle={16}
        disableIntervalMomentum
        maxToRenderPerBatch={2}
        windowSize={3}
        removeClippedSubviews
      />

      {onViewAll && (
        <TouchableOpacity style={styles.viewAllButton} onPress={onViewAll}>
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
  listContent: {
    paddingHorizontal: 16,
    marginTop: 24,
  },
  saleCard: {
    borderRadius: 12,
    backgroundColor: theme.colors.white,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.gray[400],
    ...theme.shadows.md,
  },
  saleImage: {
    width: '100%',
    height: 200,
  },
  saleContent: {
    padding: 16,
    gap: 12,
  },
  saleTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  saleDescription: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    lineHeight: 20,
  },
  countdownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  countdownItem: {
    alignItems: 'center',
    gap: 4,
  },
  countdownNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  countdownLabel: {
    fontSize: 12,
    color: theme.colors.text.secondary,
  },
  countdownSeparator: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  learnMoreButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: theme.colors.primaryDark,
    borderRadius: 4,
    alignItems: 'center',
  },
  learnMoreText: {
    fontSize: 13,
    fontWeight: '500',
    color: theme.colors.white,
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
