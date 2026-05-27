-- Newsletter subscribers table
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  subscribed_at TIMESTAMPTZ DEFAULT NOW(),
  source TEXT DEFAULT 'website',         -- 'website', 'footer', 'spot_detail', etc.
  is_active BOOLEAN DEFAULT true,
  unsubscribed_at TIMESTAMPTZ,
  UNIQUE(email)
);

-- Only admins / service role can read the list; anyone can insert their own email
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can subscribe"
  ON newsletter_subscribers FOR INSERT
  WITH CHECK (true);

-- Users cannot read or modify other subscribers' rows
CREATE POLICY "No public reads"
  ON newsletter_subscribers FOR SELECT
  USING (false);

CREATE INDEX IF NOT EXISTS idx_newsletter_email ON newsletter_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_newsletter_active  ON newsletter_subscribers(is_active);
