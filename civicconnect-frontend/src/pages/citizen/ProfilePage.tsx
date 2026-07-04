import React, { useState, useEffect } from "react";
import { useAuthStore } from "../../stores/authStore";
import { TrustBadge } from "../../components/ui/TrustBadge";
import { 
  Mail, Calendar, LogOut, Zap, Trophy, Award, 
  Edit3, MapPin, Phone, Clock, CheckCircle2 
} from "lucide-react";
import { signOut } from "firebase/auth";
import { auth, db } from "../../config/firebase";
import { Button } from "../../components/ui/button";
import { doc, updateDoc } from "firebase/firestore";
import { calculateUserGamification } from "../../utils/gamification";

export const ProfilePage: React.FC = () => {
  const { user, setUser } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [bio, setBio] = useState(user?.bio || "");
  const [locality, setLocality] = useState(user?.locality || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [photoURL, setPhotoURL] = useState(user?.photoURL || "");
  const [saving, setSaving] = useState(false);

  // Sync state with user store
  useEffect(() => {
    if (user) {
      setBio(user.bio || "");
      setLocality(user.locality || "");
      setPhone(user.phone || "");
      setPhotoURL(user.photoURL || "");
    }
  }, [user]);

  const handleSignOut = () => {
    signOut(auth);
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const userRef = doc(db, "users", user.uid);
      const updates = {
        bio,
        locality,
        phone,
        photoURL
      };
      await updateDoc(userRef, updates);
      
      setUser({
        ...user,
        ...updates
      });
      setIsEditing(false);
    } catch (err) {
      console.error("Failed to save profile:", err);
    } finally {
      setSaving(false);
    }
  };

  // Gamification metrics
  const stats = calculateUserGamification(user);
  
  const reportsSubmitted = user?.trust?.totalReports || 0;
  const resolutionsConfirmed = user?.trust?.resolutionConfirmations || 0;
  const supportedIssues = user?.supportedIssues?.length || 0;
  const volunteerHours = user?.volunteerHours || 0;

  // Predefined avatar list
  const predefinedAvatars = [
    "https://api.dicebear.com/7.x/bottts/svg?seed=Vikram",
    "https://api.dicebear.com/7.x/bottts/svg?seed=Aishwarya",
    "https://api.dicebear.com/7.x/bottts/svg?seed=Rahul",
    "https://api.dicebear.com/7.x/bottts/svg?seed=Sneha",
    "https://api.dicebear.com/7.x/bottts/svg?seed=Pune"
  ];

  // Dynamically build milestone list
  const milestones = [
    { title: "Platform Pioneer", desc: "Registered and joined the community", date: user?.createdAt ? new Date(user.createdAt as any).toLocaleDateString() : "Recently" }
  ];
  if (reportsSubmitted > 0) {
    milestones.push({ title: "First Reporter", desc: "Logged first verified civic report", date: "Milestone" });
  }
  if (supportedIssues > 0) {
    milestones.push({ title: "Community Pillar", desc: "Upvoted and supported a neighbor's issue", date: "Milestone" });
  }
  if (volunteerHours > 0) {
    milestones.push({ title: "Civic Volunteer", desc: `Contributed ${volunteerHours} hours of local service`, date: "Milestone" });
  }

  const avatarSrc = photoURL || (user?.displayName ? `https://api.dicebear.com/7.x/initials/svg?seed=${user.displayName}` : "https://api.dicebear.com/7.x/bottts/svg?seed=Citizen");

  return (
    <div className="space-y-6 max-w-2xl mx-auto pb-28 text-left">
      {/* Page Heading */}
      <div className="flex justify-between items-end">
        <div className="space-y-1">
          <span className="text-[10px] font-black uppercase tracking-wider text-[#9AA3B8]">Citizen Profile</span>
          <h1 className="text-3xl font-black tracking-tight text-white">Your Profile</h1>
        </div>
        <Button variant="outline" onClick={() => setIsEditing(!isEditing)} className="flex items-center gap-1.5 text-xs font-bold bg-white/5 border-white/10 hover:bg-white/10">
          <Edit3 className="w-3.5 h-3.5" />
          {isEditing ? "View Profile" : "Edit Profile"}
        </Button>
      </div>

      {isEditing ? (
        /* EDIT PROFILE SECTION */
        <div className="bg-[#1E293B] border border-white/5 rounded-3xl p-6 shadow-2xl space-y-4">
          <h3 className="text-sm font-black text-white uppercase tracking-wider">Update Profile Details</h3>
          
          <div className="space-y-3.5 text-xs text-[#9AA3B8]">
            <div className="space-y-1">
              <label className="font-semibold block text-[#F3F4F6]">Select Profile Avatar</label>
              <div className="flex gap-2 flex-wrap pt-1.5">
                {predefinedAvatars.map((av) => (
                  <button
                    key={av}
                    onClick={() => setPhotoURL(av)}
                    className={`w-11 h-11 rounded-xl bg-white/5 border p-1 transition-all ${
                      photoURL === av ? "border-emerald-500 bg-emerald-500/10 scale-105" : "border-white/10 hover:border-white/20"
                    }`}
                  >
                    <img src={av} alt="Avatar option" className="w-full h-full object-contain" />
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={photoURL}
                onChange={(e) => setPhotoURL(e.target.value)}
                placeholder="Or paste custom image URL..."
                className="w-full bg-[#0F172A] border border-white/10 rounded-xl px-3 py-2 text-xs font-semibold text-white mt-2 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold block text-[#F3F4F6]">Locality / Ward</label>
              <input
                type="text"
                value={locality}
                onChange={(e) => setLocality(e.target.value)}
                placeholder="e.g. Viman Nagar, Pune"
                className="w-full bg-[#0F172A] border border-white/10 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold block text-[#F3F4F6]">Phone Number (Optional)</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. +91 98765 43210"
                className="w-full bg-[#0F172A] border border-white/10 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold block text-[#F3F4F6]">Short Bio</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell the community about yourself..."
                rows={3}
                className="w-full bg-[#0F172A] border border-white/10 rounded-xl p-3 text-xs font-semibold text-white focus:outline-none focus:border-emerald-500 resize-none"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button onClick={handleSave} disabled={saving} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
              {saving ? "Saving Changes..." : "Save Profile Details"}
            </Button>
            <Button variant="outline" onClick={() => setIsEditing(false)} className="border-white/10 text-white hover:bg-white/5">
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        /* PROFILE DISPLAY CARD */
        <div className="space-y-6">
          {/* Avatar + Identity Card */}
          <div className="bg-[#1E293B] border border-white/5 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
            {/* Ambient background glow */}
            <div className="absolute top-[-30%] left-[-10%] w-[40%] aspect-square rounded-full bg-emerald-500/10 blur-[60px] pointer-events-none" />

            <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6 relative z-10">
              {/* Profile Image */}
              <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-blue-500/20 border border-white/10 flex items-center justify-center font-black overflow-hidden shrink-0 shadow-lg">
                <img src={avatarSrc} alt={user?.displayName || "Profile avatar"} className="w-full h-full object-cover" />
              </div>
              <div className="text-center sm:text-left space-y-1.5 flex-1 min-w-0">
                <h2 className="text-xl font-black text-white">{user?.displayName || "Citizen"}</h2>
                <p className="text-xs text-[#9AA3B8] font-semibold max-w-md italic leading-relaxed">
                  {user?.bio || "No profile bio provided yet."}
                </p>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                  <TrustBadge tier={user?.trust?.tier || "new"} score={user?.trust?.score} />
                  <span className="inline-flex items-center rounded-xl bg-purple-500/10 border border-purple-500/20 px-2.5 py-0.5 text-[11px] font-bold text-purple-400">
                    Rank: {stats.rankName}
                  </span>
                  {user?.locality && (
                    <span className="inline-flex items-center gap-1 rounded-xl bg-white/5 border border-white/10 px-2.5 py-0.5 text-[11px] font-bold text-[#9AA3B8]">
                      <MapPin className="w-3 h-3" /> {user.locality}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* XP Progress Bar */}
            <div className="mt-6 bg-purple-500/5 border border-purple-500/20 rounded-2xl p-4 space-y-2 relative z-10">
              <div className="flex justify-between items-center text-xs font-black">
                <span className="text-purple-400 uppercase tracking-wider flex items-center gap-1.5 font-sans">
                  <Zap className="w-3.5 h-3.5 text-purple-400" /> LEVEL {stats.level}
                </span>
                <span className="text-purple-300 font-mono">{stats.reputation} / {stats.level * 100} XP (Reputation)</span>
              </div>
              <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-purple-500 to-purple-400 h-1.5 rounded-full transition-all duration-700"
                  style={{ width: `${stats.progressPct}%` }}
                />
              </div>
              <span className="text-[10px] text-purple-400/80 font-bold block text-right">
                {stats.xpToNextLevel} XP to level up
              </span>
            </div>
          </div>

          {/* User Performance Statistics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Reported", value: reportsSubmitted, icon: Award, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
              { label: "Resolved", value: resolutionsConfirmed, icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
              { label: "Supported", value: supportedIssues, icon: Trophy, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
              { label: "Hours Volunteered", value: volunteerHours, icon: Clock, color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20" }
            ].map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className={`bg-[#1E293B] border ${stat.bg} rounded-2xl p-4 text-center shadow-lg`}>
                  <Icon className={`w-5 h-5 mx-auto mb-2 ${stat.color}`} />
                  <div className={`text-2xl font-black ${stat.color} leading-none`}>{stat.value}</div>
                  <div className="text-[9px] uppercase font-bold tracking-widest text-[#9AA3B8] mt-2 leading-tight">{stat.label}</div>
                </div>
              );
            })}
          </div>

          {/* Achievement Badges Collection */}
          <div className="bg-[#1E293B] border border-white/5 rounded-2xl p-5 shadow-lg space-y-4">
            <span className="text-[10px] font-black text-[#9AA3B8] uppercase tracking-wider block">Gamification Badges Collection</span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {stats.badges.map((b) => (
                <div
                  key={b.id}
                  className={`border rounded-2xl p-3 text-center flex flex-col items-center justify-center space-y-1.5 transition-all ${
                    b.unlocked
                      ? "bg-gradient-to-br from-amber-500/10 to-yellow-500/10 border-amber-500/20 text-amber-400 shadow-md"
                      : "bg-white/[0.01] border-white/5 text-[#9AA3B8] opacity-35"
                  }`}
                >
                  <Award className={`w-5.5 h-5.5 ${b.unlocked ? "text-amber-400" : "text-[#9AA3B8]/30"}`} />
                  <span className="text-[11px] font-black block leading-none">{b.name}</span>
                  <span className="text-[9px] leading-snug block text-[#9AA3B8] font-semibold">{b.desc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Achievement Timeline */}
          <div className="bg-[#1E293B] border border-white/5 rounded-2xl p-5 shadow-lg space-y-4">
            <span className="text-[10px] font-black text-[#9AA3B8] uppercase tracking-wider block">Achievement Milestones</span>
            <div className="space-y-4 relative pl-3.5 border-l border-white/5 ml-1.5">
              {milestones.map((milestone, idx) => (
                <div key={idx} className="relative space-y-0.5">
                  <div className="absolute -left-[20px] top-1 w-2.5 h-2.5 bg-purple-500 rounded-full border-2 border-[#1E293B]" />
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-black text-white">{milestone.title}</span>
                    <span className="text-[10px] text-[#6B7280] font-bold">{milestone.date}</span>
                  </div>
                  <p className="text-[11px] text-[#9AA3B8] font-medium">{milestone.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Account details */}
          <div className="bg-[#1E293B] border border-white/5 rounded-2xl p-5 shadow-lg space-y-4">
            <span className="text-[10px] font-black text-[#9AA3B8] uppercase tracking-wider block">Account Settings</span>
            <div className="space-y-3">
              <div className="flex items-center space-x-3 text-sm text-[#9AA3B8]">
                <Mail className="w-4 h-4 text-[#9AA3B8]/50 shrink-0" />
                <span className="font-medium">{user?.email}</span>
              </div>
              {phone && (
                <div className="flex items-center space-x-3 text-sm text-[#9AA3B8]">
                  <Phone className="w-4 h-4 text-[#9AA3B8]/50 shrink-0" />
                  <span className="font-medium">{phone}</span>
                </div>
              )}
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
      )}
    </div>
  );
};

export default ProfilePage;
