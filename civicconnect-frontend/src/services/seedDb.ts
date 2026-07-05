import { readFileSync } from "fs";
import { resolve } from "path";
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, signInAnonymously } from "firebase/auth";
import { executeSeeding } from "./seederService";

// Load env variables manually from .env
const envContent = readFileSync(resolve(".env"), "utf-8");
const envVars: Record<string, string> = {};
envContent.split("\n").forEach((line) => {
  const parts = line.split("=");
  if (parts.length >= 2) {
    envVars[parts[0].trim()] = parts.slice(1).join("=").trim();
  }
});

const firebaseConfig = {
  apiKey: envVars.VITE_FIREBASE_API_KEY,
  authDomain: envVars.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: envVars.VITE_FIREBASE_PROJECT_ID,
  messagingSenderId: envVars.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: envVars.VITE_FIREBASE_APP_ID,
};

console.log("[CLI Seeder] Initializing Firebase with project:", firebaseConfig.projectId);
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

async function runSeeder() {
  console.log("[CLI Seeder] Signing in anonymously to gain seeding authorization...");
  const cred = await signInAnonymously(auth);
  console.log("[CLI Seeder] Authenticated anonymously with UID:", cred.user.uid);

  const resetMode = process.argv.includes("--reset");
  console.log(`[CLI Seeder] Executing seeding (resetMode: ${resetMode})...`);

  const result = await executeSeeding(db, resetMode);
  if (result.success) {
    console.log("[CLI Seeder] ✓ Database seeding finished successfully!");
  } else {
    console.error("[CLI Seeder] ✗ Database seeding failed:", result.message);
    process.exit(1);
  }
  process.exit(0);
}

runSeeder().catch((err) => {
  console.error("[CLI Seeder] Fatal seeding error:", err);
  process.exit(1);
});
