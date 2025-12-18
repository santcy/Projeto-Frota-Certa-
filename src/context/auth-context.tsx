'use client';

import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth as useFirebaseAuth, useFirestore } from '@/firebase';

export type AppUser = {
  uid: string;
  email: string | null;
  name: string | null;
  role: 'admin' | 'driver';
  firebaseUser: FirebaseUser;
};

interface AuthContextType {
  user: AppUser | null;
  isUserLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useFirebaseAuth();
  const firestore = useFirestore();
  const [user, setUser] = useState<AppUser | null>(null);
  const [isUserLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setIsLoading(false);
        return;
      }

      const userDocRef = doc(firestore, 'users', firebaseUser.uid);
      try {
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            name: firebaseUser.displayName,
            role: userData.userType || 'driver', // Default to 'driver' if not set
            firebaseUser: firebaseUser,
          });
        } else {
           // This can happen during sign-up before the user doc is created.
           // For now, we'll set a temporary state.
           setUser({
             uid: firebaseUser.uid,
             email: firebaseUser.email,
             name: firebaseUser.displayName,
             role: 'driver', // Assume driver until doc is created
             firebaseUser: firebaseUser,
           });
        }
      } catch (error) {
        console.error("Failed to fetch user role:", error);
        // Fallback to a default user object without a role
         setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            name: firebaseUser.displayName,
            role: 'driver',
            firebaseUser: firebaseUser,
          });
      } finally {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, [auth, firestore]);

  return (
    <AuthContext.Provider value={{ user, isUserLoading }}>
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
