'use client';
import { createContext, useContext, ReactNode, useMemo } from 'react';
import { useUser, useDoc, useMemoFirebase } from '@/firebase'; // Using the hook from Firebase setup
import type { User as FirebaseUser } from 'firebase/auth';
import { doc } from 'firebase/firestore';
import { useFirebase } from '@/firebase';

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

export function AuthProvider({ children }: { children: ReactNode }) {
  const { user: firebaseUser, isUserLoading: isAuthLoading } = useUser();
  const { firestore } = useFirebase();

  const userDocRef = useMemoFirebase(
    () => (firestore && firebaseUser ? doc(firestore, 'users', firebaseUser.uid) : null),
    [firestore, firebaseUser]
  );
  
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<{userType: UserRole, name: string}>(userDocRef);

  const isUserLoading = isAuthLoading || isProfileLoading;

  const appUser: AppUser | null = useMemo(() => {
    if (!firebaseUser) return null;
    
    const role = userProfile?.userType || 'driver';
    const name = userProfile?.name || firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Usuário';

    return {
      uid: firebaseUser.uid,
      name,
      email: firebaseUser.email,
      role,
      firebaseUser,
    };
  }, [firebaseUser, userProfile]);

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
