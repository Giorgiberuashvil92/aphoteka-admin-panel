import { PaymentScreen } from '@/src/screens';
import { useRouter } from 'expo-router';
import { Alert } from 'react-native';

export default function Payment() {
  const router = useRouter();

  return (
    <PaymentScreen
      onBack={() => router.back()}
      onLoginRequired={() => router.push('/login' as any)}
      onOrderPlaced={(orderId, meta) => {
        const goSuccess = () =>
          router.replace(
            `/order-success?orderId=${encodeURIComponent(orderId)}` as any,
          );
        const goTrack = () =>
          router.replace(
            `/order-tracking?id=${encodeURIComponent(orderId)}` as any,
          );

        if (!meta) {
          goSuccess();
          return;
        }
        switch (meta.bogOutcome) {
          case 'aborted':
            Alert.alert(
              'გადახდა არ დასრულდა',
              'შეკვეთა შენახულია. გადახდა მოგვიანებით შეგიძლიათ „ჩემი შეკვეთებიდან“.',
              [{ text: 'კარგი', onPress: goTrack }],
            );
            return;
          case 'failed':
            Alert.alert(
              'გადახდა უარყოფილია',
              'შეკვეთა მოლოდინშია. შეგიძლიათ ხელახლა სცადოთ გადახდა შეკვეთიდან.',
              [{ text: 'კარგი', onPress: goTrack }],
            );
            return;
          case 'init_failed':
            Alert.alert(
              'ონლაინ გადახდა ვერ იწყება',
              'შეკვეთა შექმნილია — გადახდა შეკვეთის დეტალებიდან სცადეთ ხელახლა.',
              [{ text: 'კარგი', onPress: goTrack }],
            );
            return;
          case 'paid_pending':
            Alert.alert(
              'დადასტურება მოლოდინშია',
              'ბანკის უკუკავშირი ჯერ არ აისახა. რამდენიმე წამში გადაამოწმეთ შეკვეთის სტატუსი.',
              [{ text: 'კარგი', onPress: goTrack }],
            );
            return;
          default:
            goTrack();
        }
      }}
      onEditAddress={() => {
        router.push('/address' as any);
      }}
      onAddPaymentMethod={() => {
        router.push('/add-card' as any);
      }}
    />
  );
}
