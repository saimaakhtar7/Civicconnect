import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../stores/authStore";
import { auth } from "../../config/firebase";
import { signOut } from "firebase/auth";
import { Shield, LogOut, Bell, User, Search } from "lucide-react";
import { TrustBadge } from "../ui/TrustBadge";
import { useNotificationStore } from "../../stores/notificationStore";
import { NotificationCenter } from "../ui/NotificationCenter";
import { GlobalSearch } from "../ui/GlobalSearch";

interface HeaderProps {
  showNotifications?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ showNotifications = true }) => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { unreadCount } = useNotificationStore();
  const [notifOpen, setNotifOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Sign out error", error);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#262626] bg-[#090909]/80 backdrop-blur-md">
      <div className="max-w-[1700px] mx-auto flex h-16 items-center justify-between px-6 sm:px-8">
        {/* Brand */}
        <div className="flex items-center space-x-2.5 cursor-pointer" onClick={() => navigate && (user?.role === "citizen" ? navigate("/") : navigate("/dashboard"))}>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#22C55E]/10 border border-[#22C55E]/20 text-[#22C55E] shadow-sm">
            <Shield className="h-5 w-5" />
          </div>
          <span className="text-sm font-black tracking-tight text-white font-sans">
            CivicConnect <span className="text-[#22C55E]">AI</span>
          </span>
        </div>

        {/* Center Search Bar (SaaS layout) */}
        <div 
          onClick={() => setSearchOpen(true)}
          className="hidden md:flex items-center space-x-2 bg-[#151515] border border-[#262626] px-3 py-1.5 rounded-lg w-80 cursor-pointer hover:border-[#22C55E]/30 transition-all text-[#A1A1AA] text-xs font-sans"
        >
          <Search className="w-3.5 h-3.5 text-[#A1A1AA]" />
          <span className="text-[#A1A1AA]/60">Search Civic Directory...</span>
          <span className="ml-auto text-[9px] bg-[#262626] px-1.5 py-0.5 rounded text-[#A1A1AA]">/</span>
        </div>

        {/* User Info / Notifications / Actions */}
        <div className="flex items-center space-x-4">
          {user?.role === "citizen" && user.trust && (
            <div className="hidden sm:block">
              <TrustBadge tier={user.trust.tier} score={user.trust.score} />
            </div>
          )}

          {user?.role !== "citizen" && (
            <span className="hidden sm:inline-flex items-center rounded-lg bg-purple-500/10 px-2.5 py-1 text-xs font-bold text-purple-300 border border-purple-500/20">
              Official: {user?.department?.toUpperCase()}
            </span>
          )}

          {/* Search Trigger for Mobile */}
          <button
            onClick={() => setSearchOpen(true)}
            className="md:hidden p-1.5 text-[#9CA3AF] hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
            title="Search Civic Directory"
          >
            <Search className="h-5 w-5" />
          </button>

          {showNotifications && (
            <button
              onClick={() => setNotifOpen(true)}
              className="relative p-1.5 text-[#9CA3AF] hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
              title="Notifications"
            >
              <span className="sr-only">Notifications</span>
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-[#EF4444] ring-2 ring-[#090909]" />
              )}
            </button>
          )}

          {/* User profile dropdown stub */}
          <div className="flex items-center space-x-3 pl-2 border-l border-[#262626]">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-full bg-[#22C55E]/10 text-[#22C55E] flex items-center justify-center font-bold text-sm border border-[#22C55E]/20">
                {user?.displayName ? user.displayName[0].toUpperCase() : <User className="w-4 h-4" />}
              </div>
              <div className="flex items-center gap-3">
                <span className="hidden md:block text-xs font-semibold text-white">
                  {user?.displayName || "Guest"}
                </span>
                {auth.currentUser?.isAnonymous && (
                  <span className="hidden sm:inline-flex items-center rounded bg-[#22C55E]/10 px-2 py-0.5 text-[9px] font-mono tracking-wider uppercase font-bold text-[#22C55E] border border-[#22C55E]/20">
                    Guest Session
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={handleSignOut}
              className="p-1.5 text-[#9AA3B8] hover:text-red-400 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Slide-over Drawers / Overlays */}
      <NotificationCenter isOpen={notifOpen} onClose={() => setNotifOpen(false)} />
      <GlobalSearch isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </header>
  );
};
export default Header;
