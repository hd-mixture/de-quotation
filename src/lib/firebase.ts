// src/lib/firebase.ts
'use client';

import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAnalytics, isSupported } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAlUvm3SoM6msq99bg-t8AwBGEs1g8G6lc",
  authDomain: "de-quotation-format.firebaseapp.com",
  projectId: "de-quotation-format",
  storageBucket: "de-quotation-format.firebasestorage.app",
  messagingSenderId: "803948663838",
  appId: "1:803948663838:web:b3652dcf5ce5321b8e0a0f",
  measurementId: "G-90FNYCMPDM"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

if (typeof window !== 'undefined') {
    isSupported().then(supported => {
        if (supported) {
            getAnalytics(app);
        }
    });
}

export { app, db };
