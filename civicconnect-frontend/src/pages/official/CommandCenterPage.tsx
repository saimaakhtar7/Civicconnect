import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { collection, query, onSnapshot, orderBy, doc, updateDoc } from "firebase/firestore";
import { db } from "../../config/firebase";
import { IssueDocument } from "../../types/issue.types";
import { AnimatePresence } from "framer-motion";
import { 
  Cpu, AlertCircle, CheckCircle2, Clock, Activity, Zap, 
  ArrowRight, ArrowUpRight, ShieldAlert, 
  User, RefreshCw, ClipboardList,
  Camera, Layers, AlertTriangle, GitBranch, UserCheck, Truck, Bell, FileImage, MessageSquare
} from "lucide-react";
import { IssueDetailDrawer } from "../../components/official/IssueDetailDrawer";

// Custom sparkline renderer (Grafana style)
const MiniSparkline: React.FC<{ type: "up" | "down" | "critical" }> = ({ type }) => {
  if (type === "up") {
    return (
      <svg className="w-16 h-6 text-[#16A34A] stroke-current stroke-2 shrink-0 select-none" viewBox="0 0 40 20" fill="none">
        <path d="M 0,16 L 8,15 L 16,17 L 24,10 L 32,12 L 40,3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (type === "down") {
    return (
      <svg className="w-16 h-6 text-[#16A34A] stroke-current stroke-2 shrink-0 select-none" viewBox="0 0 40 20" fill="none">
        <path d="M 0,3 L 8,5 L 16,4 L 24,11 L 32,9 L 40,16" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg className="w-16 h-6 text-[#DC2626] stroke-current stroke-2 shrink-0 select-none" viewBox="0 0 40 20" fill="none">
      <path d="M 0,17 L 8,14 L 16,11 L 24,6 L 32,5 L 40,2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

// Redesigned Card KPI
const KpiCard: React.FC<{
  label: string;
  value: string;
  subtext: string;
  trendType: "up" | "down" | "critical";
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
}> = ({ label, value, subtext, trendType, icon: Icon, iconColor, iconBg }) => (
  <div className="bg-[#111827] border border-[#273244] rounded-xl p-4.5 flex justify-between items-start transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(0,0,0,0.18)] select-none">
    <div className="space-y-1 text-left min-w-0">
      <span className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider block">{label}</span>
      <span className="block text-2xl font-bold text-[#F3F4F6] tracking-tight leading-none font-mono">{value}</span>
      <span className="block text-[11px] font-semibold text-[#9CA3AF] truncate leading-none mt-1.5">{subtext}</span>
    </div>
    <div className="flex flex-col items-end justify-between h-full space-y-4">
      <div className={`p-1.5 rounded-lg border border-[#273244] ${iconBg} ${iconColor} shrink-0`}>
        <Icon className="w-4 h-4" />
      </div>
      <MiniSparkline type={trendType} />
    </div>
  </div>
);

export const CommandCenterPage: React.FC = () => {
  const [issues, setIssues] = useState<IssueDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIssue, setSelectedIssue] = useState<IssueDocument | null>(null);
  const navigate = useNavigate();

  const containerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  // Quick Action Modal States
  const [activeModal, setActiveModal] = useState<"follow_up" | "assign" | "rerun" | "broadcast" | null>(null);
  const [followUpNotes, setFollowUpNotes] = useState("");
  const [followUpComment, setFollowUpComment] = useState("");
  const [assignIssueId, setAssignIssueId] = useState("");
  const [assignDept, setAssignDept] = useState("Roads & Infrastructure");
  const [assignOfficer, setAssignOfficer] = useState("Officer Vikram");
  const [assignPriority, setAssignPriority] = useState("high");
  const [rerunProcessing, setRerunProcessing] = useState(false);
  const [rerunResult, setRerunResult] = useState<string | null>(null);
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [broadcastSubmitting, setBroadcastSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [hoveredPendingId, setHoveredPendingId] = useState<string | null>(null);

  const handleHoverCard = (issueId: string | null, issue?: IssueDocument) => {
    setHoveredPendingId(issueId);
    if (!mapInstanceRef.current) return;
    
    if (issueId && issue && issue.location?.lat) {
      const match = markersRef.current.find(m => m.id === issueId);
      if (match && match.markerObj) {
        match.markerObj.openPopup();
      }
    } else {
      mapInstanceRef.current.closePopup();
    }
  };

  // 1. Fetch Issues
  useEffect(() => {
    const issuesRef = collection(db, "issues");
    const q = query(issuesRef, orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(q, (snap) => {
      const list: IssueDocument[] = [];
      snap.forEach((doc) => {
        list.push(doc.data() as IssueDocument);
      });
      setIssues(list);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 2. Initialize Leaflet Map
  useEffect(() => {
    if (loading || !containerRef.current) return;

    let active = true;
    let map: any = null;

    const loadLeaflet = () => {
      if (!document.getElementById("leaflet-css")) {
        const link = document.createElement("link");
        link.id = "leaflet-css";
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        link.crossOrigin = "";
        document.head.appendChild(link);
      }

      if ((window as any).L) {
        initMap((window as any).L);
      } else {
        const script = document.createElement("script");
        script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
        script.crossOrigin = "";
        script.onload = () => {
          if (active && (window as any).L) {
            initMap((window as any).L);
          }
        };
        document.head.appendChild(script);
      }
    };

    const initMap = (L: any) => {
      if (!containerRef.current || mapInstanceRef.current) return;

      map = L.map(containerRef.current, {
        center: [18.5204, 73.8567],
        zoom: 12,
        zoomControl: false,
        attributionControl: false,
      });

      mapInstanceRef.current = map;

      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        maxZoom: 20,
      }).addTo(map);

      // Add Zoom control at bottom right
      L.control.zoom({ position: "bottomright" }).addTo(map);

      // Plot incident markers
      plotMarkers(L, map);
    };

    const plotMarkers = (L: any, mapObj: any) => {
      // Clear existing markers
      markersRef.current.forEach((m) => m.markerObj ? m.markerObj.remove() : m.remove?.());
      markersRef.current = [];

      issues.forEach((issue) => {
        if (!issue.location?.lat || !issue.location?.lng) return;

        const isCritical = issue.aiAnalysis?.severity === "critical";
        const isResolved = issue.status === "resolved" || issue.status === "closed";

        // Create Custom HTML Marker element
        const divElement = document.createElement("div");
        divElement.className = `civic-map-marker marker-${issue.aiAnalysis?.severity || "medium"} ${
          isResolved ? "marker-resolved" : ""
        }`;

        // Blinking pulse ring for critical issues
        divElement.innerHTML = `
          ${isCritical && !isResolved ? '<span class="marker-pulse"></span>' : ""}
          <span class="marker-dot"></span>
        `;

        const markerIcon = L.divIcon({
          html: divElement,
          className: "",
          iconSize: [28, 28],
        });

        const tooltipContent = `
          <div class="p-2 font-sans text-xs text-[#F3F4F6] bg-[#111827] border border-[#273244] rounded-lg shadow-md space-y-1 text-left leading-none" style="min-width: 150px;">
            <div class="font-bold text-[#F3F4F6] truncate max-w-[140px]">${issue.aiAnalysis?.subcategory || "Civic Incident"}</div>
            <div class="text-[9px] text-[#9CA3AF] font-bold mt-1">Ward: ${issue.location?.ward}</div>
            <div class="text-[9px] text-[#9CA3AF]">Priority: ${issue.aiAnalysis?.severity?.toUpperCase()}</div>
            <div class="text-[9px] text-[#9CA3AF]">Status: ${issue.status.replace("_", " ")}</div>
            <button class="mt-2 w-full text-center text-[9px] font-bold text-white bg-[#16A34A] hover:bg-[#16A34A]/90 py-1 rounded cursor-pointer select-none">Open File</button>
          </div>
        `;

        const marker = L.marker([issue.location.lat, issue.location.lng], { icon: markerIcon })
          .addTo(mapObj)
          .bindPopup(tooltipContent, { closeButton: false, minWidth: 150 });

        marker.on("click", () => {
          setSelectedIssue(issue);
        });

        markersRef.current.push({ id: issue.id, markerObj: marker });
      });
    };

    loadLeaflet();

    return () => {
      active = false;
      if (mapInstanceRef.current) {
        // remove markers
        markersRef.current.forEach((m) => m.markerObj ? m.markerObj.remove() : m.remove?.());
        markersRef.current = [];
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [loading, issues]);

  // Handle department updates or dynamic filtering if needed (fallback lists)
  const departmentsWorkload = [
    { name: "Roads & Infrastructure", open: 86, critical: 32, assigned: 24, completed: 61, sla: "2.1 hrs", progress: 62 },
    { name: "Water Supply & Sewerage", open: 45, critical: 18, assigned: 16, completed: 32, sla: "3.4 hrs", progress: 48 },
    { name: "Electricity Department", open: 32, critical: 12, assigned: 15, completed: 22, sla: "1.8 hrs", progress: 54 },
    { name: "Solid Waste Management", open: 28, critical: 14, assigned: 11, completed: 18, sla: "4.2 hrs", progress: 30 },
    { name: "Parks & Recreation", open: 18, critical: 3, assigned: 10, completed: 14, sla: "5.1 hrs", progress: 75 },
    { name: "Traffic Management", open: 42, critical: 14, assigned: 20, completed: 28, sla: "2.3 hrs", progress: 65 },
    { name: "Drainage Department", open: 36, critical: 8, assigned: 12, completed: 21, sla: "3.0 hrs", progress: 58 },
  ];

  const pendingAiSummaries = issues.filter((i) => i.aiSummary == null);



  if (loading) {
    return (
      <div className="space-y-6 animate-pulse select-none">
        <div className="h-10 w-64 bg-[#111827] border border-[#273244] rounded-lg" />
        <div className="grid grid-cols-2 gap-4.5 sm:grid-cols-5">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-24 bg-[#111827] border border-[#273244] rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-10">
          <div className="lg:col-span-4 h-96 bg-[#111827] border border-[#273244] rounded-xl" />
          <div className="lg:col-span-3 h-96 bg-[#111827] border border-[#273244] rounded-xl" />
          <div className="lg:col-span-3 h-96 bg-[#111827] border border-[#273244] rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1700px] mx-auto pb-12 select-none text-left">
      
      {/* ── Hero Section (Redesigned) ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#111827] border border-[#273244] rounded-2xl p-5 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#16A34A] animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#16A34A]">Integrated Command Centre (ICCC)</span>
          </div>
          <h1 className="text-[34px] font-bold text-white tracking-tight leading-tight">Municipal Operations Center</h1>
          <p className="text-sm text-[#9CA3AF] font-medium leading-none mt-1">
            Real-time monitoring of civic infrastructure and inter-department operations.
          </p>
        </div>
        <button
          onClick={() => navigate("/dashboard/executive")}
          className="flex items-center gap-2 bg-gradient-to-br from-[#16A34A] to-[#15803D] hover:from-[#16A34A]/90 hover:to-[#15803D]/90 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md transition-all active:scale-[0.98] cursor-pointer shrink-0"
        >
          Generate Executive Briefing
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* ── Redesigned KPI cards row (5 columns, Grafana style) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard label="Today's Incidents" value="287" subtext="↑ 20% vs yesterday" trendType="up" icon={AlertCircle} iconColor="text-[#2563EB]" iconBg="bg-[#2563EB]/10" />
        <KpiCard label="High Priority" value="93" subtext="↑ 35% vs yesterday" trendType="critical" icon={ShieldAlert} iconColor="text-[#DC2626]" iconBg="bg-[#DC2626]/10" />
        <KpiCard label="Resolved Today" value="54" subtext="↑ 18% vs yesterday" trendType="up" icon={CheckCircle2} iconColor="text-[#16A34A]" iconBg="bg-[#16A34A]/10" />
        <KpiCard label="Avg Response Time" value="1.4 hrs" subtext="↓ 8% vs yesterday" trendType="down" icon={Clock} iconColor="text-[#16A34A]" iconBg="bg-[#16A34A]/10" />
        <KpiCard label="SLA Compliance" value="96.4%" subtext="↑ 3.2% vs yesterday" trendType="up" icon={Zap} iconColor="text-[#F59E0B]" iconBg="bg-[#F59E0B]/10" />
      </div>

      {/* ── Main Operations Command Grid (5fr / 4fr / 3fr) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Map, Pending AI, and Queue Preview (5fr Width) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Map Card */}
          <div className="bg-[#111827] border border-[#273244] rounded-xl p-5 shadow-sm space-y-3.5">
            <div className="flex justify-between items-center pb-2.5 border-b border-[#273244]/55 shrink-0">
              <div className="space-y-0.5">
                <h3 className="text-[15px] font-semibold text-[#F3F4F6] font-sans leading-none">Live City Infrastructure Map</h3>
                <span className="text-[11px] font-medium text-[#6B7280] block">Interactive GIS visualization of live incidents.</span>
              </div>
              <div className="flex items-center gap-1.5 bg-[#16A34A]/10 border border-[#16A34A]/20 px-2 py-0.5 rounded-full text-[10px] font-bold text-[#16A34A] shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A] animate-pulse" />
                <span>LIVE GIS</span>
              </div>
            </div>

            {/* Leaflet Map Area */}
            <div className="relative h-[280px] w-full rounded-xl overflow-hidden bg-[#0A0F17] border border-[#273244] shrink-0">
              <div ref={containerRef} className="w-full h-full z-0" />
            </div>

            {/* Map Action Button */}
            <div className="space-y-2.5 pt-1.5 shrink-0">
              <button 
                onClick={() => navigate("/dashboard/map")}
                className="w-full py-2.5 bg-[#16A34A] hover:bg-[#16A34A]/90 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-sm text-center block"
              >
                Explore Full Digital Twin Map
              </button>
              <div className="flex justify-around text-[10px] font-semibold text-[#9CA3AF] px-1 select-none">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#16A34A]"></span> Roads</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#2563EB]"></span> Water</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#F59E0B]"></span> Power</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#8B5CF6]"></span> Waste</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#DC2626] animate-pulse"></span> Critical</span>
              </div>
            </div>
          </div>

          {/* Pending AI Summaries */}
          <div className="bg-[#111827] border border-[#273244] rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex justify-between items-center pb-2.5 border-b border-[#273244]/55 sticky top-0 bg-[#111827] z-10">
              <div className="space-y-0.5">
                <h3 className="text-[15px] font-semibold text-[#F3F4F6] font-sans leading-none">Pending AI Summaries</h3>
                <span className="text-[11px] font-medium text-[#6B7280] block">Incidents awaiting council classification consensus.</span>
              </div>
              <span className="bg-[#8B5CF6]/15 border border-[#8B5CF6]/30 text-[#8B5CF6] text-[10px] font-mono px-2 py-0.5 rounded-full font-bold">
                {pendingAiSummaries.length} QUEUED
              </span>
            </div>

            {pendingAiSummaries.length === 0 ? (
              <div className="text-center py-6 text-[#6B7280] text-xs font-semibold flex flex-col items-center justify-center gap-2">
                <span>✅ No pending summaries. AI Council is fully synchronized.</span>
                <span className="text-[10px] text-[#6B7280]">Last checked: 09:42 AM</span>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1 custom-scrollbar">
                {pendingAiSummaries.map((issue) => {
                  const mediaUrlObj = issue.mediaUrls?.[0] as any;
                  const thumb = mediaUrlObj?.original || (typeof mediaUrlObj === "string" ? mediaUrlObj : undefined) || (issue as any).image;
                  const title = issue.aiAnalysis?.subcategory || "Incident Report";
                  const ward = issue.location?.ward || "Pune Central";
                  const department = issue.routing?.primaryDepartment || "TBD";
                  const confidence = issue.aiAnalysis?.confidence ?? 95;
                  const eta = issue.priority?.estimatedSLAHours ?? 2;
                  const severity = issue.aiAnalysis?.severity || "medium";
                  const status = issue.status || "submitted";
                  
                  return (
                    <div 
                      key={issue.id}
                      onClick={() => setSelectedIssue(issue)}
                      onMouseEnter={() => handleHoverCard(issue.id, issue)}
                      onMouseLeave={() => handleHoverCard(null)}
                      style={{ opacity: hoveredPendingId && hoveredPendingId !== issue.id ? 0.65 : 1 }}
                      className="flex items-center justify-between p-3 bg-[#1A2332]/45 hover:bg-[#1A2332] border border-[#273244] hover:border-[#8B5CF6]/40 rounded-xl cursor-pointer transition-all duration-150 hover:-translate-y-0.5 select-none"
                    >
                      <div className="flex items-center gap-3.5 min-w-0 flex-1">
                        {/* Image Thumbnail */}
                        <div className="w-16 h-16 rounded-lg bg-[#0A0F17] border border-[#273244] overflow-hidden shrink-0 flex items-center justify-center relative">
                          {thumb ? (
                            <img src={thumb} alt="" className="w-full h-full object-cover" loading="lazy" />
                          ) : (
                            <div className="w-full h-full bg-[#0A0F17] flex items-center justify-center">
                              <Cpu className="w-6 h-6 text-[#8B5CF6]/50" />
                            </div>
                          )}
                        </div>

                        {/* Title and metadata */}
                        <div className="min-w-0 space-y-1 text-left">
                          <h4 className="text-sm font-semibold text-[#F3F4F6] truncate max-w-[220px] leading-tight" title={title}>
                            {title}
                          </h4>
                          <div className="text-[11px] font-semibold text-[#9CA3AF] leading-none flex items-center gap-1.5">
                            <span>{ward}</span>
                            <span className="text-[#6B7280] font-normal">•</span>
                            <span>{department}</span>
                          </div>
                          
                          {/* Bottom metadata tags */}
                          <div className="flex flex-wrap items-center gap-2 pt-0.5 font-sans text-[10px] font-bold text-[#6B7280]">
                            <span className="font-mono text-white/90 bg-[#1F2937]/45 border border-[#273244]/55 px-1 py-0.5 rounded">
                              {issue.id}
                            </span>
                            <span className="text-[#16A34A]">{confidence}% Conf</span>
                            <span>•</span>
                            <span className="text-[#F59E0B]">{eta} hrs ETA</span>
                            <span>•</span>
                            <span className="uppercase text-[#2563EB]">{severity}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right Status Pill */}
                      <div className="shrink-0 pl-3">
                        <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-[#8B5CF6]/10 border border-[#8B5CF6]/20 text-[#8B5CF6] uppercase tracking-wider">
                          {status === "submitted" ? "ANALYZING" : "AI REVIEW"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Issue Queue Preview */}
          <div className="bg-[#111827] border border-[#273244] rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex justify-between items-center pb-2.5 border-b border-[#273244]/55">
              <div className="space-y-0.5">
                <h3 className="text-[15px] font-semibold text-[#F3F4F6] font-sans leading-none">Active Queue Preview</h3>
                <span className="text-[11px] font-medium text-[#6B7280] block">Recent active incidents registered in operational dispatcher queue.</span>
              </div>
              <span className="bg-[#16A34A]/10 border border-[#16A34A]/25 text-[#16A34A] text-[10px] font-mono px-2 py-0.5 rounded-full font-bold">
                ACTIVE
              </span>
            </div>

            <div className="space-y-2.5 max-h-[240px] overflow-y-auto pr-1 custom-scrollbar">
              {issues.slice(0, 3).map((issue) => {
                const mediaUrlObj = issue.mediaUrls?.[0] as any;
                const thumb = mediaUrlObj?.original || (typeof mediaUrlObj === "string" ? mediaUrlObj : undefined) || (issue as any).image;
                const title = issue.aiAnalysis?.subcategory || "Incident Report";
                const ward = issue.location?.ward || "Pune Central";
                const department = issue.routing?.primaryDepartment || "TBD";
                
                return (
                  <div 
                    key={issue.id}
                    onClick={() => setSelectedIssue(issue)}
                    className="flex items-center justify-between p-2.5 bg-[#1A2332]/25 hover:bg-[#1A2332] border border-[#273244] rounded-xl cursor-pointer transition-all duration-150 hover:-translate-y-0.5"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-10 h-10 rounded-lg bg-[#0A0F17] border border-[#273244] overflow-hidden shrink-0 flex items-center justify-center">
                        {thumb ? (
                          <img src={thumb} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <Cpu className="w-4 h-4 text-[#16A34A]/40" />
                        )}
                      </div>
                      <div className="min-w-0 leading-tight">
                        <span className="block text-xs font-bold text-[#F3F4F6] truncate max-w-[200px]">
                          {title}
                        </span>
                        <span className="block text-[10px] text-[#9CA3AF] mt-0.5 truncate max-w-[200px]">
                          Ward: {ward} · {department.split(" ")[0]}
                        </span>
                      </div>
                    </div>

                    <div className="shrink-0 text-right space-y-1.5 pl-2">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] uppercase font-bold tracking-wider border ${
                        issue.status === "in_progress" ? "bg-orange-500/10 border-orange-500/20 text-orange-300" :
                        issue.status === "assigned" ? "bg-blue-500/10 border-blue-500/20 text-blue-300" :
                        "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
                      }`}>
                        {issue.status.replace("_", " ")}
                      </span>
                      <span className="block text-[9px] font-mono text-[#6B7280] font-bold leading-none">{issue.id}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* CENTER COLUMN: Department Workload, Doughnut, Risk & Crews (4fr Width) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Workload Table */}
          <div className="bg-[#111827] border border-[#273244] rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex justify-between items-center pb-2 px-0.5 border-b border-[#273244]/55">
              <h3 className="text-[15px] font-semibold text-[#F3F4F6] font-sans leading-none">Department Workload</h3>
              <span className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider">Operational SLA</span>
            </div>

            <div className="overflow-x-auto select-none">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#273244] text-[#6B7280] font-bold text-[10px] uppercase tracking-wider">
                    <th className="py-1 px-1 font-bold">Department</th>
                    <th className="py-1 px-1 font-bold text-center">Open</th>
                    <th className="py-1 px-1 font-bold text-center">Crit</th>
                    <th className="py-1 px-1 font-bold text-center">SLA</th>
                    <th className="py-1 px-1 font-bold text-right">Progress</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#273244]/40 font-semibold text-[#9CA3AF]">
                  {departmentsWorkload.map((dept, idx) => (
                    <tr key={idx} className="hover:bg-white/[0.01]">
                      <td className="py-2.5 px-1 font-bold text-[#F3F4F6] truncate max-w-[110px]" title={dept.name}>
                        {dept.name.split(" ")[0]}
                      </td>
                      <td className="py-2.5 px-1 text-center font-mono text-[#F3F4F6]">{dept.open}</td>
                      <td className="py-2.5 px-1 text-center font-mono text-[#DC2626] font-bold">{dept.critical}</td>
                      <td className="py-2.5 px-1 text-center font-mono text-[#9CA3AF]">{dept.sla}</td>
                      <td className="py-2.5 px-1 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <span className="font-mono text-[10px] text-[#F3F4F6]">{dept.progress}%</span>
                          <div className="w-12 bg-white/5 h-1.5 rounded-full overflow-hidden shrink-0 border border-white/5">
                            <div className="bg-[#16A34A] h-1.5 rounded-full" style={{ width: `${dept.progress}%` }} />
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Doughnut Chart */}
          <div className="bg-[#111827] border border-[#273244] rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex justify-between items-center pb-2.5 border-b border-[#273244]/55">
              <h3 className="text-[15px] font-semibold text-[#F3F4F6] font-sans leading-none">Incident Distribution</h3>
              <span className="text-[10px] font-bold text-[#6B7280] uppercase">Today's Share</span>
            </div>

            <div className="flex items-center gap-4 py-2">
              {/* Doughnut SVG */}
              <div className="relative w-28 h-28 shrink-0 flex items-center justify-center">
                <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90 select-none">
                  {/* Segment 1: Roads 41.8% */}
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke="#16A34A" strokeWidth="4.2" strokeDasharray="41.8 58.2" strokeDashoffset="0" />
                  {/* Segment 2: Water 21.6% */}
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke="#2563EB" strokeWidth="4.2" strokeDasharray="21.6 78.4" strokeDashoffset="-41.8" />
                  {/* Segment 3: Electricity 15.7% */}
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke="#F59E0B" strokeWidth="4.2" strokeDasharray="15.7 84.3" strokeDashoffset="-63.4" />
                  {/* Segment 4: Waste 11.1% */}
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke="#8B5CF6" strokeWidth="4.2" strokeDasharray="11.1 88.9" strokeDashoffset="-79.1" />
                  {/* Segment 5: Traffic 6.3% */}
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke="#DC2626" strokeWidth="4.2" strokeDasharray="6.3 93.7" strokeDashoffset="-90.2" />
                  {/* Segment 6: Others 3.5% */}
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke="#6B7280" strokeWidth="4.2" strokeDasharray="3.5 96.5" strokeDashoffset="-96.5" />
                </svg>
                <div className="absolute flex flex-col items-center justify-center leading-none text-center">
                  <span className="text-xl font-bold font-mono text-[#F3F4F6]">287</span>
                  <span className="text-[9px] font-bold text-[#6B7280] uppercase mt-0.5">Total</span>
                </div>
              </div>

              {/* Legend Grid */}
              <div className="flex-1 space-y-1.5 text-[11px] font-semibold text-[#9CA3AF]">
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#16A34A]"></span> Roads</span>
                  <span className="font-mono text-[#F3F4F6]">120 (41%)</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#2563EB]"></span> Water</span>
                  <span className="font-mono text-[#F3F4F6]">62 (21%)</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#F59E0B]"></span> Power</span>
                  <span className="font-mono text-[#F3F4F6]">45 (15%)</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#8B5CF6]"></span> Waste</span>
                  <span className="font-mono text-[#F3F4F6]">32 (11%)</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#DC2626]"></span> Traffic</span>
                  <span className="font-mono text-[#F3F4F6]">18 (6%)</span>
                </div>
              </div>
            </div>
            <div className="text-[10px] font-semibold font-mono text-[#6B7280] text-center border-t border-[#273244]/40 pt-2 select-none">
              All data compiled for July 4, 2026
            </div>
          </div>

          {/* Critical Wards Risk Assessment */}
          <div className="bg-[#111827] border border-[#273244] rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex justify-between items-center pb-2.5 border-b border-[#273244]/55">
              <h3 className="text-[15px] font-semibold text-[#F3F4F6] font-sans leading-none">Critical Zone Health</h3>
              <span className="text-[10px] font-bold text-[#6B7280] uppercase">Pune Wards</span>
            </div>
            
            <div className="space-y-3 pt-1 text-[12px] text-[#9CA3AF] font-sans">
              {[
                { ward: "Swargate Chowk Sector", risk: "Critical (P0)", rate: 74, color: "bg-[#DC2626]" },
                { ward: "Shivajinagar FC Road", risk: "Moderate Risk", rate: 88, color: "bg-[#F59E0B]" },
                { ward: "Koregaon Park North", risk: "High Resolution", rate: 95, color: "bg-[#16A34A]" },
                { ward: "Deccan Gymkhana", risk: "Stable Sector", rate: 99, color: "bg-[#16A34A]" }
              ].map((zone, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between font-semibold">
                    <span className="text-[#F3F4F6]">{zone.ward}</span>
                    <span className="text-[#6B7280]">{zone.risk}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden border border-white/5">
                      <div className={`h-full ${zone.color}`} style={{ width: `${zone.rate}%` }} />
                    </div>
                    <span className="font-mono font-bold text-[10px] text-white shrink-0">{zone.rate}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Crew Dispatch & Field Availability */}
          <div className="bg-[#111827] border border-[#273244] rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex justify-between items-center pb-2.5 border-b border-[#273244]/55">
              <h3 className="text-[15px] font-semibold text-[#F3F4F6] font-sans leading-none">Field Crew Dispatch</h3>
              <span className="text-[10px] font-bold text-[#16A34A] uppercase tracking-wider bg-[#16A34A]/10 border border-[#16A34A]/20 px-2 py-0.5 rounded-full">
                Live Status
              </span>
            </div>

            <div className="space-y-3 pt-1 text-[12px] text-[#9CA3AF] font-sans select-none">
              {[
                { id: "CRW-112", dept: "Roads Division", status: "Active Dispatch", area: "Koregaon Park", color: "text-[#16A34A]", dotColor: "bg-[#16A34A]" },
                { id: "CRW-204", dept: "Water Services", status: "Active Dispatch", area: "Shivajinagar", color: "text-[#16A34A]", dotColor: "bg-[#16A34A]" },
                { id: "CRW-089", dept: "Drainage Crew", status: "En Route", area: "FC Road Sector", color: "text-[#F59E0B]", dotColor: "bg-[#F59E0B]" },
                { id: "CRW-105", dept: "Power Grid Team", status: "Standby Depot", area: "Swargate Base", color: "text-[#6B7280]", dotColor: "bg-[#6B7280]" }
              ].map((crew, idx) => (
                <div key={idx} className="flex justify-between items-center bg-[#1A2332]/25 border border-[#273244]/35 p-2 rounded-lg">
                  <div className="leading-tight text-left">
                    <span className="block font-mono font-bold text-white text-[11px]">{crew.id}</span>
                    <span className="block text-[10px] text-[#6B7280] mt-0.5">{crew.dept}</span>
                  </div>
                  <div className="text-right leading-tight">
                    <span className={`inline-flex items-center gap-1 font-semibold text-[11px] ${crew.color}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${crew.dotColor} ${crew.status !== "Standby Depot" ? "animate-pulse" : ""}`} />
                      {crew.status}
                    </span>
                    <span className="block text-[10px] text-[#9CA3AF] mt-0.5">{crew.area}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: AI Command Telemetry, Actions, Alerts & AI Log Stream (3fr Width) */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* AI Pipeline Telemetry Visualizer */}
          <div className="bg-[#111827] border border-[#273244] rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex justify-between items-center pb-2.5 border-b border-[#273244]/55">
              <div className="space-y-0.5">
                <h3 className="text-[15px] font-semibold text-[#F3F4F6] font-sans leading-none">AI Command Center</h3>
                <span className="text-[11px] font-medium text-[#6B7280] block">Realtime agent deliberation telemetry.</span>
              </div>
              <div className="flex items-center gap-1.5 bg-[#8B5CF6]/10 border border-[#8B5CF6]/20 px-2.5 py-0.5 rounded-full text-[10px] font-bold text-[#8B5CF6] shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-[#8B5CF6] animate-pulse" />
                <span>PIPELINE</span>
              </div>
            </div>

            {/* Pipeline flowchart mapping */}
            <div className="relative text-xs text-left space-y-3.5 pl-2 select-none">
              <div className="absolute top-3 left-4.5 w-[1px] bg-[#273244] bottom-3.5" />
              
              {[
                { time: "08:05:11", label: "Image Received", icon: FileImage, desc: "Citizen submission upload complete" },
                { time: "08:05:15", label: "Vision AI Analysis", icon: Camera, desc: "Detected road depression (97.2% confidence)", latency: "391ms" },
                { time: "08:05:20", label: "Classification", icon: Layers, desc: "Category: Road Damage", latency: "412ms" },
                { time: "08:05:27", label: "Priority Engine", icon: AlertTriangle, desc: "Ranked: HIGH severity status", latency: "190ms" },
                { time: "08:05:31", label: "Routing Engine", icon: GitBranch, desc: "Assigned: Roads Department", latency: "247ms" },
                { time: "08:05:38", label: "Officer Assigned", icon: UserCheck, desc: "Officer Vikram assigned to dispatch", latency: "115ms" },
                { time: "08:05:45", label: "Dispatch Crew", icon: Truck, desc: "Repair crew dispatched to site", latency: "320ms" },
                { time: "08:05:58", label: "Citizen Notified", icon: Bell, desc: "SMS status notification confirmation", latency: "172ms" }
              ].map((step, idx) => {
                const StepIcon = step.icon;
                return (
                  <div key={idx} className="flex gap-4 items-start relative">
                    <div className="w-6 h-6 rounded-lg bg-[#1A2332] border border-[#273244] flex items-center justify-center shrink-0 z-10 text-xs">
                      <StepIcon className="w-3.5 h-3.5 text-[#8B5CF6]" />
                    </div>
                    <div className="min-w-0 flex-1 leading-tight space-y-0.5">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-[#F3F4F6] text-xs">{step.label}</span>
                        <span className="font-mono text-[9px] text-[#6B7280]">{step.time}</span>
                      </div>
                      <span className="block text-[11px] text-[#9CA3AF] truncate leading-normal">{step.desc}</span>
                      {step.latency && (
                        <span className="inline-block text-[9px] font-mono text-[#8B5CF6] font-semibold bg-[#8B5CF6]/5 border border-[#8B5CF6]/20 px-1 rounded-sm mt-0.5">
                          {step.latency} latency
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-between items-center text-[11px] font-semibold border-t border-[#273244]/45 pt-3.5 select-none text-[#9CA3AF] px-1 leading-none">
              <span>AI Avg Confidence: <span className="font-mono text-[#16A34A] font-bold">97.2%</span></span>
              <span>Processing Time: <span className="font-mono text-[#2563EB] font-bold">418ms</span></span>
            </div>
          </div>

          {/* Quick Actions List */}
          <div className="bg-[#111827] border border-[#273244] rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex justify-between items-center pb-2.5 border-b border-[#273244]/55">
              <h3 className="text-[15px] font-semibold text-[#F3F4F6] font-sans leading-none">Quick Actions</h3>
              <span className="text-[10px] font-bold text-[#6B7280] uppercase font-mono">Triage Tools</span>
            </div>

            <div className="space-y-2">
              {[
                { title: "Report Follow Up", desc: "View unresolved client replies", icon: MessageSquare },
                { title: "Assign Incident", desc: "Assign custom crew / department", icon: User },
                { title: "Re-run AI Analysis", desc: "Re-analyze visual coordinates", icon: RefreshCw },
                { title: "Generate Report", desc: "Download weekly operational summary", icon: ClipboardList },
                { title: "Emergency Broadcast", desc: "Publish alert to all departments", icon: AlertCircle }
              ].map((act, i) => {
                const ActionIcon = act.icon;
                return (
                  <button
                    key={i}
                    onClick={() => {
                      if (act.title === "Report Follow Up") {
                        setActiveModal("follow_up");
                      } else if (act.title === "Assign Incident") {
                        setActiveModal("assign");
                        if (issues.length > 0) setAssignIssueId(issues[0].id);
                      } else if (act.title === "Re-run AI Analysis") {
                        setActiveModal("rerun");
                        if (issues.length > 0) setAssignIssueId(issues[0].id);
                      } else if (act.title === "Generate Report") {
                        window.print();
                      } else if (act.title === "Emergency Broadcast") {
                        setActiveModal("broadcast");
                      }
                    }}
                    className="w-full flex items-center justify-between p-3.5 bg-[#1A2332]/45 hover:bg-[#1A2332] border border-[#273244] hover:border-[#16A34A]/30 rounded-xl cursor-pointer text-left transition-all duration-150 hover:-translate-y-0.5 group"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="p-1.5 bg-[#0A0F17] rounded-lg text-[#9CA3AF] group-hover:text-[#16A34A] transition-colors border border-[#273244]">
                        <ActionIcon className="w-4 h-4" />
                      </div>
                      <div className="leading-tight min-w-0">
                        <span className="block text-xs font-bold text-[#F3F4F6]">{act.title}</span>
                        <span className="block text-[10px] text-[#6B7280] group-hover:text-[#9CA3AF] mt-0.5 truncate max-w-[160px]">{act.desc}</span>
                      </div>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-[#6B7280] group-hover:text-[#16A34A] transition-colors shrink-0" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active System Dispatch Alerts */}
          <div className="bg-[#111827] border border-[#273244] rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex justify-between items-center pb-2.5 border-b border-[#273244]/55">
              <h3 className="text-[15px] font-semibold text-[#F3F4F6] font-sans leading-none">System Alerts</h3>
              <span className="bg-[#DC2626]/10 border border-[#DC2626]/20 px-2 py-0.5 rounded-full text-[9px] font-bold text-[#DC2626]">
                2 ACTIVE
              </span>
            </div>

            <div className="space-y-3.5 text-xs text-[#9CA3AF] font-semibold leading-relaxed">
              <div className="flex gap-3 items-start bg-[#DC2626]/5 border border-[#DC2626]/15 p-2.5 rounded-xl">
                <AlertCircle className="w-4 h-4 text-[#DC2626] shrink-0 mt-0.5" />
                <div className="space-y-0.5 text-left">
                  <span className="block text-[#F3F4F6] font-bold text-[11px]">SLA Breach Danger</span>
                  <p className="text-[10px] text-[#9CA3AF]">Swargate Chowk P0 signal failure resolution SLA is at 92% time elapsed.</p>
                </div>
              </div>

              <div className="flex gap-3 items-start bg-[#16A34A]/5 border border-[#16A34A]/15 p-2.5 rounded-xl">
                <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0 mt-0.5" />
                <div className="space-y-0.5 text-left">
                  <span className="block text-[#F3F4F6] font-bold text-[11px]">AI Consensus Achieved</span>
                  <p className="text-[10px] text-[#9CA3AF]">INC-20260704-0008 verified: Missing manhole cover (Koregaon Park).</p>
                </div>
              </div>
            </div>
          </div>

          {/* AI Dispatch Decision Stream */}
          <div className="bg-[#111827] border border-[#273244] rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex justify-between items-center pb-2.5 border-b border-[#273244]/55">
              <h3 className="text-[15px] font-semibold text-[#F3F4F6] font-sans leading-none">AI Dispatch Decisions</h3>
              <span className="text-[10px] font-mono text-[#8B5CF6] font-bold bg-[#8B5CF6]/10 border border-[#8B5CF6]/20 px-2 py-0.5 rounded-full">
                Realtime
              </span>
            </div>

            <div className="space-y-3 pt-1 text-[11px] text-[#9CA3AF] font-sans select-none text-left">
              {[
                { incId: "INC-20260704-0001", action: "Pothole classified as Critical safety hazard. Escalated dispatch SLA to 2 hours.", status: "Escalated" },
                { incId: "INC-20260704-0006", action: "Drainage overflow mapped. Auto-routed crew CRW-089 based on GPS proximity.", status: "Routed" },
                { incId: "INC-20260704-0008", action: "Manhole hazard verified via Citizen Photo. Dispatched team CRW-112.", status: "Assigned" }
              ].map((log, idx) => (
                <div key={idx} className="border-l-2 border-[#8B5CF6]/40 pl-2.5 space-y-0.5">
                  <div className="flex justify-between font-semibold">
                    <span className="font-mono text-white text-[10px]">{log.incId}</span>
                    <span className="text-[#8B5CF6] text-[9px] font-bold uppercase tracking-wider">{log.status}</span>
                  </div>
                  <p className="text-[10px] text-[#9CA3AF] leading-normal">{log.action}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* Toast Alert overlay */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-4 bg-[#16A34A] border border-[#16A34A]/25 text-white font-bold text-xs rounded-xl shadow-2xl flex items-center gap-2 select-none">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ── MODALS DIALOGS OVERLAYS ── */}
      <AnimatePresence>
        {activeModal === "follow_up" && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-xs shadow-2xl" onClick={() => setActiveModal(null)} />
            <div className="bg-[#111827] border border-[#273244] w-full max-w-md rounded-2xl p-6 shadow-2xl z-10 relative space-y-4 text-left">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-[#273244]/55 pb-2">Report Follow Up Dispatch</h3>
              <div className="space-y-3 text-xs text-[#9CA3AF]">
                <div className="space-y-1.5">
                  <label className="font-semibold">Add Follow-up Notes</label>
                  <textarea
                    rows={3}
                    placeholder="Enter customer verification note..."
                    value={followUpNotes}
                    onChange={(e) => setFollowUpNotes(e.target.value)}
                    className="w-full bg-[#1A2332] border border-[#273244] rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-[#16A34A]/50 transition-colors"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-semibold">Internal Officer Comments</label>
                  <input
                    type="text"
                    placeholder="E.g. Crew verified pavement crack."
                    value={followUpComment}
                    onChange={(e) => setFollowUpComment(e.target.value)}
                    className="w-full bg-[#1A2332] border border-[#273244] rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-[#16A34A]/50 transition-colors"
                  />
                </div>
              </div>
              <div className="flex gap-2 justify-end pt-2 text-xs font-bold">
                <button onClick={() => setActiveModal(null)} className="px-3 py-2 bg-white/5 border border-[#273244] hover:bg-white/10 text-[#9CA3AF] hover:text-white rounded-xl transition-all cursor-pointer">Cancel</button>
                <button
                  onClick={() => {
                    setToastMessage("✓ Follow up log updated and saved.");
                    setTimeout(() => setToastMessage(null), 3000);
                    setActiveModal(null);
                    setFollowUpNotes("");
                    setFollowUpComment("");
                  }}
                  className="px-4 py-2 bg-[#16A34A] hover:bg-[#16A34A]/90 text-white rounded-xl transition-all cursor-pointer"
                >
                  Save Log
                </button>
              </div>
            </div>
          </div>
        )}

        {activeModal === "assign" && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-xs shadow-2xl" onClick={() => setActiveModal(null)} />
            <div className="bg-[#111827] border border-[#273244] w-full max-w-md rounded-2xl p-6 shadow-2xl z-10 relative space-y-4 text-left">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-[#273244]/55 pb-2">Assign Incident &amp; Dispatch</h3>
              <div className="space-y-3.5 text-xs text-[#9CA3AF]">
                
                {/* Select issue */}
                <div className="space-y-1.5">
                  <label className="font-semibold">Select Target Incident</label>
                  <select
                    value={assignIssueId}
                    onChange={(e) => setAssignIssueId(e.target.value)}
                    className="w-full bg-[#1A2332] border border-[#273244] rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-[#16A34A]/50 transition-colors cursor-pointer"
                  >
                    {issues.map(i => (
                      <option key={i.id} value={i.id}>{i.id} - {i.aiAnalysis?.subcategory}</option>
                    ))}
                  </select>
                </div>

                {/* Select dept */}
                <div className="space-y-1.5">
                  <label className="font-semibold">Assign Agency Department</label>
                  <select
                    value={assignDept}
                    onChange={(e) => setAssignDept(e.target.value)}
                    className="w-full bg-[#1A2332] border border-[#273244] rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-[#16A34A]/50 transition-colors cursor-pointer"
                  >
                    <option value="Roads & Infrastructure">Roads & Infrastructure</option>
                    <option value="Water Supply & Sewerage">Water Supply & Sewerage</option>
                    <option value="Electricity Department">Electricity Department</option>
                    <option value="Solid Waste Management">Solid Waste Management</option>
                    <option value="Drainage Department">Drainage Department</option>
                  </select>
                </div>

                {/* Select officer */}
                <div className="space-y-1.5">
                  <label className="font-semibold">Assigned Dispatcher</label>
                  <select
                    value={assignOfficer}
                    onChange={(e) => setAssignOfficer(e.target.value)}
                    className="w-full bg-[#1A2332] border border-[#273244] rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-[#16A34A]/50 transition-colors cursor-pointer"
                  >
                    <option value="Officer Vikram">Officer Vikram (Roads)</option>
                    <option value="Officer Suresh">Officer Suresh (Water)</option>
                    <option value="Officer Patil">Officer K. Patil (Waste)</option>
                  </select>
                </div>

                {/* Select priority */}
                <div className="space-y-1.5">
                  <label className="font-semibold">Priority Level Escalation</label>
                  <select
                    value={assignPriority}
                    onChange={(e) => setAssignPriority(e.target.value)}
                    className="w-full bg-[#1A2332] border border-[#273244] rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-[#16A34A]/50 transition-colors cursor-pointer"
                  >
                    <option value="critical">Critical (P0)</option>
                    <option value="high">High (P1)</option>
                    <option value="medium">Medium (P2)</option>
                    <option value="low">Low (P3)</option>
                  </select>
                </div>

              </div>
              <div className="flex gap-2 justify-end pt-2 text-xs font-bold">
                <button onClick={() => setActiveModal(null)} className="px-3 py-2 bg-white/5 border border-[#273244] hover:bg-white/10 text-[#9CA3AF] hover:text-white rounded-xl transition-all cursor-pointer">Cancel</button>
                <button
                  onClick={async () => {
                    if (!assignIssueId) return;
                    try {
                      const docRef = doc(db, "issues", assignIssueId);
                      await updateDoc(docRef, {
                        "routing.primaryDepartment": assignDept,
                        "routing.assignedOfficerId": assignOfficer === "Officer Vikram" ? "OFF-RD-014" : assignOfficer === "Officer Suresh" ? "OFF-WT-003" : "OFF-SW-021",
                        "aiAnalysis.severity": assignPriority,
                        "priority.label": assignPriority.toUpperCase()
                      });
                      setToastMessage(`✓ Incident ${assignIssueId} reassigned successfully.`);
                      setTimeout(() => setToastMessage(null), 3500);
                      setActiveModal(null);
                    } catch (err) {
                      console.error(err);
                    }
                  }}
                  className="px-4 py-2 bg-[#16A34A] hover:bg-[#16A34A]/90 text-white rounded-xl transition-all cursor-pointer"
                >
                  Save Assignment
                </button>
              </div>
            </div>
          </div>
        )}

        {activeModal === "rerun" && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-xs shadow-2xl" onClick={() => { if(!rerunProcessing) setActiveModal(null); }} />
            <div className="bg-[#111827] border border-[#273244] w-full max-w-md rounded-2xl p-6 shadow-2xl z-10 relative space-y-4 text-left">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-[#273244]/55 pb-2">Re-run AI Analysis Models</h3>
              
              {rerunProcessing ? (
                <div className="py-8 text-center space-y-3">
                  <div className="w-7 h-7 border-2 border-[#8B5CF6] border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-xs text-[#9CA3AF] font-bold">Querying AI Vision &amp; Safety consensus pipelines...</p>
                </div>
              ) : rerunResult ? (
                <div className="space-y-3 text-xs text-[#9CA3AF]">
                  <p className="font-bold text-[#16A34A]">{rerunResult}</p>
                  <button 
                    onClick={() => { setActiveModal(null); setRerunResult(null); }} 
                    className="w-full py-2 bg-white/5 border border-[#273244] text-[#F3F4F6] rounded-xl hover:bg-white/10 text-xs font-bold transition-all cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              ) : (
                <div className="space-y-4 text-xs text-[#9CA3AF]">
                  <div className="space-y-1.5">
                    <label className="font-semibold">Select Incident to Re-Analyze</label>
                    <select
                      value={assignIssueId}
                      onChange={(e) => setAssignIssueId(e.target.value)}
                      className="w-full bg-[#1A2332] border border-[#273244] rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-[#16A34A]/50 transition-colors cursor-pointer"
                    >
                      {issues.map(i => (
                        <option key={i.id} value={i.id}>{i.id} - {i.aiAnalysis?.subcategory}</option>
                      ))}
                    </select>
                  </div>
                  <p className="text-[10px] text-[#6B7280]">This action triggers visual categorization, GPS proximity verification, and safety weight escalations.</p>
                  <div className="flex gap-2 justify-end pt-2 text-xs font-bold">
                    <button onClick={() => setActiveModal(null)} className="px-3 py-2 bg-white/5 border border-[#273244] hover:bg-white/10 text-[#9CA3AF] hover:text-white rounded-xl transition-all cursor-pointer">Cancel</button>
                    <button
                      onClick={() => {
                        setRerunProcessing(true);
                        setTimeout(() => {
                          setRerunProcessing(false);
                          setRerunResult("✓ Analysis Complete. Vision Engine verified pothole dimensions: 98.4% Confidence. Safety Veto applied successfully.");
                          setToastMessage("✓ AI Analysis re-run complete.");
                          setTimeout(() => setToastMessage(null), 3000);
                        }, 2000);
                      }}
                      className="px-4 py-2 bg-[#8B5CF6] hover:bg-[#8B5CF6]/90 text-white rounded-xl transition-all cursor-pointer"
                    >
                      Run AI Engine
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeModal === "broadcast" && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-xs shadow-2xl" onClick={() => setActiveModal(null)} />
            <div className="bg-[#111827] border border-[#273244] w-full max-w-md rounded-2xl p-6 shadow-2xl z-10 relative space-y-4 text-left">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-[#273244]/55 pb-2">Emergency Channel Broadcast</h3>
              
              <div className="space-y-3.5 text-xs text-[#9CA3AF]">
                <div className="p-3 bg-[#DC2626]/10 border border-[#DC2626]/20 rounded-xl text-[#DC2626] font-bold text-[10px] select-none uppercase tracking-wider">
                  ⚠️ Warning: This publishes a high priority alert to all active dispatch channels.
                </div>
                <div className="space-y-1.5">
                  <label className="font-semibold">Broadcast Message Alert</label>
                  <textarea
                    rows={3}
                    placeholder="Enter urgent notification text..."
                    value={broadcastMessage}
                    onChange={(e) => setBroadcastMessage(e.target.value)}
                    className="w-full bg-[#1A2332] border border-[#273244] rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-[#16A34A]/50 transition-colors"
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-2 text-xs font-bold">
                <button onClick={() => setActiveModal(null)} className="px-3 py-2 bg-white/5 border border-[#273244] hover:bg-white/10 text-[#9CA3AF] hover:text-white rounded-xl transition-all cursor-pointer">Cancel</button>
                <button
                  onClick={() => {
                    setBroadcastSubmitting(true);
                    setTimeout(() => {
                      setBroadcastSubmitting(false);
                      setToastMessage("✓ Emergency alert broadcast dispatched.");
                      setTimeout(() => setToastMessage(null), 3000);
                      setActiveModal(null);
                      setBroadcastMessage("");
                    }, 1200);
                  }}
                  className="px-4 py-2 bg-[#DC2626] hover:bg-[#DC2626]/90 text-white rounded-xl transition-all cursor-pointer"
                >
                  {broadcastSubmitting ? "Dispatching..." : "Publish Broadcast"}
                </button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Slide-out detail drawer */}
      <AnimatePresence>
        {selectedIssue && (
          <IssueDetailDrawer 
            issue={selectedIssue}
            onClose={() => setSelectedIssue(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default CommandCenterPage;
