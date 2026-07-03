import { Timestamp } from "firebase/firestore";
import { IssueCategory, IssueStatus, PriorityLevel } from "./user.types";

export interface IssueMedia {
  original: string;              // Cloudinary URL or external media URL
  thumbnail: string;
  type: "image" | "video";
}

export interface IssueLocation {
  lat: number;
  lng: number;
  geohash: string;
  address: string;               // Reverse geocoded
  ward: string;
  city: string;
  nearbyLandmarks?: string[];    // From Places API
}

export interface IssueDocument {
  id: string;
  
  // Submission data
  reportedBy: string | null;       // uid (null for anonymous)
  isAnonymous: boolean;
  reporterTrustScore: number;      // Snapshot at submission time
  
  // Media
  mediaUrls: IssueMedia[];
  
  // Location
  location: IssueLocation;
  
  // User-provided
  userDescription?: string;
  
  // AI Analysis (from Vision Agent)
  aiAnalysis: {
    category: IssueCategory;
    subcategory: string;
    severity: "critical" | "high" | "medium" | "low";
    aiDescription: string;
    confidence: number;
    contextFactors: string[];
    immediateRisk?: string;
    secondaryIssueIds: string[];   // Linked auto-detected issues
  };

  // AI Status tracking (success, fallback, or manual)
  aiStatus: "success" | "fallback" | "manual";
  aiStatusMessage?: string;
  aiErrorReason?: string;
  
  // Priority (from Priority + Safety Agent)
  priority: {
    level: PriorityLevel;
    label: string;
    score: number;
    citizenReason: string;
    officialReason: string;
    safetyVetoApplied: boolean;
    estimatedSLAHours: number;
    slaDeadline: Timestamp | Date;
  };
  
  // Routing (from Routing Agent)
  routing: {
    primaryDepartment: string;
    secondaryDepartments: string[];
    assignedOfficerId?: string;
    routingReason: string;
    routingConfidence: number;
  };

  aiSummary: {
    category: string;
    subcategory: string;
    severity: "critical" | "high" | "medium" | "low";
    confidence: number;
    department: string;
    executiveSummary: string;
    duplicateProbability: number;
    safetyLevel: string;
    priorityScore: number;
    validatorStatus: "passed" | "failed";
    completedAt: Timestamp | Date;
  } | null;
  
  // Status tracking
  status: IssueStatus;
  statusHistory: {
    status: IssueStatus;
    changedAt: Timestamp | Date;
    changedBy: string;
    note?: string;
  }[];
  
  // Community
  verification: {
    count: number;
    required: number;
    verifierIds: string[];
    status: "pending" | "verified" | "disputed";
  };
  
  // Resolution
  resolution?: {
    resolvedBy: string;
    resolvedAt: Timestamp | Date;
    afterMediaUrls: string[];
    resolutionNote: string;
    aiVerification: {
      verdict: "FULLY_RESOLVED" | "PARTIALLY_RESOLVED" | "NOT_RESOLVED";
      confidence: number;
      citizenMessage: string;
      qualityScore: number;
    };
  };
  
  // Metrics
  metrics: {
    viewCount: number;
    shareCount: number;
    upvoteCount: number;
    estimatedAffectedCitizens: number;
    estimatedEconomicImpact: number;
  };
  
  // Duplicate handling
  duplicateOf?: string;
  duplicateIssueIds: string[];
  
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
}
