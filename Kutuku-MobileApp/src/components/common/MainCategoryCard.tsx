import { fonts } from '@/src/theme/fonts';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export type MainCategoryType = 'medications' | 'cosmetics' | 'mother-child';

export const MAIN_CATEGORY_API_NAMES: Record<MainCategoryType, string> = {
  medications: 'მედიკამენტები',
  cosmetics: 'კოსმეტიკა და პირადი ჰიგიენა',
  'mother-child': 'დედა და ბავშვი',
};

const C = {
  navy: '#0D2B78',
  teal: '#24B7B4',
  muted: '#8B97AE',
  white: '#FFFFFF',
};

interface MainCategoryCardProps {
  type: MainCategoryType;
  onPress?: () => void;
}

const CATEGORY_CONFIG = {
  medications: {
    title: 'მედიკამენტები',
    subtitle: 'სრულყოფილი ასორტიმენტი',
    backgroundColor: '#EAF7FF',
  },
  cosmetics: {
    title: 'კოსმეტიკა',
    subtitle: 'ზრუნვა თქვენი სილამაზისთვის',
    backgroundColor: '#FFEAF5',
    iconColor: '#E24D9A',
  },
  'mother-child': {
    title: 'დედა და ბავშვი',
    subtitle: 'მოვლა და ზრუნვა პატარებისთვის',
    backgroundColor: '#FFF2D9',
    iconColor: '#F5A018',
  },
};

function CategoryIcon({ type }: { type: MainCategoryType }) {
  if (type === 'medications') {
    return (
      <View style={styles.pillsWrap}>
        <View style={[styles.pill, styles.pillTeal]} />
        <View style={[styles.pill, styles.pillWhite]} />
      </View>
    );
  }

  const config = CATEGORY_CONFIG[type];
  return (
    <Ionicons
      name={type === 'cosmetics' ? 'flower-outline' : 'heart'}
      size={32}
      color={config.iconColor}
    />
  );
}

export function MainCategoryCard({ type, onPress }: MainCategoryCardProps) {
  const config = CATEGORY_CONFIG[type];

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.88}>
      <View style={[styles.iconContainer, { backgroundColor: config.backgroundColor }]}>
        <CategoryIcon type={type} />
      </View>
      <Text style={styles.title}>{config.title}</Text>
      <Text style={styles.subtitle}>{config.subtitle}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.white,
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 4,
    alignItems: 'center',
    shadowColor: '#1a2a5e',
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  iconContainer: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillsWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    transform: [{ rotate: '-25deg' }],
  },
  pill: {
    width: 14,
    height: 28,
    borderRadius: 8,
  },
  pillTeal: {
    backgroundColor: C.teal,
  },
  pillWhite: {
    backgroundColor: C.white,
    borderWidth: 2,
    borderColor: C.teal,
  },
  title: {
    marginTop: 14,
    fontFamily: fonts.extraBold,
    fontSize: 11,
    color: C.navy,
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 5,
    fontFamily: fonts.regular,
    fontSize: 9,
    color: C.muted,
    textAlign: 'center',
    lineHeight: 13,
    paddingHorizontal: 4,
  },
});
