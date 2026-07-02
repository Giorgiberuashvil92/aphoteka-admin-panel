import { ProductService } from '@/src/services/product.service';
import {
  PrescriptionsApi,
  type MyPrescriptionRow,
} from '@/src/services/prescriptions.service';
import { useCart } from '@/src/contexts';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const C = {
  bg: '#FFFFFF',
  navy: '#2A3A7A',
  purple: '#5B5FC7',
  lavender: '#E8EAF6',
  text: '#1A1A2E',
  muted: '#9CA3AF',
  border: '#F3F4F6',
};

type DoctorPrescriptionScreenProps = {
  onBack: () => void;
  onProductPress: (productId: string) => void;
  onNavigateToCart?: () => void;
};

function formatPrescriptionDate(iso?: string): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('ka-GE', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return '—';
  }
}

function formatPrescriberLabel(row: MyPrescriptionRow): string {
  const name = row.prescribedByName?.trim();
  if (name) return name;
  const email = row.prescribedByEmail?.trim();
  if (email) return email;
  return 'უცნობი';
}

export function DoctorPrescriptionScreen({
  onBack,
  onProductPress,
  onNavigateToCart,
}: DoctorPrescriptionScreenProps) {
  const insets = useSafeAreaInsets();
  const { addToCart } = useCart();
  const [prescriptions, setPrescriptions] = useState<MyPrescriptionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [addingPrescriptionId, setAddingPrescriptionId] = useState<string | null>(null);
  /** პოზიციები, რომლის ყიდვაც არ სურს პაციენტს */
  const [declinedKeys, setDeclinedKeys] = useState<Set<string>>(new Set());
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const itemKey = (prescriptionId: string, productId: string, index: number) =>
    `${prescriptionId}:${productId || index}`;

  const toggleExpanded = (prescriptionId: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(prescriptionId)) {
        next.delete(prescriptionId);
      } else {
        next.add(prescriptionId);
      }
      return next;
    });
  };

  const toggleDeclined = (key: string) => {
    setDeclinedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const loadPrescriptions = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await PrescriptionsApi.getMyPrescriptions();
    if (result.ok) {
      setPrescriptions(result.prescriptions);
      setExpandedIds(new Set(result.prescriptions.map((p) => p.id)));
    } else if (result.error === 'no_token' || result.error === 'unauthorized') {
      setError('შედით ანგარიშზე დანიშნულებების სანახავად');
      setPrescriptions([]);
      setExpandedIds(new Set());
    } else {
      setError(result.message || 'დანიშნულებების ჩატვირთვა ვერ მოხერხდა');
      setPrescriptions([]);
      setExpandedIds(new Set());
    }
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadPrescriptions();
    }, [loadPrescriptions]),
  );

  const addLineToCart = async (
    productId: string,
    productName: string,
    quantity: number,
  ) => {
    setAddingId(productId);
    try {
      const product = await ProductService.getProductById(productId);
      if (!product) {
        Alert.alert('შეცდომა', 'პროდუქტი ვერ მოიძებნა');
        return;
      }
      const qty = quantity > 0 ? Math.min(quantity, 99) : 1;
      addToCart(
        {
          id: String(product.id),
          name: (product.genericName ?? '').trim() || product.name || productName,
          price: Number(product.price) || 0,
          image: product.thumbnail || '',
          packageSize: product.packSize,
          form: product.dosageForm,
          maxQuantity: product.stockQuantity ?? undefined,
        },
        qty,
      );
    } catch {
      Alert.alert('შეცდომა', 'კალათაში დამატება ვერ მოხერხდა');
    } finally {
      setAddingId(null);
    }
  };

  const addAllFromPrescription = async (row: MyPrescriptionRow) => {
    if (!row.items?.length || addingPrescriptionId) return;

    const toAdd = row.items
      .map((item, index) => ({ item, index }))
      .filter(({ item, index }) => {
        const pid = item.productId?.trim();
        if (!pid) return false;
        return !declinedKeys.has(itemKey(row.id, pid, index));
      });

    if (toAdd.length === 0) {
      Alert.alert('კალათა', 'დასამატებელი პოზიცია არ არის');
      return;
    }

    setAddingPrescriptionId(row.id);
    let ok = 0;
    let fail = 0;
    try {
      for (const { item } of toAdd) {
        const pid = item.productId!.trim();
        try {
          const product = await ProductService.getProductById(pid);
          if (!product) {
            fail++;
            continue;
          }
          const qty = item.quantity > 0 ? Math.min(item.quantity, 99) : 1;
          addToCart(
            {
              id: String(product.id),
              name: (product.genericName ?? '').trim() || product.name || item.productName,
              price: Number(product.price) || 0,
              image: product.thumbnail || '',
              packageSize: product.packSize,
              form: product.dosageForm,
              maxQuantity: product.stockQuantity ?? undefined,
            },
            qty,
            true,
          );
          ok++;
        } catch {
          fail++;
        }
      }
      if (ok === 0) {
        Alert.alert('შეცდომა', 'კალათაში დამატება ვერ მოხერხდა');
      } else if (fail > 0) {
        Alert.alert('დასრულდა', `${ok} დამატებულია, ${fail} ვერ მოხერხდა`, [
          { text: 'კალათა', onPress: () => onNavigateToCart?.() },
        ]);
      } else {
        onNavigateToCart?.();
      }
    } finally {
      setAddingPrescriptionId(null);
    }
  };

  const totalItems = prescriptions.reduce(
    (sum, row) => sum + (row.items?.length ?? 0),
    0,
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.headerSide} onPress={onBack}>
          <Ionicons name="chevron-back" size={22} color={C.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>ექიმის დანიშნულება</Text>
          <Text style={styles.headerSub}>ექიმის მიერ დანიშნული წამლები</Text>
        </View>
        <View style={styles.headerSide} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <Ionicons name="medkit-outline" size={28} color={C.navy} />
          </View>
          <Text style={styles.heroText}>
            აქ ჩანს ექიმის მიერ თქვენთვის დაფიქსირებული წამლები. დაამატეთ კალათაში ან გახსენით
            პროდუქტის გვერდი.
          </Text>
        </View>

        {loading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color={C.purple} />
            <Text style={styles.centerText}>იტვირთება...</Text>
          </View>
        ) : error ? (
          <View style={styles.centerBox}>
            <Ionicons name="alert-circle-outline" size={40} color={C.muted} />
            <Text style={styles.centerText}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={loadPrescriptions}>
              <Text style={styles.retryBtnText}>თავიდან</Text>
            </TouchableOpacity>
          </View>
        ) : prescriptions.length === 0 ? (
          <View style={styles.centerBox}>
            <Ionicons name="document-text-outline" size={44} color={C.muted} />
            <Text style={styles.emptyTitle}>დანიშნულება ჯერ არ გაქვთ</Text>
            <Text style={styles.centerText}>
              როცა ექიმი დაგინიშნავთ წამლებს, ისინი აქ გამოჩნდება.
            </Text>
          </View>
        ) : (
          <>
            <Text style={styles.summary}>
              {prescriptions.length} დანიშნულება · {totalItems} პოზიცია
            </Text>
            {prescriptions.map((row) => {
              const isExpanded = expandedIds.has(row.id);
              return (
              <View key={row.id} style={styles.prescriptionCard}>
                <View style={styles.prescriptionHeader}>
                  <TouchableOpacity
                    style={styles.prescriptionHeaderToggle}
                    onPress={() => toggleExpanded(row.id)}
                    activeOpacity={0.85}
                    accessibilityRole="button"
                    accessibilityState={{ expanded: isExpanded }}
                  >
                    <Ionicons
                      name={isExpanded ? 'chevron-up' : 'chevron-down'}
                      size={20}
                      color={C.navy}
                      style={styles.prescriptionChevron}
                    />
                    <View style={styles.prescriptionHeaderMain}>
                      <Text style={styles.prescriptionDate}>
                        {formatPrescriptionDate(row.createdAt)}
                      </Text>
                      <Text style={styles.prescriptionDoctor}>
                        ექიმი: {formatPrescriberLabel(row)}
                      </Text>
                      <Text style={styles.prescriptionMeta}>
                        {row.items?.length ?? 0} წამალი
                      </Text>
                    </View>
                  </TouchableOpacity>
                  {isExpanded ? (
                    <TouchableOpacity
                      style={styles.addAllBtn}
                      onPress={() => void addAllFromPrescription(row)}
                      disabled={addingPrescriptionId === row.id}
                      activeOpacity={0.85}
                    >
                      {addingPrescriptionId === row.id ? (
                        <ActivityIndicator size="small" color={C.purple} />
                      ) : (
                        <Ionicons name="cart-outline" size={16} color={C.purple} />
                      )}
                      <Text style={styles.addAllBtnText}>კალათაში დამატება</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>

                {isExpanded
                  ? (row.items ?? []).map((item, index) => {
                  const pid = item.productId?.trim();
                  const key = itemKey(row.id, pid ?? '', index);
                  const isAdding = addingId === pid;
                  const isDeclined = declinedKeys.has(key);
                  return (
                    <View
                      key={`${row.id}-${pid}-${index}`}
                      style={[
                        styles.itemRow,
                        index < (row.items?.length ?? 0) - 1 && styles.itemRowBorder,
                        isDeclined && styles.itemRowDeclined,
                      ]}
                    >
                      <TouchableOpacity
                        style={styles.itemMain}
                        onPress={() => pid && onProductPress(pid)}
                        activeOpacity={0.8}
                        disabled={!pid}
                      >
                        <Text
                          style={[styles.itemName, isDeclined && styles.itemNameDeclined]}
                          numberOfLines={2}
                        >
                          {item.productName || 'პროდუქტი'}
                        </Text>
                        <Text style={[styles.itemQty, isDeclined && styles.itemQtyDeclined]}>
                          რაოდენობა: {item.quantity || 1}
                        </Text>
                        {isDeclined ? (
                          <Text style={styles.declinedLabel}>არ ვიყიდი</Text>
                        ) : null}
                        {item.notes ? (
                          <Text style={styles.itemNotes} numberOfLines={2}>
                            {item.notes}
                          </Text>
                        ) : null}
                      </TouchableOpacity>
                      <View style={styles.itemActions}>
                        <TouchableOpacity
                          style={[
                            styles.itemActionBtn,
                            isDeclined && styles.itemDeclineBtnActive,
                          ]}
                          onPress={() => toggleDeclined(key)}
                          activeOpacity={0.85}
                          accessibilityLabel={isDeclined ? 'ყიდვის აღდგენა' : 'არ ვიყიდი'}
                        >
                          <Ionicons
                            name={isDeclined ? 'remove-circle' : 'remove-circle-outline'}
                            size={26}
                            color={isDeclined ? '#EF4444' : C.muted}
                          />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.itemActionBtn}
                          onPress={() =>
                            pid &&
                            void addLineToCart(pid, item.productName, item.quantity)
                          }
                          disabled={!pid || isAdding || isDeclined}
                          activeOpacity={0.85}
                          accessibilityLabel="კალათაში დამატება"
                        >
                          {isAdding ? (
                            <ActivityIndicator size="small" color={C.purple} />
                          ) : (
                            <Ionicons
                              name="add-circle-outline"
                              size={26}
                              color={isDeclined ? C.border : C.purple}
                            />
                          )}
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })
                  : null}
              </View>
            );
            })}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  headerSide: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: C.text,
  },
  headerSub: {
    fontSize: 12,
    color: C.muted,
    marginTop: 2,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  hero: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: C.lavender,
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
  },
  heroIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: C.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    color: C.navy,
  },
  summary: {
    fontSize: 13,
    fontWeight: '500',
    color: C.muted,
    marginBottom: 12,
  },
  prescriptionCard: {
    backgroundColor: C.bg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 12,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#2A3A7A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
      },
      android: { elevation: 1 },
    }),
  },
  prescriptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: C.lavender,
    gap: 8,
  },
  prescriptionHeaderMain: {
    flex: 1,
    minWidth: 0,
  },
  prescriptionHeaderToggle: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 0,
  },
  prescriptionChevron: {
    marginRight: 6,
  },
  prescriptionDate: {
    fontSize: 14,
    fontWeight: '600',
    color: C.navy,
  },
  prescriptionDoctor: {
    fontSize: 12,
    fontWeight: '500',
    color: C.navy,
    marginTop: 3,
    opacity: 0.85,
  },
  prescriptionMeta: {
    fontSize: 12,
    color: C.muted,
    marginTop: 2,
  },
  addAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: C.bg,
    maxWidth: '52%',
  },
  addAllBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: C.purple,
    flexShrink: 1,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  itemRowDeclined: {
    backgroundColor: '#FAFAFA',
    opacity: 0.92,
  },
  itemRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  itemMain: {
    flex: 1,
    marginRight: 8,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '500',
    color: C.text,
    marginBottom: 2,
  },
  itemNameDeclined: {
    color: C.muted,
    textDecorationLine: 'line-through',
  },
  itemQty: {
    fontSize: 12,
    color: C.purple,
    fontWeight: '500',
  },
  itemQtyDeclined: {
    color: C.muted,
  },
  declinedLabel: {
    marginTop: 4,
    fontSize: 11,
    fontWeight: '600',
    color: '#EF4444',
  },
  itemNotes: {
    fontSize: 12,
    color: C.muted,
    marginTop: 4,
  },
  itemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  itemActionBtn: {
    width: 36,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemDeclineBtnActive: {
    opacity: 1,
  },
  centerBox: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
    gap: 10,
  },
  centerText: {
    fontSize: 14,
    color: C.muted,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: C.text,
  },
  retryBtn: {
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: C.lavender,
  },
  retryBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: C.purple,
  },
});
