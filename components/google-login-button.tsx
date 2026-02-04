'use client';

import { Button } from './ui/button';
import { Chrome } from 'lucide-react';

export function GoogleLoginButton() {
    const handleLogin = () => {
        // Redirect to backend Google Auth
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
        window.location.href = `${backendUrl}/auth/google`;
    };

    return (
        <Button onClick={handleLogin} variant="outline" className="w-full gap-2 relative">
            <Chrome className="w-5 h-5 text-purple-500" />
            Continuar con Google
        </Button>
    );
}
