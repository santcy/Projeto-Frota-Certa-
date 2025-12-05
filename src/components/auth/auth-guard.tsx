'use client';

import { useAuth } from '@/context/auth-context';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';

const protectedRoutes = ['/dashboard', '/vehicles', '/reports', '/checklist/light', '/checklist/heavy']; // Routes that require authentication

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isUserLoading) return; // Wait for user status to be resolved

    const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

    if (!user && isProtectedRoute) {
      router.push('/login');
    }

    if (user && pathname === '/login') {
        router.push('/dashboard');
    }
    
    if (user && pathname === '/') {
        router.push('/dashboard');
    }


  }, [user, isUserLoading, router, pathname]);

  // While loading, or if unauthenticated on a protected route, show a loader
  if (isUserLoading && protectedRoutes.some(route => pathname.startsWith(route))) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If user is not logged in and it's a protected route, we return null because the useEffect is already handling the redirect.
  if (!user && protectedRoutes.some(route => pathname.startsWith(route))) {
    return null;
  }
  
  // If user is logged in and trying to access login page, we return null because the useEffect is already handling the redirect.
  if(user && pathname === '/login') {
    return null;
  }


  return <>{children}</>;
}
