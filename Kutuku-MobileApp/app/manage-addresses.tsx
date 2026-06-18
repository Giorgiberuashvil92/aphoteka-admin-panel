import React from 'react';
import { useRouter } from 'expo-router';
import { ManageAddressesScreen } from '../src/screens';

export default function ManageAddresses() {
  const router = useRouter();

  const handleBack = () => {
    router.back();
  };

  return <ManageAddressesScreen onBack={handleBack} />;
}
