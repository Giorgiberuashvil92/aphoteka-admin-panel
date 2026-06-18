import { theme } from '@/src/theme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  ImageBackground,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

export interface CategoryGridItem {
  id: string;
  name: string;
  icon?: keyof typeof Ionicons.glyphMap;
  image?: string;
  color?: string;
}

interface CategoryGridCardProps {
  category: CategoryGridItem;
  onPress?: () => void;
}

export function CategoryGridCard({ category, onPress }: CategoryGridCardProps) {
  const bgColor = category.color || '#6366F1';

  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={onPress}
      activeOpacity={0.8}
    >
      {category.image ? (
        <ImageBackground
          source={{ uri: category.image }}
          style={styles.background}
          imageStyle={styles.backgroundImage}
        >
          <View style={styles.overlay}>
            <Text style={styles.title}>{category.name}</Text>
          </View>
        </ImageBackground>
      ) : (
        <View style={[styles.background, { backgroundColor: bgColor }]}>
          <View style={styles.iconContainer}>
            {category.icon && (
              <Ionicons 
                name={category.icon} 
                size={32} 
                color={theme.colors.white} 
              />
            )}
          </View>
          <Text style={styles.title}>{category.name}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    margin: 6,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  background: {
    width: '100%',
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
  },
  backgroundImage: {
    borderRadius: 16,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
  },
  iconContainer: {
    marginBottom: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.white,
    textAlign: 'center',
    textTransform: 'capitalize',
  },
});
