import { theme } from '@/src/theme';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, { type Region } from 'react-native-maps';

/** დროებითი default — თბილისი (საქართველო); რუკის გადატანაზე იცვლება */
export const GEORGIA_DEFAULT_COORDS = {
  latitude: 41.7151,
  longitude: 44.8271,
};

const DEFAULT_MAP_REGION: Region = {
  ...GEORGIA_DEFAULT_COORDS,
  latitudeDelta: 0.012,
  longitudeDelta: 0.012,
};

const REGION_SAVE_DEBOUNCE_MS = 450;

type AddressMapPickerProps = {
  latitude: number;
  longitude: number;
  onCoordinatesChange: (coords: { latitude: number; longitude: number }) => void;
  height?: number;
};

export function AddressMapPicker({
  latitude,
  longitude,
  onCoordinatesChange,
  height = 260,
}: AddressMapPickerProps) {
  const [locatingMe, setLocatingMe] = useState(false);
  const [showUserLocationDot, setShowUserLocationDot] = useState(false);
  const mapRef = useRef<MapView>(null);
  const regionSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastExternalCoords = useRef({ latitude, longitude });
  const allowPinUpdate = useRef(false);

  const applyRegionCenter = useCallback(
    (r: Region) => {
      onCoordinatesChange({ latitude: r.latitude, longitude: r.longitude });
    },
    [onCoordinatesChange],
  );

  const handleRegionChangeComplete = useCallback(
    (r: Region) => {
      if (!allowPinUpdate.current) return;
      if (regionSaveTimer.current) clearTimeout(regionSaveTimer.current);
      regionSaveTimer.current = setTimeout(() => {
        regionSaveTimer.current = null;
        applyRegionCenter(r);
      }, REGION_SAVE_DEBOUNCE_MS);
    },
    [applyRegionCenter],
  );

  const goToMyGpsLocation = useCallback(async () => {
    if (Platform.OS === 'web') {
      Alert.alert('ლოკაცია', 'GPS ხელმისაწვდომია iOS და Android აპში.');
      return;
    }
    setLocatingMe(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'ლოკაცია',
          'გთხოვთ, პარამეტრებში დაუშვით წვდომა ლოკაციაზე, ან აირჩიეთ წერტილი რუკის გადატანით.',
        );
        return;
      }
      setShowUserLocationDot(true);
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const region: Region = {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        latitudeDelta: 0.012,
        longitudeDelta: 0.012,
      };
      if (regionSaveTimer.current) {
        clearTimeout(regionSaveTimer.current);
        regionSaveTimer.current = null;
      }
      allowPinUpdate.current = true;
      applyRegionCenter(region);
      mapRef.current?.animateToRegion(region, 550);
    } catch {
      Alert.alert(
        'შეცდომა',
        'ლოკაციის მიღება ვერ მოხერხდა. გადაიტანეთ რუკა ხელით.',
      );
    } finally {
      setLocatingMe(false);
    }
  }, [applyRegionCenter]);

  useEffect(() => {
    return () => {
      if (regionSaveTimer.current) clearTimeout(regionSaveTimer.current);
    };
  }, []);

  useEffect(() => {
    allowPinUpdate.current = true;
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;

    const prev = lastExternalCoords.current;
    if (prev && prev.latitude === latitude && prev.longitude === longitude) return;

    lastExternalCoords.current = { latitude, longitude };
    mapRef.current.animateToRegion(
      {
        latitude,
        longitude,
        latitudeDelta: 0.012,
        longitudeDelta: 0.012,
      },
      450,
    );
  }, [latitude, longitude]);

  if (Platform.OS === 'web') {
    return (
      <View style={[styles.mapWeb, { height }]}>
        <Ionicons name="map-outline" size={28} color={theme.colors.gray[400]} />
        <Text style={styles.mapWebText}>
          ინტერაქტიული რუკა ხელმისაწვდომია iOS და Android აპში.
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.mapWrap, { height }]}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFillObject}
        initialRegion={DEFAULT_MAP_REGION}
        onRegionChangeComplete={handleRegionChangeComplete}
        showsUserLocation={showUserLocationDot}
        mapType="standard"
        rotateEnabled={false}
        pitchEnabled={false}
        showsCompass={false}
      />
      <View style={styles.crosshairWrap} pointerEvents="none">
        <Ionicons
          name="location-sharp"
          size={40}
          color="#5B5FC7"
          style={styles.crosshairIcon}
        />
      </View>
      <TouchableOpacity
        style={styles.myLocationPill}
        onPress={() => void goToMyGpsLocation()}
        disabled={locatingMe}
        activeOpacity={0.85}
      >
        {locatingMe ? (
          <ActivityIndicator size="small" color="#5B5FC7" />
        ) : (
          <Ionicons name="navigate" size={18} color="#5B5FC7" />
        )}
        <Text style={styles.myLocationText}>ჩემი ლოკაცია</Text>
      </TouchableOpacity>
      <View style={styles.coordsBadge} pointerEvents="none">
        <Text style={styles.coordsText} numberOfLines={1}>
          {latitude.toFixed(5)}, {longitude.toFixed(5)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mapWrap: {
    width: '100%',
    backgroundColor: '#E8E8E8',
    position: 'relative',
  },
  mapWeb: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 20,
    backgroundColor: '#F5F5F5',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  mapWebText: {
    flex: 1,
    fontSize: 13,
    color: '#666',
    lineHeight: 20,
  },
  crosshairWrap: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  crosshairIcon: {
    marginTop: -28,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  myLocationPill: {
    position: 'absolute',
    left: 12,
    bottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderWidth: 1.5,
    borderColor: '#5B5FC7',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 3,
  },
  myLocationText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#5B5FC7',
  },
  coordsBadge: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    maxWidth: '55%',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  coordsText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#333',
    fontVariant: ['tabular-nums'],
  },
});
