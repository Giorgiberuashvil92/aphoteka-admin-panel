import { ProductService, type Product } from '@/src/services/product.service';
import { PrescriptionsApi, type PatientLookup } from '@/src/services/prescriptions.service';
import { theme } from '@/src/theme';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type SelectedLine = { productId: string; name: string; quantity: number };

type DoctorPrescribeScreenProps = {
  onBack: () => void;
};

function initials(name?: string): string {
  if (!name?.trim()) return '?';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export function DoctorPrescribeScreen({ onBack }: DoctorPrescribeScreenProps) {
  const insets = useSafeAreaInsets();
  const [patientEmail, setPatientEmail] = useState('');
  const [patient, setPatient] = useState<PatientLookup | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [catalog, setCatalog] = useState<Product[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(false);

  const [selected, setSelected] = useState<Record<string, SelectedLine>>({});
  const [submitting, setSubmitting] = useState(false);

  const loadCatalog = useCallback(async (q: string) => {
    setCatalogLoading(true);
    try {
      const { data } = await ProductService.getProductsFiltered({
        search: q.trim() || undefined,
        limit: 40,
        page: 1,
      });
      setCatalog(data);
    } finally {
      setCatalogLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => loadCatalog(search), 350);
    return () => clearTimeout(t);
  }, [search, loadCatalog]);

  const handleLookupPatient = async () => {
    setLookupError(null);
    setPatient(null);
    if (!patientEmail.trim()) {
      setLookupError('შეიყვანეთ ელფოსტა');
      return;
    }
    setLookupLoading(true);
    const res = await PrescriptionsApi.lookupPatientByEmail(patientEmail);
    setLookupLoading(false);
    if (!res.ok) {
      if (res.error === 'auth') {
        setLookupError('შედით ანგარიშში');
      } else {
        setLookupError(res.message || 'პაციენტი არ მოიძებნა');
      }
      return;
    }
    setPatient(res.patient);
  };

  const clearPatient = () => {
    setPatient(null);
    setLookupError(null);
  };

  const addProduct = (p: Product) => {
    setSelected((prev) => {
      const cur = prev[p.id];
      if (cur) {
        return {
          ...prev,
          [p.id]: { ...cur, quantity: cur.quantity + 1 },
        };
      }
      return {
        ...prev,
        [p.id]: { productId: p.id, name: p.name, quantity: 1 },
      };
    });
  };

  const changeQty = (productId: string, delta: number) => {
    setSelected((prev) => {
      const cur = prev[productId];
      if (!cur) return prev;
      const next = cur.quantity + delta;
      if (next < 1) {
        const { [productId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [productId]: { ...cur, quantity: next } };
    });
  };

  const handleSubmit = async () => {
    const emailForApi = patient?.email?.trim() || patientEmail.trim();
    if (!emailForApi) {
      Alert.alert('პაციენტი', 'ჯერ მოძებნეთ პაციენტი ელფოსტით');
      return;
    }
    const lines = Object.values(selected);
    if (!lines.length) {
      Alert.alert('წამლები', 'აირჩიეთ მინიმუმ ერთი პროდუქტი');
      return;
    }
    setSubmitting(true);
    const res = await PrescriptionsApi.createPrescription(
      emailForApi,
      lines.map((l) => ({
        productId: l.productId,
        quantity: l.quantity,
      })),
    );
    setSubmitting(false);
    if (!res.ok) {
      if (res.error === 'auth') {
        Alert.alert('შეცდომა', 'სესია ამოიწურა — შედით ხელახლა');
      } else {
        Alert.alert('შეცდომა', res.message || 'შენახვა ვერ მოხერხდა');
      }
      return;
    }
    Alert.alert('წარმატება', 'დანიშნულება ჩაწერილია', [
      {
        text: 'კარგი',
        onPress: () => {
          setSelected({});
          setPatient(null);
          setPatientEmail('');
        },
      },
    ]);
  };

  const selectedList = Object.values(selected);
  const totalUnits = useMemo(
    () => selectedList.reduce((s, l) => s + l.quantity, 0),
    [selectedList],
  );
  const canSubmit = Boolean(patient) && selectedList.length > 0 && !submitting;

  const footerPad = 12 + insets.bottom;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" />
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 8) }]}>
        <TouchableOpacity
          onPress={onBack}
          style={styles.headerBack}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityLabel="უკან"
        >
          <Ionicons name="chevron-back" size={26} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>დანიშნულება</Text>
          <Text style={styles.headerSubtitle}>ექიმის რეჟიმი</Text>
        </View>
        <View style={styles.headerPlaceholder} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: footerPad + 108 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ჰერო */}
          <View style={styles.hero}>
            <View style={styles.heroIconWrap}>
              <Ionicons name="medkit" size={32} color={theme.colors.primary} />
            </View>
            <Text style={styles.heroTitle}>პაციენტს წამლების მინიშნება</Text>
            <Text style={styles.heroDesc}>
              მოძებნეთ პაციენტი რეგისტრირებული ელფოსტით, შემდეგ აირჩიეთ პროდუქტები კატალოგიდან.
            </Text>
          </View>

          {/* ნაბიჯები */}
          <View style={styles.stepsRow}>
            <View style={[styles.stepPill, patient && styles.stepPillDone]}>
              <Ionicons
                name={patient ? 'checkmark-circle' : 'person-outline'}
                size={18}
                color={patient ? theme.colors.success : theme.colors.text.tertiary}
              />
              <Text style={[styles.stepPillText, patient && styles.stepPillTextDone]}>პაციენტი</Text>
            </View>
            <View style={styles.stepLine} />
            <View
              style={[
                styles.stepPill,
                selectedList.length > 0 && styles.stepPillActive,
              ]}
            >
              <Ionicons
                name="bandage-outline"
                size={18}
                color={
                  selectedList.length > 0 ? theme.colors.primary : theme.colors.text.tertiary
                }
              />
              <Text
                style={[
                  styles.stepPillText,
                  selectedList.length > 0 && styles.stepPillTextActive,
                ]}
              >
                წამლები
              </Text>
            </View>
          </View>

          {/* პაციენტი */}
          <Text style={styles.blockLabel}>1. პაციენტის ელფოსტა</Text>
          <View style={styles.card}>
            <View style={styles.emailRow}>
              <Ionicons
                name="mail-outline"
                size={22}
                color={theme.colors.text.tertiary}
                style={styles.emailIcon}
              />
              <TextInput
                style={styles.emailInput}
                placeholder="მაგ. patient@gmail.com"
                placeholderTextColor={theme.colors.gray[900]}
                value={patientEmail}
                onChangeText={(t) => {
                  setPatientEmail(t);
                  setPatient(null);
                  setLookupError(null);
                }}
                autoCapitalize="none"
                keyboardType="email-address"
                autoCorrect={false}
                returnKeyType="search"
                onSubmitEditing={handleLookupPatient}
              />
            </View>
            <TouchableOpacity
              style={[styles.primaryBtn, lookupLoading && styles.primaryBtnDisabled]}
              onPress={handleLookupPatient}
              disabled={lookupLoading}
              activeOpacity={0.85}
            >
              {lookupLoading ? (
                <ActivityIndicator color={theme.colors.white} />
              ) : (
                <>
                  <Ionicons name="search" size={20} color={theme.colors.white} />
                  <Text style={styles.primaryBtnText}>პაციენტის ძიება</Text>
                </>
              )}
            </TouchableOpacity>
            {lookupError ? (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle" size={18} color={theme.colors.error} />
                <Text style={styles.errorText}>{lookupError}</Text>
              </View>
            ) : null}
            {patient ? (
              <View style={styles.patientFound}>
                <View style={styles.patientAvatar}>
                  <Text style={styles.patientAvatarText}>{initials(patient.fullName)}</Text>
                </View>
                <View style={styles.patientFoundBody}>
                  <View style={styles.patientFoundTop}>
                    <View style={styles.patientNameRow}>
                      <Text style={styles.patientFoundName} numberOfLines={1}>
                        {patient.fullName || 'პაციენტი'}
                      </Text>
                      <Ionicons
                        name="checkmark-circle"
                        size={22}
                        color={theme.colors.success}
                        style={styles.verifiedIcon}
                      />
                    </View>
                    <TouchableOpacity onPress={clearPatient} hitSlop={12} style={styles.clearHit}>
                      <Ionicons name="close-circle" size={24} color={theme.colors.text.tertiary} />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.patientFoundEmail}>{patient.email}</Text>
                  {patient.phoneNumber ? (
                    <View style={styles.phoneRow}>
                      <Ionicons name="call-outline" size={14} color={theme.colors.text.tertiary} />
                      <Text style={styles.patientPhone}>{patient.phoneNumber}</Text>
                    </View>
                  ) : null}
                </View>
              </View>
            ) : null}
          </View>

          {/* დანიშნული სია */}
          <Text style={styles.blockLabel}>2. დანიშნული წამლები</Text>
          <View style={styles.card}>
            <View style={styles.cartHeader}>
              <Text style={styles.cartTitle}>კალათა</Text>
              {selectedList.length > 0 ? (
                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>
                    {selectedList.length} პოზ. · {totalUnits} ცალი
                  </Text>
                </View>
              ) : null}
            </View>
            {selectedList.length === 0 ? (
              <View style={styles.emptyCart}>
                <View style={styles.emptyCartIcon}>
                  <Ionicons name="cube-outline" size={40} color={theme.colors.purple[400]} />
                </View>
                <Text style={styles.emptyCartTitle}>ჯერ არაფერი არ არის არჩეული</Text>
                <Text style={styles.emptyCartHint}>
                  ქვემოთ მოძებნეთ წამალი და დააჭირეთ ბარათს — ის დაემატება აქ.
                </Text>
              </View>
            ) : (
              <View style={styles.cartList}>
                {selectedList.map((line) => (
                  <View key={line.productId} style={styles.cartLine}>
                    <View style={styles.cartLineMain}>
                      <Text style={styles.cartLineName} numberOfLines={2}>
                        {line.name}
                      </Text>
                    </View>
                    <View style={styles.qtyPill}>
                      <Pressable
                        style={({ pressed }) => [styles.qtySide, pressed && styles.qtyPressed]}
                        onPress={() => changeQty(line.productId, -1)}
                        hitSlop={8}
                      >
                        <Ionicons name="remove" size={20} color={theme.colors.primary} />
                      </Pressable>
                      <Text style={styles.qtyNum}>{line.quantity}</Text>
                      <Pressable
                        style={({ pressed }) => [styles.qtySide, pressed && styles.qtyPressed]}
                        onPress={() => changeQty(line.productId, 1)}
                        hitSlop={8}
                      >
                        <Ionicons name="add" size={20} color={theme.colors.primary} />
                      </Pressable>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* კატალოგი */}
          <Text style={styles.blockLabel}>3. კატალოგიდან არჩევა</Text>
          <View style={styles.searchWrap}>
            <Ionicons name="search" size={20} color={theme.colors.text.tertiary} />
            <TextInput
              style={styles.searchInput}
              placeholder="ძიება სახელით, მწარმოებლით..."
              placeholderTextColor={theme.colors.gray[900]}
              value={search}
              onChangeText={setSearch}
            />
            {search.length > 0 ? (
              <TouchableOpacity onPress={() => setSearch('')} hitSlop={12}>
                <Ionicons name="close-circle" size={22} color={theme.colors.text.tertiary} />
              </TouchableOpacity>
            ) : null}
          </View>

          {catalogLoading ? (
            <View style={styles.catalogLoading}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={styles.catalogLoadingText}>კატალოგის ჩატვირთვა...</Text>
            </View>
          ) : catalog.length === 0 ? (
            <View style={styles.emptyCatalog}>
              <Ionicons name="search-outline" size={48} color={theme.colors.gray[600]} />
              <Text style={styles.emptyCatalogText}>შედეგი არ მოიძებნა</Text>
              <Text style={styles.emptyCatalogHint}>სცადეთ სხვა საძიებო სიტყვა</Text>
            </View>
          ) : (
            catalog.map((item) => (
              <Pressable
                key={item.id}
                style={({ pressed }) => [styles.productCard, pressed && styles.productCardPressed]}
                onPress={() => addProduct(item)}
              >
                <Image
                  source={{ uri: item.thumbnail }}
                  style={styles.productThumb}
                  contentFit="cover"
                  transition={200}
                />
                <View style={styles.productBody}>
                  <Text style={styles.productName} numberOfLines={2}>
                    {item.name}
                  </Text>
                  {item.manufacturer ? (
                    <Text style={styles.productBrand} numberOfLines={1}>
                      {item.manufacturer}
                    </Text>
                  ) : null}
                  <Text style={styles.productPrice}>₾{Number(item.price).toFixed(2)}</Text>
                </View>
                <View style={styles.addChip}>
                  <Ionicons name="add" size={22} color={theme.colors.white} />
                </View>
              </Pressable>
            ))
          )}
        </ScrollView>

        {/* ქვედა პანელი */}
        <View style={[styles.footer, { paddingBottom: footerPad }]}>
          <View style={styles.footerSummary}>
            <Text style={styles.footerSummaryLabel}>სტატუსი</Text>
            <Text
              style={[
                styles.footerSummaryValue,
                !canSubmit && !submitting && styles.footerSummaryMuted,
              ]}
              numberOfLines={1}
            >
              {submitting
                ? 'იგზავნება...'
                : canSubmit
                  ? `${selectedList.length} პოზიცია · ${totalUnits} ცალი`
                  : patient
                    ? 'აირჩიეთ წამლები'
                    : 'ჯერ მოძებნეთ პაციენტი'}
            </Text>
          </View>
          <TouchableOpacity
            style={[
              styles.footerBtn,
              (!canSubmit || submitting) && styles.footerBtnDisabled,
            ]}
            onPress={handleSubmit}
            disabled={!canSubmit}
            activeOpacity={0.9}
          >
            {submitting ? (
              <ActivityIndicator color={theme.colors.white} />
            ) : (
              <>
                <Ionicons name="save-outline" size={22} color={theme.colors.white} />
                <Text style={styles.footerBtnText}>დანიშნულების შენახვა</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.background.secondary,
  },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingBottom: 10,
    backgroundColor: theme.colors.white,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border.light,
  },
  headerBack: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  headerCenter: { alignItems: 'center' },
  headerPlaceholder: { width: 44 },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.colors.text.primary,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    color: theme.colors.text.tertiary,
    marginTop: 2,
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  hero: {
    backgroundColor: theme.colors.background.purple.light,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: theme.colors.purple[200],
  },
  heroIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: theme.colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 8,
    letterSpacing: -0.4,
  },
  heroDesc: {
    fontSize: 14,
    lineHeight: 21,
    color: theme.colors.text.secondary,
  },
  stepsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  stepPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  stepPillDone: {
    borderColor: theme.colors.success + '55',
    backgroundColor: '#E8F8EF',
  },
  stepPillActive: {
    borderColor: theme.colors.primary + '66',
    backgroundColor: theme.colors.purple[100],
  },
  stepPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.text.tertiary,
  },
  stepPillTextDone: { color: theme.colors.success },
  stepPillTextActive: { color: theme.colors.primary },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: theme.colors.border.light,
    marginHorizontal: 8,
    maxWidth: 40,
  },
  blockLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 10,
    marginTop: 4,
  },
  card: {
    backgroundColor: theme.colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  emailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.gray[50],
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  emailIcon: { marginRight: 10 },
  emailInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: theme.colors.text.primary,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: theme.colors.primary,
    paddingVertical: 14,
    borderRadius: 14,
  },
  primaryBtnDisabled: { opacity: 0.65 },
  primaryBtnText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 12,
    padding: 12,
    backgroundColor: '#FDECEB',
    borderRadius: 12,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.error,
    lineHeight: 20,
  },
  patientFound: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    padding: 14,
    backgroundColor: theme.colors.purple[100],
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.primary + '33',
  },
  patientAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  patientAvatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.white,
  },
  patientFoundBody: { flex: 1, marginLeft: 12 },
  patientFoundTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  patientNameRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  patientFoundName: {
    flexShrink: 1,
    fontSize: 17,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  verifiedIcon: { marginLeft: 6 },
  clearHit: { marginLeft: 4 },
  patientFoundEmail: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginTop: 4,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  patientPhone: { fontSize: 13, color: theme.colors.text.tertiary },
  cartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cartTitle: { fontSize: 18, fontWeight: '700', color: theme.colors.text.primary },
  countBadge: {
    backgroundColor: theme.colors.purple[200],
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  countBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.primaryDark,
  },
  emptyCart: {
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: 12,
  },
  emptyCartIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.purple[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  emptyCartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 6,
    textAlign: 'center',
  },
  emptyCartHint: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  },
  cartList: { gap: 0 },
  cartLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border.light,
  },
  cartLineMain: { flex: 1, marginRight: 12 },
  cartLineName: { fontSize: 15, fontWeight: '500', color: theme.colors.text.primary },
  qtyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.gray[50],
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    overflow: 'hidden',
  },
  qtySide: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyPressed: { backgroundColor: theme.colors.purple[100] },
  qtyNum: {
    minWidth: 28,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.text.primary,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: theme.colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    paddingHorizontal: 14,
    paddingVertical: 4,
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: theme.colors.text.primary,
  },
  catalogLoading: {
    paddingVertical: 48,
    alignItems: 'center',
  },
  catalogLoadingText: {
    marginTop: 12,
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  emptyCatalog: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyCatalogText: {
    marginTop: 12,
    fontSize: 17,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  emptyCatalogHint: {
    marginTop: 6,
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  productCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  productCardPressed: {
    backgroundColor: theme.colors.purple[100],
    borderColor: theme.colors.primary + '44',
  },
  productThumb: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: theme.colors.gray[100],
  },
  productBody: { flex: 1, marginLeft: 12, marginRight: 10 },
  productName: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.text.primary,
    lineHeight: 20,
  },
  productBrand: {
    fontSize: 12,
    color: theme.colors.text.tertiary,
    marginTop: 4,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.primary,
    marginTop: 6,
  },
  addChip: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.white,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.border.light,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 16,
  },
  footerSummary: {
    marginBottom: 10,
  },
  footerSummaryLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  footerSummaryValue: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginTop: 2,
  },
  footerSummaryMuted: { color: theme.colors.text.tertiary },
  footerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: theme.colors.primary,
    paddingVertical: 16,
    borderRadius: 16,
  },
  footerBtnDisabled: {
    backgroundColor: theme.colors.gray[400],
    opacity: 0.85,
  },
  footerBtnText: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.colors.white,
  },
});
