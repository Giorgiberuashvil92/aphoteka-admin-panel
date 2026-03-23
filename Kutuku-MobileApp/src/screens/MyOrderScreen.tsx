import { BottomNavigation } from '@/src/components/common/BottomNavigation';
import { useCart, useFavorites } from '@/src/contexts';
import { getOrderStatusColor, getOrderStatusText } from '@/src/data/mockOrders';
import { OrdersService, type MyOrderListItem } from '@/src/services/orders.service';
import { theme } from '@/src/theme';
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

type MyOrderScreenProps = {
  onBack: () => void;
  onOrderPress: (orderId: string) => void;
  onHomePress: () => void;
  onWishlistPress: () => void;
  onCategoriesPress: () => void;
  onCartPress: () => void;
  onProfilePress: () => void;
  /** თუ API 401 / ტოკენი არ არის — შესვლის გვერდზე გადასვლა */
  onLoginPress?: () => void;
};

type FilterTab = 'all' | 'processing' | 'shipped' | 'delivered';

function matchesFilter(order: MyOrderListItem, tab: FilterTab): boolean {
  if (tab === 'all') return true;
  if (tab === 'processing') {
    return order.status === 'pending' || order.status === 'confirmed';
  }
  if (tab === 'shipped') return order.status === 'shipped';
  if (tab === 'delivered') return order.status === 'delivered';
  return true;
}

export function MyOrderScreen({
  onBack,
  onOrderPress,
  onHomePress,
  onWishlistPress,
  onCategoriesPress,
  onCartPress,
  onProfilePress,
  onLoginPress,
}: MyOrderScreenProps) {
  const { itemCount } = useCart();
  const { favoriteCount } = useFavorites();

  const [orders, setOrders] = useState<MyOrderListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<'auth' | 'network' | 'unknown' | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();

  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');

  const loadOrders = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setLoadError(null);
    setErrorMessage(undefined);

    const result = await OrdersService.fetchMyOrders();

    if (!result.ok) {
      if (!isRefresh) setOrders([]);
      setLoadError(result.error);
      setErrorMessage('message' in result ? result.message : undefined);
    } else {
      setOrders(result.orders);
      setLoadError(null);
    }

    if (isRefresh) setRefreshing(false);
    else setLoading(false);
  }, []);

  useEffect(() => {
    loadOrders(false);
  }, [loadOrders]);

  const filteredOrders =
    activeFilter === 'all' ? orders : orders.filter((o) => matchesFilter(o, activeFilter));

  const filterTabs: { key: FilterTab; label: string }[] = [
    { key: 'all', label: 'ყველა' },
    { key: 'processing', label: 'მუშავდება' },
    { key: 'shipped', label: 'გზაშია' },
    { key: 'delivered', label: 'მიტანილი' },
  ];

  const showAuthGate = loadError === 'auth' && !loading;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.white} />

      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>ჩემი შეკვეთები</Text>
        <View style={styles.backButton} />
      </View>

      <View style={styles.filterContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContent}
        >
          {filterTabs.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.filterTab, activeFilter === tab.key && styles.filterTabActive]}
              onPress={() => setActiveFilter(tab.key)}
            >
              <Text
                style={[
                  styles.filterTabText,
                  activeFilter === tab.key && styles.filterTabTextActive,
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading && orders.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>შეკვეთების ჩატვირთვა...</Text>
        </View>
      ) : showAuthGate ? (
        <View style={styles.centered}>
          <Ionicons name="lock-closed-outline" size={64} color={theme.colors.gray[300]} />
          <Text style={styles.emptyTitle}>შესვლა საჭიროა</Text>
          <Text style={styles.emptySubtitle}>
            თქვენი შეკვეთების სანახავად შედით ანგარიშში.
          </Text>
          {onLoginPress ? (
            <TouchableOpacity style={styles.browseButton} onPress={onLoginPress}>
              <Text style={styles.browseButtonText}>შესვლა</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ) : loadError && orders.length === 0 ? (
        <View style={styles.centered}>
          <Ionicons name="cloud-offline-outline" size={64} color={theme.colors.gray[300]} />
          <Text style={styles.emptyTitle}>ჩატვირთვა ვერ მოხერხდა</Text>
          <Text style={styles.emptySubtitle}>
            {loadError === 'network'
              ? 'შეამოწმეთ ინტერნეტი და სცადეთ ხელახლა.'
              : errorMessage || 'სერვერთან კავშირი ვერ დამყარდა.'}
          </Text>
          <TouchableOpacity style={styles.browseButton} onPress={() => loadOrders(false)}>
            <Text style={styles.browseButtonText}>ხელახლა ცდა</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadOrders(true)}
              colors={[theme.colors.primary]}
            />
          }
        >
          {filteredOrders.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="receipt-outline" size={80} color={theme.colors.gray[300]} />
              <Text style={styles.emptyTitle}>შეკვეთები არ მოიძებნა</Text>
              <Text style={styles.emptySubtitle}>
                {activeFilter === 'all'
                  ? 'თქვენ ჯერ არ გაქვთ შეკვეთები'
                  : `არ არის ${filterTabs.find((t) => t.key === activeFilter)?.label} შეკვეთები`}
              </Text>
              <TouchableOpacity style={styles.browseButton} onPress={onHomePress}>
                <Text style={styles.browseButtonText}>პროდუქტების დათვალიერება</Text>
              </TouchableOpacity>
            </View>
          ) : (
            filteredOrders.map((order) => (
              <View key={order.id} style={styles.orderCard}>
                <View style={styles.orderHeader}>
                  <View style={styles.orderHeaderLeft}>
                    <Text style={styles.orderNumber}>{order.orderNumber}</Text>
                    <Text style={styles.orderDate}>{order.date}</Text>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: getOrderStatusColor(order.status) + '15' },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        { color: getOrderStatusColor(order.status) },
                      ]}
                    >
                      {getOrderStatusText(order.status)}
                    </Text>
                  </View>
                </View>

                <View style={styles.orderItems}>
                  {order.items.slice(0, 2).map((item) => (
                    <View key={item.id} style={styles.orderItem}>
                      <Image
                        source={{ uri: item.image }}
                        style={styles.itemImage}
                        resizeMode="cover"
                      />
                      <View style={styles.itemInfo}>
                        <Text style={styles.itemName} numberOfLines={1}>
                          {item.name}
                        </Text>
                        <Text style={styles.itemQuantity}>რაოდენობა: {item.quantity}</Text>
                      </View>
                      <Text style={styles.itemPrice}>₾{item.lineTotal.toFixed(2)}</Text>
                    </View>
                  ))}
                  {order.items.length > 2 && (
                    <Text style={styles.moreItems}>
                      +{order.items.length - 2} სხვა პროდუქტი
                    </Text>
                  )}
                </View>

                <View style={styles.orderFooter}>
                  <View style={styles.orderTotal}>
                    <Text style={styles.totalLabel}>ჯამური თანხა:</Text>
                    <Text style={styles.totalValue}>₾{order.total.toFixed(2)}</Text>
                  </View>
                  {order.trackingNumber ? (
                    <View style={styles.trackingInfo}>
                      <Ionicons name="document-text-outline" size={16} color={theme.colors.primary} />
                      <Text style={styles.trackingNumber} numberOfLines={1}>
                        {order.trackingNumber}
                      </Text>
                    </View>
                  ) : null}
                </View>

                <View style={styles.orderActions}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.actionButtonPrimary]}
                    onPress={() => onOrderPress(order.id)}
                    activeOpacity={0.85}
                  >
                    <Text style={[styles.actionButtonText, styles.actionButtonTextPrimary]}>
                      სტატუსის ნახვა
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}

          <View style={{ height: 100 }} />
        </ScrollView>
      )}

      <BottomNavigation
        activeTab="home"
        onHomePress={onHomePress}
        onWishlistPress={onWishlistPress}
        onCategoriesPress={onCategoriesPress}
        onCartPress={onCartPress}
        onProfilePress={onProfilePress}
        wishlistCount={favoriteCount}
        cartCount={itemCount}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.gray[50],
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray[100],
  },
  backButton: {
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
  filterContainer: {
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray[100],
  },
  filterContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  filterTab: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: theme.colors.gray[50],
  },
  filterTabActive: {
    backgroundColor: theme.colors.primary,
  },
  filterTabText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    fontWeight: '500',
  },
  filterTabTextActive: {
    color: theme.colors.white,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginTop: 24,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  browseButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: theme.colors.primary,
  },
  browseButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.white,
  },
  orderCard: {
    backgroundColor: theme.colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray[100],
  },
  orderHeaderLeft: {
    flex: 1,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 13,
    color: theme.colors.text.secondary,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  orderItems: {
    marginBottom: 12,
  },
  orderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  itemImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: theme.colors.gray[50],
    marginRight: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  itemQuantity: {
    fontSize: 12,
    color: theme.colors.text.secondary,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  moreItems: {
    fontSize: 13,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  orderFooter: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.gray[100],
    marginBottom: 12,
  },
  orderTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  totalLabel: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  trackingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  trackingNumber: {
    fontSize: 12,
    color: theme.colors.primary,
    fontWeight: '500',
    flex: 1,
  },
  orderActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: theme.colors.gray[50],
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.gray[200],
  },
  actionButtonPrimary: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  actionButtonTextPrimary: {
    color: theme.colors.white,
  },
});
