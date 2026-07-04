import React, { useState, useEffect } from "react";
import { useAuthStore } from "../../stores/authStore";
import { db } from "../../config/firebase";
import { collection, query, getDocs, doc, updateDoc, deleteDoc, where, limit, orderBy } from "firebase/firestore";
import { 
  ShieldAlert, EyeOff, CheckCircle2, MessageSquare, Trash2, 
  UserMinus, AlertTriangle, BarChart3, Users, Ban 
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { useNotificationStore } from "../../stores/notificationStore";

interface FlaggedPost {
  id: string;
  title: string;
  content: string;
  authorName: string;
  authorId: string;
  reportedCount: number;
}

interface UserDetail {
  uid: string;
  displayName: string;
  email: string;
  role: string;
  reputation: number;
  isSuspended?: boolean;
  warningCount?: number;
}

export const ModeratorDashboardPage: React.FC = () => {
  const { user } = useAuthStore();
  const { addNotification } = useNotificationStore();
  const [activeTab, setActiveTab] = useState<"flagged" | "spam" | "users" | "stats">("flagged");
  
  // States
  const [flaggedPosts, setFlaggedPosts] = useState<FlaggedPost[]>([]);
  const [spamIssues, setSpamIssues] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<UserDetail[]>([]);
  const [loading, setLoading] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    totalPosts: 14,
    totalFlagged: 0,
    activeCitizens: 38,
    spamFiltered: 6
  });

  const isModeratorOrAdmin = user?.role === "admin" || user?.role === "moderator" || user?.role === "official";

  const fetchFlaggedPosts = async () => {
    setLoading(true);
    try {
      // Query reported discussions
      const q = query(collection(db, "discussions"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      const list = snap.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((d: any) => d.likes < -2 || d.replies?.some((r: any) => r.content.includes("spam")) || d.reported === true) as any[];
      
      // Seed dummy if empty for layout visual
      if (list.length === 0) {
        setFlaggedPosts([
          {
            id: "flag_post_1",
            title: "Fake reports about water shutdown",
            content: "There is no water supply on Wednesday. DO NOT trust the municipal officials they are lying.",
            authorName: "Rohan D.",
            authorId: "rohan_uid",
            reportedCount: 3
          },
          {
            id: "flag_post_2",
            title: "Sell crypto currency Pune resident",
            content: "Earn 50000 INR per day doing nothing link in bio check crypto today!!!",
            authorName: "Spammer Bot",
            authorId: "spam_bot_uid",
            reportedCount: 5
          }
        ]);
        setStats(prev => ({ ...prev, totalFlagged: 2 }));
      } else {
        setFlaggedPosts(list);
        setStats(prev => ({ ...prev, totalFlagged: list.length }));
      }
    } catch (err) {
      console.error("Failed to load flagged posts:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSpamIssues = async () => {
    try {
      const q = query(collection(db, "issues"), where("status", "==", "duplicate"), limit(10));
      const snap = await getDocs(q);
      const list = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setSpamIssues(list);
      setStats(prev => ({ ...prev, spamFiltered: list.length || 6 }));
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUsers = async () => {
    try {
      const q = query(collection(db, "users"), limit(15));
      const snap = await getDocs(q);
      let list = snap.docs.map((doc) => doc.data()) as UserDetail[];
      if (list.length <= 1) {
        list = [
          { uid: "uid_1", displayName: "Rohan D.", email: "rohan@gmail.com", role: "citizen", reputation: 40, warningCount: 1 },
          { uid: "uid_2", displayName: "Spammer Bot", email: "spam@gmail.com", role: "citizen", reputation: 0, warningCount: 3, isSuspended: true }
        ];
      }
      setUsersList(list);
      setStats(prev => ({ ...prev, activeCitizens: list.length }));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (!isModeratorOrAdmin) return;
    if (activeTab === "flagged") {
      fetchFlaggedPosts();
    } else if (activeTab === "spam") {
      fetchSpamIssues();
    } else if (activeTab === "users") {
      fetchUsers();
    }
  }, [activeTab]);

  // Actions
  const handleApprovePost = async (postId: string) => {
    try {
      if (postId.startsWith("flag_")) {
        setFlaggedPosts((prev) => prev.filter((d) => d.id !== postId));
      } else {
        await updateDoc(doc(db, "discussions", postId), { reported: false, reportedCount: 0 });
        setFlaggedPosts((prev) => prev.filter((d) => d.id !== postId));
      }
      addNotification({
        type: "success",
        title: "Content Approved",
        message: "The reported post has been approved and cleared."
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeletePost = async (postId: string) => {
    try {
      if (postId.startsWith("flag_")) {
        setFlaggedPosts((prev) => prev.filter((d) => d.id !== postId));
      } else {
        await deleteDoc(doc(db, "discussions", postId));
        setFlaggedPosts((prev) => prev.filter((d) => d.id !== postId));
      }
      addNotification({
        type: "warning",
        title: "Content Removed",
        message: "The flagged content has been permanently deleted from discussions."
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleWarnUser = async (userId: string, currentWarnings = 0) => {
    try {
      const userRef = doc(db, "users", userId);
      const nextCount = (currentWarnings || 0) + 1;
      await updateDoc(userRef, { warningCount: nextCount });
      setUsersList((prev) =>
        prev.map((u) => (u.uid === userId ? { ...u, warningCount: nextCount } : u))
      );
      addNotification({
        type: "warning",
        title: "User Warned",
        message: `Official moderator warning sent to user. Total warnings: ${nextCount}.`
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleSuspend = async (userId: string, isSuspended: boolean) => {
    try {
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, { isSuspended: !isSuspended });
      setUsersList((prev) =>
        prev.map((u) => (u.uid === userId ? { ...u, isSuspended: !isSuspended } : u))
      );
      addNotification({
        type: "error",
        title: isSuspended ? "Suspension Lifted" : "User Suspended",
        message: isSuspended ? "User access has been restored." : "User has been temporarily suspended."
      });
    } catch (err) {
      console.error(err);
    }
  };

  if (!isModeratorOrAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
        <ShieldAlert className="w-12 h-12 text-red-500 mb-3" />
        <h3 className="font-bold text-white text-lg">Access Denied</h3>
        <p className="text-xs text-[#9AA3B8] mt-1 max-w-sm">
          You do not have moderator credentials. Please return to the official workspace dashboard.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-28 text-left">
      {/* Heading */}
      <div>
        <div className="flex items-center gap-1.5 mb-1">
          <ShieldAlert className="w-4 h-4 text-emerald-500" />
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-500">Moderator Console</span>
        </div>
        <h1 className="text-3xl font-black text-white tracking-tight">Community Moderation</h1>
        <p className="text-xs text-[#9AA3B8]">
          Review reported discussions, duplicate spam, and manage community access suspensions.
        </p>
      </div>

      {/* Tabs Menu */}
      <div className="flex bg-white/5 border border-white/5 p-1 rounded-2xl gap-1">
        {[
          { id: "flagged", label: "Flagged Content", icon: AlertTriangle },
          { id: "spam", label: "AI Spam Queue", icon: EyeOff },
          { id: "users", label: "User Access", icon: UserMinus },
          { id: "stats", label: "Moderator Statistics", icon: BarChart3 }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === tab.id
                  ? "bg-[#16A34A] text-white shadow-lg"
                  : "text-[#9AA3B8] hover:bg-white/5 hover:text-white"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ──────────────────────────────────────────────────────── */}
      {/* TAB 1: FLAGGED CONTENT */}
      {/* ──────────────────────────────────────────────────────── */}
      {activeTab === "flagged" && (
        <div className="space-y-4">
          <span className="text-[10px] font-black text-[#9AA3B8] uppercase tracking-wider block">Reported Discussion Items</span>
          {loading ? (
            <div className="text-center py-12 text-[#9AA3B8] font-bold">Querying reports...</div>
          ) : flaggedPosts.length === 0 ? (
            <div className="bg-[#1E293B] border border-white/5 rounded-2xl p-8 text-center">
              <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-500" />
              <span className="block text-xs font-bold text-white">All Flagged Posts Resolved</span>
              <p className="text-[11px] text-[#9AA3B8] mt-0.5">Discussions feed is clean.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {flaggedPosts.map((post) => (
                <div key={post.id} className="bg-[#1E293B] border border-white/5 rounded-2xl p-4.5 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-bold text-[#6B7280]">Author: {post.authorName} (UID: {post.authorId.slice(0,6)})</span>
                      <h4 className="text-sm font-bold text-white mt-1 leading-tight">{post.title}</h4>
                    </div>
                    <span className="text-[10px] font-bold text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full uppercase leading-none">
                      {post.reportedCount} Reports
                    </span>
                  </div>
                  <p className="text-xs text-[#9AA3B8] font-medium bg-[#0F172A] p-3 rounded-xl border border-white/5 leading-relaxed">
                    {post.content}
                  </p>
                  <div className="flex gap-2">
                    <Button onClick={() => handleApprovePost(post.id)} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs">
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Approve &amp; Keep
                    </Button>
                    <Button onClick={() => handleDeletePost(post.id)} className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold text-xs">
                      <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete Content
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ──────────────────────────────────────────────────────── */}
      {/* TAB 2: AI SPAM QUEUE */}
      {/* ──────────────────────────────────────────────────────── */}
      {activeTab === "spam" && (
        <div className="space-y-4">
          <span className="text-[10px] font-black text-[#9AA3B8] uppercase tracking-wider block">AI Flagged Duplicate Incidents</span>
          {spamIssues.length === 0 ? (
            <div className="bg-[#1E293B] border border-white/5 rounded-2xl p-8 text-center">
              <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-500" />
              <span className="block text-xs font-bold text-white">AI Spam Queue Clean</span>
              <p className="text-[11px] text-[#9AA3B8] mt-0.5">No duplicate incidents pending verification.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {spamIssues.map((issue) => (
                <div key={issue.id} className="bg-[#1E293B] border border-white/5 rounded-2xl p-4.5 flex justify-between items-center">
                  <div>
                    <span className="text-[9px] font-mono text-[#6B7280]">INCIDENT ID: #{issue.id}</span>
                    <h4 className="text-xs font-bold text-white mt-0.5">{issue.aiAnalysis?.subcategory || "Civic Incident"}</h4>
                    <span className="text-[10px] text-[#9AA3B8] font-semibold mt-1 block">Ward: {issue.location?.ward}</span>
                  </div>
                  <Button onClick={() => handleDeletePost(issue.id)} className="bg-red-600/10 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/20 text-xs font-bold">
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ──────────────────────────────────────────────────────── */}
      {/* TAB 3: USER ACCESS */}
      {/* ──────────────────────────────────────────────────────── */}
      {activeTab === "users" && (
        <div className="space-y-4">
          <span className="text-[10px] font-black text-[#9AA3B8] uppercase tracking-wider block">Community Members Status</span>
          <div className="bg-[#1E293B] border border-white/5 rounded-2xl overflow-hidden shadow-lg">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/5 text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">
                  <th className="p-4">User</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Warnings</th>
                  <th className="p-4">Suspension</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs text-[#9AA3B8]">
                {usersList.map((usr) => (
                  <tr key={usr.uid} className="hover:bg-white/[0.01]">
                    <td className="p-4 font-bold text-white">{usr.displayName}</td>
                    <td className="p-4 font-mono">{usr.email}</td>
                    <td className="p-4 font-bold text-orange-400">{usr.warningCount || 0} Warns</td>
                    <td className="p-4 font-bold">
                      {usr.isSuspended ? (
                        <span className="text-red-400">Suspended</span>
                      ) : (
                        <span className="text-emerald-400">Active</span>
                      )}
                    </td>
                    <td className="p-4 text-right flex justify-end gap-2">
                      <Button onClick={() => handleWarnUser(usr.uid, usr.warningCount)} className="bg-orange-500/10 hover:bg-orange-500 border border-orange-500/20 text-orange-400 hover:text-white text-[10px] font-bold py-1 px-2.5 h-auto">
                        <AlertTriangle className="w-3 h-3 mr-1" /> Warn
                      </Button>
                      <Button onClick={() => handleToggleSuspend(usr.uid, !!usr.isSuspended)} className={`text-[10px] font-bold py-1 px-2.5 h-auto ${
                        usr.isSuspended ? "bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-white border border-emerald-500/20" : "bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/20"
                      }`}>
                        <Ban className="w-3 h-3 mr-1" /> {usr.isSuspended ? "Restore" : "Suspend"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────── */}
      {/* TAB 4: STATISTICS */}
      {/* ──────────────────────────────────────────────────────── */}
      {activeTab === "stats" && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Community Threads", value: stats.totalPosts, icon: MessageSquare, color: "text-blue-400" },
            { label: "Pending Flags", value: stats.totalFlagged, icon: AlertTriangle, color: "text-red-400" },
            { label: "Active Citizens", value: stats.activeCitizens, icon: Users, color: "text-emerald-400" },
            { label: "AI Spam Blocked", value: stats.spamFiltered, icon: Ban, color: "text-purple-400" }
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="bg-[#1E293B] border border-white/5 rounded-2xl p-5 shadow-lg text-center">
                <Icon className={`w-6 h-6 mx-auto mb-2.5 ${stat.color}`} />
                <div className="text-3xl font-black text-white leading-none">{stat.value}</div>
                <span className="text-[10px] font-black text-[#6B7280] uppercase tracking-wider block mt-2">{stat.label}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ModeratorDashboardPage;
