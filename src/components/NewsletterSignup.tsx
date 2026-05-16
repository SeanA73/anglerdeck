import { useState, FormEvent } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { trackEvent } from '@/lib/analytics';

interface NewsletterSignupProps {
  className?: string;
  compact?: boolean;
}

export const NewsletterSignup = ({ className = '', compact = false }: NewsletterSignupProps) => {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleEmailSignup = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // Wire to Mailchimp, ConvertKit, or Resend API when ready
      trackEvent('newsletter_signup', { email_domain: email.split('@')[1] });
      toast.success('Thanks! Check your inbox for weekly fishing tips.');
      setEmail('');
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
