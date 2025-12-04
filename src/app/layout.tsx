import type { Metadata } from 'next';
import './globals.css';
import { cn } from '@/lib/utils';
import { SidebarProvider, Sidebar } from '@/components/ui/sidebar';
import { Header } from '@/components/layout/header';
import { SidebarNav } from '@/components/layout/sidebar-nav';
import { Toaster } from '@/components/ui/toaster';
import { FirebaseClientProvider } from '@/firebase';
import { AuthProvider } from '@/context/auth-context';

export const metadata: Metadata = {
  title: 'Rota Certa - Gerenciamento de Frotas',
  description:
    'Gerencie as manutenções e checklists da sua frota de forma eficiente.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={cn('font-body antialiased')}>
        <FirebaseClientProvider>
          <AuthProvider>
            <SidebarProvider>
              <div className="flex min-h-screen">
                <Sidebar>
                  <SidebarNav />
                </Sidebar>
                <div className="flex flex-1 flex-col">
                  <Header />
                  <main className="flex-1 overflow-y-auto bg-background p-4 md:p-6 lg:p-8">
                    {children}
                  </main>
                </div>
              </div>
            </SidebarProvider>
          </AuthProvider>
        </FirebaseClientProvider>
        <Toaster />
      </body>
    </html>
  );
}
