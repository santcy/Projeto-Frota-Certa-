'use client';
import { createContext, useContext, ReactNode, useMemo } from 'react';
import { useUser } from '@/firebase'; // Using the hook from Firebase setup
import type { User as FirebaseUser } from 'firebase/auth';

export type UserRole = 'admin' | 'driver';

interface AppUser {
  uid: string;
  name: string | null;
  email: string | null;
  role: UserRole;
  firebaseUser: FirebaseUser;
}

interface AuthContextType {
  user: AppUser | null;
  isUserLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// A simple mock function to determine role. In a real app, this would come
// from a user's profile in Firestore or from custom claims.
function getRoleFromUser(user: FirebaseUser | null): UserRole {
  // For demonstration, let's make a specific email an admin.
  if (user?.email === 'admin@rotacerta.com') {
    return 'admin';
  }
  // All other authenticated users are drivers.
  return 'driver';
}


export function AuthProvider({ children }: { children: ReactNode }) {
  const { user: firebaseUser, isUserLoading } = useUser();

  // Create an enriched AppUser object.
  const appUser: AppUser | null = useMemo(() => {
    if (!firebaseUser) return null;
    
    // In a real app, you would fetch the user's profile from Firestore
    // to get their name and role. For now, we'll derive it.
    const name = firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Usuário';
    const role = getRoleFromUser(firebaseUser);

    return {
      uid: firebaseUser.uid,
      name,
      email: firebaseUser.email,
      role,
      firebaseUser,
    };
  }, [firebaseUser]);

  const value = {
    user: appUser,
    isUserLoading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
