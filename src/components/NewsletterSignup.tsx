import { useState, FormEvent } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { trackEvent } from '@/lib/analytics';
import { supabase } from '@/integrations/supabase/client';

interface NewsletterSignupProps {
  className?: string;
  compact?: boolean;
  source?: string;
}

export const NewsletterSignup = ({ className = '', compact = false, source = 'website' }: NewsletterSignupProps) => {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleEmailSignup = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('newsletter_subscribers')
        .insert({ email: email.trim().toLowerCase(), source })
        .select()
        .single();

      if (error) {
        // Unique constraint → already subscribed
        if (error.code === '23505') {
          toast.info("You're already subscribed — we'll keep the tips coming!");
        } else {
          throw error;
        }
      } else {
        trackEvent('newsletter_signup', { email_domain: email.split('@')[1], source });
        toast.success('You\'re in! Weekly fishing tips coming your way.');
      }
      setEmail('');
    } catch (err) {
      console.error('Newsletter signup error:', err);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleEmailSignup} className={`flex gap-2 ${compact ? 'flex-col sm:flex-row' : ''} ${className}`}>
      <Input
        type="email"
        placeholder="Get weekly fishing tips & hot spots..."
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="flex-1"
        required
        disabled={submitting}
      />
      <Button type="submit" disabled={submitting} className="shrink-0">
        Subscribe
      </Button>
    </form>
  );
};
