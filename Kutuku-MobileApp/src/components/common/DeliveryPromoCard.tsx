import { fonts } from '@/src/theme/fonts';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const C = {
  navy: '#0D2B78',
  teal: '#24B7B4',
  white: '#FFFFFF',
};

type DeliveryPromoCardProps = {
  onPress?: () => void;
};

export function DeliveryPromoCard({ onPress }: DeliveryPromoCardProps) {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.88}
      disabled={!onPress}
    >
      <View style={styles.iconWrap}>
        <Ionicons name="bicycle-outline" size={36} color={C.teal} />
      </View>
      <View style={styles.body}>
        <Text style={styles.title}>უფასო მიტანა</Text>
        <Text style={styles.subtitle}>30 ₾-ზე მეტი შეკვეთისთვის</Text>
      </View>
      <Ionicons name="chevron-forward" size={28} color={C.navy} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 18,
    marginTop: 12,
    marginBottom: 18,
    padding: 22,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#C9D7EE',
    backgroundColor: C.white,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrap: {
    marginRight: 20,
  },
  body: {
    flex: 1,
  },
  title: {
    fontFamily: fonts.extraBold,
    fontSize: 16,
    color: C.navy,
  },
  subtitle: {
    marginTop: 4,
    fontFamily: fonts.regular,
    fontSize: 12,
    color: C.navy,
    opacity: 0.75,
  },
});
