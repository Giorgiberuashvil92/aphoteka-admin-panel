import AsyncStorage from '@react-native-async-storage/async-storage';

export type NotificationType = 'purchase' | 'message' | 'sale' | 'shipping' | 'system';

export type Notification = {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  icon?: string;
  actionText?: string;
  actionUrl?: string;
  imageUrl?: string;
};

class NotificationServiceClass {
  private NOTIFICATIONS_KEY = '@kutuku_notifications';

  // Get all notifications
  async getNotifications(): Promise<Notification[]> {
    try {
      const notificationsJson = await AsyncStorage.getItem(this.NOTIFICATIONS_KEY);
      const notifications = notificationsJson ? JSON.parse(notificationsJson) : [];
      // Sort by timestamp, newest first
      return notifications.sort((a: Notification, b: Notification) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
    } catch (error) {
      console.error('Error getting notifications:', error);
      return [];
    }
  }

  // Add new notification
  async addNotification(notification: Omit<Notification, 'id' | 'timestamp' | 'read'>): Promise<boolean> {
    try {
      const notifications = await this.getNotifications();
      
      const newNotification: Notification = {
        ...notification,
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        read: false,
      };

      notifications.unshift(newNotification);
      await AsyncStorage.setItem(this.NOTIFICATIONS_KEY, JSON.stringify(notifications));
      console.log('Notification added:', newNotification.title);
      return true;
    } catch (error) {
      console.error('Error adding notification:', error);
      return false;
    }
  }

  // Mark notification as read
  async markAsRead(notificationId: string): Promise<boolean> {
    try {
      const notifications = await this.getNotifications();
      const notification = notifications.find(n => n.id === notificationId);
      
      if (notification) {
        notification.read = true;
        await AsyncStorage.setItem(this.NOTIFICATIONS_KEY, JSON.stringify(notifications));
        console.log('Notification marked as read:', notificationId);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  }

  // Mark all notifications as read
  async markAllAsRead(): Promise<boolean> {
    try {
      const notifications = await this.getNotifications();
      notifications.forEach(n => n.read = true);
      await AsyncStorage.setItem(this.NOTIFICATIONS_KEY, JSON.stringify(notifications));
      console.log('All notifications marked as read');
      return true;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return false;
    }
  }

  // Delete notification
  async deleteNotification(notificationId: string): Promise<boolean> {
    try {
      const notifications = await this.getNotifications();
      const filtered = notifications.filter(n => n.id !== notificationId);
      await AsyncStorage.setItem(this.NOTIFICATIONS_KEY, JSON.stringify(filtered));
      console.log('Notification deleted:', notificationId);
      return true;
    } catch (error) {
      console.error('Error deleting notification:', error);
      return false;
    }
  }

  // Clear all notifications
  async clearAllNotifications(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.NOTIFICATIONS_KEY);
      console.log('All notifications cleared');
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  }

  // Get unread count
  async getUnreadCount(): Promise<number> {
    try {
      const notifications = await this.getNotifications();
      return notifications.filter(n => !n.read).length;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }

  // Get recent notifications (last 7 days)
  async getRecentNotifications(): Promise<Notification[]> {
    try {
      const notifications = await this.getNotifications();
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      return notifications.filter(n => 
        new Date(n.timestamp) > sevenDaysAgo
      );
    } catch (error) {
      console.error('Error getting recent notifications:', error);
      return [];
    }
  }

  // Initialize with sample notifications (for demo)
  async initializeSampleNotifications(): Promise<void> {
    try {
      const existing = await this.getNotifications();
      if (existing.length > 0) {
        return; // Already have notifications
      }

      const sampleNotifications: Notification[] = [
        {
          id: '1',
          type: 'purchase',
          title: 'Purchase Completed!',
          message: 'You have successfully purchased 334 headphones, thank you and wait for your package to arrive ✨',
          timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(), // 2 min ago
          read: false,
          icon: 'cart',
        },
        {
          id: '2',
          type: 'message',
          title: 'Jerremy Send You a Message',
          message: 'hello your package has almost arrived, are you at home now?',
          timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(), // 2 min ago
          read: false,
          icon: 'chatbubble',
          actionText: 'Reply the message',
          imageUrl: 'https://i.pravatar.cc/150?img=1',
        },
        {
          id: '3',
          type: 'sale',
          title: 'Flash Sale!',
          message: 'Get 20% discount for first transaction in this month! 😍',
          timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(), // 2 min ago
          read: false,
          icon: 'pricetag',
        },
        {
          id: '4',
          type: 'shipping',
          title: 'Package Sent',
          message: 'Hi your package has been sent from new york',
          timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(), // 10 min ago
          read: false,
          icon: 'car',
        },
      ];

      await AsyncStorage.setItem(this.NOTIFICATIONS_KEY, JSON.stringify(sampleNotifications));
      console.log('Sample notifications initialized');
    } catch (error) {
      console.error('Error initializing sample notifications:', error);
    }
  }
}

export const NotificationService = new NotificationServiceClass();
