import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar, TextInput, ScrollView } from 'react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/src/theme';

type AddCardScreenProps = {
  onBack: () => void;
  onAddCard: (card: CardData) => void;
};

export type CardData = {
  id: string;
  type: 'mastercard' | 'visa' | 'paypal';
  holderName: string;
  cardNumber: string;
  expiry: string;
  cvv: string;
};

export function AddCardScreen({ onBack, onAddCard }: AddCardScreenProps) {
  const [cardNumber, setCardNumber] = useState('');
  const [holderName, setHolderName] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');

  const formatCardNumber = (text: string) => {
    // Remove all non-digits
    const cleaned = text.replace(/\D/g, '');
    // Add space every 4 digits
    const formatted = cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
    return formatted.substring(0, 19); // Max 16 digits + 3 spaces
  };

  const formatExpiry = (text: string) => {
    // Remove all non-digits
    const cleaned = text.replace(/\D/g, '');
    // Add slash after 2 digits
    if (cleaned.length >= 2) {
      return `${cleaned.substring(0, 2)}/${cleaned.substring(2, 4)}`;
    }
    return cleaned;
  };

  const handleCardNumberChange = (text: string) => {
    setCardNumber(formatCardNumber(text));
  };

  const handleExpiryChange = (text: string) => {
    setExpiry(formatExpiry(text));
  };

  const handleCvvChange = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    setCvv(cleaned.substring(0, 3));
  };

  const detectCardType = (number: string): 'mastercard' | 'visa' | 'paypal' => {
    const cleaned = number.replace(/\s/g, '');
    if (cleaned.startsWith('5')) return 'mastercard';
    if (cleaned.startsWith('4')) return 'visa';
    return 'mastercard';
  };

  const handleAddCard = () => {
    if (!cardNumber || !holderName || !expiry || !cvv) {
      alert('Please fill all fields');
      return;
    }

    const newCard: CardData = {
      id: Date.now().toString(),
      type: detectCardType(cardNumber),
      holderName,
      cardNumber,
      expiry,
      cvv,
    };

    onAddCard(newCard);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.white} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.headerButton}>
          <Ionicons name="chevron-back" size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add New Card</Text>
        <View style={styles.headerButton} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Card Number */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Card Number</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="card-outline" size={20} color={theme.colors.gray[400]} />
            <TextInput
              style={styles.input}
              placeholder="Enter Card Number"
              placeholderTextColor={theme.colors.text.secondary}
              value={cardNumber}
              onChangeText={handleCardNumberChange}
              keyboardType="number-pad"
              maxLength={19}
            />
          </View>
        </View>

        {/* Card Holder Name */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Card Holder Name</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="person-outline" size={20} color={theme.colors.gray[400]} />
            <TextInput
              style={styles.input}
              placeholder="Enter Holder Name"
              placeholderTextColor={theme.colors.text.secondary}
              value={holderName}
              onChangeText={setHolderName}
              autoCapitalize="words"
              autoCorrect={false}
            />
          </View>
        </View>

        {/* Expiry Date */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Expired</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="calendar-outline" size={20} color={theme.colors.gray[400]} />
            <TextInput
              style={styles.input}
              placeholder="MM/YY"
              placeholderTextColor={theme.colors.text.secondary}
              value={expiry}
              onChangeText={handleExpiryChange}
              keyboardType="number-pad"
              maxLength={5}
            />
          </View>
        </View>

        {/* CVV Code */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>CVV Code</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color={theme.colors.gray[400]} />
            <TextInput
              style={styles.input}
              placeholder="CCV"
              placeholderTextColor={theme.colors.text.secondary}
              value={cvv}
              onChangeText={handleCvvChange}
              keyboardType="number-pad"
              maxLength={3}
              secureTextEntry
            />
          </View>
        </View>
      </ScrollView>

      {/* Add Card Button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.addButton} onPress={handleAddCard}>
          <Text style={styles.addButtonText}>Add Card</Text>
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
    padding: 20,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.gray[50],
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
    gap: 12,
    borderWidth: 1,
    borderColor: theme.colors.gray[200],
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: theme.colors.text.primary,
  },
  bottomBar: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: theme.colors.white,
    borderTopWidth: 1,
    borderTopColor: theme.colors.gray[100],
  },
  addButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.white,
  },
});
