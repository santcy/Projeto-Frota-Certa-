'use client';

import { SidebarProvider, Sidebar } from '@/components/ui/sidebar';
import { Header } from '@/components/layout/header';
import { SidebarNav } from '@/components/layout/sidebar-nav';

export function AppLayout({ children }: { children: React.ReactNode }) {
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
