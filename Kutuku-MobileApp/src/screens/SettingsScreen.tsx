import { useCart, useFavorites } from '@/src/contexts';
import { OrdersService } from '@/src/services/orders.service';
import { UserService } from '@/src/services/user.service';
import { theme } from '@/src/theme';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type SettingsScreenProps = {
  onBack: () => void;
  onEditProfile: () => void;
  onMyOrders: () => void;
  onAddresses: () => void;
  onPaymentMethods: () => void;
  onNotifications: () => void;
  onLanguage: () => void;
  onHelpSupport: () => void;
  onAbout: () => void;
  onLogout: () => void;
  /** ექიმის რეჟიმი — პაციენტზე წამლების დანიშვნა */
  onDoctorPrescribe?: () => void;
};

export function SettingsScreen({
  onBack,
  onEditProfile,
  onMyOrders,
  onAddresses,
  onPaymentMethods,
  onNotifications,
  onLanguage,
  onHelpSupport,
  onAbout,
  onLogout,
  onDoctorPrescribe,
}: SettingsScreenProps) {
  const { itemCount, clearCart } = useCart();
  const { favoriteCount, clearFavorites } = useFavorites();
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [ordersCount, setOrdersCount] = useState(0);

  useEffect(() => {
    loadUserInfo();
  }, []);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        const result = await OrdersService.fetchMyOrders();
        if (!active) return;
        if (result.ok) {
          setOrdersCount(result.orders.length);
        } else {
          setOrdersCount(0);
        }
      })();
      return () => {
        active = false;
      };
    }, [])
  );

  const loadUserInfo = async () => {
    const user = await UserService.getCurrentUser();
    if (user) {
      setUserName(`${user.firstName} ${user.lastName}`);
      setUserEmail(user.email);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'გასვლა',
      'დარწმუნებული ხართ რომ გსურთ გასვლა?',
      [
        { text: 'გაუქმება', style: 'cancel' },
        {
          text: 'გასვლა',
          style: 'destructive',
          onPress: async () => {
            await UserService.logout();
            clearCart();
            onLogout();
          },
        },
      ]
    );
  };

  type MenuItem = {
    icon: string;
    label: string;
    onPress: () => void;
    badge?: string;
    value?: string;
  };

  type MenuSection = {
    title: string;
    items: MenuItem[];
  };

  const menuSections: MenuSection[] = useMemo(
    () => [
    {
      title: 'ანგარიში',
      items: [
        {
          icon: 'person-outline',
          label: 'პროფილის რედაქტირება',
          onPress: onEditProfile,
        },
        {
          icon: 'receipt-outline',
          label: 'ჩემი შეკვეთები',
          onPress: onMyOrders,
          ...(ordersCount > 0 ? { badge: String(ordersCount) } : {}),
        },
        {
          icon: 'location-outline',
          label: 'მისამართები',
          onPress: onAddresses,
        },
        {
          icon: 'card-outline',
          label: 'გადახდის მეთოდები',
          onPress: onPaymentMethods,
        },
        ...(onDoctorPrescribe
          ? [
              {
                icon: 'medkit-outline' as const,
                label: 'ექიმის რეჟიმი (დანიშნულებები)',
                onPress: onDoctorPrescribe,
              },
            ]
          : []),
      ],
    },
    {
      title: 'პარამეტრები',
      items: [
        {
          icon: 'notifications-outline',
          label: 'შეტყობინებები',
          onPress: onNotifications,
        },
        {
          icon: 'language-outline',
          label: 'ენა',
          onPress: onLanguage,
          value: 'ქართული',
        },
      ],
    },
    {
      title: 'დახმარება',
      items: [
        {
          icon: 'help-circle-outline',
          label: 'დახმარება და მხარდაჭერა',
          onPress: onHelpSupport,
        },
        {
          icon: 'information-circle-outline',
          label: 'აპლიკაციის შესახებ',
          onPress: onAbout,
        },
      ],
    },
  ],
    [onMyOrders, onDoctorPrescribe, onEditProfile, onAddresses, onPaymentMethods, onNotifications, onLanguage, onHelpSupport, onAbout, ordersCount]
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.white} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Ionicons name="chevron-back" size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>პარამეტრები</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <TouchableOpacity style={styles.profileCard} onPress={onEditProfile}>
          <View style={styles.profileAvatar}>
            <Text style={styles.profileAvatarText}>
              {userName.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{userName || 'მომხმარებელი'}</Text>
            <Text style={styles.profileEmail}>{userEmail || 'email@example.com'}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.text.tertiary} />
        </TouchableOpacity>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Ionicons name="cart" size={24} color={theme.colors.primary} />
            </View>
            <Text style={styles.statValue}>{itemCount}</Text>
            <Text style={styles.statLabel}>კალათაში</Text>
          </View>
          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Ionicons name="heart" size={24} color={theme.colors.error} />
            </View>
            <Text style={styles.statValue}>{favoriteCount}</Text>
            <Text style={styles.statLabel}>ფავორიტები</Text>
          </View>
          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Ionicons name="receipt" size={24} color={theme.colors.success} />
            </View>
            <Text style={styles.statValue}>{ordersCount}</Text>
            <Text style={styles.statLabel}>შეკვეთები</Text>
          </View>
        </View>

        {/* Menu Sections */}
        {menuSections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.menuList}>
              {section.items.map((item, itemIndex) => (
                <TouchableOpacity
                  key={itemIndex}
                  style={[
                    styles.menuItem,
                    itemIndex === section.items.length - 1 && styles.menuItemLast,
                  ]}
                  onPress={item.onPress}
                >
                  <View style={styles.menuItemLeft}>
                    <View style={styles.menuIconContainer}>
                      <Ionicons name={item.icon as any} size={22} color={theme.colors.primary} />
                    </View>
                    <Text style={styles.menuItemLabel}>{item.label}</Text>
                  </View>
                  <View style={styles.menuItemRight}>
                    {item.badge && (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>{item.badge}</Text>
                      </View>
                    )}
                    {item.value && (
                      <Text style={styles.menuItemValue}>{item.value}</Text>
                    )}
                    <Ionicons name="chevron-forward" size={20} color={theme.colors.text.tertiary} />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={22} color={theme.colors.error} />
          <Text style={styles.logoutButtonText}>გასვლა</Text>
        </TouchableOpacity>

        {/* App Version */}
        <Text style={styles.versionText}>ვერსია 1.0.0</Text>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.gray[50],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray[100],
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 16,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  profileAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  profileAvatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.white,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: theme.colors.white,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.gray[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.text.secondary,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.secondary,
    marginBottom: 12,
    paddingHorizontal: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  menuList: {
    backgroundColor: theme.colors.white,
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray[100],
  },
  menuItemLast: {
    borderBottomWidth: 0,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuItemLabel: {
    fontSize: 16,
    color: theme.colors.text.primary,
    fontWeight: '500',
  },
  menuItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.white,
  },
  menuItemValue: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: theme.colors.white,
    marginHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.error + '30',
    marginBottom: 16,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.error,
  },
  versionText: {
    fontSize: 12,
    color: theme.colors.text.tertiary,
    textAlign: 'center',
    marginBottom: 8,
  },
});
