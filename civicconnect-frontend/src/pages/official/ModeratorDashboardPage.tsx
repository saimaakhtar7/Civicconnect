import React, { useState, useEffect } from "react";
import { useAuthStore } from "../../stores/authStore";
import { useNotificationStore } from "../../stores/notificationStore";
import { db } from "../../config/firebase";
import { 
  collection, query, getDocs, doc, updateDoc, deleteDoc, 
  where, limit, orderBy, runTransaction, Timestamp 
} from "firebase/firestore";
import { 
  ShieldAlert, EyeOff, CheckCircle2, MessageSquare, Trash2, 
  AlertTriangle, BarChart3, Users, Ban, Lock, Unlock, Pin, ShieldCheck,
  FileText, History, Clock, FileWarning, HelpCircle, Check, XCircle
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { moderatorService, ContentReport, ModerationLog } from "../../services/moderatorService";

export const ModeratorDashboardPage: React.FC = () => {
  const { user: currentUser } = useAuthStore();
  const { addNotification } = useNotificationStore();

  const [activeTab, setActiveTab] = useState<"flagged" | "verify" | "logs" | "stats">("flagged");
  
  // Data lists
  const [flaggedPosts, setFlaggedPosts] = useState<any[]>([]);
  const [verificationQueue, setVerificationQueue] = useState<any[]>([]);
  const [modLogs, setModLogs] = useState<ModerationLog[]>([]);
  const [loading, setLoading] = useState(false);

  // Stats counters
  const [stats, setStats] = useState({
    pendingFlags: 0,
    pendingVerifications: 0,
    verifiedToday: 4,
    spamBlocked: 12
  });

  // Modal / Input action state
  const [actionModal, setActionModal] = useState<{
    show: boolean;
    type: "delete" | "lock" | "pin" | "verify" | "reject" | "suspicious" | "duplicate";
    targetItem: any | null;
    reason: string;
    duplicateOfId?: string;
  }>({
    show: false,
    type: "delete",
    targetItem: null,
    reason: ""
  });

  const isModeratorOrAdmin = currentUser?.role === "admin" || currentUser?.role === "moderator";

  const fetchFlaggedContent = async () => {
    setLoading(true);
    try {
      const data = await moderatorService.getFlaggedContent();
      // Remove soft-deleted ones from standard view
      const activeFlagged = data.filter((d: any) => !d.isSoftDeleted);
      setFlaggedPosts(activeFlagged);
      setStats(prev => ({ ...prev, pendingFlags: activeFlagged.length }));
    } catch (err) {
      console.error("Failed to load flagged content:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchVerificationQueue = async () => {
    setLoading(true);
    try {
      const data = await moderatorService.getVerificationQueue();
      // Prioritize: sort suspicious first, then age (oldest first)
      const sortedQueue = data.sort((a, b) => {
        if (a.verificationStatus === "suspicious" && b.verificationStatus !== "suspicious") return -1;
        if (a.verificationStatus !== "suspicious" && b.verificationStatus === "suspicious") return 1;
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });
      setVerificationQueue(sortedQueue);
      setStats(prev => ({ ...prev, pendingVerifications: sortedQueue.length }));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await moderatorService.getModerationLogs(15);
      setModLogs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isModeratorOrAdmin) return;
    if (activeTab === "flagged") {
      fetchFlaggedContent();
    } else if (activeTab === "verify") {
      fetchVerificationQueue();
    } else if (activeTab === "logs") {
      fetchLogs();
    }
  }, [activeTab]);

  // Handler executor
  const handleExecuteAction = async () => {
    const { type, targetItem, reason, duplicateOfId } = actionModal;
    if (!targetItem || !currentUser) return;

    try {
      if (type === "delete") {
        await moderatorService.softDeleteDiscussion(targetItem.id, reason, currentUser.uid, currentUser.role);
        addNotification({
          type: "warning",
          title: "Content Removed",
          message: "Discussion soft-deleted and logged in history."
        });
        fetchFlaggedContent();
      } else if (type === "lock") {
        const nextLock = !targetItem.isLocked;
        await moderatorService.lockDiscussion(targetItem.id, nextLock, reason, currentUser.uid, currentUser.role);
        addNotification({
          type: "success",
          title: nextLock ? "Thread Locked" : "Thread Unlocked",
          message: `Discussion has been ${nextLock ? "locked" : "unlocked"} for replies.`
        });
        fetchFlaggedContent();
      } else if (type === "pin") {
        const nextPin = !targetItem.isPinned;
        await moderatorService.pinDiscussion(targetItem.id, nextPin, reason, currentUser.uid, currentUser.role);
        addNotification({
          type: "success",
          title: nextPin ? "Thread Pinned" : "Thread Unpinned",
          message: `Discussion pinned status updated.`
        });
        fetchFlaggedContent();
      } else if (type === "verify") {
        await moderatorService.verifyIssue(targetItem.id, reason, currentUser.uid, currentUser.role);
        addNotification({
          type: "success",
          title: "Issue Verified",
          message: "Civic incident has been approved and moved to Department queue."
        });
        fetchVerificationQueue();
      } else if (type === "reject") {
        await moderatorService.rejectIssue(targetItem.id, reason, currentUser.uid, currentUser.role);
        addNotification({
          type: "warning",
          title: "Issue Rejected",
          message: "Incident has been rejected as illegitimate / spam."
        });
        fetchVerificationQueue();
      } else if (type === "suspicious") {
        await moderatorService.requestEvidence(targetItem.id, reason, currentUser.uid, currentUser.role);
        addNotification({
          type: "warning",
          title: "Evidence Requested",
          message: "Flagged as suspicious. Request sent to citizen."
        });
        fetchVerificationQueue();
      } else if (type === "duplicate" && duplicateOfId) {
        await moderatorService.markDuplicate(targetItem.id, duplicateOfId, reason, currentUser.uid, currentUser.role);
        addNotification({
          type: "success",
          title: "Duplicate Mapped",
          message: `Incident marked duplicate of #${duplicateOfId}.`
        });
        fetchVerificationQueue();
      }
    } catch (err: any) {
      console.error(err);
      addNotification({
        type: "error",
        title: "Action Failed",
        message: err.message || "Failed to submit moderator operation."
      });
    } finally {
      setActionModal({ show: false, type: "delete", targetItem: null, reason: "" });
    }
  };

  if (!isModeratorOrAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
        <ShieldAlert className="w-12 h-12 text-red-500 mb-3 animate-pulse" />
        <h3 className="font-bold text-white text-lg">Access Denied</h3>
        <p className="text-xs text-[#9AA3B8] mt-1 max-w-sm">
          You do not have moderator credentials. Please return to the official workspace dashboard.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-28 text-left relative">
      {/* Heading */}
      <div>
        <div className="flex items-center gap-1.5 mb-1">
          <ShieldAlert className="w-4 h-4 text-emerald-500" />
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-500">Moderator Console</span>
        </div>
        <h1 className="text-3xl font-black text-white tracking-tight">Community Moderation</h1>
        <p className="text-xs text-[#9AA3B8]">
          Review reported discussions, moderate content flags, verify incoming reports, and track safety logs.
        </p>
      </div>

      {/* Tabs Menu */}
      <div className="flex bg-white/5 border border-white/5 p-1 rounded-2xl gap-1">
        {[
          { id: "flagged", label: "Flagged Content", icon: AlertTriangle },
          { id: "verify", label: "Verification Queue", icon: ShieldCheck },
          { id: "logs", label: "Moderation Logs", icon: History },
          { id: "stats", label: "System Statistics", icon: BarChart3 }
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
          <span className="text-[10px] font-black text-[#9AA3B8] uppercase tracking-wider block">Reported Discussions Queue</span>
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
                <div key={post.id} className="bg-[#1E293B] border border-white/5 rounded-2xl p-5 space-y-3 relative">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <span className="text-[10px] font-bold text-[#6B7280]">Author: {post.authorName}</span>
                      <h4 className="text-sm font-bold text-white mt-1 leading-tight">{post.title}</h4>
                    </div>
                    <span className="text-[10px] font-black text-red-400 bg-red-500/10 border border-red-500/20 px-2.5 py-0.5 rounded-full uppercase leading-none shrink-0">
                      {post.reportedCount || 1} Reports
                    </span>
                  </div>
                  <p className="text-xs text-[#9AA3B8] font-medium bg-[#0F172A] p-3.5 rounded-xl border border-white/5 leading-relaxed">
                    {post.content}
                  </p>
                  
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      onClick={() => setActionModal({ show: true, type: "lock", targetItem: post, reason: "" })}
                      className="bg-[#1A2332] text-white text-[11px] font-bold hover:bg-white/5 border border-white/5"
                    >
                      {post.isLocked ? <Unlock className="w-3.5 h-3.5 mr-1" /> : <Lock className="w-3.5 h-3.5 mr-1" />}
                      {post.isLocked ? "Unlock Replies" : "Lock Thread"}
                    </Button>
                    <Button
                      onClick={() => setActionModal({ show: true, type: "pin", targetItem: post, reason: "" })}
                      className="bg-[#1A2332] text-white text-[11px] font-bold hover:bg-white/5 border border-white/5"
                    >
                      <Pin className="w-3.5 h-3.5 mr-1" />
                      {post.isPinned ? "Unpin Post" : "Pin Post"}
                    </Button>
                    <Button
                      onClick={() => setActionModal({ show: true, type: "delete", targetItem: post, reason: "" })}
                      className="bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold ml-auto"
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete Thread
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ──────────────────────────────────────────────────────── */}
      {/* TAB 2: VERIFICATION QUEUE */}
      {/* ──────────────────────────────────────────────────────── */}
      {activeTab === "verify" && (
        <div className="space-y-4">
          <span className="text-[10px] font-black text-[#9AA3B8] uppercase tracking-wider block">Civic Incident Verification</span>
          {loading ? (
            <div className="text-center py-12 text-[#9AA3B8] font-bold">Querying incidents...</div>
          ) : verificationQueue.length === 0 ? (
            <div className="bg-[#1E293B] border border-white/5 rounded-2xl p-8 text-center">
              <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-500" />
              <span className="block text-xs font-bold text-white">Verification Queue Clean</span>
              <p className="text-[11px] text-[#9AA3B8] mt-0.5">No reported incidents waiting for moderator verification.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {verificationQueue.map((issue) => (
                <div key={issue.id} className="bg-[#1E293B] border border-white/5 rounded-2xl p-5 space-y-3.5">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <span className="text-[9px] font-mono text-[#6B7280] uppercase font-bold block">Incident ID: #{issue.id}</span>
                      <h4 className="text-sm font-bold text-white mt-1">{issue.aiAnalysis?.subcategory || issue.category || "Reported Incident"}</h4>
                      <span className="inline-block text-[10px] text-[#9AA3B8] font-bold bg-[#0F172A] border border-white/5 px-2.5 py-0.5 rounded mt-1">
                        Ward: {issue.location?.ward || "Pune Central"}
                      </span>
                    </div>

                    <div className="flex gap-1.5">
                      {issue.verificationStatus === "suspicious" && (
                        <span className="text-[9px] font-black text-orange-400 bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded uppercase shrink-0">
                          Suspicious
                        </span>
                      )}
                      <span className="text-[9px] font-black text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded uppercase shrink-0">
                        {issue.priority?.level === 4 ? "Critical Priority" : "Standard Priority"}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-[#9AA3B8] font-medium bg-[#0F172A] p-3.5 rounded-xl border border-white/5 leading-relaxed">
                    {issue.aiSummary || issue.description || "No description provided."}
                  </p>

                  <div className="flex gap-2 flex-wrap pt-1.5 border-t border-white/5">
                    <Button
                      onClick={() => setActionModal({ show: true, type: "verify", targetItem: issue, reason: "" })}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold flex-1"
                    >
                      <Check className="w-3.5 h-3.5 mr-1" /> Approve / Verify
                    </Button>
                    <Button
                      onClick={() => setActionModal({ show: true, type: "reject", targetItem: issue, reason: "" })}
                      className="bg-red-600/10 hover:bg-red-600 border border-red-500/20 text-red-400 hover:text-white text-[11px] font-bold flex-1"
                    >
                      <XCircle className="w-3.5 h-3.5 mr-1" /> Reject Report
                    </Button>
                    <Button
                      onClick={() => setActionModal({ show: true, type: "suspicious", targetItem: issue, reason: "" })}
                      className="bg-orange-500/10 hover:bg-orange-500 border border-orange-500/20 text-orange-400 hover:text-white text-[11px] font-bold flex-1"
                    >
                      <FileWarning className="w-3.5 h-3.5 mr-1" /> Flag Suspicious
                    </Button>
                    <Button
                      onClick={() => setActionModal({ show: true, type: "duplicate", targetItem: issue, reason: "", duplicateOfId: "" })}
                      className="bg-[#1A2332] hover:bg-white/5 border border-white/5 text-white text-[11px] font-bold flex-1"
                    >
                      <HelpCircle className="w-3.5 h-3.5 mr-1" /> Link Duplicate
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ──────────────────────────────────────────────────────── */}
      {/* TAB 3: MODERATION HISTORY */}
      {/* ──────────────────────────────────────────────────────── */}
      {activeTab === "logs" && (
        <div className="space-y-4">
          <span className="text-[10px] font-black text-[#9AA3B8] uppercase tracking-wider block">Moderation Event Stream</span>
          {loading ? (
            <div className="text-center py-12 text-[#9AA3B8] font-bold">Querying audit logs...</div>
          ) : modLogs.length === 0 ? (
            <div className="bg-[#1E293B] border border-white/5 rounded-2xl p-12 text-center text-[#9AA3B8] font-bold">
              No moderation events logged.
            </div>
          ) : (
            <div className="bg-[#1E293B] border border-white/5 rounded-2xl overflow-hidden shadow-lg">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white/5 text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">
                    <th className="p-4">Timestamp</th>
                    <th className="p-4">Moderator</th>
                    <th className="p-4">Action</th>
                    <th className="p-4">Target Type</th>
                    <th className="p-4 font-mono">Target ID</th>
                    <th className="p-4 text-right">Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-xs text-[#9AA3B8]">
                  {modLogs.map((log, idx) => {
                    const date = log.timestamp?.toDate ? log.timestamp.toDate() : new Date(log.timestamp);
                    const formattedDate = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + " · " + date.toLocaleDateString();

                    return (
                      <tr key={idx} className="hover:bg-white/[0.01]">
                        <td className="p-4 font-bold text-white">{formattedDate}</td>
                        <td className="p-4 font-bold text-white">UID: {log.moderatorId.slice(0, 6)}</td>
                        <td className="p-4 font-bold">
                          <span className="text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded uppercase text-[10px]">
                            {log.action}
                          </span>
                        </td>
                        <td className="p-4 font-bold text-white uppercase text-[10px]">{log.targetType}</td>
                        <td className="p-4 font-mono font-bold text-white">{log.targetId.slice(0, 6)}</td>
                        <td className="p-4 text-right max-w-xs truncate text-[#9AA3B8] font-medium">{log.reason}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ──────────────────────────────────────────────────────── */}
      {/* TAB 4: STATISTICS */}
      {/* ──────────────────────────────────────────────────────── */}
      {activeTab === "stats" && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Unreviewed Flags", value: stats.pendingFlags, icon: AlertTriangle, color: "text-red-400" },
            { label: "Verification Queue", value: stats.pendingVerifications, icon: ShieldCheck, color: "text-orange-400" },
            { label: "Verified Today", value: stats.verifiedToday, icon: CheckCircle2, color: "text-emerald-400" },
            { label: "Duplicate Blocked", value: stats.spamBlocked, icon: EyeOff, color: "text-purple-400" }
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

      {/* Action Dialog Modal */}
      {actionModal.show && actionModal.targetItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-[#111827] border border-white/5 rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-white text-base text-center capitalize">
              Moderator Action: {actionModal.type}
            </h3>

            {actionModal.type === "duplicate" && (
              <div className="space-y-1 text-left">
                <label className="text-[10px] font-black uppercase text-[#6B7280]">Parent Incident ID</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. INC-20260704-0002"
                  onChange={(e) => setActionModal({ ...actionModal, duplicateOfId: e.target.value })}
                  className="w-full bg-[#0F172A] border border-white/5 text-xs text-white p-2.5 rounded-xl focus:outline-none focus:border-emerald-500 font-medium"
                />
              </div>
            )}

            <div className="space-y-1 text-left">
              <label className="text-[10px] font-black uppercase text-[#6B7280]">Justification / Reason</label>
              <textarea
                required
                placeholder="Explain the reason for this action (for audit history log)..."
                value={actionModal.reason}
                onChange={(e) => setActionModal({ ...actionModal, reason: e.target.value })}
                className="w-full bg-[#0F172A] border border-white/5 text-xs text-white p-2.5 rounded-xl focus:outline-none focus:border-emerald-500 h-24"
              />
            </div>

            <div className="flex gap-2.5 pt-2">
              <Button
                onClick={() => setActionModal({ show: false, type: "delete", targetItem: null, reason: "" })}
                className="flex-1 bg-white/5 border border-white/5 text-white text-xs font-bold py-2 rounded-xl hover:bg-white/10"
              >
                Cancel
              </Button>
              <Button
                onClick={handleExecuteAction}
                className="flex-1 bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-bold py-2 rounded-xl"
              >
                Execute
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModeratorDashboardPage;
