import { theme } from '@/src/theme';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface PromoBannerProps {
  message: string;
  code?: string;
  onClose?: () => void;
}

export function PromoBanner({ message, code, onClose }: PromoBannerProps) {
  const [visible, setVisible] = useState(true);

  const handleClose = () => {
    setVisible(false);
    onClose?.();
  };

  if (!visible) return null;

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.message}>{message}</Text>
        {code && <Text style={styles.code}>კოდი: {code}</Text>}
      </View>
      
      <TouchableOpacity 
        style={styles.closeButton}
        onPress={handleClose}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons name="close" size={20} color={theme.colors.white} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    marginRight: 12,
  },
  message: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.white,
    lineHeight: 18,
  },
  code: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.white,
    marginTop: 2,
  },
  closeButton: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
