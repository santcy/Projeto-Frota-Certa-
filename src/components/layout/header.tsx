'use client';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { LogOut, User as UserIcon } from 'lucide-react'; // Renamed to avoid conflict
import { useAuth } from '@/context/auth-context';
import { useAuth as useFirebaseAuth } from '@/firebase'; // Firebase auth instance
import { Skeleton } from '@/components/ui/skeleton';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export function Header() {
  const { user } = useAuth();
  const auth = useFirebaseAuth();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch(e) {
      // ignore
    }
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-card px-4 md:px-6">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="md:hidden" />
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-10 w-10 rounded-full">
            <Avatar className="h-10 w-10">
              <AvatarImage
                src={user?.firebaseUser.photoURL || `https://avatar.vercel.sh/guest.png`}
                alt={user?.name || 'Usuário'}
                data-ai-hint="person portrait"
              />
              <AvatarFallback>
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          {user ? (
            <>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {user.name}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/profile">
                    <UserIcon className="mr-2 h-4 w-4" />
                    <span>Perfil</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sair</span>
              </DropdownMenuItem>
            </>
          ) : (
             <DropdownMenuItem asChild>
                <Link href="/login">
                  <UserIcon className="mr-2 h-4 w-4" />
                  <span>Login</span>
                </Link>
             </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
