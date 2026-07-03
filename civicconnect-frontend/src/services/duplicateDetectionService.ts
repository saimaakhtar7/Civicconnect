import { IssueDocument } from "../types/issue.types";
import { IssueCategory } from "../types/user.types";

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  matchedIssueIds: string[];
  matchedIssues: Partial<IssueDocument>[];
  confidence: number;
  suggestion: "support_existing" | "create_new" | "unclear";
}

/**
 * Duplicate Issue Detection Service
 * Checks if a new issue is similar to existing nearby reports
 */
export class DuplicateDetectionService {
  /**
   * Distance threshold in meters (100 meters)
   */
  private static readonly DISTANCE_THRESHOLD_M = 100;

  /**
   * Confidence threshold for considering issues as duplicates (0-100)
   */
  private static readonly DUPLICATE_CONFIDENCE_THRESHOLD = 70;

  /**
   * Calculate distance between two coordinates using Haversine formula (meters)
   */
  private static calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number {
    const R = 6371000; // Earth radius in meters
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLng = (lng2 - lng1) * (Math.PI / 180);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in meters
  }

  /**
   * Calculate similarity score between two issue categories (0-100)
   */
  private static calculateCategorySimilarity(
    category1: IssueCategory,
    category2: IssueCategory
  ): number {
    if (category1 === category2) return 100;

    // Define related categories (higher score if related)
    const relatedCategories: Record<IssueCategory, IssueCategory[]> = {
      road_damage: ["drainage", "public_property"],
      water_issue: ["drainage"],
      electricity: ["public_safety"],
      waste_management: [],
      public_safety: ["electricity", "road_damage"],
      green_spaces: [],
      drainage: ["water_issue", "road_damage"],
      public_property: ["road_damage"],
      noise_pollution: ["public_safety"],
      air_quality: [],
      animal_control: ["public_safety"],
      other: [],
    };

    const related = relatedCategories[category1] || [];
    return related.includes(category2) ? 40 : 20; // Lower score for partially related
  }

  /**
   * Calculate description similarity using simple string matching (0-100)
   */
  private static calculateDescriptionSimilarity(desc1: string, desc2: string): number {
    if (!desc1 || !desc2) return 0;

    const text1 = desc1.toLowerCase();
    const text2 = desc2.toLowerCase();

    if (text1 === text2) return 100;

    // Count matching words
    const words1 = text1.split(/\s+/);
    const words2 = text2.split(/\s+/);
    const matchingWords = words1.filter((w) => words2.includes(w)).length;
    const maxWords = Math.max(words1.length, words2.length);

    return maxWords > 0 ? (matchingWords / maxWords) * 100 : 0;
  }

  /**
   * Calculate overall duplicate confidence score (0-100)
   * Based on distance (50%), category (30%), and description (20%)
   */
  private static calculateDuplicateConfidence(
    distanceM: number,
    categorySimilarity: number,
    descriptionSimilarity: number
  ): number {
    // Distance score: closer = higher score
    // 0m = 100%, 100m = 50%, >100m = 0%
    const distanceScore =
      distanceM <= this.DISTANCE_THRESHOLD_M
        ? 100 - (distanceM / this.DISTANCE_THRESHOLD_M) * 50
        : 0;

    // Weighted score
    const confidence =
      distanceScore * 0.5 + categorySimilarity * 0.3 + descriptionSimilarity * 0.2;

    return Math.round(confidence);
  }

  /**
   * Check if a new issue is likely a duplicate of existing issues
   *
   * @param newIssue - The newly submitted issue
   * @param existingIssues - Array of existing issues to compare against
   * @returns Duplicate check result with matched issues and recommendation
   */
  static checkForDuplicates(
    newIssue: {
      category: IssueCategory;
      location: { lat: number; lng: number };
      userDescription?: string;
    },
    existingIssues: IssueDocument[]
  ): DuplicateCheckResult {

    const matches: {
      issue: IssueDocument;
      confidence: number;
    }[] = [];

    // Filter nearby issues (within geohash distance + actual distance check)
    for (const existingIssue of existingIssues) {
      // Skip resolved/closed issues
      if (
        existingIssue.status === "resolved" ||
        existingIssue.status === "closed"
      ) {
        continue;
      }

      // Calculate distance
      const distanceM = this.calculateDistance(
        newIssue.location.lat,
        newIssue.location.lng,
        existingIssue.location.lat,
        existingIssue.location.lng
      );

      // Skip if too far
      if (distanceM > this.DISTANCE_THRESHOLD_M) {
        continue;
      }

      // Calculate similarity scores
      const categorySimilarity = this.calculateCategorySimilarity(
        newIssue.category,
        existingIssue.aiAnalysis.category
      );

      const descriptionSimilarity = this.calculateDescriptionSimilarity(
        newIssue.userDescription || "",
        existingIssue.aiAnalysis.aiDescription
      );

      // Calculate overall confidence
      const confidence = this.calculateDuplicateConfidence(
        distanceM,
        categorySimilarity,
        descriptionSimilarity
      );


      if (confidence >= this.DUPLICATE_CONFIDENCE_THRESHOLD) {
        matches.push({ issue: existingIssue, confidence });
      }
    }

    // Sort by confidence descending
    matches.sort((a, b) => b.confidence - a.confidence);

    const isDuplicate = matches.length > 0;
    const matchedIssueIds = matches.map((m) => m.issue.id);
    const matchedIssues = matches.map((m) => ({
      id: m.issue.id,
      aiAnalysis: m.issue.aiAnalysis,
      status: m.issue.status,
      location: m.issue.location,
      createdAt: m.issue.createdAt,
      metrics: m.issue.metrics,
    } as Partial<IssueDocument>));

    const suggestion =
      matches.length > 0 && matches[0].confidence >= 85
        ? "support_existing"
        : matches.length > 0
          ? "unclear"
          : "create_new";

    return {
      isDuplicate,
      matchedIssueIds,
      matchedIssues,
      confidence: matches.length > 0 ? matches[0].confidence : 0,
      suggestion,
    };
  }

  /**
   * Format user-facing message for duplicate detection results
   */
  static formatUserMessage(result: DuplicateCheckResult): string {
    if (!result.isDuplicate) {
      return "No similar issues found nearby. Ready to submit new report.";
    }

    if (result.suggestion === "support_existing") {
      return `A similar issue has been reported nearby (${result.confidence}% match). Consider supporting the existing report instead.`;
    }

    return `A similar issue may exist nearby (${result.confidence}% confidence). Review before proceeding.`;
  }
}
