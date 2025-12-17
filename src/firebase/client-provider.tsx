'use client';

import React, { useState, type ReactNode } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, initializeFirestore, memoryLocalCache, type Firestore } from 'firebase/firestore';
import { firebaseConfig } from './config';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

// This function safely initializes Firebase and returns the services.
// It handles the singleton pattern to avoid re-initialization.
function initializeFirebaseServices() {
  const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  // Using initializeFirestore with cache options is idempotent.
  const firestore = initializeFirestore(app, {
    localCache: memoryLocalCache(),
  });
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
