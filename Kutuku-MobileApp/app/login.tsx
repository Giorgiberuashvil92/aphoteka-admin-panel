import { LoginScreen } from '@/src/screens';
import { UserService } from '@/src/services/user.service';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { theme } from '@/src/theme';

export default function LoginPage() {
  const router = useRouter();
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
    <>
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
        onLogin={() => router.replace('/home' as any)}
        onRegisterPress={() => router.push('/register' as any)}
        onForgotPassword={() => router.push('/forgot-password' as any)}
        onGuestPress={() => router.replace('/home' as any)}
      />
    </>
  );
}

const styles = StyleSheet.create({
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
