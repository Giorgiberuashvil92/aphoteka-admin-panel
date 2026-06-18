import { ProductCard, ProductCardProps } from '@/src/components/ui/ProductCard';
import { theme } from '@/src/theme';
import { Ionicons } from '@expo/vector-icons';
import { Dimensions, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type HomeProductRowProps = {
  title: string;
  products: ProductCardProps[];
  onProductPress: (id: string) => void;
  onSeeAll?: () => void;
  emptyText?: string;
};

const CARD_WIDTH = Math.round(Dimensions.get('window').width * 0.40);

export function HomeProductRow({
  title,
  products,
  onProductPress,
  onSeeAll,
  emptyText = 'პროდუქტი ჯერ არ არის',
}: HomeProductRowProps) {
  if (products.length === 0) {
    return (
      <View style={styles.section}>
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
        </View>
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>{emptyText}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {onSeeAll ? (
          <TouchableOpacity style={styles.seeAllBtn} onPress={onSeeAll} activeOpacity={0.75}>
            <Text style={styles.seeAllText}>ყველა</Text>
            <Ionicons name="chevron-forward" size={16} color={theme.colors.primary} />
          </TouchableOpacity>
        ) : null}
      </View>
      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={{ width: 8 }} />}
        renderItem={({ item }) => (
          <View style={{ width: CARD_WIDTH }}>
            <ProductCard
              {...item}
              variant="inline"
              onPress={() => onProductPress(item.id)}
            />
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  title: {
    fontSize: 17,
    fontWeight: '500',
    color: theme.colors.gray[1200],
    letterSpacing: -0.2,
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  seeAllText: {
    fontSize: 12,
    fontWeight: '400',
    color: theme.colors.primary,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 2,
  },
  emptyBox: {
    marginHorizontal: 16,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: theme.colors.gray[500],
    backgroundColor: theme.colors.white,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 12,
    color: theme.colors.gray[1000],
  },
});
