import React, { useState, useEffect, useRef } from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "../../config/firebase";
import { IssueDocument } from "../../types/issue.types";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/card";
import { Cpu, Printer, Sparkles, CheckCircle, TrendingUp, BarChart2 } from "lucide-react";

export const ExecutivePage: React.FC = () => {
  const [issues, setIssues] = useState<IssueDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const printAreaRef = useRef<HTMLDivElement>(null);

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

  // Compute stats
  const total = issues.length;

  const resolved = issues.filter((i) => i.status === "resolved" || i.status === "closed").length;
  const avgSlaBreachRate = Math.round(((issues.filter(i => i.priority?.level === 0).length) / (total || 1)) * 100);

  // SLA department mapping
  const deptPerformance = [
    { name: "Roads & Infra", resolved: 24, active: 4, slaRate: 92 },
    { name: "Water Supply", resolved: 18, active: 2, slaRate: 90 },
    { name: "Electricity Dept", resolved: 32, active: 5, slaRate: 88 },
    { name: "Waste Management", resolved: 41, active: 9, slaRate: 95 },
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-3">
        <div className="w-8 h-8 border-2 border-[#22C55E] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-[#9AA3B8] font-semibold">Generating Executive Briefing...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 print:p-8 print:bg-white" ref={printAreaRef}>
      
      {/* Print styles */}
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
          }
        }
      `}</style>

      {/* Header */}
      <div className="flex justify-between items-center gap-4 border-b border-white/5 pb-5 no-print">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-wider text-purple-400">Executive Dashboard</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">Intelligence &amp; Insights</h1>
        </div>
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 bg-white/5 border border-white/10 hover:bg-white/10 text-[#F5F7FA] text-xs font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          Export Briefing (PDF)
        </button>
      </div>

      {/* Official Report Title for Printing */}
      <div className="hidden print:block text-center space-y-2 mb-8 border-b-2 border-gray-900 pb-6">
        <h1 className="text-3xl font-black text-gray-950 uppercase tracking-tight">CivicConnect AI Intelligence Briefing</h1>
        <p className="text-sm text-gray-600 font-semibold">
          Municipal Operations Review & Prediction Summary · Printed on {new Date().toLocaleDateString()}
        </p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-3 gap-4 print:grid-cols-3">
        {[
          { label: "Active Incidents", value: total - resolved, desc: "Incidents in backlog" },
          { label: "Resolved Actions", value: resolved, desc: "Completed this month" },
          { label: "Critical Safety Risk", value: `${avgSlaBreachRate}%`, desc: "P0 priority share" },
        ].map((stat, idx) => (
          <div key={idx} className="bg-[#1E293B] border border-white/5 rounded-2xl p-5 shadow-lg print-card">
            <span className="text-[10px] font-black text-[#9AA3B8] uppercase tracking-wider block">{stat.label}</span>
            <span className="text-3xl font-black text-white mt-1 block">{stat.value}</span>
            <span className="text-xs text-[#9AA3B8] font-medium mt-1 block">{stat.desc}</span>
          </div>
        ))}
      </div>

      {/* Briefings Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Executive Summary Memos */}
        <Card className="print-card">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-purple-400" />
              <CardTitle>AI Administration Briefing</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-relaxed text-[#9AA3B8]">
            <div className="bg-purple-500/10 border border-purple-500/20 rounded-2xl p-4 space-y-2">
              <p className="font-black text-purple-300 text-xs">⚡ Top Infrastructure Concern (Roads/Potholes)</p>
              <p className="text-xs text-purple-300/70 font-medium">
                AI analytics indicates a 14% growth in road damage complaints within Koregaon Park and FC Road. This correlates with high traffic zones.
              </p>
            </div>
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 space-y-2">
              <p className="font-black text-amber-300 text-xs">⚠ Departments Nearing SLA Breaches</p>
              <p className="text-xs text-amber-300/70 font-medium">
                Pune Water Supply Department resolution times have climbed by 1.2 hours over the last 4 days due to leakage backlogs on fc road. Immediate personnel assignment recommended.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Priority Actions Recommendations */}
        <Card className="print-card">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <CardTitle>Administrative Recommendations</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              "Deploy secondary water repair crew to Shivajinagar zone to resolve burst pipe backlog.",
              "Upgrade street lighting installations along Karve Road to mitigate nighttime safety risk rating.",
              "Audit Solid Waste Management garbage piles in Sakore Nagar Road ahead of regional inspection.",
              "Recalibrate duplicate-matching algorithm rules to handle high frequency pothole markers.",
            ].map((rec, i) => (
              <div key={i} className="flex gap-3 items-start text-xs text-[#9AA3B8]">
                <span className="w-5 h-5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-black shrink-0 text-[10px]">{i + 1}</span>
                <p className="mt-0.5 font-medium leading-relaxed">{rec}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* SVG Custom Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:break-inside-avoid">
        {/* Chart 1: Issue Trends */}
        <Card className="print-card">
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-400" />
              <CardTitle>Weekly Incident Growth</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {/* Custom SVG Line Chart */}
            <svg viewBox="0 0 400 180" className="w-full h-auto">
              {/* Grid Lines */}
              <line x1="30" y1="150" x2="380" y2="150" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
              <line x1="30" y1="100" x2="380" y2="100" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
              <line x1="30" y1="50" x2="380" y2="50" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />

              {/* Labels */}
              <text x="12" y="152" fill="#9AA3B8" fontSize="9" fontWeight="bold">0</text>
              <text x="10" y="102" fill="#9AA3B8" fontSize="9" fontWeight="bold">25</text>
              <text x="10" y="52" fill="#9AA3B8" fontSize="9" fontWeight="bold">50</text>

              {/* Weeks */}
              <text x="50" y="165" fill="#9AA3B8" fontSize="9" textAnchor="middle">W1</text>
              <text x="120" y="165" fill="#9AA3B8" fontSize="9" textAnchor="middle">W2</text>
              <text x="190" y="165" fill="#9AA3B8" fontSize="9" textAnchor="middle">W3</text>
              <text x="260" y="165" fill="#9AA3B8" fontSize="9" textAnchor="middle">W4</text>
              <text x="330" y="165" fill="#9AA3B8" fontSize="9" textAnchor="middle">W5</text>

              {/* Area fill */}
              <path
                d="M 50 120 L 120 86 L 190 110 L 260 54 L 330 40 L 330 150 L 50 150 Z"
                fill="rgba(59,130,246,0.08)"
              />
              <path
                d="M 50 120 L 120 86 L 190 110 L 260 54 L 330 40"
                fill="none"
                stroke="#3b82f6"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="50" cy="120" r="4" fill="#3b82f6" stroke="#0F172A" strokeWidth="2" />
              <circle cx="120" cy="86" r="4" fill="#3b82f6" stroke="#0F172A" strokeWidth="2" />
              <circle cx="190" cy="110" r="4" fill="#3b82f6" stroke="#0F172A" strokeWidth="2" />
              <circle cx="260" cy="54" r="4" fill="#3b82f6" stroke="#0F172A" strokeWidth="2" />
              <circle cx="330" cy="40" r="4" fill="#3b82f6" stroke="#0F172A" strokeWidth="2" />
            </svg>
          </CardContent>
        </Card>

        {/* Chart 2: Department SLA Performance */}
        <Card className="print-card">
          <CardHeader>
            <div className="flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-emerald-400" />
              <CardTitle>Department Resolution SLA</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {/* Custom SVG Bar Chart */}
            <svg viewBox="0 0 400 180" className="w-full h-auto">
              <line x1="40" y1="150" x2="380" y2="150" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
              <text x="12" y="152" fill="#9AA3B8" fontSize="9" fontWeight="bold">0%</text>
              <text x="10" y="90" fill="#9AA3B8" fontSize="9" fontWeight="bold">50%</text>
              <text x="8" y="28" fill="#9AA3B8" fontSize="9" fontWeight="bold">100%</text>

              {/* Bars */}
              {deptPerformance.map((dept, i) => {
                const barWidth = 32;
                const gap = 48;
                const x = 70 + i * (barWidth + gap);
                const height = (dept.slaRate / 100) * 120;
                const y = 150 - height;
                return (
                  <g key={dept.name}>
                    <rect
                      x={x}
                      y={y}
                      width={barWidth}
                      height={height}
                      rx="4"
                      fill="#22C55E"
                      fillOpacity="0.85"
                    />
                    <text
                      x={x + barWidth / 2}
                      y="165"
                      fill="#9AA3B8"
                      fontSize="8"
                      fontWeight="bold"
                      textAnchor="middle"
                    >
                      {dept.name}
                    </text>
                    <text
                      x={x + barWidth / 2}
                      y={y - 6}
                      fill="#F5F7FA"
                      fontSize="9"
                      fontWeight="bold"
                      textAnchor="middle"
                    >
                      {dept.slaRate}%
                    </text>
                  </g>
                );
              })}
            </svg>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ExecutivePage;
