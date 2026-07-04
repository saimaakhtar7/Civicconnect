import { UserDocument, UserRole } from "../types/user.types";

export type Permission =
  | "view_issues"
  | "view_discussions"
  | "view_events"
  | "view_map"
  | "report_issue"
  | "edit_own_issue_before_assign"
  | "delete_own_issue_before_assign"
  | "support_issue"
  | "participate_discussion"
  | "comment_reply"
  | "register_events"
  | "volunteer"
  | "update_issue_status"
  | "assign_field_workers"
  | "upload_evidence"
  | "official_updates"
  | "moderate_discussions"
  | "remove_posts"
  | "verify_issues"
  | "manage_community_reports"
  | "manage_users"
  | "manage_roles"
  | "manage_categories"
  | "manage_departments"
  | "view_analytics"
  | "system_settings";

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  citizen: [
    "view_issues",
    "view_discussions",
    "view_events",
    "view_map",
    "report_issue",
    "edit_own_issue_before_assign",
    "delete_own_issue_before_assign",
    "support_issue",
    "participate_discussion",
    "comment_reply",
    "register_events",
    "volunteer"
  ],
  official: [
    "view_issues",
    "view_discussions",
    "view_events",
    "view_map",
    "update_issue_status",
    "assign_field_workers",
    "upload_evidence",
    "official_updates"
  ],
  moderator: [
    "view_issues",
    "view_discussions",
    "view_events",
    "view_map",
    "moderate_discussions",
    "remove_posts",
    "verify_issues",
    "manage_community_reports"
  ],
  admin: [
    "view_issues",
    "view_discussions",
    "view_events",
    "view_map",
    "report_issue",
    "edit_own_issue_before_assign",
    "delete_own_issue_before_assign",
    "support_issue",
    "participate_discussion",
    "comment_reply",
    "register_events",
    "volunteer",
    "update_issue_status",
    "assign_field_workers",
    "upload_evidence",
    "official_updates",
    "moderate_discussions",
    "remove_posts",
    "verify_issues",
    "manage_community_reports",
    "manage_users",
    "manage_roles",
    "manage_categories",
    "manage_departments",
    "view_analytics",
    "system_settings"
  ]
};

/**
 * Checks if a specific role possesses a permission
 */
export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) || false;
}

/**
 * Main helper to check if a user has a specific permission
 */
export function can(user: UserDocument | null, permission: Permission): boolean {
  if (!user) {
    // Visitor permissions
    const visitorAllowed: Permission[] = [
      "view_issues",
      "view_discussions",
      "view_events",
      "view_map"
    ];
    return visitorAllowed.includes(permission);
  }
  return hasPermission(user.role, permission);
}

/**
 * Checks if a user belongs to any of the specified roles
 */
export function hasRole(user: UserDocument | null, ...roles: UserRole[]): boolean {
  if (!user) return false;
  return roles.includes(user.role);
}
