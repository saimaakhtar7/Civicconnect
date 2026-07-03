import { AIAnalysisResult } from "../ai/models/types";

export interface MediaUpload {
  file: File;
  blobUrl: string;
  type: "image" | "video";
  sizeBytes: number;
}

export interface LocationSelection {
  lat: number;
  lng: number;
  address: string;
  ward: string;
  city: string;
}

export interface IssueDraft {
  media: MediaUpload | null;
  location: LocationSelection | null;
  aiAnalysis: AIAnalysisResult | null;
  userDescription: string;
  isAnonymous: boolean;
  incidentTime: string; // ISO string
  tags: string[];
}

export interface UploadState {
  progress: number; // 0 to 100
  status: "idle" | "compressing" | "uploading" | "completed" | "failed";
  error?: string;
}
