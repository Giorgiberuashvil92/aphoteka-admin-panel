import { EditProfileScreen } from '@/src/screens';
import { useRouter } from 'expo-router';

export default function EditProfile() {
  const router = useRouter();

  return (
    <EditProfileScreen
      onBack={() => router.back()}
      onSave={() => router.back()}
    />
  );
}
