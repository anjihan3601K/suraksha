
// Import the functions you need from the SDKs you need
import { getAnalytics } from "firebase/analytics";
import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID ?? undefined,
};

// Validate Firebase config before initializing
const missingConfig = Object.entries(firebaseConfig).filter(
  ([key, value]) => key !== "measurementId" && !value,
);
if (missingConfig.length) {
  throw new Error(
    `Missing Firebase environment variables: ${missingConfig
      .map(([key]) => key)
      .join(", ")}. ` +
      "Add them to .env.local using NEXT_PUBLIC_FIREBASE_* names."
  );
}

// Initialize Firebase once per app instance
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const analytics = typeof window !== "undefined" ? getAnalytics(app) : null;
export const firebaseClientConfig = firebaseConfig;
