import React from "react";
import { useAuthStore } from "../../stores/authStore";
import { TrustBadge } from "../../components/ui/TrustBadge";
import { Mail, Calendar, LogOut, Zap, Trophy, Award, CheckCircle } from "lucide-react";
import { signOut } from "firebase/auth";
import { auth } from "../../config/firebase";
import { Button } from "../../components/ui/button";

export const ProfilePage: React.FC = () => {
  const { user } = useAuthStore();

  const handleSignOut = () => {
    signOut(auth);
  };

  // Gamification metrics
  const reportsSubmitted = user?.trust?.totalReports || 0;
  const verificationsDone = user?.trust?.verificationContributions || 0;
  const resolutionsConfirmed = user?.trust?.resolutionConfirmations || 0;

  const xp = reportsSubmitted * 50 + verificationsDone * 20 + resolutionsConfirmed * 30;
  const currentLevel = Math.floor(xp / 100) + 1;
  const remainingXp = xp % 100;
  const progressPct = remainingXp;

  const badges = [
    { name: "Pioneer", desc: "Submitted first issue report", unlocked: reportsSubmitted > 0 },
    { name: "Watcher", desc: "Verified community updates", unlocked: verificationsDone > 0 },
    { name: "Guardian", desc: "Confirmed resolution completion", unlocked: resolutionsConfirmed > 0 },
  ];

  const avatarInitial = user?.displayName ? user.displayName[0].toUpperCase() : "U";

  return (
    <div className="space-y-6 max-w-2xl mx-auto pb-28">
      {/* Page heading */}
      <div className="space-y-1">
        <span className="text-[10px] font-black uppercase tracking-wider text-[#9AA3B8]">Citizen Profile</span>
        <h1 className="text-3xl font-black tracking-tight text-white">Your Profile</h1>
      </div>

      {/* Avatar + Identity Card */}
      <div className="bg-[#1E293B] border border-white/5 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
        {/* Glow */}
        <div className="absolute top-[-30%] left-[-10%] w-[40%] aspect-square rounded-full bg-emerald-500/10 blur-[60px] pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-center space-y-5 sm:space-y-0 sm:space-x-6 relative z-10">
          {/* Avatar */}
          <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-blue-500/20 border border-white/10 text-[#22C55E] flex items-center justify-center font-black text-3xl shrink-0 shadow-lg">
            {avatarInitial}
          </div>
          <div className="text-center sm:text-left space-y-2">
            <h2 className="text-xl font-black text-white">{user?.displayName || "Citizen"}</h2>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <TrustBadge tier={user?.trust?.tier || "new"} score={user?.trust?.score} />
              <span className="inline-flex items-center rounded-xl bg-white/5 border border-white/10 px-2.5 py-1 text-xs font-bold text-[#9AA3B8]">
                Role: {user?.role}
              </span>
            </div>
          </div>
        </div>

        {/* XP Progress Bar */}
        <div className="mt-6 bg-purple-500/5 border border-purple-500/20 rounded-2xl p-4 space-y-2 relative z-10">
          <div className="flex justify-between items-center text-xs font-black">
            <span className="text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-purple-400" /> Level {currentLevel}
            </span>
            <span className="text-purple-300">{remainingXp} / 100 XP</span>
          </div>
          <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-purple-500 to-purple-400 h-1.5 rounded-full transition-all duration-700"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <span className="text-[10px] text-purple-400/80 font-bold block text-right">
            {100 - remainingXp} XP to next level
          </span>
        </div>
      </div>

      {/* Stats Strip */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Submitted", value: reportsSubmitted, icon: Award, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
          { label: "Verifications", value: verificationsDone, icon: Trophy, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
          { label: "Confirmed", value: resolutionsConfirmed, icon: CheckCircle, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className={`bg-[#1E293B] border ${stat.bg} rounded-2xl p-4 text-center shadow-lg`}>
              <Icon className={`w-5 h-5 mx-auto mb-2 ${stat.color}`} />
              <div className={`text-2xl font-black ${stat.color} leading-none`}>{stat.value}</div>
              <div className="text-[10px] uppercase font-bold tracking-widest text-[#9AA3B8] mt-2">{stat.label}</div>
            </div>
          );
        })}
      </div>

      {/* Badges */}
      <div className="bg-[#1E293B] border border-white/5 rounded-2xl p-5 shadow-lg space-y-4">
        <span className="text-[10px] font-black text-[#9AA3B8] uppercase tracking-wider block">Achievements</span>
        <div className="grid grid-cols-3 gap-3">
          {badges.map((b) => (
            <div
              key={b.name}
              className={`border rounded-2xl p-4 text-center flex flex-col items-center justify-center space-y-2 transition-all ${
                b.unlocked
                  ? "bg-gradient-to-br from-amber-500/10 to-yellow-500/10 border-amber-500/20 text-amber-400"
                  : "bg-white/[0.02] border-white/5 text-[#9AA3B8] opacity-40"
              }`}
            >
              <Award className={`w-6 h-6 ${b.unlocked ? "text-amber-400" : "text-[#9AA3B8]/30"}`} />
              <span className="text-[11px] font-black block">{b.name}</span>
              <span className="text-[9px] leading-snug block text-[#9AA3B8]">{b.desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Account Details */}
      <div className="bg-[#1E293B] border border-white/5 rounded-2xl p-5 shadow-lg space-y-4">
        <span className="text-[10px] font-black text-[#9AA3B8] uppercase tracking-wider block">Account</span>
        <div className="space-y-3">
          <div className="flex items-center space-x-3 text-sm text-[#9AA3B8]">
            <Mail className="w-4 h-4 text-[#9AA3B8]/50 shrink-0" />
            <span className="font-medium">{user?.email}</span>
          </div>
          <div className="flex items-center space-x-3 text-sm text-[#9AA3B8]">
            <Calendar className="w-4 h-4 text-[#9AA3B8]/50 shrink-0" />
            <span className="font-medium">
              Joined {user?.createdAt ? new Date(user.createdAt as any).toLocaleDateString() : "Recently"}
            </span>
          </div>
        </div>
        <div className="pt-2 border-t border-white/5">
          <Button
            variant="danger"
            className="w-full"
            onClick={handleSignOut}
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
