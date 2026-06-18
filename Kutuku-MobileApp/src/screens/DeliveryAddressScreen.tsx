import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { DeliveryAddress } from '../services/delivery.service';
import { savedAddressesService, type SavedAddress } from '../services/savedAddresses.service';
import { AddressMapPicker, GEORGIA_DEFAULT_COORDS } from '../components/common/AddressMapPicker';
import { reverseGeocodeCoordinates } from '../utils/reverseGeocode';

interface DeliveryAddressScreenProps {
  onBack: () => void;
  onContinue: (address: DeliveryAddress) => void;
  onManageAddresses?: () => void;
}

export const DeliveryAddressScreen: React.FC<DeliveryAddressScreenProps> = ({
  onBack,
  onContinue,
  onManageAddresses,
}) => {
  const [streetName, setStreetName] = useState('');
  const [cityName, setCityName] = useState('თბილისი');
  const [latitude, setLatitude] = useState(GEORGIA_DEFAULT_COORDS.latitude);
  const [longitude, setLongitude] = useState(GEORGIA_DEFAULT_COORDS.longitude);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const mapCoordsRef = useRef({ ...GEORGIA_DEFAULT_COORDS });
  const geocodeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipGeocodeRef = useRef(false);

  useEffect(() => {
    loadSavedAddresses();
    return () => {
      if (geocodeTimerRef.current) clearTimeout(geocodeTimerRef.current);
    };
  }, []);

  const loadSavedAddresses = async () => {
    try {
      const addresses = await savedAddressesService.getAll();
      setSavedAddresses(addresses);
    } catch (err) {
      console.error('Error loading saved addresses:', err);
    }
  };

  const fillAddressFromCoordinates = useCallback(
    async (coords: { latitude: number; longitude: number }) => {
      setIsGeocoding(true);
      try {
        const result = await reverseGeocodeCoordinates(
          coords.latitude,
          coords.longitude,
        );
        if (result?.streetName) setStreetName(result.streetName);
        if (result?.cityName) setCityName(result.cityName);
      } finally {
        setIsGeocoding(false);
      }
    },
    [],
  );

  useEffect(() => {
    void fillAddressFromCoordinates(GEORGIA_DEFAULT_COORDS);
  }, [fillAddressFromCoordinates]);

  const handleCoordinatesChange = useCallback(
    (coords: { latitude: number; longitude: number }) => {
      mapCoordsRef.current = coords;
      setLatitude(coords.latitude);
      setLongitude(coords.longitude);

      if (skipGeocodeRef.current) {
        skipGeocodeRef.current = false;
        return;
      }

      if (geocodeTimerRef.current) clearTimeout(geocodeTimerRef.current);
      geocodeTimerRef.current = setTimeout(() => {
        geocodeTimerRef.current = null;
        void fillAddressFromCoordinates(coords);
      }, 500);
    },
    [fillAddressFromCoordinates],
  );

  const handleSelectSavedAddress = (address: SavedAddress) => {
    skipGeocodeRef.current = true;
    if (geocodeTimerRef.current) {
      clearTimeout(geocodeTimerRef.current);
      geocodeTimerRef.current = null;
    }
    setStreetName(address.streetName);
    setCityName(address.cityName);
    if (
      typeof address.latitude === 'number' &&
      typeof address.longitude === 'number'
    ) {
      handleCoordinatesChange({
        latitude: address.latitude,
        longitude: address.longitude,
      });
    }
  };

  const handleContinue = async () => {
    if (!streetName.trim()) {
      Alert.alert('შეცდომა', 'გთხოვთ შეიყვანოთ ქუჩის მისამართი');
      return;
    }

    if (!cityName.trim()) {
      Alert.alert('შეცდომა', 'გთხოვთ შეიყვანოთ ქალაქი');
      return;
    }

    setIsLoading(true);

    try {
      const address: DeliveryAddress = {
        streetName: streetName.trim(),
        cityName: cityName.trim(),
        latitude: mapCoordsRef.current.latitude,
        longitude: mapCoordsRef.current.longitude,
      };

      onContinue(address);
    } catch (err) {
      Alert.alert('შეცდომა', 'მისამართის გადამოწმება ვერ მოხერხდა');
      console.error('Error validating address:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>მიტანის მისამართი</Text>
        <View style={{ width: 24 }} />
      </View>

      <AddressMapPicker
        latitude={latitude}
        longitude={longitude}
        onCoordinatesChange={handleCoordinatesChange}
        height={280}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.infoCard}>
          <Ionicons name="location" size={24} color="#5B5FC7" />
          <Text style={styles.infoText}>
            გადაიტანეთ რუკა ან დააჭირეთ „ჩემი ლოკაცია“ — ქუჩა და ქალაქი ავტომატურად
            შეივსება. საჭიროების შემთხვევაში ხელითაც შეგიძლიათ შეცვლა.
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>ქალაქი</Text>
              {isGeocoding ? (
                <ActivityIndicator size="small" color="#5B5FC7" />
              ) : null}
            </View>
            <TextInput
              style={styles.input}
              value={cityName}
              onChangeText={setCityName}
              placeholder="მაგ: თბილისი"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>
                ქუჩა და შენობის ნომერი <Text style={styles.required}>*</Text>
              </Text>
              {isGeocoding ? (
                <Text style={styles.geocodingHint}>იტვირთება...</Text>
              ) : null}
            </View>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={streetName}
              onChangeText={setStreetName}
              placeholder="მაგ: ვაჟა-ფშაველას 45"
              placeholderTextColor="#999"
              multiline
              numberOfLines={2}
              textAlignVertical="top"
            />
          </View>

          {(savedAddresses.length > 0 || onManageAddresses) && (
          <View style={styles.quickAddresses}>
            <View style={styles.quickHeader}>
              <Text style={styles.quickTitle}>შენახული მისამართები:</Text>
              {onManageAddresses && (
                <TouchableOpacity onPress={onManageAddresses} style={styles.manageButton}>
                  <Ionicons name="settings-outline" size={18} color="#5B5FC7" />
                  <Text style={styles.manageButtonText}>მართვა</Text>
                </TouchableOpacity>
              )}
            </View>
            {savedAddresses.length === 0 ? (
              <Text style={styles.emptySavedText}>შენახული მისამართები არ არის</Text>
            ) : (
            savedAddresses.map((address) => (
              <TouchableOpacity
                key={address.id}
                style={styles.quickButton}
                onPress={() => handleSelectSavedAddress(address)}
              >
                <Ionicons
                  name={address.icon as keyof typeof Ionicons.glyphMap}
                  size={20}
                  color="#5B5FC7"
                />
                <View style={styles.quickButtonContent}>
                  <Text style={styles.quickButtonLabel}>{address.label}</Text>
                  <Text style={styles.quickButtonAddress} numberOfLines={1}>
                    {address.streetName}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#999" />
              </TouchableOpacity>
            ))
            )}
          </View>
          )}
        </View>

        <View style={styles.deliveryInfo}>
          <View style={styles.deliveryInfoItem}>
            <Ionicons name="time-outline" size={20} color="#666" />
            <Text style={styles.deliveryInfoText}>
              მიტანის დრო: 45 წთ - 4 დღე
            </Text>
          </View>
          <View style={styles.deliveryInfoItem}>
            <Ionicons name="cash-outline" size={20} color="#666" />
            <Text style={styles.deliveryInfoText}>
              მიტანის ღირებულება: 5.5₾ - 12₾
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.continueButton,
            (!streetName.trim() || isLoading) && styles.continueButtonDisabled,
          ]}
          onPress={handleContinue}
          disabled={!streetName.trim() || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <Text style={styles.continueButtonText}>გაგრძელება</Text>
              <Ionicons name="arrow-forward" size={20} color="#FFF" />
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#333',
  },
  content: {
    flex: 1,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0FF',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  form: {
    backgroundColor: '#FFF',
    padding: 16,
    marginHorizontal: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  geocodingHint: {
    fontSize: 12,
    color: '#5B5FC7',
  },
  required: {
    color: '#FF3B30',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: '#333',
    backgroundColor: '#FAFAFA',
  },
  textArea: {
    minHeight: 60,
    paddingTop: 12,
  },
  quickAddresses: {
    marginTop: 12,
  },
  quickHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  quickTitle: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  emptySavedText: {
    fontSize: 13,
    color: '#999',
    paddingVertical: 8,
  },
  manageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#F5F3FF',
    borderRadius: 8,
  },
  manageButtonText: {
    fontSize: 13,
    color: '#5B5FC7',
    fontWeight: '600',
  },
  quickButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#F5F3FF',
    borderRadius: 12,
    marginBottom: 10,
    gap: 14,
    borderWidth: 1.5,
    borderColor: '#E0D7FF',
  },
  quickButtonContent: {
    flex: 1,
  },
  quickButtonLabel: {
    fontSize: 15,
    color: '#5B5FC7',
    fontWeight: '700',
    marginBottom: 4,
  },
  quickButtonAddress: {
    fontSize: 13,
    color: '#7C7C8A',
    fontWeight: '500',
  },
  deliveryInfo: {
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
    gap: 12,
    marginBottom: 16,
  },
  deliveryInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  deliveryInfoText: {
    fontSize: 14,
    color: '#666',
  },
  footer: {
    padding: 16,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#5B5FC7',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  continueButtonDisabled: {
    backgroundColor: '#CCC',
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
});
