import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../stores/authStore";
import { auth } from "../../config/firebase";
import { signOut } from "firebase/auth";
import { Shield, LogOut, Bell, User, Search, Calendar } from "lucide-react";
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
          onClick={() => navigate && (user?.role === "citizen" ? navigate("/") : navigate("/dashboard"))}
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
            <button onClick={() => navigate("/")} className="hover:text-white transition-colors cursor-pointer">Home</button>
            <button onClick={() => navigate("/map")} className="hover:text-white transition-colors cursor-pointer">Map</button>
            <button onClick={() => navigate("/community")} className="hover:text-white transition-colors cursor-pointer">Community</button>
            <button onClick={() => navigate("/events")} className="hover:text-white transition-colors cursor-pointer">Events</button>
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
          <div className="flex items-center space-x-3 pl-2 border-l border-[#273244]">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-xl bg-[#16A34A]/10 text-[#16A34A] flex items-center justify-center font-bold text-sm border border-[#16A34A]/20 shadow-sm">
                {user?.displayName ? user.displayName[0].toUpperCase() : <User className="w-4 h-4" />}
              </div>
              <div className="text-left flex items-center gap-3">
                <div className="leading-none">
                  <span className="block text-[13px] font-semibold text-[#F3F4F6] truncate max-w-[120px]">
                    {user?.displayName || (isOfficial ? "Officer Vikram" : "Guest")}
                  </span>
                  {isOfficial ? (
                    <span className="block text-[10px] text-[#9CA3AF] mt-0.5 font-semibold">
                      {user?.department || "Roads Department"}
                    </span>
                  ) : (
                    auth.currentUser?.isAnonymous && (
                      <span className="inline-flex items-center rounded-lg bg-[#16A34A]/10 px-2 py-0.5 text-[9px] font-mono tracking-wider uppercase font-bold text-[#16A34A] border border-[#16A34A]/25 mt-0.5">
                        Guest Session
                      </span>
                    )
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={handleSignOut}
              className="p-1.5 text-[#9CA3AF] hover:text-[#DC2626] rounded-xl hover:bg-white/5 transition-colors cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      <NotificationCenter isOpen={notifOpen} onClose={() => setNotifOpen(false)} />
      <GlobalSearch isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </header>
  );
};

export default Header;
