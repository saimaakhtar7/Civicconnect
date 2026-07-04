import React, { useState } from "react";
import { 
  BarChart3, Calendar, Building, MapPin, 
  TrendingUp, Clock, CheckCircle2 
} from "lucide-react";

export const AnalyticsPage: React.FC = () => {
  const [selectedDept, setSelectedDept] = useState<string>("all");
  const [selectedWard, setSelectedWard] = useState<string>("all");
  const [timeRange, setTimeRange] = useState<string>("7d");
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);

  // Dynamic values depending on filter states
  const getFilteredMetrics = () => {
    let multiplier = 1;
    if (selectedDept !== "all") multiplier *= 0.35;
    if (selectedWard !== "all") multiplier *= 0.2;
    if (timeRange === "24h") multiplier *= 0.15;
    if (timeRange === "30d") multiplier *= 3.8;

    return {
      volume: Math.round(287 * multiplier),
      resolved: Math.round(198 * multiplier),
      sla: (96.4 - (selectedDept !== "all" ? 1.5 : 0)).toFixed(1) + "%",
      speed: (1.4 * (selectedWard !== "all" ? 0.9 : 1.0)).toFixed(1) + " hrs"
    };
  };

  const metrics = getFilteredMetrics();

  // Weekly values for chart
  const chartPoints = [
    { day: "Mon", count: 32 },
    { day: "Tue", count: 45 },
    { day: "Wed", count: 38 },
    { day: "Thu", count: 54 },
    { day: "Fri", count: 48 },
    { day: "Sat", count: 60 },
    { day: "Sun", count: 58 }
  ];

  const maxVal = 70;
  const chartHeight = 110;
  const chartWidth = 350;

  return (
    <div className="space-y-6 pb-12 select-none text-left">
      
      {/* Page Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-[#16A34A]" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#16A34A]">Governance Intelligence</span>
        </div>
        <h1 className="text-3xl font-bold text-white tracking-tight">System Performance Analytics</h1>
        <p className="text-sm text-[#9CA3AF] font-medium leading-none">
          Statistical visualization of response latencies, SLA compliances, and localized incident reports.
        </p>
      </div>

      {/* Control Filters Block */}
      <div className="bg-[#111827] border border-[#273244] rounded-xl p-4.5 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Department Filter */}
          <div className="space-y-1.5 text-left">
            <span className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5" /> Department Filter
            </span>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full bg-[#1A2332] border border-[#273244] rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-[#16A34A]/50 transition-colors cursor-pointer"
            >
              <option value="all">All Departments</option>
              <option value="Roads">Roads & Infrastructure</option>
              <option value="Water">Water Supply & Sewerage</option>
              <option value="Electricity">Electricity Department</option>
              <option value="Waste">Solid Waste Management</option>
              <option value="Drainage">Drainage Department</option>
              <option value="Traffic">Traffic Management</option>
            </select>
          </div>

          {/* Ward Filter */}
          <div className="space-y-1.5 text-left">
            <span className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" /> Sector / Ward
            </span>
            <select
              value={selectedWard}
              onChange={(e) => setSelectedWard(e.target.value)}
              className="w-full bg-[#1A2332] border border-[#273244] rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-[#16A34A]/50 transition-colors cursor-pointer"
            >
              <option value="all">All Wards</option>
              <option value="Koregaon Park">Koregaon Park</option>
              <option value="Shivajinagar">Shivajinagar</option>
              <option value="Kothrud">Kothrud</option>
              <option value="Viman Nagar">Viman Nagar</option>
              <option value="Swargate">Swargate</option>
              <option value="Camp Area">Camp Area</option>
              <option value="Aundh">Aundh</option>
            </select>
          </div>

          {/* Timeframe Filter */}
          <div className="space-y-1.5 text-left">
            <span className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" /> Reporting Window
            </span>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="w-full bg-[#1A2332] border border-[#273244] rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-[#16A34A]/50 transition-colors cursor-pointer"
            >
              <option value="24h">Today (24h)</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </select>
          </div>

        </div>
      </div>

      {/* Grid of Dynamic Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Reported Volume", value: metrics.volume, desc: "Incidents in filter range", icon: TrendingUp, color: "text-[#2563EB]" },
          { label: "Resolved Backlog", value: metrics.resolved, desc: "Completed tasks share", icon: CheckCircle2, color: "text-[#16A34A]" },
          { label: "SLA Response Rate", value: metrics.sla, desc: "Target timeline hit", icon: Clock, color: "text-[#F59E0B]" },
          { label: "Avg Resolution Velocity", value: metrics.speed, desc: "Triage dispatch clearance", icon: Clock, color: "text-purple-400" }
        ].map((item, idx) => (
          <div key={idx} className="bg-[#111827] border border-[#273244] rounded-xl p-4.5 shadow-sm text-left">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider block">{item.label}</span>
              <item.icon className={`w-4 h-4 ${item.color}`} />
            </div>
            <span className="text-2xl font-bold font-mono text-[#F3F4F6] block mt-1.5 leading-none">{item.value}</span>
            <span className="text-[10px] text-[#9CA3AF] font-semibold mt-1.5 block leading-none">{item.desc}</span>
          </div>
        ))}
      </div>

      {/* Visual Charts Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
        
        {/* Weekly Trend Chart (6/10 Width) */}
        <div className="lg:col-span-6 bg-[#111827] border border-[#273244] rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex justify-between items-center pb-2.5 border-b border-[#273244]/55">
            <div className="space-y-0.5">
              <h3 className="text-[15px] font-semibold text-[#F3F4F6] leading-none">Weekly Incident Trend</h3>
              <span className="text-[11px] font-medium text-[#6B7280] block">Consolidated reports density graph.</span>
            </div>
            {hoveredPoint !== null && (
              <span className="text-[10px] font-bold font-mono text-[#16A34A] bg-[#16A34A]/5 border border-[#16A34A]/25 px-2.5 py-0.5 rounded-full">
                {chartPoints[hoveredPoint].day}: {chartPoints[hoveredPoint].count} incidents
              </span>
            )}
          </div>

          {/* SVG Line Graph */}
          <div className="relative pt-2">
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto">
              <defs>
                <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#16A34A" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#16A34A" stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* Gridlines */}
              <line x1="30" y1="90" x2="330" y2="90" stroke="#273244" strokeWidth="0.5" strokeDasharray="3,3" />
              <line x1="30" y1="60" x2="330" y2="60" stroke="#273244" strokeWidth="0.5" strokeDasharray="3,3" />
              <line x1="30" y1="30" x2="330" y2="30" stroke="#273244" strokeWidth="0.5" strokeDasharray="3,3" />
              <line x1="30" y1="100" x2="330" y2="100" stroke="#273244" strokeWidth="1" />

              {/* Y Axis labels */}
              <text x="12" y="93" fill="#6B7280" fontSize="8" fontWeight="bold">20</text>
              <text x="12" y="63" fill="#6B7280" fontSize="8" fontWeight="bold">40</text>
              <text x="12" y="33" fill="#6B7280" fontSize="8" fontWeight="bold">60</text>

              {/* Chart plotting paths */}
              {(() => {
                const pointsStr = chartPoints.map((p, idx) => {
                  const x = 40 + idx * 45;
                  const y = 100 - (p.count / maxVal) * 80;
                  return `${x},${y}`;
                }).join(" ");

                const areaPath = `M 40,100 L ${pointsStr} L 310,100 Z`;
                const linePath = `M ${pointsStr}`;

                return (
                  <>
                    <path d={areaPath} fill="url(#trendGrad)" />
                    <path d={linePath} fill="none" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </>
                );
              })()}

              {/* Hoverable Interactive circles */}
              {chartPoints.map((p, idx) => {
                const x = 40 + idx * 45;
                const y = 100 - (p.count / maxVal) * 80;
                return (
                  <g key={idx} className="cursor-pointer">
                    <circle
                      cx={x}
                      cy={y}
                      r="4.5"
                      fill={hoveredPoint === idx ? "#16A34A" : "#111827"}
                      stroke="#16A34A"
                      strokeWidth="2"
                      onMouseEnter={() => setHoveredPoint(idx)}
                      onMouseLeave={() => setHoveredPoint(null)}
                    />
                    <text x={x} y="112" fill="#6B7280" fontSize="8" fontWeight="bold" textAnchor="middle">{p.day}</text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Department Response times (4/10 Width) */}
        <div className="lg:col-span-4 bg-[#111827] border border-[#273244] rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex justify-between items-center pb-2.5 border-b border-[#273244]/55">
            <div className="space-y-0.5">
              <h3 className="text-[15px] font-semibold text-[#F3F4F6] leading-none">Response SLA Speed</h3>
              <span className="text-[11px] font-medium text-[#6B7280] block">Average hours taken per department.</span>
            </div>
            <span className="text-[10px] font-mono font-bold text-[#6B7280]">TARGET: 4.0H</span>
          </div>

          <div className="space-y-3.5 text-xs text-[#9CA3AF] pt-1">
            {[
              { dept: "Roads & Infra", hours: 2.1, max: 8 },
              { dept: "Water Supply", hours: 3.4, max: 8 },
              { dept: "Electricity", hours: 1.8, max: 8 },
              { dept: "Solid Waste", hours: 4.2, max: 8 },
              { dept: "Drainage Dept", hours: 3.0, max: 8 }
            ].map((item, idx) => {
              const pct = (item.hours / item.max) * 100;
              return (
                <div key={idx} className="space-y-1 select-none text-left">
                  <div className="flex justify-between font-semibold">
                    <span className="text-[#F3F4F6] font-bold">{item.dept}</span>
                    <span className="font-mono text-[#F3F4F6]">{item.hours} hrs</span>
                  </div>
                  <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden border border-white/5 relative">
                    <div 
                      className={`h-full rounded-full ${
                        item.hours > 4 ? "bg-[#DC2626]" : "bg-[#2563EB]"
                      }`} 
                      style={{ width: `${pct}%` }} 
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Ward Comparison Matrix */}
      <div className="bg-[#111827] border border-[#273244] rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex justify-between items-center pb-2.5 border-b border-[#273244]/55">
          <h3 className="text-[15px] font-semibold text-[#F3F4F6]">Ward Incident Comparison Ranks</h3>
          <span className="text-[10px] font-bold text-[#6B7280] font-mono">DENSITY METRIC</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { name: "Viman Nagar", load: "Critical Load", val: 88, color: "text-[#DC2626]" },
            { name: "Shivajinagar", load: "Moderate Load", val: 54, color: "text-[#F59E0B]" },
            { name: "Kothrud", load: "Excellent Status", val: 15, color: "text-[#16A34A]" }
          ].map((item, idx) => (
            <div key={idx} className="p-3 bg-[#1A2332]/45 border border-[#273244] rounded-xl flex items-center justify-between">
              <div className="text-left leading-tight">
                <span className="block font-bold text-[#F3F4F6] text-xs">{item.name}</span>
                <span className="text-[10px] text-[#6B7280] font-bold block mt-0.5">{item.load}</span>
              </div>
              <span className={`text-lg font-black font-mono ${item.color}`}>{item.val}%</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default AnalyticsPage;
