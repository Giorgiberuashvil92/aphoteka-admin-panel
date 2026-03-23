import { DEFAULT_PAYMENT_METHOD_ID } from '@/src/config/paymentMethods.config';
import { useCart } from '@/src/contexts';
import {
  DeliveryAddressService,
  formatShippingAddressLine,
  isDeliveryAddressComplete,
  type DeliveryAddress,
} from '@/src/services/deliveryAddress.service';
import { OrdersService } from '@/src/services/orders.service';
import {
  PaymentService,
  type PaymentMethodRow,
} from '@/src/services/payment.service';
import { UserService } from '@/src/services/user.service';
import { theme } from '@/src/theme';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const MONGO_OBJECT_ID_RE = /^[a-fA-F0-9]{24}$/;

function coerceUnitPrice(value: number | string | undefined | null): number {
  if (value === undefined || value === null) return NaN;
  if (typeof value === 'number') return Number.isFinite(value) ? value : NaN;
  const n = parseFloat(String(value).trim().replace(',', '.'));
  return Number.isFinite(n) ? n : NaN;
}

function paymentNoteForOrder(
  selectedId: string,
  row: PaymentMethodRow | undefined,
): string {
  if (!row) return 'გადახდა: არჩეული მეთოდი';
  if (row.id === 'cod') return 'გადახდა: ნაღდი მიტანისას';
  if (row.kind === 'card') {
    return `გადახდა: ბარათი — ${row.name}, ${row.number}`;
  }
  return `გადახდა: ${row.name} — ${row.number}`;
}

type PaymentScreenProps = {
  onBack: () => void;
  /** შეკვეთა წარმატებით შეიქმნა სერვერზე */
  onOrderPlaced: (orderId: string) => void;
  /** JWT არ არის — გადასვლა შესვლაზე */
  onLoginRequired: () => void;
  onEditAddress: () => void;
  onAddPaymentMethod: () => void;
};

export function PaymentScreen({
  onBack,
  onOrderPlaced,
  onLoginRequired,
  onEditAddress,
  onAddPaymentMethod,
}: PaymentScreenProps) {
  const { items: cartItems, totalPrice, clearCartSilently, itemCount } = useCart();
  const [selectedPayment, setSelectedPayment] = useState(DEFAULT_PAYMENT_METHOD_ID);
  const [promoCode, setPromoCode] = useState('');
  const [paymentRows, setPaymentRows] = useState<PaymentMethodRow[]>([]);
  const [paymentMethodsLoading, setPaymentMethodsLoading] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [delivery, setDelivery] = useState<DeliveryAddress | null>(null);

  const subtotal = totalPrice;
  const shipping = 5.0;
  const total = subtotal + shipping;

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      setPaymentMethodsLoading(true);
      void (async () => {
        try {
          const [del, rows] = await Promise.all([
            DeliveryAddressService.get(),
            PaymentService.getPaymentRows(),
          ]);
          if (cancelled) return;
          setDelivery(del);
          setPaymentRows(rows);
          setSelectedPayment((prev) =>
            rows.some((r) => r.id === prev) ? prev : DEFAULT_PAYMENT_METHOD_ID,
          );
        } finally {
          if (!cancelled) setPaymentMethodsLoading(false);
        }
      })();
      return () => {
        cancelled = true;
      };
    }, []),
  );

  const handlePlaceOrder = async () => {
    if (placingOrder) return;

    const token = await UserService.getAccessToken();
    if (!token) {
      Alert.alert('შესვლა საჭიროა', 'შეკვეთის გასაფორმებლად გაიარეთ ავტორიზაცია.', [
        { text: 'გაუქმება', style: 'cancel' },
        { text: 'შესვლა', onPress: onLoginRequired },
      ]);
      return;
    }

    if (!cartItems.length) {
      Alert.alert('კალათა ცარიელია', 'დაამატეთ პროდუქტები კალათაში.');
      onBack();
      return;
    }

    if (paymentMethodsLoading || !paymentRows.length) {
      Alert.alert('იტვირთება', 'დაელოდეთ გადახდის მეთოდების ჩატვირთვას.');
      return;
    }
    if (!paymentRows.some((r) => r.id === selectedPayment)) {
      Alert.alert('გადახდა', 'აირჩიეთ გადახდის მეთოდი.');
      return;
    }

    const latest = await DeliveryAddressService.get();
    if (!latest || !isDeliveryAddressComplete(latest)) {
      Alert.alert(
        'მისამართი საჭიროა',
        'გადახდამდე შეავსეთ მიწოდების მისამართი და ტელეფონი.',
        [
          { text: 'გაუქმება', style: 'cancel' },
          { text: 'მისამართი', onPress: onEditAddress },
        ],
      );
      return;
    }

    const line = formatShippingAddressLine(latest);
    const phoneForOrder = latest.phone.replace(/\s/g, '').trim();

    for (const item of cartItems) {
      if (!MONGO_OBJECT_ID_RE.test(String(item.id).trim())) {
        Alert.alert(
          'პროდუქტი ვერ მოიძებნა',
          'კალათაში არის პროდუქტი სერვერის ID-ს გარეშე. გახსენით კატალოგიდან და თავიდან დაამატეთ.'
        );
        return;
      }
      const unit = coerceUnitPrice(item.price);
      if (!Number.isFinite(unit) || unit < 0) {
        Alert.alert('ფასის შეცდომა', `პროდუქტი „${item.name}“ — ფასი არასწორია.`);
        return;
      }
    }

    const selected = paymentRows.find((m) => m.id === selectedPayment);
    const paymentNote = paymentNoteForOrder(selectedPayment, selected);

    setPlacingOrder(true);
    try {
      const result = await OrdersService.createOrder({
        items: cartItems.map((item) => ({
          productId: String(item.id).trim(),
          productName: item.name,
          quantity: item.quantity,
          unitPrice: coerceUnitPrice(item.price),
          imageUrl: item.image?.trim() || undefined,
          packSize: item.packageSize,
        })),
        shippingAddress: line,
        phoneNumber: phoneForOrder,
        comment: `${paymentNote}; მიწოდების საფასური (შეფასება აპში): ${shipping.toFixed(2)}₾; ჯამი აპში (პროდუქტები+მიწოდება): ${total.toFixed(2)}₾`,
      });

      if (!result.ok) {
        if (result.error === 'auth') {
          Alert.alert('სესია', result.message ?? 'საჭიროა ხელახალი შესვლა', [
            { text: 'გაუქმება', style: 'cancel' },
            { text: 'შესვლა', onPress: onLoginRequired },
          ]);
        } else {
          Alert.alert('შეკვეთა ვერ შეიქმნა', result.message ?? 'სცადეთ ხელახლა');
        }
        return;
      }

      clearCartSilently();
      onOrderPlaced(result.orderId);
    } finally {
      setPlacingOrder(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background.secondary} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.headerButton} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Ionicons name="chevron-back" size={26} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>გადახდა</Text>
        <View style={styles.headerButton} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Address Card */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="location-outline" size={20} color={theme.colors.primary} />
              <Text style={styles.sectionTitle}>მიწოდების მისამართი</Text>
            </View>
            <TouchableOpacity onPress={onEditAddress} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.editButton}>ცვლილება</Text>
            </TouchableOpacity>
          </View>
          <View
            style={[
              styles.addressCard,
              !isDeliveryAddressComplete(delivery) && styles.addressCardWarning,
            ]}
          >
            <View style={styles.addressIcon}>
              <Ionicons name="home-outline" size={26} color={theme.colors.primary} />
            </View>
            <View style={styles.addressInfo}>
              {delivery && isDeliveryAddressComplete(delivery) ? (
                <>
                  <Text style={styles.addressType}>{delivery.label}</Text>
                  <Text style={styles.addressStreet}>{delivery.street}</Text>
                  <Text style={styles.addressCity}>
                    {delivery.city}
                    {delivery.building ? ` · ${delivery.building}` : ''}
                    {delivery.floor ? ` · ${delivery.floor}` : ''}
                  </Text>
                  <Text style={styles.addressPhone}>ტელ: {delivery.phone}</Text>
                </>
              ) : (
                <>
                  <Text style={styles.addressType}>მისამართი არ არის შევსებული</Text>
                  <Text style={styles.addressStreet}>დააჭირეთ „ცვლილება“ — მიუთითეთ ქუჩა, ქალაქი და ტელეფონი</Text>
                </>
              )}
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.gray[500]} />
          </View>
        </View>

        {/* Products Card */}
        <View style={styles.card}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="bag-outline" size={20} color={theme.colors.primary} />
            <Text style={styles.sectionTitle}>პროდუქტები</Text>
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{itemCount}</Text>
            </View>
          </View>
          {cartItems.map((item, index) => (
            <View key={item.id} style={[styles.productItem, index === 0 && styles.productItemFirst]}>
              <Image
                source={{ uri: item.image || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=200' }}
                style={styles.productImage}
                resizeMode="cover"
              />
              <View style={styles.productInfo}>
                <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
                {item.packageSize ? (
                  <Text style={styles.packageLabel}>შეფუთვა: {item.packageSize}</Text>
                ) : null}
                <Text style={styles.productQuantity}>× {item.quantity}</Text>
              </View>
              <Text style={styles.productPrice}>
                {(() => {
                  const u = coerceUnitPrice(item.price);
                  const line = Number.isFinite(u) ? u * item.quantity : 0;
                  return `${line.toFixed(2)}₾`;
                })()}
              </Text>
            </View>
          ))}
        </View>

        {/* Payment methods Card — ჩასმული მეთოდები (კონფიგი) + შენახული ბარათები */}
        <View style={styles.card}>
          <View style={styles.paymentSectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="card-outline" size={20} color={theme.colors.primary} />
              <Text style={styles.sectionTitle}>გადახდის მეთოდი</Text>
            </View>
            {paymentMethodsLoading ? (
              <ActivityIndicator size="small" color={theme.colors.primary} />
            ) : null}
          </View>
          {paymentMethodsLoading && paymentRows.length === 0 ? (
            <View style={styles.paymentLoadingWrap}>
              <ActivityIndicator color={theme.colors.primary} />
              <Text style={styles.paymentLoadingText}>იტვირთება...</Text>
            </View>
          ) : (
            <>
              {paymentRows.map((method) => (
                <TouchableOpacity
                  key={method.id}
                  style={[
                    styles.paymentMethod,
                    selectedPayment === method.id && styles.paymentMethodSelected,
                  ]}
                  onPress={() => setSelectedPayment(method.id)}
                  onLongPress={
                    method.kind === 'card'
                      ? () => {
                          Alert.alert('ბარათის წაშლა', 'წავშალოთ ეს ბარათი მოწყობილობიდან?', [
                            { text: 'არა', style: 'cancel' },
                            {
                              text: 'წაშლა',
                              style: 'destructive',
                              onPress: () => {
                                void (async () => {
                                  await PaymentService.removeCardByRowId(method.id);
                                  const rows = await PaymentService.getPaymentRows();
                                  setPaymentRows(rows);
                                  setSelectedPayment((prev) => {
                                    if (prev !== method.id) {
                                      return rows.some((r) => r.id === prev)
                                        ? prev
                                        : DEFAULT_PAYMENT_METHOD_ID;
                                    }
                                    return rows.some((r) => r.id === DEFAULT_PAYMENT_METHOD_ID)
                                      ? DEFAULT_PAYMENT_METHOD_ID
                                      : rows[0]?.id ?? DEFAULT_PAYMENT_METHOD_ID;
                                  });
                                })();
                              },
                            },
                          ]);
                        }
                      : undefined
                  }
                  activeOpacity={0.8}
                >
                  <View style={styles.paymentIcon}>
                    <Ionicons
                      name={method.icon}
                      size={26}
                      color={
                        selectedPayment === method.id
                          ? theme.colors.primary
                          : theme.colors.gray[500]
                      }
                    />
                  </View>
                  <View style={styles.paymentInfo}>
                    <Text style={styles.paymentName}>{method.name}</Text>
                    <Text style={styles.paymentNumber}>{method.number}</Text>
                    {method.kind === 'card' ? (
                      <Text style={styles.paymentHint}>ხანგრძლივი დაჭერა — წაშლა</Text>
                    ) : null}
                  </View>
                  {selectedPayment === method.id ? (
                    <View style={styles.paymentCheck}>
                      <Ionicons name="checkmark-circle" size={24} color={theme.colors.primary} />
                    </View>
                  ) : (
                    <View style={styles.paymentRadio} />
                  )}
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={styles.addPaymentButton}
                onPress={onAddPaymentMethod}
                activeOpacity={0.8}
              >
                <Ionicons name="add-circle-outline" size={22} color={theme.colors.primary} />
                <Text style={styles.addPaymentText}>ახალი ბარათის დამატება</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Promo Card */}
        <View style={styles.card}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="pricetag-outline" size={20} color={theme.colors.primary} />
            <Text style={styles.sectionTitle}>პრომო კოდი</Text>
          </View>
          <View style={styles.promoInputContainer}>
            <TextInput
              style={styles.promoInput}
              placeholder="მაგ. SAVE10"
              placeholderTextColor={theme.colors.text.tertiary}
              value={promoCode}
              onChangeText={setPromoCode}
              autoCapitalize="characters"
              autoCorrect={false}
            />
            <TouchableOpacity style={styles.promoApplyBtn}>
              <Text style={styles.promoApplyText}>გამოყენება</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryCardTitle}>შეკვეთის ჯამი</Text>
          <Text style={styles.serverNote}>
            სერვერზე ინახება პროდუქტების ჯამი; მიწოდების საფასური აქ არის შეფასება (იხილეთ კომენტარი შეკვეთაში).
          </Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>ქვეჯამი</Text>
            <Text style={styles.summaryValue}>{subtotal.toFixed(2)}₾</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>მიწოდება</Text>
            <Text style={styles.summaryValue}>{shipping.toFixed(2)}₾</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryRowTotal}>
            <Text style={styles.totalLabel}>სულ</Text>
            <Text style={styles.totalValue}>{total.toFixed(2)}₾</Text>
          </View>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Fixed checkout button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.checkoutButton, placingOrder && styles.checkoutButtonDisabled]}
          onPress={handlePlaceOrder}
          activeOpacity={0.9}
          disabled={placingOrder}
        >
          {placingOrder ? (
            <ActivityIndicator color={theme.colors.white} />
          ) : (
            <>
              <Text style={styles.checkoutButtonText}>შეკვეთის გაფორმება · {total.toFixed(2)}₾</Text>
              <Ionicons name="checkmark-done" size={20} color={theme.colors.white} />
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.secondary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: theme.colors.background.secondary,
  },
  headerButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
  },
  card: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    padding: 18,
    marginBottom: 16,
    ...theme.shadows.xs,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  editButton: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  addressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.gray[50],
    borderRadius: theme.borderRadius.md,
    padding: 14,
    gap: 14,
    borderWidth: 1,
    borderColor: theme.colors.gray[300],
  },
  addressCardWarning: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '0F',
  },
  addressIcon: {
    width: 52,
    height: 52,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.purple[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  addressInfo: {
    flex: 1,
  },
  addressType: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  addressStreet: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginBottom: 2,
  },
  addressCity: {
    fontSize: 13,
    color: theme.colors.text.secondary,
  },
  addressPhone: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginTop: 4,
  },
  countBadge: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.full,
  },
  countBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.white,
  },
  productItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.gray[200],
  },
  productItemFirst: {
    borderTopWidth: 0,
  },
  productImage: {
    width: 56,
    height: 56,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.gray[200],
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  packageLabel: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    marginBottom: 2,
  },
  productQuantity: {
    fontSize: 12,
    color: theme.colors.text.tertiary,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  paymentSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  paymentLoadingWrap: {
    paddingVertical: 28,
    alignItems: 'center',
    gap: 10,
  },
  paymentLoadingText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  paymentHint: {
    fontSize: 11,
    color: theme.colors.text.tertiary,
    marginTop: 4,
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.gray[50],
    borderRadius: theme.borderRadius.md,
    padding: 14,
    marginBottom: 10,
    gap: 14,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  paymentMethodSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.purple[100],
  },
  paymentIcon: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  paymentInfo: {
    flex: 1,
  },
  paymentName: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  paymentNumber: {
    fontSize: 13,
    color: theme.colors.text.secondary,
  },
  paymentCheck: {
    marginLeft: 4,
  },
  paymentRadio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: theme.colors.gray[400],
  },
  addPaymentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 10,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    borderStyle: 'dashed',
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.white,
  },
  addPaymentText: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  promoInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  promoInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.colors.gray[400],
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: theme.colors.text.primary,
  },
  promoApplyBtn: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: theme.borderRadius.sm,
    justifyContent: 'center',
  },
  promoApplyText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.white,
  },
  summaryCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    padding: 20,
    marginBottom: 16,
    ...theme.shadows.sm,
  },
  summaryCardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 8,
  },
  serverNote: {
    fontSize: 12,
    lineHeight: 17,
    color: theme.colors.text.tertiary,
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  summaryLabel: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  divider: {
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
  totalLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  totalValue: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  bottomSpacer: {
    height: 8,
  },
  bottomBar: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 24,
    backgroundColor: theme.colors.background.secondary,
  },
  checkoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: theme.colors.primary,
    paddingVertical: 16,
    borderRadius: theme.borderRadius.lg,
    minHeight: 54,
    ...theme.shadows.md,
  },
  checkoutButtonDisabled: {
    opacity: 0.85,
  },
  checkoutButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.white,
  },
});
