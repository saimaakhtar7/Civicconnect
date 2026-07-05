import { UserRole } from "../types/user.types";

/**
 * Single source of truth for post-login redirects.
 * Matches the actual routes defined in App.tsx.
 *
 *   /              → LandingPage (public)
 *   /app           → CitizenLayout → HomePage (citizen home)
 *   /dashboard/command-center → CommandCenterPage (official)
 *   /dashboard/moderator      → ModeratorDashboardPage
 *   /dashboard/admin          → AdminDashboardPage
 */
export function getRoleRedirect(role: UserRole): string {
  switch (role) {
    case "admin":     return "/dashboard/admin";
    case "moderator": return "/dashboard/moderator";
    case "official":  return "/dashboard/command-center";
    default:          return "/app";   // citizen → CitizenLayout index
  }
}

/**
 * Canonical demo email → role mapping.
 * This is the *only* source of truth for resolving demo roles from email.
 */
export const DEMO_EMAIL_ROLE_MAP: Record<string, UserRole> = {
  "citizen@civicconnect.ai":   "citizen",
  "official@civicconnect.ai":  "official",
  "moderator@civicconnect.ai": "moderator",
  "admin@civicconnect.ai":     "admin",
};

export function isDemoEmail(email: string): boolean {
  return Object.prototype.hasOwnProperty.call(DEMO_EMAIL_ROLE_MAP, email);
}
