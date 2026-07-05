import React, { useState, useEffect } from "react";
import { 
  Users, ShieldAlert, MessageSquare, Sliders, 
  TrendingUp, ShieldCheck, Activity
} from "lucide-react";
import { Timestamp } from "firebase/firestore";
import { adminService, AuditLog } from "../../services/adminService";
import { PageLoader } from "../../components/ui/PageLoader";

export const AdminDashboardPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [logs, setLogs] = useState<AuditLog[]>([]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsData, logsData] = await Promise.all([
        adminService.getSystemStats(),
        adminService.getAuditLogs(8)
      ]);
      setStats(statsData);
      setLogs(logsData);
    } catch (err) {
      console.error("Failed to load admin stats:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading || !stats) {
    return <PageLoader />;
  }

  // Pre-seed default trend array if no data exists yet
  const trendData = [
    { label: "Mon", count: 8 },
    { label: "Tue", count: 12 },
    { label: "Wed", count: 15 },
    { label: "Thu", count: 10 },
    { label: "Fri", count: 18 },
    { label: "Sat", count: 24 },
    { label: "Sun", count: 20 }
  ];
  const maxVal = Math.max(...trendData.map(d => d.count)) || 1;

  return (
    <div className="space-y-6 pb-28 text-left">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-1.5 mb-1">
          <Sliders className="w-4 h-4 text-emerald-500" />
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-500">System Admin Control</span>
        </div>
        <h1 className="text-3xl font-black text-white tracking-tight">Admin Overview</h1>
        <p className="text-xs text-[#9AA3B8]">
          Monitor real-time system metrics, user roles, active municipal services, and security logs.
        </p>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Users", value: stats.totalUsers, desc: `${stats.citizens} Citizens registered`, icon: Users, color: "text-blue-400", bg: "bg-blue-500/5 border-blue-500/10" },
          { label: "Municipal Staff", value: stats.officials, desc: `${stats.moderators} Active Moderators`, icon: ShieldCheck, color: "text-emerald-400", bg: "bg-emerald-500/5 border-emerald-500/10" },
          { label: "Civic Issues", value: stats.totalIssues, desc: `${stats.activeIssues} Pending resolution`, icon: ShieldAlert, color: "text-red-400", bg: "bg-red-500/5 border-red-500/10" },
          { label: "Community Hub", value: stats.discussions, desc: `${stats.events} Volunteer events`, icon: MessageSquare, color: "text-purple-400", bg: "bg-purple-500/5 border-purple-500/10" }
        ].map((item, idx) => (
          <div key={idx} className={`bg-[#1E293B] border rounded-2xl p-5 shadow-lg relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:border-white/10 ${item.bg}`}>
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-black text-[#6B7280] uppercase tracking-wider block">{item.label}</span>
              <item.icon className={`w-4.5 h-4.5 ${item.color}`} />
            </div>
            <span className="text-3xl font-black font-mono text-white block mt-2 leading-none">{item.value}</span>
            <span className="text-[10px] text-[#9AA3B8] font-bold mt-1.5 block">{item.desc}</span>
          </div>
        ))}
      </div>

      {/* Interactive Activity feed and chart columns */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
        {/* Trend Chart (6/10 Width) */}
        <div className="lg:col-span-6 bg-[#1E293B] border border-white/5 rounded-2xl p-5 shadow-lg space-y-4">
          <div className="flex justify-between items-center pb-2.5 border-b border-white/5">
            <div className="space-y-0.5">
              <h3 className="text-sm font-bold text-white leading-none">Weekly Submission Trends</h3>
              <span className="text-[10px] font-medium text-[#6B7280] block">Aggregated citizen reports.</span>
            </div>
            <div className="flex items-center gap-1.5 text-[9px] bg-emerald-500/15 border border-emerald-500/20 text-[#16A34A] px-2 py-0.5 rounded-full font-bold uppercase leading-none">
              <TrendingUp className="w-2.5 h-2.5" /> Stable growth
            </div>
          </div>

          <div className="relative pt-2">
            <svg viewBox="0 0 350 110" className="w-full h-auto">
              <defs>
                <linearGradient id="adminTrendGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10B981" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* Gridlines */}
              <line x1="30" y1="90" x2="330" y2="90" stroke="#273244" strokeWidth="0.5" strokeDasharray="3,3" />
              <line x1="30" y1="60" x2="330" y2="60" stroke="#273244" strokeWidth="0.5" strokeDasharray="3,3" />
              <line x1="30" y1="30" x2="330" y2="30" stroke="#273244" strokeWidth="0.5" strokeDasharray="3,3" />
              <line x1="30" y1="100" x2="330" y2="100" stroke="#273244" strokeWidth="1" />

              {/* Paths */}
              {(() => {
                const pointsStr = trendData.map((p, idx) => {
                  const x = 40 + idx * 45;
                  const y = 100 - (p.count / maxVal) * 80;
                  return `${x},${y}`;
                }).join(" ");

                const areaPath = `M 40,100 L ${pointsStr} L 310,100 Z`;
                const linePath = `M ${pointsStr}`;

                return (
                  <>
                    <path d={areaPath} fill="url(#adminTrendGrad)" />
                    <path d={linePath} fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </>
                );
              })()}

              {/* Labels */}
              {trendData.map((p, idx) => {
                const x = 40 + idx * 45;
                const y = 100 - (p.count / maxVal) * 80;
                return (
                  <g key={idx}>
                    <circle cx={x} cy={y} r="3" fill="#10B981" stroke="#1E293B" strokeWidth="1" />
                    <text x={x} y="108" fill="#6B7280" fontSize="7" fontWeight="bold" textAnchor="middle">{p.label}</text>
                    <text x={x} y={y - 6} fill="#F3F4F6" fontSize="7" fontWeight="black" textAnchor="middle">{p.count}</text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Live System Logs / Activity Feed (4/10 Width) */}
        <div className="lg:col-span-4 bg-[#1E293B] border border-white/5 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-2.5 border-b border-white/5">
              <div className="space-y-0.5">
                <h3 className="text-sm font-bold text-white leading-none">Security &amp; Audit Logs</h3>
                <span className="text-[10px] font-medium text-[#6B7280] block">Real-time moderator and administrative actions.</span>
              </div>
              <Activity className="w-4.5 h-4.5 text-emerald-400 animate-pulse" />
            </div>

            {logs.length === 0 ? (
              <div className="py-12 text-center text-xs text-[#6B7280] font-bold">
                No recent administrative events recorded.
              </div>
            ) : (
              <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar text-left">
                {logs.map((log, idx) => {
                  const date = log.timestamp instanceof Timestamp ? log.timestamp.toDate() : log.timestamp instanceof Date ? log.timestamp : new Date();
                  const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  
                  return (
                    <div key={idx} className="flex gap-3 text-xs">
                      <div className="flex flex-col items-center">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                        {idx !== logs.length - 1 && <div className="w-0.5 flex-1 bg-white/5 my-1" />}
                      </div>
                      <div className="flex-1 space-y-0.5 leading-tight">
                        <div className="flex justify-between">
                          <span className="font-black text-white">Action: {log.action.replace(/_/g, ' ').toUpperCase()}</span>
                          <span className="text-[9px] font-mono text-[#6B7280]">{timeStr}</span>
                        </div>
                        <p className="text-[10px] text-[#9AA3B8]">
                          Actor UID <span className="font-mono text-emerald-400">{log.actorId.slice(0, 6)}</span> targeting {log.targetType} <span className="font-mono">{log.targetId.slice(0, 6)}</span>.
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <button onClick={fetchDashboardData} className="mt-4 flex items-center justify-center gap-1.5 py-2 w-full bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-wider text-white border border-white/5 rounded-xl transition-all cursor-pointer">
            Refresh Stream
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
