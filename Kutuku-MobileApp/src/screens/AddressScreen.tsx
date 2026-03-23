import {
  DeliveryAddressService,
  DELIVERY_LABEL_PRESETS,
  formatShippingAddressLine,
  GEORGIA_CITY_SUGGESTIONS,
  isDeliveryAddressComplete,
  type DeliveryAddress,
} from '@/src/services/deliveryAddress.service';
import { theme } from '@/src/theme';
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

type AddressScreenProps = {
  onBack: () => void;
  /** შენახვის შემდეგ (მაგ. router.back) */
  onSaved?: () => void;
};

const emptyForm = (): DeliveryAddress => ({
  label: 'სახლი',
  street: '',
  city: 'თბილისი',
  building: '',
  floor: '',
  note: '',
  phone: '',
});

export function AddressScreen({ onBack, onSaved }: AddressScreenProps) {
  const [form, setForm] = useState<DeliveryAddress>(emptyForm);
  const [loaded, setLoaded] = useState(false);

  const loadSaved = useCallback(async () => {
    const saved = await DeliveryAddressService.get();
    if (saved) {
      setForm({
        label: saved.label || 'სახლი',
        street: saved.street,
        city: saved.city || 'თბილისი',
        building: saved.building ?? '',
        floor: saved.floor ?? '',
        note: saved.note ?? '',
        phone: saved.phone,
      });
    } else {
      setForm(emptyForm());
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    void loadSaved();
  }, [loadSaved]);

  const update = <K extends keyof DeliveryAddress>(key: K, value: DeliveryAddress[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    if (!isDeliveryAddressComplete(form)) {
      Alert.alert(
        'შეავსეთ ველები',
        'საჭიროა: მისამართის ტიპი, ქუჩა/ნომერი (მინ. 3 სიმბოლო), ქალაქი და ტელეფონი (მინ. 9 ციფრი).',
      );
      return;
    }
    await DeliveryAddressService.save(form);
    if (onSaved) onSaved();
    else onBack();
  };

  if (!loaded) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={theme.colors.white} />
        <View style={styles.loadingWrap}>
          <Text style={styles.loadingText}>იტვირთება...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.white} />

      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.headerButton} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Ionicons name="chevron-back" size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>მიწოდების მისამართი</Text>
        <View style={styles.headerButton} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.titleSection}>
            <Text style={styles.title}>სად მივიტანოთ შეკვეთა?</Text>
            <Text style={styles.subtitle}>
              მიუთითეთ სრული მისამართი საქართველოში. ეს ტექსტი გადაეცემა აფთიაქს კურიერისთვის და ჩანს შეკვეთის დეტალებში.
            </Text>
          </View>

          <Text style={styles.fieldLabel}>ტიპი</Text>
          <View style={styles.chipRow}>
            {DELIVERY_LABEL_PRESETS.map((opt) => {
              const selected = form.label === opt.title;
              return (
                <TouchableOpacity
                  key={opt.id}
                  style={[styles.chip, selected && styles.chipSelected]}
                  onPress={() => update('label', opt.title)}
                >
                  <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{opt.title}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.fieldLabel}>ქალაქი / დასახლება</Text>
          <View style={styles.chipWrap}>
            {GEORGIA_CITY_SUGGESTIONS.map((c) => {
              const selected = form.city.trim() === c;
              return (
                <TouchableOpacity
                  key={c}
                  style={[styles.chipSmall, selected && styles.chipSelected]}
                  onPress={() => update('city', c)}
                >
                  <Text style={[styles.chipText, selected && styles.chipTextSelected]} numberOfLines={1}>
                    {c}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <TextInput
            style={styles.input}
            placeholder="მაგ. თბილისი, ვაკე"
            placeholderTextColor={theme.colors.gray[400]}
            value={form.city}
            onChangeText={(t) => update('city', t)}
          />

          <Text style={styles.fieldLabel}>ქუჩა და სახლის ნომერი *</Text>
          <TextInput
            style={styles.input}
            placeholder="მაგ. ვაჟა-ფშაველას გამზირი 41"
            placeholderTextColor={theme.colors.gray[400]}
            value={form.street}
            onChangeText={(t) => update('street', t)}
          />

          <View style={styles.rowTwo}>
            <View style={styles.rowHalf}>
              <Text style={styles.fieldLabelRow}>სადაბე / კორპუსი</Text>
              <TextInput
                style={[styles.input, styles.inputInRow]}
                placeholder="არასავალდებულო"
                placeholderTextColor={theme.colors.gray[400]}
                value={form.building}
                onChangeText={(t) => update('building', t)}
              />
            </View>
            <View style={styles.rowHalf}>
              <Text style={styles.fieldLabelRow}>სართული / ბინა</Text>
              <TextInput
                style={[styles.input, styles.inputInRow]}
                placeholder="არასავალდებულო"
                placeholderTextColor={theme.colors.gray[400]}
                value={form.floor}
                onChangeText={(t) => update('floor', t)}
              />
            </View>
          </View>

          <Text style={styles.fieldLabel}>ტელეფონი მიტანისთვის *</Text>
          <TextInput
            style={styles.input}
            placeholder="მაგ. 599123456 ან +995599123456"
            placeholderTextColor={theme.colors.gray[400]}
            value={form.phone}
            onChangeText={(t) => update('phone', t)}
            keyboardType="phone-pad"
          />

          <Text style={styles.fieldLabel}>შენიშვნა კურიერისთვის</Text>
          <TextInput
            style={[styles.input, styles.inputMultiline]}
            placeholder="კოდი, ორიენტირი, დროის ფანჯარა…"
            placeholderTextColor={theme.colors.gray[400]}
            value={form.note}
            onChangeText={(t) => update('note', t)}
            multiline
          />

          <View style={styles.previewCard}>
            <Text style={styles.previewTitle}>შეჯამება</Text>
            <Text style={styles.previewBody}>
              {isDeliveryAddressComplete(form) ? formatShippingAddressLine(form) : 'შეავსეთ სავალდებულო ველები.'}
            </Text>
          </View>
        </ScrollView>

        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.saveButton} onPress={() => void handleSave()}>
            <Text style={styles.saveButtonText}>შენახვა</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flex: 1,
    backgroundColor: theme.colors.white,
  },
  loadingWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 15,
    color: theme.colors.text.secondary,
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
    fontSize: 17,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  titleSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 22,
    color: theme.colors.text.secondary,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginTop: 16,
    marginBottom: 8,
    paddingHorizontal: 20,
  },
  fieldLabelRow: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingHorizontal: 20,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  chip: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: theme.colors.gray[50],
    borderWidth: 2,
    borderColor: 'transparent',
  },
  chipSmall: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: theme.colors.gray[50],
    borderWidth: 2,
    borderColor: 'transparent',
  },
  chipSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '12',
  },
  chipText: {
    fontSize: 15,
    fontWeight: '500',
    color: theme.colors.text.primary,
  },
  chipTextSelected: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  input: {
    marginHorizontal: 20,
    backgroundColor: theme.colors.gray[50],
    borderWidth: 1,
    borderColor: theme.colors.gray[200],
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: theme.colors.text.primary,
  },
  inputInRow: {
    marginHorizontal: 0,
  },
  inputMultiline: {
    minHeight: 88,
    textAlignVertical: 'top',
  },
  rowTwo: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
  },
  rowHalf: {
    flex: 1,
  },
  previewCard: {
    marginHorizontal: 20,
    marginTop: 24,
    padding: 16,
    borderRadius: 12,
    backgroundColor: theme.colors.gray[50],
    borderWidth: 1,
    borderColor: theme.colors.gray[200],
  },
  previewTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.text.secondary,
    marginBottom: 8,
  },
  previewBody: {
    fontSize: 14,
    lineHeight: 22,
    color: theme.colors.text.primary,
  },
  bottomBar: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
    backgroundColor: theme.colors.white,
    borderTopWidth: 1,
    borderTopColor: theme.colors.gray[100],
  },
  saveButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.white,
  },
});
