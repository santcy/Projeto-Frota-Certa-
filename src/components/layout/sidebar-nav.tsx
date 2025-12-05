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
} from 'lucide-react';
import {
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarContent,
} from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useSidebar } from '@/components/ui/sidebar';
import { useAuth, UserRole } from '@/context/auth-context';

const allNavItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin'] },
  { href: '/vehicles', label: 'Veículos', icon: Truck, roles: ['admin'] },
  { href: '/reports', label: 'Histórico', icon: FileText, roles: ['admin'] },
  { href: '/reports/unified', label: 'Relatório Unificado', icon: Archive, roles: ['admin'] },
  { href: '/checklist/light', label: 'Checklist Leve', icon: ClipboardCheck, roles: ['admin', 'driver'] },
  { href: '/checklist/heavy', label: 'Checklist Pesado', icon: ClipboardCheck, roles: ['admin', 'driver'] },
];

export function SidebarNav() {
  const pathname = usePathname();
  const { open } = useSidebar();
  const { user } = useAuth();

  const navItems = allNavItems.filter(item => user && item.roles.includes(user.role));

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
          {navItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={
                  item.href === '/'
                    ? pathname === item.href
                    : pathname.startsWith(item.href)
                }
                tooltip={{ children: item.label }}
              >
                <Link href={item.href}>
                  <item.icon />
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
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
