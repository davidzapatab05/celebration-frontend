'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function AuthCallbackContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        // Function to extract token from URL (Search Params or Hash)
        const getToken = () => {
            // Priority 1: Check Hash (New method)
            if (window.location.hash) {
                const params = new URLSearchParams(window.location.hash.substring(1)); // Remove the #
                return params.get('token');
            }
            // Priority 2: Check standard query params (Old method / Fallback)
            return searchParams.get('token');
        };

        const token = getToken();
        const error = searchParams.get('error');

        if (token) {
            localStorage.setItem('auth_token', token);
            router.push('/dashboard');
        } else if (error) {
            console.error('Login error:', error);
            router.push(`/?error=${encodeURIComponent(error)}`);
        } else {
            // Only redirect if we are sure there is no token in hash either
            if (!window.location.hash) {
                router.push('/');
            }
        }
    }, [searchParams, router]);

    return (
        <div className="flex min-h-screen items-center justify-center bg-purple-50">
            <div className="animate-pulse text-purple-600 font-medium">Verificando sesión...</div>
        </div>
    );
}

export default function AuthCallbackPage() {
    return (
        <Suspense>
            <AuthCallbackContent />
        </Suspense>
    )
}
