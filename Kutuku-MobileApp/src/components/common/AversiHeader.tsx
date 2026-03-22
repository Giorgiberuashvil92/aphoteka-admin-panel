import { theme } from '@/src/theme';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface AversiHeaderProps {
  onSearchPress?: () => void;
  onMenuPress?: () => void;
  onNotificationsPress?: () => void;
  notificationsCount?: number;
}

export function AversiHeader({ 
  onSearchPress,
  onMenuPress,
  onNotificationsPress,
  notificationsCount = 0,
}: AversiHeaderProps) {
  return (
    <View style={styles.container}>
      {/* Main Header */}
      <View style={styles.header}>
        {/* Menu Button */}
        <TouchableOpacity 
          style={styles.menuButton}
          onPress={onMenuPress}
        >
          <Ionicons name="menu" size={28} color={theme.colors.text.primary} />
        </TouchableOpacity>

        {/* Search Bar */}
        <TouchableOpacity 
          style={styles.searchBar}
          onPress={onSearchPress}
          activeOpacity={0.7}
        >
          <Ionicons name="search" size={20} color={theme.colors.text.secondary} />
          <Text style={styles.searchPlaceholder}>რას ეძებ?</Text>
        </TouchableOpacity>

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
    gap: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.gray[200],
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  searchPlaceholder: {
    fontSize: 15,
    color: theme.colors.text.tertiary,
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
