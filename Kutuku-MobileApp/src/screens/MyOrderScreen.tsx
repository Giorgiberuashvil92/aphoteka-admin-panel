import { BottomNavigation } from '@/src/components/common/BottomNavigation';
import { useCart, useFavorites } from '@/src/contexts';
import { MOCK_ORDERS, getOrderStatusColor, getOrderStatusText, type MockOrder } from '@/src/data/mockOrders';
import { theme } from '@/src/theme';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Image, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type MyOrderScreenProps = {
  onBack: () => void;
  onOrderPress: (orderId: string) => void;
  onHomePress: () => void;
  onWishlistPress: () => void;
  onCategoriesPress: () => void;
  onCartPress: () => void;
  onProfilePress: () => void;
};

type FilterTab = 'all' | 'pending' | 'processing' | 'shipped' | 'delivered';

export function MyOrderScreen({
  onBack,
  onOrderPress,
  onHomePress,
  onWishlistPress,
  onCategoriesPress,
  onCartPress,
  onProfilePress,
}: MyOrderScreenProps) {
  const { itemCount } = useCart();
  const { favoriteCount } = useFavorites();
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [orders] = useState<MockOrder[]>(MOCK_ORDERS);

  const filteredOrders = activeFilter === 'all' 
    ? orders 
    : orders.filter(order => order.status === activeFilter);

  const filterTabs: { key: FilterTab; label: string }[] = [
    { key: 'all', label: 'ყველა' },
    { key: 'processing', label: 'მუშავდება' },
    { key: 'shipped', label: 'გზაშია' },
    { key: 'delivered', label: 'მიტანილი' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.white} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>ჩემი შეკვეთები</Text>
        <View style={styles.backButton} />
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContent}
        >
          {filterTabs.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.filterTab,
                activeFilter === tab.key && styles.filterTabActive,
              ]}
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

      {/* Orders List */}
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {filteredOrders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={80} color={theme.colors.gray[300]} />
            <Text style={styles.emptyTitle}>შეკვეთები არ მოიძებნა</Text>
            <Text style={styles.emptySubtitle}>
              {activeFilter === 'all' 
                ? 'თქვენ ჯერ არ გაქვთ შეკვეთები'
                : `არ არის ${filterTabs.find(t => t.key === activeFilter)?.label} შეკვეთები`
              }
            </Text>
            <TouchableOpacity style={styles.browseButton} onPress={onHomePress}>
              <Text style={styles.browseButtonText}>პროდუქტების დათვალიერება</Text>
            </TouchableOpacity>
          </View>
        ) : (
          filteredOrders.map((order) => (
            <TouchableOpacity
              key={order.id}
              style={styles.orderCard}
              onPress={() => onOrderPress(order.id)}
            >
              {/* Order Header */}
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

              {/* Order Items */}
              <View style={styles.orderItems}>
                {order.items.slice(0, 2).map((item, index) => (
                  <View key={index} style={styles.orderItem}>
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
                    <Text style={styles.itemPrice}>₾{(item.price * item.quantity).toFixed(2)}</Text>
                  </View>
                ))}
                {order.items.length > 2 && (
                  <Text style={styles.moreItems}>
                    +{order.items.length - 2} სხვა პროდუქტი
                  </Text>
                )}
              </View>

              {/* Order Footer */}
              <View style={styles.orderFooter}>
                <View style={styles.orderTotal}>
                  <Text style={styles.totalLabel}>ჯამური თანხა:</Text>
                  <Text style={styles.totalValue}>₾{order.total.toFixed(2)}</Text>
                </View>
                {order.trackingNumber && (
                  <View style={styles.trackingInfo}>
                    <Ionicons name="location-outline" size={16} color={theme.colors.primary} />
                    <Text style={styles.trackingNumber}>{order.trackingNumber}</Text>
                  </View>
                )}
              </View>

              {/* Action Buttons */}
              <View style={styles.orderActions}>
                {order.status === 'delivered' && (
                  <TouchableOpacity style={styles.actionButton}>
                    <Text style={styles.actionButtonText}>ხელახლა შეკვეთა</Text>
                  </TouchableOpacity>
                )}
                {(order.status === 'shipped' || order.status === 'processing') && (
                  <TouchableOpacity style={[styles.actionButton, styles.actionButtonPrimary]}>
                    <Text style={[styles.actionButtonText, styles.actionButtonTextPrimary]}>
                      თვალყურის დევნება
                    </Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={styles.actionButton}>
                  <Text style={styles.actionButtonText}>დეტალები</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom Navigation */}
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
  },
  orderActions: {
    flexDirection: 'row',
    gap: 8,
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
