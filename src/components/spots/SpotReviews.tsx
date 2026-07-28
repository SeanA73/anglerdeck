import { useSpotReviews } from '@/hooks/useSpotReviews';
import { useReviewVotes } from '@/hooks/useReviewVotes';
import { StarRating } from './StarRating';
import { ReviewForm } from './ReviewForm';
import { ReviewCard } from './ReviewCard';
import { MessageSquare } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useMemo } from 'react';

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

  const reviewIds = useMemo(() => reviews.map(r => r.id), [reviews]);
  const { votesData, toggleVote } = useReviewVotes(reviewIds);

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
          <div className="text-center py-8 px-4">
            <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30 text-muted-foreground" />
            <p className="text-foreground font-medium">
              No one has reported from {spotTitle} yet
            </p>
            <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
              If you've fished here, a few lines genuinely helps the next angler —
              what was biting, how the access held up, what you'd do differently.
              Two minutes is plenty.
            </p>
            <p className="text-sm text-accent mt-3">
              We give a free month of Pro for three helpful reports.
            </p>
          </div>
        ) : (
          reviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              onDelete={deleteReview}
              voteData={votesData.get(review.id)}
              onToggleVote={toggleVote}
            />
          ))
        )}
      </div>
    </div>
  );
};

