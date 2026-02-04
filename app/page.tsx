'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { GoogleLoginButton } from '@/components/google-login-button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Heart } from 'lucide-react';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      router.push('/dashboard');
    }
  }, [router]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-purple-50 p-4">
      <Card className="w-full max-w-md shadow-xl border-purple-100">
        <CardHeader className="text-center">
          <div className="mx-auto bg-purple-100 w-12 h-12 rounded-full flex items-center justify-center mb-4">
            <Heart className="w-6 h-6 text-purple-600 fill-purple-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-purple-950">Celebra 🎉</CardTitle>
          <CardDescription className="text-purple-600/80">
            Crea invitaciones especiales para celebrar momentos únicos
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <GoogleLoginButton />
          <p className="text-xs text-center text-muted-foreground mt-4">
            Al continuar, aceptas dar acceso a tus datos básicos de perfil (Nombre, Email, Foto).
            El sistema verificará tu membresía automáticamente.
          </p>
        </CardContent>
      </Card>

      <div className="absolute bottom-4 text-center text-xs text-purple-300">
        Hecho con ❤️ para celebrar momentos especiales
      </div>
    </main>
  );
}
