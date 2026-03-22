import { AversiHeader } from '@/src/components/common/AversiHeader';
import { BottomNavigation } from '@/src/components/common/BottomNavigation';
import { Notification, NotificationService } from '@/src/services/notification.service';
import { theme } from '@/src/theme';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import React, { useState } from 'react';
import { ActivityIndicator, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface NotificationScreenProps {
  onBack: () => void;
  onNotificationPress?: (notification: Notification) => void;
  onSearch: () => void;
  onHomePress: () => void;
  onWishlistPress: () => void;
  onCartPress: () => void;
  onProfilePress: () => void;
}

export function NotificationScreen({
  onBack,
  onNotificationPress,
  onSearch,
  onHomePress,
  onWishlistPress,
  onCartPress,
  onProfilePress,
}: NotificationScreenProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    React.useCallback(() => {
      loadNotifications();
    }, [])
  );

  const loadNotifications = async () => {
    try {
      setLoading(true);
      await NotificationService.initializeSampleNotifications();
      const notifs = await NotificationService.getNotifications();
      setNotifications(notifs);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationPress = async (notification: Notification) => {
    await NotificationService.markAsRead(notification.id);
    loadNotifications();
    onNotificationPress?.(notification);
  };

  const handleMarkAllAsRead = async () => {
    await NotificationService.markAllAsRead();
    loadNotifications();
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'order':
        return 'receipt-outline';
      case 'promotion':
        return 'pricetag-outline';
      case 'delivery':
        return 'car-outline';
      case 'system':
        return 'information-circle-outline';
      default:
        return 'notifications-outline';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'order':
        return theme.colors.info;
      case 'promotion':
        return theme.colors.success;
      case 'delivery':
        return theme.colors.warning;
      case 'system':
        return theme.colors.primary;
      default:
        return theme.colors.gray[600];
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'ახლახან';
    if (diffMins < 60) return `${diffMins} წუთის წინ`;
    if (diffHours < 24) return `${diffHours} საათის წინ`;
    if (diffDays < 7) return `${diffDays} დღის წინ`;
    
    return date.toLocaleDateString('ka-GE', { 
      day: 'numeric', 
      month: 'long' 
    });
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.white} />

      {/* Header */}
      <AversiHeader
        onSearchPress={onSearch}
      />

      {/* Title & Actions */}
      <View style={styles.titleContainer}>
        <Text style={styles.title}>შეტყობინებები</Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={handleMarkAllAsRead}>
            <Text style={styles.markAllReadText}>ყველას წაკითხვა</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : notifications.length === 0 ? (
        /* Empty State */
        <View style={styles.emptyContainer}>
          <Ionicons name="notifications-outline" size={80} color={theme.colors.gray[400]} />
          <Text style={styles.emptyTitle}>შეტყობინებები არ არის</Text>
          <Text style={styles.emptySubtitle}>თქვენ არ გაქვთ ახალი შეტყობინებები</Text>
        </View>
      ) : (
        /* Notifications List */
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.notificationsContainer}>
            {notifications.map((notification) => (
              <TouchableOpacity
                key={notification.id}
                style={[
                  styles.notificationCard,
                  !notification.read && styles.notificationCardUnread,
                ]}
                onPress={() => handleNotificationPress(notification)}
              >
                {/* Icon */}
                <View
                  style={[
                    styles.iconContainer,
                    { backgroundColor: getNotificationColor(notification.type) + '20' },
                  ]}
                >
                  <Ionicons
                    name={getNotificationIcon(notification.type) as any}
                    size={24}
                    color={getNotificationColor(notification.type)}
                  />
                </View>

                {/* Content */}
                <View style={styles.notificationContent}>
                  <Text style={styles.notificationTitle}>{notification.title}</Text>
                  <Text style={styles.notificationMessage} numberOfLines={2}>
                    {notification.message}
                  </Text>
                  <Text style={styles.notificationDate}>
                    {formatDate(notification.timestamp)}
                  </Text>
                </View>

                {/* Unread Indicator */}
                {!notification.read && <View style={styles.unreadDot} />}
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      )}

      {/* Bottom Navigation */}
      <BottomNavigation
        activeTab="home"
        onHomePress={onHomePress}
        onWishlistPress={onWishlistPress}
        onCategoriesPress={() => {}}
        onCartPress={onCartPress}
        onProfilePress={onProfilePress}
        wishlistCount={0}
        cartCount={0}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.white,
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray[200],
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  markAllReadText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginTop: 24,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  notificationsContainer: {
    padding: 16,
    gap: 12,
  },
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.gray[200],
    padding: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  notificationCardUnread: {
    backgroundColor: theme.colors.primary + '05',
    borderColor: theme.colors.primary + '20',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    lineHeight: 18,
    marginBottom: 8,
  },
  notificationDate: {
    fontSize: 12,
    color: theme.colors.text.tertiary,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.primary,
    marginTop: 4,
  },
});
