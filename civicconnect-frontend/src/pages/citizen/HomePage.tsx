import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../stores/authStore";
import { useIssuesFeed } from "../../hooks/useIssuesFeed";
import { SeverityBadge } from "../../components/ui/SeverityBadge";
import { ISSUE_STATUSES } from "../../config/constants";
import { DemoSeeder } from "../../services/demoSeeder";
import {
  MapPin, Inbox, Cpu, ChevronRight, Camera, CheckCircle2,
  Activity, Eye, ShieldAlert, Building, Scale, TrendingUp, Zap,
  AlertTriangle, RefreshCw
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { IssueDocument } from "../../types/issue.types";

// ─────────────────────────────────────────────────────────────────────────────
// Animated Counter
// ─────────────────────────────────────────────────────────────────────────────
const AnimatedCounter: React.FC<{ target: number; suffix?: string; duration?: number }> = ({
  target, suffix = "", duration = 1200
}) => {
  const [value, setValue] = useState(0);
  useEffect(() => {
    const step = target / (duration / 16);
    let current = 0;
    const iv = setInterval(() => {
      current = Math.min(current + step, target);
      setValue(Math.floor(current));
      if (current >= target) clearInterval(iv);
    }, 16);
    return () => clearInterval(iv);
  }, [target, duration]);
  return <span>{value.toLocaleString()}{suffix}</span>;
};

// ─────────────────────────────────────────────────────────────────────────────
// AI Ops Panel
// ─────────────────────────────────────────────────────────────────────────────
const AI_OPS_EVENTS = [
  { icon: Eye, color: "text-blue-400", bg: "bg-blue-500/10", agent: "Vision Agent", action: "scanning new media upload..." },
  { icon: Building, color: "text-indigo-400", bg: "bg-indigo-500/10", agent: "Routing Agent", action: "assigned to Roads Dept — 4h SLA" },
  { icon: ShieldAlert, color: "text-red-400", bg: "bg-red-500/10", agent: "Safety Agent", action: "flagged hazard near school zone" },
  { icon: Scale, color: "text-[#9AA3B8]", bg: "bg-[#9AA3B8]/10", agent: "Validator Agent", action: "confirmed logical consistency ✓" },
  { icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-500/10", agent: "Executive Agent", action: "citizen summary generated" },
  { icon: Cpu, color: "text-purple-400", bg: "bg-purple-500/10", agent: "Priority Agent", action: "resolved conflict → HIGH urgency" },
];

const LiveAIOpsPanel: React.FC = () => {
  const [events, setEvents] = useState<typeof AI_OPS_EVENTS>([AI_OPS_EVENTS[0]]);

  useEffect(() => {
    const iv = setInterval(() => {
      const next = (Math.floor(Date.now() / 2000)) % AI_OPS_EVENTS.length;
      setEvents((e) => [...e.slice(-3), AI_OPS_EVENTS[next]]);
    }, 2000);
    return () => clearInterval(iv);
  }, []);

  return (
    <div className="bg-[#0F172A] border border-white/5 rounded-2xl p-5 space-y-2.5">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-[10px] font-black text-[#9AA3B8] uppercase tracking-wider">AI Operations Telemetry · Live</span>
      </div>
      <AnimatePresence>
        {events.map((ev, i) => {
          const Icon = ev.icon;
          return (
            <motion.div
              key={`${ev.agent}-${i}`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="flex items-center gap-3 py-1 first:pt-0 last:pb-0"
            >
              <div className={`p-1.5 rounded-lg ${ev.bg} shrink-0`}>
                <Icon className={`w-3.5 h-3.5 ${ev.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-xs font-bold text-white">{ev.agent}</span>
                <span className="text-xs text-[#9AA3B8] ml-2 font-medium">{ev.action}</span>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Issue Feed Card
// ─────────────────────────────────────────────────────────────────────────────
const IssueCard: React.FC<{
  issue: IssueDocument;
  severityLevel: number;
  onClick: () => void;
}> = ({ issue, severityLevel, onClick }) => {
  const statusMeta = ISSUE_STATUSES.find((s) => s.value === issue.status);
  const thumbnail = issue.mediaUrls?.[0]?.original;
  const summary = issue.aiSummary;
  const title = summary?.subcategory || issue.aiAnalysis?.subcategory || "Community Issue";
  const executiveSummary = summary?.executiveSummary || issue.aiAnalysis?.aiDescription || "Summary pending AI analysis.";
  const departmentLabel = summary?.department || issue.routing?.primaryDepartment || "TBD";
  const confidenceLabel = summary?.confidence != null
    ? `${summary.confidence}%`
    : issue.aiAnalysis?.confidence != null
      ? `${issue.aiAnalysis.confidence}%`
      : "N/A";

  return (
    <button
      onClick={onClick}
      className="w-full flex items-start space-x-4 p-4 bg-[#1E293B] rounded-2xl border border-white/5 hover:border-[#22C55E]/30 hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 text-left group shadow-lg cursor-pointer"
    >
      <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-white/5 border border-white/5">
        {thumbnail ? (
          <img src={thumbnail} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Cpu className="w-6 h-6 text-[#9AA3B8]/30" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-bold text-white leading-tight line-clamp-1 group-hover:text-[#22C55E] transition-colors">
            {title}
          </h3>
          <SeverityBadge level={severityLevel as any} />
        </div>
        <p className="text-xs text-[#9AA3B8] line-clamp-2 leading-relaxed font-medium">
          {executiveSummary}
        </p>
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5 mt-1 text-[10px] text-[#9AA3B8]">
          <div className="space-y-0.5">
            <div className="font-bold text-white">Category</div>
            <div>{summary?.category || issue.aiAnalysis?.category || "N/A"}</div>
          </div>
          <div className="space-y-0.5">
            <div className="font-bold text-white">Dept</div>
            <div>{departmentLabel}</div>
          </div>
          <div className="space-y-0.5">
            <div className="font-bold text-white">Severity</div>
            <div>{summary?.severity || issue.aiAnalysis?.severity || "N/A"}</div>
          </div>
          <div className="space-y-0.5">
            <div className="font-bold text-white">Confidence</div>
            <div>{confidenceLabel}</div>
          </div>
        </div>
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center space-x-1 text-xs text-[#9AA3B8]">
            <MapPin className="w-3.5 h-3.5 text-[#22C55E]/70" />
            <span className="line-clamp-1 font-medium">{issue.location?.ward || "Unknown ward"}</span>
          </div>
          <div className="flex items-center gap-2">
            {issue.aiSummary != null && (
              <span className="text-[9px] font-black text-purple-300 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-full">AI SUMMARY ✓</span>
            )}
            {statusMeta && (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusMeta.color}`}>
                {statusMeta.label}
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
};

// Loading Skeleton Placeholder Component
const IssueCardSkeleton: React.FC = () => (
  <div className="w-full flex items-start space-x-4 p-4 bg-[#1E293B] rounded-2xl border border-white/5 animate-pulse shadow-lg">
    <div className="w-16 h-16 rounded-xl bg-white/5 shrink-0" />
    <div className="flex-1 space-y-3">
      <div className="flex justify-between items-center">
        <div className="h-4 w-32 bg-white/5 rounded" />
        <div className="h-4 w-16 bg-white/5 rounded" />
      </div>
      <div className="h-3 w-full bg-white/5 rounded" />
      <div className="h-3 w-3/4 bg-white/5 rounded" />
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Main HomePage
// ─────────────────────────────────────────────────────────────────────────────
export const HomePage: React.FC = () => {
  const { user } = useAuthStore();
  const { issues, loading } = useIssuesFeed();
  const navigate = useNavigate();
  const [seeding, setSeeding] = useState(false);
  const [seedDone, setSeedDone] = useState(false);

  const severityLevelMap = { critical: 0, high: 1, medium: 2, low: 3 };

  const resolvedCount = issues.filter((i) => i.status === "resolved" || i.status === "closed").length;
  const activeCount = issues.filter((i) => i.status !== "resolved" && i.status !== "closed").length;
  const aiProcessed = issues.filter((i) => i.aiSummary != null).length;

  const handleSeedDemo = async () => {
    setSeeding(true);
    try {
      await DemoSeeder.seedDemoIssues();
      setSeedDone(true);
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-2 py-4 space-y-6 pb-28 relative">

      {/* ── Hero Greeting ───────────────────────────────────────────── */}
      <div className="bg-[#1E293B] border border-white/5 text-white rounded-3xl p-6 shadow-2xl relative overflow-hidden">
        {/* Glow behind greeting */}
        <div className="absolute top-[-20%] right-[-10%] w-[35%] aspect-square rounded-full bg-emerald-500/10 blur-[50px] pointer-events-none" />

        <div className="flex items-start justify-between relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Activity className="w-4 h-4 text-[#22C55E]" />
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">AI City Operations</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight">
              Hey, {user?.displayName?.split(" ")[0] || "Citizen"} 👋
            </h1>
            <p className="text-sm text-[#9AA3B8] font-medium">
              Welcome back to your civic governance portal.
            </p>
          </div>
          <div className="shrink-0 p-3 bg-emerald-500/10 border border-emerald-500/20 text-[#22C55E] rounded-2xl">
            <Cpu className="w-6 h-6" />
          </div>
        </div>

        {/* Live AI Ops Ticker */}
        <div className="mt-6 relative z-10">
          <LiveAIOpsPanel />
        </div>
      </div>

      {/* ── Animated Stats Strip ─────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3">
        {[
          {
            label: "AI Analysed",
            value: aiProcessed,
            icon: Zap,
            color: "text-purple-400",
            bg: "bg-purple-500/10 border border-purple-500/20",
          },
          {
            label: "Resolved",
            value: resolvedCount,
            icon: CheckCircle2,
            color: "text-emerald-400",
            bg: "bg-emerald-500/10 border border-emerald-500/20",
          },
          {
            label: "Active Issues",
            value: activeCount,
            icon: AlertTriangle,
            color: "text-amber-400",
            bg: "bg-amber-500/10 border border-amber-500/20",
          },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className={`${bg} rounded-2xl p-4 text-center shadow-lg hover:scale-102 transition-transform`}>
            <Icon className={`w-5 h-5 mx-auto mb-2.5 ${color}`} />
            <div className={`text-2xl font-black ${color} leading-none`}>
              <AnimatedCounter target={value} />
            </div>
            <div className="text-[10px] uppercase font-bold tracking-widest text-[#9AA3B8] mt-2">{label}</div>
          </div>
        ))}
      </div>

      {/* ── Report FAB ───────────────────────────────────────────────── */}
      <button
        onClick={() => navigate("/report")}
        className="w-full flex items-center justify-between p-5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-2xl shadow-xl shadow-emerald-500/10 hover:shadow-emerald-500/20 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer"
      >
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-white/10 rounded-xl">
            <Camera className="w-6 h-6" />
          </div>
          <div className="text-left space-y-0.5">
            <div className="font-black text-base">Report an Issue</div>
            <div className="text-xs text-white/80 font-medium">AI-powered classification · 6-agent triage · Instant routing</div>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-white/70" />
      </button>

      {/* ── Demo Mode ────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between p-5 bg-[#1E293B] border border-white/5 rounded-2xl shadow-lg">
        <div className="flex items-start gap-3">
          <TrendingUp className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="text-xs font-bold text-white uppercase tracking-wider">Demo Sandbox Mode</p>
            <p className="text-xs text-[#9AA3B8] font-medium leading-relaxed">Seed sample reports for test routing</p>
          </div>
        </div>

        <button
          onClick={handleSeedDemo}
          disabled={seeding || seedDone}
          className={`flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl transition-all cursor-pointer ${
            seedDone
              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
              : "bg-[#22C55E] text-white hover:bg-emerald-600 shadow-md shadow-emerald-500/10"
          }`}
        >
          {seeding ? (
            <><RefreshCw className="w-3.5 h-3.5 animate-spin" />Seeding...</>
          ) : seedDone ? (
            <><CheckCircle2 className="w-3.5 h-3.5" />Data Seeded</>
          ) : (
            <>Seed Demo Data</>
          )}
        </button>
      </div>

      {/* ── Community Feed ───────────────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-black tracking-tight text-white uppercase">Community Feed</h2>
          <button
            onClick={() => navigate("/map")}
            className="text-xs font-bold text-[#22C55E] hover:text-emerald-400 flex items-center gap-1 transition-colors cursor-pointer"
          >
            View Live Map
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {loading ? (
          <div className="space-y-3">
            <IssueCardSkeleton />
            <IssueCardSkeleton />
            <IssueCardSkeleton />
          </div>
        ) : issues.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-4 bg-[#1E293B] rounded-2xl border border-white/5 text-center shadow-lg">
            <Inbox className="w-12 h-12 text-[#9AA3B8]/30" />
            <div className="space-y-1">
              <p className="text-sm font-bold text-white">No issues reported yet</p>
              <p className="text-xs text-[#9AA3B8] max-w-xs mx-auto font-medium">
                Be the first to report, or launch Demo Sandbox Mode above to seed data.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {issues.slice(0, 12).map((issue) => {
              const summary = issue.aiSummary;
              const computedSeverity = summary?.severity || issue.aiAnalysis?.severity;
              return (
                <IssueCard
                  key={issue.id}
                  issue={issue}
                  severityLevel={severityLevelMap[computedSeverity as keyof typeof severityLevelMap] ?? 2}
                  onClick={() => navigate(
                    issue.aiSummary != null
                      ? `/report/${issue.id}/pipeline`
                      : `/issues/${issue.id}`
                  )}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;
