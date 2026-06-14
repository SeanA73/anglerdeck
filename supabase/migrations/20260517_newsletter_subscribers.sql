-- Newsletter subscribers table
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL CHECK (
    char_length(email) BETWEEN 5 AND 254
    AND email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
  ),
  subscribed_at TIMESTAMPTZ DEFAULT NOW(),
  source TEXT DEFAULT 'website' CHECK (char_length(source) <= 50),
  is_active BOOLEAN DEFAULT true,
  unsubscribed_at TIMESTAMPTZ,
  UNIQUE(email)
);

ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Allow anonymous + authenticated subscriptions, but format validation
-- happens at the column CHECK level above.
DROP POLICY IF EXISTS "Anyone can subscribe" ON newsletter_subscribers;
CREATE POLICY "Allow newsletter subscription"
  ON newsletter_subscribers FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- No one can read except service_role (which bypasses RLS).
DROP POLICY IF EXISTS "No public reads" ON newsletter_subscribers;
CREATE POLICY "No public reads"
  ON newsletter_subscribers FOR SELECT
  USING (false);

-- No one can update or delete except service_role.
-- (No policies for UPDATE/DELETE = no access for anon/authenticated.)

CREATE INDEX IF NOT EXISTS idx_newsletter_email ON newsletter_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_newsletter_active ON newsletter_subscribers(is_active);