import { Timestamp } from "firebase/firestore";

export type VerificationVerdict = "confirmed" | "cannot_verify" | "already_resolved" | "false_report";

export interface VerificationMedia {
  url: string;
  type: "image" | "video";
}

export interface VerificationDocument {
  id: string;
  issueId: string;
  verifiedBy: string;              // uid
  verifierTrustScore: number;
  
  verdict: VerificationVerdict;
  
  additionalMedia?: VerificationMedia[];
  
  location: {
    lat: number;
    lng: number;
    distanceFromIssueMeters: number;  // Verified they were nearby
  };
  
  note?: string;
  createdAt: Timestamp | Date;
}
