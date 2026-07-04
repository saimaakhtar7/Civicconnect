import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../stores/authStore";
import { useIssuesFeed } from "../../hooks/useIssuesFeed";
import { ISSUE_STATUSES } from "../../config/constants";
import { DemoSeeder } from "../../services/demoSeeder";
import {
  Inbox, Cpu, ChevronRight, Camera, CheckCircle2,
  Activity, Zap, RefreshCw, Clock, ShieldCheck, Users,
  CircleDot, Building, Route, Brain, MapPin
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { IssueDocument } from "../../types/issue.types";
import { IssueDetailDrawer } from "../../components/official/IssueDetailDrawer";

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
// Beautiful Animated City Network SVG
// ─────────────────────────────────────────────────────────────────────────────
const CityNetworkSVG: React.FC = () => {
  return (
    <svg viewBox="0 0 240 160" className="w-full h-full text-text-muted stroke-[#262626] select-none" fill="none" strokeWidth="1">
      {/* Grid path connections */}
      <motion.path 
        d="M20 30 L80 30 L110 60 L180 60 L220 100" 
        stroke="#262626" 
        strokeWidth="1.2" 
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 3.5, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
      />
      <motion.path 
        d="M60 130 L110 80 L180 80 L200 40" 
        stroke="#262626" 
        strokeWidth="1.2"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 4.5, delay: 0.5, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
      />
      <motion.path 
        d="M110 60 L110 120 L160 140" 
        stroke="#262626" 
        strokeWidth="1"
      />
      
      {/* Node dotted connectors */}
      <path d="M80 30 L110 80 M180 60 L180 80 L160 140" stroke="#262626" strokeWidth="0.8" strokeDasharray="3,3" />

      {/* Static Nodes */}
      <circle cx="80" cy="30" r="2.5" fill="#262626" />
      <circle cx="180" cy="60" r="2.5" fill="#262626" />
      <circle cx="180" cy="80" r="2.5" fill="#262626" />
      <circle cx="200" cy="40" r="2.5" fill="#262626" />

      {/* Pulsing Active Nodes */}
      <motion.circle 
        cx="110" 
        cy="60" 
        r="3.5" 
        fill="#22C55E" 
        animate={{ scale: [1, 1.25, 1], opacity: [0.8, 1, 0.8] }} 
        transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }} 
      />
      <motion.circle 
        cx="110" 
        cy="80" 
        r="3.5" 
        fill="#2563EB" 
        animate={{ scale: [1, 1.25, 1], opacity: [0.8, 1, 0.8] }} 
        transition={{ duration: 2.8, delay: 0.4, repeat: Infinity, ease: "easeInOut" }} 
      />
      <motion.circle 
        cx="160" 
        cy="140" 
        r="3.5" 
        fill="#F59E0B" 
        animate={{ scale: [1, 1.25, 1], opacity: [0.8, 1, 0.8] }} 
        transition={{ duration: 2.0, delay: 0.8, repeat: Infinity, ease: "easeInOut" }} 
      />
    </svg>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Live AI Ops Activity Feed (Modern sliding feed)
// ─────────────────────────────────────────────────────────────────────────────
const LiveAIOpsPanel: React.FC = () => {
  const [events, setEvents] = useState([
    { id: '1', engine: "Validator AI", action: "Consensus threshold verified", relativeTime: "18s ago", confidence: "99%", dotColor: "bg-[#22C55E]" },
    { id: '2', engine: "Summary AI", action: "Briefing summary generated", relativeTime: "15s ago", confidence: "95%", dotColor: "bg-[#2563EB]" },
    { id: '3', engine: "Priority AI", action: "Calculated severity HIGH", relativeTime: "12s ago", confidence: "91%", dotColor: "bg-[#F59E0B]" },
    { id: '4', engine: "Validator AI", action: "Duplicate scan completed", relativeTime: "8s ago", confidence: "98%", dotColor: "bg-[#22C55E]" },
    { id: '5', engine: "Routing AI", action: "Assigned Roads Department", relativeTime: "5s ago", confidence: "94%", dotColor: "bg-[#2563EB]" },
    { id: '6', engine: "Vision AI", action: "Road damage classified", relativeTime: "2s ago", confidence: "96%", dotColor: "bg-[#22C55E]" },
  ]);

  useEffect(() => {
    const actionsPool = [
      { engine: "Vision AI", action: "Road damage classified", confidence: "96%", dotColor: "bg-[#22C55E]" },
      { engine: "Routing AI", action: "Assigned Roads Department", confidence: "94%", dotColor: "bg-[#2563EB]" },
      { engine: "Validator AI", action: "Duplicate scan completed", confidence: "98%", dotColor: "bg-[#22C55E]" },
      { engine: "Priority AI", action: "Calculated severity HIGH", confidence: "91%", dotColor: "bg-[#F59E0B]" },
      { engine: "Summary AI", action: "Briefing summary generated", confidence: "95%", dotColor: "bg-[#2563EB]" },
      { engine: "Vision AI", action: "Pothole depth estimated", confidence: "92%", dotColor: "bg-[#22C55E]" },
      { engine: "Routing AI", action: "Routed to Water Department", confidence: "97%", dotColor: "bg-[#2563EB]" },
      { engine: "Validator AI", action: "Jurisdiction check complete", confidence: "99%", dotColor: "bg-[#22C55E]" },
    ];

    let counter = 0;
    const interval = setInterval(() => {
      const template = actionsPool[counter % actionsPool.length];
      const newEvent = {
        id: `${Date.now()}`,
        engine: template.engine,
        action: template.action,
        relativeTime: "2s ago",
        confidence: template.confidence,
        dotColor: template.dotColor,
      };

      setEvents((prev) => {
        const updated = prev.map((e) => {
          let time = e.relativeTime;
          if (time === "2s ago") time = "5s ago";
          else if (time === "5s ago") time = "8s ago";
          else if (time === "8s ago") time = "12s ago";
          else if (time === "12s ago") time = "15s ago";
          else if (time === "15s ago") time = "18s ago";
          else if (time === "18s ago") time = "20s ago";
          else time = "24s ago";
          return { ...e, relativeTime: time };
        });
        
        return [...updated.slice(1), newEvent];
      });

      counter++;
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-[#151515] border border-[#262626] rounded-[18px] p-5 h-[230px] flex flex-col justify-between select-none">
      <div className="flex flex-col h-full justify-between">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#262626] pb-2.5">
          <span className="text-[13px] font-semibold text-[#F5F5F5] font-sans">Community AI Activity</span>
          <div className="flex items-center gap-1.5 bg-[#22C55E]/10 border border-[#22C55E]/20 px-2.5 py-0.5 rounded-full text-[10px] font-medium text-[#22C55E]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-pulse" />
            <span>LIVE FEED</span>
          </div>
        </div>

        {/* List content */}
        <div className="flex-1 overflow-hidden relative my-2 flex flex-col justify-end">
          <div className="space-y-2.5">
            <AnimatePresence initial={false}>
              {events.slice(-4).map((ev, idx) => {
                const isNewest = idx === 3;
                return (
                  <motion.div
                    key={ev.id}
                    layout
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: isNewest ? 1 : 0.4, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30, opacity: { duration: 0.2 } }}
                    className="flex items-center justify-between gap-3 text-[12px] font-sans"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`w-1.5 h-1.5 rounded-full ${ev.dotColor} shrink-0`} />
                      <span className="font-mono text-[#F5F5F5] font-semibold text-[12px] tracking-tight shrink-0">{ev.engine}</span>
                      <span className="text-[#A1A1AA] truncate max-w-[140px] md:max-w-[110px] lg:max-w-[120px] xl:max-w-[170px]">{ev.action}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[#71717A] text-[12px] font-mono">{ev.relativeTime}</span>
                      <span className="text-[#22C55E] bg-[#22C55E]/10 border border-[#22C55E]/20 text-[10px] font-mono px-1.5 rounded font-semibold">{ev.confidence}</span>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>

        {/* Footer info label */}
        <div className="text-[12px] font-mono text-[#71717A] border-t border-[#262626] pt-2 text-right">
          NODE_STATUS: OPERATIONAL
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Observability Ribbon
// ─────────────────────────────────────────────────────────────────────────────
const OperationsRibbon: React.FC<{ reportsToday: number }> = ({ reportsToday }) => {
  return (
    <div className="w-full bg-[#151515] border border-[#262626] py-3 text-[13px] font-sans tracking-normal text-[#A1A1AA] rounded-[16px]">
      <div className="px-5 flex flex-wrap items-center justify-between gap-y-2">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-pulse" />
          <span>System Status: <span className="text-[#F5F5F5] font-semibold">Online</span></span>
        </div>
        <div className="hidden sm:block text-[#262626]">|</div>
        <div>AI Pipeline: <span className="text-[#22C55E] font-semibold">Operational</span></div>
        <div className="hidden sm:block text-[#262626]">|</div>
        <div>Active Departments: <span className="text-[#F5F5F5] font-semibold">14</span></div>
        <div className="hidden sm:block text-[#262626]">|</div>
        <div>Today's Reports: <span className="text-[#F5F5F5] font-semibold">{reportsToday}</span></div>
        <div className="hidden sm:block text-[#262626]">|</div>
        <div>Average SLA: <span className="text-[#F5F5F5] font-semibold">36 Hrs</span></div>
        <div className="hidden sm:block text-[#262626]">|</div>
        <div>System Health: <span className="text-[#22C55E] font-semibold">99.8%</span></div>
      </div>
    </div>
  );
};

// Safe date formatter for standard dates and Firestore Timestamps
const formatRelativeTime = (dateInput: any) => {
  if (!dateInput) return "Recent";
  let d: Date;
  if (dateInput.toDate && typeof dateInput.toDate === "function") {
    d = dateInput.toDate();
  } else if (dateInput.seconds) {
    d = new Date(dateInput.seconds * 1000);
  } else {
    d = new Date(dateInput);
  }
  if (isNaN(d.getTime())) return "Recent";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

// ─────────────────────────────────────────────────────────────────────────────
// Real Leaflet Live Map Card Preview
// ─────────────────────────────────────────────────────────────────────────────
const LeafletMapPreview: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    let map: any = null;

    const loadLeaflet = () => {
      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link');
        link.id = 'leaflet-css';
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        link.crossOrigin = '';
        document.head.appendChild(link);
      }

      if ((window as any).L) {
        initMap((window as any).L);
      } else {
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.crossOrigin = '';
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
        dragging: false,
        scrollWheelZoom: false,
        doubleClickZoom: false,
        boxZoom: false,
        touchZoom: false
      });

      mapInstanceRef.current = map;

      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 20
      }).addTo(map);

      // department / severity color marks
      const mockMarkers = [
        { lat: 18.5362, lng: 73.8930, color: '#EF4444' }, // critical red
        { lat: 18.5314, lng: 73.8446, color: '#F59E0B' }, // high/medium amber
        { lat: 18.5074, lng: 73.8077, color: '#22C55E' }, // low green
        { lat: 18.5250, lng: 73.8320, color: '#2563EB' }, // blue
        { lat: 18.5520, lng: 73.9143, color: '#22C55E' }
      ];

      mockMarkers.forEach((m) => {
        L.circleMarker([m.lat, m.lng], {
          radius: 5,
          color: m.color,
          fillColor: m.color,
          fillOpacity: 1,
          weight: 2
        }).addTo(map);

        L.circle([m.lat, m.lng], {
          radius: 350,
          color: m.color,
          fillColor: m.color,
          fillOpacity: 0.12,
          weight: 0.5
        }).addTo(map);
      });
    };

    loadLeaflet();

    return () => {
      active = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <div 
      onClick={() => navigate('/map')}
      className="bg-[#151515] border border-[#262626] rounded-[20px] p-5 flex flex-col justify-between hover:border-[#71717A]/40 transition-all duration-[180ms] ease-out cursor-pointer hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(0,0,0,0.5)] group h-[250px] w-full"
    >
      <div className="space-y-1 text-left">
        <h3 className="text-[18px] font-semibold text-[#F5F5F5] font-sans">View Live Map</h3>
        <p className="text-[15px] text-[#A1A1AA] font-normal leading-tight">
          Explore infrastructure issues geographically.
        </p>
      </div>

      <div className="relative h-[110px] w-full rounded-[14px] overflow-hidden my-3 bg-[#090909]">
        <div ref={containerRef} className="w-full h-full z-0" />
        <div className="absolute inset-0 bg-transparent pointer-events-none border border-[#262626]/40 rounded-[14px]" />
      </div>

      <div className="flex items-center text-[13px] font-medium text-[#22C55E] group-hover:text-[#2DD66F] transition-colors self-start font-sans">
        Expand Full Map <span className="ml-1 transition-transform group-hover:translate-x-1">→</span>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Redesigned Feed Issue Card (Spacious, Better Hierarchy)
// ─────────────────────────────────────────────────────────────────────────────
const IssueCardComponent: React.FC<{
  issue: IssueDocument;
  onClick: () => void;
}> = ({ issue, onClick }) => {
  const statusMeta = ISSUE_STATUSES.find((s) => s.value === issue.status);
  const mediaUrlObj = issue.mediaUrls?.[0] as any;
  const thumbnail = mediaUrlObj?.original || (typeof mediaUrlObj === "string" ? mediaUrlObj : undefined);
  const summary = issue.aiSummary;
  
  const title = summary?.subcategory || issue.aiAnalysis?.subcategory || "Community Incident";
  const description = issue.userDescription || "No description provided.";
  const departmentLabel = summary?.department || issue.routing?.primaryDepartment || "TBD";
  
  const confidenceLabel = summary?.confidence != null
    ? `${summary.confidence}%`
    : issue.aiAnalysis?.confidence != null
      ? `${issue.aiAnalysis.confidence}%`
      : "95%";
  
  const severityText = (summary?.severity || issue.aiAnalysis?.severity || "medium").toLowerCase();
  
  let timeStr = "09:42 AM";
  if (issue.createdAt) {
    let d: Date;
    if (typeof (issue.createdAt as any).toDate === "function") {
      d = (issue.createdAt as any).toDate();
    } else if ((issue.createdAt as any).seconds) {
      d = new Date((issue.createdAt as any).seconds * 1000);
    } else {
      d = new Date(issue.createdAt as any);
    }
    if (!isNaN(d.getTime())) {
      timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  }
  const dateFormatted = formatRelativeTime(issue.createdAt);
  const fullDate = dateFormatted === "Recent" ? `Jul 4, 2026 • ${timeStr}` : `${dateFormatted}, 2026 • ${timeStr}`;
  const assignedOfficer = issue.routing?.assignedOfficerId || "OFF-RD-014";

  return (
    <button
      onClick={onClick}
      className="w-full flex items-start gap-4 p-4.5 bg-[#151515] hover:bg-[#181818] border border-[#262626] hover:border-[#71717A]/40 rounded-[20px] transition-all duration-[180ms] ease-out hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(0,0,0,0.5)] text-left group cursor-pointer focus-visible:ring-1 focus-visible:ring-[#22C55E] outline-none"
    >
      {/* Evidence Image (96x72 landscape) */}
      <div className="w-[96px] h-[72px] rounded-lg overflow-hidden shrink-0 bg-[#090909] border border-[#262626] relative">
        {thumbnail ? (
          <img src={thumbnail} alt="" className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-[#090909]">
            <Cpu className="w-6 h-6 text-[#71717A]/40" />
          </div>
        )}
      </div>

      {/* Main Info */}
      <div className="flex-1 min-w-0 space-y-1.5 text-left">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
          <h3 className="text-[15px] font-bold text-[#F5F5F5] truncate group-hover:text-[#22C55E] transition-colors max-w-[220px] sm:max-w-[340px] font-sans leading-none">
            {title}
          </h3>
          
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-sans uppercase border leading-none ${
            severityText === "critical" ? "bg-[#EF4444]/10 border-[#EF4444]/20 text-[#EF4444]" :
            severityText === "high" ? "bg-[#F59E0B]/10 border-[#F59E0B]/20 text-[#F59E0B]" :
            "bg-[#22C55E]/10 border-[#22C55E]/20 text-[#22C55E]"
          }`}>
            {severityText}
          </span>
          
          <span className="text-[12px] text-[#A1A1AA] flex items-center gap-1 font-sans font-medium">
            <Building className="w-3.5 h-3.5 text-[#71717A]" />
            {departmentLabel.split(" ")[0]}
          </span>

          <span className="text-[12px] text-[#A1A1AA] flex items-center gap-1 font-sans font-medium">
            <MapPin className="w-3.5 h-3.5 text-[#71717A]" />
            {issue.location?.ward || "Pune Central"}
          </span>
        </div>

        {/* Citizen Description */}
        <p className="text-[13px] text-[#A1A1AA] line-clamp-2 leading-normal font-sans font-normal">
          {description}
        </p>

        {/* Bottom row metadata */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-medium text-[#71717A] font-sans select-none">
          <span className="text-[#22C55E] bg-[#22C55E]/10 border border-[#22C55E]/20 px-1.5 py-0.5 rounded font-mono font-bold leading-none flex items-center gap-0.5">
            <Brain className="w-3 h-3" />
            {confidenceLabel} Conf
          </span>
          <span>•</span>
          <span className="font-mono text-white/70 bg-[#262626] px-1 py-0.5 rounded">{issue.id}</span>
          <span>•</span>
          <span>Officer: <strong className="text-[#A1A1AA] font-bold">{assignedOfficer}</strong></span>
          <span>•</span>
          <span className="text-[#71717A] font-medium">{fullDate}</span>
        </div>
      </div>

      {/* Right Chevron & Status */}
      <div className="flex flex-col items-end justify-between shrink-0 ml-2 h-[72px] self-start">
        {statusMeta && (
          <span className={`text-[10px] font-sans font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider leading-none ${
            statusMeta.value === "resolved" || statusMeta.value === "closed"
              ? "bg-[#22C55E]/10 border-[#22C55E]/20 text-[#22C55E]"
              : "bg-[#F59E0B]/10 border-[#F59E0B]/20 text-[#F59E0B]"
          }`}>
            {statusMeta.label}
          </span>
        )}
        <div className="flex items-center gap-1 text-[11px] font-semibold text-[#71717A] group-hover:text-[#22C55E] transition-colors font-sans">
          <span>Details</span>
          <ChevronRight className="w-4 h-4 text-[#71717A] group-hover:text-[#22C55E] transition-colors shrink-0" />
        </div>
      </div>
    </button>
  );
};

const IssueCard = React.memo(IssueCardComponent);

// Skeleton placeholder
const IssueCardSkeleton: React.FC = () => (
  <div className="w-full flex items-center justify-between p-4 bg-[#151515] border border-[#262626] rounded-[18px] animate-pulse">
    <div className="w-12 h-12 rounded-[12px] bg-[#262626] shrink-0" />
    <div className="flex-1 ml-4 space-y-2">
      <div className="h-3.5 w-1/3 bg-[#262626] rounded" />
      <div className="h-3 w-3/4 bg-[#262626] rounded" />
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Main Operations Workspace HomePage
// ─────────────────────────────────────────────────────────────────────────────
export const HomePage: React.FC = () => {
  useAuthStore();
  const { issues, loading } = useIssuesFeed();
  const navigate = useNavigate();
  const [seeding, setSeeding] = useState(false);
  const [seedDone, setSeedDone] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<IssueDocument | null>(null);

  const resolvedCount = issues.filter((i) => i.status === "resolved" || i.status === "closed").length;

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
    <div className="max-w-[1700px] mx-auto space-y-8 pb-12 relative text-white px-2 md:px-0">

      {/* Observability ribbon bar */}
      <OperationsRibbon reportsToday={issues.length > 0 ? issues.length : 147} />

      {/* Top Section Grid (Hero 7 / Telemetry 3) */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
        
        {/* Executive Hero Workspace Card */}
        <div className="lg:col-span-7 bg-[#151515] border border-[#262626] rounded-[24px] p-6 relative overflow-hidden h-[230px] flex flex-col justify-between">
          <div className="absolute top-[-20%] right-[-10%] w-[30%] aspect-square rounded-full bg-[#22C55E]/5 blur-[60px] pointer-events-none" />
          
          <div className="flex justify-between items-start h-full">
            {/* Left Content */}
            <div className="space-y-2 max-w-[60%] flex flex-col justify-between h-full text-left">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-[#22C55E]" />
                  <span className="text-[13px] font-semibold text-[#22C55E] font-sans">Municipal AI Platform</span>
                </div>
                <h1 className="text-[34px] font-bold tracking-tight text-white mt-1 leading-tight font-sans">
                  Citizen Operations Workspace
                </h1>
                <p className="text-[15px] text-[#A1A1AA] leading-relaxed font-sans font-normal">
                  Report civic issues with AI-assisted verification and automated municipal routing.
                </p>
              </div>

              {/* Inline Hero stats */}
              <div className="flex gap-6 border-t border-[#262626] pt-4 text-[13px] font-sans font-medium text-[#A1A1AA]">
                <div>
                  <span className="text-[#71717A] uppercase text-[11px] block tracking-wide font-semibold mb-0.5">Reports Today</span>
                  <span className="text-[15px] font-bold text-white"><AnimatedCounter target={issues.length > 0 ? issues.length : 147} /></span>
                </div>
                <div className="border-l border-[#262626] pl-6">
                  <span className="text-[#71717A] uppercase text-[11px] block tracking-wide font-semibold mb-0.5">Departments</span>
                  <span className="text-[15px] font-bold text-white">14</span>
                </div>
                <div className="border-l border-[#262626] pl-6">
                  <span className="text-[#71717A] uppercase text-[11px] block tracking-wide font-semibold mb-0.5">Average SLA</span>
                  <span className="text-[15px] font-bold text-[#22C55E]">36 Hrs</span>
                </div>
                <div className="border-l border-[#262626] pl-6">
                  <span className="text-[#71717A] uppercase text-[11px] block tracking-wide font-semibold mb-0.5">System Health</span>
                  <span className="text-[15px] font-bold text-[#22C55E]">99.8%</span>
                </div>
              </div>
            </div>

            {/* Right SVG graphic - Animated City Network */}
            <div className="w-[35%] h-full hidden md:block border-l border-[#262626] pl-4 py-2">
              <CityNetworkSVG />
            </div>
          </div>
        </div>

        {/* Live Operations Panel Ticker */}
        <div className="lg:col-span-3">
          <LiveAIOpsPanel />
        </div>
      </div>

      {/* Action cards row (50/50) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Report an Issue card */}
        <div 
          onClick={() => navigate("/report")}
          className="bg-[#151515] border border-[#262626] rounded-[20px] p-5 cursor-pointer flex items-center justify-between transition-all duration-[180ms] ease-out hover:-translate-y-0.5 hover:border-[#71717A]/40 hover:shadow-[0_8px_30px_rgb(0,0,0,0.5)] group"
        >
          <div className="flex items-center space-x-4 min-w-0">
            <div className="p-3 bg-[#22C55E]/10 border border-[#22C55E]/20 rounded-[14px]">
              <Camera className="w-5 h-5 text-[#22C55E]" />
            </div>
            <div className="text-left space-y-0.5 min-w-0">
              <h3 className="font-semibold text-[18px] text-[#F5F5F5] font-sans">Report Infrastructure Issue</h3>
              <p className="text-[15px] text-[#A1A1AA] font-normal leading-relaxed truncate max-w-[280px] sm:max-w-md">
                Upload image. Triage with automated classification and SLAs.
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-[#A1A1AA] shrink-0 transition-transform duration-180 ease-out group-hover:translate-x-1.5 text-right" />
        </div>

        {/* Sandbox mode card */}
        <div 
          className="bg-[#151515] border border-[#262626] rounded-[20px] p-5 flex items-center justify-between transition-all duration-[180ms] ease-out hover:-translate-y-0.5 hover:border-[#71717A]/40 hover:shadow-[0_8px_30px_rgb(0,0,0,0.5)]"
        >
          <div className="flex items-center space-x-4 min-w-0">
            <div className="p-3 bg-[#262626] border border-[#262626] rounded-[14px]">
              <Cpu className="w-5 h-5 text-[#A1A1AA]" />
            </div>
            <div className="text-left space-y-0.5 min-w-0">
              <h3 className="font-semibold text-[18px] text-[#F5F5F5] font-sans">Demo Sandbox Mode</h3>
              <p className="text-[15px] text-[#A1A1AA] font-normal leading-relaxed truncate max-w-[200px] sm:max-w-[320px]">
                Seed mock reports. Execute visual triage pipelines.
              </p>
            </div>
          </div>
          <button
            onClick={handleSeedDemo}
            disabled={seeding || seedDone}
            className={`flex items-center gap-1.5 text-[13px] font-sans font-medium px-4 py-2 rounded-[14px] border transition-all duration-150 cursor-pointer select-none shrink-0 ${
              seedDone
                ? "bg-[#22C55E]/10 text-[#22C55E] border-[#22C55E]/20"
                : "bg-[#22C55E] text-black border-[#22C55E] hover:bg-[#2DD66F] active:scale-95"
            }`}
          >
            {seeding ? (
              <><RefreshCw className="w-3.5 h-3.5 animate-spin" />Seeding...</>
            ) : seedDone ? (
              <><CheckCircle2 className="w-3.5 h-3.5" />Seeded</>
            ) : (
              <>Seed Data</>
            )}
          </button>
        </div>
      </div>

      {/* Main Bottom Columns (Feed / Quick Stats) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Community feed container */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-col border-b border-[#262626] pb-3 text-left">
            <div className="flex items-center justify-between">
              <h2 className="text-[22px] font-semibold text-[#F5F5F5] font-sans flex items-center gap-2">
                <Users className="w-5 h-5 text-[#22C55E]" />
                Community Feed
              </h2>
            </div>
            <p className="text-[15px] text-[#A1A1AA] font-sans font-normal mt-0.5">
              Recent reports submitted by citizens
            </p>
          </div>

          {loading ? (
            <div className="space-y-3">
              <IssueCardSkeleton />
              <IssueCardSkeleton />
              <IssueCardSkeleton />
            </div>
          ) : issues.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-4 bg-[#151515] border border-[#262626] rounded-[18px] text-center">
              <Inbox className="w-10 h-10 text-[#71717A]/20" />
              <div className="space-y-1">
                <p className="text-[15px] font-semibold text-white font-sans">No active operations</p>
                <p className="text-[13px] text-[#A1A1AA] font-sans max-w-xs mx-auto">
                  Execute Sandbox seeding above or report a new issue to register logs.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3.5 max-h-[620px] overflow-y-auto pr-1">
              {issues.slice(0, 12).map((issue) => (
                <IssueCard
                  key={issue.id}
                  issue={issue}
                  onClick={() => setSelectedIssue(issue)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Right Side: Municipal stats panel & Map Card */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Live Map Preview Card */}
          <LeafletMapPreview />

          {/* Municipal Overview Headers */}
          <div className="border-b border-[#262626] pb-3 text-left">
            <h2 className="text-[22px] font-semibold text-[#F5F5F5] font-sans flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#22C55E]" />
              Municipal Overview
            </h2>
          </div>

          {/* Unique Stats Widgets */}
          <div className="grid grid-cols-2 gap-3">
            {/* Reports Today */}
            <div className="bg-[#151515] border border-[#262626] p-4 rounded-[16px] flex flex-col justify-between hover:border-[#71717A]/40 transition-all duration-[180ms] ease-out hover:-translate-y-0.5 hover:shadow-[0_8px_35px_rgba(0,0,0,0.5)] select-none text-left">
              <div className="flex items-center justify-between text-[#A1A1AA] mb-2 font-sans">
                <span className="text-[13px] font-medium">Reports Today</span>
                <Zap className="w-3.5 h-3.5 text-[#22C55E]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#F5F5F5] font-sans leading-none">
                  <AnimatedCounter target={issues.length > 0 ? issues.length : 147} />
                </p>
                <p className="text-[13px] font-medium text-[#22C55E] mt-1.5 leading-none">
                  ↑ 12% vs yesterday
                </p>
              </div>
            </div>

            {/* AI Accuracy */}
            <div className="bg-[#151515] border border-[#262626] p-4 rounded-[16px] flex flex-col justify-between hover:border-[#71717A]/40 transition-all duration-[180ms] ease-out hover:-translate-y-0.5 hover:shadow-[0_8px_35px_rgba(0,0,0,0.5)] select-none text-left">
              <div className="flex items-center justify-between text-[#A1A1AA] mb-2 font-sans">
                <span className="text-[13px] font-medium">AI Accuracy</span>
                <Brain className="w-3.5 h-3.5 text-[#2563EB]" />
              </div>
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-2xl font-bold text-[#F5F5F5] font-sans leading-none">96%</p>
                  <p className="text-[13px] font-medium text-[#22C55E] mt-1.5 leading-none">
                    ↑ 3% this month
                  </p>
                </div>
                <div className="w-10 h-10 shrink-0">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <path className="text-[#262626]" strokeWidth="3" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                    <path className="text-[#22C55E]" strokeDasharray="96, 100" strokeWidth="3.2" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Active Departments */}
            <div className="bg-[#151515] border border-[#262626] p-4 rounded-[16px] flex flex-col justify-between hover:border-[#71717A]/40 transition-all duration-[180ms] ease-out hover:-translate-y-0.5 hover:shadow-[0_8px_35px_rgba(0,0,0,0.5)] select-none text-left">
              <div className="flex items-center justify-between text-[#A1A1AA] mb-2 font-sans">
                <span className="text-[13px] font-medium">Departments</span>
                <Building className="w-3.5 h-3.5 text-[#A1A1AA]/60" />
              </div>
              <div>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-bold text-[#F5F5F5] font-sans leading-none">14</p>
                  <span className="text-[13px] font-medium text-[#22C55E] flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-pulse animate-duration-1000" />
                    Online
                  </span>
                </div>
                <p className="text-[13px] text-[#71717A] mt-1.5 leading-none">
                  All pipelines operational
                </p>
              </div>
            </div>

            {/* Dispatch SLA */}
            <div className="bg-[#151515] border border-[#262626] p-4 rounded-[16px] flex flex-col justify-between hover:border-[#71717A]/40 transition-all duration-[180ms] ease-out hover:-translate-y-0.5 hover:shadow-[0_8px_35px_rgba(0,0,0,0.5)] select-none text-left">
              <div className="flex items-center justify-between text-[#A1A1AA] mb-2 font-sans">
                <span className="text-[13px] font-medium">Dispatch SLA</span>
                <Route className="w-3.5 h-3.5 text-[#F59E0B]" />
              </div>
              <div className="space-y-2">
                <div className="flex items-baseline justify-between">
                  <p className="text-2xl font-bold text-[#F5F5F5] font-sans leading-none">36h</p>
                  <span className="text-[12px] text-[#71717A] font-mono">98% Met</span>
                </div>
                <div className="flex items-center justify-between w-full pt-1.5">
                  <div className="h-1 flex-1 bg-[#22C55E] rounded-full" />
                  <div className="w-1.5 h-1.5 rounded-full bg-[#22C55E] -mx-0.5" />
                  <div className="h-1 flex-1 bg-[#22C55E] rounded-full" />
                  <div className="w-1.5 h-1.5 rounded-full bg-[#22C55E] -mx-0.5" />
                  <div className="h-1 flex-1 bg-[#262626] rounded-full" />
                  <div className="w-1.5 h-1.5 rounded-full bg-[#71717A] -mx-0.5" />
                </div>
              </div>
            </div>

            {/* Resolved Incidents */}
            <div className="bg-[#151515] border border-[#262626] p-4 rounded-[16px] flex flex-col justify-between hover:border-[#71717A]/40 transition-all duration-[180ms] ease-out hover:-translate-y-0.5 hover:shadow-[0_8px_35px_rgba(0,0,0,0.5)] select-none text-left">
              <div className="flex items-center justify-between text-[#A1A1AA] mb-2 font-sans">
                <span className="text-[13px] font-medium">Resolved</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-[#22C55E]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#F5F5F5] font-sans leading-none">
                  {resolvedCount} <span className="text-xs font-normal text-[#A1A1AA]">/ {issues.length || 147}</span>
                </p>
                <p className="text-[13px] font-medium text-[#22C55E] mt-1.5 leading-none">
                  {issues.length > 0 ? Math.round((resolvedCount / issues.length) * 100) : 84}% rate today
                </p>
              </div>
            </div>

            {/* Average Response */}
            <div className="bg-[#151515] border border-[#262626] p-4 rounded-[16px] flex flex-col justify-between hover:border-[#71717A]/40 transition-all duration-[180ms] ease-out hover:-translate-y-0.5 hover:shadow-[0_8px_35px_rgba(0,0,0,0.5)] select-none text-left">
              <div className="flex items-center justify-between text-[#A1A1AA] mb-2 font-sans">
                <span className="text-[13px] font-medium">Avg Response</span>
                <Clock className="w-3.5 h-3.5 text-[#2563EB]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#F5F5F5] font-sans leading-none">1.2h</p>
                <p className="text-[13px] font-medium text-[#22C55E] mt-1.5 leading-none">
                  Optimal speed
                </p>
              </div>
            </div>
          </div>

          {/* Observed Ward Distribution */}
          <div className="bg-[#151515] border border-[#262626] rounded-[16px] p-5 space-y-3.5 text-left">
            <h4 className="text-[13px] font-semibold text-[#F5F5F5] font-sans flex items-center gap-1.5">
              <CircleDot className="w-3.5 h-3.5 text-[#22C55E]" />
              Observed Ward Distribution
            </h4>
            <div className="space-y-2 pt-1 text-[13px] text-[#A1A1AA] font-sans">
              <div className="flex justify-between">
                <span>Ward 12 (Coral Zone)</span>
                <span className="text-[#F5F5F5] font-medium">40%</span>
              </div>
              <div className="w-full bg-[#262626] h-1.5 rounded-full overflow-hidden">
                <div className="bg-[#22C55E] h-full" style={{ width: "40%" }} />
              </div>
              <div className="flex justify-between pt-1">
                <span>Ward 09 (Metro North)</span>
                <span className="text-[#F5F5F5] font-medium">35%</span>
              </div>
              <div className="w-full bg-[#262626] h-1.5 rounded-full overflow-hidden">
                <div className="bg-[#22C55E] h-full opacity-80" style={{ width: "35%" }} />
              </div>
              <div className="flex justify-between pt-1">
                <span>Other Sectors</span>
                <span className="text-[#F5F5F5] font-medium">25%</span>
              </div>
              <div className="w-full bg-[#262626] h-1.5 rounded-full overflow-hidden">
                <div className="bg-[#22C55E] h-full opacity-50" style={{ width: "25%" }} />
              </div>
            </div>
          </div>

        </div>

      </div>

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

export default HomePage;
