# ReelSpot - Immediate Action Plan

**Created:** January 25, 2026  
**Priority:** HIGH  
**Estimated Time:** 4-6 hours

---

## 🚨 Critical Issues (Fix Today)

### 1. Secure Environment Variables (30 minutes)

**Current Risk:** HIGH - Supabase credentials may be exposed

```bash
# Step 1: Add .env to .gitignore
echo ".env" >> .gitignore

# Step 2: Remove .env from git history
git rm --cached .env

# Step 3: Commit the change
git add .gitignore
git commit -m "chore: remove .env from version control"
```

**Create `.env.example`:**
```env
VITE_SUPABASE_PROJECT_ID=your_project_id_here
VITE_SUPABASE_PUBLISHABLE_KEY=your_publishable_key_here
VITE_SUPABASE_URL=your_supabase_url_here
```

### 2. Fix ESLint Errors (1 hour)

**Current Status:** 5 errors, 13 warnings

**Files to fix:**
- `src/components/CountrySelector.tsx` (line 173: remove `any` type)
- `tailwind.config.ts` (address fast refresh warning)

```bash
# Run linter to see all issues
npm run lint

# Fix auto-fixable issues
npm run lint -- --fix
```

### 3. Add Environment Variable Validation (15 minutes)

**File:** `src/integrations/supabase/client.ts`

```typescript
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  throw new Error(
    '❌ Missing Supabase environment variables. Please check your .env file.\n' +
    'Required: VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY'
  );
}

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});
```

---

## ⚡ Quick Wins (Fix This Week)

### 4. Add Error Boundary (30 minutes)

Create `src/components/ErrorBoundary.tsx` and wrap your app.

### 5. Improve TypeScript Config (20 minutes)

**File:** `tsconfig.json`

Enable these gradually:
```json
{
  "compilerOptions": {
    "noImplicitAny": true,
    "strictNullChecks": true
  }
}
```

Fix resulting errors file by file.

### 6. Add Image Lazy Loading (15 minutes)

Add `loading="lazy"` to all `<img>` tags:

```typescript
<img 
  src={spot.image} 
  alt={spot.title}
  loading="lazy"
  decoding="async"
  className="w-full h-48 object-cover"
/>
```

### 7. Implement Code Splitting (30 minutes)

**File:** `src/App.tsx`

```typescript
import { lazy, Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

const Index = lazy(() => import('./pages/Index'));
const SpotDetail = lazy(() => import('./pages/SpotDetail'));
const MapView = lazy(() => import('./pages/MapView'));
const CatchLog = lazy(() => import('./pages/CatchLog'));
const CommunityFeed = lazy(() => import('./pages/CommunityFeed'));
const Marketplace = lazy(() => import('./pages/Marketplace'));
const Auth = lazy(() => import('./pages/Auth'));

const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="space-y-4 w-full max-w-md px-4">
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-64 w-full" />
      <Skeleton className="h-32 w-full" />
    </div>
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/spot/:slug" element={<SpotDetail />} />
              <Route path="/map" element={<MapView />} />
              <Route path="/catches" element={<CatchLog />} />
              <Route path="/community" element={<CommunityFeed />} />
              <Route path="/marketplace" element={<Marketplace />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);
```

### 8. Add Better Error Handling (45 minutes)

Update all React Query hooks with proper error handling:

```typescript
const { data: catches = [], isLoading, error } = useQuery({
  queryKey: ['catches'],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('catch_logs')
      .select('*')
      .order('caught_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch catches:', error);
      throw new Error('Unable to load your catches. Please try again.');
    }
    return data as CatchLog[];
  },
  retry: 3,
  retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
});

// Show error state
if (error) {
  return (
    <div className="text-center py-12">
      <p className="text-destructive mb-4">{error.message}</p>
      <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['catches'] })}>
        Try Again
      </Button>
    </div>
  );
}
```

---

## 📋 Checklist

### Security
- [ ] Remove .env from git
- [ ] Create .env.example
- [ ] Add environment variable validation
- [ ] Review Supabase RLS policies

### Code Quality
- [ ] Fix all ESLint errors
- [ ] Fix ESLint warnings
- [ ] Enable stricter TypeScript
- [ ] Add error boundaries
- [ ] Improve error handling

### Performance
- [ ] Add lazy loading to images
- [ ] Implement code splitting
- [ ] Add loading skeletons
- [ ] Test on slow network

### Testing
- [ ] Run app locally
- [ ] Test all major features
- [ ] Test error scenarios
- [ ] Test on mobile device

---

## 🎯 Success Criteria

After completing this action plan:

✅ No security vulnerabilities  
✅ Zero ESLint errors  
✅ Proper error handling throughout  
✅ Faster initial page load  
✅ Better user experience with loading states  
✅ TypeScript catching more bugs  

---

## 📞 Need Help?

If you encounter issues:

1. **ESLint errors:** Run `npm run lint` to see details
2. **TypeScript errors:** Run `npm run build` to see all type errors
3. **Runtime errors:** Check browser console
4. **Supabase issues:** Check Supabase dashboard logs

---

## 🚀 After This Week

Once immediate issues are resolved, move to:
- Comprehensive testing
- Accessibility improvements
- Advanced features (see COMPREHENSIVE_REVIEW_AND_RECOMMENDATIONS.md)
- Performance optimization
- Mobile app enhancements

---

**Remember:** Small, incremental improvements are better than trying to fix everything at once!
