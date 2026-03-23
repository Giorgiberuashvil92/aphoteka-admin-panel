import { DoctorPrescribeScreen } from '@/src/screens';
import { useRouter } from 'expo-router';

export default function DoctorPrescribePage() {
  const router = useRouter();
  return <DoctorPrescribeScreen onBack={() => router.back()} />;
}
