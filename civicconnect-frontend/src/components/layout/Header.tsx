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
    <header className="sticky top-0 z-40 w-full border-b border-white/5 bg-[#0F172A]/85 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        {/* Brand */}
        <div className="flex items-center space-x-2.5 cursor-pointer" onClick={() => navigate && (user?.role === "citizen" ? navigate("/") : navigate("/dashboard"))}>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-md shadow-emerald-500/10">
            <Shield className="h-5 w-5" />
          </div>
          <span className="text-lg font-black tracking-tight text-white">
            CivicConnect <span className="text-[#22C55E]">AI</span>
          </span>
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

          {/* Search Trigger */}
          <button
            onClick={() => setSearchOpen(true)}
            className="p-1.5 text-[#9AA3B8] hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
            title="Search Civic Directory"
          >
            <Search className="h-5 w-5" />
          </button>

          {showNotifications && (
            <button
              onClick={() => setNotifOpen(true)}
              className="relative p-1.5 text-[#9AA3B8] hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
              title="Notifications"
            >
              <span className="sr-only">Notifications</span>
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-[#0F172A] animate-pulse" />
              )}
            </button>
          )}

          {/* User profile dropdown stub */}
          <div className="flex items-center space-x-3 pl-2 border-l border-white/5">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-full bg-emerald-500/10 text-[#22C55E] flex items-center justify-center font-bold text-sm border border-emerald-500/20">
                {user?.displayName ? user.displayName[0].toUpperCase() : <User className="w-4 h-4" />}
              </div>
              <div className="flex items-center gap-3">
                <span className="hidden md:block text-sm font-semibold text-white">
                  {user?.displayName || "User"}
                </span>
                {auth.currentUser?.isAnonymous && (
                  <span className="hidden sm:inline-flex items-center rounded-lg bg-emerald-500/10 px-2.5 py-1 text-[11px] font-bold text-emerald-200 border border-emerald-500/20">
                    Guest Mode
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
