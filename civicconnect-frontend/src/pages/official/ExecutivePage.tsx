import React, { useState, useEffect, useRef } from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "../../config/firebase";
import { IssueDocument } from "../../types/issue.types";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/card";
import { 
  Cpu, Printer, Sparkles, CheckCircle, TrendingUp, BarChart2, 
  MapPin, AlertTriangle, Brain 
} from "lucide-react";

export const ExecutivePage: React.FC = () => {
  const [issues, setIssues] = useState<IssueDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const printAreaRef = useRef<HTMLDivElement>(null);
  const [hoveredWeek, setHoveredWeek] = useState<number | null>(null);
  const [hoveredDept, setHoveredDept] = useState<number | null>(null);

  useEffect(() => {
    getDocs(query(collection(db, "issues"), orderBy("createdAt", "desc")))
      .then((snap) => {
        const list: IssueDocument[] = [];
        snap.forEach((doc) => list.push(doc.data() as IssueDocument));
        setIssues(list);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load issues for briefing:", err);
        setLoading(false);
      });
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const total = issues.length;
  const resolved = issues.filter((i) => i.status === "resolved" || i.status === "closed").length;
  const activeCount = total - resolved;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-3 select-none">
        <div className="w-8 h-8 border-2 border-[#16A34A] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-[#9CA3AF] font-bold">Generating Executive Briefing...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 print:p-8 print:bg-white select-none text-left" ref={printAreaRef}>
      
      {/* Print stylesheet */}
      <style>{`
        @media print {
          body {
            color: #000 !important;
            background: #fff !important;
          }
          header, aside, nav, button, .no-print {
            display: none !important;
          }
          main {
            padding: 0 !important;
            margin: 0 !important;
          }
          .print-card {
            border: 1px solid #ccc !important;
            box-shadow: none !important;
            background: #fff !important;
            color: #000 !important;
          }
          text {
            fill: #000 !important;
          }
          rect, path {
            fill-opacity: 1 !important;
          }
        }
      `}</style>

      {/* Header Panel */}
      <div className="flex justify-between items-center gap-4 border-b border-[#273244] pb-5 no-print">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400">Executive Briefings Portal</span>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Intelligence &amp; Insights</h1>
        </div>
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 bg-[#1A2332] border border-[#273244] hover:bg-[#1A2332]/80 text-[#F3F4F6] text-xs font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          Export Briefing (PDF)
        </button>
      </div>

      {/* Official Report Title for Printing */}
      <div className="hidden print:block text-center space-y-2 mb-8 border-b-2 border-gray-900 pb-6">
        <h1 className="text-3xl font-black text-gray-950 uppercase tracking-tight">CivicConnect AI Intelligence Briefing</h1>
        <p className="text-sm text-gray-600 font-semibold">
          Smart City Command Center Operations Review · Generated July 4, 2026 09:42 AM IST
        </p>
      </div>

      {/* Today's Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 print:grid-cols-4">
        {[
          { label: "Active Incidents", value: activeCount, desc: "Incidents in active backlog", color: "text-[#2563EB]" },
          { label: "Resolved Actions", value: resolved, desc: "Completed on July 4, 2026", color: "text-[#16A34A]" },
          { label: "Critical Safety Risk", value: "32%", desc: "Priority 0 incidents share", color: "text-[#DC2626]" },
          { label: "SLA Response Rate", value: "96.4%", desc: "Incidents met target SLAs", color: "text-[#F59E0B]" }
        ].map((stat, idx) => (
          <div key={idx} className="bg-[#111827] border border-[#273244] rounded-xl p-4.5 shadow-sm print-card">
            <span className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider block">{stat.label}</span>
            <span className={`text-2xl font-bold font-mono ${stat.color} mt-1 block`}>{stat.value}</span>
            <span className="text-[11px] font-semibold text-[#9CA3AF] mt-1 block">{stat.desc}</span>
          </div>
        ))}
      </div>

      {/* ── REDESIGNED GOVERNMENT BRIEFING SECTIONS ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Narrative & Memos (7/12 Width) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Today's Situation & AI Summary */}
          <Card className="print-card bg-[#111827] border-[#273244]">
            <CardHeader className="pb-3 border-b border-[#273244]/55">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-purple-400" />
                <CardTitle className="text-sm font-bold text-white uppercase tracking-wider">Today's Situation & AI Summary</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-4 text-xs text-[#9CA3AF] leading-relaxed">
              <div className="bg-[#1A2332] border border-[#273244] rounded-xl p-4 space-y-2.5">
                <p className="font-bold text-[#F3F4F6] text-xs flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#16A34A]"></span> Overview Status
                </p>
                <p className="font-medium text-[#9CA3AF]">
                  As of July 4, 2026, Pune municipal infrastructure telemetry reports normal operation with localized spikes in pothole detections near Koregaon Park and storm drainage overflow concerns on FC Road. Total volume is currently well-managed under current dispatcher thresholds.
                </p>
              </div>

              <div className="bg-purple-500/5 border border-purple-500/20 rounded-xl p-4 space-y-2.5">
                <p className="font-bold text-purple-300 text-xs flex items-center gap-1.5">
                  <Brain className="w-4 h-4 text-purple-300" /> AI Executive Analysis Consensus
                </p>
                <p className="font-medium text-purple-300/80">
                  Municipal algorithms verify that road depression accumulation is the primary driver of infrastructure alerts today. Correlation with high traffic density segments recommends dispatching auxiliary repair units to Core Zone 4 (Koregaon Park / Shivajinagar) to maintain safety margins.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Top Critical Zones & Bottlenecks */}
          <Card className="print-card bg-[#111827] border-[#273244]">
            <CardHeader className="pb-3 border-b border-[#273244]/55">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#DC2626]" />
                <CardTitle className="text-sm font-bold text-white uppercase tracking-wider">Top Critical Incident Zones</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse font-semibold">
                  <thead>
                    <tr className="border-b border-[#273244] text-[#6B7280] font-bold text-[10px] uppercase">
                      <th className="py-1 px-1">Zone (Ward)</th>
                      <th className="py-1 px-1">P0 Count</th>
                      <th className="py-1 px-1">Avg SLA Breach Time</th>
                      <th className="py-1 px-1 text-right">Risk Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#273244]/40 text-[#9CA3AF]">
                    {[
                      { ward: "Shivajinagar (FC Road)", p0: 2, sla: "1.4 hrs remaining", risk: "Critical (88/100)", color: "text-[#DC2626]" },
                      { ward: "Koregaon Park", p0: 1, sla: "1.8 hrs remaining", risk: "High (74/100)", color: "text-[#F59E0B]" },
                      { ward: "Swargate", p0: 1, sla: "0.8 hrs remaining", risk: "High (72/100)", color: "text-[#F59E0B]" },
                      { ward: "Kothrud", p0: 0, sla: "14.2 hrs remaining", risk: "Medium (45/100)", color: "text-[#2563EB]" }
                    ].map((row, idx) => (
                      <tr key={idx} className="hover:bg-white/[0.01]">
                        <td className="py-2.5 px-1 font-bold text-[#F3F4F6]">{row.ward}</td>
                        <td className="py-2.5 px-1 font-mono text-center">{row.p0}</td>
                        <td className="py-2.5 px-1 font-mono text-center">{row.sla}</td>
                        <td className={`py-2.5 px-1 text-right font-bold ${row.color}`}>{row.risk}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Predicted Incidents (GIS Forecasts) */}
          <Card className="print-card bg-[#111827] border-[#273244]">
            <CardHeader className="pb-3 border-b border-[#273244]/55">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-[#F59E0B]" />
                <CardTitle className="text-sm font-bold text-white uppercase tracking-wider">AI Predictive Forecasts</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              {[
                { title: "Water Line Pressure Leak Anomaly", loc: "Shivajinagar Sector 3", probability: "86% Match", desc: "Telemetry reveals a flow rate drop of 8.2% in local mains." },
                { title: "Pothole Development Clustering", loc: "Aundh Road segments", probability: "74% Match", desc: "Heavy commercial traffic and surface moisture levels indicates high fracture risks." }
              ].map((pred, i) => (
                <div key={i} className="p-3 bg-[#1A2332]/50 border border-[#273244] rounded-xl flex justify-between items-start text-xs">
                  <div className="space-y-1 text-left">
                    <span className="font-bold text-[#F3F4F6] block">{pred.title}</span>
                    <span className="text-[10px] text-[#6B7280] block">Location: {pred.loc}</span>
                    <p className="text-[11px] text-[#9CA3AF] leading-normal">{pred.desc}</p>
                  </div>
                  <span className="bg-[#F59E0B]/10 border border-[#F59E0B]/20 text-[#F59E0B] text-[10px] px-2 py-0.5 rounded-full font-bold">
                    {pred.probability}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN: Actions, Allocations, and Charts (5/12 Width) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* recommended actions & Resource Allocation */}
          <Card className="print-card bg-[#111827] border-[#273244]">
            <CardHeader className="pb-3 border-b border-[#273244]/55">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-[#16A34A]" />
                <CardTitle className="text-sm font-bold text-white uppercase tracking-wider">Administrative Actions & Allocations</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-4 text-xs text-[#9CA3AF]">
              
              {/* Recommendations */}
              <div className="space-y-2.5 text-left">
                <span className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider block">Recommended Actions</span>
                {[
                  "Deploy primary pump dispatch crews to Starbucks FC Road immediately to clear drainage line.",
                  "Approve Maharashtra Electricity work order to replace bulb lines along Karve Road Stand.",
                  "Request Roads department review MG Road Camp missing manhole cover status (SLA limits 4h)."
                ].map((rec, i) => (
                  <div key={i} className="flex gap-2.5 items-start">
                    <span className="w-4 h-4 rounded-full bg-[#16A34A]/10 border border-[#16A34A]/25 text-[#16A34A] flex items-center justify-center font-bold shrink-0 text-[9px] mt-0.5">{i+1}</span>
                    <p className="font-semibold leading-normal">{rec}</p>
                  </div>
                ))}
              </div>

              {/* Resource Allocation */}
              <div className="border-t border-[#273244]/65 pt-4 space-y-2 text-left select-none">
                <span className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider block">Resource Allocation Map</span>
                <div className="grid grid-cols-2 gap-2 text-[11px] font-bold">
                  <div className="p-2.5 bg-[#1A2332]/45 border border-[#273244] rounded-xl text-center">
                    <span className="block text-lg font-bold text-white font-mono">14</span>
                    <span className="text-[9px] text-[#6B7280] uppercase mt-0.5 block">Active Crews</span>
                  </div>
                  <div className="p-2.5 bg-[#1A2332]/45 border border-[#273244] rounded-xl text-center">
                    <span className="block text-lg font-bold text-[#16A34A] font-mono">88%</span>
                    <span className="text-[9px] text-[#6B7280] uppercase mt-0.5 block">Utilization</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Weekly incidents growth SVG Chart */}
          <Card className="print-card bg-[#111827] border-[#273244]">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#2563EB]" />
                <CardTitle className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wider">Weekly Incident growth</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <svg viewBox="0 0 400 180" className="w-full h-auto">
                <defs>
                  <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563EB" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#2563EB" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <line x1="30" y1="150" x2="380" y2="150" stroke="#273244" strokeWidth="1" />
                <line x1="30" y1="100" x2="380" y2="100" stroke="#273244" strokeWidth="0.5" strokeDasharray="3,3" />
                <line x1="30" y1="50" x2="380" y2="50" stroke="#273244" strokeWidth="0.5" strokeDasharray="3,3" />

                <text x="12" y="152" fill="#6B7280" fontSize="9" fontWeight="bold">0</text>
                <text x="10" y="102" fill="#6B7280" fontSize="9" fontWeight="bold">50</text>
                <text x="10" y="52" fill="#6B7280" fontSize="9" fontWeight="bold">100</text>

                <text x="50" y="165" fill="#6B7280" fontSize="9" textAnchor="middle">Wk 1</text>
                <text x="130" y="165" fill="#6B7280" fontSize="9" textAnchor="middle">Wk 2</text>
                <text x="210" y="165" fill="#6B7280" fontSize="9" textAnchor="middle">Wk 3</text>
                <text x="290" y="165" fill="#6B7280" fontSize="9" textAnchor="middle">Wk 4</text>
                <text x="370" y="165" fill="#6B7280" fontSize="9" textAnchor="middle">Wk 5</text>

                {/* Area path */}
                <path d="M 50,130 Q 90,95 130,110 Q 170,125 210,75 Q 250,25 290,45 Q 330,65 370,25 L 370,150 L 50,150 Z" fill="url(#chartGrad)" />
                {/* Line path */}
                <path d="M 50,130 Q 90,95 130,110 Q 170,125 210,75 Q 250,25 290,45 Q 330,65 370,25" fill="none" stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round" />

                {[
                  { label: "Wk 1", val: 25, cx: 50, cy: 130 },
                  { label: "Wk 2", val: 50, cx: 130, cy: 110 },
                  { label: "Wk 3", val: 93, cx: 210, cy: 75 },
                  { label: "Wk 4", val: 130, cx: 290, cy: 45 },
                  { label: "Wk 5", val: 155, cx: 370, cy: 25 }
                ].map((w, idx) => (
                  <circle
                    key={idx}
                    cx={w.cx}
                    cy={w.cy}
                    r="4"
                    fill={hoveredWeek === idx ? "#2563EB" : "#111827"}
                    stroke="#2563EB"
                    strokeWidth="2.5"
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredWeek(idx)}
                    onMouseLeave={() => setHoveredWeek(null)}
                  />
                ))}

                {hoveredWeek !== null && (
                  <g>
                    <rect x="140" y="10" width="120" height="24" rx="4" fill="#1A2332" stroke="#273244" />
                    <text x="200" y="25" fill="#F3F4F6" fontSize="9" fontWeight="bold" textAnchor="middle">
                      Week {hoveredWeek + 1}: {[25, 50, 93, 130, 155][hoveredWeek]} cases
                    </text>
                  </g>
                )}
              </svg>
            </CardContent>
          </Card>

          {/* Department Resolution SLA bar Chart */}
          <Card className="print-card bg-[#111827] border-[#273244]">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-[#16A34A]" />
                <CardTitle className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wider">Department Resolution SLA</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {/* Custom SVG Bar Chart */}
              <svg viewBox="0 0 400 180" className="w-full h-auto">
                <line x1="40" y1="150" x2="380" y2="150" stroke="#273244" strokeWidth="1" />
                
                <text x="12" y="152" fill="#6B7280" fontSize="9" fontWeight="bold">0%</text>
                <text x="10" y="90" fill="#6B7280" fontSize="9" fontWeight="bold">50%</text>
                <text x="8" y="28" fill="#6B7280" fontSize="9" fontWeight="bold">100%</text>

                {[
                  { name: "Roads", rate: 96 },
                  { name: "Water", rate: 94 },
                  { name: "Power", rate: 91 },
                  { name: "Waste", rate: 92 },
                  { name: "Drainage", rate: 88 }
                ].map((dept, i) => {
                  const barWidth = 24;
                  const gap = 44;
                  const x = 60 + i * (barWidth + gap);
                  const height = (dept.rate / 100) * 120;
                  const y = 150 - height;
                  const isHovered = hoveredDept === i;
                  return (
                    <g 
                      key={dept.name}
                      className="cursor-pointer"
                      onMouseEnter={() => setHoveredDept(i)}
                      onMouseLeave={() => setHoveredDept(null)}
                    >
                      <rect 
                        x={x} 
                        y={y} 
                        width={barWidth} 
                        height={height} 
                        rx="3" 
                        fill={isHovered ? "#22C55E" : "#16A34A"} 
                        fillOpacity={isHovered ? "1" : "0.85"} 
                      />
                      <text x={x + barWidth / 2} y="165" fill="#6B7280" fontSize="8" fontWeight="bold" textAnchor="middle">{dept.name}</text>
                      <text x={x + barWidth / 2} y={y - 6} fill={isHovered ? "#22C55E" : "#F3F4F6"} fontSize="9" fontWeight="bold" textAnchor="middle">{dept.rate}%</text>
                    </g>
                  );
                })}

                {hoveredDept !== null && (
                  <g>
                    <rect x="140" y="10" width="120" height="24" rx="4" fill="#1A2332" stroke="#273244" />
                    <text x="200" y="25" fill="#F3F4F6" fontSize="9" fontWeight="bold" textAnchor="middle">
                      SLA Hit: {[96, 94, 91, 92, 88][hoveredDept]}%
                    </text>
                  </g>
                )}
              </svg>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
};

export default ExecutivePage;
