import { AversiHeader } from '@/src/components/common/AversiHeader';
import { BottomNavigation } from '@/src/components/common/BottomNavigation';
import { useCart } from '@/src/contexts';
import { theme } from '@/src/theme';
import { Ionicons } from '@expo/vector-icons';
import { useRef, useState } from 'react';
import { Animated, Image, SafeAreaView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface CartScreenProps {
  onBack: () => void;
  onCheckout: () => void;
  /** __DEV__ — კალათიდან გადახდაზე BOG-ის იმიტაციის რეჟიმით */
  onDevBogSimulateToPayment?: () => void;
  onSearch: () => void;
  onHomePress: () => void;
  onWishlistPress: () => void;
  onCategoriesPress: () => void;
  onProfilePress: () => void;
}

export function CartScreen({
  onBack,
  onCheckout,
  onDevBogSimulateToPayment,
  onSearch,
  onHomePress,
  onWishlistPress,
  onCategoriesPress,
  onProfilePress,
}: CartScreenProps) {
  const { items: cartItems, removeFromCart, updateQuantity, clearCart, itemCount, totalPrice } = useCart();
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<{code: string; discount: number} | null>(null);
  const [selectedGift, setSelectedGift] = useState<string | null>(null);
  const scrollY = useRef(new Animated.Value(0)).current;

  const handleRemoveItem = (id: string) => {
    removeFromCart(id);
    console.log('Item removed, cart:', cartItems);
  };

  const handleUpdateQuantity = (id: string, delta: number) => {
    const item = cartItems.find((i) => i.id === id);
    if (item) {
      const newQuantity = item.quantity + delta;
      if (newQuantity > 0) {
        updateQuantity(id, newQuantity);
      }
    }
  };

  const handleClearCart = () => {
    clearCart();
    console.log('Cart cleared');
  };

  const handleApplyPromo = () => {
    // Mock promo codes
    const promoCodes: {[key: string]: number} = {
      'SAVE10': 10,
      'SAVE20': 20,
      'WELCOME': 15,
    };

    const upperCode = promoCode.toUpperCase();
    if (promoCodes[upperCode]) {
      setAppliedPromo({
        code: upperCode,
        discount: promoCodes[upperCode],
      });
    } else {
      // Invalid promo code
      setAppliedPromo(null);
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setPromoCode('');
  };

  const subtotal = totalPrice;
  const shipping = 5.0;
  const discount = appliedPromo ? (subtotal * appliedPromo.discount / 100) : 0;
  const total = subtotal + shipping - discount;

  const isEmpty = cartItems.length === 0;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background.secondary} />

      {/* Header */}
      <AversiHeader onSearchPress={onSearch} />

      {isEmpty ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconWrap}>
            <Ionicons name="cart-outline" size={64} color={theme.colors.primary} />
          </View>
          <Text style={styles.emptyTitle}>კალათა ცარიელია</Text>
          <Text style={styles.emptySubtitle}>
            დაამატეთ პროდუქტები და განაგრძეთ შოპინგი
          </Text>
          <TouchableOpacity
            style={styles.continueShoppingButton}
            onPress={onHomePress}
            activeOpacity={0.85}
          >
            <Ionicons name="storefront-outline" size={20} color={theme.colors.white} />
            <Text style={styles.continueShoppingButtonText}>შოპინგის გაგრძელება</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <Animated.ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { y: scrollY } } }],
              { useNativeDriver: true }
            )}
            scrollEventThrottle={16}
          >
            {/* Cart Header */}
            <View style={styles.cartHeader}>
              <Text style={styles.cartTitle}>ჩემი კალათა</Text>
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{cartItems.length}</Text>
              </View>
            </View>

            {/* Action: Clear cart */}
            <TouchableOpacity
              style={styles.clearCartButton}
              onPress={handleClearCart}
              activeOpacity={0.7}
            >
              <Ionicons name="trash-outline" size={18} color={theme.colors.error} />
              <Text style={styles.clearCartText}>კალათის გასუფთავება</Text>
            </TouchableOpacity>

            {/* Cart Items - Cards */}
            <View style={styles.cartItemsContainer}>
              {cartItems.map((item) => (
                <View key={item.id} style={styles.cartItemCard}>
                  <Image
                    source={{ uri: item.image || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=200' }}
                    style={styles.productImage}
                  />
                  <View style={styles.productInfo}>
                    <Text style={styles.productTitle} numberOfLines={2}>
                      {item.name}
                    </Text>
                    {item.packageSize ? (
                      <Text style={styles.packageLabel}>შეფუთვა: {item.packageSize}</Text>
                    ) : null}
                    <View style={styles.priceQuantityRow}>
                      <Text style={styles.productPrice}>
                        {(item.price * item.quantity).toFixed(2)}₾
                      </Text>
                      <View style={styles.quantityControls}>
                        <TouchableOpacity
                          style={[styles.quantityButton, item.quantity === 1 && styles.quantityButtonDisabled]}
                          onPress={() => handleUpdateQuantity(item.id, -1)}
                          disabled={item.quantity === 1}
                        >
                          <Ionicons
                            name="remove"
                            size={18}
                            color={item.quantity === 1 ? theme.colors.gray[500] : theme.colors.text.primary}
                          />
                        </TouchableOpacity>
                        <Text style={styles.quantityValue}>{item.quantity}</Text>
                        <TouchableOpacity
                          style={styles.quantityButton}
                          onPress={() => handleUpdateQuantity(item.id, 1)}
                        >
                          <Ionicons name="add" size={18} color={theme.colors.text.primary} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => handleRemoveItem(item.id)}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  >
                    <Ionicons name="close-circle" size={24} color={theme.colors.gray[500]} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            {/* Gift block */}
            {subtotal >= 50 && (
              <View style={styles.giftSection}>
                <View style={styles.giftHeader}>
                  <Ionicons name="gift-outline" size={22} color={theme.colors.primary} />
                  <Text style={styles.giftTitle}>საჩუქარი 50₾+</Text>
                </View>
                <Text style={styles.giftSubtitle}>
                  აირჩიეთ ერთი საჩუქარი შეძენისას
                </Text>
                <View style={styles.giftProducts}>
                  {[
                    { id: 'gift1', name: 'ვიტამინი C 500mg', image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=200' },
                    { id: 'gift2', name: 'სახის ნიღაბი', image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=200' },
                    { id: 'gift3', name: 'ხელის კრემი', image: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=200' },
                  ].map((gift) => (
                    <TouchableOpacity
                      key={gift.id}
                      style={[styles.giftCard, selectedGift === gift.id && styles.giftCardSelected]}
                      onPress={() => setSelectedGift(selectedGift === gift.id ? null : gift.id)}
                      activeOpacity={0.8}
                    >
                      {selectedGift === gift.id && (
                        <View style={styles.giftCheck}>
                          <Ionicons name="checkmark" size={14} color={theme.colors.white} />
                        </View>
                      )}
                      <Image source={{ uri: gift.image }} style={styles.giftImage} />
                      <Text style={styles.giftName} numberOfLines={2}>{gift.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Promo card */}
            <View style={styles.promoCard}>
              <Ionicons name="pricetag-outline" size={20} color={theme.colors.primary} />
              <View style={styles.promoContent}>
                <Text style={styles.promoCodeTitle}>პრომო კოდი</Text>
                {!appliedPromo ? (
                  <View style={styles.promoCodeInputContainer}>
                    <TextInput
                      style={styles.promoCodeInput}
                      placeholder="მაგ. SAVE10"
                      placeholderTextColor={theme.colors.text.tertiary}
                      value={promoCode}
                      onChangeText={setPromoCode}
                      autoCapitalize="characters"
                    />
                    <TouchableOpacity
                      style={[styles.applyPromoButton, !promoCode.trim() && styles.applyPromoButtonDisabled]}
                      onPress={handleApplyPromo}
                      disabled={!promoCode.trim()}
                    >
                      <Text style={styles.applyPromoButtonText}>გამოყენება</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.appliedPromoContainer}>
                    <View style={styles.appliedPromoInfo}>
                      <Ionicons name="checkmark-circle" size={22} color={theme.colors.success} />
                      <Text style={styles.appliedPromoCode}>{appliedPromo.code}</Text>
                      <Text style={styles.appliedPromoDiscount}>-{appliedPromo.discount}%</Text>
                    </View>
                    <TouchableOpacity onPress={handleRemovePromo} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      <Ionicons name="close-circle-outline" size={22} color={theme.colors.text.secondary} />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>

            {/* Order summary card */}
            <View style={styles.orderSummaryCard}>
              <Text style={styles.orderSummaryTitle}>შეკვეთის შეჯამება</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>ქვეჯამი</Text>
                <Text style={styles.summaryValue}>{subtotal.toFixed(2)}₾</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>მიწოდება</Text>
                <Text style={styles.summaryValue}>{shipping.toFixed(2)}₾</Text>
              </View>
              {appliedPromo ? (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>ფასდაკლება</Text>
                  <Text style={styles.summaryDiscountValue}>-{discount.toFixed(2)}₾</Text>
                </View>
              ) : null}
              <View style={styles.summaryDivider} />
              <View style={styles.summaryRowTotal}>
                <Text style={styles.summaryTotalLabel}>სულ</Text>
                <Text style={styles.summaryTotalValue}>{total.toFixed(2)}₾</Text>
              </View>
              <TouchableOpacity
                style={styles.checkoutButton}
                onPress={onCheckout}
                activeOpacity={0.9}
              >
                <Text style={styles.checkoutButtonText}>გაგრძელება — {total.toFixed(2)}₾</Text>
                <Ionicons name="arrow-forward" size={20} color={theme.colors.white} />
              </TouchableOpacity>
              {typeof __DEV__ !== 'undefined' &&
              __DEV__ &&
              onDevBogSimulateToPayment ? (
                <TouchableOpacity
                  style={styles.devSimulateCartButton}
                  onPress={onDevBogSimulateToPayment}
                  activeOpacity={0.85}
                >
                  <Ionicons name="flask-outline" size={18} color="#78350f" />
                  <Text style={styles.devSimulateCartButtonText}>
                    დევ: გადახდა BOG-ის გარეთ (სიმულაცია)
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>

            <View style={styles.bottomSpacer} />
          </Animated.ScrollView>
        </>
      )}

      <BottomNavigation
        activeTab="cart"
        onHomePress={onHomePress}
        onWishlistPress={onWishlistPress}
        onCategoriesPress={onCategoriesPress}
        onCartPress={undefined}
        onProfilePress={onProfilePress}
        wishlistCount={0}
        cartCount={itemCount}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.secondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyIconWrap: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: theme.colors.purple[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 15,
    color: theme.colors.text.secondary,
    marginBottom: 32,
    textAlign: 'center',
    lineHeight: 22,
  },
  continueShoppingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 28,
    paddingVertical: 16,
    borderRadius: theme.borderRadius.lg,
    ...theme.shadows.sm,
  },
  continueShoppingButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.white,
  },
  cartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  cartTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  cartBadge: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.full,
  },
  cartBadgeText: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.white,
  },
  clearCartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 20,
    marginBottom: 16,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.gray[300],
  },
  clearCartText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.error,
  },
  cartItemsContainer: {
    paddingHorizontal: 20,
    gap: 12,
  },
  cartItemCard: {
    flexDirection: 'row',
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    padding: 14,
    alignItems: 'center',
    ...theme.shadows.xs,
  },
  productImage: {
    width: 88,
    height: 88,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.gray[200],
  },
  productInfo: {
    flex: 1,
    marginLeft: 14,
    justifyContent: 'space-between',
    minHeight: 88,
  },
  productTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  packageLabel: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    marginBottom: 8,
  },
  priceQuantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  productPrice: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.gray[100],
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.gray[400],
    paddingHorizontal: 6,
    paddingVertical: 4,
    gap: 4,
  },
  quantityButton: {
    padding: 6,
  },
  quantityButtonDisabled: {
    opacity: 0.6,
  },
  quantityValue: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.text.primary,
    minWidth: 24,
    textAlign: 'center',
  },
  removeButton: {
    padding: 4,
    marginLeft: 4,
  },
  giftSection: {
    marginTop: 24,
    marginHorizontal: 20,
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    padding: 18,
    borderWidth: 1,
    borderColor: theme.colors.purple[200],
    ...theme.shadows.xs,
  },
  giftHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  giftTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  giftSubtitle: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    marginBottom: 14,
  },
  giftProducts: {
    flexDirection: 'row',
    gap: 12,
  },
  giftCard: {
    flex: 1,
    backgroundColor: theme.colors.gray[50],
    borderRadius: theme.borderRadius.md,
    padding: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  giftCardSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.purple[100],
  },
  giftCheck: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  giftImage: {
    width: 56,
    height: 56,
    borderRadius: theme.borderRadius.sm,
    marginBottom: 6,
  },
  giftName: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.colors.text.primary,
    textAlign: 'center',
  },
  promoCard: {
    flexDirection: 'row',
    marginTop: 24,
    marginHorizontal: 20,
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    padding: 16,
    gap: 14,
    ...theme.shadows.xs,
  },
  promoContent: {
    flex: 1,
  },
  promoCodeTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 10,
  },
  promoCodeInputContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  promoCodeInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.colors.gray[500],
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: theme.colors.text.primary,
  },
  applyPromoButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: theme.borderRadius.sm,
    justifyContent: 'center',
  },
  applyPromoButtonDisabled: {
    backgroundColor: theme.colors.gray[500],
    opacity: 0.8,
  },
  applyPromoButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.white,
  },
  appliedPromoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.background.purple.light,
    borderRadius: theme.borderRadius.sm,
    padding: 12,
    borderWidth: 1,
    borderColor: theme.colors.purple[300],
  },
  appliedPromoInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  appliedPromoCode: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  appliedPromoDiscount: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.success,
  },
  orderSummaryCard: {
    marginTop: 24,
    marginHorizontal: 20,
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    padding: 20,
    ...theme.shadows.sm,
  },
  orderSummaryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  summaryLabel: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text.primary,
  },
  summaryDiscountValue: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.success,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: theme.colors.gray[300],
    marginVertical: 12,
  },
  summaryRowTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  summaryTotalLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  summaryTotalValue: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  checkoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: theme.colors.primary,
    paddingVertical: 16,
    borderRadius: theme.borderRadius.lg,
    marginTop: 20,
    ...theme.shadows.md,
  },
  checkoutButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.white,
  },
  devSimulateCartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#fcd34d',
  },
  devSimulateCartButtonText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#78350f',
    textAlign: 'center',
  },
  bottomSpacer: {
    height: 24,
  },
});
