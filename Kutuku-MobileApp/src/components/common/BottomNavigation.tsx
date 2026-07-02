import { fonts } from '@/src/theme/fonts';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const C = {
  navy: '#0D2B78',
  muted: '#8B97AE',
  border: '#E4E9F2',
  white: '#FFFFFF',
};

export type BottomNavTab = 'home' | 'categories' | 'cabinet' | 'cart' | 'profile';

interface BottomNavigationProps {
  activeTab: BottomNavTab;
  onHomePress?: () => void;
  onCategoriesPress?: () => void;
  onCabinetPress?: () => void;
  onCartPress?: () => void;
  onProfilePress?: () => void;
  cartCount?: number;
  /** ქვედა safe area-ს ფონი (მთავარი ეკრანის ფერი) */
  safeAreaColor?: string;
}

export function BottomNavigation({
  activeTab,
  onHomePress,
  onCategoriesPress,
  onCabinetPress,
  onCartPress,
  onProfilePress,
  cartCount = 0,
  safeAreaColor = C.white,
}: BottomNavigationProps) {
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, 0);

  return (
    <View style={styles.wrapper}>
      <View style={styles.bottomNav}>
      <TouchableOpacity style={styles.navItem} onPress={onHomePress}>
        <Ionicons
          name={activeTab === 'home' ? 'home' : 'home-outline'}
          size={26}
          color={activeTab === 'home' ? C.navy : C.muted}
        />
        <Text style={[styles.navText, activeTab === 'home' && styles.navTextActive]}>
          მთავარი
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.navItem} onPress={onCategoriesPress}>
        <Ionicons
          name="grid-outline"
          size={26}
          color={activeTab === 'categories' ? C.navy : C.muted}
        />
        <Text style={[styles.navText, activeTab === 'categories' && styles.navTextActive]}>
          კატეგორიები
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.navItem} onPress={onCabinetPress}>
        <Ionicons
          name="id-card-outline"
          size={26}
          color={activeTab === 'cabinet' ? C.navy : C.muted}
        />
        <Text style={[styles.navText, activeTab === 'cabinet' && styles.navTextActive]}>
          პირადი კაბინეტი
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.navItem} onPress={onCartPress}>
        <View style={styles.navIconContainer}>
          <Ionicons
            name="cart-outline"
            size={26}
            color={activeTab === 'cart' ? C.navy : C.muted}
          />
          {cartCount > 0 ? (
            <View style={styles.navBadge}>
              <Text style={styles.navBadgeText}>{cartCount}</Text>
            </View>
          ) : null}
        </View>
        <Text style={[styles.navText, activeTab === 'cart' && styles.navTextActive]}>
          კალათა
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.navItem} onPress={onProfilePress}>
        <Ionicons
          name="person-outline"
          size={26}
          color={activeTab === 'profile' ? C.navy : C.muted}
        />
        <Text style={[styles.navText, activeTab === 'profile' && styles.navTextActive]}>
          პროფილი
        </Text>
      </TouchableOpacity>
      </View>
      {bottomInset > 0 ? (
        <View style={{ height: bottomInset, backgroundColor: safeAreaColor }} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: C.white,
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 10,
    paddingHorizontal: 8,
    backgroundColor: C.white,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  navItem: {
    alignItems: 'center',
    gap: 4,
    flex: 1,
    maxWidth: 72,
  },
  navIconContainer: {
    position: 'relative',
  },
  navBadge: {
    position: 'absolute',
    top: -4,
    right: -6,
    backgroundColor: '#24B7B4',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  navBadgeText: {
    fontFamily: fonts.bold,
    fontSize: 9,
    color: C.white,
  },
  navText: {
    marginTop: 5,
    fontFamily: fonts.semibold,
    fontSize: 9,
    color: C.muted,
    textAlign: 'center',
  },
  navTextActive: {
    fontFamily: fonts.extraBold,
    color: C.navy,
  },
});
