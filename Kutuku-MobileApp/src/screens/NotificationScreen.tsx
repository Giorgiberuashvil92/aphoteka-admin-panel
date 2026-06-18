import { BottomNavigation } from '@/src/components/common/BottomNavigation';
import { Notification, NotificationService } from '@/src/services/notification.service';
import { useTabNavigation } from '@/src/hooks/useTabNavigation';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import React, { useState } from 'react';
import {
  ActivityIndicator,
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

interface NotificationScreenProps {
  onBack: () => void;
  onNotificationPress?: (notification: Notification) => void;
  onSearch?: () => void;
}

export function NotificationScreen({
  onBack,
  onNotificationPress,
}: NotificationScreenProps) {
  const insets = useSafeAreaInsets();
  const tabNav = useTabNavigation();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    React.useCallback(() => {
      loadNotifications();
    }, []),
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

  const getNotificationIcon = (type: string): keyof typeof Ionicons.glyphMap => {
    switch (type) {
      case 'order':
      case 'purchase':
        return 'receipt-outline';
      case 'promotion':
      case 'sale':
        return 'pricetag-outline';
      case 'delivery':
      case 'shipping':
        return 'car-outline';
      case 'system':
        return 'information-circle-outline';
      default:
        return 'notifications-outline';
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
      month: 'long',
    });
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

      <View style={styles.headerRow}>
        <TouchableOpacity
          onPress={onBack}
          style={styles.backButton}
          activeOpacity={0.75}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="chevron-back" size={24} color={C.navy} />
        </TouchableOpacity>
        <View style={styles.intro}>
          <Text style={styles.pageTitle}>შეტყობინებები</Text>
          <Text style={styles.pageSub}>
            {unreadCount > 0
              ? `${unreadCount} ახალი შეტყობინება`
              : 'ყველა შეტყობინება წაკითხულია'}
          </Text>
        </View>
      </View>

      <View style={styles.topBar}>
        {unreadCount > 0 ? (
          <TouchableOpacity
            style={styles.markAllBtn}
            onPress={handleMarkAllAsRead}
            activeOpacity={0.85}
          >
            <Text style={styles.markAllText}>ყველას წაკითხვა</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={C.purple} />
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconWrap}>
            <Ionicons name="notifications-outline" size={36} color={C.purple} />
          </View>
          <Text style={styles.emptyTitle}>შეტყობინებები არ არის</Text>
          <Text style={styles.emptySubtitle}>
            ახალი შეტყობინებები აქ გამოჩნდება
          </Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + 88 },
          ]}
        >
          {notifications.map((notification) => (
            <TouchableOpacity
              key={notification.id}
              style={[
                styles.notificationCard,
                !notification.read && styles.notificationCardUnread,
              ]}
              onPress={() => handleNotificationPress(notification)}
              activeOpacity={0.85}
            >
              <View style={styles.iconWrap}>
                <Ionicons
                  name={getNotificationIcon(notification.type)}
                  size={20}
                  color={C.navy}
                />
              </View>

              <View style={styles.notificationBody}>
                <Text style={styles.notificationTitle}>{notification.title}</Text>
                <Text style={styles.notificationMessage} numberOfLines={2}>
                  {notification.message}
                </Text>
                <Text style={styles.notificationDate}>
                  {formatDate(notification.timestamp)}
                </Text>
              </View>

              {!notification.read ? <View style={styles.unreadDot} /> : null}
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      <BottomNavigation
        activeTab="home"
        onHomePress={tabNav.onHomePress}
        onCategoriesPress={tabNav.onCategoriesPress}
        onCabinetPress={tabNav.onCabinetPress}
        onCartPress={tabNav.onCartPress}
        onProfilePress={tabNav.onProfilePress}
        cartCount={tabNav.cartCount}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingTop: 4,
    paddingBottom: 4,
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBar: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 12,
  },
  intro: {
    flex: 1,
    gap: 4,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: C.text,
  },
  pageSub: {
    fontSize: 14,
    fontWeight: '400',
    color: C.muted,
    lineHeight: 20,
  },
  markAllBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: C.lavender,
  },
  markAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: C.purple,
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
    paddingHorizontal: 32,
    paddingBottom: 80,
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: C.lavender,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: C.text,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    fontWeight: '400',
    color: C.muted,
    textAlign: 'center',
    lineHeight: 20,
  },
  listContent: {
    paddingHorizontal: 16,
    gap: 10,
  },
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: C.bg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
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
  notificationCardUnread: {
    backgroundColor: C.lavender,
    borderColor: '#D5D9F0',
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: C.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationBody: {
    flex: 1,
    minWidth: 0,
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: C.text,
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 13,
    fontWeight: '400',
    color: C.muted,
    lineHeight: 18,
    marginBottom: 8,
  },
  notificationDate: {
    fontSize: 12,
    fontWeight: '500',
    color: C.purple,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: C.purple,
    marginTop: 6,
  },
});
