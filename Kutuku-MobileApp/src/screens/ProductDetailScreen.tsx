import { BottomNavigation } from '@/src/components/common/BottomNavigation';
import { ProductsSlider } from '@/src/components/common/ProductsSlider';
import { useCart, useFavorites } from '@/src/contexts';
import { MOCK_MEDICINES, type MockMedicine } from '@/src/data/mockMedicines';
import { ProductService } from '@/src/services/product.service';
import type { Product } from '@/src/services/product.service';
import { theme } from '@/src/theme';
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, Image, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const FORM_MAP: Record<string, MockMedicine['form']> = {
  'აბი': 'აბი',
  'ტაბლეტი': 'აბი',
  'კაფსული': 'კაფსულა',
  'კაფსულა': 'კაფსულა',
  'სიროფი': 'სიროფი',
  'კრემი': 'კრემი',
  'წვეთები': 'წვეთები',
  'ინექცია': 'ინექცია',
};

/** API-დან Product → MockMedicine (დეტალების გვერდის ფორმატი) */
function mapApiProductToMockMedicine(p: Product): MockMedicine {
  const form = (p.dosageForm && FORM_MAP[p.dosageForm]) ? FORM_MAP[p.dosageForm] : 'აბი';
  const packSize = (p as any).packSize;
  const packageSizes = packSize ? [packSize] : ['1 ცალი'];
  return {
    id: p.id,
    name: p.name,
    nameEn: p.name,
    category: p.category || '',
    manufacturer: p.manufacturer || p.brand || '',
    price: p.price ?? 0,
    oldPrice: p.oldPrice,
    discountPercentage: p.discountPercentage,
    description: p.description || '',
    activeIngredient: (p as any).strength || (p as any).genericName || '',
    dosage: (p as any).strength || p.dosageForm || '',
    form,
    packageSizes,
    prescriptionRequired: p.prescriptionRequired ?? false,
    stockQuantity: p.stockQuantity ?? 0,
    imageUrl: p.thumbnail || (p.images && p.images[0]) || '',
    rating: p.rating ?? 4.5,
    reviewCount: p.reviewCount ?? 0,
    usage: (p as any).annotation || '',
    sideEffects: [],
    contraindications: [],
    storageConditions: '',
    expiryDate: '',
    barcode: (p as any).barcode || '',
  };
}

interface ProductDetailScreenProps {
  productId: string;
  onBack: () => void;
  onSearch: () => void;
  onProductPress: (productId: string) => void;
  onHomePress: () => void;
  onWishlistPress: () => void;
  onCategoriesPress: () => void;
  onCartPress: () => void;
  onProfilePress: () => void;
}

export function ProductDetailScreen({ 
  productId, 
  onBack, 
  onSearch,
  onProductPress,
  onHomePress,
  onWishlistPress,
  onCategoriesPress,
  onCartPress, 
  onProfilePress,
}: ProductDetailScreenProps) {
  const { addToCart, itemCount } = useCart();
  const { addToFavorites, removeFromFavorites, isFavorite, favoriteCount } = useFavorites();
  const [product, setProduct] = useState<MockMedicine | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [similarProducts, setSimilarProducts] = useState<MockMedicine[]>([]);
  const [selectedPackageSize, setSelectedPackageSize] = useState<string>('');
  const [selectedForm, setSelectedForm] = useState<string>('');
  const [expandedSections, setExpandedSections] = useState<{[key: string]: boolean}>({
    description: true,
    usage: false,
    sideEffects: false,
    contraindications: false,
  });

  const loadProduct = useCallback(async () => {
    setLoading(true);
    setProduct(null);
    setSimilarProducts([]);

    try {
      const apiProduct = await ProductService.getProductById(productId);
      if (apiProduct) {
        const mapped = mapApiProductToMockMedicine(apiProduct);
        setProduct(mapped);
        setSelectedPackageSize(mapped.packageSizes[0]);
        setSelectedForm(mapped.form);
        const similar = await ProductService.getSimilarProducts(productId);
        setSimilarProducts(similar.map(mapApiProductToMockMedicine));
        setLoading(false);
        return;
      }
    } catch (e) {
      console.error('Error loading product from API:', e);
    }

    const foundProduct = MOCK_MEDICINES.find(med => med.id === productId);
    if (foundProduct) {
      setProduct(foundProduct);
      setSelectedPackageSize(foundProduct.packageSizes[0]);
      setSelectedForm(foundProduct.form);
      const similar = MOCK_MEDICINES.filter(
        med => med.category === foundProduct.category && med.id !== productId
      ).slice(0, 5);
      setSimilarProducts(similar);
    }
    setLoading(false);
  }, [productId]);

  useEffect(() => {
    loadProduct();
  }, [loadProduct]);

  const handleAddToCart = () => {
    if (!product) return;

    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      originalPrice: product.oldPrice,
      discount: product.discountPercentage,
      image: product.imageUrl,
    }, quantity);
  };

  const handleToggleFavorite = () => {
    if (!product) return;

    if (isFavorite(product.id)) {
      removeFromFavorites(product.id);
    } else {
      addToFavorites({
        id: product.id,
        name: product.name,
        price: product.price,
        originalPrice: product.oldPrice,
        discount: product.discountPercentage,
        image: product.imageUrl,
        rating: product.rating,
        reviewCount: product.reviewCount,
        stock: product.stockQuantity,
        category: product.category,
      });
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const increaseQuantity = () => {
    if (product && quantity < product.stockQuantity) {
      setQuantity(quantity + 1);
    }
  };

  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={theme.colors.white} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!product) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={theme.colors.white} />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={theme.colors.gray[300]} />
          <Text style={styles.errorTitle}>პროდუქტი ვერ მოიძებნა</Text>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>უკან დაბრუნება</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const isInFavorites = isFavorite(product.id);
  const hasDiscount = product.discountPercentage && product.discountPercentage > 0;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.white} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.headerButton}>
          <Ionicons name="chevron-back" size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>დეტალები</Text>
        <TouchableOpacity onPress={handleToggleFavorite} style={styles.headerButton}>
          <Ionicons 
            name={isInFavorites ? "heart" : "heart-outline"} 
            size={24} 
            color={isInFavorites ? theme.colors.primary : theme.colors.text.primary} 
          />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Product Image */}
        <View style={styles.imageContainer}>
          {hasDiscount && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>-{product.discountPercentage}%</Text>
            </View>
          )}
          <Image
            source={{ uri: product.imageUrl }}
            style={styles.productImage}
            resizeMode="cover"
          />
        </View>

        {/* Product Info */}
        <View style={styles.infoSection}>
          <Text style={styles.productName}>{product.name}</Text>
          <Text style={styles.productNameEn}>{product.nameEn}</Text>
          
          {/* Rating */}
          <View style={styles.ratingContainer}>
            <View style={styles.ratingStars}>
              <Ionicons name="star" size={16} color="#FFB800" />
              <Text style={styles.ratingText}>{product.rating.toFixed(1)}</Text>
            </View>
            <Text style={styles.reviewCount}>({product.reviewCount} შეფასება)</Text>
          </View>

          {/* Price */}
          <View style={styles.priceContainer}>
            <Text style={styles.currentPrice}>₾{product.price.toFixed(2)}</Text>
            {product.oldPrice && (
              <Text style={styles.oldPrice}>₾{product.oldPrice.toFixed(2)}</Text>
            )}
          </View>

          {/* Stock Status */}
          <View style={styles.stockContainer}>
            <Ionicons 
              name={product.stockQuantity > 0 ? "checkmark-circle" : "close-circle"} 
              size={20} 
              color={product.stockQuantity > 0 ? theme.colors.success : theme.colors.error} 
            />
            <Text style={[
              styles.stockText,
              { color: product.stockQuantity > 0 ? theme.colors.success : theme.colors.error }
            ]}>
              {product.stockQuantity > 0 ? `მარაგშია (${product.stockQuantity})` : 'არ არის მარაგში'}
            </Text>
          </View>

          {/* Manufacturer */}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>მწარმოებელი:</Text>
            <Text style={styles.infoValue}>{product.manufacturer}</Text>
          </View>

          {/* Category */}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>კატეგორია:</Text>
            <Text style={styles.infoValue}>{product.category}</Text>
          </View>

          {/* Active Ingredient */}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>აქტიური ნივთიერება:</Text>
            <Text style={styles.infoValue}>{product.activeIngredient}</Text>
          </View>

          {/* Dosage */}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>დოზირება:</Text>
            <Text style={styles.infoValue}>{product.dosage}</Text>
          </View>

          {/* Form */}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>ფორმა:</Text>
            <Text style={styles.infoValue}>{product.form}</Text>
          </View>

          {/* Prescription Required */}
          {product.prescriptionRequired && (
            <View style={styles.prescriptionBadge}>
              <Ionicons name="document-text" size={16} color={theme.colors.warning} />
              <Text style={styles.prescriptionText}>საჭიროებს რეცეპტს</Text>
            </View>
          )}
        </View>

        {/* Package Size Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>შეფუთვის ზომა</Text>
          <View style={styles.optionsGrid}>
            {product.packageSizes.map((size) => (
              <TouchableOpacity
                key={size}
                style={[
                  styles.optionChip,
                  selectedPackageSize === size && styles.optionChipActive,
                ]}
                onPress={() => setSelectedPackageSize(size)}
              >
                <Text
                  style={[
                    styles.optionChipText,
                    selectedPackageSize === size && styles.optionChipTextActive,
                  ]}
                >
                  {size}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Quantity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>რაოდენობა</Text>
          <View style={styles.quantityContainer}>
            <TouchableOpacity
              style={[styles.quantityButton, quantity === 1 && styles.quantityButtonDisabled]}
              onPress={decreaseQuantity}
              disabled={quantity === 1}
            >
              <Ionicons name="remove" size={20} color={quantity === 1 ? theme.colors.gray[300] : theme.colors.text.primary} />
            </TouchableOpacity>
            <Text style={styles.quantityText}>{quantity}</Text>
            <TouchableOpacity
              style={[styles.quantityButton, quantity >= product.stockQuantity && styles.quantityButtonDisabled]}
              onPress={increaseQuantity}
              disabled={quantity >= product.stockQuantity}
            >
              <Ionicons name="add" size={20} color={quantity >= product.stockQuantity ? theme.colors.gray[300] : theme.colors.text.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => toggleSection('description')}
          >
            <Text style={styles.sectionTitle}>აღწერა</Text>
            <Ionicons
              name={expandedSections.description ? "chevron-up" : "chevron-down"}
              size={20}
              color={theme.colors.text.secondary}
            />
          </TouchableOpacity>
          {expandedSections.description && (
            <Text style={styles.sectionContent}>{product.description}</Text>
          )}
        </View>

        {/* Usage */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => toggleSection('usage')}
          >
            <Text style={styles.sectionTitle}>გამოყენება</Text>
            <Ionicons
              name={expandedSections.usage ? "chevron-up" : "chevron-down"}
              size={20}
              color={theme.colors.text.secondary}
            />
          </TouchableOpacity>
          {expandedSections.usage && (
            <Text style={styles.sectionContent}>{product.usage}</Text>
          )}
        </View>

        {/* Side Effects */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => toggleSection('sideEffects')}
          >
            <Text style={styles.sectionTitle}>გვერდითი მოვლენები</Text>
            <Ionicons
              name={expandedSections.sideEffects ? "chevron-up" : "chevron-down"}
              size={20}
              color={theme.colors.text.secondary}
            />
          </TouchableOpacity>
          {expandedSections.sideEffects && (
            <View style={styles.listContainer}>
              {product.sideEffects.map((effect, index) => (
                <View key={index} style={styles.listItem}>
                  <Text style={styles.listBullet}>•</Text>
                  <Text style={styles.listText}>{effect}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Contraindications */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => toggleSection('contraindications')}
          >
            <Text style={styles.sectionTitle}>უკუჩვენებები</Text>
            <Ionicons
              name={expandedSections.contraindications ? "chevron-up" : "chevron-down"}
              size={20}
              color={theme.colors.text.secondary}
            />
          </TouchableOpacity>
          {expandedSections.contraindications && (
            <View style={styles.listContainer}>
              {product.contraindications.map((contra, index) => (
                <View key={index} style={styles.listItem}>
                  <Text style={styles.listBullet}>•</Text>
                  <Text style={styles.listText}>{contra}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Storage Conditions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>შენახვის პირობები</Text>
          <Text style={styles.sectionContent}>{product.storageConditions}</Text>
        </View>

        {/* Similar Products */}
        {similarProducts.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>მსგავსი პროდუქტები</Text>
            <ProductsSlider
              title=""
              products={similarProducts.map(p => ({
                id: p.id,
                name: p.name,
                currentPrice: p.price,
                image: p.imageUrl,
                onAddToCart: () => {},
                onToggleWishlist: () => {},
                isInWishlist: false,
                onPress: () => onProductPress(p.id),
              }))}
              onProductPress={(product: any) => onProductPress(product.id)}
            />
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom Action Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.priceInfo}>
          <Text style={styles.bottomPriceLabel}>ჯამური ფასი</Text>
          <Text style={styles.bottomPrice}>₾{(product.price * quantity).toFixed(2)}</Text>
        </View>
        <TouchableOpacity
          style={[styles.addToCartButton, product.stockQuantity === 0 && styles.addToCartButtonDisabled]}
          onPress={handleAddToCart}
          disabled={product.stockQuantity === 0}
        >
          <Ionicons name="cart" size={20} color={theme.colors.white} />
          <Text style={styles.addToCartButtonText}>კალათაში დამატება</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom Navigation */}
      <BottomNavigation
        activeTab="home"
        onHomePress={onHomePress}
        onWishlistPress={onWishlistPress}
        onCategoriesPress={onCategoriesPress}
        onCartPress={onCartPress}
        onProfilePress={onProfilePress}
        wishlistCount={favoriteCount}
        cartCount={itemCount}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginTop: 16,
    marginBottom: 24,
  },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: theme.colors.primary,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.white,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray[100],
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  content: {
    flex: 1,
  },
  imageContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH,
    backgroundColor: theme.colors.gray[50],
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  discountBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    zIndex: 1,
    backgroundColor: theme.colors.error,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  discountText: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.white,
  },
  infoSection: {
    padding: 20,
    borderBottomWidth: 8,
    borderBottomColor: theme.colors.gray[50],
  },
  productName: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  productNameEn: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    marginBottom: 12,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  ratingStars: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginRight: 8,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  reviewCount: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  currentPrice: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  oldPrice: {
    fontSize: 18,
    color: theme.colors.text.tertiary,
    textDecorationLine: 'line-through',
  },
  stockContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  stockText: {
    fontSize: 14,
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray[100],
  },
  infoLabel: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
    flex: 1,
    textAlign: 'right',
  },
  prescriptionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    padding: 12,
    backgroundColor: theme.colors.warning + '15',
    borderRadius: 8,
  },
  prescriptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.warning,
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray[100],
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 12,
  },
  sectionContent: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    lineHeight: 22,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  optionChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: theme.colors.gray[50],
    borderWidth: 1,
    borderColor: theme.colors.gray[200],
  },
  optionChipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  optionChipText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    fontWeight: '500',
  },
  optionChipTextActive: {
    color: theme.colors.white,
    fontWeight: '600',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  quantityButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonDisabled: {
    opacity: 0.5,
  },
  quantityText: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
    minWidth: 40,
    textAlign: 'center',
  },
  listContainer: {
    gap: 8,
  },
  listItem: {
    flexDirection: 'row',
    gap: 8,
  },
  listBullet: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  listText: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.text.secondary,
    lineHeight: 20,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.gray[100],
    backgroundColor: theme.colors.white,
  },
  priceInfo: {
    flex: 1,
  },
  bottomPriceLabel: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    marginBottom: 4,
  },
  bottomPrice: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  addToCartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: theme.colors.primary,
  },
  addToCartButtonDisabled: {
    opacity: 0.5,
  },
  addToCartButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.white,
  },
});
