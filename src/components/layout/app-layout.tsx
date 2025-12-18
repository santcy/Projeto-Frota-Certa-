'use client';

import { SidebarProvider, Sidebar, SidebarHeader, SidebarContent, SidebarFooter } from '@/components/ui/sidebar';
import { Header } from '@/components/layout/header';
import { SidebarNav } from '@/components/layout/sidebar-nav';
import { useAuth } from '@/firebase/auth';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Truck } from 'lucide-react';

function AppLayoutSkeleton() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
          <Sidebar>
              <SidebarHeader className="border-b">
                <div className="flex items-center gap-3">
                  <Truck className="h-8 w-8 text-primary" />
                  <div className='opacity-100'>
                    <h2 className="font-semibold text-lg text-sidebar-foreground">
                       <Skeleton className="h-6 w-24" />
                    </h2>
                  </div>
                </div>
              </SidebarHeader>
              <SidebarContent className="p-2">
                <div className="flex w-full min-w-0 flex-col gap-1">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                </div>
              </SidebarContent>
               <div className="my-2 border-t border-sidebar-border"></div>
              <SidebarFooter className="p-2">
                  <div className='flex flex-col gap-2 items-center text-center opacity-100'>
                       <Skeleton className="h-4 w-3/4" />
                  </div>
              </SidebarFooter>
          </Sidebar>
          <div className="flex flex-1 flex-col">
              <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-card px-4 md:px-6">
                <Skeleton className="h-7 w-7 md:hidden" />
                <Skeleton className="h-10 w-10 rounded-full ml-auto" />
              </header>
              <main className="flex-1 overflow-y-auto bg-background p-4 md:p-6">
                <Skeleton className="h-full w-full" />
              </main>
          </div>
      </div>
    </SidebarProvider>
  )
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { loading } = useAuth();

  if (loading) {
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
