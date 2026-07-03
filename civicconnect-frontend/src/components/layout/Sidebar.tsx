import React from "react";
import { NavLink } from "react-router-dom";
import { LayoutDashboard, ListTodo, FileText, Map, Settings, ChevronLeft, ChevronRight } from "lucide-react";

interface SidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed = false, onToggle }) => {
  const links = [
    { to: "/dashboard/command-center", label: "Overview", icon: LayoutDashboard },
    { to: "/dashboard/issues", label: "Issue Queue", icon: ListTodo },
    { to: "/dashboard/map", label: "Digital Twin Map", icon: Map },
    { to: "/dashboard/executive", label: "Executive Briefings", icon: FileText },
  ];

  return (
    <aside
      className={`hidden lg:flex lg:flex-col lg:fixed lg:inset-y-16 lg:left-0 lg:z-30 border-r border-white/5 bg-[#0F172A] transition-all duration-300 ${
        collapsed ? "lg:w-20" : "lg:w-64"
      }`}
    >
      <div className="flex flex-col flex-1 gap-y-4 p-4 overflow-y-auto relative">
        {/* Toggle Collapse Button */}
        {onToggle && (
          <button
            onClick={onToggle}
            className="absolute top-4 right-[-12px] h-6 w-6 rounded-full bg-[#1E293B] border border-white/10 flex items-center justify-center text-[#9AA3B8] hover:text-white shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer z-50"
            title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
          </button>
        )}

        <nav className="flex flex-col gap-y-1.5 pt-4">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                end
                className={({ isActive }) =>
                  `flex items-center gap-x-3 px-3 py-3 text-sm font-semibold rounded-xl transition-all duration-200 group relative ${
                    isActive
                      ? "bg-emerald-500/10 text-[#22C55E] border-l-2 border-emerald-500"
                      : "text-[#9AA3B8] hover:bg-white/5 hover:text-white"
                  }`
                }
              >
                <Icon className="h-5 w-5 shrink-0" />
                {!collapsed && <span className="transition-opacity duration-200">{link.label}</span>}
                {collapsed && (
                  <div className="absolute left-16 bg-[#1E293B] border border-white/5 text-white text-xs font-bold px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 shadow-xl whitespace-nowrap z-50">
                    {link.label}
                  </div>
                )}
              </NavLink>
            );
          })}
        </nav>

        <div className="mt-auto border-t border-white/5 pt-4 space-y-2">
          <button className="flex w-full items-center gap-x-3 px-3 py-3 text-sm font-semibold text-[#9AA3B8] rounded-xl hover:bg-white/5 hover:text-white transition-all group relative cursor-pointer">
            <Settings className="h-5 w-5 shrink-0" />
            {!collapsed && <span>Settings</span>}
            {collapsed && (
              <div className="absolute left-16 bg-[#1E293B] border border-white/5 text-white text-xs font-bold px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 shadow-xl whitespace-nowrap z-50">
                Settings
              </div>
            )}
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
