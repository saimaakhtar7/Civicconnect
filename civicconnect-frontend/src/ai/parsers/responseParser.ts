import { AIAnalysisResult } from "../models/types";

export class ClientResponseParser {
  static parseFlexibleJSON(rawText: string): any {
    if (typeof rawText !== "string") {
      return rawText;
    }

    const tryParse = (text: string) => {
      try {
        return JSON.parse(text);
      } catch {
        return null;
      }
    };

    const direct = tryParse(rawText.trim());
    if (direct) {
      return direct;
    }

    const firstBrace = rawText.indexOf("{");
    if (firstBrace >= 0) {
      let depth = 0;
      for (let i = firstBrace; i < rawText.length; i += 1) {
        const char = rawText[i];
        if (char === "{") depth += 1;
        if (char === "}") depth -= 1;
        if (depth === 0) {
          const candidate = rawText.slice(firstBrace, i + 1);
          const parsed = tryParse(candidate);
          if (parsed) {
            return parsed;
          }
          break;
        }
      }
    }

    const cleaned = rawText.replace(/^[^\{]*|[^\}]*$/g, "").trim();
    const fallback = tryParse(cleaned);
    if (fallback) {
      return fallback;
    }

    throw new Error("Unable to parse Gemini response into JSON.");
  }

  static sanitizeResult(raw: any): AIAnalysisResult {
    return {
      category: raw.category || "other",
      subcategory: raw.subcategory || "General Triage Required",
      severity: raw.severity || "medium",
      confidence: typeof raw.confidence === "number" ? raw.confidence : 80,
      title: raw.title || "New Community Report",
      description: raw.description || "Report has been submitted by community citizen.",
      detectedObjects: Array.isArray(raw.detectedObjects) ? raw.detectedObjects : [],
      possibleHazards: Array.isArray(raw.possibleHazards) ? raw.possibleHazards : [],
      departmentSuggestion: raw.departmentSuggestion || "General Services",
      contextFactors: Array.isArray(raw.contextFactors) ? raw.contextFactors : [],
      urgencyReason: raw.urgencyReason || "General review",
      processingTimeMs: raw.processingTimeMs || 0,
    };
  }
}
