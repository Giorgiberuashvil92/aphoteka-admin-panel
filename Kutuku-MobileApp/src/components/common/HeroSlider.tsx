import { fonts } from '@/src/theme/fonts';
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
  View,
} from 'react-native';

interface HeroSlide {
  id: string;
  image: ImageSourcePropType | string;
  title: string;
  description: string;
  buttonText?: string;
}

interface HeroSliderProps {
  slides: HeroSlide[];
  autoSlideInterval?: number;
  onButtonPress?: (slide: HeroSlide) => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HORIZONTAL_PADDING = 18;
const CARD_WIDTH = SCREEN_WIDTH - HORIZONTAL_PADDING * 2;
const SLIDER_HEIGHT = 268;
const AUTO_SLIDE_INTERVAL = 10000;

const C = {
  navy: '#0D2B78',
  white: '#FFFFFF',
};

export function HeroSlider({
  slides,
  autoSlideInterval = AUTO_SLIDE_INTERVAL,
  onButtonPress,
}: HeroSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const autoSlideTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (slides.length <= 1) return;

    autoSlideTimerRef.current = setInterval(() => {
      setCurrentIndex((prevIndex) => {
        const nextIndex = prevIndex + 1 >= slides.length ? 0 : prevIndex + 1;
        flatListRef.current?.scrollToOffset({
          offset: nextIndex * CARD_WIDTH,
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

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetX = event.nativeEvent.contentOffset.x;
      const newIndex = Math.round(offsetX / CARD_WIDTH);
      if (newIndex !== currentIndex && newIndex >= 0 && newIndex < slides.length) {
        setCurrentIndex(newIndex);
      }
    },
    [currentIndex, slides.length],
  );

  const renderSlide = ({ item }: { item: HeroSlide }) => {
    const imageSource = typeof item.image === 'string' ? { uri: item.image } : item.image;

    return (
      <View style={styles.slideContainer}>
        <Image source={imageSource} style={styles.slideImage} resizeMode="cover" />
        {/* LinearGradient-ის native error (ViewManagerAdapter unimplemented) თავიდან ასაცილებლად */}
        <View style={styles.scrim} pointerEvents="none">
          <View style={styles.scrimStrong} />
          <View style={styles.scrimSoft} />
        </View>
        <View style={styles.textOverlay}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.description}>{item.description}</Text>
          {item.buttonText ? (
            <TouchableOpacity
              style={styles.button}
              onPress={() => onButtonPress?.(item)}
              activeOpacity={0.88}
            >
              <Text style={styles.buttonText}>{item.buttonText}</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    );
  };

  if (slides.length === 0) return null;

  return (
    <View style={styles.wrapper}>
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
        snapToInterval={CARD_WIDTH}
        bounces={false}
        style={styles.list}
      />

      {slides.length > 1 ? (
        <View style={styles.dots} pointerEvents="none">
          {slides.map((_, index) => (
            <View
              key={`dot-${index}`}
              style={[styles.dot, index === currentIndex && styles.dotActive]}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: HORIZONTAL_PADDING,
    height: SLIDER_HEIGHT,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: C.white,
    marginTop: 4,
    marginBottom: 2,
    shadowColor: '#1a2a5e',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  list: {
    flexGrow: 0,
  },
  slideContainer: {
    width: CARD_WIDTH,
    height: SLIDER_HEIGHT,
    position: 'relative',
  },
  slideImage: {
    width: '100%',
    height: '100%',
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
  },
  scrimStrong: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: '58%',
    backgroundColor: 'rgba(255,255,255,0.88)',
  },
  scrimSoft: {
    position: 'absolute',
    left: '48%',
    top: 0,
    bottom: 0,
    width: '28%',
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  textOverlay: {
    position: 'absolute',
    left: 22,
    top: 44,
    right: 80,
  },
  title: {
    fontFamily: fonts.extraBold,
    fontSize: 20,
    lineHeight: 27,
    color: C.navy,
  },
  description: {
    marginTop: 10,
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 18,
    color: C.navy,
    opacity: 0.72,
  },
  button: {
    marginTop: 16,
    backgroundColor: C.navy,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
    alignSelf: 'flex-start',
  },
  buttonText: {
    fontFamily: fonts.semibold,
    color: C.white,
    fontSize: 12,
  },
  dots: {
    position: 'absolute',
    bottom: 18,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 7,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.85)',
  },
  dotActive: {
    backgroundColor: C.navy,
    width: 8,
  },
});
