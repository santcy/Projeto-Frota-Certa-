'use client';
import { createContext, useContext, ReactNode, useMemo } from 'react';
import { useUser, useDoc, useMemoFirebase } from '@/firebase'; // Using the hook from Firebase setup
import type { User as FirebaseUser } from 'firebase/auth';
import { doc } from 'firebase/firestore';
import { useFirebase } from '@/firebase';

export interface AppUser {
  uid: string;
  name: string | null;
  email: string | null;
  phoneNumber: string | null;
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
    () => (firestore && firebaseUser?.uid ? doc(firestore, 'users', firebaseUser.uid) : null),
    [firestore, firebaseUser?.uid]
  );
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<{ name: string, email: string, phoneNumber: string }>(userDocRef);

  const user = useMemo<AppUser | null>(() => {
    if (!firebaseUser || !userProfile) return null;

    return {
      uid: firebaseUser.uid,
      name: userProfile.name || firebaseUser.displayName,
      email: userProfile.email || firebaseUser.email,
      phoneNumber: userProfile.phoneNumber,
      firebaseUser,
    };
  }, [firebaseUser, userProfile]);

  const isUserLoading = isAuthLoading || (!!firebaseUser && isProfileLoading);

  const value = {
    user,
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
