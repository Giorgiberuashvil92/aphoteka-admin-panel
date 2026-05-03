import type { ReactNode } from 'react';
import { UserService } from '@/src/services/user.service';
import { theme } from '@/src/theme';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

/**
 * ავტორიზაციის გარეშე არ უნდა გაიხსნას პროფილი/პაროლი/მისამართი და ა.შ.
 * ტოკენის არქონისას — მხოლოდ აქ ხდება გადამისამართება `/login`-ზე (სტარტზე არა).
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      const token = await UserService.getAccessToken();
      if (!active) return;
      if (!token?.trim()) {
        router.replace('/login' as any);
        return;
      }
      setAllowed(true);
    })();
    return () => {
      active = false;
    };
  }, [router]);

  if (!allowed) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
  },
});
