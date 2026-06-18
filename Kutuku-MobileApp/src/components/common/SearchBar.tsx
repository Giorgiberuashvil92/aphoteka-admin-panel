import { theme } from '@/src/theme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

interface SearchBarProps {
  placeholder?: string;
  onPress?: () => void;
  editable?: boolean;
}

export function SearchBar({ 
  placeholder = 'რას ეძებ?', 
  onPress,
  editable = false 
}: SearchBarProps) {
  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.searchBox} 
        onPress={onPress}
        activeOpacity={0.7}
        disabled={!onPress}
      >
        <Ionicons name="search" size={20} color="#9CA3AF" style={styles.icon} />
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          editable={editable}
          pointerEvents="none"
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.text.primary,
    fontWeight: '400',
  },
});
