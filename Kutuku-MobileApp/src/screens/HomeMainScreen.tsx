import { SimpleHeader } from '@/src/components/common/SimpleHeader';
import { SearchBar } from '@/src/components/common/SearchBar';
import { MainCategoryCard } from '@/src/components/common/MainCategoryCard';
import type { MainCategoryType } from '@/src/components/common/MainCategoryCard';
import { CategoryBanner } from '@/src/components/common/CategoryBanner';
import { BottomNavigation } from '@/src/components/common/BottomNavigation';
import { DrawerMenu } from '@/src/components/common/DrawerMenu';
import { HeroSlider } from '@/src/components/common/HeroSlider';
import { useTabNavigation } from '@/src/hooks/useTabNavigation';
import { NotificationService } from '@/src/services/notification.service';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type HomeMainScreenProps = {
  onSearch: () => void;
  onCategory: () => void;
  onMainCategoryPress: (type: MainCategoryType) => void;
  onProductPress: (productId: string) => void;
  onNotifications: () => void;
  onSeeAllPress?: (query?: string) => void;
  onFavoritesPress?: () => void;
};

export function HomeMainScreen({
  onSearch,
  onCategory,
  onMainCategoryPress,
  onProductPress,
  onNotifications,
  onSeeAllPress,
  onFavoritesPress,
}: HomeMainScreenProps) {
  const tabNav = useTabNavigation();
  const [unreadCount, setUnreadCount] = useState(0);
  const [menuVisible, setMenuVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      void NotificationService.getUnreadCount().then(setUnreadCount);
    }, []),
  );

  const heroSlides = [
    {
      id: '1',
      image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800',
      title: 'თქვენი ჯანმრთელობა ჩვენი პრიორიტეტია',
      description: 'ხარისხიანი მედიკამენტები და პროფესიონალური სერვისი',
      buttonText: 'მეტის ნახვა',
    },
    {
      id: '2',
      image: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=800',
      title: '24/7 მიწოდება',
      description: 'სწრაფი მიწოდება საქართველოს მასშტაბით',
      buttonText: 'შეკვეთა',
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FC" />

      <SimpleHeader
        onMenuPress={() => setMenuVisible(true)}
        onNotificationsPress={onNotifications}
        notificationsCount={unreadCount}
      />

      <DrawerMenu visible={menuVisible} onClose={() => setMenuVisible(false)} onSearch={onSearch} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <HeroSlider slides={heroSlides} />

        {/* Search Bar */}
        <SearchBar 
          placeholder="რას ეძებ?" 
          onPress={onSearch}
        />

        {/* Main Categories (3 cards) */}
        <View style={styles.mainCategoriesContainer}>
          <MainCategoryCard 
            type="medications" 
            onPress={() => onMainCategoryPress('medications')}
          />
          <MainCategoryCard 
            type="cosmetics" 
            onPress={() => onMainCategoryPress('cosmetics')}
          />
          <MainCategoryCard 
            type="mother-child" 
            onPress={() => onMainCategoryPress('mother-child')}
          />
        </View>

        {/* Category Banner */}
        <CategoryBanner onPress={onCategory} />

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <BottomNavigation
        activeTab="home"
        onHomePress={undefined}
        onCategoriesPress={onCategory}
        onCabinetPress={tabNav.onCabinetPress}
        onCartPress={tabNav.onCartPress}
        onProfilePress={tabNav.onProfilePress}
        cartCount={tabNav.cartCount}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FC',
  },
  scrollContent: {
    paddingBottom: 4,
  },
  mainCategoriesContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginTop: 8,
    marginBottom: 8,
  },
  bottomSpacer: {
    height: 16,
  },
});
