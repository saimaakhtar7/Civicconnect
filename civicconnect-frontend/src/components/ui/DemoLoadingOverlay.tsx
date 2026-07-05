import React from "react";
import { UserRole } from "../../types/user.types";

const ROLE_CONFIG: Record<UserRole, { label: string; accent: string; bg: string; border: string }> = {
  citizen: {
    label: "Citizen Demo",
    accent: "text-emerald-400",
    bg: "from-emerald-500/20 to-emerald-500/5",
    border: "border-emerald-500/30",
  },
  official: {
    label: "Official Demo",
    accent: "text-blue-400",
    bg: "from-blue-500/20 to-blue-500/5",
    border: "border-blue-500/30",
  },
  moderator: {
    label: "Moderator Demo",
    accent: "text-orange-400",
    bg: "from-orange-500/20 to-orange-500/5",
    border: "border-orange-500/30",
  },
  admin: {
    label: "Administrator Demo",
    accent: "text-violet-400",
    bg: "from-violet-500/20 to-violet-500/5",
    border: "border-violet-500/30",
  },
};

interface DemoLoadingOverlayProps {
  role: UserRole;
  step: string;
  error?: string;
  onRetry?: () => void;
  onDismiss?: () => void;
}

export const DemoLoadingOverlay: React.FC<DemoLoadingOverlayProps> = ({
  role,
  step,
  error,
  onRetry,
  onDismiss,
}) => {
  const cfg = ROLE_CONFIG[role];

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#050D18]/90 backdrop-blur-md">
      {/* Glow orb */}
      <div
        className={`absolute w-[500px] h-[500px] rounded-full blur-[160px] opacity-20 pointer-events-none bg-gradient-to-br ${cfg.bg}`}
      />

      <div
        className={`relative w-full max-w-md mx-4 rounded-2xl border ${cfg.border} bg-[#081220]/95 backdrop-blur-xl p-8 shadow-2xl`}
      >
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-8">
          {/* Animated logo ring */}
          <div className={`relative w-16 h-16 mb-4`}>
            <svg
              className="w-16 h-16 -rotate-90"
              viewBox="0 0 64 64"
            >
              <circle
                cx="32" cy="32" r="28"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-white/5"
              />
              {!error && (
                <circle
                  cx="32" cy="32" r="28"
                  fill="none"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeDasharray="176"
                  strokeDashoffset="44"
                  className={`${cfg.accent} animate-[spin_2s_linear_infinite] origin-center`}
                  style={{ animation: "dash 2s ease-in-out infinite" }}
                />
              )}
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              {error ? (
                <span className="text-2xl">⚠️</span>
              ) : (
                <span className={`text-xl font-black ${cfg.accent}`}>CC</span>
              )}
            </div>
          </div>

          <h2 className="text-xl font-black text-white tracking-tight">
            {error ? "Initialization Failed" : "Preparing Demo Environment"}
          </h2>
          <p className={`text-sm font-semibold mt-1 ${cfg.accent}`}>
            {cfg.label}
          </p>
        </div>

        {/* Progress or Error */}
        {error ? (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-300 leading-relaxed">
              {error}
            </div>
            <div className="flex gap-3">
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm font-bold text-white hover:bg-white/10 transition-all cursor-pointer"
                >
                  Retry
                </button>
              )}
              {onDismiss && (
                <button
                  onClick={onDismiss}
                  className="flex-1 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-sm font-bold text-red-300 hover:bg-red-500/20 transition-all cursor-pointer"
                >
                  Dismiss
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Progress steps display */}
            <div className="rounded-xl bg-white/[0.03] border border-white/5 p-4">
              <div className="flex items-center gap-3">
                <div className={`w-1.5 h-1.5 rounded-full ${cfg.accent.replace("text-", "bg-")} animate-pulse shrink-0`} />
                <p className="text-sm text-[#D1D5DB] font-medium leading-snug">{step}</p>
              </div>
            </div>

            {/* Shimmer bar */}
            <div className="h-1 rounded-full bg-white/5 overflow-hidden">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${cfg.bg} animate-[shimmer_2s_ease-in-out_infinite]`}
                style={{
                  backgroundSize: "200% 100%",
                  animation: "shimmer 2s ease-in-out infinite",
                }}
              />
            </div>

            <p className="text-center text-[11px] text-[#6B7280]">
              This only happens once. Subsequent logins are instant.
            </p>
          </div>
        )}
      </div>

      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes dash {
          0% { stroke-dashoffset: 176; }
          50% { stroke-dashoffset: 44; }
          100% { stroke-dashoffset: 176; }
        }
      `}</style>
    </div>
  );
};
