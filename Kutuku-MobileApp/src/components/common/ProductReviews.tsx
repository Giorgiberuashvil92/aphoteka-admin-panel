import { theme } from '@/src/theme';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface Review {
  id: string;
  userName: string;
  rating: number;
  date: string;
  comment: string;
  helpful: number;
}

interface ProductReviewsProps {
  reviews: Review[];
  averageRating: number;
  totalReviews: number;
  onWriteReview?: () => void;
}

export function ProductReviews({
  reviews,
  averageRating,
  totalReviews,
  onWriteReview,
}: ProductReviewsProps) {
  const [expandedReviews, setExpandedReviews] = useState<Set<string>>(new Set());

  const toggleReview = (reviewId: string) => {
    setExpandedReviews(prev => {
      const newSet = new Set(prev);
      if (newSet.has(reviewId)) {
        newSet.delete(reviewId);
      } else {
        newSet.add(reviewId);
      }
      return newSet;
    });
  };

  const renderStars = (rating: number, size: number = 16) => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map(star => (
          <Ionicons
            key={star}
            name={star <= rating ? 'star' : 'star-outline'}
            size={size}
            color={star <= rating ? theme.colors.warning : theme.colors.gray[400]}
          />
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>შეფასებები და მიმოხილვები</Text>
        <TouchableOpacity style={styles.writeReviewButton} onPress={onWriteReview}>
          <Ionicons name="create-outline" size={18} color={theme.colors.primary} />
          <Text style={styles.writeReviewText}>დაწერე მიმოხილვა</Text>
        </TouchableOpacity>
      </View>

      {/* Rating Summary */}
      <View style={styles.ratingSummary}>
        <View style={styles.averageRatingContainer}>
          <Text style={styles.averageRatingNumber}>{averageRating.toFixed(1)}</Text>
          {renderStars(Math.round(averageRating), 20)}
          <Text style={styles.totalReviews}>{totalReviews} შეფასება</Text>
        </View>
      </View>

      {/* Reviews List */}
      <ScrollView style={styles.reviewsList} nestedScrollEnabled>
        {reviews.map(review => (
          <View key={review.id} style={styles.reviewCard}>
            <View style={styles.reviewHeader}>
              <View style={styles.reviewUserInfo}>
                <View style={styles.userAvatar}>
                  <Text style={styles.userAvatarText}>
                    {review.userName.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View>
                  <Text style={styles.userName}>{review.userName}</Text>
                  <Text style={styles.reviewDate}>{review.date}</Text>
                </View>
              </View>
              {renderStars(review.rating)}
            </View>

            <Text
              style={styles.reviewComment}
              numberOfLines={expandedReviews.has(review.id) ? undefined : 3}
            >
              {review.comment}
            </Text>

            {review.comment.length > 100 && (
              <TouchableOpacity onPress={() => toggleReview(review.id)}>
                <Text style={styles.readMoreText}>
                  {expandedReviews.has(review.id) ? 'ნაკლები' : 'მეტის ნახვა'}
                </Text>
              </TouchableOpacity>
            )}

            <View style={styles.reviewFooter}>
              <TouchableOpacity style={styles.helpfulButton}>
                <Ionicons name="thumbs-up-outline" size={16} color={theme.colors.text.secondary} />
                <Text style={styles.helpfulText}>სასარგებლო ({review.helpful})</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.white,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  writeReviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  writeReviewText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.primary,
  },
  ratingSummary: {
    backgroundColor: theme.colors.gray[100],
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  averageRatingContainer: {
    alignItems: 'center',
    gap: 8,
  },
  averageRatingNumber: {
    fontSize: 36,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 4,
  },
  totalReviews: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  reviewsList: {
    maxHeight: 400,
  },
  reviewCard: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray[200],
    paddingVertical: 16,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  reviewUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userAvatarText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.white,
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  reviewDate: {
    fontSize: 12,
    color: theme.colors.text.secondary,
  },
  reviewComment: {
    fontSize: 14,
    color: theme.colors.text.primary,
    lineHeight: 20,
    marginBottom: 8,
  },
  readMoreText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.primary,
    marginBottom: 8,
  },
  reviewFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  helpfulButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  helpfulText: {
    fontSize: 12,
    color: theme.colors.text.secondary,
  },
});
