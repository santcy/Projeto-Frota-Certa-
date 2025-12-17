'use client';

import React, { useState, type ReactNode } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { firebaseConfig } from './config';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

// This function safely initializes Firebase and returns the services.
// It handles the singleton pattern to avoid re-initialization.
function initializeFirebaseServices() {
  const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  // Use getFirestore() which is idempotent. It initializes Firestore with default settings
  // on the first call and returns the existing instance on subsequent calls.
  // This avoids the "initializeFirestore has already been called" error in HMR environments.
  const firestore = getFirestore(app);
  const auth = getAuth(app);
  return { app, firestore, auth };
}


export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  // Use useState to ensure that Firebase is initialized only once on the client-side.
  // The initializer function passed to useState is executed only during the initial render.
  const [firebaseServices] = useState(() => {
    const { app, firestore, auth } = initializeFirebaseServices();
    return { firebaseApp: app, firestore, auth };
  });

  return (
    <FirebaseProvider
      firebaseApp={firebaseServices.firebaseApp}
      auth={firebaseServices.auth}
      firestore={firebaseServices.firestore}
    >
      {children}
    </FirebaseProvider>
  );
}
