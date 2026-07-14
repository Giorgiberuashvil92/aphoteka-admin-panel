import { fonts } from '@/src/theme/fonts';
import type { HomeCategoryCardItem } from '@/src/services/home-category-card.service';
import { Ionicons } from '@expo/vector-icons';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

/** @deprecated ძველი deep link — უკუთავსებადობა */
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

type IconName = keyof typeof Ionicons.glyphMap;

interface MainCategoryCardProps {
  card: HomeCategoryCardItem;
  onPress?: () => void;
}

function CategoryIcon({ card }: { card: HomeCategoryCardItem }) {
  if (card.iconUrl) {
    return (
      <Image source={{ uri: card.iconUrl }} style={styles.iconImage} resizeMode="contain" />
    );
  }

  if (card.iconKey === 'pills') {
    return (
      <View style={styles.pillsWrap}>
        <View style={[styles.pill, { backgroundColor: card.iconColor || C.teal }]} />
        <View
          style={[
            styles.pill,
            styles.pillOutline,
            { borderColor: card.iconColor || C.teal },
          ]}
        />
      </View>
    );
  }

  const iconName = (card.iconKey || 'heart') as IconName;
  const resolved = Ionicons.glyphMap[iconName] ? iconName : ('ellipse-outline' as IconName);

  return <Ionicons name={resolved} size={32} color={card.iconColor || C.teal} />;
}

export function MainCategoryCard({ card, onPress }: MainCategoryCardProps) {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.88}>
      <View style={[styles.iconContainer, { backgroundColor: card.backgroundColor }]}>
        <CategoryIcon card={card} />
      </View>
      <Text style={styles.title}>{card.title}</Text>
      {card.subtitle ? <Text style={styles.subtitle}>{card.subtitle}</Text> : null}
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
  iconImage: {
    width: 36,
    height: 36,
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
  pillOutline: {
    backgroundColor: C.white,
    borderWidth: 2,
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
