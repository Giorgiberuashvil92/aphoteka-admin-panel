import { getOrderStatusColor, getOrderStatusText, type OrderStatusUi } from '@/src/data/mockOrders';
import { getApiBaseUrl } from '@/src/config/api.config';
import { OrdersService, type MyOrderListItem } from '@/src/services/orders.service';
import { theme } from '@/src/theme';
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { WebViewNavigation } from 'react-native-webview';
import { WebView } from 'react-native-webview';

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

function bogReturnFromDeepLink(url: string): 'paid' | 'failed' | null {
  const u = url.toLowerCase();
  if (u.includes('bogreturn=success') || u.includes('bog_return=success')) {
    return 'paid';
  }
  if (u.includes('bogreturn=fail') || u.includes('bog_return=fail')) {
    return 'failed';
  }
  return null;
}

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
          'შეკვეთა დადასტურდება მხოლოდ წარმატებული გადახდის შემდეგ. დააჭირეთ „გადახდა“ ქვემოთ.',
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
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  type OrderDetail = MyOrderListItem & { shippingAddress?: string; phoneNumber?: string };
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [payingRedispatch, setPayingRedispatch] = useState(false);
  const [payingOrder, setPayingOrder] = useState(false);
  const [bogCheckoutUrl, setBogCheckoutUrl] = useState<string | null>(null);
  const [bogPaymentKind, setBogPaymentKind] = useState<'order' | 'redispatch' | null>(
    null,
  );
  const [bogWebLoading, setBogWebLoading] = useState(false);
  const [bogVerifying, setBogVerifying] = useState(false);
  const bogFinalizeOnceRef = useRef(false);

  const closeBogModal = useCallback(() => {
    bogFinalizeOnceRef.current = true;
    setBogCheckoutUrl(null);
    setBogWebLoading(false);
    setBogPaymentKind(null);
  }, []);

  const finalizeOrderPaid = useCallback(async () => {
    if (bogFinalizeOnceRef.current) return;
    bogFinalizeOnceRef.current = true;
    setBogCheckoutUrl(null);
    setBogWebLoading(false);
    setBogPaymentKind(null);
    setBogVerifying(true);
    try {
      const r = await OrdersService.waitForOrderPaymentConfirmed(orderId);
      if (r === 'confirmed') {
        void OrdersService.ensureBalanceSalePosted(orderId);
        const res = await OrdersService.fetchOrderById(orderId);
        if (res.ok) setOrder(res.order);
        Alert.alert('გადახდა მიღებულია', 'შეკვეთა დადასტურდა და მალე დამუშავდება.');
      } else {
        Alert.alert(
          'გადახდა მუშავდება',
          'გადახდა მიღებულია, მაგრამ სტატუსის განახლებას რამდენიმე წამი დასჭირდება. განაახლეთ გვერდი.',
        );
      }
    } finally {
      setBogVerifying(false);
    }
  }, [orderId]);

  const finalizeOrderFailed = useCallback(() => {
    closeBogModal();
    Alert.alert(
      'გადახდა ვერ დასრულდა',
      'შეკვეთა მოლოდინშია. შეგიძლიათ ხელახლა სცადოთ „გადახდა“ ღილაკით.',
    );
  }, [closeBogModal]);

  const finalizeRedispatchPaid = useCallback(async () => {
    if (bogFinalizeOnceRef.current) return;
    bogFinalizeOnceRef.current = true;
    setBogCheckoutUrl(null);
    setBogWebLoading(false);
    setBogVerifying(true);
    try {
      void OrdersService.ensureDeliveryRedispatchPaid(orderId);
      const r = await OrdersService.waitForDeliveryRedispatchPaid(orderId);
      if (r === 'paid') {
        const res = await OrdersService.fetchOrderById(orderId);
        if (res.ok) setOrder(res.order);
        Alert.alert(
          'გადახდა მიღებულია',
          'ახალი მიტანის თანხა გადახდილია. შეკვეთა მალე გაიგზავნება ახალი საწყობიდან.',
        );
      } else {
        Alert.alert(
          'გადახდა მუშავდება',
          'გადახდა მიღებულია, მაგრამ სტატუსის განახლებას რამდენიმე წამი დასჭირდება. განაახლეთ გვერდი.',
        );
      }
    } finally {
      setBogVerifying(false);
    }
  }, [orderId]);

  const finalizeRedispatchFailed = useCallback(() => {
    closeBogModal();
    Alert.alert('გადახდა ვერ დასრულდა', 'სცადეთ ხელახლა ან დაუკავშირდით მხარდაჭერას.');
  }, [closeBogModal]);

  const handleBogUrlNavigation = useCallback(
    (rawUrl: string) => {
      const u = rawUrl.toLowerCase();
      const isOrderPay = bogPaymentKind === 'order';
      if (u.includes('/payments/bog/mobile-return/success')) {
        if (isOrderPay) void finalizeOrderPaid();
        else void finalizeRedispatchPaid();
        return true;
      }
      if (u.includes('/payments/bog/mobile-return/fail')) {
        if (isOrderPay) finalizeOrderFailed();
        else finalizeRedispatchFailed();
        return true;
      }
      if (u.startsWith('kutuku://') || u.startsWith('kutuku:')) {
        void Linking.openURL(rawUrl).catch(() => {});
        const br = bogReturnFromDeepLink(rawUrl);
        if (br === 'paid') {
          if (isOrderPay) void finalizeOrderPaid();
          else void finalizeRedispatchPaid();
        } else if (br === 'failed') {
          if (isOrderPay) finalizeOrderFailed();
          else finalizeRedispatchFailed();
        } else {
          closeBogModal();
        }
        return true;
      }
      return false;
    },
    [
      bogPaymentKind,
      closeBogModal,
      finalizeOrderFailed,
      finalizeOrderPaid,
      finalizeRedispatchFailed,
      finalizeRedispatchPaid,
    ],
  );

  const onBogWebNavChange = useCallback(
    (nav: WebViewNavigation) => {
      handleBogUrlNavigation(nav.url ?? '');
    },
    [handleBogUrlNavigation],
  );

  const onBogShouldStartLoad = useCallback(
    (req: { url: string }) => !handleBogUrlNavigation(req.url ?? ''),
    [handleBogUrlNavigation],
  );

  const handlePayRedispatch = useCallback(async () => {
    if (!order?.deliveryRedispatchPending) return;
    setPayingRedispatch(true);
    bogFinalizeOnceRef.current = false;
    try {
      const apiBase = getApiBaseUrl();
      const bogRedirects = apiBase.toLowerCase().startsWith('https://')
        ? {
            successRedirectUrl: `${apiBase}/payments/bog/mobile-return/success`,
            failRedirectUrl: `${apiBase}/payments/bog/mobile-return/fail`,
          }
        : undefined;
      const pay = await OrdersService.initBogDeliveryRedispatchPayment(
        orderId,
        bogRedirects,
      );
      if (!pay.ok) {
        Alert.alert('გადახდა ვერ დაიწყო', pay.message ?? 'სცადეთ ხელახლა');
        return;
      }
      setBogPaymentKind('redispatch');
      setBogWebLoading(true);
      setBogCheckoutUrl(pay.redirectUrl);
    } finally {
      setPayingRedispatch(false);
    }
  }, [order?.deliveryRedispatchPending, orderId]);

  const handlePayOrder = useCallback(async () => {
    if (!order?.awaitingOnlinePayment) return;
    setPayingOrder(true);
    bogFinalizeOnceRef.current = false;
    try {
      const apiBase = getApiBaseUrl();
      const bogRedirects = apiBase.toLowerCase().startsWith('https://')
        ? {
            successRedirectUrl: `${apiBase}/payments/bog/mobile-return/success`,
            failRedirectUrl: `${apiBase}/payments/bog/mobile-return/fail`,
          }
        : undefined;
      const pay = await OrdersService.initBogPayment(orderId, bogRedirects);
      if (!pay.ok) {
        Alert.alert('გადახდა ვერ დაიწყო', pay.message ?? 'სცადეთ ხელახლა');
        return;
      }
      setBogPaymentKind('order');
      setBogWebLoading(true);
      setBogCheckoutUrl(pay.redirectUrl);
    } finally {
      setPayingOrder(false);
    }
  }, [order?.awaitingOnlinePayment, orderId]);

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

  const badgeLabel = order?.deliveryRedispatchPending
    ? 'მიტანის გადახდა'
    : order?.awaitingOnlinePayment
      ? order.onlinePaymentFailed
        ? 'გადახდა ვერ მოხერხდა'
        : 'გადახდა მელოდება'
      : order
        ? getOrderStatusText(order.status)
        : '';
  const badgeColor = order?.deliveryRedispatchPending
    ? BADGE_AWAITING_PAYMENT
    : order?.awaitingOnlinePayment
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
      {bogVerifying ? (
        <View style={styles.bogVerifyOverlay} pointerEvents="auto">
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.bogVerifyText}>გადახდის დადასტურება...</Text>
        </View>
      ) : null}
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
            {order.awaitingOnlinePayment && !order.deliveryRedispatchPending ? (
              <View style={styles.redispatchBanner}>
                <View style={styles.redispatchBannerIcon}>
                  <Ionicons name="card-outline" size={22} color={BADGE_AWAITING_PAYMENT} />
                </View>
                <View style={styles.redispatchBannerBody}>
                  <Text style={styles.redispatchTitle}>
                    {order.onlinePaymentFailed
                      ? 'ონლაინ გადახდა ვერ მოხერხდა'
                      : 'ონლაინ გადახდა მელოდება'}
                  </Text>
                  <Text style={styles.redispatchSub}>
                    შეკვეთა დადასტურდება მხოლოდ წარმატებული გადახდის შემდეგ.
                  </Text>
                  <Text style={styles.redispatchAmount}>
                    გადასახდელი: ₾{order.total.toFixed(2)}
                  </Text>
                  <TouchableOpacity
                    style={styles.redispatchPayBtn}
                    onPress={() => void handlePayOrder()}
                    disabled={payingOrder}
                    activeOpacity={0.85}
                  >
                    {payingOrder ? (
                      <ActivityIndicator color={theme.colors.white} />
                    ) : (
                      <>
                        <Ionicons name="card-outline" size={18} color={theme.colors.white} />
                        <Text style={styles.redispatchPayBtnText}>
                          გადახდა · ₾{order.total.toFixed(2)}
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            ) : null}

            {order.deliveryRedispatchPending && order.deliveryRedispatch ? (
              <View style={styles.redispatchBanner}>
                <View style={styles.redispatchBannerIcon}>
                  <Ionicons name="location-outline" size={22} color={BADGE_AWAITING_PAYMENT} />
                </View>
                <View style={styles.redispatchBannerBody}>
                  <Text style={styles.redispatchTitle}>ახალი მიტანის გადახდა</Text>
                  <Text style={styles.redispatchSub}>
                    შეკვეთა გადაიგზავნება საწყობიდან:{' '}
                    {order.deliveryRedispatch.newWarehouseName || '—'}
                  </Text>
                  {order.deliveryRedispatch.newPickupAddress?.streetName ? (
                    <Text style={styles.redispatchMeta}>
                      {order.deliveryRedispatch.newPickupAddress.streetName}
                    </Text>
                  ) : null}
                  <Text style={styles.redispatchAmount}>
                    გადასახდელი: ₾{order.deliveryRedispatch.amountDue.toFixed(2)}
                  </Text>
                  <Text style={styles.redispatchHint}>
                    ძველი მიტანის თანხა არ ბრუნდება — იხდით მხოლოდ ახალ მიტანას.
                  </Text>
                  <TouchableOpacity
                    style={styles.redispatchPayBtn}
                    onPress={() => void handlePayRedispatch()}
                    disabled={payingRedispatch}
                    activeOpacity={0.85}
                  >
                    {payingRedispatch ? (
                      <ActivityIndicator color={theme.colors.white} />
                    ) : (
                      <>
                        <Ionicons name="card-outline" size={18} color={theme.colors.white} />
                        <Text style={styles.redispatchPayBtnText}>
                          გადახდა · ₾{order.deliveryRedispatch.amountDue.toFixed(2)}
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            ) : null}

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

      <Modal
        visible={!!bogCheckoutUrl}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeBogModal}
      >
        <View style={[styles.bogModalRoot, { paddingTop: insets.top }]}>
          <View style={styles.bogModalHeader}>
            <Text style={styles.bogModalTitle}>
              {bogPaymentKind === 'redispatch'
                ? 'მიტანის გადახდა — BOG'
                : 'ონლაინ გადახდა — BOG'}
            </Text>
            <TouchableOpacity
              onPress={closeBogModal}
              style={styles.bogModalCloseBtn}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Ionicons name="close" size={28} color={theme.colors.text.primary} />
            </TouchableOpacity>
          </View>
          {bogCheckoutUrl ? (
            <View style={styles.bogWebWrap}>
              {bogWebLoading ? (
                <View style={styles.bogWebLoading}>
                  <ActivityIndicator size="large" color={theme.colors.primary} />
                  <Text style={styles.bogWebLoadingText}>იტვირთება...</Text>
                </View>
              ) : null}
              <WebView
                source={{ uri: bogCheckoutUrl }}
                style={styles.bogWebView}
                onLoadStart={() => setBogWebLoading(true)}
                onLoadEnd={() => setBogWebLoading(false)}
                onNavigationStateChange={onBogWebNavChange}
                onShouldStartLoadWithRequest={onBogShouldStartLoad}
                javaScriptEnabled
                domStorageEnabled
                sharedCookiesEnabled
                originWhitelist={['https://*', 'http://*']}
              />
            </View>
          ) : null}
        </View>
      </Modal>
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
  redispatchBanner: {
    flexDirection: 'row',
    backgroundColor: '#FFF3E0',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FFCC80',
  },
  redispatchBannerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFE0B2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  redispatchBannerBody: {
    flex: 1,
  },
  redispatchTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#E65100',
    marginBottom: 4,
  },
  redispatchSub: {
    fontSize: 14,
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  redispatchMeta: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    marginBottom: 6,
  },
  redispatchAmount: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  redispatchHint: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    marginBottom: 12,
    lineHeight: 17,
  },
  redispatchPayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: BADGE_AWAITING_PAYMENT,
    paddingVertical: 12,
    borderRadius: 12,
  },
  redispatchPayBtnText: {
    color: theme.colors.white,
    fontWeight: '700',
    fontSize: 15,
  },
  bogVerifyOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.92)',
    zIndex: 20,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  bogVerifyText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  bogModalRoot: {
    flex: 1,
    backgroundColor: theme.colors.white,
  },
  bogModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray[100],
  },
  bogModalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  bogModalCloseBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bogWebWrap: {
    flex: 1,
  },
  bogWebView: {
    flex: 1,
  },
  bogWebLoading: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    zIndex: 2,
  },
  bogWebLoadingText: {
    marginTop: 12,
    color: theme.colors.text.secondary,
  },
});
