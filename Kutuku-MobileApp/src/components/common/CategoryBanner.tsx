import { theme } from '@/src/theme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

interface CategoryBannerProps {
  onPress?: () => void;
}

export function CategoryBanner({ onPress }: CategoryBannerProps) {
  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="grid-outline" size={28} color={theme.colors.primary} />
        </View>
        
        <View style={styles.textContainer}>
          <Text style={styles.title}>ყველა კატეგორია</Text>
          <Text style={styles.subtitle}>ნახე სრული სია</Text>
        </View>
        
        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 8,
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 12,
    fontWeight: '400',
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 11,
    fontWeight: '400',
    color: theme.colors.text.secondary,
  },
});
