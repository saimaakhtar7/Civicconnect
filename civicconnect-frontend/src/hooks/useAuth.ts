import { useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "../config/firebase";
import { useAuthStore } from "../stores/authStore";
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
        try {
          const userDocRef = doc(db, "users", firebaseUser.uid);
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            const userData = userDocSnap.data() as UserDocument;
            setUser(userData);
          } else {
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
            await setDoc(userDocRef, removeUndefined(anonProfile));
          }
        } catch (error) {
          console.error("Error loading guest profile:", error);
          clearUser();
        }
        setLoading(false);
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
