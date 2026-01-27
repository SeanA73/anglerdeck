# ReelSpot - Priority Implementation Plan
## From Current State to Passive Income Platform

**Created:** January 26, 2026  
**Timeline:** 12 weeks to first revenue  
**Goal:** Launch monetization features and generate $5,000 MRR

---

## 🎯 Phase 1: Foundation & Quick Wins (Weeks 1-4)

### Week 1: Payment Infrastructure & Subscriptions

**Priority: CRITICAL** ⭐⭐⭐⭐⭐

#### Day 1-2: Stripe Integration
```bash
npm install @stripe/stripe-js stripe
```

**Tasks:**
- [ ] Create Stripe account
- [ ] Set up Stripe Connect for marketplace
- [ ] Implement subscription billing
- [ ] Create webhook handlers for payment events
- [ ] Test payment flows in development

**Files to Create:**
```
src/lib/stripe.ts              # Stripe client configuration
src/hooks/useSubscription.ts   # Subscription management hook
src/components/SubscriptionModal.tsx  # Subscription UI
src/api/stripe-webhooks.ts     # Webhook handlers
```

**Code Example:**
```typescript
// src/lib/stripe.ts
import { loadStripe } from '@stripe/stripe-js';

export const stripePromise = loadStripe(
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
);

// Price IDs from Stripe Dashboard
export const SUBSCRIPTION_PRICES = {
  pro_monthly: 'price_xxx',
  pro_yearly: 'price_xxx',
  elite_monthly: 'price_xxx',
  elite_yearly: 'price_xxx',
};
```

#### Day 3-4: Subscription Tiers

**Create Database Tables:**
```sql
-- Add to Supabase
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  tier TEXT CHECK (tier IN ('free', 'pro', 'elite')),
  status TEXT CHECK (status IN ('active', 'canceled', 'past_due', 'trialing')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add subscription tier to profiles
ALTER TABLE profiles ADD COLUMN subscription_tier TEXT DEFAULT 'free';
```

**Tasks:**
- [ ] Create subscription database schema
- [ ] Build subscription management UI
- [ ] Implement feature gating logic
- [ ] Add "Upgrade to Pro" CTAs throughout app
- [ ] Create subscription settings page

#### Day 5-7: Feature Gating

**Implement Access Control:**
```typescript
// src/hooks/useFeatureAccess.ts
export const useFeatureAccess = () => {
  const { user } = useAuth();
  const { data: subscription } = useSubscription(user?.id);
  
  const hasAccess = (feature: Feature) => {
    const tier = subscription?.tier || 'free';
    return FEATURE_ACCESS[feature].includes(tier);
  };
  
  return { hasAccess, tier: subscription?.tier };
};

// Usage in components
const { hasAccess } = useFeatureAccess();

if (!hasAccess('unlimited_catches')) {
  return <UpgradePrompt feature="unlimited_catches" />;
}
```

**Features to Gate:**
- ✅ Free: 10 spots/month, 5 catches/month, ads
- ✅ Pro: Unlimited spots, unlimited catches, no ads, analytics
- ✅ Elite: Everything + coaching, exclusive spots, advanced AI

---

### Week 2: Marketplace Enhancement

**Priority: HIGH** ⭐⭐⭐⭐

#### Day 8-10: Vendor System

**Database Schema:**
```sql
CREATE TABLE vendors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  business_name TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  stripe_account_id TEXT UNIQUE,
  commission_rate DECIMAL(5,2) DEFAULT 12.00,
  status TEXT CHECK (status IN ('pending', 'active', 'suspended')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id UUID REFERENCES vendors(id) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  images TEXT[],
  category TEXT,
  stock_quantity INTEGER DEFAULT 0,
  status TEXT CHECK (status IN ('draft', 'active', 'sold')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  buyer_id UUID REFERENCES auth.users(id) NOT NULL,
  vendor_id UUID REFERENCES vendors(id) NOT NULL,
  product_id UUID REFERENCES products(id) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  commission DECIMAL(10,2) NOT NULL,
  stripe_payment_intent_id TEXT,
  status TEXT CHECK (status IN ('pending', 'paid', 'shipped', 'completed', 'refunded')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Tasks:**
- [ ] Create vendor registration flow
- [ ] Build product listing management
- [ ] Implement shopping cart
- [ ] Create checkout process
- [ ] Set up Stripe Connect for vendor payouts

#### Day 11-14: Marketplace UI

**Pages to Create:**
- `src/pages/VendorDashboard.tsx` - Vendor management
- `src/pages/ProductDetail.tsx` - Product details
- `src/pages/Cart.tsx` - Shopping cart
- `src/pages/Checkout.tsx` - Checkout flow
- `src/components/ProductCard.tsx` - Product display

**Key Features:**
- Product search & filtering
- Category browsing
- Vendor profiles
- Order tracking
- Review system

---

### Week 3: Affiliate Marketing System

**Priority: HIGH** ⭐⭐⭐⭐

#### Day 15-17: Affiliate Infrastructure

**Database Schema:**
```sql
CREATE TABLE affiliate_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2),
  image_url TEXT,
  affiliate_url TEXT NOT NULL,
  commission_rate DECIMAL(5,2),
  merchant TEXT, -- 'amazon', 'bass_pro_shops', etc.
  category TEXT,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE affiliate_clicks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES affiliate_products(id),
  user_id UUID REFERENCES auth.users(id),
  clicked_at TIMESTAMPTZ DEFAULT NOW(),
  converted BOOLEAN DEFAULT false,
  conversion_amount DECIMAL(10,2)
);
```

**Tasks:**
- [ ] Set up Amazon Associates account
- [ ] Apply to Bass Pro Shops affiliate program
- [ ] Create affiliate product database
- [ ] Build affiliate link tracking system
- [ ] Implement click & conversion tracking

#### Day 18-21: Smart Recommendations

**Contextual Affiliate Widget:**
```typescript
// src/components/AffiliateRecommendations.tsx
export const AffiliateRecommendations = ({ context }: Props) => {
  const { data: products } = useQuery({
    queryKey: ['affiliate-products', context],
    queryFn: () => getRecommendedProducts(context)
  });
  
  return (
    <div className="affiliate-widget">
      <h3>Recommended Gear</h3>
      <div className="grid grid-cols-2 gap-4">
        {products?.map(product => (
          <AffiliateProductCard 
            key={product.id} 
            product={product}
            onClick={() => trackClick(product.id)}
          />
        ))}
      </div>
    </div>
  );
};
```

**Integration Points:**
- Spot detail pages (gear for that location)
- Catch log page (gear that caught similar fish)
- Community posts (related products)
- Weather page (seasonal gear)

---

### Week 4: Analytics & Optimization

**Priority: MEDIUM** ⭐⭐⭐

#### Day 22-24: Revenue Dashboard

**Create Admin Dashboard:**
```typescript
// src/pages/AdminDashboard.tsx
export const AdminDashboard = () => {
  const { data: metrics } = useRevenueMetrics();
  
  return (
    <div className="dashboard">
      <MetricCard 
        title="Monthly Recurring Revenue"
        value={metrics.mrr}
        change={metrics.mrrGrowth}
      />
      <MetricCard 
        title="Active Subscriptions"
        value={metrics.activeSubscriptions}
      />
      <MetricCard 
        title="Marketplace Revenue"
        value={metrics.marketplaceRevenue}
      />
      <MetricCard 
        title="Affiliate Earnings"
        value={metrics.affiliateEarnings}
      />
      
      <RevenueChart data={metrics.dailyRevenue} />
      <ConversionFunnel data={metrics.funnel} />
    </div>
  );
};
```

**Metrics to Track:**
- Daily/Monthly revenue
- Subscription conversions
- Marketplace transactions
- Affiliate clicks & conversions
- User engagement metrics

#### Day 25-28: A/B Testing & Optimization

**Tasks:**
- [ ] Set up analytics (Google Analytics 4)
- [ ] Implement event tracking
- [ ] Create conversion funnels
- [ ] A/B test subscription pricing
- [ ] Optimize checkout flow
- [ ] Test different CTA placements

---

## 🚀 Phase 2: Growth & Scaling (Weeks 5-8)

### Week 5: Content & SEO

**Priority: HIGH** ⭐⭐⭐⭐

#### Content Creation Strategy

**Blog Posts (SEO-optimized):**
1. "Best Fishing Spots in [Your State]" (10 articles)
2. "Complete Guide to Bass Fishing for Beginners"
3. "Top 10 Fishing Rods Under $100"
4. "How to Read Weather for Fishing Success"
5. "Catch and Release Best Practices"

**Video Content:**
1. App tutorial series (5 videos)
2. Fishing technique guides (10 videos)
3. Gear review videos (5 videos)
4. Spot highlight videos (10 videos)

**Tasks:**
- [ ] Create content calendar
- [ ] Write 20 blog posts
- [ ] Optimize for SEO keywords
- [ ] Create video content
- [ ] Build backlinks

### Week 6: Community Features

**Priority: MEDIUM** ⭐⭐⭐

#### Social Engagement

**Features to Add:**
```typescript
// Following system
CREATE TABLE follows (
  follower_id UUID REFERENCES auth.users(id),
  following_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (follower_id, following_id)
);

// Direct messaging
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID REFERENCES auth.users(id),
  recipient_id UUID REFERENCES auth.users(id),
  content TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

// Fishing clubs
CREATE TABLE clubs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  owner_id UUID REFERENCES auth.users(id),
  is_private BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Tasks:**
- [ ] Implement follow/unfollow system
- [ ] Build user profiles
- [ ] Create direct messaging
- [ ] Add fishing clubs/groups
- [ ] Build activity feed

### Week 7: Gamification & Tournaments

**Priority: MEDIUM** ⭐⭐⭐

#### Achievement System

**Database Schema:**
```sql
CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  criteria JSONB, -- Conditions to unlock
  points INTEGER DEFAULT 0
);

CREATE TABLE user_achievements (
  user_id UUID REFERENCES auth.users(id),
  achievement_id UUID REFERENCES achievements(id),
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, achievement_id)
);

CREATE TABLE tournaments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  entry_fee DECIMAL(10,2) DEFAULT 0,
  prize_pool DECIMAL(10,2),
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  rules JSONB,
  status TEXT CHECK (status IN ('upcoming', 'active', 'completed'))
);
```

**Achievements to Create:**
- 🏆 First Catch
- 🎣 Species Master (10 different species)
- 🗺️ Explorer (50 different spots)
- 👥 Community Leader (100 helpful posts)
- 🌅 Early Bird (20 catches before 6 AM)

### Week 8: Marketing Automation

**Priority: HIGH** ⭐⭐⭐⭐

#### Email Marketing

**Set up Email Campaigns:**
```typescript
// Email sequences
const EMAIL_SEQUENCES = {
  onboarding: [
    { day: 0, template: 'welcome' },
    { day: 1, template: 'first_spot' },
    { day: 3, template: 'log_first_catch' },
    { day: 7, template: 'upgrade_to_pro' },
  ],
  
  trial: [
    { day: 0, template: 'trial_started' },
    { day: 7, template: 'trial_halfway' },
    { day: 12, template: 'trial_ending_soon' },
    { day: 14, template: 'trial_ended' },
  ],
  
  churn_prevention: [
    { trigger: 'no_login_7_days', template: 'we_miss_you' },
    { trigger: 'subscription_ending', template: 'special_offer' },
  ]
};
```

**Tasks:**
- [ ] Set up email service (SendGrid/Mailchimp)
- [ ] Create email templates
- [ ] Build automation workflows
- [ ] Implement drip campaigns
- [ ] Set up abandoned cart emails

---

## 💎 Phase 3: Premium Features (Weeks 9-12)

### Week 9: AI Catch Predictions

**Priority: MEDIUM** ⭐⭐⭐

#### Machine Learning Model

**Features:**
- Predict best fishing times
- Recommend optimal spots
- Suggest effective gear
- Analyze catch patterns

**Implementation:**
```typescript
// src/lib/ai/catchPredictor.ts
export const predictCatchSuccess = async (params: {
  spotId: string;
  species: string;
  date: Date;
  weather: WeatherConditions;
}) => {
  // Analyze historical data
  const historicalCatches = await getHistoricalCatches(params);
  
  // Calculate success probability
  const probability = calculateProbability(historicalCatches, params);
  
  // Get recommendations
  const recommendations = generateRecommendations(probability);
  
  return {
    probability,
    bestTime: recommendations.optimalTime,
    gear: recommendations.recommendedGear,
    tips: recommendations.tips
  };
};
```

### Week 10: Advanced Analytics

**Priority: MEDIUM** ⭐⭐⭐

#### Pro User Dashboard

**Analytics Features:**
- Catch trends over time
- Success rate by location
- Species distribution
- Best fishing times
- Gear effectiveness

**Visualizations:**
```typescript
// Using Recharts
<LineChart data={catchesByMonth}>
  <XAxis dataKey="month" />
  <YAxis />
  <Tooltip />
  <Line type="monotone" dataKey="catches" stroke="#f59e0b" />
</LineChart>

<PieChart>
  <Pie data={speciesDistribution} dataKey="count" nameKey="species" />
</PieChart>

<BarChart data={successBySpot}>
  <XAxis dataKey="spot" />
  <YAxis />
  <Bar dataKey="successRate" fill="#10b981" />
</BarChart>
```

### Week 11: Offline Support & PWA

**Priority: LOW** ⭐⭐

#### Progressive Web App

**Tasks:**
- [ ] Install vite-plugin-pwa
- [ ] Configure service worker
- [ ] Enable offline mode
- [ ] Add app manifest
- [ ] Create install prompt

```bash
npm install vite-plugin-pwa -D
```

```typescript
// vite.config.ts
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'ReelSpot',
        short_name: 'ReelSpot',
        description: 'Discover the best fishing spots',
        theme_color: '#2d5a3d',
        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          }
        ]
      }
    })
  ]
});
```

### Week 12: Launch Preparation

**Priority: CRITICAL** ⭐⭐⭐⭐⭐

#### Pre-Launch Checklist

**Technical:**
- [ ] Security audit
- [ ] Performance optimization
- [ ] Mobile responsiveness check
- [ ] Cross-browser testing
- [ ] Load testing
- [ ] Backup systems in place

**Content:**
- [ ] 100+ fishing spots documented
- [ ] 50+ blog posts published
- [ ] 20+ video tutorials
- [ ] Email templates ready
- [ ] Social media content calendar

**Business:**
- [ ] Payment processing tested
- [ ] Vendor onboarding complete
- [ ] Affiliate partnerships signed
- [ ] Legal documents (ToS, Privacy Policy)
- [ ] Customer support system
- [ ] Analytics tracking verified

**Marketing:**
- [ ] Landing page optimized
- [ ] Social media accounts set up
- [ ] Influencer partnerships confirmed
- [ ] Press release prepared
- [ ] Launch email sequence ready
- [ ] Paid ad campaigns configured

---

## 📊 Success Metrics by Phase

### Phase 1 Goals (Week 4)
- ✅ Payment system functional
- ✅ 10 Pro subscribers
- ✅ 5 marketplace vendors
- ✅ 3 affiliate partnerships
- ✅ $500 MRR

### Phase 2 Goals (Week 8)
- ✅ 1,000 registered users
- ✅ 50 Pro subscribers
- ✅ 20 marketplace vendors
- ✅ 100 marketplace transactions
- ✅ $2,000 MRR

### Phase 3 Goals (Week 12)
- ✅ 5,000 registered users
- ✅ 200 Pro subscribers
- ✅ 50 marketplace vendors
- ✅ 500 marketplace transactions
- ✅ $5,000 MRR

---

## 💰 Revenue Projections

### Conservative Estimate (Year 1)

**Month 3:**
- 50 Pro subscribers × $9.99 = $500
- Marketplace (10 sales × $50 × 12%) = $60
- Affiliate (20 sales × $100 × 8%) = $160
- **Total: $720 MRR**

**Month 6:**
- 200 Pro subscribers × $9.99 = $1,998
- 5 Elite subscribers × $29.99 = $150
- Marketplace (100 sales × $50 × 12%) = $600
- Affiliate (100 sales × $100 × 8%) = $800
- **Total: $3,548 MRR**

**Month 12:**
- 500 Pro subscribers × $9.99 = $4,995
- 20 Elite subscribers × $29.99 = $600
- Marketplace (500 sales × $50 × 12%) = $3,000
- Affiliate (500 sales × $100 × 8%) = $4,000
- Advertising = $2,000
- **Total: $14,595 MRR** ($175,140/year)

### Optimistic Estimate (Year 1)

**Month 12:**
- 2,000 Pro subscribers × $9.99 = $19,980
- 100 Elite subscribers × $29.99 = $2,999
- Marketplace (2,000 sales × $75 × 12%) = $18,000
- Affiliate (2,000 sales × $120 × 8%) = $19,200
- Advertising = $5,000
- Tournaments = $3,000
- **Total: $68,179 MRR** ($818,148/year)

---

## 🎯 Quick Win Priorities

### If You Only Have Time for 3 Things:

**1. Subscription System (Week 1)**
- Fastest path to recurring revenue
- Simplest to implement
- Immediate value to users

**2. Affiliate Integration (Week 3)**
- Low effort, high reward
- No inventory management
- Passive income potential

**3. Content Marketing (Week 5)**
- Drives organic traffic
- Builds authority
- Long-term SEO benefits

---

## 🛠️ Technical Stack Additions

### New Dependencies Needed

```bash
# Payment processing
npm install @stripe/stripe-js stripe

# Email marketing
npm install @sendgrid/mail

# Analytics
npm install @vercel/analytics

# Charts & visualization
npm install recharts

# PWA support
npm install -D vite-plugin-pwa

# Image optimization
npm install sharp

# Cron jobs (for automated tasks)
npm install node-cron
```

---

## 📝 Database Schema Summary

### New Tables to Create

1. **subscriptions** - User subscription data
2. **vendors** - Marketplace vendor accounts
3. **products** - Marketplace product listings
4. **orders** - Marketplace transactions
5. **affiliate_products** - Affiliate product catalog
6. **affiliate_clicks** - Click & conversion tracking
7. **achievements** - Achievement definitions
8. **user_achievements** - User achievement progress
9. **tournaments** - Tournament events
10. **follows** - User following relationships
11. **messages** - Direct messaging
12. **clubs** - Fishing clubs/groups

---

## 🚦 Go/No-Go Decision Points

### Week 4 Review
**Go if:**
- ✅ Payment system working
- ✅ At least 5 paying subscribers
- ✅ No critical bugs

**No-Go if:**
- ❌ Payment issues
- ❌ Zero conversions
- ❌ Major technical problems

### Week 8 Review
**Go if:**
- ✅ $1,000+ MRR
- ✅ Positive user feedback
- ✅ Growing user base

**No-Go if:**
- ❌ High churn rate
- ❌ Negative feedback
- ❌ Declining engagement

---

## 🎁 Bonus: Marketing Launch Plan

### Pre-Launch (2 weeks before)

**Week -2:**
- Build email list (landing page)
- Create teaser content
- Reach out to influencers
- Prepare press materials

**Week -1:**
- Beta testing with 100 users
- Collect testimonials
- Create launch content
- Schedule social posts

### Launch Week

**Day 1: Soft Launch**
- Email beta users
- Post on social media
- Monitor for issues

**Day 2-3: Public Launch**
- Press release distribution
- Influencer posts go live
- Paid ads start
- Product Hunt launch

**Day 4-7: Amplification**
- Share user testimonials
- Post success stories
- Engage with community
- Optimize based on feedback

---

## ✅ Next Immediate Actions

### Today:
1. Review this plan
2. Set up Stripe account
3. Create subscription pricing page
4. Start affiliate program research

### This Week:
1. Implement payment infrastructure
2. Design subscription tiers
3. Build subscription UI
4. Test payment flows

### This Month:
1. Launch Pro tier
2. Onboard first vendors
3. Sign affiliate partnerships
4. Reach $500 MRR

---

**Remember:** Start small, iterate quickly, and focus on user value. The passive income will follow! 🚀

**Questions? Let's discuss which features to prioritize first based on your resources and goals.**
