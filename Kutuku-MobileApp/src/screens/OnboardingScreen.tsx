import { Button } from '@/src/components/ui';
import { theme } from '@/src/theme';
import { useState } from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width } = Dimensions.get('window');

const onboardingData = [
  {
    id: 1,
    title: 'ონლაინ აფთიაქი თქვენი ჯანმრთელობისთვის',
    description: 'შეიძინეთ მედიკამენტები და ჯანმრთელობის პროდუქტები სახლიდან გაუსვლელად. სწრაფი მიწოდება მთელი საქართველოს მასშტაბით.',
    image: '💊', // Medicine pills
  },
  {
    id: 2,
    title: 'ფართო არჩევანი და დაბალი ფასები',
    description: 'ათასობით პროდუქტი, ექსკლუზიური შეთავაზებები და აქციები. ყოველდღიური ფასდაკლებები თქვენი ჯანმრთელობისთვის.',
    image: '🏥', // Hospital/Pharmacy
  },
  {
    id: 3,
    title: 'პროფესიონალური კონსულტაცია',
    description: 'მიიღეთ რჩევა ჩვენი ფარმაცევტებისგან და იპოვეთ თქვენთვის შესაფერისი მედიკამენტები. ჩვენ ვზრუნავთ თქვენს ჯანმრთელობაზე.',
    image: '⚕️', // Medical symbol
  },
];

type OnboardingScreenProps = {
  onComplete: () => void;
  onSkip: () => void;
};

export function OnboardingScreen({ onComplete, onSkip }: OnboardingScreenProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const isLastSlide = currentIndex === onboardingData.length - 1;

  const handleNext = () => {
    if (isLastSlide) {
      onComplete();
    } else {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const currentSlide = onboardingData[currentIndex];

  return (
    <View style={styles.container}>
      {/* Image placeholder */}
      <View style={styles.imageContainer}>
        <View style={styles.imagePlaceholder}>
          <Text style={styles.imageEmoji}>{currentSlide.image}</Text>
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.title}>{currentSlide.title}</Text>
        <Text style={styles.description}>{currentSlide.description}</Text>

        {/* Pagination dots */}
        <View style={styles.pagination}>
          {onboardingData.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                index === currentIndex && styles.activeDot,
              ]}
            />
          ))}
        </View>

        {/* Button */}
        <Button
          title={isLastSlide ? "დაწყება" : "შემდეგი"}
          onPress={handleNext}
          size="lg"
        />

        {/* Already have account */}
        <TouchableOpacity onPress={onSkip} style={styles.skipButton}>
          <Text style={styles.skipText}>უკვე გაქვთ ანგარიში?</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.white,
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: theme.spacing.xxxl,
  },
  imagePlaceholder: {
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: theme.borderRadius.xl,
    backgroundColor: theme.colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageEmoji: {
    fontSize: 80,
  },
  content: {
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: theme.spacing.xxxl,
    paddingTop: theme.spacing.xl,
  },
  title: {
    fontSize: theme.typography.fontSize.xxl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  description: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: theme.typography.fontSize.sm * theme.typography.lineHeight.relaxed,
    marginBottom: theme.spacing.xl,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.gray[300],
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: theme.colors.primary,
    width: 24,
  },
  skipButton: {
    marginTop: theme.spacing.md,
    alignItems: 'center',
  },
  skipText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.secondary,
    textDecorationLine: 'underline',
  },
});
