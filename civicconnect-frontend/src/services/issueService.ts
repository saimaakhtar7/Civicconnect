import { doc, setDoc, collection, query, onSnapshot, orderBy, getDoc } from "firebase/firestore";
import { db } from "../config/firebase";
import { removeUndefined } from "../utils/firestore.utils";
import { IssueDocument } from "../types/issue.types";
import { IssueStatus } from "../types/user.types";
import { IssueDraft } from "../types/report.types";
import { encodeGeohash } from "../utils/geo.utils";
import { nanoid } from "nanoid";

export class IssueService {
  /**
   * Submits a full issue document to Firestore.
   */
  static async submitIssue(
    uid: string | null,
    _reporterName: string,
    reporterTrustScore: number,
    draft: IssueDraft,
    mediaUrl: string,
    issueId?: string
  ): Promise<string> {
    const finalIssueId = issueId || nanoid(10);
    const mediaType = draft.media?.type || "image";

    if (!draft.location) {
      throw new Error("Cannot submit issue without a validated location.");
    }

    const { lat, lng, address, ward, city } = draft.location;
    const geohash = encodeGeohash(lat, lng);

    const category = draft.aiAnalysis?.category || "other";
    const subcategory = draft.aiAnalysis?.subcategory || "General Triage";
    const severity = draft.aiAnalysis?.severity || "medium";
    const confidence = draft.aiAnalysis?.confidence || 80;
    const description = draft.aiAnalysis?.description || draft.userDescription;

    // SLA hours mapping based on severity
    const slaHoursMap = { critical: 4, high: 24, medium: 72, low: 336 };
    const slaHours = slaHoursMap[severity as keyof typeof slaHoursMap] || 72;
    const slaDeadline = new Date(Date.now() + slaHours * 3600000);

    const issueDoc: Record<string, any> = {
      id: finalIssueId,
      reportedBy: draft.isAnonymous ? null : uid,
      isAnonymous: draft.isAnonymous,
      reporterTrustScore: draft.isAnonymous ? 0 : reporterTrustScore,
      
      mediaUrls: [
        {
          original: mediaUrl,
          thumbnail: mediaUrl, // Thumbnail currently uses the same uploaded URL
          type: mediaType,
        },
      ],

      location: {
        lat,
        lng,
        geohash,
        address,
        ward,
        city,
        nearbyLandmarks: draft.aiAnalysis?.contextFactors || [],
      },

      userDescription: draft.userDescription,

      aiAnalysis: {
        category,
        subcategory,
        severity,
        aiDescription: description,
        confidence,
        contextFactors: draft.aiAnalysis?.contextFactors || [],
        immediateRisk: draft.aiAnalysis?.urgencyReason || undefined,
        secondaryIssueIds: [],
      },

      priority: {
        level: severity === "critical" ? 0 : severity === "high" ? 1 : severity === "medium" ? 2 : 3,
        label: severity.toUpperCase(),
        score: confidence,
        citizenReason: draft.aiAnalysis?.urgencyReason || "Community review required",
        officialReason: "",
        safetyVetoApplied: false,
        estimatedSLAHours: slaHours,
        slaDeadline,
      },

      routing: {
        primaryDepartment: draft.aiAnalysis?.departmentSuggestion || "General Services",
        secondaryDepartments: [],
        routingReason: "Suggested based on image category matching.",
        routingConfidence: confidence,
      },

      status: "submitted" as IssueStatus,
      statusHistory: [
        {
          status: "submitted" as IssueStatus,
          changedAt: new Date(),
          changedBy: draft.isAnonymous ? "anonymous" : uid || "system",
          note: "Issue report created.",
        },
      ],

      verification: {
        count: 0,
        required: 3,
        verifierIds: [],
        status: "pending",
      },

      metrics: {
        viewCount: 0,
        shareCount: 0,
        upvoteCount: 0,
        estimatedAffectedCitizens: 1,
        estimatedEconomicImpact: 0,
      },

      duplicateIssueIds: [],
      aiSummary: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };


    const docRef = doc(db, "issues", finalIssueId);
    await setDoc(docRef, removeUndefined(issueDoc));

    return finalIssueId;
  }

  /**
   * Listen for real-time updates on all issues.
   */
  static subscribeToIssues(onUpdate: (issues: IssueDocument[]) => void, onError?: (error: any) => void) {
    const issuesRef = collection(db, "issues");
    const q = query(issuesRef, orderBy("createdAt", "desc"));

    return onSnapshot(
      q,
      (snapshot) => {
        const issues: IssueDocument[] = [];
        snapshot.forEach((doc) => {
          issues.push(doc.data() as IssueDocument);
        });
        onUpdate(issues);
      },
      (error) => {
        console.error("Realtime subscription error:", error);
        if (onError) onError(error);
      }
    );
  }

  /**
   * Fetch single issue document.
   */
  static async getIssue(issueId: string): Promise<IssueDocument | null> {
    const docRef = doc(db, "issues", issueId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as IssueDocument;
    }
    return null;
  }
}
