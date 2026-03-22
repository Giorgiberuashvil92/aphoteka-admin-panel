import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar, Image, Linking } from 'react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { theme } from '@/src/theme';

type OrderTrackingScreenProps = {
  orderId: string;
  onBack: () => void;
};

export function OrderTrackingScreen({ orderId, onBack }: OrderTrackingScreenProps) {
  const [region] = useState({
    latitude: 32.7157,
    longitude: -117.1611,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });

  // Delivery route coordinates
  const routeCoordinates = [
    { latitude: 32.7157, longitude: -117.1611 }, // Start (Shop)
    { latitude: 32.7200, longitude: -117.1550 },
    { latitude: 32.7250, longitude: -117.1500 },
    { latitude: 32.7300, longitude: -117.1450 }, // End (Customer)
  ];

  const courier = {
    name: 'Alexander Jr',
    role: 'Courier',
    phone: '+1234567890',
    image: 'https://randomuser.me/api/portraits/men/32.jpg',
  };

  const progress = [
    {
      id: '1',
      title: 'Upbox Bag',
      subtitle: 'Shop',
      time: '02:50 PM',
      icon: 'storefront',
      completed: true,
    },
    {
      id: '2',
      title: 'On the way',
      subtitle: 'Delivery',
      time: '03:20 PM',
      icon: 'bicycle',
      completed: true,
    },
    {
      id: '3',
      title: '5482 Adobe Falls Rd #155an Diego,...',
      subtitle: 'House',
      time: '03:45 PM',
      icon: 'location',
      completed: false,
    },
  ];

  const handleCall = () => {
    Linking.openURL(`tel:${courier.phone}`);
  };

  const handleMessage = () => {
    Linking.openURL(`sms:${courier.phone}`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      {/* Map */}
      <MapView
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={region}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={false}
        toolbarEnabled={false}
      >
        {/* Route Polyline */}
        <Polyline
          coordinates={routeCoordinates}
          strokeColor={theme.colors.primary}
          strokeWidth={4}
        />

        {/* Start Marker (Shop) */}
        <Marker coordinate={routeCoordinates[0]}>
          <View style={styles.markerStart}>
            <Ionicons name="storefront" size={20} color={theme.colors.white} />
          </View>
        </Marker>

        {/* Current Location Marker (Courier) */}
        <Marker coordinate={routeCoordinates[2]}>
          <View style={styles.markerCurrent}>
            <Ionicons name="bicycle" size={24} color={theme.colors.white} />
          </View>
        </Marker>

        {/* End Marker (Customer) */}
        <Marker coordinate={routeCoordinates[3]}>
          <View style={styles.markerEnd}>
            <Ionicons name="location" size={20} color={theme.colors.white} />
          </View>
        </Marker>
      </MapView>

      {/* Header Overlay */}
      <View style={styles.headerOverlay}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Tracking</Text>
        <View style={styles.backButton} />
      </View>

      {/* Bottom Sheet */}
      <View style={styles.bottomSheet}>
        {/* Courier Info */}
        <View style={styles.courierCard}>
          <Image source={{ uri: courier.image }} style={styles.courierImage} />
          <View style={styles.courierInfo}>
            <Text style={styles.courierName}>{courier.name}</Text>
            <Text style={styles.courierRole}>{courier.role}</Text>
          </View>
          <TouchableOpacity style={styles.actionButton} onPress={handleMessage}>
            <Ionicons name="chatbubble-outline" size={20} color={theme.colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={handleCall}>
            <Ionicons name="call-outline" size={20} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Progress Timeline */}
        <View style={styles.progressSection}>
          <Text style={styles.progressTitle}>Progress of your Order</Text>
          
          {progress.map((item, index) => (
            <View key={item.id} style={styles.progressItem}>
              <View style={styles.progressIconContainer}>
                <View style={[
                  styles.progressIcon,
                  item.completed && styles.progressIconCompleted
                ]}>
                  <Ionicons 
                    name={item.icon as any} 
                    size={20} 
                    color={item.completed ? theme.colors.white : theme.colors.gray[400]} 
                  />
                </View>
                {index < progress.length - 1 && (
                  <View style={[
                    styles.progressLine,
                    item.completed && styles.progressLineCompleted
                  ]} />
                )}
              </View>
              
              <View style={styles.progressContent}>
                <Text style={styles.progressItemTitle}>{item.title}</Text>
                <View style={styles.progressItemBottom}>
                  <Text style={styles.progressItemSubtitle}>{item.subtitle}</Text>
                  <Text style={styles.progressItemTime}>{item.time}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Mark as Done Button */}
        <TouchableOpacity style={styles.doneButton}>
          <Text style={styles.doneButtonText}>Mark as Done</Text>
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
  map: {
    flex: 1,
  },
  headerOverlay: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
    backgroundColor: theme.colors.white,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  markerStart: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: theme.colors.white,
  },
  markerCurrent: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: theme.colors.white,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  markerEnd: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.error,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: theme.colors.white,
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingBottom: 40,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  courierCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.gray[50],
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    gap: 12,
  },
  courierImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  courierInfo: {
    flex: 1,
  },
  courierName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  courierRole: {
    fontSize: 13,
    color: theme.colors.text.secondary,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressSection: {
    marginBottom: 24,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 20,
  },
  progressItem: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  progressIconContainer: {
    alignItems: 'center',
    marginRight: 16,
  },
  progressIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressIconCompleted: {
    backgroundColor: theme.colors.primary,
  },
  progressLine: {
    width: 2,
    flex: 1,
    backgroundColor: theme.colors.gray[200],
    marginTop: 8,
  },
  progressLineCompleted: {
    backgroundColor: theme.colors.primary,
  },
  progressContent: {
    flex: 1,
    paddingTop: 4,
  },
  progressItemTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 6,
  },
  progressItemBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressItemSubtitle: {
    fontSize: 13,
    color: theme.colors.text.secondary,
  },
  progressItemTime: {
    fontSize: 13,
    color: theme.colors.text.secondary,
  },
  doneButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.white,
  },
});
