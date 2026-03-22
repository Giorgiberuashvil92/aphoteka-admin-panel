import { theme } from '@/src/theme';
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useRef, useState } from 'react';
import {
    Dimensions,
    FlatList,
    Image,
    ListRenderItem,
    NativeScrollEvent,
    NativeSyntheticEvent,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface BlogItem {
  id: string;
  image: string;
  date: string;
  title: string;
  description: string;
  category: string;
}

interface BlogsSliderProps {
  onBlogPress?: (blogId: string) => void;
  onViewAllPress?: () => void;
}

// Mock blog data
const mockBlogs: BlogItem[] = [
  {
    id: '1',
    image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800',
    date: '15 ნოემბერი, 2024',
    title: 'როგორ ავირჩიოთ სწორი ვიტამინები ზამთრისთვის',
    description: 'ზამთრის სეზონი მოითხოვს ორგანიზმის დამატებით მხარდაჭერას. გაიგეთ რომელი ვიტამინები არის აუცილებელი...',
    category: 'ჯანმრთელობა',
  },
  {
    id: '2',
    image: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=800',
    date: '12 ნოემბერი, 2024',
    title: 'გრიპის პროფილაქტიკა და მკურნალობა',
    description: 'გრიპის სეზონი დაიწყო. მნიშვნელოვანია ვიცოდეთ როგორ დავიცვათ თავი და როგორ მოვიქცეთ დაავადების შემთხვევაში...',
    category: 'პრევენცია',
  },
  {
    id: '3',
    image: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800',
    date: '10 ნოემბერი, 2024',
    title: 'ანტიბიოტიკების სწორი გამოყენება',
    description: 'ანტიბიოტიკები ძლიერი მედიკამენტებია, რომელთა არასწორმა გამოყენებამ შეიძლება გამოიწვიოს სერიოზული პრობლემები...',
    category: 'მედიკამენტები',
  },
  {
    id: '4',
    image: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=800',
    date: '8 ნოემბერი, 2024',
    title: 'ბავშვთა იმუნიტეტის გაძლიერება',
    description: 'ბავშვების იმუნიტეტი საჭიროებს განსაკუთრებულ ყურადღებას. რჩევები მშობლებისთვის...',
    category: 'ბავშვები',
  },
];

const categories = ['ყველა', 'ჯანმრთელობა', 'პრევენცია', 'მედიკამენტები', 'ბავშვები'];

export function BlogsSlider({ onBlogPress, onViewAllPress }: BlogsSliderProps) {
  const [selectedCategory, setSelectedCategory] = useState('ყველა');
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const filteredBlogs =
    selectedCategory === 'ყველა'
      ? mockBlogs
      : mockBlogs.filter(blog => blog.category === selectedCategory);

  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      flatListRef.current?.scrollToOffset({
        offset: newIndex * (SCREEN_WIDTH - 32),
        animated: true,
      });
    }
  }, [currentIndex]);

  const handleNext = useCallback(() => {
    if (currentIndex < filteredBlogs.length - 1) {
      const newIndex = currentIndex + 1;
      flatListRef.current?.scrollToOffset({
        offset: newIndex * (SCREEN_WIDTH - 32),
        animated: true,
      });
    }
  }, [currentIndex, filteredBlogs.length]);

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetX = event.nativeEvent.contentOffset.x;
      const itemWidth = SCREEN_WIDTH - 32;
      const newIndex = Math.round(offsetX / itemWidth);

      if (newIndex !== currentIndex && newIndex >= 0 && newIndex < filteredBlogs.length) {
        setCurrentIndex(newIndex);
      }
    },
    [currentIndex, filteredBlogs.length],
  );

  const handleCategoryPress = (category: string) => {
    setSelectedCategory(category);
    setCurrentIndex(0);
    flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
  };

  const renderBlogItem: ListRenderItem<BlogItem> = ({ item }) => (
    <TouchableOpacity
      style={styles.blogCard}
      onPress={() => onBlogPress?.(item.id)}
      activeOpacity={0.7}
    >
      <Image source={{ uri: item.image }} style={styles.blogImage} />
      <View style={styles.blogContent}>
        <Text style={styles.blogDate}>{item.date}</Text>
        <Text style={styles.blogTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.blogDescription} numberOfLines={3}>
          {item.description}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>სამედიცინო ბლოგი</Text>
        <View style={styles.navigation}>
          <Text style={styles.counter}>
            {currentIndex + 1}/{filteredBlogs.length}
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
              currentIndex === filteredBlogs.length - 1 && styles.navButtonDisabled,
            ]}
            onPress={handleNext}
            disabled={currentIndex === filteredBlogs.length - 1}
          >
            <Ionicons
              name="chevron-forward"
              size={20}
              color={
                currentIndex === filteredBlogs.length - 1
                  ? theme.colors.gray[400]
                  : theme.colors.text.primary
              }
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Category Filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtersContainer}
      >
        {categories.map(category => (
          <TouchableOpacity
            key={category}
            style={[
              styles.filterChip,
              selectedCategory === category && styles.filterChipActive,
            ]}
            onPress={() => handleCategoryPress(category)}
          >
            <Text
              style={[
                styles.filterChipText,
                selectedCategory === category && styles.filterChipTextActive,
              ]}
            >
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Blogs Slider */}
      {filteredBlogs.length > 0 && (
        <FlatList
          ref={flatListRef}
          data={filteredBlogs}
          renderItem={renderBlogItem}
          keyExtractor={item => item.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.sliderContainer}
          snapToInterval={SCREEN_WIDTH - 32}
          decelerationRate="fast"
          onScroll={handleScroll}
          scrollEventThrottle={16}
        />
      )}

      {/* View All Button */}
      <TouchableOpacity style={styles.viewAllButton} onPress={onViewAllPress}>
        <Text style={styles.viewAllButtonText}>ყველას ნახვა</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.white,
    paddingVertical: 32,
    gap: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
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
  filtersContainer: {
    gap: 8,
    paddingHorizontal: 16,
  },
  filterChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: theme.colors.gray[600],
    backgroundColor: theme.colors.white,
  },
  filterChipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text.primary,
  },
  filterChipTextActive: {
    color: theme.colors.white,
  },
  sliderContainer: {
    gap: 20,
    paddingHorizontal: 16,
  },
  blogCard: {
    width: SCREEN_WIDTH - 32 - 20,
    backgroundColor: theme.colors.white,
  },
  blogImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    backgroundColor: theme.colors.gray[200],
  },
  blogContent: {
    marginTop: 16,
  },
  blogDate: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.text.secondary,
    marginBottom: 4,
  },
  blogTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 8,
  },
  blogDescription: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    lineHeight: 20,
  },
  viewAllButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 16,
  },
  viewAllButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.white,
  },
});
