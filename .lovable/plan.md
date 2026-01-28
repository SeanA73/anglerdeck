
# ReelSpot Monetization & UX Improvement Plan

## Overview
Transform ReelSpot from a feature-complete demo into a revenue-generating fishing platform with proper payment processing, usage tracking, and enhanced user engagement features.

---

## Phase 1: Critical Payment Infrastructure (Priority: High)

### 1.1 Enable Stripe Integration
**What we'll do:**
- Enable Stripe through Lovable's built-in integration
- Create edge functions for checkout sessions and webhooks
- Set up products and prices in Stripe for Pro ($9.99/mo) and Elite ($29.99/mo) tiers

### 1.2 Create Subscription Database Tables
**Migration to add:**
```text
- subscriptions table (user_id, stripe_customer_id, stripe_subscription_id, tier, status, current_period_end)
- spot_views table (user_id, spot_id, viewed_at) - for tracking free tier limits
- customer_portal sessions for self-service billing management
```

### 1.3 Build Stripe Edge Functions
- `create-checkout-session`: Generate Stripe checkout for new subscriptions
- `stripe-webhook`: Handle subscription events (created, updated, canceled, payment_failed)
- `create-customer-portal`: Allow users to manage their billing

### 1.4 Connect Pricing Page to Real Payments
- Wire up "Upgrade to Pro" and "Upgrade to Elite" buttons to create checkout sessions
- Redirect users to Stripe checkout
- Handle successful payment redirects

---

## Phase 2: Usage Limits & Feature Gating (Priority: High)

### 2.1 Implement Real Usage Tracking
**Fix the useSubscription hook to:**
- Query actual subscription status from database
- Track spot views per month for free users
- Track catch logs per month for free users
- Show remaining usage in UI

### 2.2 Add Feature Gating Throughout App
**Components to gate:**
- Spot detail pages: Show upgrade prompt after 10 views/month (free tier)
- Catch log: Block after 5 catches/month with upgrade prompt
- Community posting: View-only for free tier
- Advanced weather: Blur/lock for free tier with preview teaser
- Offline maps: Pro/Elite only feature

### 2.3 Create Upgrade Prompt Components
- **LimitReachedDialog**: Modal when user hits their monthly limit
- **FeatureLockedCard**: Blurred preview with upgrade CTA for premium features
- **UsageMeter**: Visual indicator of remaining free tier usage

---

## Phase 3: Affiliate Revenue Setup (Priority: Medium)

### 3.1 Real Affiliate Program Integration
**Action required from you:**
- Sign up for Amazon Associates program
- Apply to fishing gear affiliate programs (Bass Pro Shops, Tackle Warehouse)
- Get ClickBank affiliate IDs for digital products

**What we'll build:**
- Update affiliate product links with real IDs
- Add click tracking for affiliate links
- Create contextual affiliate widgets on spot detail pages ("Recommended gear for this spot")

### 3.2 Smart Affiliate Placements
- Add "Shop Similar Gear" section on catch log entries
- Add affiliate product recommendations on spot detail pages based on species
- Create "Beginner Setup Guide" landing page with affiliate products

---

## Phase 4: User Engagement & Retention (Priority: Medium)

### 4.1 Onboarding Flow
- Welcome email after signup
- First-time user tour highlighting key features
- Prompt to log first catch or save first spot

### 4.2 Gamification Elements
- Achievement badges (First Catch, 10 Spots Saved, Community Contributor)
- Weekly fishing challenges
- Leaderboards for most active anglers

### 4.3 Push Notifications (Optional)
- "Great fishing weather at your saved spots today"
- "Your catch log has 4 entries this month, upgrade to Pro for unlimited"

---

## Phase 5: UX Polish & Conversion Optimization (Priority: Medium)

### 5.1 Homepage Improvements
- Add social proof section (testimonials, user count)
- Add "As Featured In" section if applicable
- Add comparison table for subscription tiers

### 5.2 Conversion Touchpoints
- Add free trial option (14 days of Pro)
- Exit-intent popup with discount offer
- Add annual billing option with 25% savings prominently displayed

### 5.3 Mobile Experience
- Ensure all pages are mobile-optimized
- Add "Add to Home Screen" prompt for PWA-like experience

---

## Technical Implementation Details

### Database Changes Required
```sql
-- Subscriptions table
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT UNIQUE,
  tier TEXT DEFAULT 'free',
  status TEXT DEFAULT 'active',
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Spot views for usage tracking
CREATE TABLE spot_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  spot_id INTEGER NOT NULL,
  viewed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS with appropriate policies
```

### Edge Functions to Create
1. **create-checkout-session**: Initiates Stripe checkout
2. **stripe-webhook**: Handles all Stripe events
3. **create-customer-portal**: Self-service billing management
4. **get-subscription-status**: Returns current user's tier and limits

### Files to Modify
- `src/hooks/useSubscription.ts`: Connect to real database
- `src/pages/Pricing.tsx`: Wire up to Stripe checkout
- `src/pages/SpotDetail.tsx`: Add usage tracking and gating
- `src/pages/CatchLog.tsx`: Add limit enforcement
- `src/data/affiliateProducts.ts`: Update with real affiliate links
- Create new component: `src/components/UpgradePrompt.tsx`
- Create new component: `src/components/UsageMeter.tsx`

---

## Revenue Projections

**Conservative Estimates (Year 1):**
| Revenue Stream | Monthly Projection |
|----------------|-------------------|
| Pro Subscriptions (500 users × $9.99) | $4,995 |
| Elite Subscriptions (50 users × $29.99) | $1,500 |
| Affiliate Commissions (2,500 clicks × 3% × $100 × 8%) | $600 |
| Marketplace Listings (50 × $2.99 fee) | $150 |
| **Total Monthly** | **~$7,245** |
| **Annual Revenue** | **~$87,000** |

---

## Recommended Implementation Order

1. **Week 1**: Enable Stripe, create subscription tables, build checkout flow
2. **Week 2**: Implement usage tracking and feature gating
3. **Week 3**: Set up affiliate programs and update product links
4. **Week 4**: Add upgrade prompts and conversion optimization
5. **Ongoing**: Monitor analytics, A/B test pricing, add engagement features

---

## Questions Before Proceeding

Before I implement these changes, I need to confirm:
1. Do you have a Stripe account ready? (We'll need your secret key)
2. Have you registered for any affiliate programs yet?
3. Would you like to start with just the payment system, or implement everything together?
