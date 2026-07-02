import { fonts } from '@/src/theme/fonts';
import { NorixLogo } from '@/src/components/common/NorixLogo';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const C = {
  navy: '#0D2B78',
  teal: '#24B7B4',
  white: '#FFFFFF',
};

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
      <TouchableOpacity style={styles.sideBtn} onPress={onMenuPress} activeOpacity={0.8}>
        <Ionicons name="menu" size={26} color={C.navy} />
      </TouchableOpacity>

      <View style={styles.logoWrap} pointerEvents="none">
        <NorixLogo />
      </View>

      <TouchableOpacity
        style={styles.sideBtn}
        onPress={onNotificationsPress}
        activeOpacity={0.8}
      >
        <Ionicons name="notifications-outline" size={26} color={C.navy} />
        {notificationsCount > 0 ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {notificationsCount > 9 ? '9+' : notificationsCount}
            </Text>
          </View>
        ) : (
          <View style={styles.dot} />
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 64,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: C.white,
    position: 'relative',
  },
  logoWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 12,
  },
  sideBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  dot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: C.teal,
    position: 'absolute',
    right: 5,
    top: 7,
  },
  badge: {
    position: 'absolute',
    right: 2,
    top: 4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: C.teal,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    fontFamily: fonts.bold,
    color: C.white,
    fontSize: 8,
  },
});
