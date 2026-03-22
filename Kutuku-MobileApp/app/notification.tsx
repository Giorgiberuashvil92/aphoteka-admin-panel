import { NotificationScreen } from '@/src/screens';
import { useRouter } from 'expo-router';

export default function Notification() {
  const router = useRouter();

  return (
    <NotificationScreen
      onBack={() => {
        console.log('Back pressed');
        router.back();
      }}
      onNotificationPress={(notification) => {
        console.log('Notification pressed:', notification.title);
        // Handle different notification types
        if (notification.type === 'purchase' || notification.type === 'shipping') {
          // Navigate to order tracking or order details
          router.push('/my-order' as any);
        } else if (notification.type === 'message') {
          // Navigate to messages/chat
          console.log('Navigate to messages');
        } else if (notification.type === 'sale') {
          // Navigate to products/deals
          router.push('/search-results?q=' as any);
        }
      }}
      onSearch={() => {
        console.log('Search pressed');
        router.push('/search' as any);
      }}
      onHomePress={() => {
        console.log('Home pressed');
        router.push('/home' as any);
      }}
      onWishlistPress={() => {
        console.log('Wishlist pressed');
        router.push('/favorite' as any);
      }}
      onCartPress={() => {
        console.log('Cart pressed');
        router.push('/cart' as any);
      }}
      onProfilePress={() => {
        console.log('Profile pressed');
        router.push('/settings' as any);
      }}
    />
  );
}
