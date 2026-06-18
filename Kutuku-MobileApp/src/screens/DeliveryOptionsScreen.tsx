import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  deliveryService,
  DeliveryAddress,
  DeliveryProvider,
  DeliveryPrice,
  SelectedDelivery,
} from '../services/delivery.service';

interface DeliveryOptionsScreenProps {
  deliveryAddress: DeliveryAddress;
  onBack: () => void;
  onSelectDelivery: (delivery: SelectedDelivery) => void;
}

export const DeliveryOptionsScreen: React.FC<DeliveryOptionsScreenProps> = ({
  deliveryAddress,
  onBack,
  onSelectDelivery,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [providers, setProviders] = useState<DeliveryProvider[]>([]);
  const [distance, setDistance] = useState(0);
  const [selectedProvider, setSelectedProvider] =
    useState<DeliveryProvider | null>(null);
  const [selectedPrice, setSelectedPrice] = useState<DeliveryPrice | null>(
    null,
  );

  useEffect(() => {
    loadDeliveryOptions();
  }, []);

  const loadDeliveryOptions = async () => {
    setIsLoading(true);
    try {
      const pharmacyAddress = deliveryService.getPharmacyAddress();
      const response = await deliveryService.calculateDeliveryFees(
        pharmacyAddress,
        deliveryAddress,
      );

      setProviders(response.fees);
      setDistance(response.distance);

      // Auto-select cheapest option
      if (response.fees.length > 0) {
        const cheapest = response.fees.reduce((prev, curr) =>
          curr.minPrice < prev.minPrice ? curr : prev,
        );
        setSelectedProvider(cheapest);
        setSelectedPrice(cheapest.prices[0]);
      }
    } catch (error) {
      console.error('Error loading delivery options:', error);
      Alert.alert(
        'შეცდომა',
        'მიტანის ვარიანტების ჩატვირთვა ვერ მოხერხდა. გთხოვთ სცადოთ თავიდან.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinue = () => {
    if (!selectedProvider || !selectedPrice) {
      Alert.alert('შეცდომა', 'გთხოვთ აირჩიოთ მიტანის ვარიანტი');
      return;
    }

    const delivery: SelectedDelivery = {
      provider: selectedProvider,
      selectedPrice: selectedPrice,
      fromAddress: deliveryService.getPharmacyAddress(),
      toAddress: deliveryAddress,
      distance,
    };

    onSelectDelivery(delivery);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>მიტანის არჩევანი</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#5B5FC7" />
          <Text style={styles.loadingText}>ვიძებნით მიტანის ვარიანტებს...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (providers.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>მიტანის არჩევანი</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="location-outline" size={64} color="#CCC" />
          <Text style={styles.emptyTitle}>მიტანა მიუწვდომელია</Text>
          <Text style={styles.emptyText}>
            სამწუხაროდ, თქვენს მისამართზე მიტანა ამჟამად შეუძლებელია
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={onBack}>
            <Text style={styles.retryButtonText}>მისამართის შეცვლა</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>მიტანის არჩევანი</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Address Info */}
        <View style={styles.addressCard}>
          <View style={styles.addressRow}>
            <Ionicons name="location" size={20} color="#5B5FC7" />
            <View style={styles.addressInfo}>
              <Text style={styles.addressLabel}>მიტანის მისამართი:</Text>
              <Text style={styles.addressText}>
                {deliveryAddress.streetName}, {deliveryAddress.cityName}
              </Text>
            </View>
            <TouchableOpacity onPress={onBack}>
              <Text style={styles.changeButton}>შეცვლა</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.distanceRow}>
            <Ionicons name="navigate-outline" size={16} color="#666" />
            <Text style={styles.distanceText}>
              მანძილი: {distance.toFixed(2)} კმ
            </Text>
          </View>
        </View>

        {/* Provider Options */}
        <View style={styles.providersSection}>
          <Text style={styles.sectionTitle}>
            ხელმისაწვდომი მიტანის სერვისები ({providers.length})
          </Text>

          {providers.map((provider) => (
            <TouchableOpacity
              key={provider.providerId}
              style={[
                styles.providerCard,
                selectedProvider?.providerId === provider.providerId &&
                  styles.providerCardSelected,
              ]}
              onPress={() => {
                setSelectedProvider(provider);
                setSelectedPrice(provider.prices[0]);
              }}
            >
              {/* Provider Header */}
              <View style={styles.providerHeader}>
                <Image
                  source={{ uri: provider.providerLogoUrl }}
                  style={styles.providerLogo}
                  resizeMode="contain"
                />
                <View style={styles.providerInfo}>
                  <Text style={styles.providerName}>{provider.providerName}</Text>
                  {provider.providerNote && (
                    <Text style={styles.providerNote}>{provider.providerNote}</Text>
                  )}
                </View>
                <View
                  style={[
                    styles.radioButton,
                    selectedProvider?.providerId === provider.providerId &&
                      styles.radioButtonSelected,
                  ]}
                >
                  {selectedProvider?.providerId === provider.providerId && (
                    <View style={styles.radioButtonInner} />
                  )}
                </View>
              </View>

              {/* Delivery Options */}
              {provider.prices.map((price) => (
                <View key={price.id} style={styles.priceOption}>
                  <View style={styles.priceInfo}>
                    <View style={styles.priceSpeed}>
                      <Ionicons
                        name={
                          price.deliverySpeedName.includes('min')
                            ? 'flash'
                            : 'time-outline'
                        }
                        size={16}
                        color={
                          price.deliverySpeedName.includes('min')
                            ? '#FF9500'
                            : '#666'
                        }
                      />
                      <Text style={styles.priceSpeedText}>
                        {price.deliverySpeedName}
                      </Text>
                    </View>
                    {price.deliverySpeedDescription && (
                      <Text style={styles.priceDescription}>
                        {price.deliverySpeedDescription}
                      </Text>
                    )}
                  </View>
                  <View style={styles.priceAmount}>
                    <Text style={styles.priceText}>
                      {price.amount.toFixed(2)} {price.currency}
                    </Text>
                    {price.oldAmount && (
                      <Text style={styles.oldPrice}>
                        {price.oldAmount.toFixed(2)} {price.currency}
                      </Text>
                    )}
                  </View>
                </View>
              ))}

              {/* Service Fee */}
              <View style={styles.serviceFee}>
                <Ionicons name="information-circle-outline" size={14} color="#999" />
                <Text style={styles.serviceFeeText}>
                  + სერვისის საფასური: {provider.serviceFee} {provider.serviceFeeCurrency}
                </Text>
              </View>

              {/* Features */}
              <View style={styles.features}>
                {provider.hasCarDelivery && (
                  <View style={styles.featureBadge}>
                    <Ionicons name="car" size={12} color="#5B5FC7" />
                    <Text style={styles.featureText}>მანქანით</Text>
                  </View>
                )}
                {provider.hasScheduledDelivery && (
                  <View style={styles.featureBadge}>
                    <Ionicons name="calendar" size={12} color="#5B5FC7" />
                    <Text style={styles.featureText}>დაგეგმილი</Text>
                  </View>
                )}
                {provider.hasCashOnDelivery && (
                  <View style={styles.featureBadge}>
                    <Ionicons name="cash" size={12} color="#5B5FC7" />
                    <Text style={styles.featureText}>გადახდა ადგილზე</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Continue Button */}
      {selectedProvider && selectedPrice && (
        <View style={styles.footer}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>მიტანის ღირებულება:</Text>
            <Text style={styles.totalAmount}>
              {(
                selectedPrice.amount + selectedProvider.serviceFee
              ).toFixed(2)}{' '}
              ₾
            </Text>
          </View>
          <TouchableOpacity
            style={styles.continueButton}
            onPress={handleContinue}
          >
            <Text style={styles.continueButtonText}>გაგრძელება გადახდაზე</Text>
            <Ionicons name="arrow-forward" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>
      )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 15,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  retryButton: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#5B5FC7',
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFF',
  },
  content: {
    flex: 1,
  },
  addressCard: {
    backgroundColor: '#FFF',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  addressInfo: {
    flex: 1,
  },
  addressLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  addressText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  changeButton: {
    fontSize: 14,
    color: '#5B5FC7',
    fontWeight: '600',
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  distanceText: {
    fontSize: 13,
    color: '#666',
  },
  providersSection: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  providerCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  providerCardSelected: {
    borderColor: '#5B5FC7',
  },
  providerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  providerLogo: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
  },
  providerInfo: {
    flex: 1,
  },
  providerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  providerNote: {
    fontSize: 12,
    color: '#999',
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#CCC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonSelected: {
    borderColor: '#5B5FC7',
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#5B5FC7',
  },
  priceOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  priceInfo: {
    flex: 1,
  },
  priceSpeed: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  priceSpeedText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  priceDescription: {
    fontSize: 12,
    color: '#666',
  },
  priceAmount: {
    alignItems: 'flex-end',
  },
  priceText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  oldPrice: {
    fontSize: 12,
    color: '#999',
    textDecorationLine: 'line-through',
  },
  serviceFee: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  serviceFeeText: {
    fontSize: 12,
    color: '#999',
  },
  features: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  featureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: '#F0F0FF',
    borderRadius: 6,
  },
  featureText: {
    fontSize: 11,
    color: '#5B5FC7',
    fontWeight: '500',
  },
  footer: {
    backgroundColor: '#FFF',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    gap: 12,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 15,
    color: '#666',
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
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
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
});
