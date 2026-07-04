import { 
  LayoutDashboard, 
  ListTodo, 
  Map, 
  Building, 
  FileText, 
  ClipboardList, 
  BarChart3, 
  Settings, 
  ShieldAlert,
  Users,
  FolderOpen,
  Sliders,
  Database
} from "lucide-react";
import { UserRole } from "../types/user.types";

export interface SidebarLink {
  to: string;
  labelKey: string;
  defaultLabel: string;
  descKey: string;
  defaultDesc: string;
  icon: any;
  roles: UserRole[];
  badgeKey?: string;
  badgeValue?: number;
}

export const SIDEBAR_LINKS: SidebarLink[] = [
  {
    to: "/dashboard/command-center",
    labelKey: "Overview",
    defaultLabel: "Overview",
    descKey: "Command dashboard",
    defaultDesc: "Command dashboard",
    icon: LayoutDashboard,
    roles: ["official", "admin", "moderator"]
  },
  {
    to: "/dashboard/issues",
    labelKey: "Issue Queue",
    defaultLabel: "Issue Queue",
    descKey: "Live municipal incidents",
    defaultDesc: "Live municipal incidents",
    icon: ListTodo,
    roles: ["official", "admin", "moderator"],
    badgeKey: "issuesCount",
    badgeValue: 18
  },
  {
    to: "/dashboard/map",
    labelKey: "Digital Twin",
    defaultLabel: "Digital Twin",
    descKey: "GIS infrastructure",
    defaultDesc: "GIS infrastructure",
    icon: Map,
    roles: ["official", "admin", "moderator"]
  },
  {
    to: "/dashboard/situation-room",
    labelKey: "Departments",
    defaultLabel: "Departments",
    descKey: "Department performance",
    defaultDesc: "Department performance",
    icon: Building,
    roles: ["official", "admin", "moderator"]
  },
  {
    to: "/dashboard/executive",
    labelKey: "Executive Briefings",
    defaultLabel: "Executive Briefings",
    descKey: "AI-generated summaries",
    defaultDesc: "AI-generated summaries",
    icon: FileText,
    roles: ["official", "admin", "moderator"]
  },
  {
    to: "/dashboard/executive-report",
    labelKey: "Reports",
    defaultLabel: "Reports",
    descKey: "Operational reports",
    defaultDesc: "Operational reports",
    icon: ClipboardList,
    roles: ["official", "admin", "moderator"]
  },
  {
    to: "/dashboard/analytics",
    labelKey: "Analytics",
    defaultLabel: "Analytics",
    descKey: "Performance trends",
    defaultDesc: "Performance trends",
    icon: BarChart3,
    roles: ["official", "admin", "moderator"]
  },
  // Moderator Route
  {
    to: "/dashboard/moderator",
    labelKey: "Moderation",
    defaultLabel: "Moderation",
    descKey: "Manage community discussions",
    defaultDesc: "Manage community discussions",
    icon: ShieldAlert,
    roles: ["admin", "moderator"]
  },
  // Admin Routes
  {
    to: "/dashboard/admin",
    labelKey: "Admin Portal",
    defaultLabel: "Admin Portal",
    descKey: "System control panel",
    defaultDesc: "System control panel",
    icon: Sliders,
    roles: ["admin"]
  },
  {
    to: "/dashboard/admin/users",
    labelKey: "User Management",
    defaultLabel: "User Management",
    descKey: "Manage system users & roles",
    defaultDesc: "Manage system users & roles",
    icon: Users,
    roles: ["admin"]
  },
  {
    to: "/dashboard/admin/departments",
    labelKey: "Depts Admin",
    defaultLabel: "Depts Admin",
    descKey: "Configure departments & staff",
    defaultDesc: "Configure departments & staff",
    icon: Building,
    roles: ["admin"]
  },
  {
    to: "/dashboard/admin/categories",
    labelKey: "Category Admin",
    defaultLabel: "Category Admin",
    descKey: "Manage issue categories",
    defaultDesc: "Manage issue categories",
    icon: FolderOpen,
    roles: ["admin"]
  },
  {
    to: "/dashboard/admin/analytics",
    labelKey: "Admin Analytics",
    defaultLabel: "Admin Analytics",
    descKey: "Detailed operational reports",
    defaultDesc: "Detailed operational reports",
    icon: BarChart3,
    roles: ["admin"]
  },
  {
    to: "/dashboard/admin/settings",
    labelKey: "System Settings",
    defaultLabel: "System Settings",
    descKey: "Manage global app variables",
    defaultDesc: "Manage global app variables",
    icon: Database,
    roles: ["admin"]
  },
  // Global Settings for officials
  {
    to: "/dashboard/settings",
    labelKey: "Settings",
    defaultLabel: "Settings",
    descKey: "Workspace configuration",
    defaultDesc: "Workspace configuration",
    icon: Settings,
    roles: ["official", "admin", "moderator"]
  }
];
