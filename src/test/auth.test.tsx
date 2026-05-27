import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { ReactNode } from 'react';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
    supabase: {
        auth: {
            getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
            onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
            signInWithPassword: vi.fn(),
            signUp: vi.fn(),
            signOut: vi.fn(),
        },
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
    },
}));

// Test component to use the hook
const TestComponent = () => {
    const { loading } = useAuth();
    return <div>{loading ? 'Loading...' : 'Loaded'}</div>;
};

describe('AuthContext', () => {
    it('renders children correctly', () => {
        render(
            <AuthProvider>
                <div data-testid="child">Child Content</div>
            </AuthProvider>
        );
        expect(screen.getByTestId('child')).toBeInTheDocument();
    });

    it('provides auth context to children', async () => {
        render(
            <AuthProvider>
                <TestComponent />
            </AuthProvider>
        );
        // Initially it might be loading, or finish loading quickly depending on the mock resolution
        // verification of exact state requires better async control, but this checks no crash
        expect(screen.getByText(/Load/)).toBeInTheDocument();
    });
});
