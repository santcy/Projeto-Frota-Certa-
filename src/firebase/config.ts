'use client';

import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

const firebaseConfig = {
  "projectId": "studio-9840306402-6c969",
  "appId": "1:726386228816:web:3c9a796e033c7b2d5a1b55",
  "apiKey": "AIzaSyB5Kj4Ae7FuzoGxrqORpE50v59O2uELyHg",
  "authDomain": "studio-9840306402-6c969.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "726386228816"
};

// Initialize Firebase
let app: FirebaseApp;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);

export { app, auth, db };
