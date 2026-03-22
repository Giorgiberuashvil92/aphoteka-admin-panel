import { useCart } from '@/src/contexts';
import { ProductService } from '@/src/services/product.service';
import { theme } from '@/src/theme';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Modal,
  PanResponder,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const BOTTOM_SHEET_MAX_HEIGHT = SCREEN_HEIGHT * 0.75;
const BOTTOM_SHEET_MIN_HEIGHT = SCREEN_HEIGHT * 0.6;

/** ბაზიდან მოდის dosageForm (tablet, ტაბლეტი, syrup...) → ფორმის ლეიბლი ფურცელზე */
function dosageFormToLabel(form: string | undefined): string {
  if (!form || !form.trim()) return 'აბი';
  const f = form.toLowerCase().trim();
  if (f === 'tablet' || f === 'ტაბლეტი' || f === 'აბი') return 'აბი';
  if (f === 'capsule' || f === 'კაფსული' || f === 'კაფსულა') return 'კაფსული';
  if (f === 'syrup' || f === 'სიროფი') return 'სიროფი';
  if (f === 'injection' || f === 'ინექცია') return 'ინექცია';
  if (f === 'cream' || f === 'კრემი') return 'კრემი';
  return form;
}

const FORM_OPTIONS = ['აბი', 'კაფსული', 'სიროფი', 'ინექცია', 'კრემი'];

interface ProductBottomSheetProps {
  visible: boolean;
  product: {
    id: string;
    name: string;
    price: number;
    originalPrice?: number;
    discount?: number;
    image: string;
    rating?: number;
    reviewCount?: number;
    stock?: number;
    description?: string;
  } | null;
  onClose: () => void;
  onAddToCart?: () => void;
}

export function ProductBottomSheet({
  visible,
  product,
  onClose,
  onAddToCart,
}: ProductBottomSheetProps) {
  const { addToCart } = useCart();
  const animatedValue = useRef(new Animated.Value(0)).current;
  const [quantity, setQuantity] = useState(1);
  const [selectedPackage, setSelectedPackage] = useState('1 ცალი');
  const [selectedForm, setSelectedForm] = useState('აბი');
  const [productDetails, setProductDetails] = useState<{ dosageForm: string; packSize: string; description?: string } | null>(null);

  useEffect(() => {
    if (visible && product?.id) {
      setQuantity(1);
      setSelectedPackage('1 ცალი');
      setSelectedForm('აბი');
      setProductDetails(null);
      ProductService.getProductById(product.id).then((p) => {
        if (!p) return;
        const packSize = p.packSize?.trim();
        const dosageForm = p.dosageForm?.trim();
        setProductDetails({
          dosageForm: dosageForm || '',
          packSize: packSize || '',
          description: p.description || undefined,
        });
        setSelectedPackage(packSize || '1 ცალი');
        setSelectedForm(dosageFormToLabel(dosageForm));
      });
    }
  }, [visible, product?.id]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return gestureState.dy > 5;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          animatedValue.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 100) {
          closeModal();
        } else {
          Animated.spring(animatedValue, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  useEffect(() => {
    if (visible) {
      openModal();
    } else {
      animatedValue.setValue(BOTTOM_SHEET_MAX_HEIGHT);
    }
  }, [visible]);

  const openModal = () => {
    Animated.spring(animatedValue, {
      toValue: 0,
      tension: 50,
      friction: 8,
      useNativeDriver: true,
    }).start();
  };

  const closeModal = () => {
    Animated.timing(animatedValue, {
      toValue: BOTTOM_SHEET_MAX_HEIGHT,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      onClose();
    });
  };

  const handleAddToCart = () => {
    if (!product) return;

    if (onAddToCart) {
      onAddToCart();
    } else {
      addToCart(
        {
          id: product.id,
          name: product.name,
          price: product.price,
          originalPrice: product.originalPrice,
          discount: product.discount,
          image: product.image,
          packageSize: selectedPackage,
          form: selectedForm,
          maxQuantity: product.stock,
        },
        quantity
      );
    }
    closeModal();
  };

  if (!product) return null;

  const packageOptions =
    productDetails?.packSize ? [productDetails.packSize] : ['1 ცალი'];
  const displayDescription = productDetails?.description ?? product.description;

  const translateY = animatedValue.interpolate({
    inputRange: [0, BOTTOM_SHEET_MAX_HEIGHT],
    outputRange: [0, BOTTOM_SHEET_MAX_HEIGHT],
    extrapolate: 'clamp',
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={closeModal}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={closeModal}
        />

        <Animated.View
          style={[
            styles.bottomSheet,
            {
              transform: [{ translateY }],
            },
          ]}
        >
          {/* Drag Handle */}
          <View {...panResponder.panHandlers} style={styles.dragHandleContainer}>
            <View style={styles.dragHandle} />
          </View>

          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {/* Product Header */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <Text style={styles.productName} numberOfLines={2}>
                  {product.name}
                </Text>
                {product.rating && (
                  <View style={styles.ratingContainer}>
                    <Ionicons name="star" size={16} color={theme.colors.warning} />
                    <Text style={styles.ratingText}>
                      {product.rating.toFixed(1)}
                    </Text>
                    {product.reviewCount && (
                      <Text style={styles.reviewCount}>
                        ({product.reviewCount} Review)
                      </Text>
                    )}
                  </View>
                )}
              </View>

              {/* Quantity Controls */}
              <View style={styles.quantityControls}>
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => setQuantity(Math.max(1, quantity - 1))}
                >
                  <Ionicons name="remove" size={20} color={theme.colors.text.primary} />
                </TouchableOpacity>
                <Text style={styles.quantityText}>{quantity}</Text>
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => setQuantity(quantity + 1)}
                >
                  <Ionicons name="add" size={20} color={theme.colors.text.primary} />
                </TouchableOpacity>
              </View>
            </View>

            {product.stock && (
              <Text style={styles.stockText}>მარაგშია</Text>
            )}

            {/* Package Selection (ბაზიდან packSize) */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>შეფუთვა</Text>
              <View style={styles.optionsContainer}>
                {packageOptions.map((pkg) => (
                  <TouchableOpacity
                    key={pkg}
                    style={[
                      styles.optionButton,
                      selectedPackage === pkg && styles.optionButtonActive,
                    ]}
                    onPress={() => setSelectedPackage(pkg)}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        selectedPackage === pkg && styles.optionTextActive,
                      ]}
                    >
                      {pkg}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Form Selection (ბაზიდან dosageForm) */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>ფორმა</Text>
              <View style={styles.optionsContainer}>
                {FORM_OPTIONS.map((form) => (
                  <TouchableOpacity
                    key={form}
                    style={[
                      styles.optionButton,
                      selectedForm === form && styles.optionButtonActive,
                    ]}
                    onPress={() => setSelectedForm(form)}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        selectedForm === form && styles.optionTextActive,
                      ]}
                    >
                      {form}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Description (ბაზიდან) */}
            {displayDescription && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>აღწერა</Text>
                <Text style={styles.description} numberOfLines={4}>
                  {displayDescription}
                </Text>
                <TouchableOpacity>
                  <Text style={styles.readMore}>Read More</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>

          {/* Bottom Actions */}
          <View style={styles.bottomActions}>
            {/* Buy Now Button */}
            <TouchableOpacity
              style={styles.buyNowButton}
              onPress={handleAddToCart}
            >
              <Text style={styles.buyNowText}>ყიდვა</Text>
            </TouchableOpacity>

            {/* Bottom Action Bar */}
            <View style={styles.bottomAction}>
              <View style={styles.priceContainer}>
                <Text style={styles.price}>
                  ₾{(product.price * quantity).toFixed(2)}
                </Text>
                {product.originalPrice && (
                  <Text style={styles.originalPrice}>
                    ₾{(product.originalPrice * quantity).toFixed(2)}
                  </Text>
                )}
              </View>
              <TouchableOpacity
                style={styles.addToCartButton}
                onPress={handleAddToCart}
              >
                <Ionicons name="cart-outline" size={20} color={theme.colors.text.primary} />
                <Text style={styles.addToCartText}>კალათაში დამატება</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.wishlistIconButton}>
                <Ionicons name="heart-outline" size={24} color={theme.colors.text.primary} />
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  bottomSheet: {
    backgroundColor: theme.colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    minHeight: BOTTOM_SHEET_MIN_HEIGHT,
    maxHeight: BOTTOM_SHEET_MAX_HEIGHT,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
  },
  dragHandleContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: theme.colors.gray[400],
    borderRadius: 2,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  headerLeft: {
    flex: 1,
    marginRight: 16,
  },
  productName: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  reviewCount: {
    fontSize: 13,
    color: theme.colors.text.secondary,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: theme.colors.gray[300],
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  quantityButton: {
    padding: 4,
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    minWidth: 24,
    textAlign: 'center',
  },
  stockText: {
    fontSize: 13,
    color: theme.colors.success,
    fontWeight: '500',
    marginBottom: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 12,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: theme.colors.gray[300],
    backgroundColor: theme.colors.white,
  },
  optionButtonActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.purple[100],
  },
  optionText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text.primary,
  },
  optionTextActive: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    color: theme.colors.text.secondary,
    marginBottom: 8,
  },
  readMore: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  bottomActions: {
    gap: 12,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  buyNowButton: {
    width: '100%',
    backgroundColor: theme.colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buyNowText: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.white,
  },
  bottomAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.gray[200],
    backgroundColor: theme.colors.white,
    borderRadius: 12,
  },
  priceContainer: {
    gap: 4,
  },
  price: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  originalPrice: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text.secondary,
    textDecorationLine: 'line-through',
  },
  addToCartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: theme.colors.white,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: theme.colors.gray[300],
  },
  addToCartText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  wishlistIconButton: {
    padding: 8,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: theme.colors.gray[300],
    backgroundColor: theme.colors.white,
  },
});
