import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useNotificationStore, Notification } from "../../stores/notificationStore";
import { useAuthStore } from "../../stores/authStore";
import { collection, query, where, onSnapshot, orderBy, limit } from "firebase/firestore";
import { db } from "../../config/firebase";
import { X, Bell, CheckCheck, Trash2, Cpu, AlertCircle, CheckCircle2, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

const CATEGORY_ICONS = {
  success: { Icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
  info: { Icon: Info, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
  warning: { Icon: AlertCircle, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
  error: { Icon: AlertCircle, color: "text-red-400", bg: "bg-red-500/10 border-red-500/20" },
  ai: { Icon: Cpu, color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20" },
};

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ isOpen, onClose }) => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { notifications, addNotification, markRead, markAllRead, dismiss } = useNotificationStore();
  const [filter, setFilter] = React.useState<"all" | "unread" | "ai">("all");

  // Real-time Firestore sync for notifications
  useEffect(() => {
    if (!user) return;

    const issuesRef = collection(db, "issues");
    let q = query(issuesRef, orderBy("updatedAt", "desc"), limit(5));

    if (user.role === "citizen") {
      q = query(
        issuesRef,
        where("reportedBy", "==", user.uid),
        orderBy("updatedAt", "desc"),
        limit(5)
      );
    }

    const unsubscribe = onSnapshot(q, (snap) => {
      snap.docChanges().forEach((change) => {
        if (change.type === "modified") {
          const data = change.doc.data();
          const issueId = change.doc.id;

          const issueTitle = data.aiSummary?.subcategory || data.aiAnalysis?.subcategory || "Civic Issue";
          if (data.status === "resolved") {
            addNotification({
              type: "success",
              title: "Issue Resolved",
              message: `The report "${issueTitle}" has been marked resolved. Please verify.`,
              issueId,
            });
          } else if (data.status === "in_progress") {
            addNotification({
              type: "info",
              title: "Work Started",
              message: `Official response team has begun repairs on "${issueTitle}".`,
              issueId,
            });
          } else if (data.aiSummary != null) {
            addNotification({
              type: "ai",
              title: "AI Deliberation Complete",
              message: `AI Council has compiled official findings for "${issueTitle}".`,
              issueId,
            });
          }
        }
      });
    });

    return () => unsubscribe();
  }, [user, addNotification]);

  const filtered = notifications.filter((n) => {
    if (filter === "unread") return !n.read;
    if (filter === "ai") return n.type === "ai";
    return true;
  });

  const handleItemClick = (n: Notification) => {
    markRead(n.id);
    onClose();
    if (n.issueId) {
      navigate(user?.role === "citizen" ? `/issues/${n.issueId}` : `/dashboard/issues/${n.issueId}`);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 260 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-sm bg-[#0F172A] border-l border-white/5 shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
              <div className="flex items-center gap-2.5">
                <Bell className="w-4 h-4 text-[#9AA3B8]" />
                <h2 className="text-base font-black text-white">Notifications</h2>
                {unreadCount > 0 && (
                  <span className="text-[10px] font-black bg-[#22C55E] text-white px-2 py-0.5 rounded-full leading-none">
                    {unreadCount}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={markAllRead}
                  className="p-2 hover:bg-white/5 rounded-xl text-[#9AA3B8] hover:text-white transition-colors cursor-pointer"
                  title="Mark all read"
                >
                  <CheckCheck className="w-4 h-4" />
                </button>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/5 rounded-xl text-[#9AA3B8] hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex border-b border-white/5 px-4 py-2.5 gap-1.5 bg-white/[0.02]">
              {[
                { id: "all", label: "All" },
                { id: "unread", label: "Unread" },
                { id: "ai", label: "AI Council" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setFilter(tab.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    filter === tab.id
                      ? "bg-[#22C55E] text-white shadow-lg shadow-emerald-500/20"
                      : "text-[#9AA3B8] hover:bg-white/5 hover:text-white"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto divide-y divide-white/5 custom-scrollbar">
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-center p-6">
                  <Bell className="w-8 h-8 mb-3 text-[#9AA3B8]/20" />
                  <p className="text-xs font-black text-white">All caught up!</p>
                  <p className="text-[11px] text-[#9AA3B8] mt-1 font-medium">No matching alerts found.</p>
                </div>
              ) : (
                filtered.map((n) => {
                  const cfg = CATEGORY_ICONS[n.type] || CATEGORY_ICONS.info;
                  const Icon = cfg.Icon;

                  return (
                    <div
                      key={n.id}
                      className={`p-4 transition-colors relative flex items-start gap-3 hover:bg-white/[0.03] cursor-pointer ${
                        !n.read ? "bg-[#22C55E]/[0.03] border-l-2 border-[#22C55E]/30 pl-[14px]" : ""
                      }`}
                      onClick={() => handleItemClick(n)}
                    >
                      <div className={`p-2 rounded-xl shrink-0 border ${cfg.bg}`}>
                        <Icon className={`w-4 h-4 ${cfg.color}`} />
                      </div>
                      <div className="flex-1 min-w-0 pr-6 space-y-0.5">
                        <p className="text-xs font-black text-white leading-snug">{n.title}</p>
                        <p className="text-[11px] text-[#9AA3B8] leading-relaxed font-medium">{n.message}</p>
                        <span className="text-[9px] text-[#9AA3B8]/60 block pt-0.5 font-bold">
                          {new Date(n.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      {!n.read && (
                        <div className="absolute top-4 right-10 w-2 h-2 bg-[#22C55E] rounded-full" />
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          dismiss(n.id);
                        }}
                        className="absolute bottom-3.5 right-4 text-[#9AA3B8]/30 hover:text-red-400 transition-colors p-1 rounded cursor-pointer"
                        title="Dismiss"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default NotificationCenter;
