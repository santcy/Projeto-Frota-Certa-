'use client';

import { SidebarProvider, Sidebar } from '@/components/ui/sidebar';
import { Header } from '@/components/layout/header';
import { SidebarNav } from '@/components/layout/sidebar-nav';
import { useAuth } from '@/context/auth-context';
import { Skeleton } from '@/components/ui/skeleton';

function AppLayoutSkeleton() {
  return (
    <div className="flex min-h-screen">
      <div className="hidden md:block border-r bg-sidebar" style={{ width: '16rem' }}>
        <div className="flex h-full flex-col p-2 gap-2">
            <div className="flex items-center gap-3 p-2 h-16 border-b">
                <Skeleton className="h-8 w-8" />
                <Skeleton className="h-6 w-24" />
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
            </div>
        </div>
      </div>
      <div className="flex flex-1 flex-col">
        <div className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-card px-4 md:px-6">
           <Skeleton className="h-7 w-7 md:hidden" />
            <Skeleton className="h-10 w-10 rounded-full ml-auto" />
        </div>
        <main className="flex-1 p-4 md:p-6">
            <Skeleton className="h-full w-full" />
        </main>
      </div>
    </div>
  )
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { isUserLoading } = useAuth();

  if (isUserLoading) {
    return <AppLayoutSkeleton />;
  }

  return (
      <SidebarProvider>
        <div className="flex min-h-screen">
          <Sidebar>
            <SidebarNav />
          </Sidebar>
          <div className="flex flex-1 flex-col">
            <Header />
            <main className="flex-1 overflow-y-auto bg-background p-4 md:p-6">
              {children}
            </main>
          </div>
        </div>
      </SidebarProvider>
  );
}
