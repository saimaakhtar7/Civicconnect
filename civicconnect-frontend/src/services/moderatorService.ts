import { 
  collection, doc, getDocs, updateDoc, query, where, 
  orderBy, limit, runTransaction, Timestamp, addDoc
} from "firebase/firestore";
import { db } from "../config/firebase";
import { UserRole } from "../types/user.types";
import { adminService } from "./adminService";

export interface ModerationLog {
  id?: string;
  moderatorId: string;
  targetType: "discussion" | "comment" | "issue" | "user";
  targetId: string;
  action: "delete" | "pin" | "lock" | "hide" | "restore" | "verify" | "reject" | "warn" | "suspend" | "dismiss_report" | "resolve_report";
  reason: string;
  timestamp: Timestamp | Date;
  previousState?: Record<string, any>;
  newState?: Record<string, any>;
}

export interface ContentReport {
  id: string;
  reportedBy: string;
  targetType: "discussion" | "comment" | "image" | "profile";
  targetId: string;
  reason: "spam" | "abuse" | "fake" | "offensive" | "other";
  details?: string;
  status: "pending" | "reviewed" | "resolved" | "dismissed";
  assignedModerator?: string;
  resolution?: string;
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
}

export const moderatorService = {
  // Moderation Logging
  logModerationAction: async (log: Omit<ModerationLog, "timestamp">, moderatorRole: UserRole) => {
    try {
      const timestamp = Timestamp.now();
      await addDoc(collection(db, "moderationLogs"), {
        ...log,
        timestamp
      });

      // Write to audit log as well for complete audit transparency
      await adminService.logAdminAction({
        actorId: log.moderatorId,
        actorRole: moderatorRole,
        action: `moderator_${log.action}`,
        targetId: log.targetId,
        targetType: log.targetType,
        details: { reason: log.reason, ...log.newState }
      });
    } catch (err) {
      console.error("Failed to log moderation action:", err);
    }
  },

  // Discussion Moderation
  getFlaggedContent: async (): Promise<any[]> => {
    const q = query(
      collection(db, "discussions"),
      orderBy("reportedCount", "desc"),
      limit(50)
    );
    const snap = await getDocs(q);
    return snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter((d: any) => d.reported === true || (d.reportedCount && d.reportedCount > 0));
  },

  softDeleteDiscussion: async (
    discussionId: string,
    reason: string,
    moderatorId: string,
    moderatorRole: UserRole
  ): Promise<void> => {
    const discRef = doc(db, "discussions", discussionId);
    
    await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(discRef);
      if (!snap.exists()) throw new Error("Discussion not found");

      const discData = snap.data();
      transaction.update(discRef, {
        isSoftDeleted: true,
        deletedAt: Timestamp.now(),
        deletedBy: moderatorId,
        deleteReason: reason,
        reported: false,
        reportedCount: 0
      });
    });

    await moderatorService.logModerationAction({
      moderatorId,
      targetType: "discussion",
      targetId: discussionId,
      action: "delete",
      reason,
      previousState: { isSoftDeleted: false },
      newState: { isSoftDeleted: true }
    }, moderatorRole);
  },

  restoreDiscussion: async (
    discussionId: string,
    reason: string,
    moderatorId: string,
    moderatorRole: UserRole
  ): Promise<void> => {
    const discRef = doc(db, "discussions", discussionId);
    await updateDoc(discRef, {
      isSoftDeleted: false,
      deletedAt: null,
      deletedBy: null,
      deleteReason: null
    });

    await moderatorService.logModerationAction({
      moderatorId,
      targetType: "discussion",
      targetId: discussionId,
      action: "restore",
      reason,
      previousState: { isSoftDeleted: true },
      newState: { isSoftDeleted: false }
    }, moderatorRole);
  },

  lockDiscussion: async (
    discussionId: string,
    isLocked: boolean,
    reason: string,
    moderatorId: string,
    moderatorRole: UserRole
  ): Promise<void> => {
    const discRef = doc(db, "discussions", discussionId);
    await updateDoc(discRef, { isLocked });

    await moderatorService.logModerationAction({
      moderatorId,
      targetType: "discussion",
      targetId: discussionId,
      action: "lock",
      reason,
      previousState: { isLocked: !isLocked },
      newState: { isLocked }
    }, moderatorRole);
  },

  pinDiscussion: async (
    discussionId: string,
    isPinned: boolean,
    reason: string,
    moderatorId: string,
    moderatorRole: UserRole
  ): Promise<void> => {
    const discRef = doc(db, "discussions", discussionId);
    await updateDoc(discRef, { isPinned });

    await moderatorService.logModerationAction({
      moderatorId,
      targetType: "discussion",
      targetId: discussionId,
      action: "pin",
      reason,
      previousState: { isPinned: !isPinned },
      newState: { isPinned }
    }, moderatorRole);
  },

  // Issue Verification
  getVerificationQueue: async (): Promise<any[]> => {
    // Queries issues waiting for verification
    const q = query(
      collection(db, "issues"),
      where("verificationStatus", "in", ["pending", "suspicious"]),
      limit(50)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  },

  verifyIssue: async (
    issueId: string,
    reason: string,
    moderatorId: string,
    moderatorRole: UserRole
  ): Promise<void> => {
    const issueRef = doc(db, "issues", issueId);

    await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(issueRef);
      if (!snap.exists()) throw new Error("Issue not found");

      const issueData = snap.data();
      // Verified issues are promoted to "community_verification" or direct "assigned"
      transaction.update(issueRef, {
        verificationStatus: "verified",
        status: issueData.status === "submitted" ? "community_verification" : issueData.status,
        verifiedAt: Timestamp.now(),
        verifiedBy: moderatorId
      });
    });

    await moderatorService.logModerationAction({
      moderatorId,
      targetType: "issue",
      targetId: issueId,
      action: "verify",
      reason,
      previousState: { verificationStatus: "pending" },
      newState: { verificationStatus: "verified" }
    }, moderatorRole);
  },

  rejectIssue: async (
    issueId: string,
    reason: string,
    moderatorId: string,
    moderatorRole: UserRole
  ): Promise<void> => {
    const issueRef = doc(db, "issues", issueId);
    await updateDoc(issueRef, {
      verificationStatus: "rejected",
      status: "rejected",
      rejectionReason: reason,
      rejectedAt: Timestamp.now(),
      rejectedBy: moderatorId
    });

    await moderatorService.logModerationAction({
      moderatorId,
      targetType: "issue",
      targetId: issueId,
      action: "reject",
      reason,
      previousState: { verificationStatus: "pending" },
      newState: { verificationStatus: "rejected" }
    }, moderatorRole);
  },

  requestEvidence: async (
    issueId: string,
    reason: string,
    moderatorId: string,
    moderatorRole: UserRole
  ): Promise<void> => {
    const issueRef = doc(db, "issues", issueId);
    await updateDoc(issueRef, {
      verificationStatus: "suspicious",
      verificationNote: reason
    });

    await moderatorService.logModerationAction({
      moderatorId,
      targetType: "issue",
      targetId: issueId,
      action: "warn",
      reason,
      previousState: { verificationStatus: "pending" },
      newState: { verificationStatus: "suspicious" }
    }, moderatorRole);
  },

  markDuplicate: async (
    issueId: string,
    duplicateOfId: string,
    reason: string,
    moderatorId: string,
    moderatorRole: UserRole
  ): Promise<void> => {
    const issueRef = doc(db, "issues", issueId);
    await updateDoc(issueRef, {
      status: "duplicate",
      duplicateOf: duplicateOfId,
      verificationStatus: "verified"
    });

    await moderatorService.logModerationAction({
      moderatorId,
      targetType: "issue",
      targetId: issueId,
      action: "lock",
      reason: `Marked duplicate of #${duplicateOfId}. Reason: ${reason}`,
      previousState: { status: "submitted" },
      newState: { status: "duplicate", duplicateOf: duplicateOfId }
    }, moderatorRole);
  },

  // Content Reports
  getContentReports: async (): Promise<ContentReport[]> => {
    const q = query(collection(db, "contentReports"), orderBy("createdAt", "desc"), limit(50));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as ContentReport));
  },

  createContentReport: async (
    report: Omit<ContentReport, "id" | "status" | "createdAt" | "updatedAt">
  ): Promise<void> => {
    const timestamp = Timestamp.now();
    await addDoc(collection(db, "contentReports"), {
      ...report,
      status: "pending",
      createdAt: timestamp,
      updatedAt: timestamp
    });
  },

  resolveReport: async (
    reportId: string,
    resolution: string,
    moderatorId: string,
    moderatorRole: UserRole
  ): Promise<void> => {
    const reportRef = doc(db, "contentReports", reportId);
    await updateDoc(reportRef, {
      status: "resolved",
      resolution,
      assignedModerator: moderatorId,
      updatedAt: Timestamp.now()
    });

    await moderatorService.logModerationAction({
      moderatorId,
      targetType: "user", // generic resolution target
      targetId: reportId,
      action: "resolve_report",
      reason: resolution,
      previousState: { status: "pending" },
      newState: { status: "resolved" }
    }, moderatorRole);
  },

  dismissReport: async (
    reportId: string,
    reason: string,
    moderatorId: string,
    moderatorRole: UserRole
  ): Promise<void> => {
    const reportRef = doc(db, "contentReports", reportId);
    await updateDoc(reportRef, {
      status: "dismissed",
      resolution: reason,
      assignedModerator: moderatorId,
      updatedAt: Timestamp.now()
    });

    await moderatorService.logModerationAction({
      moderatorId,
      targetType: "user",
      targetId: reportId,
      action: "dismiss_report",
      reason,
      previousState: { status: "pending" },
      newState: { status: "dismissed" }
    }, moderatorRole);
  },

  getModerationLogs: async (maxLimit = 50): Promise<ModerationLog[]> => {
    const q = query(collection(db, "moderationLogs"), orderBy("timestamp", "desc"), limit(maxLimit));
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as ModerationLog);
  }
};
