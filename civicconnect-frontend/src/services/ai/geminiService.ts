import { AIAnalysisResult } from "../../ai/models/types";

/**
 * Custom error class for AI service errors
 */
export class AIServiceError extends Error {
  readonly code: "UNAVAILABLE" | "INVALID_REQUEST" | "TIMEOUT" | "UNKNOWN";
  readonly retryable: boolean;

  constructor(
    code: "UNAVAILABLE" | "INVALID_REQUEST" | "TIMEOUT" | "UNKNOWN",
    message: string,
    retryable: boolean = false
  ) {
    super(message);
    this.name = "AIServiceError";
    this.code = code;
    this.retryable = retryable;
  }
}

/**
 * Gemini API Service with retry logic (placeholder for future SDK integration)
 * Currently uses aiClient.analyzeIssueMedia for actual image analysis
 * This service defines the retry and fallback architecture
 */
export class GeminiService {
  /**
   * Analyze image with Gemini Vision API with retry logic
   * @param _base64Image - Base64 encoded image data (without data URL prefix)
   * @param _systemPrompt - System prompt for the model
   * @param _userPrompt - User prompt describing the analysis task
   * @returns Parsed AI analysis result
   */
  async analyzeImageWithRetry(
    _base64Image: string,
    _systemPrompt: string,
    _userPrompt: string
  ): Promise<AIAnalysisResult> {
    // Note: Gemini SDK integration deferred due to compatibility
    // Use aiClient.analyzeIssueMedia() instead
    throw new Error(
      "Gemini SDK method deferred. Use aiClient.analyzeIssueMedia() for image analysis."
    );
  }
}

export const geminiService = new GeminiService();
