'use client';

import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from './config';

type UserData = {
  uid: string;
  email: string | null;
  name: string | null;
  role: 'admin' | 'driver';
};

const AuthContext = createContext<any>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      const ref = doc(db, 'users', firebaseUser.uid);
      const snap = await getDoc(ref);

      if (!snap.exists()) {
         console.error('User document does not exist:', firebaseUser.uid);
         // Fallback or handle sign-up case where doc might not be created yet
         setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            name: firebaseUser.displayName,
            role: 'driver', // Default to driver if doc is missing
         });
      } else {
         setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            name: firebaseUser.displayName,
            role: snap.data().userType || 'driver',
         });
      }

      setLoading(false);
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
