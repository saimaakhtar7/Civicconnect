import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { useAuthStore } from "../../stores/authStore";
import { getTranslation } from "../../utils/translation";
import { 
  LayoutDashboard, 
  ListTodo, 
  Map, 
  Building, 
  FileText, 
  ClipboardList, 
  BarChart3, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  Clock,
  RefreshCw
} from "lucide-react";

interface SidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed = false, onToggle }) => {
  const { user } = useAuthStore();
  const [lang, setLang] = useState(localStorage.getItem("settings_language") || "en-IN");

  useEffect(() => {
    const handleSettingsUpdate = () => {
      setLang(localStorage.getItem("settings_language") || "en-IN");
    };
    window.addEventListener("settings-updated", handleSettingsUpdate);
    return () => window.removeEventListener("settings-updated", handleSettingsUpdate);
  }, []);

  const links = [
    { to: "/dashboard/command-center", label: getTranslation("Overview", lang), desc: getTranslation("Command dashboard", lang), icon: LayoutDashboard },
    { to: "/dashboard/issues", label: getTranslation("Issue Queue", lang), desc: getTranslation("Live municipal incidents", lang), icon: ListTodo, badge: 18 },
    { to: "/dashboard/map", label: getTranslation("Digital Twin", lang), desc: getTranslation("GIS infrastructure", lang), icon: Map },
    { to: "/dashboard/situation-room", label: getTranslation("Departments", lang), desc: getTranslation("Department performance", lang), icon: Building },
    { to: "/dashboard/executive", label: getTranslation("Executive Briefings", lang), desc: getTranslation("AI-generated summaries", lang), icon: FileText },
    { to: "/dashboard/executive-report", label: getTranslation("Reports", lang), desc: getTranslation("Operational reports", lang), icon: ClipboardList },
    { to: "/dashboard/analytics", label: getTranslation("Analytics", lang), desc: getTranslation("Performance trends", lang), icon: BarChart3 },
    { to: "/dashboard/settings", label: getTranslation("Settings", lang), desc: getTranslation("Workspace configuration", lang), icon: Settings },
  ];

  return (
    <aside
      className={`hidden lg:flex lg:flex-col lg:fixed lg:inset-y-16 lg:left-0 lg:z-30 border-r border-[#273244] bg-[#111827] transition-all duration-300 ${
        collapsed ? "lg:w-20" : "lg:w-72"
      }`}
    >
      <div className="flex flex-col flex-1 gap-y-4 p-4 overflow-y-auto relative custom-scrollbar">
        {/* Toggle Collapse Button */}
        {onToggle && (
          <button
            onClick={onToggle}
            className="absolute top-4 right-[-12px] h-6 w-6 rounded-full bg-[#1A2332] border border-[#273244] flex items-center justify-center text-[#9CA3AF] hover:text-[#F3F4F6] shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer z-50 animate-duration-150"
            title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
          </button>
        )}

        <nav className="flex flex-col gap-y-1.5 pt-4">
          {links.map((link) => {
            const Icon = link.icon;
            const isExternal = link.to.startsWith("#");
            
            const linkContent = (isActive = false) => (
              <>
                <div className={`p-1.5 rounded-lg shrink-0 transition-colors ${
                  isActive ? "bg-[#16A34A]/10 text-[#16A34A]" : "bg-white/[0.02] text-[#9CA3AF] group-hover:text-[#F3F4F6]"
                }`}>
                  <Icon className="h-4.5 w-4.5 shrink-0" />
                </div>
                {!collapsed && (
                  <div className="flex-1 text-left min-w-0">
                    <span className="block text-[14px] font-semibold tracking-tight">{link.label}</span>
                    <span className="block text-[11px] font-medium text-[#6B7280] group-hover:text-[#9CA3AF] truncate leading-none mt-0.5">{link.desc}</span>
                  </div>
                )}
                {link.badge && !collapsed && (
                  <span className="bg-[#DC2626] text-white text-[10px] font-bold font-mono px-1.5 py-0.5 rounded-full shrink-0">
                    {link.badge}
                  </span>
                )}
                {collapsed && (
                  <div className="absolute left-16 bg-[#1A2332] border border-[#273244] text-[#F3F4F6] text-xs font-bold px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 shadow-xl whitespace-nowrap z-50">
                    {link.label} - {link.desc}
                  </div>
                )}
              </>
            );

            if (isExternal) {
              return (
                <button
                  key={link.label}
                  onClick={(e) => e.preventDefault()}
                  className="flex w-full items-center gap-x-3 px-3 py-2 text-sm font-semibold rounded-xl text-[#9CA3AF] hover:bg-white/5 hover:text-[#F3F4F6] transition-all duration-150 group relative cursor-pointer"
                >
                  {linkContent(false)}
                </button>
              );
            }

            return (
              <NavLink
                key={link.to}
                to={link.to}
                end
                className={({ isActive }) =>
                  `flex items-center gap-x-3 px-3 py-2 text-sm font-semibold rounded-xl transition-all duration-150 group relative ${
                    isActive
                      ? "bg-[#16A34A]/5 text-[#16A34A] border-l-2 border-[#16A34A]"
                      : "text-[#9CA3AF] hover:bg-white/5 hover:text-[#F3F4F6]"
                  }`
                }
              >
                {({ isActive }) => linkContent(isActive)}
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom Workspace Information */}
        {!collapsed ? (
          <div className="mt-auto border-t border-[#273244] pt-4 space-y-3.5 text-left select-none">
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider block">{getTranslation("CURRENT WORKSPACE", lang)}</span>
              <div className="bg-[#1A2332] border border-[#273244] rounded-xl p-3 space-y-2.5">
                <div className="flex items-start gap-2.5">
                  <div className="h-7 w-7 rounded-lg bg-[#16A34A]/10 text-[#16A34A] flex items-center justify-center font-bold text-xs shrink-0 border border-[#16A34A]/20">
                    RD
                  </div>
                  <div className="min-w-0">
                    <span className="block text-xs font-bold text-[#F3F4F6] truncate">
                      {user?.department || "Roads Department"}
                    </span>
                    <span className="block text-[10px] font-medium text-[#9CA3AF] truncate mt-0.5">
                      Senior Operations Officer
                    </span>
                  </div>
                </div>
                
                <div className="border-t border-[#273244]/60 pt-2 flex flex-col gap-1.5 text-[10px] font-semibold text-[#9CA3AF]">
                  <div className="flex items-center justify-between">
                    <span>{getTranslation("Shift Status:", lang)}</span>
                    <span className="text-[#16A34A] flex items-center gap-1 font-bold">
                      <Clock className="w-3 h-3 text-[#16A34A]" /> {getTranslation("Morning Shift", lang)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>{getTranslation("Last Login:", lang)}</span>
                    <span className="font-mono text-[#F3F4F6]">08:57 AM</span>
                  </div>
                </div>
              </div>
            </div>

            <button className="flex w-full items-center justify-center gap-1.5 px-3 py-2 bg-transparent hover:bg-white/5 border border-[#273244] text-xs font-bold text-[#F3F4F6] rounded-xl transition-all active:scale-[0.98] cursor-pointer">
              {getTranslation("Switch Department", lang)}
            </button>

            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-[10px] font-semibold text-[#6B7280]">
                <RefreshCw className="w-3 h-3 text-[#6B7280]" style={{ animation: "spin 6s linear infinite" }} />
                <span>{getTranslation("Last updated:", lang)} Jul 4, 09:42 AM IST</span>
              </div>
              <span className="text-[9px] font-medium text-[#6B7280] block pl-4.5">{getTranslation("All times shown in IST", lang)}</span>
            </div>
          </div>
        ) : (
          <div className="mt-auto flex flex-col gap-2 items-center">
            <div className="h-8 w-8 rounded-lg bg-[#1A2332] border border-[#273244] flex items-center justify-center text-[#16A34A] cursor-pointer" title="Current: Roads Department">
              RD
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
