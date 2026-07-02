import type { ReactNode } from 'react';
import type { BottomNavTab } from '@/src/components/common/BottomNavigation';
import { UserService } from '@/src/services/user.service';
import { theme } from '@/src/theme';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, View } from 'react-native';

type RequireAuthProps = {
  children: ReactNode;
  /** რომელი ტაბიდან მოხვდა — login-ზე tab bar-ის აქტიური მდგომარეობა */
  loginTab?: Extract<BottomNavTab, 'profile' | 'cabinet'>;
  /** თუ მითითებულია — მხოლოდ ამ როლ(ებ)ის მქონე მომხმარებელს */
  allowedRoles?: string[];
};

/**
 * ავტორიზაციის გარეშე არ უნდა გაიხსნას პროფილი/პაროლი/მისამართი და ა.შ.
 * ტოკენის არქონისას — მხოლოდ აქ ხდება გადამისამართება `/login`-ზე (სტარტზე არა).
 */
export function RequireAuth({ children, loginTab, allowedRoles }: RequireAuthProps) {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);
  const rolesKey = allowedRoles?.join(',') ?? '';

  useEffect(() => {
    let active = true;
    (async () => {
      const user = await UserService.validateSession();
      if (!active) return;
      if (!user) {
        const tabQuery = loginTab ? `?tab=${loginTab}` : '';
        router.replace(`/login${tabQuery}` as any);
        return;
      }
      if (allowedRoles?.length && (!user.role || !allowedRoles.includes(user.role))) {
        Alert.alert('წვდომა შეზღუდულია', 'ამ გვერდზე წვდომა თქვენს როლს არ ეკუთვნის.');
        router.back();
        return;
      }
      setAllowed(true);
    })();
    return () => {
      active = false;
    };
  }, [router, loginTab, rolesKey, allowedRoles]);

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
