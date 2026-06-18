import { NotificationScreen } from '@/src/screens';
import { useRouter } from 'expo-router';

export default function Notification() {
  const router = useRouter();

  return (
    <NotificationScreen
      onBack={() => router.back()}
      onNotificationPress={(notification) => {
        if (notification.type === 'purchase' || notification.type === 'shipping') {
          router.push('/my-order' as any);
        } else if (notification.type === 'sale') {
          router.push('/search-results?q=' as any);
        }
      }}
      onSearch={() => router.push('/search' as any)}
    />
  );
}
