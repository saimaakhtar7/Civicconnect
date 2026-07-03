import { useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "../config/firebase";
import { useAuthStore } from "../stores/authStore";
import { useNotificationStore } from "../stores/notificationStore";
import { UserDocument } from "../types/user.types";
import { removeUndefined } from "../utils/firestore.utils";

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
        const anonProfile = {
          uid: firebaseUser.uid,
          email: firebaseUser.email || "",
          displayName: "Guest Citizen",
          photoURL: firebaseUser.photoURL || null,
          role: "citizen" as const,
          department: null,
          trust: {
            score: 50,
            tier: "new",
            totalReports: 0,
            verifiedReports: 0,
            falseReportCount: 0,
            verificationContributions: 0,
            resolutionConfirmations: 0,
            badges: [],
            lastUpdated: new Date().toISOString(),
          },
          fcmTokens: [],
          notificationPreferences: {
            verificationRequests: true,
            statusUpdates: true,
            communityMilestones: true,
            weeklyDigest: false,
          },
          createdAt: new Date().toISOString(),
          lastActiveAt: new Date().toISOString(),
        } as any;

        setUser(anonProfile);
        setLoading(false);

        (async () => {
          try {
            const userDocRef = doc(db, "users", firebaseUser.uid);
            const userDocSnap = await getDoc(userDocRef);

            if (!userDocSnap.exists()) {
              await setDoc(userDocRef, removeUndefined(anonProfile));
            } else {
              const userData = userDocSnap.data() as UserDocument;
              setUser(userData);
            }
          } catch (bgErr) {
            console.error("Background profile sync failed:", bgErr);
            useNotificationStore.getState().addNotification({
              type: "warning",
              title: "Profile Sync",
              message: "Guest profile sync failed in background.",
            });
          }
        })();

        return;
      }

      try {
        const userDocRef = doc(db, "users", firebaseUser.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const userData = userDocSnap.data() as UserDocument;
          setUser(userData);
        } else {
          const defaultProfile = {
            uid: firebaseUser.uid,
            email: firebaseUser.email || "",
            displayName: firebaseUser.displayName || "Citizen",
            photoURL: firebaseUser.photoURL || null,
            role: "citizen" as const,
            department: null,
            trust: {
              score: 100,
              tier: "new",
              totalReports: 0,
              verifiedReports: 0,
              falseReportCount: 0,
              verificationContributions: 0,
              resolutionConfirmations: 0,
              badges: [],
              lastUpdated: new Date().toISOString(),
            },
            fcmTokens: [],
            notificationPreferences: {
              verificationRequests: true,
              statusUpdates: true,
              communityMilestones: true,
              weeklyDigest: false,
            },
            createdAt: new Date().toISOString(),
            lastActiveAt: new Date().toISOString(),
          };

          await setDoc(userDocRef, removeUndefined(defaultProfile));
          setUser(defaultProfile as any);
        }
      } catch (error) {
        console.error("Error loading user profile:", error);
        clearUser();
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, [setUser, setLoading, clearUser]);

  return { user, role, loading };
};
