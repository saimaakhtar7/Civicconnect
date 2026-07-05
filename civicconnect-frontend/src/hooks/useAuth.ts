import { useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "../config/firebase";
import { useAuthStore } from "../stores/authStore";
import { UserDocument, UserRole } from "../types/user.types";
import { removeUndefined } from "../utils/firestore.utils";

// ── Demo email → role mapping (source of truth for role resolution) ────────────
const DEMO_ROLE_MAP: Record<string, UserRole> = {
  "citizen@civicconnect.ai":   "citizen",
  "official@civicconnect.ai":  "official",
  "moderator@civicconnect.ai": "moderator",
  "admin@civicconnect.ai":     "admin",
};

function getRoleRedirect(role: UserRole): string {
  switch (role) {
    case "admin":     return "/dashboard/admin";
    case "moderator": return "/dashboard/moderator";
    case "official":  return "/dashboard/command-center";
    default:          return "/app";
  }
}

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

      if (firebaseUser.isAnonymous) {
        try {
          const userDocRef = doc(db, "users", firebaseUser.uid);
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            setUser(userDocSnap.data() as UserDocument);
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
        } catch (error) {
          console.error("[useAuth] Error loading guest profile:", error);
          clearUser();
        }
        setLoading(false);
        return;
      }

      // ── Resolve expected role for this email ───────────────────────────────
      const email = firebaseUser.email || "";
      const isDemoAccount = Object.prototype.hasOwnProperty.call(DEMO_ROLE_MAP, email);
      const expectedRole: UserRole | null = isDemoAccount ? DEMO_ROLE_MAP[email] : null;

      try {
        const userDocRef = doc(db, "users", firebaseUser.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const userData = userDocSnap.data() as UserDocument;

          // ── If demo account has stale/wrong role, correct it immediately ──
          if (isDemoAccount && expectedRole && userData.role !== expectedRole) {
            console.warn(
              `[useAuth] Demo account "${email}" has stale role "${userData.role}" in Firestore (expected "${expectedRole}"). Correcting.`
            );
            const corrected = { ...userData, role: expectedRole };
            await setDoc(userDocRef, { role: expectedRole }, { merge: true });
            setUser(corrected as UserDocument);

            if (import.meta.env.DEV) {
              console.log(
                `[useAuth] ✓ CORRECTED — UID: ${firebaseUser.uid} | email: ${email} | ` +
                `role: ${expectedRole} | path: users/${firebaseUser.uid} | redirect: ${getRoleRedirect(expectedRole)}`
              );
            }
          } else {
            setUser(userData);
            if (import.meta.env.DEV) {
              console.log(
                `[useAuth] ✓ LOADED — UID: ${firebaseUser.uid} | email: ${email} | ` +
                `role: ${userData.role} | path: users/${firebaseUser.uid} | redirect: ${getRoleRedirect(userData.role)}`
              );
            }
          }
        } else {
          // No Firestore document yet.
          // Demo accounts: use the email→role mapping, NEVER default to citizen.
          // Real users: default to citizen (they complete onboarding).
          const resolvedRole: UserRole = expectedRole ?? "citizen";

          if (isDemoAccount) {
            console.log(
              `[useAuth] Demo account "${email}" has no Firestore doc yet. ` +
              `Creating under users/${firebaseUser.uid} with role="${resolvedRole}".`
            );
          } else {
            console.warn(
              `[useAuth] No Firestore profile for UID=${firebaseUser.uid} (${email}). ` +
              `Creating citizen profile. If unexpected, check Firestore security rules.`
            );
          }

          const newProfile = {
            uid: firebaseUser.uid,
            email,
            displayName: firebaseUser.displayName || (isDemoAccount ? email.split("@")[0] : "Citizen"),
            photoURL: firebaseUser.photoURL || null,
            role: resolvedRole,
            department: null,
            trust: {
              score: 100, tier: "new" as const, totalReports: 0, verifiedReports: 0,
              falseReportCount: 0, verificationContributions: 0,
              resolutionConfirmations: 0, badges: [],
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
              `[useAuth] ✓ CREATED — UID: ${firebaseUser.uid} | email: ${email} | ` +
              `role: ${resolvedRole} | path: users/${firebaseUser.uid} | redirect: ${getRoleRedirect(resolvedRole)}`
            );
          }
        }
      } catch (error) {
        console.error("[useAuth] Error loading user profile:", error);
        clearUser();
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, [setUser, setLoading, clearUser]);

  return { user, role, loading };
};
