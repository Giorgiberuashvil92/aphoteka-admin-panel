import { AversiHeader } from '@/src/components/common/AversiHeader';
import { BottomNavigation } from '@/src/components/common/BottomNavigation';
import { UserService } from '@/src/services/user.service';
import { theme } from '@/src/theme';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Image, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface MenuItem {
  id: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
}

interface ProfileScreenProps {
  onLogout: () => void;
  onSearch: () => void;
  onHomePress: () => void;
  onWishlistPress: () => void;
  onCategoriesPress: () => void;
  onCartPress: () => void;
  onMyOrdersPress: () => void;
  onPersonalInfoPress: () => void;
  onAddressesPress: () => void;
  onPaymentMethodsPress: () => void;
  onNotificationSettingsPress: () => void;
  onHelpSupportPress: () => void;
}

export function ProfileScreen({
  onLogout,
  onSearch,
  onHomePress,
  onWishlistPress,
  onCategoriesPress,
  onCartPress,
  onMyOrdersPress,
  onPersonalInfoPress,
  onAddressesPress,
  onPaymentMethodsPress,
  onNotificationSettingsPress,
  onHelpSupportPress,
}: ProfileScreenProps) {
  const [user, setUser] = useState<{
    firstName: string;
    lastName?: string;
    email: string;
    imageUrl?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      const load = async () => {
        setLoading(true);
        try {
          const profile = await UserService.fetchProfile();
          if (!cancelled && profile) {
            setUser({
              firstName: profile.firstName,
              lastName: profile.lastName,
              email: profile.email,
              imageUrl: '',
            });
          } else if (!cancelled) {
            setUser(null);
          }
        } catch {
          if (!cancelled) setUser(null);
        } finally {
          if (!cancelled) setLoading(false);
        }
      };
      load();
      return () => {
        cancelled = true;
      };
    }, []),
  );

  const displayName = user ? `${user.firstName}${user.lastName ? ' ' + user.lastName : ''}`.trim() || 'მომხმარებელი' : 'სტუმარი';
  const displayEmail = user?.email || '';

  const profileMenuItems: MenuItem[] = [
    {
      id: 'personal-info',
      title: 'პირადი ინფორმაცია',
      icon: 'person-outline',
      onPress: onPersonalInfoPress,
    },
    {
      id: 'addresses',
      title: 'მისამართები',
      icon: 'location-outline',
      onPress: onAddressesPress,
    },
    {
      id: 'orders',
      title: 'ჩემი შეკვეთები',
      icon: 'receipt-outline',
      onPress: onMyOrdersPress,
    },
  ];

  const settingsMenuItems: MenuItem[] = [
    {
      id: 'settings',
      title: 'პარამეტრები',
      icon: 'settings-outline',
      onPress: onNotificationSettingsPress,
    },
    {
      id: 'help',
      title: 'დახმარება',
      icon: 'help-circle-outline',
      onPress: onHelpSupportPress,
    },
    {
      id: 'about',
      title: 'აპლიკაციის შესახებ',
      icon: 'information-circle-outline',
      onPress: () => {},
    },
  ];

  const getUserInitial = () => {
    return (displayName && displayName.charAt(0).toUpperCase()) || '?';
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.white} />

      {/* Header */}
      <AversiHeader
        onSearchPress={onSearch}
      />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* User Info */}
        <View style={styles.userInfoContainer}>
          {loading ? (
            <ActivityIndicator size="large" color={theme.colors.primary} style={styles.loader} />
          ) : (
            <>
              {user?.imageUrl ? (
                <Image source={{ uri: user.imageUrl }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarText}>{getUserInitial()}</Text>
                </View>
              )}
              <Text style={styles.userName}>{displayName}</Text>
              {displayEmail ? (
                <Text style={styles.userEmail}>{displayEmail}</Text>
              ) : null}
            </>
          )}
        </View>

        {/* Profile Menu */}
        <View style={styles.menuSection}>
          {profileMenuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.menuItem}
              onPress={item.onPress}
            >
              <View style={styles.menuItemLeft}>
                <View style={styles.iconContainer}>
                  <Ionicons name={item.icon} size={24} color={theme.colors.text.primary} />
                </View>
                <Text style={styles.menuItemText}>{item.title}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.colors.text.tertiary} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Settings Section */}
        <View style={styles.sectionDivider} />
        <Text style={styles.sectionTitle}>პროფილის დეტალები</Text>

        <View style={styles.menuSection}>
          {settingsMenuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.menuItem}
              onPress={item.onPress}
            >
              <View style={styles.menuItemLeft}>
                <View style={styles.iconContainer}>
                  <Ionicons name={item.icon} size={24} color={theme.colors.text.primary} />
                </View>
                <Text style={styles.menuItemText}>{item.title}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.colors.text.tertiary} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
          <Ionicons name="log-out-outline" size={20} color={theme.colors.error} />
          <Text style={styles.logoutButtonText}>გასვლა</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Bottom Navigation */}
      <BottomNavigation
        activeTab="profile"
        onHomePress={onHomePress}
        onWishlistPress={onWishlistPress}
        onCategoriesPress={onCategoriesPress}
        onCartPress={onCartPress}
        onProfilePress={undefined}
        wishlistCount={0}
        cartCount={0}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.white,
  },
  userInfoContainer: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  loader: {
    marginVertical: 24,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: theme.colors.gray[600],
    backgroundColor: theme.colors.gray[200],
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: theme.colors.gray[600],
    backgroundColor: theme.colors.gray[200],
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '700',
    color: theme.colors.text.secondary,
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginTop: 16,
    textTransform: 'uppercase',
  },
  userEmail: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginTop: 4,
  },
  menuSection: {
    paddingHorizontal: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray[200],
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 16,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text.primary,
    flex: 1,
  },
  sectionDivider: {
    height: 8,
    backgroundColor: theme.colors.gray[100],
    marginVertical: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.text.secondary,
    paddingHorizontal: 16,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 32,
    marginBottom: 24,
    paddingVertical: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: theme.colors.error,
    backgroundColor: theme.colors.purple[100],
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.error,
  },
});
