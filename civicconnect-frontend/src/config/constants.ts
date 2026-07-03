import { IssueCategory, IssueStatus, PriorityLevel, TrustTier } from "../types/user.types";

export const MAX_VERIFICATION_RADIUS_KM = 1.0;
export const VERIFICATION_THRESHOLD = 3.0;

export const ISSUE_CATEGORIES: { value: IssueCategory; label: string; icon: string }[] = [
  { value: "road_damage", label: "Road Damage", icon: "Milestone" },
  { value: "water_issue", label: "Water Issue", icon: "Droplet" },
  { value: "electricity", label: "Electricity & Power", icon: "Zap" },
  { value: "waste_management", label: "Waste Management", icon: "Trash2" },
  { value: "public_safety", label: "Public Safety", icon: "ShieldAlert" },
  { value: "green_spaces", label: "Green Spaces & Parks", icon: "Trees" },
  { value: "drainage", label: "Drainage & Sewage", icon: "Waves" },
  { value: "public_property", label: "Public Property Damage", icon: "Building" },
  { value: "noise_pollution", label: "Noise Pollution", icon: "VolumeX" },
  { value: "air_quality", label: "Air Quality", icon: "Wind" },
  { value: "animal_control", label: "Animal Control", icon: "Footprints" },
  { value: "other", label: "Other Issues", icon: "HelpCircle" },
];

export const ISSUE_STATUSES: { value: IssueStatus; label: string; color: string }[] = [
  { value: "submitted", label: "Submitted", color: "bg-blue-100 text-blue-800" },
  { value: "ai_processing", label: "AI Processing", color: "bg-purple-100 text-purple-800 animate-pulse" },
  { value: "community_verification", label: "Verifying", color: "bg-yellow-100 text-yellow-800" },
  { value: "assigned", label: "Assigned", color: "bg-indigo-100 text-indigo-800" },
  { value: "in_progress", label: "In Progress", color: "bg-orange-100 text-orange-800" },
  { value: "resolved_pending_verification", label: "Resolved (Pending AI Verification)", color: "bg-teal-100 text-teal-800" },
  { value: "resolved", label: "Resolved", color: "bg-green-100 text-green-800" },
  { value: "closed", label: "Closed", color: "bg-gray-100 text-gray-800" },
  { value: "duplicate", label: "Duplicate", color: "bg-pink-100 text-pink-800" },
  { value: "rejected", label: "Rejected", color: "bg-red-100 text-red-800" },
];

export const PRIORITY_LEVELS: { value: PriorityLevel; label: string; color: string; bg: string; slaHours: number }[] = [
  { value: 0, label: "CRITICAL", color: "text-red-700 border-red-700", bg: "bg-red-50", slaHours: 4 },
  { value: 1, label: "HIGH", color: "text-orange-700 border-orange-700", bg: "bg-orange-50", slaHours: 24 },
  { value: 2, label: "MEDIUM", color: "text-yellow-700 border-yellow-700", bg: "bg-yellow-50", slaHours: 72 },
  { value: 3, label: "LOW", color: "text-green-700 border-green-700", bg: "bg-green-50", slaHours: 336 },
  { value: 4, label: "INFORMATIONAL", color: "text-blue-700 border-blue-700", bg: "bg-blue-50", slaHours: 720 },
];

export const TRUST_TIERS: { value: TrustTier; label: string; color: string; badgeColor: string; weight: number }[] = [
  { value: "new", label: "New Reporter", color: "text-gray-600", badgeColor: "bg-gray-100 text-gray-800", weight: 0.5 },
  { value: "bronze", label: "Bronze Tier", color: "text-amber-700", badgeColor: "bg-amber-100 text-amber-800", weight: 0.75 },
  { value: "silver", label: "Silver Tier", color: "text-slate-600", badgeColor: "bg-slate-100 text-slate-800", weight: 1.0 },
  { value: "gold", label: "Gold Tier", color: "text-yellow-600", badgeColor: "bg-yellow-100 text-yellow-800", weight: 1.25 },
  { value: "platinum", label: "Platinum Tier", color: "text-teal-600", badgeColor: "bg-teal-100 text-teal-800", weight: 1.5 },
];

export const DEPARTMENTS = [
  { id: "roads", name: "Roads & Infrastructure Department", code: "ROADS", categories: ["road_damage", "drainage", "public_property"] },
  { id: "water", name: "Water Supply & Sewerage Board", code: "WATER", categories: ["water_issue", "drainage"] },
  { id: "electricity", name: "Electrical Department", code: "ELEC", categories: ["electricity"] },
  { id: "swm", name: "Solid Waste Management", code: "SWM", categories: ["waste_management", "green_spaces"] },
  { id: "parks", name: "Parks & Green Spaces Department", code: "PARKS", categories: ["green_spaces", "public_property"] },
];
