import { getOrderStatusColor, getOrderStatusText, type OrderStatusUi } from '@/src/data/mockOrders';
import { OrdersService, type MyOrderListItem } from '@/src/services/orders.service';
import { theme } from '@/src/theme';
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

type OrderTrackingScreenProps = {
  orderId: string;
  onBack: () => void;
};

const STATUS_FLOW: Exclude<OrderStatusUi, 'cancelled' | 'processing'>[] = [
  'pending',
  'confirmed',
  'shipped',
  'delivered',
];

const POST_PAYMENT_FLOW: Exclude<OrderStatusUi, 'pending' | 'cancelled' | 'processing'>[] = [
  'confirmed',
  'shipped',
  'delivered',
];

const STEP_META: Record<
  (typeof STATUS_FLOW)[number],
  { title: string; subtitle: string; icon: keyof typeof Ionicons.glyphMap }
> = {
  pending: {
    title: 'მიღებულია',
    subtitle: 'შეკვეთა სისტემაშია',
    icon: 'receipt-outline',
  },
  confirmed: {
    title: 'დადასტურებულია',
    subtitle: 'მზადდება გაგზავნისთვის',
    icon: 'checkmark-circle-outline',
  },
  shipped: {
    title: 'გზაშია',
    subtitle: 'მიტანის პროცესში',
    icon: 'car-outline',
  },
  delivered: {
    title: 'მიტანილია',
    subtitle: 'შეკვეთა დასრულებულია',
    icon: 'checkmark-done-outline',
  },
};

type TimelineStep = {
  key: string;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  completed: boolean;
  active: boolean;
  muted: boolean;
  /** ონლაინ გადახდის მოლოდინი — ნარინჯისფერი აქტიური ეტაპი */
  tone?: 'warning';
};

const BADGE_AWAITING_PAYMENT = '#E65100';

function buildTimeline(
  status: OrderStatusUi,
  opts?: { awaitingOnlinePayment?: boolean },
): TimelineStep[] {
  const current = status === 'processing' ? 'confirmed' : status;
  if (current === 'cancelled') {
    return [
      {
        key: 'cancelled',
        title: 'გაუქმებულია',
        subtitle: 'ეს შეკვეთა გაუქმდა',
        icon: 'close-circle-outline',
        completed: true,
        active: true,
        muted: false,
      },
    ];
  }

  if (opts?.awaitingOnlinePayment && current === 'pending') {
    return [
      {
        key: 'await_bank_payment',
        title: 'ონლაინ გადახდა',
        subtitle:
          'შეკვეთა დადასტურდება მხოლოდ წარმატებული გადახდის შემდეგ. გადახდა შეგიძლიათ „გადახდის“ ან „ჩემი შეკვეთების“ გვერდიდან.',
        icon: 'card-outline',
        completed: false,
        active: true,
        muted: false,
        tone: 'warning',
      },
      ...POST_PAYMENT_FLOW.map((s) => ({
        key: s,
        ...STEP_META[s],
        completed: false,
        active: false,
        muted: true,
      })),
    ];
  }

  const flowIdx = STATUS_FLOW.indexOf(current as (typeof STATUS_FLOW)[number]);
  const idx = flowIdx >= 0 ? flowIdx : 0;

  return STATUS_FLOW.map((st, i) => ({
    key: st,
    ...STEP_META[st],
    completed: i <= idx,
    active: i === idx,
    muted: i > idx,
  }));
}

export function OrderTrackingScreen({ orderId, onBack }: OrderTrackingScreenProps) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  type OrderDetail = MyOrderListItem & { shippingAddress?: string; phoneNumber?: string };
  const [order, setOrder] = useState<OrderDetail | null>(null);

  const load = useCallback(
    async (isRefresh: boolean) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);
      const res = await OrdersService.fetchOrderById(orderId);
      if (!res.ok) {
        if (res.error === 'auth') {
          setError('შეკვეთის სანახავად შედით ანგარიშში');
        } else if (res.error === 'not_found') {
          setError('შეკვეთა არ მოიძებნა');
        } else {
          setError(res.message || 'ჩატვირთვა ვერ მოხერხდა');
        }
        setOrder(null);
      } else {
        setOrder(res.order);
      }
      if (isRefresh) setRefreshing(false);
      else setLoading(false);
    },
    [orderId],
  );

  useEffect(() => {
    load(false);
  }, [load]);

  const steps = useMemo(() => {
    if (!order) return [];
    return buildTimeline(order.status, {
      awaitingOnlinePayment: order.awaitingOnlinePayment,
    });
  }, [order]);

  const badgeLabel = order?.awaitingOnlinePayment
    ? 'გადახდა მელოდება'
    : order
      ? getOrderStatusText(order.status)
      : '';
  const badgeColor = order?.awaitingOnlinePayment
    ? BADGE_AWAITING_PAYMENT
    : order
      ? getOrderStatusColor(order.status)
      : '#757575';

  if (loading && !order) {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.topBar}>
          <TouchableOpacity onPress={onBack} style={styles.iconBtn}>
            <Ionicons name="chevron-back" size={24} color={theme.colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.topTitle}>შეკვეთის სტატუსი</Text>
          <View style={styles.iconBtn} />
        </View>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.muted}>იტვირთება...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && !order) {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.topBar}>
          <TouchableOpacity onPress={onBack} style={styles.iconBtn}>
            <Ionicons name="chevron-back" size={24} color={theme.colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.topTitle}>შეკვეთის სტატუსი</Text>
          <View style={styles.iconBtn} />
        </View>
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={56} color={theme.colors.gray[400]} />
          <Text style={styles.errText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => load(false)}>
            <Text style={styles.retryBtnText}>ხელახლა ცდა</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.topBar}>
        <TouchableOpacity onPress={onBack} style={styles.iconBtn}>
          <Ionicons name="chevron-back" size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.topTitle}>შეკვეთის სტატუსი</Text>
        <View style={styles.iconBtn} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />
        }
      >
        {order ? (
          <>
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.orderNo}>{order.orderNumber}</Text>
                <View
                  style={[
                    styles.badge,
                    { backgroundColor: badgeColor + '22' },
                  ]}
                >
                  <Text style={[styles.badgeText, { color: badgeColor }]}>
                    {badgeLabel}
                  </Text>
                </View>
              </View>
              <Text style={styles.dateText}>{order.date}</Text>
              <Text style={styles.totalLabel}>
                ჯამი: <Text style={styles.totalVal}>₾{order.total.toFixed(2)}</Text>
              </Text>
              {order.phoneNumber ? (
                <Text style={styles.meta}>ტელეფონი: {order.phoneNumber}</Text>
              ) : null}
              {order.shippingAddress ? (
                <Text style={styles.meta}>მისამართი: {order.shippingAddress}</Text>
              ) : null}
            </View>

            <Text style={styles.sectionTitle}>სტატუსები</Text>
            <View style={styles.card}>
              {steps.map((step, index) => (
                <View key={step.key} style={styles.stepRow}>
                  <View style={styles.stepIconCol}>
                    <View
                      style={[
                        styles.stepIcon,
                        step.tone === 'warning' && step.active && styles.stepIconWarning,
                        step.completed && step.tone !== 'warning' && styles.stepIconDone,
                        step.muted && styles.stepIconMuted,
                      ]}
                    >
                      <Ionicons
                        name={step.icon}
                        size={22}
                        color={
                          step.tone === 'warning' && step.active
                            ? theme.colors.white
                            : step.completed
                              ? theme.colors.white
                              : theme.colors.gray[400]
                        }
                      />
                    </View>
                    {index < steps.length - 1 ? (
                      <View
                        style={[
                          styles.stepLine,
                          step.tone === 'warning' && step.active && styles.stepLineWarning,
                          step.completed && step.tone !== 'warning' && styles.stepLineDone,
                        ]}
                      />
                    ) : null}
                  </View>
                  <View style={styles.stepBody}>
                    <Text
                      style={[
                        styles.stepTitle,
                        step.muted && styles.stepTitleMuted,
                      ]}
                    >
                      {step.title}
                    </Text>
                    <Text style={styles.stepSub}>{step.subtitle}</Text>
                  </View>
                </View>
              ))}
            </View>

            <Text style={styles.sectionTitle}>პოზიციები</Text>
            <View style={styles.card}>
              {order.items.map((it) => (
                <View key={it.id} style={styles.lineRow}>
                  <View style={styles.lineMain}>
                    <Text style={styles.lineName} numberOfLines={2}>
                      {it.name}
                    </Text>
                    <Text style={styles.lineQty}>× {it.quantity}</Text>
                  </View>
                  <Text style={styles.linePrice}>₾{it.lineTotal.toFixed(2)}</Text>
                </View>
              ))}
            </View>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.colors.gray[50],
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 8,
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray[100],
  },
  iconBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  muted: {
    marginTop: 12,
    color: theme.colors.text.secondary,
    fontSize: 14,
  },
  errText: {
    marginTop: 16,
    textAlign: 'center',
    color: theme.colors.text.secondary,
    fontSize: 15,
  },
  retryBtn: {
    marginTop: 20,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryBtnText: {
    color: theme.colors.white,
    fontWeight: '600',
    fontSize: 15,
  },
  card: {
    backgroundColor: theme.colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.gray[100],
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderNo: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  dateText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginBottom: 8,
  },
  totalLabel: {
    fontSize: 15,
    color: theme.colors.text.secondary,
  },
  totalVal: {
    fontWeight: '700',
    color: theme.colors.primary,
  },
  meta: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    marginTop: 6,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 10,
  },
  stepRow: {
    flexDirection: 'row',
    minHeight: 56,
  },
  stepIconCol: {
    alignItems: 'center',
    width: 44,
    marginRight: 12,
  },
  stepIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepIconDone: {
    backgroundColor: theme.colors.primary,
  },
  stepIconWarning: {
    backgroundColor: BADGE_AWAITING_PAYMENT,
  },
  stepIconMuted: {
    opacity: 0.5,
  },
  stepLine: {
    width: 3,
    flex: 1,
    minHeight: 16,
    backgroundColor: theme.colors.gray[200],
    marginVertical: 4,
    borderRadius: 2,
  },
  stepLineDone: {
    backgroundColor: theme.colors.primary,
    opacity: 0.35,
  },
  stepLineWarning: {
    backgroundColor: BADGE_AWAITING_PAYMENT,
    opacity: 0.4,
  },
  stepBody: {
    flex: 1,
    paddingTop: 8,
    paddingBottom: 16,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  stepTitleMuted: {
    color: theme.colors.text.secondary,
  },
  stepSub: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    marginTop: 4,
  },
  lineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray[50],
  },
  lineMain: {
    flex: 1,
    marginRight: 12,
  },
  lineName: {
    fontSize: 15,
    fontWeight: '500',
    color: theme.colors.text.primary,
  },
  lineQty: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    marginTop: 4,
  },
  linePrice: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
});
