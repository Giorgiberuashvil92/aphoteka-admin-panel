import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { savedAddressesService, type SavedAddress } from '../services/savedAddresses.service';
import { useFocusEffect } from '@react-navigation/native';

interface ManageAddressesScreenProps {
  onBack: () => void;
}

export const ManageAddressesScreen: React.FC<ManageAddressesScreenProps> = ({
  onBack,
}) => {
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [editingAddress, setEditingAddress] = useState<SavedAddress | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadAddresses();
    }, []),
  );

  const loadAddresses = async () => {
    try {
      const loaded = await savedAddressesService.getAll();
      setAddresses(loaded);
    } catch (err) {
      Alert.alert('შეცდომა', 'მისამართების ჩატვირთვა ვერ მოხერხდა');
      console.error('Error loading addresses:', err);
    }
  };

  const handleDelete = async (id: string) => {
    Alert.alert(
      'დადასტურება',
      'დარწმუნებული ხართ რომ გსურთ ამ მისამართის წაშლა?',
      [
        { text: 'გაუქმება', style: 'cancel' },
        {
          text: 'წაშლა',
          style: 'destructive',
          onPress: async () => {
            try {
              await savedAddressesService.delete(id);
              await loadAddresses();
            } catch (err) {
              Alert.alert('შეცდომა', 'მისამართის წაშლა ვერ მოხერხდა');
              console.error('Error deleting address:', err);
            }
          },
        },
      ],
    );
  };

  const handleEdit = (address: SavedAddress) => {
    setEditingAddress(address);
    setIsModalVisible(true);
  };

  const handleSave = async () => {
    if (!editingAddress) return;

    try {
      await savedAddressesService.update(editingAddress.id, editingAddress);
      setIsModalVisible(false);
      setEditingAddress(null);
      await loadAddresses();
      Alert.alert('წარმატება', 'მისამართი განახლდა');
    } catch (err) {
      Alert.alert('შეცდომა', 'მისამართის განახლება ვერ მოხერხდა');
      console.error('Error updating address:', err);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>მისამართების მართვა</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {addresses.map((address) => (
          <View key={address.id} style={styles.addressCard}>
            <View style={styles.addressIcon}>
              <Ionicons name={address.icon as any} size={24} color="#5B5FC7" />
            </View>
            <View style={styles.addressInfo}>
              <Text style={styles.addressLabel}>{address.label}</Text>
              <Text style={styles.addressStreet}>{address.streetName}</Text>
              <Text style={styles.addressCity}>{address.cityName}</Text>
            </View>
            <View style={styles.addressActions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleEdit(address)}
              >
                <Ionicons name="pencil" size={20} color="#5B5FC7" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.deleteButton]}
                onPress={() => handleDelete(address.id)}
              >
                <Ionicons name="trash-outline" size={20} color="#FF3B30" />
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {addresses.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="location-outline" size={64} color="#CCC" />
            <Text style={styles.emptyText}>შენახული მისამართები არ არის</Text>
          </View>
        )}
      </ScrollView>

      {/* Edit Modal */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer} edges={['top']}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setIsModalVisible(false)}>
              <Text style={styles.modalCancel}>გაუქმება</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>მისამართის რედაქტირება</Text>
            <TouchableOpacity onPress={handleSave}>
              <Text style={styles.modalSave}>შენახვა</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.modalInput}>
              <Text style={styles.modalLabel}>სახელი</Text>
              <TextInput
                style={styles.modalTextInput}
                value={editingAddress?.label}
                onChangeText={(text) =>
                  setEditingAddress((prev) => (prev ? { ...prev, label: text } : null))
                }
                placeholder="მაგ: სახლი"
              />
            </View>

            <View style={styles.modalInput}>
              <Text style={styles.modalLabel}>ქუჩა და შენობის ნომერი</Text>
              <TextInput
                style={[styles.modalTextInput, styles.modalTextArea]}
                value={editingAddress?.streetName}
                onChangeText={(text) =>
                  setEditingAddress((prev) =>
                    prev ? { ...prev, streetName: text } : null,
                  )
                }
                placeholder="მაგ: ვაჟა-ფშაველას 45"
                multiline
                numberOfLines={2}
              />
            </View>

            <View style={styles.modalInput}>
              <Text style={styles.modalLabel}>ქალაქი</Text>
              <TextInput
                style={styles.modalTextInput}
                value={editingAddress?.cityName}
                onChangeText={(text) =>
                  setEditingAddress((prev) =>
                    prev ? { ...prev, cityName: text } : null,
                  )
                }
                placeholder="თბილისი"
              />
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  addressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  addressIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F5F3FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  addressInfo: {
    flex: 1,
  },
  addressLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 6,
  },
  addressStreet: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  addressCity: {
    fontSize: 13,
    color: '#999',
  },
  addressActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#F5F3FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButton: {
    backgroundColor: '#FFF0F0',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalCancel: {
    fontSize: 16,
    color: '#666',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  modalSave: {
    fontSize: 16,
    fontWeight: '700',
    color: '#5B5FC7',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  modalInput: {
    marginBottom: 24,
  },
  modalLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  modalTextInput: {
    borderWidth: 2,
    borderColor: '#E8E8E8',
    borderRadius: 14,
    padding: 16,
    fontSize: 16,
    color: '#1A1A1A',
    backgroundColor: '#FAFAFA',
  },
  modalTextArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
});
