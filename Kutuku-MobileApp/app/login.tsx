import { BottomNavigation, type BottomNavTab } from '@/src/components/common/BottomNavigation';
import { useTabNavigation } from '@/src/hooks/useTabNavigation';
import { LoginScreen } from '@/src/screens';
import { UserService } from '@/src/services/user.service';
import { theme } from '@/src/theme';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const TAB_BAR_EXTRA_PADDING = 72;

function resolveActiveTab(tab?: string): BottomNavTab {
  if (tab === 'cabinet') return 'cabinet';
  if (tab === 'profile') return 'profile';
  return 'home';
}

export default function LoginPage() {
  const router = useRouter();
  const { tab } = useLocalSearchParams<{ tab?: string }>();
  const tabNav = useTabNavigation();
  const [checkingSession, setCheckingSession] = useState(true);
  const [activeUser, setActiveUser] = useState<{ email: string; name: string } | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const user = await UserService.validateSession();
      if (!active) return;
      if (user) {
        const name = `${user.firstName} ${user.lastName}`.trim() || user.email;
        setActiveUser({ email: user.email, name });
      } else {
        setActiveUser(null);
      }
      setCheckingSession(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  if (checkingSession) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {activeUser ? (
        <View style={styles.sessionBanner}>
          <Text style={styles.sessionText}>
            უკვე შესული ხართ: {activeUser.name}
            {activeUser.email ? ` (${activeUser.email})` : ''}
          </Text>
          <View style={styles.sessionActions}>
            <TouchableOpacity
              onPress={() => router.replace('/home' as any)}
              style={styles.sessionBtn}
            >
              <Text style={styles.sessionBtnPrimary}>მთავარზე</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={async () => {
                await UserService.logout();
                setActiveUser(null);
              }}
              style={styles.sessionBtn}
            >
              <Text style={styles.sessionBtnSecondary}>სხვა ანგარიშით შესვლა</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}
      <LoginScreen
        bottomInset={TAB_BAR_EXTRA_PADDING}
        onLogin={() => router.replace('/home' as any)}
        onRegisterPress={() => router.push('/register' as any)}
        onForgotPassword={() => router.push('/forgot-password' as any)}
        onGuestPress={() => router.replace('/home' as any)}
      />
      <BottomNavigation
        activeTab={resolveActiveTab(tab)}
        cartCount={tabNav.cartCount}
        onHomePress={tabNav.onHomePress}
        onCategoriesPress={tabNav.onCategoriesPress}
        onCabinetPress={tabNav.onCabinetPress}
        onCartPress={tabNav.onCartPress}
        onProfilePress={tabNav.onProfilePress}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.white,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
  },
  sessionBanner: {
    backgroundColor: theme.colors.white,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.gray[600],
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 6,
  },
  sessionText: {
    fontSize: 13,
    fontWeight: '500',
    color: theme.colors.gray[1000],
  },
  sessionActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  sessionBtn: {
    paddingVertical: 4,
  },
  sessionBtnPrimary: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.primaryDark,
  },
  sessionBtnSecondary: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.gray[1000],
  },
});
