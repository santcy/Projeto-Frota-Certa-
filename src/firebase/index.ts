'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { Auth, getAuth } from 'firebase/auth';
import {
  Firestore,
  getFirestore,
  initializeFirestore,
  memoryLocalCache,
} from 'firebase/firestore';

// Initialize Firebase app if it hasn't been already.
const firebaseApp: FirebaseApp = getApps().length
  ? getApp()
  : initializeApp(firebaseConfig);

// Initialize Firestore with memory cache.
// This is safe to run on both server and client.
const firestore: Firestore = initializeFirestore(firebaseApp, {
  localCache: memoryLocalCache(),
});

// Get the Auth instance.
const auth: Auth = getAuth(firebaseApp);

// Export the initialized services.
// These are singletons for the entire application.
export { firebaseApp, firestore, auth };

// IMPORTANT: This function is now DEPRECATED and will be removed.
// The services are initialized directly in this module.
export function initializeFirebase() {
  console.warn("initializeFirebase() is deprecated. Import services directly from '@/firebase'.");
  return { firebaseApp, firestore, auth };
}


export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './errors';
export * from './error-emitter';