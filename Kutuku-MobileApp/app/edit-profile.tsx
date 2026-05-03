import { RequireAuth } from '@/src/components/auth/RequireAuth';
import { EditProfileScreen } from '@/src/screens';
import { useRouter } from 'expo-router';

export default function EditProfile() {
  const router = useRouter();

  return (
    <RequireAuth>
    <EditProfileScreen
      onBack={() => router.back()}
      onSave={() => router.back()}
    />
    </RequireAuth>
  );
}
