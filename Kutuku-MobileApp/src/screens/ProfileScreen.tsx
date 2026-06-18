import { BottomNavigation } from '@/src/components/common/BottomNavigation';
import { useTabNavigation } from '@/src/hooks/useTabNavigation';
import { UserService } from '@/src/services/user.service';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
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
  error: '#EF4444',
};

interface MenuItem {
  id: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  value?: string;
}

interface ProfileScreenProps {
  onLogout: () => void;
  onPersonalInfoPress: () => void;
  onAddressesPress: () => void;
  onPaymentMethodsPress: () => void;
  onChangePasswordPress: () => void;
  onNotificationSettingsPress: () => void;
  onLanguagePress: () => void;
  onHelpSupportPress: () => void;
  onAboutPress: () => void;
}

export function ProfileScreen({
  onLogout,
  onPersonalInfoPress,
  onAddressesPress,
  onPaymentMethodsPress,
  onChangePasswordPress,
  onNotificationSettingsPress,
  onLanguagePress,
  onHelpSupportPress,
  onAboutPress,
}: ProfileScreenProps) {
  const insets = useSafeAreaInsets();
  const tabNav = useTabNavigation();
  const [user, setUser] = useState<{
    firstName: string;
    lastName?: string;
    email: string;
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

  const displayName = user
    ? `${user.firstName}${user.lastName ? ' ' + user.lastName : ''}`.trim() || 'მომხმარებელი'
    : 'მომხმარებელი';

  const accountItems: MenuItem[] = [
    { id: 'personal', title: 'პირადი ინფორმაცია', icon: 'person-outline', onPress: onPersonalInfoPress },
    { id: 'addresses', title: 'მისამართები', icon: 'location-outline', onPress: onAddressesPress },
    { id: 'payment', title: 'გადახდის მეთოდები', icon: 'card-outline', onPress: onPaymentMethodsPress },
    { id: 'password', title: 'პაროლის შეცვლა', icon: 'lock-closed-outline', onPress: onChangePasswordPress },
  ];

  const settingsItems: MenuItem[] = [
    { id: 'notifications', title: 'შეტყობინებები', icon: 'notifications-outline', onPress: onNotificationSettingsPress },
    { id: 'language', title: 'ენა', icon: 'language-outline', onPress: onLanguagePress, value: 'ქართული' },
    { id: 'help', title: 'დახმარება', icon: 'help-circle-outline', onPress: onHelpSupportPress },
    { id: 'about', title: 'აპლიკაციის შესახებ', icon: 'information-circle-outline', onPress: onAboutPress },
  ];

  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const renderMenu = (items: MenuItem[]) => (
    <View style={styles.menuCard}>
      {items.map((item, index) => (
        <TouchableOpacity
          key={item.id}
          style={[styles.menuRow, index < items.length - 1 && styles.menuRowBorder]}
          onPress={item.onPress}
          activeOpacity={0.8}
        >
          <View style={styles.menuRowLeft}>
            <View style={styles.menuIcon}>
              <Ionicons name={item.icon} size={18} color={C.navy} />
            </View>
            <Text style={styles.menuLabel}>{item.title}</Text>
          </View>
          <View style={styles.menuRowRight}>
            {item.value ? <Text style={styles.menuValue}>{item.value}</Text> : null}
            <Ionicons name="chevron-forward" size={16} color={C.muted} />
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 88 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.intro}>
          <Text style={styles.pageTitle}>პროფილი</Text>
          <Text style={styles.pageSub}>ანგარიში და პარამეტრები</Text>
        </View>

        <TouchableOpacity
          style={styles.profileCard}
          onPress={onPersonalInfoPress}
          activeOpacity={0.88}
        >
          {loading ? (
            <ActivityIndicator size="small" color={C.purple} />
          ) : (
            <>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initials || '?'}</Text>
              </View>
              <View style={styles.profileBody}>
                <Text style={styles.profileName} numberOfLines={1}>
                  {displayName}
                </Text>
                {user?.email ? (
                  <Text style={styles.profileEmail} numberOfLines={1}>
                    {user.email}
                  </Text>
                ) : null}
              </View>
              <View style={styles.editPill}>
                <Text style={styles.editPillText}>რედაქტირება</Text>
              </View>
            </>
          )}
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>ანგარიში</Text>
        {renderMenu(accountItems)}

        <Text style={styles.sectionTitle}>პარამეტრები</Text>
        {renderMenu(settingsItems)}

        <TouchableOpacity style={styles.logoutBtn} onPress={onLogout} activeOpacity={0.85}>
          <Ionicons name="log-out-outline" size={18} color={C.error} />
          <Text style={styles.logoutText}>გასვლა</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>ვერსია 1.0.0</Text>
      </ScrollView>

      <BottomNavigation
        activeTab="profile"
        onHomePress={tabNav.onHomePress}
        onCategoriesPress={tabNav.onCategoriesPress}
        onCabinetPress={tabNav.onCabinetPress}
        onCartPress={tabNav.onCartPress}
        onProfilePress={undefined}
        cartCount={tabNav.cartCount}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  intro: {
    marginBottom: 16,
    paddingTop: 4,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: C.text,
    marginBottom: 4,
  },
  pageSub: {
    fontSize: 14,
    fontWeight: '400',
    color: C.muted,
    lineHeight: 20,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: C.lavender,
    borderRadius: 16,
    padding: 14,
    marginBottom: 20,
    minHeight: 84,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: C.navy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '600',
    color: C.bg,
  },
  profileBody: {
    flex: 1,
    minWidth: 0,
  },
  profileName: {
    fontSize: 15,
    fontWeight: '600',
    color: C.navy,
    marginBottom: 2,
  },
  profileEmail: {
    fontSize: 13,
    fontWeight: '400',
    color: C.muted,
  },
  editPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: C.bg,
  },
  editPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: C.purple,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: C.navy,
    marginBottom: 10,
  },
  menuCard: {
    backgroundColor: C.bg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 20,
    overflow: 'hidden',
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
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  menuRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  menuRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: C.lavender,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: C.text,
  },
  menuRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  menuValue: {
    fontSize: 13,
    color: C.muted,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
    marginBottom: 12,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '600',
    color: C.error,
  },
  versionText: {
    fontSize: 12,
    color: C.muted,
    textAlign: 'center',
    marginBottom: 8,
  },
});
