import { UserService } from '@/src/services/user.service';
import { theme } from '@/src/theme';
import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

/**
 * სტარტი: ყოველთვის home (სტუმარი). ვალიდური JWT — ჩუმად აღდგება სესია.
 * ავტორიზაცია მხოლოდ დაცულ ქმედებებზე (პროფილი, შეკვეთა და ა.შ.).
 */
export function AuthBootstrap() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      await UserService.validateSession();
      if (active) setReady(true);
    })();
    return () => {
      active = false;
    };
  }, []);

  if (!ready) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return <Redirect href="/home" />;
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
  },
});
