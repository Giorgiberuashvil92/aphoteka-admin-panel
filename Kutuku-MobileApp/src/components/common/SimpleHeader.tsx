import { theme } from '@/src/theme';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface SimpleHeaderProps {
  onMenuPress?: () => void;
  onNotificationsPress?: () => void;
  notificationsCount?: number;
}

export function SimpleHeader({ 
  onMenuPress,
  onNotificationsPress,
  notificationsCount = 0,
}: SimpleHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {/* Menu Button */}
        <TouchableOpacity 
          style={styles.menuButton}
          onPress={onMenuPress}
        >
          <Ionicons name="menu" size={28} color={theme.colors.text.primary} />
        </TouchableOpacity>

        <View style={styles.spacer} />

        {/* Notifications Button */}
        <TouchableOpacity 
          style={styles.notificationButton}
          onPress={onNotificationsPress}
        >
          <Ionicons name="notifications-outline" size={24} color={theme.colors.text.primary} />
          {notificationsCount > 0 && (
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationBadgeText}>{notificationsCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  spacer: {
    flex: 1,
  },
  menuButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  notificationBadgeText: {
    color: theme.colors.white,
    fontSize: 10,
    fontWeight: '700',
  },
});
