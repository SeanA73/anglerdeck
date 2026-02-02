
# AI Features Enhancement Plan for ReelSpot

## Overview

ReelSpot has a strong foundation for AI features (currently dormant in `.bak` files) and is connected to Lovable Cloud, which provides seamless access to AI models via the Lovable AI Gateway. This plan outlines practical AI features that will enhance user engagement and support the monetization strategy (Elite tier features).

## Recommended AI Features

### 1. AI Fishing Assistant Chatbot (High Value)
A conversational AI assistant that helps anglers with real-time advice.

**Capabilities:**
- Answer fishing technique questions ("What's the best lure for bass in murky water?")
- Provide species-specific tips based on current weather conditions
- Explain local regulations and license requirements
- Suggest spots based on user preferences
- Troubleshoot common fishing problems

**Placement:** Floating chat button on Support page and SpotDetail pages

**Tier:** Available to Pro/Elite users

### 2. AI Fish Species Identification (Vision AI)
Allow users to upload photos of their catches and automatically identify the species.

**Capabilities:**
- Analyze uploaded catch photos using AI vision
- Return species identification with confidence score
- Auto-populate the species field in Catch Log
- Provide interesting facts about the identified species
- Suggest if the fish meets size/catch limits

**Placement:** Catch Log page - "Identify with AI" button on photo upload

**Tier:** Elite only feature

### 3. AI-Generated Catch Stories (Content AI)
Help users create engaging community posts about their catches.

**Capabilities:**
- Generate creative captions based on catch details (species, weight, location, weather)
- Multiple tone options: Casual, Proud, Humorous, Educational
- Include relevant hashtags
- Suggest best practices for the photo

**Placement:** Community Feed - "Magic Write" button in Create Post dialog

**Tier:** Pro/Elite feature

### 4. Personalized Bait & Gear Recommendations (Restore Existing)
Activate the existing AI recommendation engine from the `.bak` files.

**Capabilities:**
- Analyze user's catch history to find patterns
- Cross-reference with current weather/conditions
- Recommend specific baits with confidence scores
- Link to affiliate products in the Marketplace

**Placement:** SpotDetail page sidebar (below Weather) and dedicated AI Insights tab

**Tier:** Elite only (already gated in code)

### 5. Smart Fishing Trip Planner
AI-powered trip planning based on multiple factors.

**Capabilities:**
- Suggest optimal dates based on weather forecasts
- Recommend spots based on target species
- Generate packing lists based on conditions
- Estimate success probability for planned trips

**Placement:** New "Plan Trip" feature in Account dashboard

**Tier:** Elite only

## Technical Architecture

### Backend Structure
```text
supabase/functions/
├── ai-chat/           # Fishing assistant chatbot
├── ai-identify-fish/  # Vision AI for species ID
├── ai-generate-story/ # Content generation
└── ai-recommendations/# Personalized suggestions
```

### Data Flow
```text
User Action (e.g., upload photo)
       │
       ▼
Edge Function (ai-identify-fish)
       │
       ├─► Lovable AI Gateway (Gemini Vision)
       │         │
       │         ▼
       │   Species + Confidence
       │
       ▼
Return to Client + Auto-fill Form
```

### Model Selection
| Feature | Recommended Model | Reason |
|---------|-------------------|--------|
| Chatbot | google/gemini-3-flash-preview | Fast, conversational |
| Fish ID | google/gemini-2.5-pro | Best vision + reasoning |
| Stories | google/gemini-3-flash-preview | Creative, fast |
| Recommendations | google/gemini-2.5-flash | Balanced analysis |

## Implementation Priority

### Phase 1: Quick Wins (This Implementation)
1. **AI Fishing Assistant Chatbot** - Highest user value, uses existing Support page
2. **AI-Generated Catch Stories** - Increases community engagement

### Phase 2: Advanced Features
3. **Fish Species Identification** - Requires vision model
4. **Restore AI Recommendations** - Activate `.bak` files

### Phase 3: Premium Features
5. **Smart Trip Planner** - Complex multi-factor analysis

## Files to Create/Modify

### New Files
- `supabase/functions/ai-chat/index.ts` - Chatbot edge function
- `supabase/functions/ai-generate-story/index.ts` - Story generator
- `src/components/ai/FishingAssistant.tsx` - Chat UI component
- `src/components/ai/MagicWriteButton.tsx` - Story generator button
- `src/hooks/useAIChat.ts` - Chat state management

### Modified Files
- `supabase/config.toml` - Register new edge functions
- `src/pages/Support.tsx` - Add chatbot button
- `src/pages/CommunityFeed.tsx` - Import MagicWrite component
- `src/components/community/CreatePostDialog.tsx` - Add AI story button

## UI Design

### Chatbot Interface
```text
┌─────────────────────────────────────┐
│  🎣 Fishing Assistant          [×]  │
├─────────────────────────────────────┤
│                                     │
│  AI: Hi! I'm your fishing guide.   │
│      What can I help you with?     │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ What bait works best for    │   │
│  │ bass in cold weather?       │   │
│  └─────────────────────────────┘   │
│                                     │
│  AI: For cold-water bass, slow     │
│      presentations work best...     │
│                                     │
├─────────────────────────────────────┤
│  [Type your question...]      [➤]  │
└─────────────────────────────────────┘
```

### Magic Write Button
```text
┌─────────────────────────────────────┐
│ Create Post                         │
├─────────────────────────────────────┤
│                                     │
│ [Photo of 5lb bass uploaded]        │
│                                     │
│ Caption:                            │
│ ┌─────────────────────────────────┐ │
│ │ [AI-generated text here...]     │ │
│ │                                 │ │
│ └─────────────────────────────────┘ │
│                                     │
│ [✨ Magic Write]  [🎯 Casual ▼]    │
│                                     │
│              [Post]                 │
└─────────────────────────────────────┘
```

## Cost & Rate Limiting

- Uses Lovable AI Gateway (LOVABLE_API_KEY auto-provisioned)
- Free tier included, then usage-based billing
- Rate limits handled with 429/402 error responses
- Cache common responses where applicable

## Security Considerations

- All AI calls go through edge functions (never client-side)
- System prompts kept server-side only
- User inputs sanitized before sending to AI
- Feature access gated by subscription tier
