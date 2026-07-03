import { Timestamp } from "firebase/firestore";

export type UserRole = "citizen" | "official" | "admin";
export type TrustTier = "new" | "bronze" | "silver" | "gold" | "platinum";

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earnedAt: Timestamp | Date;
}

export interface UserDocument {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  
  // Citizen-specific
  trust: {
    score: number;               // 0–1000
    tier: TrustTier;
    totalReports: number;
    verifiedReports: number;
    falseReportCount: number;
    verificationContributions: number;
    resolutionConfirmations: number;
    badges: Badge[];
    lastUpdated: Timestamp | Date;
  };
  
  // Official-specific
  department?: string;
  wardId?: string;
  officerCode?: string;
  
  // Common
  location?: {
    lat: number;
    lng: number;
    geohash: string;             // For proximity queries
    ward: string;
    city: string;
  };
  
  fcmTokens: string[];           // Multiple device tokens
  notificationPreferences: {
    verificationRequests: boolean;
    statusUpdates: boolean;
    communityMilestones: boolean;
    weeklyDigest: boolean;
  };
  
  createdAt: Timestamp | Date;
  lastActiveAt: Timestamp | Date;
}

export type IssueCategory =
  | "road_damage"
  | "water_issue"
  | "electricity"
  | "waste_management"
  | "public_safety"
  | "green_spaces"
  | "drainage"
  | "public_property"
  | "noise_pollution"
  | "air_quality"
  | "animal_control"
  | "other";

export type IssueStatus =
  | "submitted"
  | "ai_processing"
  | "community_verification"
  | "assigned"
  | "in_progress"
  | "resolved_pending_verification"
  | "resolved"
  | "closed"
  | "duplicate"
  | "rejected";

export type PriorityLevel = 0 | 1 | 2 | 3 | 4;
