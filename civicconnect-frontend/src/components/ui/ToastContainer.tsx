import React, { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNotificationStore, Notification } from "../../stores/notificationStore";
import { CheckCircle2, AlertTriangle, Info, X, Cpu, XCircle } from "lucide-react";

const ICON_MAP = {
  success: {
    Icon: CheckCircle2,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/20",
    bar: "bg-emerald-500",
  },
  info: {
    Icon: Info,
    color: "text-blue-400",
    bg: "bg-blue-500/10 border-blue-500/20",
    bar: "bg-blue-500",
  },
  warning: {
    Icon: AlertTriangle,
    color: "text-amber-400",
    bg: "bg-amber-500/10 border-amber-500/20",
    bar: "bg-amber-500",
  },
  error: {
    Icon: XCircle,
    color: "text-red-400",
    bg: "bg-red-500/10 border-red-500/20",
    bar: "bg-red-500",
  },
  ai: {
    Icon: Cpu,
    color: "text-purple-400",
    bg: "bg-purple-500/10 border-purple-500/20",
    bar: "bg-purple-500",
  },
};

const TOAST_DURATION = 5000;

const ToastItem: React.FC<{ notification: Notification }> = ({ notification }) => {
  const { dismiss } = useNotificationStore();
  const { Icon, color, bg, bar } = ICON_MAP[notification.type];

  useEffect(() => {
    const t = setTimeout(() => dismiss(notification.id), TOAST_DURATION);
    return () => clearTimeout(t);
  }, [notification.id, dismiss]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 48, scale: 0.96 }}
      transition={{ type: "spring", stiffness: 500, damping: 40 }}
      className={`relative flex items-start gap-3 max-w-sm w-full rounded-2xl border backdrop-blur-xl p-4 shadow-2xl overflow-hidden ${bg}`}
    >
      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 h-0.5 w-full bg-white/5">
        <motion.div
          className={`h-full rounded-full ${bar}`}
          initial={{ width: "100%" }}
          animate={{ width: "0%" }}
          transition={{ duration: TOAST_DURATION / 1000, ease: "linear" }}
        />
      </div>

      <div className={`shrink-0 mt-0.5 ${color}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0 space-y-0.5">
        <p className="text-xs font-black text-white leading-snug">{notification.title}</p>
        <p className="text-xs text-[#9AA3B8] leading-relaxed font-medium">{notification.message}</p>
      </div>
      <button
        onClick={() => dismiss(notification.id)}
        className="shrink-0 text-[#9AA3B8] hover:text-white transition-colors p-0.5 rounded cursor-pointer"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </motion.div>
  );
};

export const ToastContainer: React.FC = () => {
  const { notifications } = useNotificationStore();
  const visible = notifications.filter((n) => !n.read).slice(0, 3);

  return (
    <div className="fixed bottom-24 right-4 z-[100] flex flex-col gap-2 items-end pointer-events-none sm:bottom-6 sm:right-6">
      <AnimatePresence mode="popLayout">
        {visible.map((n) => (
          <div key={n.id} className="pointer-events-auto">
            <ToastItem notification={n} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
};
