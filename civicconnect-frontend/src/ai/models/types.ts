import { IssueCategory } from "../../types/user.types";

export interface AIAnalysisResult {
  category: IssueCategory;
  subcategory: string;
  severity: "critical" | "high" | "medium" | "low";
  confidence: number;
  title: string;
  description: string;
  detectedObjects: string[];
  possibleHazards: string[];
  departmentSuggestion: string;
  contextFactors: string[];
  urgencyReason: string;
  processingTimeMs?: number;
  isFallback?: boolean;
  imageValidation?: {
    isValid: boolean;
    verdict: "valid" | "irrelevant" | "screenshot" | "meme" | "blank" | "low_quality";
    confidence: number;
    reason: string;
  };
}
