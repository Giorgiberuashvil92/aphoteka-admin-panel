import { ActiveSalesSlider } from '@/src/components/common/ActiveSalesSlider';
import { AdvantagesSection } from '@/src/components/common/AdvantagesSection';
import { AversiHeader } from '@/src/components/common/AversiHeader';
import { BlogsSlider } from '@/src/components/common/BlogsSlider';
import { BottomNavigation } from '@/src/components/common/BottomNavigation';
import { BrandsSlider } from '@/src/components/common/BrandsSlider';
import { DrawerMenu } from '@/src/components/common/DrawerMenu';
import { Footer } from '@/src/components/common/Footer';
import { HeroSlider } from '@/src/components/common/HeroSlider';
import { ProductsSlider } from '@/src/components/common/ProductsSlider';
import { ProductCard } from '@/src/components/ui';
import { useCart, useFavorites } from '@/src/contexts';
import { ProductService } from '@/src/services/product.service';
import { PromotionService, mapPromotionToBrandSlide } from '@/src/services/promotion.service';
import { FavoriteService } from '@/src/services/favorite.service';
import { NotificationService } from '@/src/services/notification.service';
import { UserService } from '@/src/services/user.service';
import { theme } from '@/src/theme';
import { useFocusEffect } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

/** კარტზე/სიაში: მხოლოდ genericName — ბრენდის/სრული name არ ჩანს */
function productCardDisplayName(p: { genericName?: string }) {
  const gen = (p.genericName ?? '').trim();
  return { name: gen || '—', genericName: undefined };
}

type HomeMainScreenProps = {
  onSearch: () => void;
  onCategory: () => void;
  onProductPress: (productId: string) => void;
  onNotifications: () => void;
  onMyOrderPress: () => void;
  onSeeAllPress?: () => void;
  onFavoritePress?: () => void;
  onProfilePress?: () => void;
  onCartPress?: () => void;
};

export function HomeMainScreen({ onSearch, onCategory, onProductPress, onNotifications, onMyOrderPress, onSeeAllPress, onFavoritePress, onProfilePress, onCartPress }: HomeMainScreenProps) {
  const { itemCount } = useCart();
  const { favoriteCount } = useFavorites();
  const [userName, setUserName] = useState("Guest");
  const location = "Let's go shopping";

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [promotionBrands, setPromotionBrands] = useState<{
    id: string;
    backgroundColor: string;
    description?: string;
    name?: string;
    logo?: import('react-native').ImageSourcePropType;
    products: { id: string; name: string; currentPrice: number; originalPrice: number; discount: number; image: string }[];
  }[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [unreadCount, setUnreadCount] = useState(0);
  const [menuVisible, setMenuVisible] = useState(false);

  useEffect(() => {
    loadProducts();
    loadPromotions();
  }, []);

  const loadPromotions = async () => {
    try {
      const list = await PromotionService.getActivePromotions();
      setPromotionBrands(list.map(mapPromotionToBrandSlide));
    } catch (e) {
      console.error('Failed to load promotions:', e);
      setPromotionBrands([]);
    }
  };

  // Reload user name, unread count and promotions every time screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadUserName();
      loadUnreadCount();
      loadPromotions();
    }, [])
  );

  const loadUnreadCount = async () => {
    const count = await NotificationService.getUnreadCount();
    setUnreadCount(count);
  };

  const loadUserName = async () => {
    const user = await UserService.getCurrentUser();
    if (user) {
      setUserName(user.firstName);
      console.log('User loaded:', user.firstName);
    } else {
      setUserName('Guest');
      console.log('No user found, showing Guest');
    }
  };

  const loadProducts = async () => {
    try {
      setLoading(true);
      const fromApi = await ProductService.getFeaturedProducts(8);
      setProducts(fromApi.map((p) => ({
        id: p.id,
        title: p.name,
        genericName: p.genericName,
        brand: p.manufacturer,
        price: p.price,
        oldPrice: undefined,
        discountPercentage: undefined,
        thumbnail: p.thumbnail,
        rating: p.rating,
        stock: p.stockQuantity,
        description: p.description,
        reviewCount: p.reviewCount,
      })));
      const favorites = await FavoriteService.getFavorites();
      setFavoriteIds(new Set(favorites.map((fav) => fav.id)));
    } catch (error) {
      console.error('Error loading medicines:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFavorite = async (product: any, event: any) => {
    event.stopPropagation();
    await FavoriteService.toggleFavorite(product);
    
    // Update local state
    const favorites = await FavoriteService.getFavorites();
    setFavoriteIds(new Set(favorites.map(fav => fav.id)));
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.white} />
      
      {/* Aversi Header */}
      <AversiHeader 
        onSearchPress={onSearch}
        onMenuPress={() => setMenuVisible(true)}
        onNotificationsPress={onNotifications}
        notificationsCount={unreadCount}
      />

      {/* Drawer Menu */}
      <DrawerMenu
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        onSearch={onSearch}
      />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero Slider */}
        <HeroSlider
          slides={[
            {
              id: '1',
              image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800',
              title: 'თქვენი ჯანმრთელობა ჩვენი პრიორიტეტია',
              description: 'ხარისხიანი მედიკამენტები და პროფესიონალი სერვისი',
              buttonText: 'მეტის ნახვა',
            },
            {
              id: '2',
              image: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=800',
              title: '24/7 მიწოდება',
              description: 'უფასო მიწოდება 50₾-ზე მეტი შეძენისას',
              buttonText: 'შეკვეთა',
            },
            {
              id: '3',
              image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800',
              title: 'ფარმაცევტის კონსულტაცია',
              description: 'პროფესიონალი დახმარება ყოველ დღე',
              buttonText: 'კონსულტაცია',
            },
          ]}
        />

        {/* Special Promotions - Brands Slider (ბაზიდან / ადმინ პანელიდან) */}
        {promotionBrands.length > 0 && (
          <BrandsSlider
            title="სპეციალური აქციები"
            brands={promotionBrands}
            onProductPress={(product) => onProductPress(product.id)}
          />
        )}

        {/* Active Sales Slider */}
        <ActiveSalesSlider
          sales={[
            {
              id: '1',
              title: 'ზამთრის მეგა გაყიდვები',
              description: 'დაზოგეთ 50%-მდე ყველა ვიტამინზე და დანამატზე',
              image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800',
              endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
            },
            {
              id: '2',
              title: 'ახალი წლის აქცია',
              description: 'სპეციალური ფასები კოსმეტიკურ პროდუქტებზე',
              image: 'https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?w=800',
              endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
            },
          ]}
          onLearnMore={(sale) => console.log('Sale pressed:', sale.id)}
          onViewAll={() => console.log('View all sales')}
        />

        {/* Monthly Deals */}
        {/* <ProductsSlider
          title="თვის შეთავაზებები"
          products={products.slice(0, 6).map(p => ({
            id: p.id.toString(),
            name: p.title,
            currentPrice: p.price * 0.8, // 20% discount
            originalPrice: p.price,
            discount: 20,
            image: p.thumbnail,
            onAddToCart: () => {},
            onToggleWishlist: () => handleToggleFavorite(p, null),
            isInWishlist: favoriteIds.has(p.id),
            onPress: () => onProductPress(p.id.toString()),
          }))}
          onProductPress={(product: any) => onProductPress(product.id)}
          onViewAllPress={onSeeAllPress}
        /> */}

        {/* New Arrivals */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <Text style={styles.sectionTitle}>ახალი პროდუქტები</Text>
              <Text style={styles.fireEmoji}>🔥</Text>
            </View>
            <TouchableOpacity onPress={onSeeAllPress}>
              <Text style={styles.seeAll}>ყველას ნახვა</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
          ) : (
            <View style={styles.productGrid}>
              {products.map((product: any) => {
                const { name } = productCardDisplayName(product);
                return (
                  <View key={product.id} style={styles.productCardWrapper}>
                    <ProductCard
                      id={product.id.toString()}
                      name={name}
                      currentPrice={product.price}
                      originalPrice={product.oldPrice || product.price * 1.2}
                      discount={product.discountPercentage}
                      image={product.thumbnail}
                      rating={4.5}
                      reviewCount={320}
                      stock={product.stock ?? 10}
                      description={product.description || product.descriptionGeo}
                      onPress={() => onProductPress(product.id.toString())}
                      onToggleWishlist={() => handleToggleFavorite(product, null)}
                      isInWishlist={favoriteIds.has(product.id)}
                      showQuickAdd={true}
                    />
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* Recently Viewed Products Slider */}
        {/* <ProductsSlider
          title="ბოლოს დათვალიერებული"
          products={products.slice(0, 6).map(p => ({
            id: p.id.toString(),
            name: p.title,
            genericName: p.genericName,
            currentPrice: p.price,
            image: p.thumbnail,
            onAddToCart: () => {},
            onToggleWishlist: () => handleToggleFavorite(p, null),
            isInWishlist: favoriteIds.has(p.id),
            onPress: () => onProductPress(p.id.toString()),
          }))}
          onProductPress={(product: any) => onProductPress(product.id)}
          onViewAllPress={onSeeAllPress}
        /> */}

        {/* Popular Now Slider */}
        {/* <ProductsSlider
          title="ახლა პოპულარული"
          products={products.slice(0, 6).map(p => ({
            id: p.id.toString(),
            name: p.title,
            currentPrice: p.price,
            image: p.thumbnail,
            onAddToCart: () => {},
            onToggleWishlist: () => handleToggleFavorite(p, null),
            isInWishlist: favoriteIds.has(p.id),
            onPress: () => onProductPress(p.id.toString()),
          }))}
          onProductPress={(product: any) => onProductPress(product.id)}
          onViewAllPress={onSeeAllPress}
        /> */}

        {/* You May Like Slider */}
        <ProductsSlider
          title="შეიძლება დაგაინტერესოს"
          products={products.slice(0, 6).map((p) => {
            const { name } = productCardDisplayName(p);
            return {
              id: p.id.toString(),
              name,
              currentPrice: p.price,
              image: p.thumbnail,
              onAddToCart: () => {},
              onToggleWishlist: () => handleToggleFavorite(p, null),
              isInWishlist: favoriteIds.has(p.id),
              onPress: () => onProductPress(p.id.toString()),
            };
          })}
          onProductPress={(product: any) => onProductPress(product.id)}
          onViewAllPress={onSeeAllPress}
        />

        {/* Advantages Section */}
        <AdvantagesSection />

        {/* Top Brands Slider */}
        {/* <ProductsSlider
          title="ბრენდები და პარტნიორები"
          products={products.slice(0, 6).map(p => ({
            id: p.id.toString(),
            name: p.title,
            currentPrice: p.price,
            image: p.thumbnail,
            onAddToCart: () => {},
            onToggleWishlist: () => handleToggleFavorite(p, null),
            isInWishlist: favoriteIds.has(p.id),
            onPress: () => onProductPress(p.id.toString()),
          }))}
          onProductPress={(product: any) => onProductPress(product.id)}
          onViewAllPress={onSeeAllPress}
        /> */}

        {/* Blogs Slider */}
        <BlogsSlider
          onBlogPress={(blogId) => console.log('Blog pressed:', blogId)}
          onViewAllPress={() => console.log('View all blogs')}
        />

        {/* Footer */}
        <Footer />
      </ScrollView>

      {/* Bottom Navigation */}
      <BottomNavigation
        activeTab="home"
        onHomePress={undefined}
        onWishlistPress={onFavoritePress}
        onCategoriesPress={onCategory}
        onCartPress={onCartPress}
        onProfilePress={onProfilePress}
        wishlistCount={favoriteCount}
        cartCount={itemCount}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.white,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.md,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  greeting: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
  },
  location: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  headerActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.gray[300],
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 6,
    right: 6,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: theme.colors.white,
    fontSize: 10,
    fontWeight: theme.typography.fontWeight.bold,
  },
  section: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  fireEmoji: {
    fontSize: theme.typography.fontSize.lg,
  },
  seeAll: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  productCardWrapper: {
    width: '48%',
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productImagePlaceholder: {
    fontSize: 60,
  },
  bagIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderImage: {
    backgroundColor: theme.colors.gray[100],
  },
  placeholderText: {
    height: 12,
    backgroundColor: theme.colors.gray[200],
    borderRadius: 6,
    marginBottom: theme.spacing.xs,
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: theme.spacing.lg,
    backgroundColor: theme.colors.white,
    borderTopWidth: 1,
    borderTopColor: theme.colors.gray[400],
    ...theme.shadows.md,
  },
  navItem: {
    alignItems: 'center',
    gap: 4,
  },
  navIconContainer: {
    position: 'relative',
  },
  navBadge: {
    position: 'absolute',
    top: -4,
    right: -6,
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  navBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.white,
  },
  navIconActive: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.purple[300],
    justifyContent: 'center',
    alignItems: 'center',
  },
  navText: {
    fontSize: 10,
    color: theme.colors.text.secondary,
  },
  navTextActive: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.semibold,
  },
});
