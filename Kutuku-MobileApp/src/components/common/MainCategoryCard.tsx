import { theme } from '@/src/theme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

export type MainCategoryType = 'medications' | 'cosmetics' | 'mother-child';

/** მთავარი გვერდის 3 ბარათი → კატეგორიების API სახელები */
export const MAIN_CATEGORY_API_NAMES: Record<MainCategoryType, string> = {
  medications: 'მედიკამენტები',
  cosmetics: 'კოსმეტიკა და პირადი ჰიგიენა',
  'mother-child': 'დედა და ბავშვი',
};

interface MainCategoryCardProps {
  type: MainCategoryType;
  onPress?: () => void;
}

const CATEGORY_CONFIG = {
  medications: {
    title: 'მედიკამენტები',
    icon: 'medical' as const,
    backgroundColor: '#EBF5FF',
    iconColor: '#3B82F6',
  },
  cosmetics: {
    title: 'კოსმეტიკა',
    icon: 'rose' as const,
    backgroundColor: '#FFF0F6',
    iconColor: '#EC4899',
  },
  'mother-child': {
    title: 'დედა და ბავშვი',
    icon: 'heart' as const,
    backgroundColor: '#FEF3E2',
    iconColor: '#F59E0B',
  },
};

export function MainCategoryCard({ type, onPress }: MainCategoryCardProps) {
  const config = CATEGORY_CONFIG[type];

  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: config.backgroundColor }]}>
        <Ionicons name={config.icon} size={28} color={config.iconColor} />
      </View>
      <Text style={styles.title}>{config.title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.white,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 12,
    fontWeight: '400',
    color: theme.colors.text.primary,
    textAlign: 'center',
  },
});
