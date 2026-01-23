import { useSpotReviews } from '@/hooks/useSpotReviews';
import { StarRating } from './StarRating';
import { ReviewForm } from './ReviewForm';
import { ReviewCard } from './ReviewCard';
import { MessageSquare } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface SpotReviewsProps {
  spotId: number;
  spotTitle: string;
}

export const SpotReviews = ({ spotId, spotTitle }: SpotReviewsProps) => {
  const {
    reviews,
    loading,
    submitting,
    averageRating,
    reviewCount,
    submitReview,
    deleteReview,
  } = useSpotReviews(spotId);

  return (
    <div className="space-y-6">
      {/* Header with average rating */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h3 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            Reviews & Ratings
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            What anglers are saying about {spotTitle}
          </p>
        </div>
        
        {reviewCount > 0 && (
          <div className="flex items-center gap-3 bg-card/50 backdrop-blur-sm rounded-lg px-4 py-2 border border-border/50">
            <StarRating rating={averageRating} size="md" />
            <div className="text-right">
              <div className="font-semibold text-foreground">
                {averageRating.toFixed(1)}
              </div>
              <div className="text-xs text-muted-foreground">
                {reviewCount} {reviewCount === 1 ? 'review' : 'reviews'}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Review form */}
      <ReviewForm onSubmit={submitReview} submitting={submitting} />

      {/* Reviews list */}
      <div className="space-y-4">
        {loading ? (
          <>
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </>
        ) : reviews.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No reviews yet. Be the first to share your experience!</p>
          </div>
        ) : (
          reviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              onDelete={deleteReview}
            />
          ))
        )}
      </div>
    </div>
  );
};
