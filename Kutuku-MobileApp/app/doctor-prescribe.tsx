import { RequireAuth } from '@/src/components/auth/RequireAuth';
import { DoctorPrescribeScreen } from '@/src/screens';
import { PRESCRIBE_ROLES } from '@/src/services/user.service';
import { useRouter } from 'expo-router';

export default function DoctorPrescribePage() {
  const router = useRouter();
  return (
    <RequireAuth allowedRoles={PRESCRIBE_ROLES}>
      <DoctorPrescribeScreen onBack={() => router.back()} />
    </RequireAuth>
  );
}
