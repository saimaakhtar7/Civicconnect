import React, { useState } from "react";
import { 
  Building, Users, Activity 
} from "lucide-react";

// Local static mock officers list
const OFFICERS_DATA = [
  { id: "OFF-RD-014", name: "Officer Vikram", dept: "Roads & Infrastructure", status: "Active Dispatch", load: 3, phone: "+91 98230 11044", rating: 4.8 },
  { id: "OFF-WT-003", name: "Officer Suresh", dept: "Water Supply & Sewerage", status: "On Duty", load: 2, phone: "+91 98811 02931", rating: 4.6 },
  { id: "OFF-SW-021", name: "Officer K. Patil", dept: "Solid Waste Management", status: "Active Dispatch", load: 4, phone: "+91 95450 32187", rating: 4.7 },
  { id: "OFF-PK-008", name: "Officer S. Deshpande", dept: "Parks & Recreation", status: "Standby", load: 0, phone: "+91 99224 88310", rating: 4.9 },
  { id: "OFF-DR-011", name: "Officer R. Shinde", dept: "Drainage Department", status: "Active Dispatch", load: 3, phone: "+91 94220 54321", rating: 4.5 }
];

export const SituationRoomPage: React.FC = () => {
  const [selectedDept, setSelectedDept] = useState<string>("all");

  const depts = [
    { name: "Roads & Infrastructure", code: "Roads", workload: 86, critical: 32, active: 4, sla: "2.1 hrs", capacity: "92%" },
    { name: "Water Supply & Sewerage", code: "Water", workload: 45, critical: 18, active: 3, sla: "3.4 hrs", capacity: "78%" },
    { name: "Electricity Department", code: "Electricity", workload: 32, critical: 12, active: 2, sla: "1.8 hrs", capacity: "65%" },
    { name: "Solid Waste Management", code: "Waste", workload: 28, critical: 14, active: 3, sla: "4.2 hrs", capacity: "84%" },
    { name: "Drainage Department", code: "Drainage", workload: 36, critical: 8, active: 2, sla: "3.0 hrs", capacity: "70%" },
    { name: "Traffic Management", code: "Traffic", workload: 42, critical: 14, active: 3, sla: "2.3 hrs", capacity: "80%" }
  ];

  const filteredDepts = selectedDept === "all" ? depts : depts.filter((d) => d.code === selectedDept);

  return (
    <div className="space-y-6 pb-12 select-none text-left">
      
      {/* Page Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Building className="w-4 h-4 text-[#16A34A]" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#16A34A]">Governance Hierarchy</span>
        </div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Departments Performance Workspace</h1>
        <p className="text-sm text-[#9CA3AF] font-medium leading-none">
          Live inter-department workloads, officer dispatch availability, and SLA capacities.
        </p>
      </div>

      {/* Selector Filters */}
      <div className="bg-[#111827] border border-[#273244] rounded-xl p-4.5 flex gap-2">
        <button 
          onClick={() => setSelectedDept("all")}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            selectedDept === "all" ? "bg-[#16A34A] text-white" : "bg-[#1A2332] text-[#9CA3AF] border border-[#273244] hover:text-white"
          }`}
        >
          All Departments
        </button>
        {depts.map((d) => (
          <button
            key={d.code}
            onClick={() => setSelectedDept(d.code)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              selectedDept === d.code ? "bg-[#16A34A] text-white" : "bg-[#1A2332] text-[#9CA3AF] border border-[#273244] hover:text-white"
            }`}
          >
            {d.code}
          </button>
        ))}
      </div>

      {/* Grid of Department Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {filteredDepts.map((dept, idx) => (
          <div key={idx} className="bg-[#111827] border border-[#273244] rounded-xl p-5 shadow-sm space-y-4 text-left">
            <div className="flex justify-between items-start border-b border-[#273244]/55 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white truncate max-w-[170px]" title={dept.name}>{dept.name}</h3>
                <span className="text-[10px] font-bold text-[#6B7280] font-mono block mt-0.5">DEP-{dept.code.toUpperCase()}</span>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${
                parseInt(dept.capacity) > 85 ? "bg-[#DC2626]/10 border-[#DC2626]/20 text-[#DC2626]" :
                parseInt(dept.capacity) > 70 ? "bg-[#F59E0B]/10 border-[#F59E0B]/20 text-[#F59E0B]" :
                "bg-[#16A34A]/10 border-[#16A34A]/25 text-[#16A34A]"
              }`}>
                {dept.capacity} Cap
              </span>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-[#1A2332] border border-[#273244] p-2.5 rounded-lg">
                <span className="text-[9px] font-bold text-[#6B7280] uppercase tracking-wider block">Workload</span>
                <span className="text-base font-bold text-[#F3F4F6] font-mono mt-0.5 block">{dept.workload} Open</span>
              </div>
              <div className="bg-[#1A2332] border border-[#273244] p-2.5 rounded-lg">
                <span className="text-[9px] font-bold text-[#6B7280] uppercase tracking-wider block">Critical</span>
                <span className="text-base font-bold text-[#DC2626] font-mono mt-0.5 block">{dept.critical} P0</span>
              </div>
              <div className="bg-[#1A2332] border border-[#273244] p-2.5 rounded-lg">
                <span className="text-[9px] font-bold text-[#6B7280] uppercase tracking-wider block">Active Officers</span>
                <span className="text-base font-bold text-[#2563EB] font-mono mt-0.5 block">{dept.active} Active</span>
              </div>
              <div className="bg-[#1A2332] border border-[#273244] p-2.5 rounded-lg">
                <span className="text-[9px] font-bold text-[#6B7280] uppercase tracking-wider block">Average SLA</span>
                <span className="text-base font-bold text-[#F59E0B] font-mono mt-0.5 block">{dept.sla}</span>
              </div>
            </div>

            {/* Performance Capacity progress slider */}
            <div className="space-y-1.5 select-none pt-1">
              <div className="flex justify-between text-[10px] font-bold">
                <span className="text-[#9CA3AF]">Capacity Load Utilization</span>
                <span className="text-[#F3F4F6]">{dept.capacity}</span>
              </div>
              <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden border border-white/5">
                <div 
                  className={`h-full rounded-full transition-all duration-300 ${
                    parseInt(dept.capacity) > 85 ? "bg-[#DC2626]" :
                    parseInt(dept.capacity) > 70 ? "bg-[#F59E0B]" :
                    "bg-[#16A34A]"
                  }`} 
                  style={{ width: dept.capacity }} 
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Columns: Roster and Load heat indicator */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
        
        {/* Left: Active Roster */}
        <div className="lg:col-span-6 bg-[#111827] border border-[#273244] rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex justify-between items-center pb-2.5 border-b border-[#273244]/55">
            <h3 className="text-[15px] font-semibold text-[#F3F4F6] flex items-center gap-1.5">
              <Users className="w-4 h-4 text-[#9CA3AF]" /> Active Officers Dispatch Roster
            </h3>
            <span className="text-[10px] font-bold text-[#6B7280] font-mono">STATUS TELEMETRY</span>
          </div>

          <div className="space-y-2.5">
            {OFFICERS_DATA.map((off) => (
              <div key={off.id} className="p-3 bg-[#1A2332]/45 border border-[#273244] rounded-xl flex items-center justify-between text-xs hover:bg-[#1A2332] transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#0A0F17] border border-[#273244] flex items-center justify-center font-bold text-xs text-[#16A34A]">
                    {off.name.split(" ")[1].slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <span className="block font-bold text-[#F3F4F6]">{off.name}</span>
                    <span className="block text-[10px] text-[#6B7280] mt-0.5">{off.dept} · {off.id}</span>
                  </div>
                </div>
                
                <div className="text-right space-y-1">
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${
                    off.status === "On Duty" ? "bg-[#16A34A]/10 border-[#16A34A]/25 text-[#16A34A]" :
                    off.status === "Standby" ? "bg-[#2563EB]/10 border-[#2563EB]/20 text-[#2563EB]" :
                    "bg-[#F59E0B]/10 border-[#F59E0B]/20 text-[#F59E0B]"
                  }`}>
                    {off.status}
                  </span>
                  <span className="block text-[9px] text-[#9CA3AF] font-semibold">Active workload: {off.load} issues</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Ward Heatmap Load Indicator */}
        <div className="lg:col-span-4 bg-[#111827] border border-[#273244] rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex justify-between items-center pb-2.5 border-b border-[#273244]/55">
            <h3 className="text-[15px] font-semibold text-[#F3F4F6] flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-[#9CA3AF]" /> Regional Ward Load Rating
            </h3>
            <span className="text-[10px] font-bold text-[#6B7280] font-mono">SECTOR HEATMAP</span>
          </div>

          <div className="space-y-2.5 text-xs text-[#9CA3AF]">
            {[
              { name: "Koregaon Park", rating: "Excellent", pct: 20, color: "bg-[#16A34A]" },
              { name: "Shivajinagar", rating: "Moderate", pct: 54, color: "bg-[#F59E0B]" },
              { name: "Kothrud", rating: "Excellent", pct: 15, color: "bg-[#16A34A]" },
              { name: "Viman Nagar", rating: "Critical", pct: 88, color: "bg-[#DC2626]" },
              { name: "Swargate", rating: "High Load", pct: 72, color: "bg-orange-500" },
              { name: "Camp Area", rating: "Moderate", pct: 40, color: "bg-[#F59E0B]" }
            ].map((ward, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between font-semibold">
                  <span className="text-[#F3F4F6] font-bold">{ward.name}</span>
                  <span>{ward.rating} ({ward.pct}%)</span>
                </div>
                <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden border border-white/5">
                  <div className={`h-full rounded-full ${ward.color}`} style={{ width: `${ward.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};

export default SituationRoomPage;
