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
  phoneNumber: string | null;
  role: UserRole;
  firebaseUser: FirebaseUser;
}

interface AuthContextType {
  user: AppUser | null;
  isUserLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const value = {
    user: null,
    isUserLoading: false,
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
