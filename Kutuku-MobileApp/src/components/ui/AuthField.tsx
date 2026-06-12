import { theme } from '@/src/theme';
import { ReactNode, useState } from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';

type AuthFieldProps = TextInputProps & {
  label: string;
  error?: string;
  leftIcon: ReactNode;
  rightIcon?: ReactNode;
};

export function AuthField({
  label,
  error,
  leftIcon,
  rightIcon,
  multiline,
  style,
  onFocus,
  onBlur,
  ...inputProps
}: AuthFieldProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View
        style={[
          styles.fieldBox,
          multiline && styles.fieldBoxMultiline,
          focused && styles.fieldBoxFocused,
          error ? styles.fieldBoxError : undefined,
        ]}
      >
        <View
          style={[
            styles.iconPill,
            multiline && styles.iconPillMultiline,
            focused && styles.iconPillFocused,
          ]}
        >
          {leftIcon}
        </View>
        <TextInput
          {...inputProps}
          multiline={multiline}
          style={[styles.fieldInput, multiline && styles.fieldInputMultiline, style]}
          placeholderTextColor={theme.colors.gray[800]}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
        />
        {rightIcon ? <View style={styles.fieldRight}>{rightIcon}</View> : null}
      </View>
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  fieldWrap: { marginBottom: 18 },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.gray[1100],
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  fieldBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: theme.colors.gray[500],
    paddingHorizontal: 6,
    paddingVertical: 6,
    minHeight: 58,
    ...Platform.select({
      ios: {
        shadowColor: '#1F2021',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
      },
      android: { elevation: 1 },
    }),
  },
  fieldBoxMultiline: {
    alignItems: 'flex-start',
    minHeight: 110,
    paddingVertical: 8,
  },
  fieldBoxFocused: {
    borderColor: theme.colors.primary,
    backgroundColor: '#FEFEFF',
    ...Platform.select({
      ios: {
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.14,
        shadowRadius: 12,
      },
      android: { elevation: 3 },
    }),
  },
  fieldBoxError: {
    borderColor: theme.colors.error,
  },
  iconPill: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: theme.colors.purple[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4,
  },
  iconPillMultiline: {
    marginTop: 2,
  },
  iconPillFocused: {
    backgroundColor: theme.colors.purple[200],
  },
  fieldInput: {
    flex: 1,
    fontSize: 15,
    color: theme.colors.gray[1200],
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    paddingHorizontal: 4,
  },
  fieldInputMultiline: {
    minHeight: 88,
    textAlignVertical: 'top',
    paddingTop: Platform.OS === 'ios' ? 12 : 10,
  },
  fieldRight: {
    paddingHorizontal: 8,
  },
  fieldError: {
    fontSize: 12,
    color: theme.colors.error,
    marginTop: 6,
    marginLeft: 4,
  },
});
