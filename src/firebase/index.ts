'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { Auth, getAuth } from 'firebase/auth';
import {
  Firestore,
  getFirestore,
  clearIndexedDbPersistence,
  enableIndexedDbPersistence,
  initializeFirestore,
  memoryLocalCache,
} from 'firebase/firestore';

function getSdks(firebaseApp: FirebaseApp) {
  const firestore = getFirestore(firebaseApp);
  const auth = getAuth(firebaseApp);

  return {
    firebaseApp,
    auth,
    firestore,
  };
}

// IMPORTANT: DO NOT MODIFY THIS FUNCTION
export function initializeFirebase() {
  if (getApps().length > 0) {
    return getSdks(getApp());
  }

  // Always initialize with the config. In a production Firebase Hosting
  // environment, the SDK will automatically ignore this and use the
  // reserved endpoint, but in a local environment this is required.
  const app = initializeApp(firebaseConfig);

  // Initialize Firestore with memory cache for both server and client.
  initializeFirestore(app, {
    localCache: memoryLocalCache(),
  });

  // This part should only run on the client to enable IndexedDB persistence
  if (typeof window !== 'undefined') {
    const firestoreInstance = getFirestore(app);
    clearIndexedDbPersistence(firestoreInstance)
      .then(() => enableIndexedDbPersistence(firestoreInstance))
      .catch((err) => {
        if (err.code == 'failed-precondition') {
          console.warn(
            'Firestore persistence failed to enable. This can happen if you have multiple tabs open.'
          );
        } else if (err.code == 'unimplemented') {
          console.warn(
            'The current browser does not support all of the features required to enable Firestore persistence.'
          );
        } else {
          console.error('Failed to initialize Firestore persistence:', err);
        }
      });
  }

  return getSdks(app);
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './errors';
export * from './error-emitter';
