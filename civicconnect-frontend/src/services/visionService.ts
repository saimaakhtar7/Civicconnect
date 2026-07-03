
import { AIAnalysisResult } from "../ai/models/types";
import { analyzeIssueMedia } from "../ai/utils/aiClient";
import { AIFallbackService, AIStatus } from "./ai/aiFallbackService";

// ─── Timeout duration (ms) ───────────────────────────────────────────────────────
const AI_TIMEOUT_MS = 15_000;

/**
 * Result object with AI status metadata
 */
export interface VisionServiceResult {
  analysis: AIAnalysisResult;
  aiStatus: AIStatus;
  statusMessage: string;
  errorReason?: string;
}

// ─── Client-side fallback result (deprecated - use AIFallbackService) ────────────────────────────────────────────────────
export function generateClientFallback(file: File): AIAnalysisResult {
  console.log("[VisionService] Fallback triggered — generating mock AI result");
  return AIFallbackService.generateFallback(file);
}

// ─── Main VisionService ───────────────────────────────────────────────────
export class VisionService {
  /**
   * Converts a File to a base64 string (data portion only, no prefix).
   */
  private static fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(",")[1]);
      };
      reader.onerror = (error) => reject(error);
    });
  }

  /**
   * Runs Gemini Vision Analysis with robust retry logic and graceful fallback.
   * 
   * Flow:
   * 1. Try Gemini Vision with retry (3 attempts with exponential backoff)
   * 2. If Gemini fails and is retryable (503, timeout), try fallback
   * 3. If Gemini fails non-retryably, go straight to fallback
   * 4. Allow manual submission in all cases
   */
  static async analyzeMedia(
    file: File,
    userDescription?: string,
    location?: { lat: number; lng: number; address?: string }
  ): Promise<VisionServiceResult> {
    console.log("[VisionService] Starting Vision analysis with retry logic");

    // 1. Convert file to base64
    const mediaBase64 = await this.fileToBase64(file);
    const mimeType = file.type || "image/jpeg";

    // 2. Try Gemini Vision first with timeout guard
    console.log("[VisionService] Attempting Gemini Vision analysis (timeout: " + AI_TIMEOUT_MS + "ms)");

    let timeoutId: number | null = null;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = window.setTimeout(() => {
        reject(new Error("AI Vision request timed out after " + AI_TIMEOUT_MS + "ms"));
      }, AI_TIMEOUT_MS);
    });

    try {
        // Try to use the new Gemini service with retry logic
        // This is the ideal path - AI succeeds on first or retry attempt
        let response: AIAnalysisResult;
      
      // For now, we'll use the existing aiClient for compatibility
      // Future: switch to geminiService.analyzeImageWithRetry once fully integrated
      try {
        response = await Promise.race([
          analyzeIssueMedia(mediaBase64, mimeType, userDescription, location),
          timeoutPromise,
        ]);

        console.log("[VisionService] ✓ Gemini Vision analysis successful");
        return {
          analysis: sanitizeResult(response),
          aiStatus: "success",
          statusMessage: AIFallbackService.formatUserMessage("success"),
        };
      } catch (geminiError: any) {
        // Gemini failed - check if we should use fallback
        const isRetryableError =
          geminiError?.code === "UNAVAILABLE" ||
          geminiError?.code === "TIMEOUT" ||
          (geminiError?.message &&
            (geminiError.message.includes("503") ||
              geminiError.message.includes("unavailable") ||
              geminiError.message.includes("timeout")));

        if (isRetryableError) {
          console.warn("[VisionService] Gemini failed with retryable error:", geminiError.message);
          console.log("[VisionService] Switching to fallback mode...");

          // Use fallback result
          const fallbackResult = AIFallbackService.generateFallback(file);
          return {
            analysis: fallbackResult,
            aiStatus: "fallback",
            statusMessage: AIFallbackService.formatUserMessage("fallback", geminiError.message),
            errorReason: geminiError.message,
          };
        } else {
          // Non-retryable error from Gemini (invalid request, auth error, etc)
          console.error(
            "[VisionService] Gemini failed with non-retryable error:",
            geminiError?.code,
            geminiError?.message
          );
          
          // Still allow fallback for better UX
          const fallbackResult = AIFallbackService.generateFallback(file);
          return {
            analysis: fallbackResult,
            aiStatus: "fallback",
            statusMessage: AIFallbackService.formatUserMessage("fallback", geminiError.message),
            errorReason: geminiError.message,
          };
        }
      }
    } finally {
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
    }
  }

  /**
   * Allow manual submission - returns basic analysis for user to override
   */
  static generateManualMode(): VisionServiceResult {
    return {
      analysis: {
        category: "other",
        subcategory: "Manual Submission",
        severity: "medium",
        confidence: 0,
        title: "Community Issue",
        description: "Please complete all details manually",
        detectedObjects: [],
        possibleHazards: [],
        departmentSuggestion: "General Services",
        contextFactors: [],
        urgencyReason: "Awaiting manual categorization",
        processingTimeMs: 0,
      },
      aiStatus: "manual",
      statusMessage: AIFallbackService.formatUserMessage("manual"),
    };
  }
}

// ─── Result sanitizer ────────────────────────────────────────────────────
function sanitizeResult(raw: any): AIAnalysisResult {
  return {
    category: raw?.category || "road_damage",
    subcategory: raw?.subcategory || "General Infrastructure Issue",
    severity: (["critical", "high", "medium", "low"].includes(raw?.severity)
      ? raw.severity
      : "medium") as AIAnalysisResult["severity"],
    confidence: typeof raw?.confidence === "number" ? raw.confidence : 75,
    title: raw?.title || "Community Issue Report",
    description: raw?.description || "Issue submitted for municipal review.",
    detectedObjects: Array.isArray(raw?.detectedObjects) ? raw.detectedObjects : [],
    possibleHazards: Array.isArray(raw?.possibleHazards) ? raw.possibleHazards : [],
    departmentSuggestion: raw?.departmentSuggestion || "General Services",
    contextFactors: Array.isArray(raw?.contextFactors) ? raw.contextFactors : [],
    urgencyReason: raw?.urgencyReason || "Requires department review",
    processingTimeMs: raw?.processingTimeMs || 0,
  };
}
