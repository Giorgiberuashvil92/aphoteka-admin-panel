import { theme } from '@/src/theme';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type AddressScreenProps = {
  onBack: () => void;
  onConfirm: (location: string) => void;
};

type Location = {
  id: string;
  name: string;
  city: string;
  country: string;
};

export function AddressScreen({ onBack, onConfirm }: AddressScreenProps) {
  const [selectedLocation, setSelectedLocation] = useState('los-angeles');
  const [searchLocation, setSearchLocation] = useState('San Diego, CA');

  const locations: Location[] = [
    { id: 'los-angeles', name: 'Los Angeles', city: 'Los Angeles', country: 'United States' },
    { id: 'san-francisco', name: 'San Francisco', city: 'San Francisco', country: 'United States' },
    { id: 'new-york', name: 'New York', city: 'New York', country: 'United States' },
  ];

  const handleConfirm = () => {
    const selected = locations.find((loc) => loc.id === selectedLocation);
    if (selected) {
      onConfirm(selected.name);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.white} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.headerButton}>
          <Ionicons name="chevron-back" size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Address</Text>
        <View style={styles.headerButton} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Title */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>მისამართი არ არის დამატებული</Text>
          <Text style={styles.subtitle}>
            Let&apos;s find your unforgettable event. Choose a location below to get started
          </Text>
        </View>

        {/* Search Location */}
        <View style={styles.searchSection}>
          <View style={styles.searchBox}>
            <Ionicons name="location" size={20} color={theme.colors.primary} />
            <Text style={styles.searchText}>{searchLocation}</Text>
            <TouchableOpacity>
              <Ionicons name="close-circle" size={20} color={theme.colors.gray[400]} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Select Location */}
        <View style={styles.locationSection}>
          <Text style={styles.sectionTitle}>Select location</Text>
          
          {locations.map((location) => (
            <TouchableOpacity
              key={location.id}
              style={[
                styles.locationCard,
                selectedLocation === location.id && styles.locationCardSelected,
              ]}
              onPress={() => setSelectedLocation(location.id)}
            >
              <View style={styles.locationInfo}>
                <Text style={styles.locationName}>{location.name}</Text>
                <Text style={styles.locationCity}>{location.city}, {location.country}</Text>
              </View>
              <View style={[
                styles.radioButton,
                selectedLocation === location.id && styles.radioButtonSelected,
              ]}>
                {selectedLocation === location.id && (
                  <View style={styles.radioButtonInner} />
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Confirm Button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
          <Text style={styles.confirmButtonText}>Confirm</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.white,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray[100],
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  content: {
    flex: 1,
  },
  titleSection: {
    padding: 20,
    paddingTop: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 22,
    color: theme.colors.text.secondary,
  },
  searchSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.gray[200],
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
    gap: 12,
  },
  searchText: {
    flex: 1,
    fontSize: 15,
    color: theme.colors.text.primary,
    fontWeight: '500',
  },
  locationSection: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 16,
  },
  locationCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.gray[50],
    borderRadius: 12,
    padding: 20,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  locationCardSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '08',
  },
  locationInfo: {
    flex: 1,
  },
  locationName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 6,
  },
  locationCity: {
    fontSize: 13,
    color: theme.colors.text.secondary,
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: theme.colors.gray[300],
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonSelected: {
    borderColor: theme.colors.primary,
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: theme.colors.primary,
  },
  bottomBar: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: theme.colors.white,
    borderTopWidth: 1,
    borderTopColor: theme.colors.gray[100],
  },
  confirmButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.white,
  },
});
