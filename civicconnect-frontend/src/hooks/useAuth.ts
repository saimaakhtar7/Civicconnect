import { useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "../config/firebase";
import { useAuthStore } from "../stores/authStore";
import { UserDocument } from "../types/user.types";
import { removeUndefined } from "../utils/firestore.utils";
import { getRoleRedirect, DEMO_EMAIL_ROLE_MAP, isDemoEmail } from "../utils/roleRedirect";

export const useAuth = () => {
  const { user, role, loading, setUser, setLoading, clearUser } = useAuthStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);

      if (!firebaseUser) {
        clearUser();
        setLoading(false);
        return;
      }

      // ── Anonymous / Guest users ─────────────────────────────────────────────
      if (firebaseUser.isAnonymous) {
        try {
          const userDocRef = doc(db, "users", firebaseUser.uid);
          const snap = await getDoc(userDocRef);
          if (snap.exists()) {
            setUser(snap.data() as UserDocument);
          } else {
            const anonProfile: any = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || "",
              displayName: "Guest Citizen",
              photoURL: firebaseUser.photoURL || null,
              role: "citizen" as const,
              department: null,
              trust: {
                score: 50, tier: "new", totalReports: 0, verifiedReports: 0,
                falseReportCount: 0, verificationContributions: 0,
                resolutionConfirmations: 0, badges: [],
                lastUpdated: new Date().toISOString(),
              },
              fcmTokens: [],
              notificationPreferences: {
                verificationRequests: true, statusUpdates: true,
                communityMilestones: true, weeklyDigest: false,
              },
              createdAt: new Date().toISOString(),
              lastActiveAt: new Date().toISOString(),
            };
            setUser(anonProfile);
            await setDoc(userDocRef, removeUndefined(anonProfile));
          }
        } catch (err) {
          console.error("[useAuth] Error loading guest profile:", err);
          clearUser();
        }
        setLoading(false);
        return;
      }

      // ── Authenticated (email/password or Google) ────────────────────────────
      const email = firebaseUser.email || "";
      const isDemo = isDemoEmail(email);
      const expectedRole = isDemo ? DEMO_EMAIL_ROLE_MAP[email] : null;

      try {
        const userDocRef = doc(db, "users", firebaseUser.uid);
        const snap = await getDoc(userDocRef);

        if (snap.exists()) {
          const userData = snap.data() as UserDocument;

          // ── Role mismatch detection (log only — NEVER write) ────────────────
          if (isDemo && expectedRole && userData.role !== expectedRole) {
            console.warn(
              `[useAuth] ⚠️  ROLE MISMATCH for "${email}"\n` +
              `  Firestore role : "${userData.role}"\n` +
              `  Expected role  : "${expectedRole}"\n` +
              `  Action         : Using Firestore role. No automatic correction performed.\n` +
              `  Fix            : Log in as Admin and run "Populate Demo Data" in Admin Settings.`
            );
          }

          setUser(userData);

          if (import.meta.env.DEV) {
            console.log(
              `[useAuth] ✓ LOADED\n` +
              `  UID            : ${firebaseUser.uid}\n` +
              `  Email          : ${email}\n` +
              `  Firestore path : users/${firebaseUser.uid}\n` +
              `  Firestore role : ${userData.role}\n` +
              `  Expected role  : ${expectedRole ?? "(real user)"}\n` +
              `  Redirect       : ${getRoleRedirect(userData.role)}\n` +
              `  Seeder         : Skipped (login only)`
            );
          }
        } else {
          // No Firestore document found.
          if (isDemo) {
            // Demo accounts must have their profiles created by the Admin seeder.
            // The client NEVER creates or repairs demo profiles.
            console.error(
              `[useAuth] ❌ Demo account "${email}" has no Firestore profile.\n` +
              `  The Firestore document users/${firebaseUser.uid} does not exist.\n` +
              `  Action : Not creating a profile. Signing out.\n` +
              `  Fix    : Log in as Admin and run "Populate Demo Data" in Admin Settings.\n` +
              `           The seeder will create users/{uid} documents with correct roles.`
            );
            // Sign out so the user isn't in a broken half-authenticated state
            clearUser();
            setLoading(false);
            return;
          }

          // Real user (e.g. first-time Google sign-in) — create citizen profile.
          // This is the ONLY case where useAuth creates a Firestore document.
          console.log(
            `[useAuth] New user "${email}" — creating citizen profile at users/${firebaseUser.uid}.`
          );
          const newProfile = {
            uid: firebaseUser.uid,
            email,
            displayName: firebaseUser.displayName || "Citizen",
            photoURL: firebaseUser.photoURL || null,
            role: "citizen" as const,
            department: null,
            trust: {
              score: 100, tier: "new" as const, totalReports: 0, verifiedReports: 0,
              falseReportCount: 0, verificationContributions: 0,
              resolutionConfirmations: 0, badges: [] as string[],
              lastUpdated: new Date().toISOString(),
            },
            fcmTokens: [] as string[],
            notificationPreferences: {
              verificationRequests: true, statusUpdates: true,
              communityMilestones: true, weeklyDigest: false,
            },
            createdAt: new Date().toISOString(),
            lastActiveAt: new Date().toISOString(),
          };

          await setDoc(userDocRef, removeUndefined(newProfile));
          setUser(newProfile as any);

          if (import.meta.env.DEV) {
            console.log(
              `[useAuth] ✓ CREATED\n` +
              `  UID            : ${firebaseUser.uid}\n` +
              `  Email          : ${email}\n` +
              `  Firestore path : users/${firebaseUser.uid}\n` +
              `  Role           : citizen\n` +
              `  Redirect       : ${getRoleRedirect("citizen")}`
            );
          }
        }
      } catch (err) {
        console.error("[useAuth] Error loading user profile:", err);
        clearUser();
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, [setUser, setLoading, clearUser]);

  return { user, role, loading };
};
