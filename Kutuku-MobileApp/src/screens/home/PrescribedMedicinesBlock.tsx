import { ProductService } from '@/src/services/product.service';
import {
  PrescriptionsApi,
  type MyPrescriptionRow,
} from '@/src/services/prescriptions.service';
import { theme } from '@/src/theme';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useCart } from '@/src/contexts';

type PrescribedChip = { productId: string; productName: string; quantity: number };

function mergePrescribedItems(rows: MyPrescriptionRow[]): PrescribedChip[] {
  const seen = new Set<string>();
  const out: PrescribedChip[] = [];
  for (const row of rows) {
    for (const it of row.items ?? []) {
      const pid = (it.productId ?? '').trim();
      if (!pid || seen.has(pid)) continue;
      seen.add(pid);
      out.push({
        productId: pid,
        productName: (it.productName ?? '').trim() || 'პროდუქტი',
        quantity: Number(it.quantity) || 0,
      });
    }
  }
  return out;
}

type Props = {
  onProductPress: (productId: string) => void;
};

export function PrescribedMedicinesBlock({ onProductPress }: Props) {
  const { addToCart } = useCart();
  const [prescribedItems, setPrescribedItems] = useState<PrescribedChip[]>([]);
  const [prescribedLoading, setPrescribedLoading] = useState(false);
  const [prescribedAuthed, setPrescribedAuthed] = useState(false);
  const [prescribedAuthIssue, setPrescribedAuthIssue] = useState<
    'none' | 'no_token' | 'unauthorized' | 'network' | 'unknown'
  >('none');
  const [prescribedModalVisible, setPrescribedModalVisible] = useState(false);
  const [prescribedSelectedIds, setPrescribedSelectedIds] = useState<Set<string>>(
    () => new Set()
  );
  const [prescribedBulkAdding, setPrescribedBulkAdding] = useState(false);

  const addPrescribedToCartAsync = useCallback(
    async (it: PrescribedChip): Promise<boolean> => {
      try {
        const p = await ProductService.getProductById(it.productId);
        if (!p) return false;
        const displayName = (p.genericName ?? '').trim() || p.name;
        const qty = it.quantity > 0 ? Math.min(it.quantity, 99) : 1;
        addToCart(
          {
            id: String(p.id),
            name: displayName,
            price: Number(p.price) || 0,
            image: p.thumbnail || '',
            packageSize: p.packSize,
            form: p.dosageForm,
            maxQuantity: p.stockQuantity ?? undefined,
          },
          qty
        );
        return true;
      } catch {
        return false;
      }
    },
    [addToCart]
  );

  const closePrescribedModal = useCallback(() => setPrescribedModalVisible(false), []);

  const openPrescribedModal = useCallback(() => {
    if (prescribedLoading) return;
    setPrescribedModalVisible(true);
    if (prescribedAuthed && prescribedItems.length > 0) {
      setPrescribedSelectedIds(new Set(prescribedItems.map((i) => i.productId)));
    } else {
      setPrescribedSelectedIds(new Set());
    }
  }, [prescribedLoading, prescribedAuthed, prescribedItems]);

  const togglePrescribedSelection = useCallback((productId: string) => {
    setPrescribedSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) next.delete(productId);
      else next.add(productId);
      return next;
    });
  }, []);

  const selectAllPrescribed = useCallback(() => {
    setPrescribedSelectedIds(new Set(prescribedItems.map((i) => i.productId)));
  }, [prescribedItems]);

  const selectNonePrescribed = useCallback(() => setPrescribedSelectedIds(new Set()), []);

  const addSelectedPrescribedToCart = useCallback(async () => {
    const ids = Array.from(prescribedSelectedIds);
    if (ids.length === 0) {
      Alert.alert('არჩევა', 'მონიშნეთ მინიმუმ ერთი წამალი.');
      return;
    }
    setPrescribedBulkAdding(true);
    let ok = 0;
    let fail = 0;
    try {
      for (const productId of ids) {
        const it = prescribedItems.find((x) => x.productId === productId);
        if (!it) continue;
        const success = await addPrescribedToCartAsync(it);
        if (success) ok++;
        else fail++;
      }
      if (fail === 0) {
        Alert.alert(
          'კალათა',
          ok === 1 ? 'დამატებულია კალათაში.' : `${ok} პოზიცია დამატებულია კალათაში.`
        );
        closePrescribedModal();
      } else {
        Alert.alert(
          'დასრულდა',
          ok > 0
            ? `${ok} დამატებულია, ${fail} ვერ მოხერხდა.`
            : 'კალათაში დამატება ვერ მოხერხდა.'
        );
      }
    } finally {
      setPrescribedBulkAdding(false);
    }
  }, [
    prescribedSelectedIds,
    prescribedItems,
    addPrescribedToCartAsync,
    closePrescribedModal,
  ]);

  const loadPrescribedMedicines = useCallback(async () => {
    setPrescribedLoading(true);
    try {
      const r = await PrescriptionsApi.getMyPrescriptions();
      if (r.ok) {
        setPrescribedAuthed(true);
        setPrescribedAuthIssue('none');
        setPrescribedItems(mergePrescribedItems(r.prescriptions));
        return;
      }
      if (r.error === 'no_token') {
        setPrescribedAuthed(false);
        setPrescribedAuthIssue('no_token');
        setPrescribedItems([]);
        return;
      }
      if (r.error === 'unauthorized') {
        setPrescribedAuthed(false);
        setPrescribedAuthIssue('unauthorized');
        setPrescribedItems([]);
        return;
      }
      if (r.error === 'network') {
        setPrescribedAuthed(true);
        setPrescribedAuthIssue('network');
        setPrescribedItems([]);
        return;
      }
      setPrescribedAuthed(true);
      setPrescribedAuthIssue('unknown');
      setPrescribedItems([]);
    } finally {
      setPrescribedLoading(false);
    }
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      void loadPrescribedMedicines();
    }, [loadPrescribedMedicines])
  );

  return (
    <>
      <View style={styles.prescribedSection} testID="home-prescribed-medicines">
        <View style={styles.prescribedHeader}>
          <Ionicons name="medkit-outline" size={20} color={theme.colors.primary} />
          <Text style={styles.prescribedTitle}>ექიმის დანიშნული წამლები</Text>
        </View>
        <TouchableOpacity
          onPress={openPrescribedModal}
          activeOpacity={0.75}
          disabled={prescribedLoading}
          style={styles.prescribedTapArea}
        >
          {prescribedLoading ? (
            <View style={styles.prescribedLoadingRow}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
              <Text style={styles.prescribedHint}>იტვირთება...</Text>
            </View>
          ) : !prescribedAuthed ? (
            <View style={styles.prescribedTapRow}>
              <Text style={styles.prescribedHint}>
                {prescribedAuthIssue === 'unauthorized'
                  ? 'სესია ვადაგასულია ან სერვერმა უარი თქვა წვდომაზე. გახვიდით და თავიდან შედით ანგარიშზე.'
                  : 'შედით ანგარიშზე — დააჭირეთ სრული ინფორმაციისთვის.'}
              </Text>
              <Ionicons name="chevron-forward" size={20} color={theme.colors.text.secondary} />
            </View>
          ) : prescribedItems.length === 0 ? (
            <View style={styles.prescribedTapRow}>
              <Text style={styles.prescribedHint}>
                {prescribedAuthIssue === 'network'
                  ? 'დანიშნულებები ვერ ჩაიტვირთა (ქსელი ან სერვერი მიუწვდომელია). სცადეთ ცოტა ხანში.'
                  : prescribedAuthIssue === 'unknown'
                    ? 'დანიშნულებები ვერ ჩაიტვირთა. სცადეთ მოგვიანებით.'
                    : 'დანიშნულებები ჯერ არ გაქვთ. დააჭირეთ დეტალებისთვის.'}
              </Text>
              <Ionicons name="chevron-forward" size={20} color={theme.colors.text.secondary} />
            </View>
          ) : (
            <View style={styles.prescribedTapRow}>
              <View style={styles.prescribedTapTextBlock}>
                <Text style={styles.prescribedSummaryLine}>
                  დანიშნული წამლები — {prescribedItems.length} პოზიცია
                </Text>
                <Text style={styles.prescribedHintMuted}>
                  დააჭირეთ სიის ნახვას, არჩევას და კალათაში დასამატებლად.
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={22} color={theme.colors.primary} />
            </View>
          )}
        </TouchableOpacity>
      </View>

      <Modal
        visible={prescribedModalVisible}
        animationType="slide"
        transparent
        onRequestClose={closePrescribedModal}
        testID="home-prescribed-modal"
      >
        <View style={styles.prescribedModalRoot}>
          <Pressable style={styles.prescribedModalBackdrop} onPress={closePrescribedModal} />
          <View style={styles.prescribedModalSheet}>
            <View style={styles.prescribedModalGrab} />
            <View style={styles.prescribedModalHeader}>
              <Text style={styles.prescribedModalTitle}>ექიმის დანიშნულები</Text>
              <TouchableOpacity
                onPress={closePrescribedModal}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                accessibilityLabel="დახურვა"
              >
                <Ionicons name="close" size={26} color={theme.colors.text.primary} />
              </TouchableOpacity>
            </View>
            {!prescribedAuthed ? (
              <View style={styles.prescribedModalBody}>
                <Ionicons
                  name={prescribedAuthIssue === 'unauthorized' ? 'time-outline' : 'lock-closed-outline'}
                  size={48}
                  color={theme.colors.primary}
                  style={styles.prescribedModalLockIcon}
                />
                <Text style={styles.prescribedModalInfoText}>
                  {prescribedAuthIssue === 'unauthorized'
                    ? 'თქვენი სესია სერვერისთვის აღარ არის მოქმედი (JWT ვადა ან უარყოფილი ტოკენი). გახვიდით პროფილიდან და თავიდან შედით — ამის შემდეგ დანიშნულებები ისევ ჩაიტვირთება.'
                    : 'შედით ანგარიშზე — აქ გამოჩნდება ექიმის მიერ დანიშნული მედიკამენტების სია და შეძლებთ აირჩიოთ რისი ყიდვა გსურთ.'}
                </Text>
              </View>
            ) : prescribedItems.length === 0 ? (
              <View style={styles.prescribedModalBody}>
                <Text style={styles.prescribedModalInfoText}>
                  {prescribedAuthIssue === 'network'
                    ? 'ქსელის შეცდომა ან სერვერი დროებით მიუწვდომელია. დახურეთ ფანჯარა და სცადეთ მთავარი გვერდის ხელახლა გახსნა.'
                    : prescribedAuthIssue === 'unknown'
                      ? 'სერვერზე მოულოდნელი პასუხი მოვიდა. სცადეთ მოგვიანებით.'
                      : 'ამჟამად დანიშნული წამლების სია ცარიელია.'}
                </Text>
              </View>
            ) : (
              <>
                <View style={styles.prescribedModalToolbar}>
                  <TouchableOpacity onPress={selectAllPrescribed} hitSlop={8}>
                    <Text style={styles.prescribedModalToolbarLink}>ყველა</Text>
                  </TouchableOpacity>
                  <Text style={styles.prescribedModalToolbarSep}>·</Text>
                  <TouchableOpacity onPress={selectNonePrescribed} hitSlop={8}>
                    <Text style={styles.prescribedModalToolbarLink}>არცერთი</Text>
                  </TouchableOpacity>
                </View>
                <ScrollView
                  style={styles.prescribedModalList}
                  contentContainerStyle={styles.prescribedModalListContent}
                  showsVerticalScrollIndicator={false}
                >
                  {prescribedItems.map((it) => {
                    const checked = prescribedSelectedIds.has(it.productId);
                    return (
                      <TouchableOpacity
                        key={it.productId}
                        style={styles.prescribedModalRow}
                        onPress={() => togglePrescribedSelection(it.productId)}
                        activeOpacity={0.75}
                      >
                        <Ionicons
                          name={checked ? 'checkbox' : 'square-outline'}
                          size={26}
                          color={theme.colors.primary}
                        />
                        <View style={styles.prescribedModalRowText}>
                          <Text style={styles.prescribedModalRowName} numberOfLines={3}>
                            {it.productName}
                          </Text>
                          {it.quantity > 0 ? (
                            <Text style={styles.prescribedModalRowQty}>
                              ექიმის რეკომენდაცია: ×{it.quantity}
                            </Text>
                          ) : (
                            <Text style={styles.prescribedModalRowQty}>
                              რაოდენობა კალათაში: 1
                            </Text>
                          )}
                        </View>
                        <TouchableOpacity
                          style={styles.prescribedModalRowDetails}
                          onPress={() => {
                            closePrescribedModal();
                            onProductPress(it.productId);
                          }}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Ionicons
                            name="information-circle-outline"
                            size={26}
                            color={theme.colors.text.secondary}
                          />
                        </TouchableOpacity>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
                <View style={styles.prescribedModalFooter}>
                  <TouchableOpacity
                    style={[
                      styles.prescribedModalPrimaryBtn,
                      (prescribedSelectedIds.size === 0 || prescribedBulkAdding) &&
                        styles.prescribedModalPrimaryBtnDisabled,
                    ]}
                    disabled={prescribedSelectedIds.size === 0 || prescribedBulkAdding}
                    onPress={() => void addSelectedPrescribedToCart()}
                    activeOpacity={0.85}
                  >
                    {prescribedBulkAdding ? (
                      <ActivityIndicator color={theme.colors.white} />
                    ) : (
                      <Text style={styles.prescribedModalPrimaryBtnText}>
                        არჩეულების კალათაში ({prescribedSelectedIds.size})
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  prescribedSection: {
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.sm,
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.lg,
  },
  prescribedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  prescribedTitle: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  prescribedTapArea: { paddingVertical: 4 },
  prescribedTapRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  prescribedTapTextBlock: { flex: 1, minWidth: 0 },
  prescribedSummaryLine: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  prescribedHintMuted: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    lineHeight: 17,
  },
  prescribedHint: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    lineHeight: 20,
    flex: 1,
  },
  prescribedLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  prescribedModalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  prescribedModalBackdrop: { ...StyleSheet.absoluteFillObject },
  prescribedModalSheet: {
    backgroundColor: theme.colors.white,
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    maxHeight: '88%',
    paddingBottom: theme.spacing.lg,
    ...theme.shadows.md,
  },
  prescribedModalGrab: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.gray[300],
    marginTop: 10,
    marginBottom: 6,
  },
  prescribedModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.gray[200],
  },
  prescribedModalTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    flex: 1,
    paddingRight: 8,
  },
  prescribedModalBody: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.xl,
  },
  prescribedModalLockIcon: {
    alignSelf: 'center',
    marginBottom: theme.spacing.md,
  },
  prescribedModalInfoText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.secondary,
    lineHeight: 22,
    textAlign: 'center',
  },
  prescribedModalToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: theme.spacing.sm,
  },
  prescribedModalToolbarLink: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.primary,
  },
  prescribedModalToolbarSep: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.gray[400],
  },
  prescribedModalList: { maxHeight: 360 },
  prescribedModalListContent: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
  },
  prescribedModalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.gray[200],
  },
  prescribedModalRowText: { flex: 1, minWidth: 0 },
  prescribedModalRowName: {
    fontSize: 15,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    lineHeight: 21,
  },
  prescribedModalRowQty: {
    marginTop: 4,
    fontSize: 13,
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  prescribedModalRowDetails: { padding: 4 },
  prescribedModalFooter: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
  },
  prescribedModalPrimaryBtn: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.lg,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  prescribedModalPrimaryBtnDisabled: { opacity: 0.45 },
  prescribedModalPrimaryBtnText: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.white,
  },
});
