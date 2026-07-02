import { fonts } from '@/src/theme/fonts';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

const C = {
  navy: '#0D2B78',
  white: '#FFFFFF',
};

const BENEFITS = [
  { id: 'guarantee', icon: 'shield-checkmark-outline' as const, title: '100% გარანტია' },
  { id: 'brands', icon: 'ribbon-outline' as const, title: 'სანდო ბრენდები' },
  { id: 'support', icon: 'headset-outline' as const, title: 'პროფესიონალური მხარდაჭერა' },
  { id: 'secure', icon: 'lock-closed-outline' as const, title: 'უსაფრთხო გადახდა' },
];

export function HomeBenefitsRow() {
  return (
    <View style={styles.row}>
      {BENEFITS.map((item) => (
        <View key={item.id} style={styles.item}>
          <View style={styles.iconWrap}>
            <Ionicons name={item.icon} size={28} color={C.navy} />
          </View>
          <Text style={styles.title}>{item.title}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingBottom: 24,
  },
  item: {
    flex: 1,
    alignItems: 'center',
  },
  iconWrap: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: C.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    marginTop: 10,
    fontFamily: fonts.extraBold,
    fontSize: 9,
    color: C.navy,
    textAlign: 'center',
  },
});
