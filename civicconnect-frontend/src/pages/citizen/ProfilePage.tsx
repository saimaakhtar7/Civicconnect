import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../stores/authStore";
import {
  Mail, Calendar, Zap, Trophy, Award,
  MapPin, Clock, CheckCircle2,
  Upload, Trash2,
  Sliders, MessageSquare, HelpCircle,
  Bell, ChevronRight, Activity
} from "lucide-react";
import { db, storage } from "../../config/firebase";
import { Button } from "../../components/ui/button";
import { doc, updateDoc, collection, query, where, getDocs } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { calculateUserGamification } from "../../utils/gamification";

// Badge criteria mapping
const BADGES_LIST = [
  { id: "first_report", name: "First Report", desc: "Reported your first community issue", icon: "📌", check: (stats: any) => stats.reportedCount >= 1 },
  { id: "community_helper", name: "Community Helper", desc: "Supported at least 5 community issues", icon: "🤝", check: (stats: any) => stats.supportCount >= 5 },
  { id: "volunteer", name: "Active Volunteer", desc: "Participated in volunteer hours", icon: "🌱", check: (stats: any) => stats.volunteerHours > 0 },
  { id: "issue_resolver", name: "Issue Resolver", desc: "Confirmed resolution of an issue", icon: "✅", check: (stats: any) => stats.resolvedCount >= 1 },
  { id: "top_contributor", name: "Top Contributor", desc: "Earned more than 50 reputation points", icon: "🔥", check: (_stats: any, user: any) => (user?.reputation || 0) >= 50 },
  { id: "early_adopter", name: "Early Adopter", desc: "Joined the platform in its early phase", icon: "🚀", check: () => true },
  { id: "supports_100", name: "100 Supports", desc: "Voted/supported 100 times", icon: "🏆", check: (stats: any) => stats.supportCount >= 100 },
  { id: "discussion_leader", name: "Discussion Leader", desc: "Created 3 or more community posts", icon: "💬", check: (stats: any) => stats.postsCount >= 3 }
];

export const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, setUser } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // States
  const [activeTab, setActiveTab] = useState<"profile" | "settings" | "activity">("profile");
  const [bio, setBio] = useState(user?.bio || "");
  const [locality, setLocality] = useState(user?.locality || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [address, setAddress] = useState((user as any)?.address || "");
  const [emergencyContact, setEmergencyContact] = useState((user as any)?.emergencyContact || "");
  const [name, setName] = useState(user?.displayName || "");
  const [photoURL, setPhotoURL] = useState(user?.photoURL || "");
  const [saving, setSaving] = useState(false);
  const [_statsLoading, setStatsLoading] = useState(true);

  // Notification and Privacy states
  const [notifVerification, setNotifVerification] = useState(user?.notificationPreferences?.verificationRequests ?? true);
  const [notifStatus, setNotifStatus] = useState(user?.notificationPreferences?.statusUpdates ?? true);
  const [notifWeekly, setNotifWeekly] = useState(user?.notificationPreferences?.weeklyDigest ?? false);
  const [publicProfile, setPublicProfile] = useState((user as any)?.privacyPreferences?.publicProfile ?? true);
  const [anonymousDefault, setAnonymousDefault] = useState((user as any)?.privacyPreferences?.anonymousDefault ?? false);

  // Computed metrics from DB
  const [dbStats, setDbStats] = useState({
    reportedCount: 0,
    resolvedCount: 0,
    postsCount: 0,
    commentsCount: 0,
    eventsCount: 0,
    volunteerHours: 0,
    supportCount: 0
  });

  const [activityTimeline, setActivityTimeline] = useState<any[]>([]);
  const [userIssues, setUserIssues] = useState<any[]>([]);

  // Sync tab with URL hash
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash;
      if (hash === "#settings") setActiveTab("settings");
      else if (hash === "#activity") setActiveTab("activity");
      else setActiveTab("profile");
    };
    handleHash();
    window.addEventListener("hashchange", handleHash);
    return () => window.removeEventListener("hashchange", handleHash);
  }, []);

  // Fetch Firestore Stats and activity feed
  useEffect(() => {
    if (!user) return;
    const fetchAllData = async () => {
      setStatsLoading(true);
      try {
        const issuesRef = collection(db, "issues");
        const issuesSnap = await getDocs(query(issuesRef, where("reportedBy", "==", user.uid)));
        const reported = issuesSnap.size;
        const resolved = issuesSnap.docs.filter(doc => ["resolved", "closed"].includes(doc.data().status)).length;
        
        const issuesList = issuesSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as any[];
        setUserIssues(issuesList);

        const discussionsRef = collection(db, "discussions");
        const discussionsSnap = await getDocs(query(discussionsRef, where("authorId", "==", user.uid)));
        const posts = discussionsSnap.size;

        const calculatedStats = {
          reportedCount: reported || user.trust?.totalReports || 0,
          resolvedCount: resolved || user.trust?.resolutionConfirmations || 0,
          postsCount: posts || 0,
          commentsCount: user.statistics?.comments || 0,
          eventsCount: user.eventsParticipated?.length || 0,
          volunteerHours: user.volunteerHours || 0,
          supportCount: user.supportedIssues?.length || 0
        };
        setDbStats(calculatedStats);

        // Build Activity timeline
        const rawActivities: any[] = [];
        
        issuesSnap.docs.forEach(doc => {
          const data = doc.data();
          rawActivities.push({
            id: doc.id,
            type: "issue",
            title: `Reported issue: "${data.title}"`,
            desc: `Status: ${data.status.replace("_", " ")}`,
            date: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
          });
        });

        discussionsSnap.docs.forEach(doc => {
          const data = doc.data();
          rawActivities.push({
            id: doc.id,
            type: "discussion",
            title: `Posted discussion: "${data.title}"`,
            desc: "Started a community thread",
            date: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
          });
        });

        // Add unlocked badges to timeline
        const unlockedBadges = BADGES_LIST.filter(b => b.check(calculatedStats, user));
        unlockedBadges.forEach(b => {
          rawActivities.push({
            id: b.id,
            type: "badge",
            title: `Earned Badge: "${b.name}"`,
            desc: b.desc,
            date: user.createdAt ? (typeof user.createdAt === "string" ? new Date(user.createdAt) : (user.createdAt as any).toDate ? (user.createdAt as any).toDate() : new Date()) : new Date(),
          });
        });

        rawActivities.sort((a, b) => b.date.getTime() - a.date.getTime());
        setActivityTimeline(rawActivities);

      } catch (err) {
        console.error("Error gathering profile data:", err);
      } finally {
        setStatsLoading(false);
      }
    };
    fetchAllData();
  }, [user]);

  // Sync details state
  useEffect(() => {
    if (user) {
      setName(user.displayName || "");
      setBio(user.bio || "");
      setLocality(user.locality || "");
      setPhone(user.phone || "");
      setAddress((user as any).address || "");
      setEmergencyContact((user as any).emergencyContact || "");
      setPhotoURL(user.photoURL || "");
    }
  }, [user]);



  // Image upload handler (Storage with Base64 fallback)
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setSaving(true);

    try {
      const storageRef = ref(storage, `users/${user.uid}/avatar`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      setPhotoURL(url);

      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, { photoURL: url });
      setUser({ ...user, photoURL: url });
    } catch (err) {
      console.error("Storage upload failed, attempting local Base64 fallback:", err);
      try {
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64Url = reader.result as string;
          setPhotoURL(base64Url);
          const userRef = doc(db, "users", user.uid);
          await updateDoc(userRef, { photoURL: base64Url });
          setUser({ ...user, photoURL: base64Url });
        };
        reader.readAsDataURL(file);
      } catch (innerErr) {
        console.error("Base64 conversion failed:", innerErr);
      }
    } finally {
      setSaving(false);
    }
  };

  // Remove photo
  const handleRemoveImage = async () => {
    if (!user) return;
    setSaving(true);
    try {
      setPhotoURL("");
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, { photoURL: "" });
      setUser({ ...user, photoURL: "" });
    } catch (err) {
      console.error("Remove image failed:", err);
    } finally {
      setSaving(false);
    }
  };

  // Save Settings
  const handleSaveSettings = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const updates = {
        displayName: name,
        bio,
        locality,
        phone,
        address,
        emergencyContact,
        notificationPreferences: {
          verificationRequests: notifVerification,
          statusUpdates: notifStatus,
          weeklyDigest: notifWeekly,
          communityMilestones: user.notificationPreferences?.communityMilestones ?? true
        },
        privacyPreferences: {
          publicProfile,
          anonymousDefault
        }
      };
      
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, updates);
      setUser({ ...user, ...updates });
      setActiveTab("profile");
    } catch (err) {
      console.error("Failed to save settings:", err);
    } finally {
      setSaving(false);
    }
  };

  // Gamification & Reputation
  const gamification = calculateUserGamification(user);
  
  // Calculate participation score
  const totalPosts = dbStats.postsCount;
  const totalComments = dbStats.commentsCount;
  const totalEvents = dbStats.eventsCount;
  const totalSupports = dbStats.supportCount;
  const reputation = user?.reputation || 0;
  
  const rawScore = (totalPosts * 15) + (totalComments * 5) + (totalEvents * 20) + (totalSupports * 10) + reputation;
  const participationScore = Math.min(Math.round(rawScore), 100);
  const communityRank = participationScore > 0 ? Math.max(1, 100 - Math.min(Math.round(participationScore * 0.95), 99)) : 100;

  const unlockedBadges = BADGES_LIST.filter(b => b.check(dbStats, user));

  const avatarSrc = photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${user?.displayName || "Citizen"}`;

  return (
    <div className="space-y-6 pb-28 text-left max-w-7xl mx-auto">
      
      {/* ── Tabs navigation ────────────────────────────────────────────────── */}
      <div className="flex border-b border-[#273244] gap-6">
        <button
          onClick={() => { setActiveTab("profile"); window.location.hash = ""; }}
          className={`pb-3 text-sm font-black uppercase tracking-wider transition-all cursor-pointer ${activeTab === "profile" ? "text-[#16A34A] border-b-2 border-[#16A34A]" : "text-[#9CA3AF] hover:text-white"}`}
        >
          Overview
        </button>
        <button
          onClick={() => { setActiveTab("settings"); window.location.hash = "#settings"; }}
          className={`pb-3 text-sm font-black uppercase tracking-wider transition-all cursor-pointer ${activeTab === "settings" ? "text-[#16A34A] border-b-2 border-[#16A34A]" : "text-[#9CA3AF] hover:text-white"}`}
        >
          Account Settings
        </button>
        <button
          onClick={() => { setActiveTab("activity"); window.location.hash = "#activity"; }}
          className={`pb-3 text-sm font-black uppercase tracking-wider transition-all cursor-pointer ${activeTab === "activity" ? "text-[#16A34A] border-b-2 border-[#16A34A]" : "text-[#9CA3AF] hover:text-white"}`}
        >
          My History
        </button>
      </div>

      {activeTab === "profile" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* ── LEFT COLUMN ──────────────────────────────────────────────────── */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Identity Card */}
            <div className="bg-[#1E293B] border border-white/5 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
              <div className="absolute top-[-30%] left-[-10%] w-[40%] aspect-square rounded-full bg-emerald-500/10 blur-[60px] pointer-events-none" />
              
              <div className="flex flex-col items-center text-center space-y-4 relative z-10">
                
                {/* Avatar Display & Actions */}
                <div className="relative group">
                  <div className="h-24 w-24 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-blue-500/20 border border-white/10 flex items-center justify-center font-black overflow-hidden shadow-lg">
                    <img src={avatarSrc} alt={user?.displayName || "Avatar"} className="w-full h-full object-cover" />
                  </div>
                  
                  {/* Photo Edit overlays */}
                  <div className="absolute inset-0 bg-[#0F172A]/80 rounded-2xl opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-1.5 transition-opacity duration-200">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="p-1 text-[#9CA3AF] hover:text-white transition-colors"
                      title="Upload Photo"
                    >
                      <Upload className="w-4 h-4" />
                    </button>
                    {photoURL && (
                      <button
                        onClick={handleRemoveImage}
                        className="p-1 text-red-400 hover:text-red-300 transition-colors"
                        title="Remove Photo"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    accept="image/*"
                    className="hidden"
                  />
                </div>

                <div className="space-y-1">
                  <h2 className="text-2xl font-black text-white">{user?.displayName || "Citizen"}</h2>
                  <span className="inline-flex items-center rounded-lg bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/25">
                    Verified Citizen
                  </span>
                </div>

                <p className="text-xs text-[#9AA3B8] font-semibold max-w-sm italic leading-relaxed">
                  {user?.bio || "No profile bio provided yet. Add one in settings!"}
                </p>

                <div className="flex flex-col w-full gap-2 text-xs border-t border-white/5 pt-4 text-left font-semibold text-[#9AA3B8]">
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5" />
                    <span>{user?.email}</span>
                  </div>
                  {user?.locality && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{user.locality}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>
                      Joined {user?.createdAt ? new Date(user.createdAt as any).toLocaleDateString() : "Recently"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Participation Metrics */}
            <div className="bg-[#1E293B] border border-white/5 rounded-3xl p-6 shadow-2xl space-y-4">
              <span className="text-[10px] font-black text-[#9AA3B8] uppercase tracking-wider block">
                Community Participation
              </span>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-emerald-500/5 border border-emerald-500/25 rounded-2xl p-4 text-center">
                  <span className="text-2xl font-black text-emerald-400 block">{participationScore}%</span>
                  <span className="text-[9px] uppercase font-bold tracking-widest text-[#9AA3B8] mt-1.5 block">
                    Participation Score
                  </span>
                </div>
                <div className="bg-purple-500/5 border border-purple-500/25 rounded-2xl p-4 text-center">
                  <span className="text-2xl font-black text-purple-400 block">Top {communityRank}%</span>
                  <span className="text-[9px] uppercase font-bold tracking-widest text-[#9AA3B8] mt-1.5 block">
                    Community Rank
                  </span>
                </div>
              </div>

              {/* Progress to next rank */}
              <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 space-y-2">
                <div className="flex justify-between items-center text-xs font-black">
                  <span className="text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-purple-400" /> LEVEL {gamification.level}
                  </span>
                  <span className="text-purple-300 font-mono">{gamification.reputation} / {gamification.level * 100} XP</span>
                </div>
                <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-purple-500 to-purple-400 h-1.5 rounded-full transition-all duration-700"
                    style={{ width: `${gamification.progressPct}%` }}
                  />
                </div>
                <span className="text-[10px] text-purple-400/80 font-bold block text-right">
                  {gamification.xpToNextLevel} XP to Level Up
                </span>
              </div>
            </div>

            {/* Dynamic Statistics Grid */}
            <div className="bg-[#1E293B] border border-white/5 rounded-3xl p-6 shadow-2xl space-y-4">
              <span className="text-[10px] font-black text-[#9AA3B8] uppercase tracking-wider block">
                Platform Statistics
              </span>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Issues Reported", value: dbStats.reportedCount, icon: Award, color: "text-blue-400" },
                  { label: "Issues Resolved", value: dbStats.resolvedCount, icon: CheckCircle2, color: "text-emerald-400" },
                  { label: "Support Given", value: dbStats.supportCount, icon: Trophy, color: "text-amber-400" },
                  { label: "Community Posts", value: dbStats.postsCount, icon: MessageSquare, color: "text-purple-400" },
                  { label: "Comments Written", value: dbStats.commentsCount, icon: HelpCircle, color: "text-pink-400" },
                  { label: "Events Joined", value: dbStats.eventsCount, icon: Calendar, color: "text-teal-400" },
                  { label: "Volunteer Hours", value: dbStats.volunteerHours, icon: Clock, color: "text-indigo-400" },
                  { label: "Badges Earned", value: unlockedBadges.length, icon: Award, color: "text-yellow-400" }
                ].map((stat) => {
                  const Icon = stat.icon;
                  return (
                    <div key={stat.label} className="bg-white/[0.02] border border-white/5 rounded-2xl p-3 text-center">
                      <Icon className={`w-4 h-4 mx-auto mb-1 ${stat.color}`} />
                      <span className={`block text-lg font-black ${stat.color}`}>{stat.value}</span>
                      <span className="block text-[8px] uppercase tracking-widest font-black text-[#6B7280] leading-none mt-1">
                        {stat.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* ── RIGHT COLUMN ─────────────────────────────────────────────────── */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Badges Collection */}
            <div className="bg-[#1E293B] border border-white/5 rounded-3xl p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-[#9AA3B8] uppercase tracking-wider block">
                  Earned Badges Collection
                </span>
                <span className="text-[10px] font-bold text-emerald-400">
                  {unlockedBadges.length} / {BADGES_LIST.length} Unlocked
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {BADGES_LIST.map((badge) => {
                  const isUnlocked = badge.check(dbStats, user);
                  return (
                    <div
                      key={badge.id}
                      className={`border rounded-2xl p-3 text-center flex flex-col items-center justify-center space-y-1.5 transition-all ${
                        isUnlocked
                          ? "bg-gradient-to-br from-amber-500/10 to-yellow-500/10 border-amber-500/25 text-amber-400 shadow-md"
                          : "bg-white/[0.01] border-white/5 text-[#9AA3B8] opacity-35"
                      }`}
                    >
                      <span className="text-2xl">{badge.icon}</span>
                      <span className="text-[11px] font-black block leading-none">{badge.name}</span>
                      <span className="text-[9px] leading-snug block text-[#9AA3B8] font-semibold">{badge.desc}</span>
                    </div>
                  );
                })}
              </div>
              {unlockedBadges.length === 0 && (
                <p className="text-xs text-[#9AA3B8] italic py-2">No badges earned yet.</p>
              )}
            </div>

            {/* My Reports */}
            <div className="bg-[#1E293B] border border-white/5 rounded-3xl p-6 shadow-2xl space-y-4">
              <span className="text-[10px] font-black text-[#9AA3B8] uppercase tracking-wider block">
                My Reported Issues
              </span>

              <div className="space-y-3">
                {userIssues.map((issue) => (
                  <div
                    key={issue.id}
                    onClick={() => navigate(`/issues/${issue.id}`)}
                    className="flex items-center justify-between bg-white/[0.02] border border-white/5 rounded-2xl p-4 hover:bg-white/[0.04] transition-all cursor-pointer group"
                  >
                    <div className="min-w-0 flex-1 pr-4">
                      <span className="block text-sm font-bold text-white truncate group-hover:text-[#16A34A] transition-colors">
                        {issue.title}
                      </span>
                      <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-wider ${
                          issue.status === "resolved"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : issue.status === "rejected"
                            ? "bg-red-500/10 text-red-400 border border-red-500/20"
                            : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                        }`}>
                          {typeof issue.status === "string" ? issue.status.replace("_", " ") : "submitted"}
                        </span>
                        
                        <span className="text-[10px] text-[#6B7280] font-bold">
                          Priority {typeof issue.priority === "object" && issue.priority !== null ? (issue.priority.label || issue.priority.level || "0") : (issue.priority ?? "0")}
                        </span>

                        <span className="text-[10px] text-[#6B7280] font-bold">
                          {issue.createdAt ? (
                            issue.createdAt.toDate 
                              ? issue.createdAt.toDate().toLocaleDateString() 
                              : (issue.createdAt.seconds 
                                  ? new Date(issue.createdAt.seconds * 1000).toLocaleDateString() 
                                  : new Date(issue.createdAt).toLocaleDateString())
                          ) : ""}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#9CA3AF] bg-white/5 border border-white/5 px-2 py-1 rounded-lg">
                        👍 {issue.supportCount || 0}
                      </span>
                      <ChevronRight className="w-4 h-4 text-[#6B7280] group-hover:text-white transition-colors" />
                    </div>
                  </div>
                ))}
                {userIssues.length === 0 && (
                  <div className="py-8 text-center bg-white/[0.01] border border-white/5 rounded-2xl">
                    <p className="text-xs text-[#9CA3AF] italic">You haven't reported any issues.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Participation Warning if low activity */}
            {rawScore === 0 && (
              <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4 text-xs font-semibold text-amber-400">
                Join discussions and events to build your community profile.
              </div>
            )}

          </div>

        </div>
      )}

      {/* ── SETTINGS TAB ────────────────────────────────────────────────────── */}
      {activeTab === "settings" && (
        <div className="bg-[#1E293B] border border-white/5 rounded-3xl p-6 shadow-2xl space-y-6 max-w-2xl">
          <div className="space-y-1 border-b border-white/5 pb-4">
            <h3 className="text-lg font-black text-white uppercase tracking-wider">Account Settings & Preferences</h3>
            <p className="text-xs text-[#9CA3AF]">Update your profile metadata, alert methods, and platform options.</p>
          </div>

          <div className="space-y-4">
            
            {/* General details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-black uppercase text-[#9AA3B8]">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#0F172A] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black uppercase text-[#9AA3B8]">Locality / Ward</label>
                <input
                  type="text"
                  value={locality}
                  onChange={(e) => setLocality(e.target.value)}
                  placeholder="e.g. Bistupur, Jamshedpur"
                  className="w-full bg-[#0F172A] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black uppercase text-[#9AA3B8]">Phone Number</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +91 98765 43210"
                  className="w-full bg-[#0F172A] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black uppercase text-[#9AA3B8]">Emergency Contact</label>
                <input
                  type="text"
                  value={emergencyContact}
                  onChange={(e) => setEmergencyContact(e.target.value)}
                  placeholder="e.g. +91 99999 88888"
                  className="w-full bg-[#0F172A] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-black uppercase text-[#9AA3B8]">Short Bio</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Write a few lines about your civic participation interests..."
                rows={3}
                className="w-full bg-[#0F172A] border border-white/10 rounded-xl p-3.5 text-sm font-semibold text-white focus:outline-none focus:border-emerald-500 resize-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-black uppercase text-[#9AA3B8]">Address</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="123 Main St, Area, City"
                className="w-full bg-[#0F172A] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Notification Preferences */}
            <div className="space-y-3 pt-3 border-t border-white/5">
              <span className="text-xs font-black uppercase tracking-wider text-[#9AA3B8] flex items-center gap-1.5">
                <Bell className="w-4 h-4 text-[#16A34A]" /> Alert Preferences
              </span>
              
              <div className="space-y-2 pl-5.5">
                {[
                  { label: "Verification Requests", desc: "Notify me when community verifies issues nearby", checked: notifVerification, set: setNotifVerification },
                  { label: "Status Updates", desc: "Get notifications when my reported issues change status", checked: notifStatus, set: setNotifStatus },
                  { label: "Weekly Digest", desc: "Send summary emails of platform milestones weekly", checked: notifWeekly, set: setNotifWeekly }
                ].map((pref, i) => (
                  <label key={i} className="flex items-start gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={pref.checked}
                      onChange={(e) => pref.set(e.target.checked)}
                      className="mt-1 accent-[#16A34A] rounded"
                    />
                    <div>
                      <span className="block text-xs font-bold text-white">{pref.label}</span>
                      <span className="block text-[10px] text-[#9CA3AF] mt-0.5">{pref.desc}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Privacy Preferences */}
            <div className="space-y-3 pt-3 border-t border-white/5">
              <span className="text-xs font-black uppercase tracking-wider text-[#9AA3B8] flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-[#16A34A]" /> Privacy Controls
              </span>
              
              <div className="space-y-2 pl-5.5">
                {[
                  { label: "Public Profile", desc: "Allow other citizens to view my badges and reported issues", checked: publicProfile, set: setPublicProfile },
                  { label: "Anonymous Reporting by default", desc: "Keep my name hidden from public issue maps by default", checked: anonymousDefault, set: setAnonymousDefault }
                ].map((pref, i) => (
                  <label key={i} className="flex items-start gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={pref.checked}
                      onChange={(e) => pref.set(e.target.checked)}
                      className="mt-1 accent-[#16A34A] rounded"
                    />
                    <div>
                      <span className="block text-xs font-bold text-white">{pref.label}</span>
                      <span className="block text-[10px] text-[#9CA3AF] mt-0.5">{pref.desc}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

          </div>

          <div className="flex gap-3 pt-4 border-t border-white/5">
            <Button
              onClick={handleSaveSettings}
              disabled={saving}
              className="flex-1 bg-[#16A34A] hover:bg-[#15803D] text-white font-bold"
            >
              {saving ? "Saving Changes..." : "Save Settings"}
            </Button>
            <Button
              variant="outline"
              onClick={() => setActiveTab("profile")}
              className="border-white/10 text-white hover:bg-white/5"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* ── HISTORY / TIMELINE TAB ────────────────────────────────────────── */}
      {activeTab === "activity" && (
        <div className="bg-[#1E293B] border border-white/5 rounded-3xl p-6 shadow-2xl space-y-6 max-w-2xl">
          <div className="space-y-1 border-b border-white/5 pb-4">
            <h3 className="text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-400 animate-pulse" /> My Civic Activity History
            </h3>
            <p className="text-xs text-[#9CA3AF]">A chronological log of all your contributions to the community.</p>
          </div>

          <div className="space-y-5 relative pl-4 border-l border-white/5 ml-2.5 pt-2">
            {activityTimeline.map((act, idx) => (
              <div key={idx} className="relative space-y-1">
                <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-[#1E293B]" />
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-black text-white">{act.title}</span>
                  <span className="text-[10px] text-[#6B7280] font-bold font-mono">
                    {act.date.toLocaleDateString()}
                  </span>
                </div>
                <p className="text-[11px] text-[#9CA3AF] font-medium leading-relaxed">{act.desc}</p>
              </div>
            ))}

            {activityTimeline.length === 0 && (
              <div className="text-center py-6">
                <p className="text-xs text-[#9CA3AF] italic">No activity recorded yet.</p>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default ProfilePage;
