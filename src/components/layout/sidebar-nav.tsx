'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ClipboardCheck,
  FileText,
  LayoutDashboard,
  Truck,
  Wrench,
  Archive,
  ClipboardList,
} from 'lucide-react';
import {
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarContent,
  SidebarMenuSub,
  SidebarMenuSubButton,
} from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useSidebar } from '@/components/ui/sidebar';
import { useAuth } from '@/context/auth-context';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

export function SidebarNav() {
  const pathname = usePathname();
  const { open } = useSidebar();
  const { user } = useAuth();
  
  const isReportsActive = pathname.startsWith('/reports');

  return (
    <>
      <SidebarHeader className="border-b">
        <div className="flex items-center gap-3">
          <Wrench className="h-8 w-8 text-primary" />
          <div
            className={cn(
              'transition-opacity duration-200 whitespace-nowrap',
              open ? 'opacity-100' : 'opacity-0'
            )}
          >
            <h2 className="font-semibold text-lg text-sidebar-foreground">
              Rota Certa
            </h2>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent className="p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname === '/dashboard'} tooltip={{ children: 'Dashboard' }}>
              <Link href="/dashboard"><LayoutDashboard /><span>Dashboard</span></Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname.startsWith('/vehicles')} tooltip={{ children: 'Veículos' }}>
              <Link href="/vehicles"><Truck /><span>Veículos</span></Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname.startsWith('/checklist/light')} tooltip={{ children: 'Checklist Leve' }}>
              <Link href="/checklist/light"><ClipboardCheck /><span>Checklist Leve</span></Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname.startsWith('/checklist/heavy')} tooltip={{ children: 'Checklist Pesado' }}>
              <Link href="/checklist/heavy"><ClipboardCheck /><span>Checklist Pesado</span></Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname.startsWith('/requests')} tooltip={{ children: 'Peças Solicitadas' }}>
              <Link href="/requests"><ClipboardList /><span>Peças Solicitadas</span></Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <Collapsible>
              <CollapsibleTrigger asChild>
                <SidebarMenuButton isSubmenuOpen={isReportsActive} isActive={isReportsActive} tooltip={{ children: 'Relatórios' }}>
                  <Archive />
                  <span>Relatórios</span>
                </SidebarMenuButton>
              </CollapsibleTrigger>
              <CollapsibleContent>
                 <SidebarMenuSub>
                    <SidebarMenuItem>
                        <SidebarMenuSubButton asChild isActive={pathname.startsWith('/reports/light/unified')}>
                            <Link href="/reports/light/unified">Unificado Leve</Link>
                        </SidebarMenuSubButton>
                    </SidebarMenuItem>
                     <SidebarMenuItem>
                        <SidebarMenuSubButton asChild isActive={pathname.startsWith('/reports/heavy/unified')}>
                            <Link href="/reports/heavy/unified">Unificado Pesado</Link>
                        </SidebarMenuSubButton>
                    </SidebarMenuItem>
                </SidebarMenuSub>
              </CollapsibleContent>
            </Collapsible>
          </SidebarMenuItem>

        </SidebarMenu>
      </SidebarContent>
      <Separator className="my-2 bg-sidebar-border" />
      <SidebarFooter className="p-2">
        <div
          className={cn(
            'flex flex-col gap-2 items-center text-center transition-opacity duration-200',
            open ? 'opacity-100' : 'opacity-0'
          )}
        >
          <p className="text-xs text-sidebar-foreground/70">
            © {new Date().getFullYear()} Rota Certa.
          </p>
        </div>
      </SidebarFooter>
    </>
  );
}
