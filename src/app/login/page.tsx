'use client';
import { AuthForm } from '@/components/auth/auth-form';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { Wrench } from 'lucide-react';
import { useEffect } from 'react';

export default function LoginPage() {
  const { user, isUserLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && user) {
      router.push('/dashboard');
    }
  }, [user, isUserLoading, router]);
  
  if (isUserLoading || user) {
    return (
       <div className="flex min-h-screen flex-col items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="mx-auto w-full max-w-md space-y-6">
        <div className="flex flex-col items-center text-center">
          <Wrench className="h-12 w-12 text-primary" />
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground">
            Rota Certa
          </h1>
          <p className="mt-2 text-muted-foreground">
            Acesse sua conta para gerenciar a frota.
          </p>
        </div>
        <AuthForm />
      </div>
    </div>
  );
}
