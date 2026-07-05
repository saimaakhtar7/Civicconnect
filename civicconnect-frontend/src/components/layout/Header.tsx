import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../stores/authStore";
import { auth } from "../../config/firebase";
import { signOut } from "firebase/auth";
import { Shield, LogOut, Bell, User, Search, Calendar, ChevronDown, Settings, Activity } from "lucide-react";
import { TrustBadge } from "../ui/TrustBadge";
import { useNotificationStore } from "../../stores/notificationStore";
import { NotificationCenter } from "../ui/NotificationCenter";
import { GlobalSearch } from "../ui/GlobalSearch";
import { getTranslation } from "../../utils/translation";

interface HeaderProps {
  showNotifications?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ showNotifications = true }) => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { unreadCount } = useNotificationStore();
  const [notifOpen, setNotifOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [lang, setLang] = useState(localStorage.getItem("settings_language") || "en-IN");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleSettingsUpdate = () => {
      setLang(localStorage.getItem("settings_language") || "en-IN");
    };
    window.addEventListener("settings-updated", handleSettingsUpdate);
    return () => window.removeEventListener("settings-updated", handleSettingsUpdate);
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate("/landing");
    } catch (error) {
      console.error("Sign out error", error);
    }
  };

  const isOfficial = user?.role === "official" || user?.role === "admin";

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#273244] bg-[#111827]/90 backdrop-blur-md shadow-md">
      <div className="max-w-[1700px] mx-auto flex h-16 items-center justify-between px-6 sm:px-8">
        
        {/* Brand/Logo Section */}
        <div 
          className="flex items-center space-x-3 cursor-pointer select-none" 
          onClick={() => navigate && (user?.role === "citizen" ? navigate("/app") : navigate("/dashboard"))}
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#16A34A] to-[#15803D] text-white shadow-sm border border-[#16A34A]/20">
            <Shield className="h-5 w-5" />
          </div>
          <div className="text-left leading-none">
            <span className="text-[16px] font-black tracking-tight text-[#F3F4F6] block">
              CivicConnect <span className="text-[#16A34A]">AI</span>
            </span>
            {isOfficial ? (
              <span className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider block mt-0.5">
                {getTranslation("Municipal Operations Platform", lang)}
              </span>
            ) : (
              <span className="text-[10px] font-bold text-[#16A34A] uppercase tracking-widest block mt-0.5">
                AI for Better Governance
              </span>
            )}
          </div>
        </div>

        {/* Citizen Navigation Links (Desktop) */}
        {!isOfficial && user?.role === "citizen" && (
          <div className="hidden md:flex items-center space-x-5 text-xs font-black uppercase tracking-wider text-[#9CA3AF] ml-4 shrink-0">
            <button onClick={() => navigate("/app")} className="hover:text-white transition-colors cursor-pointer">Home</button>
            <button onClick={() => navigate("/app/map")} className="hover:text-white transition-colors cursor-pointer">Map</button>
            <button onClick={() => navigate("/app/community")} className="hover:text-white transition-colors cursor-pointer">Community</button>
            <button onClick={() => navigate("/app/events")} className="hover:text-white transition-colors cursor-pointer">Events</button>
          </div>
        )}

        {/* Center Search Bar */}
        <div 
          onClick={() => setSearchOpen(true)}
          className="hidden md:flex items-center space-x-2.5 bg-[#1A2332] border border-[#273244] px-3.5 py-1.5 rounded-xl w-80 lg:w-96 cursor-pointer hover:border-[#16A34A]/30 transition-all text-[#9CA3AF] text-xs font-sans"
        >
          <Search className="w-3.5 h-3.5 text-[#9CA3AF]" />
          <span className="text-[#9CA3AF]/60 text-xs font-medium">{getTranslation("Search incidents, locations, departments...", lang)}</span>
          <span className="ml-auto text-[9px] bg-[#273244] px-1.5 py-0.5 rounded text-[#9CA3AF] font-mono">/</span>
        </div>

        {/* Right Info and Actions */}
        <div className="flex items-center space-x-4">
          
          {/* Official-only Telemetry Badges */}
          {isOfficial && (
            <>
              {/* System Online Status */}
              <div className="hidden xl:flex items-center gap-2 px-3 py-1 bg-[#16A34A]/5 border border-[#16A34A]/20 rounded-xl">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#16A34A] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#16A34A]"></span>
                </span>
                <div className="text-left leading-none">
                  <span className="block text-[11px] font-bold text-[#F3F4F6]">{getTranslation("System Online", lang)}</span>
                  <span className="block text-[9px] text-[#9CA3AF] font-semibold mt-0.5">All services operational</span>
                </div>
              </div>

              {/* Hardlocked Simulated Date & Time */}
              <div className="hidden lg:flex items-center gap-2.5 px-3 py-1 bg-[#1A2332] border border-[#273244] rounded-xl text-[#F3F4F6]">
                <Calendar className="w-3.5 h-3.5 text-[#9CA3AF]" />
                <div className="text-left leading-none font-sans">
                  <span className="block text-[11px] font-bold">July 4, 2026</span>
                  <span className="block text-[10px] font-mono text-[#9CA3AF] font-semibold mt-0.5">09:42 AM IST</span>
                </div>
              </div>
            </>
          )}

          {/* Citizen-only trust badge */}
          {!isOfficial && user?.role === "citizen" && user.trust && (
            <div className="hidden sm:block">
              <TrustBadge tier={user.trust.tier} score={user.trust.score} />
            </div>
          )}

          {/* Search Trigger for Mobile */}
          <button
            onClick={() => setSearchOpen(true)}
            className="md:hidden p-1.5 text-[#9CA3AF] hover:text-[#F3F4F6] rounded-xl hover:bg-white/5 transition-colors cursor-pointer"
            title="Search incidents"
          >
            <Search className="h-5 w-5" />
          </button>

          {showNotifications && (
            <button
              onClick={() => setNotifOpen(true)}
              className="relative p-1.5 text-[#9CA3AF] hover:text-[#F3F4F6] rounded-xl hover:bg-white/5 transition-colors cursor-pointer"
              title="Notifications"
            >
              <span className="sr-only">Notifications</span>
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-[#DC2626] ring-2 ring-[#111827]" />
              )}
            </button>
          )}

          {/* Profile and Logout Section */}
          <div className="flex items-center space-x-3 pl-2 border-l border-[#273244] relative" ref={dropdownRef}>
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center space-x-2.5 p-1.5 rounded-xl hover:bg-white/5 transition-all cursor-pointer focus:outline-none select-none text-left"
                >
                  <div className="h-8 w-8 rounded-xl bg-[#16A34A]/10 text-[#16A34A] flex items-center justify-center font-bold text-sm border border-[#16A34A]/20 shadow-sm shrink-0 overflow-hidden">
                    {user.photoURL ? (
                      <img src={user.photoURL} alt={user.displayName || "User"} className="w-full h-full object-cover" />
                    ) : user.displayName ? (
                      user.displayName[0].toUpperCase()
                    ) : (
                      <User className="w-4 h-4" />
                    )}
                  </div>
                  <div className="hidden sm:block text-left leading-none pr-1">
                    <span className="block text-[13px] font-semibold text-[#F3F4F6] truncate max-w-[100px]">
                      {user.displayName || user.email?.split("@")[0] || "User"}
                    </span>
                    <span className={`inline-flex items-center w-fit rounded-lg px-1.5 py-0.5 text-[8px] font-bold tracking-wider uppercase border mt-0.5 ${
                      user.role === "admin"
                        ? "bg-purple-500/10 text-purple-400 border-purple-500/20"
                        : user.role === "moderator"
                        ? "bg-orange-500/10 text-orange-400 border-orange-500/20"
                        : user.role === "official"
                        ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                        : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    }`}>
                      {user.role}
                    </span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-[#9CA3AF] shrink-0" />
                </button>

                {/* Dropdown Menu */}
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2.5 w-48 rounded-xl bg-[#111827]/95 border border-[#273244] shadow-2xl p-1.5 z-50 backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-3 py-2 border-b border-[#273244] mb-1">
                      <span className="block text-xs font-bold text-white truncate">{user.displayName || "User"}</span>
                      <span className="block text-[10px] text-[#9CA3AF] truncate mt-0.5">{user.email}</span>
                    </div>

                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        navigate("/app/profile");
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-[#9CA3AF] hover:text-white hover:bg-white/5 rounded-lg transition-colors text-left cursor-pointer"
                    >
                      <User className="w-3.5 h-3.5" />
                      Profile
                    </button>

                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        if (user.role === "citizen") {
                          navigate("/app/profile#settings");
                        } else {
                          navigate("/dashboard/settings");
                        }
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-[#9CA3AF] hover:text-white hover:bg-white/5 rounded-lg transition-colors text-left cursor-pointer"
                    >
                      <Settings className="w-3.5 h-3.5" />
                      Settings
                    </button>

                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        navigate("/app/profile#activity");
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-[#9CA3AF] hover:text-white hover:bg-white/5 rounded-lg transition-colors text-left cursor-pointer"
                    >
                      <Activity className="w-3.5 h-3.5" />
                      My Activity
                    </button>

                    <div className="h-px bg-[#273244] my-1" />

                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        handleSignOut();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-[#DC2626] hover:bg-[#DC2626]/10 rounded-lg transition-colors text-left cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => navigate("/auth/signin")}
                className="px-3.5 py-1.5 bg-[#16A34A] hover:bg-[#15803D] text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </div>

      <NotificationCenter isOpen={notifOpen} onClose={() => setNotifOpen(false)} />
      <GlobalSearch isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </header>
  );
};

export default Header;
