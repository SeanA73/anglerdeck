import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// Generate or retrieve a session ID for anonymous voting
const getSessionId = (): string => {
  let sessionId = localStorage.getItem('review_vote_session');
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem('review_vote_session', sessionId);
  }
  return sessionId;
};

export interface ReviewVoteData {
  reviewId: string;
  helpfulCount: number;
  userVoted: boolean;
}

export const useReviewVotes = (reviewIds: string[]) => {
  const { user } = useAuth();
  const [votesData, setVotesData] = useState<Map<string, ReviewVoteData>>(new Map());
  const [loading, setLoading] = useState(true);

  // Stable key for the reviewIds array so useEffect deps are statically checkable
  const reviewIdsKey = useMemo(() => reviewIds.join(','), [reviewIds]);

  const fetchVotes = useCallback(async () => {
    if (reviewIds.length === 0) {
      setLoading(false);
      return;
    }

    try {
      // Get vote counts for all reviews
      const { data: votes, error } = await supabase
        .from('review_votes')
        .select('review_id, is_helpful, user_id, session_id')
        .in('review_id', reviewIds);

      if (error) throw error;

      const sessionId = getSessionId();
      const newVotesData = new Map<string, ReviewVoteData>();

      // Initialize all reviews
      reviewIds.forEach(id => {
        newVotesData.set(id, {
          reviewId: id,
          helpfulCount: 0,
          userVoted: false,
        });
      });

      // Process votes
      votes?.forEach(vote => {
        const current = newVotesData.get(vote.review_id);
        if (current) {
          if (vote.is_helpful) {
            current.helpfulCount++;
          }
          // Check if current user has voted
          if (user?.id && vote.user_id === user.id) {
            current.userVoted = true;
          } else if (!user?.id && vote.session_id === sessionId) {
            current.userVoted = true;
          }
        }
      });

      setVotesData(newVotesData);
    } catch (error) {
      console.error('Error fetching votes:', error);
    } finally {
      setLoading(false);
    }
  }, [reviewIds, user?.id]);

  useEffect(() => {
    fetchVotes();
  }, [fetchVotes, reviewIdsKey]);

  const toggleVote = async (reviewId: string) => {
    const currentData = votesData.get(reviewId);
    if (!currentData) return;

    const sessionId = getSessionId();

    try {
      if (currentData.userVoted) {
        // Remove vote
        let query = supabase
          .from('review_votes')
          .delete()
          .eq('review_id', reviewId);

        if (user?.id) {
          query = query.eq('user_id', user.id);
        } else {
          query = query.eq('session_id', sessionId);
        }

        const { error } = await query;
        if (error) throw error;
      } else {
        // Add vote
        const { error } = await supabase.from('review_votes').insert({
          review_id: reviewId,
          user_id: user?.id || null,
          session_id: user?.id ? null : sessionId,
          is_helpful: true,
        });
        if (error) throw error;
      }

      // Optimistic update
      setVotesData(prev => {
        const newMap = new Map(prev);
        const current = newMap.get(reviewId);
        if (current) {
          newMap.set(reviewId, {
            ...current,
            helpfulCount: current.userVoted 
              ? current.helpfulCount - 1 
              : current.helpfulCount + 1,
            userVoted: !current.userVoted,
          });
        }
        return newMap;
      });
    } catch (error) {
      console.error('Error toggling vote:', error);
      // Refetch on error
      await fetchVotes();
    }
  };

  return {
    votesData,
    loading,
    toggleVote,
  };
};