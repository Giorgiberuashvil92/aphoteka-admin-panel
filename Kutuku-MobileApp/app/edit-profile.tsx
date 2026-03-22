import { EditProfileScreen } from '@/src/screens';
import { useRouter } from 'expo-router';

export default function EditProfile() {
  const router = useRouter();

  return (
    <EditProfileScreen
      onBack={() => {
        console.log('Back pressed');
        router.back();
      }}
      onSave={() => {
        console.log('Profile saved');
        router.back();
      }}
      onMoreOptions={() => {
        console.log('More options pressed');
      }}
    />
  );
}
