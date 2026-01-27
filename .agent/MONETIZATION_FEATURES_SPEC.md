# ReelSpot - Monetization Features Specification
## Detailed Feature Requirements & UI/UX Guidelines

**Created:** January 26, 2026  
**Purpose:** Technical specifications for all monetization features

---

## 🎨 Design Philosophy

### Core Principles
1. **Non-Intrusive:** Monetization should enhance, not disrupt user experience
2. **Value-First:** Users should clearly see the value before being asked to pay
3. **Transparent:** Clear pricing, no hidden fees
4. **Community-Focused:** Monetization should benefit the entire community
5. **Premium Feel:** Paid features should feel exclusive and high-quality

---

## 💳 Feature 1: Subscription System

### Subscription Tiers Detailed Breakdown

#### Free Tier - "Angler"
**Monthly Limits:**
- 10 spot views per month
- 5 catch logs per month
- Community feed (view only, no posting)
- Basic weather information
- Ads displayed (2-3 per session)

**UI Indicators:**
- Counter showing remaining spots/catches
- "Upgrade to Pro" banner when limits approached
- Locked features with upgrade prompts

#### Pro Tier - "Pro Angler" ($9.99/month, $89/year)
**Features:**
- ✅ Unlimited spot access
- ✅ Unlimited catch logging
- ✅ Ad-free experience
- ✅ Advanced weather (7-day forecast, hourly)
- ✅ Catch analytics dashboard
- ✅ Offline map downloads (up to 10 regions)
- ✅ Priority customer support
- ✅ Pro badge on profile
- ✅ Custom profile themes
- ✅ Export catch data (CSV, PDF)

**Exclusive Content:**
- Access to "Pro Spots" (verified high-quality locations)
- Detailed fishing reports with insider tips
- Video tutorials from expert anglers
- Seasonal fishing guides

**UI Elements:**
- Gold "PRO" badge next to username
- Custom profile banner colors
- No ads anywhere in app
- "Pro Tips" sections on spot pages

#### Elite Tier - "Master Angler" ($29.99/month, $299/year)
**Everything in Pro, plus:**
- ✅ AI catch predictions
- ✅ Personalized spot recommendations
- ✅ 1-on-1 monthly coaching call (30 min)
- ✅ Access to exclusive Elite-only spots
- ✅ Advanced trip planning tools
- ✅ Unlimited offline maps
- ✅ White-glove customer support
- ✅ Early access to new features
- ✅ Exclusive Elite community forum
- ✅ 20% discount on marketplace purchases
- ✅ Priority listing in guide directory

**Business Features (for guides/charters):**
- Business profile with custom branding
- Booking calendar integration
- Client management system
- Automated email marketing
- Performance analytics
- Featured placement in search

**UI Elements:**
- Platinum "ELITE" badge with animation
- Exclusive profile themes
- Custom profile URL
- Verified checkmark

### Subscription UI Components

#### Pricing Page Design
```typescript
// src/pages/Pricing.tsx
export const PricingPage = () => {
  return (
    <div className="pricing-page">
      <header className="text-center py-12">
        <h1 className="text-4xl font-bold">Choose Your Plan</h1>
        <p className="text-muted-foreground mt-4">
          Unlock the full potential of ReelSpot
        </p>
        
        {/* Annual/Monthly Toggle */}
        <div className="flex items-center justify-center gap-4 mt-8">
          <span>Monthly</span>
          <Switch checked={isAnnual} onChange={setIsAnnual} />
          <span>Annual <Badge>Save 25%</Badge></span>
        </div>
      </header>
      
      <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        <PricingCard tier="free" />
        <PricingCard tier="pro" featured />
        <PricingCard tier="elite" />
      </div>
      
      {/* Feature Comparison Table */}
      <FeatureComparisonTable />
      
      {/* FAQ Section */}
      <PricingFAQ />
    </div>
  );
};
```

#### Pricing Card Component
```typescript
interface PricingCardProps {
  tier: 'free' | 'pro' | 'elite';
  featured?: boolean;
}

export const PricingCard = ({ tier, featured }: PricingCardProps) => {
  const config = TIER_CONFIG[tier];
  
  return (
    <Card className={cn(
      "relative p-6",
      featured && "border-2 border-primary scale-105"
    )}>
      {featured && (
        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
          Most Popular
        </Badge>
      )}
      
      <div className="text-center">
        <h3 className="text-2xl font-bold">{config.name}</h3>
        <div className="mt-4">
          <span className="text-4xl font-bold">${config.price}</span>
          <span className="text-muted-foreground">/month</span>
        </div>
        {config.annualPrice && (
          <p className="text-sm text-muted-foreground mt-2">
            or ${config.annualPrice}/year (save 25%)
          </p>
        )}
      </div>
      
      <ul className="mt-6 space-y-3">
        {config.features.map((feature, i) => (
          <li key={i} className="flex items-start gap-2">
            <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
      
      <Button 
        className="w-full mt-6"
        variant={featured ? "default" : "outline"}
        onClick={() => handleSubscribe(tier)}
      >
        {tier === 'free' ? 'Get Started' : 'Upgrade Now'}
      </Button>
    </Card>
  );
};
```

#### Upgrade Prompts (Strategic Placement)

**1. Spot Limit Reached:**
```typescript
<Dialog open={showLimitDialog}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>You've reached your monthly limit</DialogTitle>
      <DialogDescription>
        You've viewed 10 spots this month. Upgrade to Pro for unlimited access.
      </DialogDescription>
    </DialogHeader>
    
    <div className="space-y-4">
      <div className="bg-muted p-4 rounded-lg">
        <h4 className="font-semibold mb-2">With Pro, you get:</h4>
        <ul className="space-y-2">
          <li>✅ Unlimited spot access</li>
          <li>✅ Unlimited catch logging</li>
          <li>✅ No ads</li>
          <li>✅ Advanced analytics</li>
        </ul>
      </div>
      
      <div className="flex gap-2">
        <Button variant="outline" onClick={onClose}>
          Maybe Later
        </Button>
        <Button onClick={() => navigate('/pricing')}>
          Upgrade to Pro - $9.99/mo
        </Button>
      </div>
    </div>
  </DialogContent>
</Dialog>
```

**2. Feature Teaser (Locked Features):**
```typescript
<Card className="relative overflow-hidden">
  <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex items-center justify-center">
    <div className="text-center p-6">
      <Lock className="w-12 h-12 mx-auto mb-4 text-primary" />
      <h3 className="text-xl font-bold mb-2">Pro Feature</h3>
      <p className="text-muted-foreground mb-4">
        Unlock AI catch predictions with Pro
      </p>
      <Button onClick={() => navigate('/pricing')}>
        Upgrade to Pro
      </Button>
    </div>
  </div>
  
  {/* Blurred preview of the feature */}
  <div className="blur-sm pointer-events-none">
    <CatchPredictionWidget />
  </div>
</Card>
```

**3. Success-Based Prompts:**
```typescript
// After user logs 5th catch (free limit)
<Toast>
  <div className="flex items-start gap-3">
    <Trophy className="w-6 h-6 text-primary" />
    <div>
      <h4 className="font-semibold">Great job!</h4>
      <p className="text-sm text-muted-foreground">
        You've logged 5 catches. Upgrade to Pro to log unlimited catches 
        and unlock detailed analytics.
      </p>
      <Button size="sm" className="mt-2" onClick={handleUpgrade}>
        Upgrade Now
      </Button>
    </div>
  </div>
</Toast>
```

### Subscription Management

#### Account Settings - Subscription Tab
```typescript
export const SubscriptionSettings = () => {
  const { subscription } = useSubscription();
  
  return (
    <div className="space-y-6">
      {/* Current Plan */}
      <Card>
        <CardHeader>
          <CardTitle>Current Plan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold">
                {subscription.tier} Plan
              </h3>
              <p className="text-muted-foreground">
                ${subscription.amount}/month
              </p>
            </div>
            <Badge variant={subscription.status === 'active' ? 'success' : 'warning'}>
              {subscription.status}
            </Badge>
          </div>
          
          {subscription.tier !== 'elite' && (
            <Button className="mt-4" onClick={handleUpgrade}>
              Upgrade Plan
            </Button>
          )}
        </CardContent>
      </Card>
      
      {/* Billing Information */}
      <Card>
        <CardHeader>
          <CardTitle>Billing Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Next billing date:</span>
              <span>{format(subscription.nextBillingDate, 'MMM dd, yyyy')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Payment method:</span>
              <span>•••• {subscription.lastFour}</span>
            </div>
          </div>
          
          <div className="flex gap-2 mt-4">
            <Button variant="outline" onClick={handleUpdatePayment}>
              Update Payment Method
            </Button>
            <Button variant="outline" onClick={handleViewInvoices}>
              View Invoices
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Cancel Subscription */}
      <Card>
        <CardHeader>
          <CardTitle>Cancel Subscription</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Your subscription will remain active until the end of your billing period.
          </p>
          <Button variant="destructive" onClick={handleCancel}>
            Cancel Subscription
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
```

---

## 🛒 Feature 2: Enhanced Marketplace

### Product Listing Page

```typescript
export const ProductListingPage = () => {
  const [filters, setFilters] = useState({
    category: 'all',
    priceRange: [0, 1000],
    condition: 'all',
    location: 'all'
  });
  
  return (
    <div className="marketplace-page">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">Marketplace</h1>
        <p className="text-muted-foreground">
          Buy and sell fishing gear from the community
        </p>
      </header>
      
      <div className="grid md:grid-cols-4 gap-6">
        {/* Filters Sidebar */}
        <aside className="space-y-6">
          <CategoryFilter 
            value={filters.category}
            onChange={(v) => setFilters({...filters, category: v})}
          />
          
          <PriceRangeFilter
            value={filters.priceRange}
            onChange={(v) => setFilters({...filters, priceRange: v})}
          />
          
          <ConditionFilter
            value={filters.condition}
            onChange={(v) => setFilters({...filters, condition: v})}
          />
          
          <LocationFilter
            value={filters.location}
            onChange={(v) => setFilters({...filters, location: v})}
          />
        </aside>
        
        {/* Product Grid */}
        <div className="md:col-span-3">
          <div className="flex items-center justify-between mb-6">
            <p className="text-muted-foreground">
              {products.length} products found
            </p>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
                <SelectItem value="popular">Most Popular</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {products.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
```

### Product Card Component

```typescript
export const ProductCard = ({ product }: { product: Product }) => {
  return (
    <Card className="group cursor-pointer hover:shadow-lg transition-shadow">
      <div className="relative aspect-square overflow-hidden">
        <img 
          src={product.images[0]} 
          alt={product.title}
          className="object-cover w-full h-full group-hover:scale-105 transition-transform"
        />
        
        {product.condition === 'new' && (
          <Badge className="absolute top-2 left-2">New</Badge>
        )}
        
        {product.featured && (
          <Badge className="absolute top-2 right-2" variant="secondary">
            Featured
          </Badge>
        )}
        
        <Button
          size="icon"
          variant="ghost"
          className="absolute bottom-2 right-2 bg-background/80 backdrop-blur"
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite(product.id);
          }}
        >
          <Heart className={cn(
            "w-5 h-5",
            product.isFavorited && "fill-red-500 text-red-500"
          )} />
        </Button>
      </div>
      
      <CardContent className="p-4">
        <h3 className="font-semibold line-clamp-2 mb-2">
          {product.title}
        </h3>
        
        <div className="flex items-center gap-2 mb-2">
          <Avatar className="w-6 h-6">
            <AvatarImage src={product.vendor.avatar} />
            <AvatarFallback>{product.vendor.name[0]}</AvatarFallback>
          </Avatar>
          <span className="text-sm text-muted-foreground">
            {product.vendor.name}
          </span>
          {product.vendor.verified && (
            <CheckCircle className="w-4 h-4 text-primary" />
          )}
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold">
            ${product.price}
          </span>
          
          <div className="flex items-center gap-1 text-sm">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span>{product.rating}</span>
            <span className="text-muted-foreground">
              ({product.reviews})
            </span>
          </div>
        </div>
        
        <Button 
          className="w-full mt-4"
          onClick={() => navigate(`/marketplace/product/${product.id}`)}
        >
          View Details
        </Button>
      </CardContent>
    </Card>
  );
};
```

### Vendor Dashboard

```typescript
export const VendorDashboard = () => {
  const { data: stats } = useVendorStats();
  
  return (
    <div className="vendor-dashboard">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">Vendor Dashboard</h1>
      </header>
      
      {/* Stats Overview */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Sales"
          value={`$${stats.totalSales.toLocaleString()}`}
          change="+12.5%"
          icon={DollarSign}
        />
        <StatCard
          title="Active Listings"
          value={stats.activeListings}
          icon={Package}
        />
        <StatCard
          title="Pending Orders"
          value={stats.pendingOrders}
          icon={ShoppingCart}
        />
        <StatCard
          title="Rating"
          value={stats.rating}
          icon={Star}
        />
      </div>
      
      {/* Quick Actions */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <Button onClick={() => navigate('/vendor/products/new')}>
          <Plus className="w-4 h-4 mr-2" />
          Add New Product
        </Button>
        <Button variant="outline" onClick={() => navigate('/vendor/orders')}>
          <Package className="w-4 h-4 mr-2" />
          Manage Orders
        </Button>
        <Button variant="outline" onClick={() => navigate('/vendor/analytics')}>
          <BarChart className="w-4 h-4 mr-2" />
          View Analytics
        </Button>
      </div>
      
      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <OrdersTable orders={stats.recentOrders} />
        </CardContent>
      </Card>
    </div>
  );
};
```

---

## 🔗 Feature 3: Affiliate Marketing Integration

### Contextual Product Recommendations

```typescript
// Smart affiliate widget that appears contextually
export const AffiliateWidget = ({ context }: {
  context: {
    type: 'spot_detail' | 'catch_log' | 'weather' | 'community_post';
    data: any;
  }
}) => {
  const { data: products } = useAffiliateRecommendations(context);
  
  if (!products || products.length === 0) return null;
  
  return (
    <Card className="mt-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Recommended Gear</CardTitle>
          <Badge variant="secondary">Sponsored</Badge>
        </div>
        <CardDescription>
          {getContextualMessage(context)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Carousel>
          {products.map(product => (
            <AffiliateProductCard 
              key={product.id} 
              product={product}
              context={context}
            />
          ))}
        </Carousel>
      </CardContent>
    </Card>
  );
};

// Example contextual messages
const getContextualMessage = (context) => {
  switch (context.type) {
    case 'spot_detail':
      return `Popular gear for fishing at ${context.data.spotName}`;
    case 'catch_log':
      return `Great catches! Here's gear that works well for ${context.data.species}`;
    case 'weather':
      return `Perfect conditions for fishing! Here's what you'll need`;
    default:
      return 'Gear recommendations based on your activity';
  }
};
```

### Affiliate Product Card

```typescript
export const AffiliateProductCard = ({ product, context }: Props) => {
  const handleClick = () => {
    // Track click
    trackAffiliateClick({
      productId: product.id,
      context: context.type,
      userId: user?.id
    });
    
    // Open affiliate link
    window.open(product.affiliateUrl, '_blank');
  };
  
  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={handleClick}>
      <div className="aspect-square relative overflow-hidden">
        <img 
          src={product.image} 
          alt={product.title}
          className="object-cover w-full h-full"
        />
        {product.discount && (
          <Badge className="absolute top-2 right-2 bg-red-500">
            {product.discount}% OFF
          </Badge>
        )}
      </div>
      
      <CardContent className="p-4">
        <h4 className="font-semibold line-clamp-2 mb-2">
          {product.title}
        </h4>
        
        <div className="flex items-center gap-2 mb-2">
          <div className="flex items-center">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span className="text-sm ml-1">{product.rating}</span>
          </div>
          <span className="text-sm text-muted-foreground">
            ({product.reviews} reviews)
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            {product.originalPrice && (
              <span className="text-sm text-muted-foreground line-through mr-2">
                ${product.originalPrice}
              </span>
            )}
            <span className="text-xl font-bold">
              ${product.price}
            </span>
          </div>
          
          <ExternalLink className="w-4 h-4 text-muted-foreground" />
        </div>
        
        <div className="mt-2 text-xs text-muted-foreground">
          Sold by {product.merchant}
        </div>
      </CardContent>
    </Card>
  );
};
```

### Fishing Guides with Embedded Affiliates

```typescript
export const FishingGuide = ({ guide }: { guide: Guide }) => {
  return (
    <article className="fishing-guide max-w-4xl mx-auto">
      <header className="mb-8">
        <h1 className="text-4xl font-bold mb-4">{guide.title}</h1>
        <div className="flex items-center gap-4 text-muted-foreground">
          <div className="flex items-center gap-2">
            <Avatar>
              <AvatarImage src={guide.author.avatar} />
            </Avatar>
            <span>{guide.author.name}</span>
          </div>
          <span>•</span>
          <span>{format(guide.publishedAt, 'MMM dd, yyyy')}</span>
          <span>•</span>
          <span>{guide.readTime} min read</span>
        </div>
      </header>
      
      <img 
        src={guide.featuredImage} 
        alt={guide.title}
        className="w-full h-96 object-cover rounded-lg mb-8"
      />
      
      {/* Article content with embedded affiliate products */}
      <div className="prose prose-lg max-w-none">
        {guide.sections.map((section, i) => (
          <div key={i}>
            <h2>{section.title}</h2>
            <div dangerouslySetInnerHTML={{ __html: section.content }} />
            
            {/* Embed affiliate products contextually */}
            {section.affiliateProducts && (
              <div className="not-prose my-8">
                <h3 className="text-xl font-semibold mb-4">
                  Recommended Gear for This Technique
                </h3>
                <div className="grid md:grid-cols-3 gap-4">
                  {section.affiliateProducts.map(product => (
                    <AffiliateProductCard 
                      key={product.id} 
                      product={product}
                      context={{ type: 'guide', data: { section: section.title } }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      
      {/* Related Products Section */}
      <div className="mt-12 p-6 bg-muted rounded-lg">
        <h3 className="text-2xl font-bold mb-4">Complete Gear Setup</h3>
        <p className="text-muted-foreground mb-6">
          Everything you need to get started with {guide.technique}
        </p>
        <div className="grid md:grid-cols-4 gap-4">
          {guide.gearSetup.map(product => (
            <AffiliateProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </article>
  );
};
```

---

## 🎮 Feature 4: Gamification & Tournaments

### Achievement System

```typescript
export const AchievementsPage = () => {
  const { data: achievements } = useUserAchievements();
  
  return (
    <div className="achievements-page">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">Achievements</h1>
        <p className="text-muted-foreground">
          Track your progress and unlock rewards
        </p>
      </header>
      
      {/* Progress Overview */}
      <Card className="mb-8">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-2xl font-bold">
                {achievements.unlocked} / {achievements.total}
              </h3>
              <p className="text-muted-foreground">Achievements Unlocked</p>
            </div>
            <div className="text-right">
              <h3 className="text-2xl font-bold text-primary">
                {achievements.points}
              </h3>
              <p className="text-muted-foreground">Total Points</p>
            </div>
          </div>
          
          <Progress 
            value={(achievements.unlocked / achievements.total) * 100} 
            className="h-3"
          />
        </CardContent>
      </Card>
      
      {/* Achievement Categories */}
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="catches">Catches</TabsTrigger>
          <TabsTrigger value="exploration">Exploration</TabsTrigger>
          <TabsTrigger value="community">Community</TabsTrigger>
          <TabsTrigger value="special">Special</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="mt-6">
          <div className="grid md:grid-cols-3 gap-6">
            {achievements.all.map(achievement => (
              <AchievementCard 
                key={achievement.id} 
                achievement={achievement}
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export const AchievementCard = ({ achievement }: Props) => {
  const isUnlocked = achievement.unlockedAt !== null;
  
  return (
    <Card className={cn(
      "relative overflow-hidden",
      !isUnlocked && "opacity-60"
    )}>
      {isUnlocked && (
        <div className="absolute top-2 right-2">
          <CheckCircle className="w-6 h-6 text-primary" />
        </div>
      )}
      
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className={cn(
            "w-16 h-16 rounded-full flex items-center justify-center text-3xl",
            isUnlocked ? "bg-primary/20" : "bg-muted"
          )}>
            {achievement.icon}
          </div>
          
          <div className="flex-1">
            <h3 className="font-semibold mb-1">{achievement.name}</h3>
            <p className="text-sm text-muted-foreground mb-3">
              {achievement.description}
            </p>
            
            {!isUnlocked && achievement.progress && (
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium">
                    {achievement.progress.current} / {achievement.progress.target}
                  </span>
                </div>
                <Progress 
                  value={(achievement.progress.current / achievement.progress.target) * 100}
                />
              </div>
            )}
            
            {isUnlocked && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Trophy className="w-4 h-4" />
                <span>
                  Unlocked {format(achievement.unlockedAt, 'MMM dd, yyyy')}
                </span>
              </div>
            )}
            
            <div className="mt-2">
              <Badge variant="secondary">
                +{achievement.points} points
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
```

### Tournament System

```typescript
export const TournamentCard = ({ tournament }: { tournament: Tournament }) => {
  const { data: userEntry } = useTournamentEntry(tournament.id);
  const isActive = tournament.status === 'active';
  const isUpcoming = tournament.status === 'upcoming';
  
  return (
    <Card className="overflow-hidden">
      <div className="relative h-48">
        <img 
          src={tournament.bannerImage} 
          alt={tournament.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
        
        <Badge 
          className="absolute top-4 right-4"
          variant={isActive ? "default" : "secondary"}
        >
          {tournament.status}
        </Badge>
      </div>
      
      <CardContent className="p-6">
        <h3 className="text-2xl font-bold mb-2">{tournament.title}</h3>
        <p className="text-muted-foreground mb-4">
          {tournament.description}
        </p>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm text-muted-foreground">Prize Pool</p>
            <p className="text-xl font-bold text-primary">
              ${tournament.prizePool.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Participants</p>
            <p className="text-xl font-bold">
              {tournament.participants}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Entry Fee</p>
            <p className="text-xl font-bold">
              ${tournament.entryFee}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">
              {isActive ? 'Ends' : 'Starts'}
            </p>
            <p className="text-xl font-bold">
              {format(
                isActive ? tournament.endDate : tournament.startDate,
                'MMM dd'
              )}
            </p>
          </div>
        </div>
        
        {isActive && userEntry && (
          <div className="bg-muted p-4 rounded-lg mb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Your Rank</p>
                <p className="text-2xl font-bold">#{userEntry.rank}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Your Score</p>
                <p className="text-2xl font-bold">{userEntry.score}</p>
              </div>
            </div>
          </div>
        )}
        
        <div className="flex gap-2">
          {!userEntry && isUpcoming && (
            <Button 
              className="flex-1"
              onClick={() => handleEnterTournament(tournament.id)}
            >
              Enter Tournament - ${tournament.entryFee}
            </Button>
          )}
          
          <Button 
            variant="outline"
            className="flex-1"
            onClick={() => navigate(`/tournaments/${tournament.id}`)}
          >
            {isActive ? 'View Leaderboard' : 'View Details'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
```

---

## 📊 Feature 5: Analytics Dashboard (Pro Feature)

```typescript
export const AnalyticsDashboard = () => {
  const { data: analytics } = useCatchAnalytics();
  
  return (
    <div className="analytics-dashboard">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">Catch Analytics</h1>
        <p className="text-muted-foreground">
          Insights from your fishing activity
        </p>
      </header>
      
      {/* Overview Stats */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Catches"
          value={analytics.totalCatches}
          change="+15% this month"
          icon={Fish}
        />
        <StatCard
          title="Unique Species"
          value={analytics.uniqueSpecies}
          icon={Award}
        />
        <StatCard
          title="Favorite Spot"
          value={analytics.favoriteSpot.name}
          subtitle={`${analytics.favoriteSpot.catches} catches`}
          icon={MapPin}
        />
        <StatCard
          title="Success Rate"
          value={`${analytics.successRate}%`}
          change="+5% this month"
          icon={TrendingUp}
        />
      </div>
      
      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* Catches Over Time */}
        <Card>
          <CardHeader>
            <CardTitle>Catches Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics.catchesByMonth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="catches" 
                  stroke="#f59e0b" 
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        {/* Species Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Species Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics.speciesDistribution}
                  dataKey="count"
                  nameKey="species"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label
                >
                  {analytics.speciesDistribution.map((entry, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
      
      {/* Best Times to Fish */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Best Times to Fish</CardTitle>
          <CardDescription>
            Based on your successful catches
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics.catchesByHour}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="catches" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      
      {/* Top Spots */}
      <Card>
        <CardHeader>
          <CardTitle>Your Top Fishing Spots</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.topSpots.map((spot, index) => (
              <div key={spot.id} className="flex items-center gap-4">
                <div className="text-2xl font-bold text-muted-foreground w-8">
                  #{index + 1}
                </div>
                <img 
                  src={spot.image} 
                  alt={spot.name}
                  className="w-16 h-16 rounded object-cover"
                />
                <div className="flex-1">
                  <h4 className="font-semibold">{spot.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    {spot.location}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold">{spot.catches}</p>
                  <p className="text-sm text-muted-foreground">catches</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
```

---

## 🎯 Conversion Optimization Strategies

### 1. Free Trial Strategy

```typescript
export const FreeTrialBanner = () => {
  const { user } = useAuth();
  const { subscription } = useSubscription();
  
  // Only show to free users who haven't had a trial
  if (subscription?.tier !== 'free' || subscription?.hadTrial) {
    return null;
  }
  
  return (
    <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground p-6 rounded-lg mb-8">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold mb-2">
            Try Pro Free for 14 Days
          </h3>
          <p className="opacity-90">
            Unlock unlimited spots, advanced analytics, and more. 
            No credit card required.
          </p>
        </div>
        <Button 
          size="lg"
          variant="secondary"
          onClick={handleStartTrial}
        >
          Start Free Trial
        </Button>
      </div>
    </div>
  );
};
```

### 2. Social Proof

```typescript
export const SocialProofSection = () => {
  return (
    <div className="py-12 bg-muted/50">
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-8">
          Trusted by Thousands of Anglers
        </h2>
        
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <div className="text-center">
            <p className="text-4xl font-bold text-primary mb-2">50,000+</p>
            <p className="text-muted-foreground">Active Users</p>
          </div>
          <div className="text-center">
            <p className="text-4xl font-bold text-primary mb-2">500,000+</p>
            <p className="text-muted-foreground">Catches Logged</p>
          </div>
          <div className="text-center">
            <p className="text-4xl font-bold text-primary mb-2">4.8/5</p>
            <p className="text-muted-foreground">Average Rating</p>
          </div>
        </div>
        
        {/* Testimonials */}
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="mb-4 italic">"{testimonial.quote}"</p>
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={testimonial.avatar} />
                  </Avatar>
                  <div>
                    <p className="font-semibold">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {testimonial.title}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};
```

### 3. Exit Intent Popup

```typescript
export const ExitIntentPopup = () => {
  const [show, setShow] = useState(false);
  
  useEffect(() => {
    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0) {
        setShow(true);
      }
    };
    
    document.addEventListener('mouseleave', handleMouseLeave);
    return () => document.removeEventListener('mouseleave', handleMouseLeave);
  }, []);
  
  return (
    <Dialog open={show} onOpenChange={setShow}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Wait! Before You Go...</DialogTitle>
          <DialogDescription>
            Get 20% off your first month of Pro
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-primary/10 p-4 rounded-lg text-center">
            <p className="text-3xl font-bold text-primary mb-2">
              $7.99/month
            </p>
            <p className="text-sm text-muted-foreground line-through">
              Regular price: $9.99/month
            </p>
          </div>
          
          <ul className="space-y-2">
            <li className="flex items-center gap-2">
              <Check className="w-5 h-5 text-primary" />
              <span>Unlimited fishing spots</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-5 h-5 text-primary" />
              <span>Advanced analytics</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-5 h-5 text-primary" />
              <span>Ad-free experience</span>
            </li>
          </ul>
          
          <Button className="w-full" size="lg">
            Claim 20% Discount
          </Button>
          
          <p className="text-xs text-center text-muted-foreground">
            Offer expires in 10 minutes
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
```

---

## 🎨 UI/UX Best Practices Summary

### Design Principles
1. **Clear Value Proposition:** Users should immediately understand what they're paying for
2. **Transparent Pricing:** No hidden fees or confusing terms
3. **Easy Upgrades:** One-click upgrade process
4. **Graceful Degradation:** Free tier should still be valuable
5. **Social Proof:** Show testimonials, user counts, ratings
6. **Urgency (Ethical):** Limited-time offers, trial periods
7. **Progressive Disclosure:** Don't overwhelm with all features at once
8. **Mobile-First:** All monetization features must work perfectly on mobile

### Conversion Optimization
1. **A/B Test Everything:** Pricing, CTAs, feature placement
2. **Track Metrics:** Conversion rates, churn, LTV
3. **Reduce Friction:** Minimize steps to purchase
4. **Build Trust:** Security badges, money-back guarantee
5. **Offer Trials:** Let users experience value before paying
6. **Retargeting:** Email campaigns for cart abandonment
7. **Personalization:** Show relevant offers based on user behavior

---

**This specification provides the foundation for building a profitable, user-friendly monetization system. Start with subscriptions, then layer in marketplace and affiliates for maximum revenue potential!** 🚀
