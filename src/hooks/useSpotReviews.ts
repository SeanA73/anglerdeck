import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface SpotReview {
  id: string;
  spot_id: number;
  user_id: string | null;
  author_name: string;
  rating: number;
  title: string | null;
  content: string;
  visit_date: string | null;
  created_at: string;
  photo_urls: string[] | null;
}

export const useSpotReviews = (spotId: number) => {
  const { user, profile } = useAuth();
  const [reviews, setReviews] = useState<SpotReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchReviews = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('spot_reviews')
        .select('*')
        .eq('spot_id', spotId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReviews(data || []);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  }, [spotId]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  const submitReview = async (data: {
    rating: number;
    title?: string;
    content: string;
    visitDate?: string;
    photoUrls?: string[];
  }) => {
    setSubmitting(true);
    try {
      const { error } = await supabase.from('spot_reviews').insert({
        spot_id: spotId,
        user_id: user?.id || null,
        author_name: profile?.display_name || 'Anonymous Angler',
        rating: data.rating,
        title: data.title || null,
        content: data.content,
        visit_date: data.visitDate || null,
        photo_urls: data.photoUrls || [],
      });

      if (error) throw error;
      
      toast.success('Review submitted successfully!');
      await fetchReviews();
      return true;
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error('Failed to submit review');
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  const deleteReview = async (reviewId: string) => {
    try {
      const { error } = await supabase
        .from('spot_reviews')
        .delete()
        .eq('id', reviewId);

      if (error) throw error;
      
      toast.success('Review deleted');
      await fetchReviews();
    } catch (error) {
      console.error('Error deleting review:', error);
      toast.error('Failed to delete review');
    }
  };

  return {
    reviews,
    loading,
    submitting,
    averageRating,
    reviewCount: reviews.length,
    submitReview,
    deleteReview,
    userReview: reviews.find(r => r.user_id === user?.id),
  };
};