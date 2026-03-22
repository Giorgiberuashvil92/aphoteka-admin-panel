import { useCart } from '@/src/contexts';
import { PaymentService } from '@/src/services/payment.service';
import { theme } from '@/src/theme';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Image, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

type PaymentScreenProps = {
  onBack: () => void;
  onCheckout: () => void;
  onEditAddress: () => void;
  onAddPaymentMethod: () => void;
};

export function PaymentScreen({ onBack, onCheckout, onEditAddress, onAddPaymentMethod }: PaymentScreenProps) {
  const { items: cartItems, totalPrice } = useCart();
  const [selectedPayment, setSelectedPayment] = useState('1');
  const [promoCode, setPromoCode] = useState('');
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);

  const subtotal = totalPrice;
  const shipping = 5.0;
  const total = subtotal + shipping;

  const address = {
    type: 'სახლი',
    street: 'ვაჟა-ფშაველას გამზ. 41',
    city: 'თბილისი, საქართველო, 0177',
  };

  useEffect(() => {
    loadPaymentMethods();
  }, []);

  // Reload when screen comes into focus
  useEffect(() => {
    const interval = setInterval(() => {
      loadPaymentMethods();
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const loadPaymentMethods = () => {
    const cards = PaymentService.getCards();
    const methods = cards.map((card) => ({
      id: card.id,
      name: card.type === 'mastercard' ? 'Master Card' : card.type === 'visa' ? 'Visa Card' : 'PayPal',
      number: card.cardNumber,
      icon: 'card',
    }));
    setPaymentMethods(methods);
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
          <View style={styles.addressCard}>
            <View style={styles.addressIcon}>
              <Ionicons name="home-outline" size={26} color={theme.colors.primary} />
            </View>
            <View style={styles.addressInfo}>
              <Text style={styles.addressType}>{address.type}</Text>
              <Text style={styles.addressStreet}>{address.street}</Text>
              <Text style={styles.addressCity}>{address.city}</Text>
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
              <Text style={styles.countBadgeText}>{cartItems.length}</Text>
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
              <Text style={styles.productPrice}>{(item.price * item.quantity).toFixed(2)}₾</Text>
            </View>
          ))}
        </View>

        {/* Payment methods Card */}
        <View style={styles.card}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="card-outline" size={20} color={theme.colors.primary} />
            <Text style={styles.sectionTitle}>გადახდის მეთოდი</Text>
          </View>
          {paymentMethods.map((method) => (
            <TouchableOpacity
              key={method.id}
              style={[styles.paymentMethod, selectedPayment === method.id && styles.paymentMethodSelected]}
              onPress={() => setSelectedPayment(method.id)}
              activeOpacity={0.8}
            >
              <View style={styles.paymentIcon}>
                <Ionicons
                  name={method.icon as any}
                  size={26}
                  color={selectedPayment === method.id ? theme.colors.primary : theme.colors.gray[500]}
                />
              </View>
              <View style={styles.paymentInfo}>
                <Text style={styles.paymentName}>{method.name}</Text>
                <Text style={styles.paymentNumber}>{method.number}</Text>
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
          <TouchableOpacity style={styles.addPaymentButton} onPress={onAddPaymentMethod} activeOpacity={0.8}>
            <Ionicons name="add-circle-outline" size={22} color={theme.colors.primary} />
            <Text style={styles.addPaymentText}>ახალი ბარათის დამატება</Text>
          </TouchableOpacity>
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
        <TouchableOpacity style={styles.checkoutButton} onPress={onCheckout} activeOpacity={0.9}>
          <Text style={styles.checkoutButtonText}>გადახდა {total.toFixed(2)}₾</Text>
          <Ionicons name="lock-closed" size={18} color={theme.colors.white} />
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
  paymentCheck: {},
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
    marginBottom: 14,
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
    ...theme.shadows.md,
  },
  checkoutButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.white,
  },
});
