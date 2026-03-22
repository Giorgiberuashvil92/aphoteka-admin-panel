import { theme } from '@/src/theme';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface Advantage {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
}

const ADVANTAGES: Advantage[] = [
  {
    id: '1',
    icon: 'shield-checkmark',
    title: 'უსაფრთხო შეძენა',
    description: 'ყველა პროდუქტი ორიგინალური და სერტიფიცირებულია',
  },
  {
    id: '2',
    icon: 'car',
    title: 'სწრაფი მიწოდება',
    description: 'უფასო მიწოდება 50₾-ზე მეტი შეძენისას',
  },
  {
    id: '3',
    icon: 'heart',
    title: '24/7 კონსულტაცია',
    description: 'პროფესიონალი ფარმაცევტების დახმარება',
  },
  {
    id: '4',
    icon: 'wallet',
    title: 'ხელმისაწვდომი ფასები',
    description: 'რეგულარული აქციები და ფასდაკლებები',
  },
];

export function AdvantagesSection() {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>რატომ ავირჩიოთ ჩვენ</Text>
      <Text style={styles.sectionDescription}>
        უმაღლესი ხარისხის მედიკამენტები და სერვისი
      </Text>

      <View style={styles.container}>
        {ADVANTAGES.map((item) => (
          <View key={item.id} style={styles.advantageItem}>
            <View style={styles.iconContainer}>
              <Ionicons name={item.icon} size={24} color={theme.colors.primary} />
            </View>

            <View style={styles.advantageContent}>
              <Text style={styles.advantageTitle}>{item.title}</Text>
              <Text style={styles.advantageDescription}>{item.description}</Text>
            </View>

            <TouchableOpacity>
              <Text style={styles.learnMore}>მეტის ნახვა</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingVertical: 32,
    paddingHorizontal: 16,
    backgroundColor: theme.colors.gray[200],
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: theme.colors.gray[400],
  },
  sectionTitle: {
    fontSize: 25,
    fontWeight: '600',
    color: theme.colors.text.primary,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  sectionDescription: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginTop: 12,
  },
  container: {
    marginTop: 32,
    gap: 20,
  },
  advantageItem: {
    width: '100%',
    padding: 24,
    gap: 20,
    backgroundColor: theme.colors.white,
    borderWidth: 1.5,
    borderColor: theme.colors.gray[300],
    borderRadius: 8,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.purple[300],
    justifyContent: 'center',
    alignItems: 'center',
  },
  advantageContent: {
    gap: 6,
  },
  advantageTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    textTransform: 'uppercase',
  },
  advantageDescription: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    lineHeight: 24,
  },
  learnMore: {
    fontSize: 13,
    fontWeight: '500',
    color: theme.colors.primary,
  },
});
