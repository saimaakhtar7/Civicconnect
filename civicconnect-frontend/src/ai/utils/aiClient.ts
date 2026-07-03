import { AIAnalysisResult } from "../models/types";
import { ClientResponseParser } from "../parsers/responseParser";
import { GoogleGenAI } from "@google/genai";

const DEFAULT_MODEL = import.meta.env.VITE_GEMINI_MODEL ?? "gemini-3.5-flash";

function getGeminiApiKey(): string {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "Missing Gemini API key. Set VITE_GEMINI_API_KEY in your environment variables."
    );
  }
  return apiKey;
}

let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!geminiClient) {
    geminiClient = new GoogleGenAI({
      apiKey: getGeminiApiKey(),
      apiVersion: "v1",
    });
  }
  return geminiClient;
}

function getSystemPrompt(): string {
  return `ROLE: You are an expert urban infrastructure analyst for a civic issue management platform named CivicConnect AI.

CONTEXT: You are analyzing a user-submitted photo or video showing a municipal or community issue (e.g. road damage, water leakage, power failures).

TASK: Your job is to analyze the image, classify the issue, estimate its severity, and provide a clear title and description.

CONFIDENCE SCORING GUIDE:
90-100: You are certain. Visual evidence is unambiguous.
70-89: You are confident. One or more factors is slightly unclear.
50-69: Reasonable interpretation but significant uncertainty.
Below 50: You are guessing. Flag for human review.

RESPONSE RULES:
- You MUST return a single valid JSON object.
- No preamble, no postamble.
- No markdown formatting (like \`\`\`json ... \`\`\`), no text outside the JSON block.
- Values must strictly match the expected categories and formats.
`;
}

function buildVisionPrompt(context?: {
  userDescription?: string;
  location?: { lat: number; lng: number; address?: string };
}): string {
  let prompt = `Analyze the provided image of a civic issue.
Return a JSON object matching this exact TypeScript interface:

interface AIAnalysisResult {
  category: "road_damage" | "water_issue" | "electricity" | "waste_management" | "public_safety" | "green_spaces" | "drainage" | "public_property" | "noise_pollution" | "air_quality" | "animal_control" | "other";
  subcategory: string; // Specific type of issue (e.g. "Pothole", "Broken Water Main")
  severity: "critical" | "high" | "medium" | "low";
  confidence: number; // 0 to 100 based on the confidence guide
  title: string; // A concise, clear title of the issue (under 8 words)
  description: string; // Empathy-driven, citizen-facing clear explanation of the issue (under 50 words)
  detectedObjects: string[]; // List of visible key items identified in the image
  possibleHazards: string[]; // Potential safety risks or dangers posed by this issue
  departmentSuggestion: string; // e.g. "Roads & Infrastructure Department", "Water Supply & Sewerage Board"
  contextFactors: string[]; // Context indicators (e.g. "residential zone", "near school", "heavy traffic")
  urgencyReason: string; // Concise rationale explaining the severity rating
}
`;

  if (context?.userDescription) {
    prompt += `\nCitizen description: "${context.userDescription}"`;
  }
  if (context?.location?.address) {
    prompt += `\nReported location address: "${context.location.address}"`;
  }

  return prompt;
}

function extractOutputText(responseBody: any): string | null {
  if (!responseBody || typeof responseBody !== "object") {
    return null;
  }

  if (typeof responseBody.text === "string") {
    return responseBody.text;
  }
  if (typeof responseBody.outputText === "string") {
    return responseBody.outputText;
  }
  if (typeof responseBody.output_text === "string") {
    return responseBody.output_text;
  }

  if (Array.isArray(responseBody.outputs)) {
    for (const output of responseBody.outputs) {
      if (typeof output?.text === "string") {
        return output.text;
      }
      if (Array.isArray(output?.content)) {
        const textPart = output.content.find(
          (part: any) => part?.type === "text" && typeof part.text === "string"
        );
        if (textPart?.text) {
          return textPart.text;
        }
      }
    }
  }

  return null;
}

function isRetryableError(error: any): boolean {
  const message = error?.message?.toLowerCase() || "";
  const code = error?.status || error?.code || error?.name;

  return (
    code === 503 ||
    code === 429 ||
    message.includes("timeout") ||
    message.includes("unavailable") ||
    message.includes("connection") ||
    message.includes("econnrefused") ||
    message.includes("temporarily")
  );
}

function getBackoffDelay(attemptNumber: number): number {
  return 1000 * Math.pow(2, attemptNumber - 1);
}

export async function analyzeIssueMedia(
  mediaBase64: string,
  mimeType: string,
  userDescription?: string,
  location?: { lat: number; lng: number; address?: string }
): Promise<AIAnalysisResult> {
  resetGeminiCallCount();
  const ai = getGeminiClient();

  const maxAttempts = 5;
  let lastError: any = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      incrementGeminiCallCount();
      console.log(`[aiClient] Gemini call attempt ${attempt}/${maxAttempts}`);

      const response = await ai.models.generateContent({
        model: DEFAULT_MODEL,
        contents: [
          {
            parts: [{ text: getSystemPrompt() }],
          },
          {
            parts: [
              {
                inlineData: {
                  data: mediaBase64,
                  mimeType,
                },
              },
            ],
          },
          {
            parts: [{ text: buildVisionPrompt({ userDescription, location }) }],
          },
        ],
      });

      const rawText = extractOutputText(response);
      if (!rawText) {
        throw new Error("Gemini response did not contain a valid text output.");
      }

      const parsed = ClientResponseParser.parseFlexibleJSON(rawText);
      return ClientResponseParser.sanitizeResult(parsed);
    } catch (err: any) {
      lastError = err;
      const isRetryable = isRetryableError(err) || String(err?.message).includes("429");
      console.warn(`[aiClient] Gemini attempt ${attempt} failed`, err?.message || err, { isRetryable });
      if (!isRetryable || attempt === maxAttempts) break;
      const delay = getBackoffDelay(attempt);
      console.log(`[aiClient] Backing off ${delay}ms before retry`);
      await new Promise((res) => setTimeout(res, delay));
    }
  }

  throw new Error(`Gemini failed after ${maxAttempts} attempts: ${lastError?.message || String(lastError)}`);
}

// Track Gemini call count for diagnostics
let geminiCallCount = 0;
export function incrementGeminiCallCount() {
  geminiCallCount += 1;
  console.log("aiClient: geminiCallCount", geminiCallCount);
}

export function getGeminiCallCount() {
  return geminiCallCount;
}

export function resetGeminiCallCount() {
  geminiCallCount = 0;
}
