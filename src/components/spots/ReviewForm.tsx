import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { StarRating } from './StarRating';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Send } from 'lucide-react';

interface ReviewFormProps {
  onSubmit: (data: {
    rating: number;
    title?: string;
    content: string;
    visitDate?: string;
  }) => Promise<boolean>;
  submitting: boolean;
}

export const ReviewForm = ({ onSubmit, submitting }: ReviewFormProps) => {
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [visitDate, setVisitDate] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (rating === 0) {
      return;
    }

    const success = await onSubmit({
      rating,
      title: title.trim() || undefined,
      content: content.trim(),
      visitDate: visitDate || undefined,
    });

    if (success) {
      setRating(0);
      setTitle('');
      setContent('');
      setVisitDate('');
    }
  };

  return (
    <Card className="border-primary/20 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <Send className="w-5 h-5 text-primary" />
          Write a Review
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Your Rating *</Label>
            <StarRating
              rating={rating}
              size="lg"
              interactive
              onRatingChange={setRating}
            />
            {rating === 0 && (
              <p className="text-xs text-muted-foreground">Click to rate</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Review Title</Label>
            <Input
              id="title"
              placeholder="Sum up your experience"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Your Review *</Label>
            <Textarea
              id="content"
              placeholder="Share details about your fishing experience at this spot..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              required
              maxLength={1000}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="visitDate" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              When did you visit?
            </Label>
            <Input
              id="visitDate"
              type="date"
              value={visitDate}
              onChange={(e) => setVisitDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
            />
          </div>

          <Button
            type="submit"
            disabled={submitting || rating === 0 || !content.trim()}
            className="w-full"
          >
            {submitting ? 'Submitting...' : 'Submit Review'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
