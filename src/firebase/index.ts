'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { Auth, getAuth } from 'firebase/auth';
import { Firestore, getFirestore, clearIndexedDbPersistence, enableIndexedDbPersistence } from 'firebase/firestore'

// IMPORTANT: DO NOT MODIFY THIS FUNCTION
export function initializeFirebase() {
  if (!getApps().length) {
    // Important! initializeApp() is called without any arguments because Firebase App Hosting
    // integrates with the initializeApp() function to provide the environment variables needed to
    // populate the FirebaseOptions in production. It is critical that we attempt to call initializeApp()
    // without arguments.
    let firebaseApp;
    let firestore: Firestore;
    try {
      // Attempt to initialize via Firebase App Hosting environment variables
      firebaseApp = initializeApp();
      firestore = getFirestore(firebaseApp);
    } catch (e) {
      // Only warn in production because it's normal to use the firebaseConfig to initialize
      // during development
      if (process.env.NODE_ENV === "production") {
        console.warn('Automatic initialization failed. Falling back to firebase config object.', e);
      }
      firebaseApp = initializeApp(firebaseConfig);
      firestore = getFirestore(firebaseApp);
    }

    // Clear persistence to fix potential corruption issues causing assertion failures.
    // This is a one-time operation on startup.
    clearIndexedDbPersistence(firestore).then(() => {
        enableIndexedDbPersistence(firestore).catch((err) => {
            if (err.code == 'failed-precondition') {
                // Multiple tabs open, persistence can only be enabled
                // in one tab at a time.
                console.warn('Firestore persistence failed to enable. Multiple tabs open?');
            } else if (err.code == 'unimplemented') {
                // The current browser does not support all of the
                // features required to enable persistence.
                console.warn('Firestore persistence is not available in this browser.');
            }
        });
    }).catch((err) => {
        console.error("Failed to clear Firestore persistence:", err);
    });

    return getSdks(firebaseApp, firestore);
  }

  // If already initialized, return the SDKs with the already initialized App
  const app = getApp();
  return getSdks(app, getFirestore(app));
}

export function getSdks(firebaseApp: FirebaseApp, firestore: Firestore) {
  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore: firestore
  };
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './errors';
export * from './error-emitter';
