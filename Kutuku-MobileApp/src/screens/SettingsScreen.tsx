import { BottomNavigation } from '@/src/components/common/BottomNavigation';
import { useCart, useFavorites } from '@/src/contexts';
import { useTabNavigation } from '@/src/hooks/useTabNavigation';
import { OrdersService } from '@/src/services/orders.service';
import { PrescriptionsApi } from '@/src/services/prescriptions.service';
import { UserService } from '@/src/services/user.service';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import {
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const C = {
  bg: '#FFFFFF',
  navy: '#2A3A7A',
  purple: '#5B5FC7',
  lavender: '#E8EAF6',
  text: '#1A1A2E',
  muted: '#9CA3AF',
  border: '#F3F4F6',
};

type SettingsScreenProps = {
  onBack: () => void;
  onMyOrders: () => void;
  onFavorites: () => void;
  onNotifications: () => void;
  onLanguage: () => void;
  onHelpSupport: () => void;
  onAbout: () => void;
  /** პაციენტი — ექიმის მიერ დანიშნული წამლები */
  onDoctorPrescription?: () => void;
  onGoToProfile: () => void;
  isMainTab?: boolean;
};

export function SettingsScreen({
  onBack,
  onMyOrders,
  onFavorites,
  onNotifications,
  onLanguage,
  onHelpSupport,
  onAbout,
  onDoctorPrescription,
  onGoToProfile,
  isMainTab = false,
}: SettingsScreenProps) {
  const insets = useSafeAreaInsets();
  const { itemCount } = useCart();
  const { favoriteCount } = useFavorites();
  const tabNav = useTabNavigation();
  const [firstName, setFirstName] = useState('');
  const [ordersCount, setOrdersCount] = useState(0);
  const [prescriptionCount, setPrescriptionCount] = useState(0);

  const loadData = useCallback(async () => {
    const fresh = await UserService.fetchProfile();
    const user = fresh ?? (await UserService.getCurrentUser());
    if (user?.firstName) {
      setFirstName(user.firstName.trim());
    }

    const [ordersResult, prescriptionsResult] = await Promise.all([
      OrdersService.fetchMyOrders(),
      PrescriptionsApi.getMyPrescriptions(),
    ]);
    setOrdersCount(ordersResult.ok ? ordersResult.orders.length : 0);
    setPrescriptionCount(
      prescriptionsResult.ok ? prescriptionsResult.prescriptions.length : 0,
    );
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadData();
    }, [loadData]),
  );

  const serviceItems = [
    { icon: 'notifications-outline' as const, label: 'შეტყობინებები', onPress: onNotifications },
    { icon: 'language-outline' as const, label: 'ენა', value: 'ქართული', onPress: onLanguage },
    { icon: 'help-circle-outline' as const, label: 'დახმარება', onPress: onHelpSupport },
    { icon: 'information-circle-outline' as const, label: 'აპლიკაციის შესახებ', onPress: onAbout },
  ];

  if (isMainTab) {
    return (
      <View style={[styles.cabinetContainer, { paddingTop: insets.top }]}>
        <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.cabinetScrollContent,
            { paddingBottom: insets.bottom + 88 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.cabinetIntro}>
            <Text style={styles.cabinetGreeting}>
              {firstName ? `გამარჯობა, ${firstName}` : 'გამარჯობა'}
            </Text>
            <Text style={styles.cabinetSub}>
              შეკვეთები, კალათა და სერვისები ერთ ადგილას
            </Text>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statChip}>
              <Text style={styles.statChipValue}>{ordersCount}</Text>
              <Text style={styles.statChipLabel}>შეკვეთა</Text>
            </View>
            <View style={styles.statChip}>
              <Text style={styles.statChipValue}>{itemCount}</Text>
              <Text style={styles.statChipLabel}>კალათა</Text>
            </View>
            <View style={styles.statChip}>
              <Text style={styles.statChipValue}>{favoriteCount}</Text>
              <Text style={styles.statChipLabel}>ფავორიტი</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.ordersCard}
            onPress={onMyOrders}
            activeOpacity={0.88}
          >
            <View style={styles.ordersCardIcon}>
              <Ionicons name="receipt-outline" size={22} color={C.navy} />
            </View>
            <View style={styles.ordersCardBody}>
              <Text style={styles.ordersCardTitle}>ჩემი შეკვეთები</Text>
              <Text style={styles.ordersCardSub}>
                {ordersCount > 0
                  ? `${ordersCount} შეკვეთა ისტორიაში`
                  : 'შეკვეთების ისტორია ცარიელია'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={C.muted} />
          </TouchableOpacity>

          {onDoctorPrescription ? (
            <TouchableOpacity
              style={styles.ordersCard}
              onPress={onDoctorPrescription}
              activeOpacity={0.88}
            >
              <View style={styles.ordersCardIcon}>
                <Ionicons name="medkit-outline" size={22} color={C.navy} />
              </View>
              <View style={styles.ordersCardBody}>
                <Text style={styles.ordersCardTitle}>ექიმის დანიშნულება</Text>
                <Text style={styles.ordersCardSub}>
                  {prescriptionCount > 0
                    ? `${prescriptionCount} დანიშნულება ექიმისგან`
                    : 'ექიმის მიერ დანიშნული წამლები'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={C.muted} />
            </TouchableOpacity>
          ) : null}

          <Text style={styles.sectionTitle}>სწრაფი წვდომა</Text>
          <View style={styles.quickGrid}>
            <TouchableOpacity
              style={styles.quickCard}
              onPress={tabNav.onCartPress}
              activeOpacity={0.85}
            >
              <View style={styles.quickCardIcon}>
                <Ionicons name="cart-outline" size={20} color={C.navy} />
              </View>
              <Text style={styles.quickCardTitle}>კალათა</Text>
              <Text style={styles.quickCardMeta}>
                {itemCount > 0 ? `${itemCount} პროდუქტი` : 'ცარიელი'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickCard}
              onPress={onFavorites}
              activeOpacity={0.85}
            >
              <View style={styles.quickCardIcon}>
                <Ionicons name="heart-outline" size={20} color={C.purple} />
              </View>
              <Text style={styles.quickCardTitle}>ფავორიტები</Text>
              <Text style={styles.quickCardMeta}>
                {favoriteCount > 0 ? `${favoriteCount} პროდუქტი` : 'ცარიელი'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickCard}
              onPress={onNotifications}
              activeOpacity={0.85}
            >
              <View style={styles.quickCardIcon}>
                <Ionicons name="notifications-outline" size={20} color={C.navy} />
              </View>
              <Text style={styles.quickCardTitle}>შეტყობინებები</Text>
              <Text style={styles.quickCardMeta}>ცენტრი</Text>
            </TouchableOpacity>
          </View>



          

          <Text style={styles.versionText}>ვერსია 1.0.0</Text>
        </ScrollView>

        <BottomNavigation
          activeTab="cabinet"
          onHomePress={tabNav.onHomePress}
          onCategoriesPress={tabNav.onCategoriesPress}
          onCabinetPress={undefined}
          onCartPress={tabNav.onCartPress}
          onProfilePress={tabNav.onProfilePress}
          cartCount={tabNav.cartCount}
        />
      </View>
    );
  }

  return (
    <View style={[styles.settingsContainer, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FC" />

      <View style={styles.header}>
        <TouchableOpacity style={styles.headerSide} onPress={onBack}>
          <Ionicons name="chevron-back" size={22} color="#1F2021" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>პარამეტრები</Text>
        <View style={styles.headerSide} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.serviceList}>
          {serviceItems.map((item) => (
            <TouchableOpacity
              key={item.label}
              style={styles.serviceRow}
              onPress={item.onPress}
              activeOpacity={0.8}
            >
              <Text style={styles.serviceRowLabel}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.versionText}>ვერსია 1.0.0</Text>
        <View style={{ height: 12 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  cabinetContainer: {
    flex: 1,
    backgroundColor: C.bg,
  },
  settingsContainer: {
    flex: 1,
    backgroundColor: '#F8F9FC',
  },
  scroll: { flex: 1 },
  cabinetScrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 8,
  },
  cabinetIntro: {
    marginBottom: 16,
    paddingTop: 4,
  },
  cabinetGreeting: {
    fontSize: 22,
    fontWeight: '600',
    color: C.text,
    marginBottom: 4,
  },
  cabinetSub: {
    fontSize: 14,
    fontWeight: '400',
    color: C.muted,
    lineHeight: 20,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  statChip: {
    flex: 1,
    backgroundColor: C.lavender,
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  statChipValue: {
    fontSize: 18,
    fontWeight: '600',
    color: C.purple,
    marginBottom: 2,
  },
  statChipLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: C.navy,
  },
  ordersCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: C.bg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#2A3A7A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: { elevation: 2 },
    }),
  },
  ordersCardIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: C.lavender,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ordersCardBody: {
    flex: 1,
  },
  ordersCardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: C.text,
    marginBottom: 2,
  },
  ordersCardSub: {
    fontSize: 13,
    fontWeight: '400',
    color: C.muted,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: C.navy,
    marginBottom: 10,
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 20,
  },
  quickCard: {
    width: '47.5%',
    backgroundColor: C.bg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
    ...Platform.select({
      ios: {
        shadowColor: '#2A3A7A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
      },
      android: { elevation: 1 },
    }),
  },
  quickCardIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: C.lavender,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  quickCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: C.text,
    marginBottom: 2,
  },
  quickCardMeta: {
    fontSize: 12,
    fontWeight: '500',
    color: C.purple,
  },
  serviceCard: {
    backgroundColor: C.bg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 16,
    overflow: 'hidden',
  },
  serviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  serviceItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  serviceItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  serviceItemLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: C.text,
  },
  serviceItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  serviceItemValue: {
    fontSize: 13,
    color: C.muted,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: C.lavender,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  profileCardIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: C.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileCardBody: {
    flex: 1,
  },
  profileCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: C.navy,
    marginBottom: 2,
  },
  profileCardSub: {
    fontSize: 12,
    fontWeight: '400',
    color: C.muted,
    lineHeight: 17,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerSide: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '700',
    color: '#1F2021',
  },
  serviceList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 16,
    overflow: 'hidden',
  },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  serviceRowLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2021',
  },
  versionText: {
    fontSize: 12,
    color: C.muted,
    textAlign: 'center',
    marginTop: 4,
  },
});
