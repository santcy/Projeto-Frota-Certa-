'use client';
import { createContext, useContext, ReactNode, useMemo } from 'react';
import { useUser } from '@/firebase'; // Using the hook from Firebase setup
import type { User as FirebaseUser } from 'firebase/auth';

export interface AppUser {
  uid: string;
  name: string | null;
  email: string | null;
  firebaseUser: FirebaseUser;
}

interface AuthContextType {
  user: AppUser | null;
  isUserLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { user: firebaseUser, isUserLoading: isAuthLoading } = useUser();

  const user = useMemo<AppUser | null>(() => {
    if (!firebaseUser) return null;

    // Simplified user object, does not depend on Firestore profile anymore.
    return {
      uid: firebaseUser.uid,
      name: firebaseUser.displayName,
      email: firebaseUser.email,
      firebaseUser,
    };
  }, [firebaseUser]);

  const value = {
    user,
    isUserLoading: isAuthLoading,
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
