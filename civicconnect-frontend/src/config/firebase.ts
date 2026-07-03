import { initializeApp, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";

const firebaseApiKey = import.meta.env.VITE_FIREBASE_API_KEY;
const firebaseAuthDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN;
const firebaseProjectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
const firebaseMessagingSenderId = import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID;
const firebaseAppId = import.meta.env.VITE_FIREBASE_APP_ID;
const useAuthEmulator = import.meta.env.VITE_FIREBASE_USE_AUTH_EMULATOR === "true";
const authEmulatorHost = import.meta.env.VITE_FIREBASE_AUTH_EMULATOR_HOST ?? "127.0.0.1";
const authEmulatorPort = Number(import.meta.env.VITE_FIREBASE_AUTH_EMULATOR_PORT) || 9099;
const useFirestoreEmulator = import.meta.env.VITE_FIREBASE_USE_FIRESTORE_EMULATOR === "true";
const firestoreEmulatorHost = import.meta.env.VITE_FIREBASE_FIRESTORE_EMULATOR_HOST ?? "127.0.0.1";
const firestoreEmulatorPort = Number(import.meta.env.VITE_FIREBASE_FIRESTORE_EMULATOR_PORT) || 8080;

if (!firebaseApiKey || !firebaseAuthDomain || !firebaseProjectId || !firebaseAppId) {
  throw new Error(
    "[firebase] Missing required production Firebase environment variables. Set VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN, VITE_FIREBASE_PROJECT_ID, and VITE_FIREBASE_APP_ID."
  );
}

const firebaseConfig = {
  apiKey: firebaseApiKey,
  authDomain: firebaseAuthDomain,
  projectId: firebaseProjectId,
  messagingSenderId: firebaseMessagingSenderId,
  appId: firebaseAppId,
};

let app: FirebaseApp;
try {
  app = getApp();
} catch (e) {
  app = initializeApp(firebaseConfig);
}

export const auth = getAuth(app);
export const db = getFirestore(app);

if (useAuthEmulator) {
  connectAuthEmulator(auth, `http://${authEmulatorHost}:${authEmulatorPort}`, {
    disableWarnings: true,
  });
}

if (useFirestoreEmulator) {
  connectFirestoreEmulator(db, firestoreEmulatorHost, firestoreEmulatorPort);
}

export const googleProvider = new GoogleAuthProvider();

export default app;
