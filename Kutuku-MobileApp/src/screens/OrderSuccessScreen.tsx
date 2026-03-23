import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/src/theme';

type OrderSuccessScreenProps = {
  /** სერვერიდან მიღებული შეკვეთის ID */
  orderId?: string;
  onOrderTracking: () => void;
  onBackToHome: () => void;
};

export function OrderSuccessScreen({ orderId, onOrderTracking, onBackToHome }: OrderSuccessScreenProps) {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.white} />
      
      {/* Success Illustration */}
      <View style={styles.content}>
        <View style={styles.illustrationContainer}>
          <View style={styles.illustration}>
            <View style={styles.illustrationCircle}>
              <Ionicons name="checkmark" size={60} color={theme.colors.white} />
            </View>
            {/* Decorative elements */}
            <View style={[styles.decorCircle, styles.decorCircle1]} />
            <View style={[styles.decorCircle, styles.decorCircle2]} />
            <View style={[styles.decorCircle, styles.decorCircle3]} />
          </View>
        </View>

        <Text style={styles.title}>შეკვეთა მიღებულია</Text>
        {orderId ? (
          <Text style={styles.orderIdText} selectable>
            № {orderId}
          </Text>
        ) : null}
        <Text style={styles.message}>
          შეკვეთა გადაეცა სისტემას. მალე დაგიკავშირდებით ან შეგიძლიათ სტატუსი იხილოთ ტრეკინგში.
        </Text>
      </View>

      {/* Buttons */}
      <View style={styles.bottomSection}>
        <TouchableOpacity style={styles.trackingButton} onPress={onOrderTracking}>
          <Text style={styles.trackingButtonText}>შეკვეთის ტრეკინგი</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.homeButton} onPress={onBackToHome}>
          <Text style={styles.homeButtonText}>მთავარ გვერდზე</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.white,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  illustrationContainer: {
    marginBottom: 40,
  },
  illustration: {
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  illustrationCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  decorCircle: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary + '30',
  },
  decorCircle1: {
    top: 20,
    right: 10,
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  decorCircle2: {
    bottom: 30,
    left: 0,
    width: 35,
    height: 35,
    borderRadius: 17.5,
  },
  decorCircle3: {
    top: 60,
    left: 10,
    width: 25,
    height: 25,
    borderRadius: 12.5,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  orderIdText: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    marginBottom: 14,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  message: {
    fontSize: 14,
    lineHeight: 22,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  bottomSection: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 12,
  },
  trackingButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  trackingButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.white,
  },
  homeButton: {
    backgroundColor: theme.colors.gray[100],
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  homeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
});
