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
import {
  PrescriptionsApi,
  type MyPrescriptionRow,
} from '@/src/services/prescriptions.service';
import { ProductService } from '@/src/services/product.service';
import { PromotionService, mapPromotionToBrandSlide } from '@/src/services/promotion.service';
import { FavoriteService } from '@/src/services/favorite.service';
import { NotificationService } from '@/src/services/notification.service';
import { theme } from '@/src/theme';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

/** კარტზე/სიაში: მხოლოდ genericName — ბრენდის/სრული name არ ჩანს */
function productCardDisplayName(p: { genericName?: string }) {
  const gen = (p.genericName ?? '').trim();
  return { name: gen || '—', genericName: undefined };
}

/** `mapApiProductToMedicine` — `price` უკვე ფასდაკლებულია; `oldPrice` / `discountPercentage` Balance-იდან */
function productCardBalanceDiscountProps(p: {
  price: number;
  oldPrice?: number;
  discountPercentage?: number;
}) {
  const sale = Number(p.price);
  const list = p.oldPrice != null ? Number(p.oldPrice) : NaN;
  const pctRaw = p.discountPercentage;
  const pct =
    typeof pctRaw === 'number' &&
    Number.isFinite(pctRaw) &&
    pctRaw > 0 &&
    Number.isFinite(list) &&
    list > sale
      ? Math.round(pctRaw)
      : undefined;
  return {
    currentPrice: sale,
    originalPrice: pct != null ? list : undefined,
    discount: pct,
  };
}

type PrescribedChip = { productId: string; productName: string; quantity: number };

function mergePrescribedItems(rows: MyPrescriptionRow[]): PrescribedChip[] {
  const seen = new Set<string>();
  const out: PrescribedChip[] = [];
  for (const row of rows) {
    for (const it of row.items ?? []) {
      const pid = (it.productId ?? '').trim();
      if (!pid || seen.has(pid)) continue;
      seen.add(pid);
      out.push({
        productId: pid,
        productName: (it.productName ?? '').trim() || 'პროდუქტი',
        quantity: Number(it.quantity) || 0,
      });
    }
  }
  return out;
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
  const { itemCount, addToCart } = useCart();
  const { favoriteCount } = useFavorites();
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
  const [prescribedItems, setPrescribedItems] = useState<PrescribedChip[]>([]);
  const [prescribedLoading, setPrescribedLoading] = useState(false);
  const [prescribedAuthed, setPrescribedAuthed] = useState(false);
  /** რატომ არ ჩანს დანიშნულებები (დიაგნოსტიკა / სხვადასხვა ტექსტი UI-ში) */
  const [prescribedAuthIssue, setPrescribedAuthIssue] = useState<
    'none' | 'no_token' | 'unauthorized' | 'network' | 'unknown'
  >('none');
  const [prescribedModalVisible, setPrescribedModalVisible] = useState(false);
  const [prescribedSelectedIds, setPrescribedSelectedIds] = useState<Set<string>>(() => new Set());
  const [prescribedBulkAdding, setPrescribedBulkAdding] = useState(false);

  const addPrescribedToCartAsync = useCallback(
    async (it: PrescribedChip): Promise<boolean> => {
      try {
        const p = await ProductService.getProductById(it.productId);
        if (!p) return false;
        const displayName = (p.genericName ?? '').trim() || p.name;
        const qty = it.quantity > 0 ? Math.min(it.quantity, 99) : 1;
        addToCart(
          {
            id: String(p.id),
            name: displayName,
            price: Number(p.price) || 0,
            image: p.thumbnail || '',
            packageSize: p.packSize,
            form: p.dosageForm,
            maxQuantity: p.stockQuantity ?? undefined,
          },
          qty
        );
        return true;
      } catch {
        return false;
      }
    },
    [addToCart]
  );

  const closePrescribedModal = useCallback(() => {
    setPrescribedModalVisible(false);
  }, []);

  const openPrescribedModal = useCallback(() => {
    if (prescribedLoading) return;
    setPrescribedModalVisible(true);
    if (prescribedAuthed && prescribedItems.length > 0) {
      setPrescribedSelectedIds(new Set(prescribedItems.map((i) => i.productId)));
    } else {
      setPrescribedSelectedIds(new Set());
    }
  }, [prescribedLoading, prescribedAuthed, prescribedItems]);

  const togglePrescribedSelection = useCallback((productId: string) => {
    setPrescribedSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) next.delete(productId);
      else next.add(productId);
      return next;
    });
  }, []);

  const selectAllPrescribed = useCallback(() => {
    setPrescribedSelectedIds(new Set(prescribedItems.map((i) => i.productId)));
  }, [prescribedItems]);

  const selectNonePrescribed = useCallback(() => {
    setPrescribedSelectedIds(new Set());
  }, []);

  const addSelectedPrescribedToCart = useCallback(async () => {
    const ids = Array.from(prescribedSelectedIds);
    if (ids.length === 0) {
      Alert.alert('არჩევა', 'მონიშნეთ მინიმუმ ერთი წამალი.');
      return;
    }
    setPrescribedBulkAdding(true);
    let ok = 0;
    let fail = 0;
    try {
      for (const productId of ids) {
        const it = prescribedItems.find((x) => x.productId === productId);
        if (!it) continue;
        const success = await addPrescribedToCartAsync(it);
        if (success) ok++;
        else fail++;
      }
      if (fail === 0) {
        Alert.alert('კალათა', ok === 1 ? 'დამატებულია კალათაში.' : `${ok} პოზიცია დამატებულია კალათაში.`);
        closePrescribedModal();
      } else {
        Alert.alert(
          'დასრულდა',
          ok > 0 ? `${ok} დამატებულია, ${fail} ვერ მოხერხდა.` : 'კალათაში დამატება ვერ მოხერხდა.'
        );
      }
    } finally {
      setPrescribedBulkAdding(false);
    }
  }, [prescribedSelectedIds, prescribedItems, addPrescribedToCartAsync, closePrescribedModal]);

  const loadPrescribedMedicines = useCallback(async () => {
    setPrescribedLoading(true);
    try {
      const r = await PrescriptionsApi.getMyPrescriptions();
      if (r.ok) {
        setPrescribedAuthed(true);
        setPrescribedAuthIssue('none');
        setPrescribedItems(mergePrescribedItems(r.prescriptions));
        return;
      }
      if (r.error === 'no_token') {
        setPrescribedAuthed(false);
        setPrescribedAuthIssue('no_token');
        setPrescribedItems([]);
        return;
      }
      if (r.error === 'unauthorized') {
        setPrescribedAuthed(false);
        setPrescribedAuthIssue('unauthorized');
        setPrescribedItems([]);
        return;
      }
      if (r.error === 'network') {
        setPrescribedAuthed(true);
        setPrescribedAuthIssue('network');
        setPrescribedItems([]);
        return;
      }
      setPrescribedAuthed(true);
      setPrescribedAuthIssue('unknown');
      setPrescribedItems([]);
    } finally {
      setPrescribedLoading(false);
    }
  }, []);

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
      loadUnreadCount();
      loadPromotions();
      void loadPrescribedMedicines();
    }, [loadPrescribedMedicines])
  );

  const loadUnreadCount = async () => {
    const count = await NotificationService.getUnreadCount();
    setUnreadCount(count);
  };

  const loadProducts = async () => {
    try {
      setLoading(true);
      const fromApi = await ProductService.getFeaturedProducts(8);
      setProducts(
        fromApi.map((p) => ({
          id: p.id,
          title: p.name,
          genericName: p.genericName,
          brand: p.manufacturer,
          price: p.price,
          oldPrice: p.oldPrice,
          discountPercentage: p.discountPercentage,
          thumbnail: p.thumbnail,
          rating: p.rating,
          stock: p.stockQuantity,
          description: p.description,
          reviewCount: p.reviewCount,
        }))
      );
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

      <View style={styles.prescribedSection} testID="home-prescribed-medicines">
        <View style={styles.prescribedHeader}>
          <Ionicons name="medkit-outline" size={20} color={theme.colors.primary} />
          <Text style={styles.prescribedTitle}>ექიმის დანიშნული წამლები</Text>
        </View>
        <TouchableOpacity
          onPress={openPrescribedModal}
          activeOpacity={0.75}
          disabled={prescribedLoading}
          style={styles.prescribedTapArea}
        >
          {prescribedLoading ? (
            <View style={styles.prescribedLoadingRow}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
              <Text style={styles.prescribedHint}>იტვირთება...</Text>
            </View>
          ) : !prescribedAuthed ? (
            <View style={styles.prescribedTapRow}>
              <Text style={styles.prescribedHint}>
                {prescribedAuthIssue === 'unauthorized'
                  ? 'სესია ვადაგასულია ან სერვერმა უარი თქვა წვდომაზე. გახვიდით და თავიდან შედით ანგარიშზე.'
                  : 'შედით ანგარიშზე — დააჭირეთ სრული ინფორმაციისთვის.'}
              </Text>
              <Ionicons name="chevron-forward" size={20} color={theme.colors.text.secondary} />
            </View>
          ) : prescribedItems.length === 0 ? (
            <View style={styles.prescribedTapRow}>
              <Text style={styles.prescribedHint}>
                {prescribedAuthIssue === 'network'
                  ? 'დანიშნულებები ვერ ჩაიტვირთა (ქსელი ან სერვერი მიუწვდომელია). სცადეთ ცოტა ხანში.'
                  : prescribedAuthIssue === 'unknown'
                    ? 'დანიშნულებები ვერ ჩაიტვირთა. სცადეთ მოგვიანებით.'
                    : 'დანიშნულებები ჯერ არ გაქვთ. დააჭირეთ დეტალებისთვის.'}
              </Text>
              <Ionicons name="chevron-forward" size={20} color={theme.colors.text.secondary} />
            </View>
          ) : (
            <View style={styles.prescribedTapRow}>
              <View style={styles.prescribedTapTextBlock}>
                <Text style={styles.prescribedSummaryLine}>
                  დანიშნული წამლები — {prescribedItems.length} პოზიცია
                </Text>
                <Text style={styles.prescribedHintMuted}>დააჭირეთ სიის ნახვას, არჩევას და კალათაში დასამატებლად.</Text>
              </View>
              <Ionicons name="chevron-forward" size={22} color={theme.colors.primary} />
            </View>
          )}
        </TouchableOpacity>
      </View>

      <Modal
        visible={prescribedModalVisible}
        animationType="slide"
        transparent
        onRequestClose={closePrescribedModal}
        testID="home-prescribed-modal"
      >
        <View style={styles.prescribedModalRoot}>
          <Pressable style={styles.prescribedModalBackdrop} onPress={closePrescribedModal} />
          <View style={styles.prescribedModalSheet}>
            <View style={styles.prescribedModalGrab} />
            <View style={styles.prescribedModalHeader}>
              <Text style={styles.prescribedModalTitle}>ექიმის დანიშნულები</Text>
              <TouchableOpacity
                onPress={closePrescribedModal}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                accessibilityLabel="დახურვა"
              >
                <Ionicons name="close" size={26} color={theme.colors.text.primary} />
              </TouchableOpacity>
            </View>
            {!prescribedAuthed ? (
              <View style={styles.prescribedModalBody}>
                <Ionicons
                  name={prescribedAuthIssue === 'unauthorized' ? 'time-outline' : 'lock-closed-outline'}
                  size={48}
                  color={theme.colors.primary}
                  style={styles.prescribedModalLockIcon}
                />
                <Text style={styles.prescribedModalInfoText}>
                  {prescribedAuthIssue === 'unauthorized'
                    ? 'თქვენი სესია სერვერისთვის აღარ არის მოქმედი (JWT ვადა ან უარყოფილი ტოკენი). გახვიდით პროფილიდან და თავიდან შედით — ამის შემდეგ დანიშნულებები ისევ ჩაიტვირთება.'
                    : 'შედით ანგარიშზე — აქ გამოჩნდება ექიმის მიერ დანიშნული მედიკამენტების სია და შეძლებთ აირჩიოთ რისი ყიდვა გსურთ.'}
                </Text>
              </View>
            ) : prescribedItems.length === 0 ? (
              <View style={styles.prescribedModalBody}>
                <Text style={styles.prescribedModalInfoText}>
                  {prescribedAuthIssue === 'network'
                    ? 'ქსელის შეცდომა ან სერვერი დროებით მიუწვდომელია. დახურეთ ფანჯარა და სცადეთ მთავარი გვერდის ხელახლა გახსნა.'
                    : prescribedAuthIssue === 'unknown'
                      ? 'სერვერზე მოულოდნელი პასუხი მოვიდა. სცადეთ მოგვიანებით.'
                      : 'ამჟამად დანიშნული წამლების სია ცარიელია.'}
                </Text>
              </View>
            ) : (
              <>
                <View style={styles.prescribedModalToolbar}>
                  <TouchableOpacity onPress={selectAllPrescribed} hitSlop={8}>
                    <Text style={styles.prescribedModalToolbarLink}>ყველა</Text>
                  </TouchableOpacity>
                  <Text style={styles.prescribedModalToolbarSep}>·</Text>
                  <TouchableOpacity onPress={selectNonePrescribed} hitSlop={8}>
                    <Text style={styles.prescribedModalToolbarLink}>არცერთი</Text>
                  </TouchableOpacity>
                </View>
                <ScrollView
                  style={styles.prescribedModalList}
                  contentContainerStyle={styles.prescribedModalListContent}
                  showsVerticalScrollIndicator={false}
                >
                  {prescribedItems.map((it) => {
                    const checked = prescribedSelectedIds.has(it.productId);
                    return (
                      <TouchableOpacity
                        key={it.productId}
                        style={styles.prescribedModalRow}
                        onPress={() => togglePrescribedSelection(it.productId)}
                        activeOpacity={0.75}
                      >
                        <Ionicons
                          name={checked ? 'checkbox' : 'square-outline'}
                          size={26}
                          color={theme.colors.primary}
                        />
                        <View style={styles.prescribedModalRowText}>
                          <Text style={styles.prescribedModalRowName} numberOfLines={3}>
                            {it.productName}
                          </Text>
                          {it.quantity > 0 ? (
                            <Text style={styles.prescribedModalRowQty}>ექიმის რეკომენდაცია: ×{it.quantity}</Text>
                          ) : (
                            <Text style={styles.prescribedModalRowQty}>რაოდენობა კალათაში: 1</Text>
                          )}
                        </View>
                        <TouchableOpacity
                          style={styles.prescribedModalRowDetails}
                          onPress={() => {
                            closePrescribedModal();
                            onProductPress(it.productId);
                          }}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Ionicons name="information-circle-outline" size={26} color={theme.colors.text.secondary} />
                        </TouchableOpacity>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
                <View style={styles.prescribedModalFooter}>
                  <TouchableOpacity
                    style={[
                      styles.prescribedModalPrimaryBtn,
                      (prescribedSelectedIds.size === 0 || prescribedBulkAdding) && styles.prescribedModalPrimaryBtnDisabled,
                    ]}
                    disabled={prescribedSelectedIds.size === 0 || prescribedBulkAdding}
                    onPress={() => void addSelectedPrescribedToCart()}
                    activeOpacity={0.85}
                  >
                    {prescribedBulkAdding ? (
                      <ActivityIndicator color={theme.colors.white} />
                    ) : (
                      <Text style={styles.prescribedModalPrimaryBtnText}>
                        არჩეულების კალათაში ({prescribedSelectedIds.size})
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

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
                const disc = productCardBalanceDiscountProps({
                  price: Number(product.price) || 0,
                  oldPrice: product.oldPrice,
                  discountPercentage: product.discountPercentage,
                });
                return (
                  <View key={product.id} style={styles.productCardWrapper}>
                    <ProductCard
                      id={product.id.toString()}
                      name={name}
                      currentPrice={disc.currentPrice}
                      originalPrice={disc.originalPrice}
                      discount={disc.discount}
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
            const disc = productCardBalanceDiscountProps({
              price: Number(p.price) || 0,
              oldPrice: p.oldPrice,
              discountPercentage: p.discountPercentage,
            });
            return {
              id: p.id.toString(),
              name,
              currentPrice: disc.currentPrice,
              originalPrice: disc.originalPrice,
              discount: disc.discount,
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
  prescribedSection: {
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.sm,
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.lg,
  },
  prescribedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  prescribedTitle: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  prescribedTapArea: {
    paddingVertical: 4,
  },
  prescribedTapRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  prescribedTapTextBlock: {
    flex: 1,
    minWidth: 0,
  },
  prescribedSummaryLine: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  prescribedHintMuted: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    lineHeight: 17,
  },
  prescribedHint: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    lineHeight: 20,
    flex: 1,
  },
  prescribedLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  prescribedModalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  prescribedModalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  prescribedModalSheet: {
    backgroundColor: theme.colors.white,
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    maxHeight: '88%',
    paddingBottom: theme.spacing.lg,
    ...theme.shadows.md,
  },
  prescribedModalGrab: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.gray[300],
    marginTop: 10,
    marginBottom: 6,
  },
  prescribedModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.gray[200],
  },
  prescribedModalTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    flex: 1,
    paddingRight: 8,
  },
  prescribedModalBody: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.xl,
  },
  prescribedModalLockIcon: {
    alignSelf: 'center',
    marginBottom: theme.spacing.md,
  },
  prescribedModalInfoText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.secondary,
    lineHeight: 22,
    textAlign: 'center',
  },
  prescribedModalToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: theme.spacing.sm,
  },
  prescribedModalToolbarLink: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.primary,
  },
  prescribedModalToolbarSep: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.gray[400],
  },
  prescribedModalList: {
    maxHeight: 360,
  },
  prescribedModalListContent: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
  },
  prescribedModalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.gray[200],
  },
  prescribedModalRowText: {
    flex: 1,
    minWidth: 0,
  },
  prescribedModalRowName: {
    fontSize: 15,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    lineHeight: 21,
  },
  prescribedModalRowQty: {
    marginTop: 4,
    fontSize: 13,
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  prescribedModalRowDetails: {
    padding: 4,
  },
  prescribedModalFooter: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
  },
  prescribedModalPrimaryBtn: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.lg,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  prescribedModalPrimaryBtnDisabled: {
    opacity: 0.45,
  },
  prescribedModalPrimaryBtnText: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.white,
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

