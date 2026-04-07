import { UserService } from '@/src/services/user.service';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';

/**
 * JWT AsyncStorage-დან (`@kutuku_access_token`) — ეკრანზე დაბრუნებისას იტვირთება თავიდან.
 * შესვლის შემდეგ მთავარ გვერდზე აქ ჩანს ტოკენი მეხსიერებაში (ან გამოიყენე `refresh()`).
 */
export function useAccessToken() {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const t = await UserService.getAccessToken();
      setAccessToken(t);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  return {
    accessToken,
    loading,
    refresh,
    isLoggedIn: Boolean(accessToken),
  };
}
