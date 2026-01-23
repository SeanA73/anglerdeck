import { format } from 'date-fns';
import { StarRating } from './StarRating';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Calendar, Trash2 } from 'lucide-react';
import { SpotReview } from '@/hooks/useSpotReviews';
import { useAuth } from '@/contexts/AuthContext';

interface ReviewCardProps {
  review: SpotReview;
  onDelete?: (id: string) => void;
}

export const ReviewCard = ({ review, onDelete }: ReviewCardProps) => {
  const { user } = useAuth();
  const isOwner = user?.id === review.user_id;

  return (
    <Card className="border-border/50 bg-card/30 backdrop-blur-sm">
      <CardContent className="pt-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <Avatar className="w-10 h-10">
              <AvatarFallback className="bg-primary/10 text-primary text-sm">
                {review.author_name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-foreground">
                  {review.author_name}
                </span>
                <StarRating rating={review.rating} size="sm" />
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                <span>{format(new Date(review.created_at), 'MMM d, yyyy')}</span>
                {review.visit_date && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Visited {format(new Date(review.visit_date), 'MMM yyyy')}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          {isOwner && onDelete && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={() => onDelete(review.id)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>

        {review.title && (
          <h4 className="font-medium mt-3 text-foreground">{review.title}</h4>
        )}
        
        <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
          {review.content}
        </p>
      </CardContent>
    </Card>
  );
};
