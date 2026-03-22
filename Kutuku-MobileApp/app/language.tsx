import { LanguageScreen } from '@/src/screens';
import { useRouter } from 'expo-router';
import { Alert } from 'react-native';

export default function Language() {
  const router = useRouter();

  return (
    <LanguageScreen
      onBack={() => {
        console.log('Back pressed');
        router.back();
      }}
      onLanguageSelect={(languageCode) => {
        console.log('Language selected:', languageCode);
        Alert.alert('Language Changed', `Language changed to ${languageCode}`, [
          { text: 'OK', onPress: () => router.back() }
        ]);
      }}
      onMoreOptions={() => {
        console.log('More options pressed');
      }}
    />
  );
}
