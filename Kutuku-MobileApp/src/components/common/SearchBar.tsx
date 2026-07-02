import { fonts } from '@/src/theme/fonts';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, TextInput, TouchableOpacity } from 'react-native';

const C = {
  muted: '#8B97AE',
  white: '#FFFFFF',
  text: '#14213D',
};

interface SearchBarProps {
  placeholder?: string;
  onPress?: () => void;
  editable?: boolean;
}

export function SearchBar({
  placeholder = 'რას ეძებთ?',
  onPress,
  editable = false,
}: SearchBarProps) {
  return (
    <TouchableOpacity
      style={styles.searchBox}
      onPress={onPress}
      activeOpacity={0.88}
      disabled={!onPress}
    >
      <Ionicons name="search" size={22} color={C.muted} />
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={C.muted}
        editable={editable}
        pointerEvents="none"
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  searchBox: {
    marginHorizontal: 18,
    marginTop: 12,
    marginBottom: 14,
    height: 54,
    borderRadius: 28,
    backgroundColor: C.white,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    shadowColor: '#1a2a5e',
    shadowOpacity: 0.07,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  input: {
    marginLeft: 12,
    fontFamily: fonts.regular,
    fontSize: 13,
    flex: 1,
    color: C.text,
  },
});
