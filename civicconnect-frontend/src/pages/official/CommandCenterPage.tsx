import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { collection, query, onSnapshot, orderBy } from "firebase/firestore";
import { db } from "../../config/firebase";
import { IssueDocument } from "../../types/issue.types";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/card";
import { motion } from "framer-motion";
import {
  Cpu, AlertCircle, CheckCircle2, Clock, Activity, Zap, Building
} from "lucide-react";

// KPI Counter Component
const CountCard: React.FC<{
  label: string;
  value: number | string;
  icon: React.ElementType;
  color: string;
  bg: string;
}> = ({ label, value, icon: Icon, color, bg }) => (
  <Card className="hover:scale-102 transition-transform shadow-lg border border-white/5 bg-[#1E293B]">
    <CardContent className="pt-6 flex justify-between items-start">
      <div className="space-y-1.5">
        <span className="text-[10px] font-black uppercase tracking-wider text-[#9AA3B8]">{label}</span>
        <span className="block text-3xl font-black text-white leading-none">{value}</span>
      </div>
      <div className={`p-2.5 rounded-xl ${bg} ${color} shrink-0 border border-white/5`}>
        <Icon className="w-5 h-5" />
      </div>
    </CardContent>
  </Card>
);

// Loading Skeleton Placeholder for CommandCenter
const DashboardSkeleton: React.FC = () => (
  <div className="space-y-6 animate-pulse">
    <div className="h-8 w-48 bg-white/5 rounded-lg" />
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="h-28 bg-[#1E293B] rounded-[18px] border border-white/5" />
      ))}
    </div>
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 h-96 bg-[#1E293B] rounded-[18px] border border-white/5" />
      <div className="h-96 bg-[#1E293B] rounded-[18px] border border-white/5" />
    </div>
  </div>
);

export const CommandCenterPage: React.FC = () => {
  const [issues, setIssues] = useState<IssueDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [activityFeed, setActivityFeed] = useState<{ id: string; text: string; time: Date; tag: string }[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const issuesRef = collection(db, "issues");
    const q = query(issuesRef, orderBy("updatedAt", "desc"));

    const unsubscribe = onSnapshot(q, (snap) => {
      const list: IssueDocument[] = [];
      const feeds: typeof activityFeed = [];

      snap.forEach((doc) => {
        const issue = doc.data() as IssueDocument;
        list.push(issue);

        // Generate activity logs based on actual status & AI summary progress
        const time = issue.updatedAt ? new Date((issue.updatedAt as any).toDate ? (issue.updatedAt as any).toDate() : issue.updatedAt) : new Date();
        const desc = issue.aiAnalysis?.subcategory || "Civic Issue";

        if (issue.aiSummary == null) {
          feeds.push({
            id: `${issue.id}-ai-pending`,
            text: `Waiting for AI summary on "${desc}" (#${issue.id.slice(0, 5)})`,
            time,
            tag: "AI",
          });
        }
        if (issue.status === "submitted") {
          feeds.push({
            id: `${issue.id}-sub`,
            text: `New issue "${desc}" submitted in Ward: ${issue.location?.ward || "Unknown"}`,
            time,
            tag: "Citizen",
          });
        }
        if (issue.status === "assigned" || issue.status === "in_progress") {
          feeds.push({
            id: `${issue.id}-work`,
            text: `Work initiated on "${desc}" by ${issue.routing?.primaryDepartment}`,
            time,
            tag: "Official",
          });
        }
        if (issue.status === "resolved") {
          feeds.push({
            id: `${issue.id}-res`,
            text: `Repairs completed for "${desc}". Awaiting citizen verification.`,
            time,
            tag: "Verification",
          });
        }
      });

      setIssues(list);
      setActivityFeed(feeds.slice(0, 10)); // Keep top 10 activities
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Compute live KPIs
  const totalActive = issues.filter((i) => i.status !== "resolved" && i.status !== "closed").length;
  const critical = issues.filter((i) => i.aiAnalysis?.severity === "critical" && i.status !== "resolved" && i.status !== "closed").length;
  const resolvedToday = issues.filter((i) => {
    if (i.status !== "resolved" && i.status !== "closed") return false;
    const date = i.updatedAt ? new Date((i.updatedAt as any).toDate ? (i.updatedAt as any).toDate() : i.updatedAt) : new Date();
    return date.toDateString() === new Date().toDateString();
  }).length;

  const pendingAiSummaries = issues.filter((i) => i.aiSummary == null).length;
  const avgConfidence = issues.length
    ? Math.round(issues.reduce((acc, i) => acc + (i.aiAnalysis?.confidence || 0), 0) / issues.length)
    : 80;

  // Departments Status lists
  const departments = [
    { name: "Roads & Infrastructure", key: "roads", icon: Building, color: "text-blue-400", bg: "bg-blue-500/10" },
    { name: "Pune Water Supply", key: "water", icon: Building, color: "text-teal-400", bg: "bg-teal-500/10" },
    { name: "Maharashtra Electricity", key: "electricity", icon: Building, color: "text-amber-400", bg: "bg-amber-500/10" },
    { name: "Solid Waste Management", key: "waste", icon: Building, color: "text-emerald-400", bg: "bg-emerald-500/10" },
    { name: "Drainage Department", key: "drainage", icon: Building, color: "text-indigo-400", bg: "bg-indigo-500/10" },
    { name: "Parks & Recreation", key: "parks", icon: Building, color: "text-lime-400", bg: "bg-lime-500/10" },
  ];

  const getDeptMetrics = (deptName: string) => {
    const deptIssues = issues.filter((i) => i.routing?.primaryDepartment?.toLowerCase().includes(deptName.split(" ")[0].toLowerCase()));
    const open = deptIssues.filter((i) => i.status !== "resolved" && i.status !== "closed").length;
    const crit = deptIssues.filter((i) => i.aiAnalysis?.severity === "critical" && i.status !== "resolved" && i.status !== "closed").length;
    const resolved = deptIssues.filter((i) => i.status === "resolved" || i.status === "closed").length;
    const total = deptIssues.length || 1;
    const rate = Math.round((resolved / total) * 100);
    return { open, crit, rate };
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-1">
            <Activity className="w-4 h-4 text-emerald-400" />
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">Operations Control Room</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">AI Command Center</h1>
        </div>
        <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-xl text-xs font-bold text-emerald-400 shadow-md">
          <span className="w-2.5 h-2.5 rounded-full bg-[#22C55E] animate-pulse" />
          Live telemetry connection established
        </div>
      </div>

      {/* KPI stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <CountCard label="Active Issues" value={totalActive} icon={AlertCircle} color="text-blue-400" bg="bg-blue-500/10" />
        <CountCard label="Critical Issues" value={critical} icon={Clock} color="text-red-400" bg="bg-red-500/10" />
        <CountCard label="Resolved Today" value={resolvedToday} icon={CheckCircle2} color="text-emerald-400" bg="bg-emerald-500/10" />
        <CountCard label="Average Confidence" value={`${avgConfidence}%`} icon={Zap} color="text-purple-400" bg="bg-purple-500/10" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Department Statuses */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border border-white/5">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div className="flex items-center gap-2">
                <Building className="w-4 h-4 text-[#9AA3B8]" />
                <CardTitle className="text-sm font-bold text-white uppercase tracking-wider">Department Workloads</CardTitle>
              </div>
              <span className="text-[10px] font-black text-[#9AA3B8] uppercase tracking-wider">Resolution Rate</span>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              {departments.map((dept) => {
                const metrics = getDeptMetrics(dept.name);
                const DeptIcon = dept.icon;
                return (
                  <div key={dept.name} className="flex items-center justify-between gap-4 p-3.5 bg-white/5 border border-white/5 rounded-2xl hover:border-white/10 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`p-2.5 rounded-xl shrink-0 ${dept.bg} ${dept.color} border border-white/5`}>
                        <DeptIcon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 space-y-0.5">
                        <span className="block text-xs font-bold text-white truncate">{dept.name}</span>
                        <span className="text-[10px] text-[#9AA3B8] font-bold block">
                          {metrics.open} Open Issues · <span className="text-red-400 font-bold">{metrics.crit} Critical</span>
                        </span>
                      </div>
                    </div>
                    <div className="w-28 shrink-0 text-right space-y-1">
                      <div className="text-xs font-bold text-white">{metrics.rate}%</div>
                      <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-[#22C55E] h-1.5 rounded-full" style={{ width: `${metrics.rate}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Running Pipelines Monitor */}
          <Card className="border border-white/5">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-purple-400" />
                <CardTitle className="text-sm font-bold text-white uppercase tracking-wider">Pending AI Summaries ({pendingAiSummaries})</CardTitle>
              </div>
              <span className="text-[9px] font-black text-purple-300 bg-purple-500/10 border border-purple-500/20 px-2 py-1 rounded-full uppercase tracking-wider">Awaiting AI</span>
            </CardHeader>
            <CardContent className="pt-4">
              {pendingAiSummaries === 0 ? (
                <div className="text-center py-10 text-[#9AA3B8] text-xs font-medium">
                  All issues have AI summaries completed.
                </div>
              ) : (
                <div className="space-y-3">
                  {issues.filter((i) => i.aiSummary == null).map((issue) => (
                    <button
                      key={issue.id}
                      onClick={() => navigate(`/report/${issue.id}/pipeline`)}
                      className="w-full flex items-center justify-between p-3.5 border border-purple-500/20 bg-purple-500/5 hover:bg-purple-500/10 hover:border-purple-500/30 rounded-xl text-left transition-all cursor-pointer"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">{issue.aiAnalysis?.subcategory || "Analyzing Report..."}</span>
                          <span className="text-[9px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 px-1.5 py-0.5 rounded-full uppercase tracking-wider">Deliberating</span>
                        </div>
                        <span className="text-[10px] text-[#9AA3B8] block mt-1 font-semibold">Ward: {issue.location?.ward} · ID: #{issue.id.slice(0, 6)}</span>
                      </div>
                      <Zap className="w-4 h-4 text-purple-400 animate-bounce shrink-0" />
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Live AI Activity Feed */}
        <Card className="flex flex-col border border-white/5">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <CardTitle className="text-sm font-bold text-white uppercase tracking-wider">Realtime Activity Feed</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-4 flex-1 overflow-y-auto max-h-[550px] custom-scrollbar">
            {activityFeed.length === 0 ? (
              <div className="text-center py-12 text-[#9AA3B8] text-xs font-medium">
                Awaiting telemetry updates...
              </div>
            ) : (
              <div className="space-y-5">
                {activityFeed.map((event, idx) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="flex gap-3 items-start relative pb-4 last:pb-0"
                  >
                    {/* Vertical Connector */}
                    {idx < activityFeed.length - 1 && (
                      <div className="absolute top-5 left-2 w-[1px] bg-white/5 bottom-0" />
                    )}
                    <div className={`w-4 h-4 rounded-full border-2 border-[#1E293B] flex items-center justify-center shrink-0 mt-0.5 z-10 ${
                      event.tag === "AI" ? "bg-purple-500" :
                      event.tag === "Official" ? "bg-blue-500" :
                      event.tag === "Verification" ? "bg-emerald-500" : "bg-[#9AA3B8]"
                    }`} />
                    <div className="min-w-0 flex-1 space-y-1">
                      <p className="text-xs text-white leading-snug font-medium">{event.text}</p>
                      <span className="text-[9px] text-[#9AA3B8] font-bold block">
                        {event.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CommandCenterPage;
