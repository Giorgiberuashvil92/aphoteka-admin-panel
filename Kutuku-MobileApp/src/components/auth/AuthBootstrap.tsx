import { UserService } from '@/src/services/user.service';
import { theme } from '@/src/theme';
import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

type BootstrapTarget = 'loading' | 'home' | 'login';

/**
 * აპის სტარტზე JWT-ის შემოწმება — ვადაგასული/ცრუ ტოკენზე login, ვალიდურზე home.
 */
export function AuthBootstrap() {
  const [target, setTarget] = useState<BootstrapTarget>('loading');

  useEffect(() => {
    let active = true;
    (async () => {
      const user = await UserService.validateSession();
      if (!active) return;
      setTarget(user ? 'home' : 'login');
    })();
    return () => {
      active = false;
    };
  }, []);

  if (target === 'loading') {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return <Redirect href={target === 'home' ? '/home' : '/login'} />;
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
  },
});
