import { AIAnalysisResult } from "../../ai/models/types";

export type AIStatus = "success" | "fallback" | "manual";

export interface AIStatusMetadata {
  status: AIStatus;
  timestamp: number;
  message: string;
  errorReason?: string;
  retryCount?: number;
}

/**
 * AI Fallback Service
 * Provides fallback AI analysis when Gemini is unavailable
 * Generates basic categorization based on filename heuristics
 */
export class AIFallbackService {
  /**
   * Generate fallback AI result when Gemini fails
   * Uses filename-based heuristics to categorize issues
   */
  static generateFallback(file: File): AIAnalysisResult {

    const name = file.name.toLowerCase();
    let category: AIAnalysisResult["category"] = "road_damage";
    let subcategory = "Infrastructure Issue";
    let department = "Roads & Infrastructure Department";

    // Simple heuristic-based categorization
    if (
      name.includes("water") ||
      name.includes("flood") ||
      name.includes("pipe") ||
      name.includes("leak")
    ) {
      category = "water_issue";
      subcategory = "Water Supply / Drainage Issue";
      department = "Municipal Water Supply";
    } else if (
      name.includes("trash") ||
      name.includes("garbage") ||
      name.includes("waste") ||
      name.includes("litter")
    ) {
      category = "waste_management";
      subcategory = "Solid Waste Accumulation";
      department = "Solid Waste Management";
    } else if (
      name.includes("light") ||
      name.includes("electric") ||
      name.includes("power") ||
      name.includes("bulb")
    ) {
      category = "electricity";
      subcategory = "Streetlight / Power Outage";
      department = "Electricity Department";
    } else if (
      name.includes("tree") ||
      name.includes("park") ||
      name.includes("garden") ||
      name.includes("green")
    ) {
      category = "green_spaces";
      subcategory = "Green Space / Tree Issue";
      department = "Garden & Parks Department";
    } else if (
      name.includes("noise") ||
      name.includes("sound") ||
      name.includes("loud")
    ) {
      category = "noise_pollution";
      subcategory = "Excessive Noise";
      department = "Environmental Department";
    } else if (
      name.includes("drain") ||
      name.includes("sewer") ||
      name.includes("clog")
    ) {
      category = "drainage";
      subcategory = "Drainage System Issue";
      department = "Drainage & Sewerage";
    } else if (name.includes("animal") || name.includes("stray")) {
      category = "animal_control";
      subcategory = "Stray Animal Issue";
      department = "Animal Control";
    } else if (
      name.includes("pothol") ||
      name.includes("crack") ||
      name.includes("road") ||
      name.includes("pavement")
    ) {
      category = "road_damage";
      subcategory = "Pothole or Cracked Pavement";
      department = "Roads & Infrastructure Department";
    } else if (name.includes("build") || name.includes("structure")) {
      category = "public_property";
      subcategory = "Building/Structure Damage";
      department = "Public Works Department";
    }

    return {
      category,
      subcategory,
      severity: "medium",
      confidence: 45, // Lower confidence for fallback
      title: "Community Infrastructure Issue",
      description: `An infrastructure concern has been recorded and submitted. The AI Vision service is temporarily unavailable — this report has been categorized using basic pattern matching and will be reviewed manually by the assigned department.`,
      detectedObjects: ["infrastructure", "public area"],
      possibleHazards: ["Potential public safety risk", "Community impact"],
      departmentSuggestion: department,
      contextFactors: ["Urban environment", "Requires department inspection"],
      urgencyReason:
        "AI analysis service is temporarily unavailable. Report categorized via fallback mode for manual review.",
      processingTimeMs: 0,
    };
  }

  /**
   * Create AI status metadata
   */
  static createStatusMetadata(
    status: AIStatus,
    message: string,
    errorReason?: string,
    retryCount?: number
  ): AIStatusMetadata {
    return {
      status,
      timestamp: Date.now(),
      message,
      errorReason,
      retryCount,
    };
  }

  /**
   * Format user-facing toast message
   */
  static formatUserMessage(status: AIStatus, _errorReason?: string): string {
    switch (status) {
      case "success":
        return "✓ AI analysis complete. Your report is ready for submission.";
      case "fallback":
        return "⚠️ AI analysis is temporarily unavailable. Your report has been categorized using pattern matching. You can continue reporting manually and review the AI suggestions.";
      case "manual":
        return "✓ Manual submission mode enabled. Please complete all required fields before submitting.";
      default:
        return "Report submission ready.";
    }
  }
}
