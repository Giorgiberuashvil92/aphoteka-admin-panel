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

interface HeroSlide {
  id: string;
  image: ImageSourcePropType | string;
  title: string;
  description: string;
  buttonText: string;
}

interface HeroSliderProps {
  slides: HeroSlide[];
  autoSlideInterval?: number;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SLIDER_HEIGHT = 500;
const AUTO_SLIDE_INTERVAL = 10000; // 10 seconds

export function HeroSlider({ 
  slides, 
  autoSlideInterval = AUTO_SLIDE_INTERVAL 
}: HeroSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const autoSlideTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Auto-slide functionality
  useEffect(() => {
    if (slides.length <= 1) return;

    autoSlideTimerRef.current = setInterval(() => {
      setCurrentIndex((prevIndex) => {
        const nextIndex = prevIndex + 1 >= slides.length ? 0 : prevIndex + 1;
        
        flatListRef.current?.scrollToOffset({
          offset: nextIndex * SCREEN_WIDTH,
          animated: true,
        });

        return nextIndex;
      });
    }, autoSlideInterval);

    return () => {
      if (autoSlideTimerRef.current) {
        clearInterval(autoSlideTimerRef.current);
      }
    };
  }, [slides.length, autoSlideInterval]);

  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const newIndex = Math.round(offsetX / SCREEN_WIDTH);
    
    if (newIndex !== currentIndex && newIndex >= 0 && newIndex < slides.length) {
      setCurrentIndex(newIndex);
    }
  }, [currentIndex, slides.length]);

  const renderSlide = ({ item }: { item: HeroSlide }) => {
    const imageSource = typeof item.image === 'string' 
      ? { uri: item.image } 
      : item.image;

    return (
      <View style={styles.slideContainer}>
        <Image
          source={imageSource}
          style={styles.slideImage}
          resizeMode="cover"
        />
        
        {/* Dark Overlay */}
        <View style={styles.overlay}>
          {/* Content at bottom */}
          <View style={styles.content}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.description}>{item.description}</Text>
          </View>

          {/* Button */}
          <TouchableOpacity style={styles.button}>
            <Text style={styles.buttonText}>{item.buttonText}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Animated pagination dots
  const renderPaginationDots = () => (
    <View style={styles.paginationContainer}>
      {slides.map((_, index) => {
        const isActive = index === currentIndex;
        
        return (
          <View
            key={`dot-${index}`}
            style={[
              styles.paginationDot,
              isActive && styles.paginationDotActive,
            ]}
          />
        );
      })}
    </View>
  );

  if (slides.length === 0) return null;

  return (
    <View style={styles.container}>
      {renderPaginationDots()}
      
      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        scrollEventThrottle={16}
        decelerationRate="fast"
        snapToAlignment="start"
        bounces={false}
        maxToRenderPerBatch={3}
        windowSize={3}
        removeClippedSubviews
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: SLIDER_HEIGHT,
    position: 'relative',
  },
  paginationContainer: {
    position: 'absolute',
    top: 16,
    width: '100%',
    left: 0,
    height: 20,
    zIndex: 1,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  paginationDotActive: {
    width: 24,
    backgroundColor: theme.colors.white,
  },
  slideContainer: {
    width: SCREEN_WIDTH,
    height: SLIDER_HEIGHT,
  },
  slideImage: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
    paddingBottom: 24,
    gap: 20,
  },
  content: {
    gap: 8,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 31,
    fontWeight: '600',
    color: theme.colors.white,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  description: {
    fontSize: 13,
    fontWeight: '400',
    color: theme.colors.white,
    textAlign: 'center',
  },
  button: {
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: theme.colors.white,
    borderRadius: 100,
  },
  buttonText: {
    fontSize: 13,
    fontWeight: '500',
    color: theme.colors.black,
    textTransform: 'uppercase',
  },
});
