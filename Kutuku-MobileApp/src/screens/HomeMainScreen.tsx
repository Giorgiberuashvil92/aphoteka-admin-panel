import { SimpleHeader } from '@/src/components/common/SimpleHeader';
import { SearchBar } from '@/src/components/common/SearchBar';
import { MainCategoryCard } from '@/src/components/common/MainCategoryCard';
import type { MainCategoryType } from '@/src/components/common/MainCategoryCard';
import { DeliveryPromoCard } from '@/src/components/common/DeliveryPromoCard';
import { HomeBenefitsRow } from '@/src/components/common/HomeBenefitsRow';
import { BottomNavigation } from '@/src/components/common/BottomNavigation';
import { DrawerMenu } from '@/src/components/common/DrawerMenu';
import { HeroSlider } from '@/src/components/common/HeroSlider';
import { useTabNavigation } from '@/src/hooks/useTabNavigation';
import { NotificationService } from '@/src/services/notification.service';
import { theme } from '@/src/theme';
import { useFocusEffect } from '@react-navigation/native';
import * as SystemUI from 'expo-system-ui';
import { useCallback, useState } from 'react';
import { ScrollView, StatusBar, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const C = {
  bg: theme.colors.screen,
};

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
  onNotifications,
}: HomeMainScreenProps) {
  const tabNav = useTabNavigation();
  const [unreadCount, setUnreadCount] = useState(0);
  const [menuVisible, setMenuVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      void SystemUI.setBackgroundColorAsync(C.bg);
      void NotificationService.getUnreadCount().then(setUnreadCount);
    }, []),
  );

  const heroSlides = [
    {
      id: '1',
      image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800',
      title: 'თქვენი ჯანმრთელობა\nჩვენი პრიორიტეტია',
      description: 'ხარისხიანი მედიკამენტები და\nპროფესიონალური სერვისი',
      buttonText: 'გაიგე მეტი',
    },
    {
      id: '2',
      image: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=800',
      title: '24/7 მიწოდება\nსაქართველოში',
      description: 'სწრაფი მიწოდება\nთქვენი კარიბჭემდე',
      buttonText: 'შეკვეთა',
    },
    {
      id: '3',
      image: 'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=800',
      title: 'სანდო ბრენდები\nერთ ადგილას',
      description: 'ორიგინალური პროდუქცია\nგარანტირებული ხარისხით',
      buttonText: 'კატალოგი',
    },
    {
      id: '4',
      image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800',
      title: 'უსაფრთხო\nგადახდა',
      description: 'ბარათით ან ნაღდი ფულით\nმიტანისას',
      buttonText: 'დეტალები',
    },
  ];

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

      <SafeAreaView style={styles.safe} edges={['top']}>
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
          <HeroSlider slides={heroSlides} onButtonPress={() => onCategory()} />

          <SearchBar placeholder="რას ეძებ?" onPress={onSearch} />

          <View style={styles.categoriesRow}>
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

          <DeliveryPromoCard onPress={onCategory} />

          <HomeBenefitsRow />
        </ScrollView>
      </SafeAreaView>

      <BottomNavigation
        activeTab="home"
        onHomePress={undefined}
        onCategoriesPress={onCategory}
        onCabinetPress={tabNav.onCabinetPress}
        onCartPress={tabNav.onCartPress}
        onProfilePress={tabNav.onProfilePress}
        cartCount={tabNav.cartCount}
        safeAreaColor={C.bg}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.bg,
  },
  safe: {
    flex: 1,
    backgroundColor: C.bg,
  },
  scrollContent: {
    paddingBottom: 8,
  },
  categoriesRow: {
    flexDirection: 'row',
    gap: 14,
    paddingHorizontal: 18,
    marginBottom: 4,
  },
});
