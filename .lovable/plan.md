
# ReelSpot User Engagement and Conversion Optimization Plan

## Overview
This plan covers implementing five key features to improve user engagement, trust, and conversion:
1. Social Proof Section on Homepage
2. Cookie Consent Banner
3. User Account Dashboard  
4. First-Time User Onboarding Tour
5. FAQ Accordion on Support Page

---

## Phase 1: Social Proof Section on Homepage

### What We're Building
A new section on the homepage that displays testimonials from users, platform statistics, and a trust bar to build credibility with new visitors.

### Components to Create

**1. `src/components/SocialProof.tsx`**
- Animated testimonial carousel with 3-4 fishing enthusiast quotes
- Avatar images, names, and fishing achievements
- Platform stats counter (spots discovered, catches logged, active anglers)
- Trust bar with partner/feature logos

### Design Elements
- Card-based testimonial layout with star ratings
- Animated number counters for statistics
- Subtle background with fishing-themed accent colors
- Mobile-responsive grid layout

### Integration
- Add between `<FeaturedSpots />` and `<Features />` in `Index.tsx`

---

## Phase 2: Cookie Consent Banner

### What We're Building
A GDPR-compliant cookie consent banner that appears on first visit, allowing users to accept all cookies, reject non-essential ones, or customize preferences.

### Components to Create

**1. `src/components/CookieConsent.tsx`**
- Slide-up banner from bottom of screen
- Three action buttons: Accept All, Reject Non-Essential, Customize
- Persistent state using localStorage
- Links to Cookie Policy page

**2. `src/components/CookiePreferencesDialog.tsx`**
- Modal dialog for granular cookie control
- Toggle switches for: Essential (always on), Functional, Analytics, Marketing
- Save preferences button

### Integration
- Add to `App.tsx` as a global component
- Check localStorage for existing consent on mount
- Auto-hide after user makes a choice

---

## Phase 3: User Account Dashboard

### What We're Building
A centralized hub for logged-in users to view their subscription status, usage statistics, saved spots, and recent catch history.

### Pages to Create

**1. `src/pages/Account.tsx`**
Main dashboard with tabs/sections for:
- **Overview**: Subscription tier badge, quick stats summary
- **Usage Meter**: Visual progress bars for spots viewed and catches logged (using existing `UsageMeter` component)
- **Saved Spots**: Grid of bookmarked fishing locations
- **Catch History**: Recent catches with photos and details
- **Profile Settings**: Edit display name, avatar, bio

### Components to Create

**2. `src/components/account/AccountOverview.tsx`**
- Current tier display (Free/Pro/Elite) with upgrade CTA
- Monthly usage progress bars
- Next billing date (if subscribed)

**3. `src/components/account/SavedSpotsList.tsx`**
- Query saved_items table for spots
- Display as card grid with quick actions

**4. `src/components/account/CatchHistoryList.tsx`**
- Query catch_logs table for user's catches
- Paginated list with photos, species, dates

### Integration
- Add `/account` route to `App.tsx`
- Add "My Account" link to Header for logged-in users
- Redirect to `/auth` if not authenticated

---

## Phase 4: First-Time User Onboarding Tour

### What We're Building
An interactive guided tour that highlights key features when a user first signs up, helping them understand how to find spots, log catches, and use the community features.

### Components to Create

**1. `src/components/OnboardingTour.tsx`**
- Step-by-step tooltip overlay system
- Highlights key UI elements with spotlight effect
- Progress indicator (Step 1 of 4, etc.)
- Skip and Next buttons

**2. `src/hooks/useOnboarding.ts`**
- Check if user has completed onboarding (localStorage or database)
- Track current step
- Mark completion

### Tour Steps
1. **Welcome**: Brief intro to ReelSpot
2. **Explore Spots**: Point to the Featured Spots section
3. **Search & Filter**: Highlight the "View More Spots" button
4. **Log Catches**: Show the Catch Log navigation
5. **Community**: Point to community features

### Integration
- Trigger after successful signup in `Auth.tsx`
- Store completion status in localStorage (or profiles table)
- Add trigger in `Index.tsx` for first visit detection

---

## Phase 5: FAQ Accordion on Support Page

### What We're Building
Enhance the existing Support page with an expandable FAQ section using the Accordion component for common questions and answers.

### Changes to `src/pages/Support.tsx`

Add a new FAQ section with common questions organized by category:
- **Getting Started**: Account creation, first steps
- **Features**: How to use spots, catches, maps
- **Subscriptions**: Upgrading, canceling, billing
- **Technical**: Offline access, data sync, troubleshooting

### Implementation
- Use existing `@/components/ui/accordion` component
- Group FAQs by category with collapsible sections
- Add smooth animations on expand/collapse

---

## Technical Details

### New Dependencies
None required - all features use existing libraries (framer-motion, Radix UI, React Query)

### Database Changes
Optional: Add `onboarding_completed` boolean column to `profiles` table for persistent onboarding tracking

### File Summary

| File | Action | Purpose |
|------|--------|---------|
| `src/components/SocialProof.tsx` | Create | Testimonials and stats section |
| `src/components/CookieConsent.tsx` | Create | Cookie banner component |
| `src/components/CookiePreferencesDialog.tsx` | Create | Cookie preferences modal |
| `src/pages/Account.tsx` | Create | User dashboard page |
| `src/components/account/AccountOverview.tsx` | Create | Dashboard overview section |
| `src/components/account/SavedSpotsList.tsx` | Create | Saved spots grid |
| `src/components/account/CatchHistoryList.tsx` | Create | Catch history list |
| `src/components/OnboardingTour.tsx` | Create | Guided tour overlay |
| `src/hooks/useOnboarding.ts` | Create | Onboarding state management |
| `src/pages/Index.tsx` | Modify | Add SocialProof component |
| `src/pages/Support.tsx` | Modify | Add FAQ accordion |
| `src/App.tsx` | Modify | Add Account route, CookieConsent |
| `src/components/Header.tsx` | Modify | Add Account link for logged-in users |

---

## Implementation Order

1. **FAQ Accordion** - Quick win, enhances existing page
2. **Social Proof Section** - High impact on conversion
3. **Cookie Consent Banner** - Compliance requirement
4. **User Account Dashboard** - Core user experience
5. **Onboarding Tour** - Polish for new users

This order prioritizes quick wins and high-impact features first, then builds toward more complex user experience improvements.
