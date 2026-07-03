import { Timestamp } from "firebase/firestore";

/**
 * Resolution evidence types
 */
export interface ResolutionEvidence {
  beforeImageUrl: string;
  afterImageUrl: string;
  resolutionNotes: string;
  resolvedBy: string; // uid of official who resolved
  resolvedAt: Timestamp | Date;
}

/**
 * AI verification result for resolution
 */
export interface ResolutionVerification {
  verdict: "FULLY_RESOLVED" | "PARTIALLY_RESOLVED" | "NOT_RESOLVED";
  confidence: number; // 0-100
  citizenMessage: string; // User-friendly message
  qualityScore: number; // 0-100 (how good the resolution is)
  improvementSuggestions?: string[]; // If partially resolved
  verifiedAt: Timestamp | Date;
}

/**
 * Resolution Evidence Service
 * Handles storing and retrieving resolution photos and notes
 */
export class ResolutionEvidenceService {
  /**
   * Upload resolution image to Cloudinary
   */
  static async uploadResolutionImage(file: File, issueId: string, type: "before" | "after"): Promise<string> {
    return new Promise((resolve, reject) => {
      const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
      const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

      if (!cloudName || !uploadPreset) {
        reject(new Error("Cloudinary configuration missing"));
        return;
      }

      // Create FormData for Cloudinary API
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", uploadPreset);
      formData.append("folder", `civicconnect/resolutions/${issueId}/${type}`);
      formData.append("resource_type", "auto");

      fetch(`https://api.cloudinary.com/v1_1/${cloudName}/upload`, {
        method: "POST",
        body: formData,
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.secure_url) {
            resolve(data.secure_url);
          } else {
            reject(new Error("Upload failed: " + data.error?.message));
          }
        })
        .catch((error) => {
          console.error("[ResolutionService] Upload error:", error);
          reject(error);
        });
    });
  }

  /**
   * Create resolution evidence record
   */
  static createResolutionEvidence(
    beforeImageUrl: string,
    afterImageUrl: string,
    resolutionNotes: string,
    resolvedBy: string
  ): Omit<ResolutionEvidence, "resolvedAt"> {
    return {
      beforeImageUrl,
      afterImageUrl,
      resolutionNotes,
      resolvedBy,
    };
  }

  /**
   * Format resolution for display
   */
  static formatResolutionForDisplay(evidence: ResolutionEvidence): {
    beforeImageUrl: string;
    afterImageUrl: string;
    notes: string;
    dateResolved: string;
    resolvedByLabel: string;
  } {
    const dateResolved =
      evidence.resolvedAt instanceof Timestamp
        ? evidence.resolvedAt.toDate().toLocaleDateString()
        : new Date(evidence.resolvedAt).toLocaleDateString();

    return {
      beforeImageUrl: evidence.beforeImageUrl,
      afterImageUrl: evidence.afterImageUrl,
      notes: evidence.resolutionNotes,
      dateResolved,
      resolvedByLabel: evidence.resolvedBy, // This should be officer name in real app
    };
  }

  /**
   * Generate verification message based on verdict
   */
  static generateVerificationMessage(verification: ResolutionVerification): string {
    switch (verification.verdict) {
      case "FULLY_RESOLVED":
        return `✓ This issue has been successfully resolved! (${verification.qualityScore}% satisfaction score)`;
      case "PARTIALLY_RESOLVED":
        return `⚠️ This issue has been partially resolved. Further action may be needed.`;
      case "NOT_RESOLVED":
        return `✗ The reported issue does not appear to be resolved. Please contact the department for follow-up.`;
      default:
        return "Resolution status pending verification.";
    }
  }

  /**
   * Create AI verification record
   */
  static async verifyResolutionWithAI(
    _beforeImageUrl: string,
    _afterImageUrl: string,
    _issueDescription: string
  ): Promise<ResolutionVerification> {
    console.log("[ResolutionService] Verifying resolution with AI...");

    // In a real implementation, this would call a backend AI service
    // to compare before/after images and determine resolution quality
    // For now, return a mock verification

    return {
      verdict: "FULLY_RESOLVED",
      confidence: 85,
      citizenMessage: "The reported issue has been successfully addressed based on image analysis.",
      qualityScore: 88,
      verifiedAt: Timestamp.now(),
    };
  }
}
