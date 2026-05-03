import { RequireAuth } from '@/src/components/auth/RequireAuth';
import { DoctorPrescribeScreen } from '@/src/screens';
import { useRouter } from 'expo-router';

export default function DoctorPrescribePage() {
  const router = useRouter();
  return (
    <RequireAuth>
      <DoctorPrescribeScreen onBack={() => router.back()} />
    </RequireAuth>
  );
}
