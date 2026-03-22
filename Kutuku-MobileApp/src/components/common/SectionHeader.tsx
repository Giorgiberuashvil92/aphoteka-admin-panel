import { theme } from '@/src/theme';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface SectionHeaderProps {
  title: string;
  currentIndex?: number;
  totalItems?: number;
  onPrevious?: () => void;
  onNext?: () => void;
  showNavigation?: boolean;
}

export function SectionHeader({ 
  title, 
  currentIndex = 0,
  totalItems = 0,
  onPrevious, 
  onNext,
  showNavigation = false
}: SectionHeaderProps) {
  const canGoPrevious = currentIndex > 0;
  const canGoNext = currentIndex < totalItems - 1;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      
      {showNavigation && totalItems > 1 && (
        <View style={styles.navigation}>
          <Text style={styles.counter}>
            {currentIndex + 1}/{totalItems}
          </Text>
          
          <View style={styles.arrows}>
            <TouchableOpacity 
              style={[styles.arrowButton, !canGoPrevious && styles.arrowButtonDisabled]}
              onPress={onPrevious}
              disabled={!canGoPrevious}
            >
              <Ionicons 
                name="chevron-back" 
                size={20} 
                color={canGoPrevious ? theme.colors.text.primary : theme.colors.text.tertiary} 
              />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.arrowButton, !canGoNext && styles.arrowButtonDisabled]}
              onPress={onNext}
              disabled={!canGoNext}
            >
              <Ionicons 
                name="chevron-forward" 
                size={20} 
                color={canGoNext ? theme.colors.text.primary : theme.colors.text.tertiary} 
              />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  navigation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  counter: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text.secondary,
  },
  arrows: {
    flexDirection: 'row',
    gap: 8,
  },
  arrowButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.gray[300],
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowButtonDisabled: {
    backgroundColor: theme.colors.gray[200],
  },
});
