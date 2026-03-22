import { theme } from '@/src/theme';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface BottomNavigationProps {
  activeTab: 'home' | 'wishlist' | 'categories' | 'cart' | 'profile';
  onHomePress?: () => void;
  onWishlistPress?: () => void;
  onCategoriesPress?: () => void;
  onCartPress?: () => void;
  onProfilePress?: () => void;
  wishlistCount?: number;
  cartCount?: number;
}

export function BottomNavigation({
  activeTab,
  onHomePress,
  onWishlistPress,
  onCategoriesPress,
  onCartPress,
  onProfilePress,
  wishlistCount = 0,
  cartCount = 0,
}: BottomNavigationProps) {
  return (
    <View style={styles.bottomNav}>
      <TouchableOpacity 
        style={styles.navItem}
        onPress={onHomePress}
      >
        <Ionicons 
          name="home" 
          size={26} 
          color={activeTab === 'home' ? theme.colors.text.primary : theme.colors.text.secondary} 
        />
        <Text style={[
          styles.navText,
          activeTab === 'home' && styles.navTextActive
        ]}>
          მთავარი
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.navItem}
        onPress={onWishlistPress}
      >
        <View style={styles.navIconContainer}>
          <Ionicons 
            name="heart-outline" 
            size={26} 
            color={activeTab === 'wishlist' ? theme.colors.text.primary : theme.colors.text.secondary} 
          />
          {wishlistCount > 0 && (
            <View style={styles.navBadge}>
              <Text style={styles.navBadgeText}>{wishlistCount}</Text>
            </View>
          )}
        </View>
        <Text style={[
          styles.navText,
          activeTab === 'wishlist' && styles.navTextActive
        ]}>
          სურვილები
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.navItem}
        onPress={onCategoriesPress}
      >
        <Ionicons 
          name="grid-outline" 
          size={26} 
          color={activeTab === 'categories' ? theme.colors.text.primary : theme.colors.text.secondary} 
        />
        <Text style={[
          styles.navText,
          activeTab === 'categories' && styles.navTextActive
        ]}>
          კატეგორიები
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.navItem}
        onPress={onCartPress}
      >
        <View style={styles.navIconContainer}>
          <Ionicons 
            name="cart-outline" 
            size={26} 
            color={activeTab === 'cart' ? theme.colors.text.primary : theme.colors.text.secondary} 
          />
          {cartCount > 0 && (
            <View style={styles.navBadge}>
              <Text style={styles.navBadgeText}>{cartCount}</Text>
            </View>
          )}
        </View>
        <Text style={[
          styles.navText,
          activeTab === 'cart' && styles.navTextActive
        ]}>
          კალათა
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.navItem}
        onPress={onProfilePress}
      >
        <Ionicons 
          name="person-outline" 
          size={26} 
          color={activeTab === 'profile' ? theme.colors.text.primary : theme.colors.text.secondary} 
        />
        <Text style={[
          styles.navText,
          activeTab === 'profile' && styles.navTextActive
        ]}>
          პროფილი
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: theme.colors.white,
    borderTopWidth: 1,
    borderTopColor: theme.colors.gray[400],
    ...theme.shadows.md,
  },
  navItem: {
    alignItems: 'center',
    gap: 4,
  },
  navIconContainer: {
    position: 'relative',
  },
  navBadge: {
    position: 'absolute',
    top: -4,
    right: -6,
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  navBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.white,
  },
  navText: {
    fontSize: 10,
    color: theme.colors.text.secondary,
  },
  navTextActive: {
    color: theme.colors.text.primary,
    fontWeight: '600',
  },
});
