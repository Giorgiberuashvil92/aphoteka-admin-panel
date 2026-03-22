import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar, ScrollView, Switch } from 'react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/src/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';

type SecurityScreenProps = {
  onBack: () => void;
  onMoreOptions?: () => void;
};

type SecuritySetting = {
  id: string;
  title: string;
  enabled: boolean;
};

export function SecurityScreen({ onBack, onMoreOptions }: SecurityScreenProps) {
  const [settings, setSettings] = useState<SecuritySetting[]>([
    { id: 'face_id', title: 'Face ID', enabled: true },
    { id: 'remember_password', title: 'Remember Password', enabled: true },
    { id: 'touch_id', title: 'Touch ID', enabled: true },
  ]);

  const handleToggle = async (id: string) => {
    const updatedSettings = settings.map(setting =>
      setting.id === id ? { ...setting, enabled: !setting.enabled } : setting
    );
    setSettings(updatedSettings);
    
    // Save to AsyncStorage
    try {
      await AsyncStorage.setItem('@security_settings', JSON.stringify(updatedSettings));
    } catch (error) {
      console.error('Error saving security settings:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.white} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Ionicons name="chevron-back" size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Security</Text>
        <TouchableOpacity style={styles.moreButton} onPress={onMoreOptions}>
          <Ionicons name="ellipsis-vertical" size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {settings.map((setting) => (
          <View key={setting.id} style={styles.settingItem}>
            <Text style={styles.settingTitle}>{setting.title}</Text>
            <Switch
              value={setting.enabled}
              onValueChange={() => handleToggle(setting.id)}
              trackColor={{ 
                false: theme.colors.gray[200], 
                true: theme.colors.primary + '80' 
              }}
              thumbColor={setting.enabled ? theme.colors.primary : theme.colors.gray[400]}
              ios_backgroundColor={theme.colors.gray[200]}
            />
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.white,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray[100],
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.gray[50],
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  moreButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.gray[50],
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray[100],
  },
  settingTitle: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.primary,
    fontWeight: '500',
  },
});
