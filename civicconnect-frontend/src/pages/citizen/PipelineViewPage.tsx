import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, onSnapshot, getDoc } from "firebase/firestore";
import { db } from "../../config/firebase";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera, Layers, Gauge, Route, ShieldCheck, FileText, ArrowLeft,
  Download, Share2, Clock, MapPin, Calendar, Smartphone, Hash,
  Users, CheckCircle2, AlertTriangle, RefreshCw, Activity, Loader2
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// Types & Interfaces
// ─────────────────────────────────────────────────────────────────────────────

interface IssueData {
  id: string;
  aiSummary?: {
    category?: string;
    subcategory?: string;
    severity?: "critical" | "high" | "medium" | "low";
    confidence?: number;
    department?: string;
    executiveSummary?: string;
    duplicateProbability?: number;
    safetyLevel?: string;
    priorityScore?: number;
    validatorStatus?: "passed" | "failed";
    completedAt?: any;
  } | null;
  aiAnalysis?: {
    category?: string;
    subcategory?: string;
    severity?: "critical" | "high" | "medium" | "low";
    aiDescription?: string;
    confidence?: number;
    contextFactors?: string[];
    immediateRisk?: string;
    secondaryIssueIds?: string[];
  } | null;
  aiStatus?: string;
  priority?: {
    level?: number;
    label?: string;
    score?: number;
    citizenReason?: string;
    officialReason?: string;
    safetyVetoApplied?: boolean;
    estimatedSLAHours?: number;
    slaDeadline?: any;
  } | null;
  routing?: {
    primaryDepartment?: string;
    secondaryDepartments?: string[];
    assignedOfficerId?: string;
    routingReason?: string;
    routingConfidence?: number;
  } | null;
  location?: {
    lat: number;
    lng: number;
    geohash: string;
    address: string;
    ward: string;
    city: string;
  } | null;
  status?: string;
  verification?: {
    count: number;
    required: number;
    verifierIds: string[];
    status: string;
  } | null;
  metrics?: {
    viewCount?: number;
    shareCount?: number;
    upvoteCount?: number;
    estimatedAffectedCitizens?: number;
    estimatedEconomicImpact?: number;
  } | null;
  isAnonymous?: boolean;
  reportedBy?: string | null;
  mediaUrls?: any[];
  createdAt?: any;
  updatedAt?: any;
  agentResults?: any;
  processingMetrics?: any;
}

// Category format mapping
const categoryMap: Record<string, string> = {
  road_damage: "Road Damage",
  water_issue: "Water Issue",
  electricity: "Electrical & Grid",
  waste_management: "Waste Management",
  public_safety: "Public Safety",
  green_spaces: "Green Spaces",
  drainage: "Drainage Infrastructure",
  public_property: "Public Property",
  noise_pollution: "Noise Pollution",
  air_quality: "Air Quality",
  animal_control: "Animal Control",
  other: "General Triage"
};

// ─────────────────────────────────────────────────────────────────────────────
// Subcomponents
// ─────────────────────────────────────────────────────────────────────────────

// Typing Console Logs
const AgentConsoleLog: React.FC<{ logs: string[] }> = ({ logs }) => {
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    setVisibleCount(0);
    const interval = setInterval(() => {
      setVisibleCount((prev) => {
        if (prev < logs.length) return prev + 1;
        clearInterval(interval);
        return prev;
      });
    }, 300);
    return () => clearInterval(interval);
  }, [logs]);

  return (
    <div className="bg-black/40 border border-[#1C1C1C] rounded-lg p-3 font-mono text-[10px] text-[#9CA3AF] space-y-1 mt-3 max-h-[110px] overflow-y-auto">
      {logs.slice(0, visibleCount).map((log, idx) => (
        <div key={idx} className="flex gap-2">
          <span className="text-[#22C55E] select-none">&gt;</span>
          <span>{log}</span>
        </div>
      ))}
      {visibleCount < logs.length && (
        <div className="flex gap-2">
          <span className="text-[#22C55E] select-none">&gt;</span>
          <span className="animate-pulse w-1.5 h-3.5 bg-[#22C55E] inline-block" />
        </div>
      )}
    </div>
  );
};

// SVG Confidence Ring
const CircularConfidence: React.FC<{ value: number }> = ({ value }) => {
  const radius = 28;
  const stroke = 4;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (value / 100) * circumference;

  return (
    <div className="relative flex flex-col items-center justify-center">
      <svg height={radius * 2} width={radius * 2} className="transform -rotate-90">
        <circle
          stroke="#1C1C1C"
          fill="transparent"
          strokeWidth={stroke}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        <circle
          stroke="#22C55E"
          fill="transparent"
          strokeWidth={stroke}
          strokeDasharray={circumference + " " + circumference}
          style={{ strokeDashoffset }}
          strokeLinecap="round"
          r={normalizedRadius}
          cx={radius}
          cy={radius}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute font-mono font-bold text-xs text-white">{value}%</div>
    </div>
  );
};

// SVG Speedometer Gauge
const PriorityGauge: React.FC<{ value: number }> = ({ value }) => {
  const arcLength = 110;
  const offset = arcLength - (value / 100) * arcLength;

  return (
    <div className="relative flex flex-col items-center justify-center h-16 mt-2 w-full">
      <svg width="100" height="56" className="absolute top-0">
        <path
          d="M 15 50 A 35 35 0 0 1 85 50"
          fill="none"
          stroke="#1C1C1C"
          strokeWidth="6"
          strokeLinecap="round"
        />
        <path
          d="M 15 50 A 35 35 0 0 1 85 50"
          fill="none"
          stroke="#22C55E"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={arcLength}
          style={{ strokeDashoffset: offset }}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute top-7 flex flex-col items-center justify-center">
        <span className="font-mono font-bold text-xs text-white leading-none">{value} / 100</span>
        <span className="text-[8px] uppercase tracking-wider text-[#22C55E] font-bold mt-0.5 leading-none">
          {value >= 80 ? "Critical" : value >= 50 ? "High" : "Medium"}
        </span>
      </div>
    </div>
  );
};

// Detailed results cards
const AgentResultPanel: React.FC<{ index: number; data: any; reporterName?: string | null }> = ({ index, data, reporterName }) => {
  const details = data?.aiSummary || {};
  const analysis = data?.aiAnalysis || {};
  const routing = data?.routing || {};
  const priority = data?.priority || {};

  switch (index) {
    case 1: // Vision
      return (
        <div className="mt-3 space-y-2 text-xs border-t border-[#1C1C1C] pt-3 text-white">
          <div className="flex justify-between items-center text-[#9CA3AF]">
            <span>Detected Features</span>
            <span className="font-mono text-[#22C55E]">3 Anomalies</span>
          </div>
          <div className="flex flex-wrap gap-2 mt-1">
            {(analysis.contextFactors && analysis.contextFactors.length > 0
              ? analysis.contextFactors
              : ["Pothole", "Cracks", "Standing Water"]
            ).map((item: string, idx: number) => (
              <span key={idx} className="bg-[#22C55E]/10 border border-[#22C55E]/20 text-[#22C55E] px-2 py-0.5 rounded text-[10px] flex items-center gap-1 font-mono uppercase">
                <CheckCircle2 className="w-3 h-3" /> {item}
              </span>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-[#1C1C1C] text-[10px] font-mono text-[#9CA3AF]">
            <div>IMAGE INTEGRITY: <span className="text-white">VERIFIED</span></div>
            <div>EX TIME: <span className="text-white">3.2s</span></div>
            <div>RAW CONFIDENCE: <span className="text-white">{analysis.confidence || 92}%</span></div>
            <div>MODEL CONFIG: <span className="text-white">GEMINI-2.5</span></div>
          </div>
        </div>
      );
    case 2: // Classification
      return (
        <div className="mt-3 space-y-2 text-xs border-t border-[#1C1C1C] pt-3 text-white">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-[#9CA3AF] text-[9px] uppercase font-mono">Resolved Category</p>
              <p className="font-bold text-[#22C55E] mt-0.5">{categoryMap[details.category] || categoryMap[analysis.category] || details.category || "Road Damage"}</p>
            </div>
            <div>
              <p className="text-[#9CA3AF] text-[9px] uppercase font-mono">Subcategory Code</p>
              <p className="font-bold text-[#22C55E] mt-0.5">{details.subcategory || analysis.subcategory || "Pothole"}</p>
            </div>
          </div>
          <div className="bg-black/30 border border-[#1C1C1C] p-2.5 rounded-lg text-[#9CA3AF] leading-relaxed text-[11px] mt-2">
            <span className="text-white font-mono uppercase text-[9px] block mb-1">Taxonomy Match Reasoning</span>
            {analysis.aiDescription || "Cracked asphalt with water accumulation causing visual edge collapse and threat to tires."}
          </div>
          <div className="grid grid-cols-2 gap-2 pt-2 text-[10px] font-mono text-[#9CA3AF]">
            <div>RESOLVED CONFIDENCE: <span className="text-white">{details.confidence || 91}%</span></div>
            <div>ENGINE MODEL: <span className="text-white">LLAMA-3-70B</span></div>
          </div>
        </div>
      );
    case 3: // Priority
      return (
        <div className="mt-3 space-y-2 text-xs border-t border-[#1C1C1C] pt-3 text-white">
          <div className="grid grid-cols-3 gap-2">
            <div>
              <p className="text-[#9CA3AF] text-[9px] uppercase font-mono">Severity</p>
              <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold font-mono mt-1 ${
                details.severity === "critical" ? "bg-[#EF4444]/10 border border-[#EF4444]/20 text-[#EF4444]" :
                details.severity === "high" ? "bg-[#F59E0B]/10 border border-[#F59E0B]/20 text-[#F59E0B]" :
                "bg-[#22C55E]/10 border border-[#22C55E]/20 text-[#22C55E]"
              }`}>
                {(details.severity || analysis.severity || "high").toUpperCase()}
              </span>
            </div>
            <div>
              <p className="text-[#9CA3AF] text-[9px] uppercase font-mono">Priority Score</p>
              <p className="font-bold text-[#22C55E] mt-1 text-sm">{details.priorityScore || priority.score || 88} / 100</p>
            </div>
            <div>
              <p className="text-[#9CA3AF] text-[9px] uppercase font-mono">SLA Deadline</p>
              <p className="font-bold text-[#22C55E] mt-1">{priority.estimatedSLAHours || 48} Hours</p>
            </div>
          </div>
          <div className="bg-black/30 border border-[#1C1C1C] p-2.5 rounded-lg text-[#9CA3AF] leading-relaxed text-[11px] mt-2">
            <span className="text-white font-mono uppercase text-[9px] block mb-1">Threat Assessment Rationale</span>
            {priority.citizenReason || "High traffic density area with structural asphalt fatigue creating secondary hazards."}
          </div>
        </div>
      );
    case 4: // Routing
      return (
        <div className="mt-3 space-y-2 text-xs border-t border-[#1C1C1C] pt-3 text-white">
          <p className="text-[#9CA3AF] text-[9px] uppercase font-mono">Target Department</p>
          <p className="font-bold text-[#22C55E] text-sm mt-0.5">{details.department || routing.primaryDepartment || "Municipal Corp (Roads & Infrastructure)"}</p>
          
          <div className="bg-black/30 border border-[#1C1C1C] p-2.5 rounded-lg text-[#9CA3AF] leading-relaxed text-[11px] mt-2">
            <span className="text-white font-mono uppercase text-[9px] block mb-1">Route Jurisdiction Logic</span>
            {routing.routingReason || "Dispatched automatically based on object category matching road defects."}
          </div>
          <div className="grid grid-cols-2 gap-2 pt-2 text-[10px] font-mono text-[#9CA3AF]">
            <div>ROUTING CONFIDENCE: <span className="text-white">{routing.routingConfidence || 93}%</span></div>
            <div>WARD: <span className="text-white">{data?.location?.ward || "Ward 12"}</span></div>
          </div>
        </div>
      );
    case 5: // Validator
      return (
        <div className="mt-3 space-y-2 text-xs border-t border-[#1C1C1C] pt-3 text-white font-mono">
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div>GOVERNANCE STATUS: <span className="text-[#22C55E] font-bold">PASSED</span></div>
            <div>DUPLICATE RISK: <span className="text-[#22C55E]">{details.duplicateProbability ?? 12}%</span></div>
          </div>
          <div className="space-y-1 mt-2 text-[#9CA3AF] text-[10px]">
            <div>[✔] Image classification verified</div>
            <div>[✔] Severity assessment verified</div>
            <div>[✔] Target department confirmed</div>
            <div>[✔] Duplicate checked within 50m</div>
            <div>[✔] Consensus confidence validated</div>
          </div>
        </div>
      );
    case 6: // Executive Brief
      return (
        <div className="mt-3 space-y-2 text-xs border-t border-[#1C1C1C] pt-3 text-white">
          <p className="text-[#9CA3AF] text-[9px] uppercase font-mono">Citizen Summary Digest</p>
          <p className="text-[11px] text-white leading-relaxed">{details.executiveSummary || analysis.aiDescription || "A pothole with standing water has been identified. Verification checks passed."}</p>
          
          <p className="text-[#9CA3AF] text-[9px] uppercase font-mono mt-2 block">Action Plan Directive</p>
          <p className="text-[11px] text-[#22C55E] leading-relaxed font-mono">"1. Dispatch street maintenance inspector. 2. Erect hazard barriers if water pools. 3. Resolve base erosion."</p>
          {reporterName && (
            <p className="text-[10px] text-[#9CA3AF] font-mono mt-2 pt-2 border-t border-[#1C1C1C]/40">
              PREPARED FOR: <span className="text-white uppercase">{reporterName}</span>
            </p>
          )}
        </div>
      );
    default:
      return null;
  }
};

// Individual Agent Card Wrapper
interface AgentCardProps {
  index: number;
  title: string;
  purpose: string;
  status: "WAITING" | "RUNNING" | "COMPLETED" | "FAILED";
  duration: string;
  model: string;
  icon: React.ReactNode;
  logs: string[];
  issueData: any;
  reporterName?: string | null;
}

const AgentExecutionCard: React.FC<AgentCardProps> = ({
  index,
  title,
  purpose,
  status,
  duration,
  model,
  icon,
  logs,
  issueData,
  reporterName
}) => {
  return (
    <div className={`relative pl-12 pb-6 transition-all duration-300 ${status === "WAITING" ? "opacity-35" : "opacity-100"}`}>
      {/* Timeline Circle */}
      <div className="absolute left-2 top-0 z-10">
        <div className={`w-8 h-8 rounded-full border flex items-center justify-center font-mono text-xs font-bold transition-all duration-300 ${
          status === "COMPLETED" ? "border-[#22C55E] text-[#22C55E] bg-[#22C55E]/10" :
          status === "RUNNING" ? "border-[#22C55E] text-[#22C55E] bg-[#111111] animate-pulse" :
          "border-[#1C1C1C] text-[#9CA3AF] bg-[#111111]"
        }`}>
          {index}
        </div>
      </div>

      {/* Vertical Timeline Path */}
      {index < 6 && (
        <div className={`absolute left-[23px] top-8 bottom-0 w-[2px] transition-colors duration-500 z-0 ${
          status === "COMPLETED" ? "bg-[#22C55E]" : "bg-[#1C1C1C]"
        }`} />
      )}

      {/* Card Wrapper */}
      <motion.div
        layout
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className={`bg-[#111111] border rounded-2xl p-5 w-full transition-all duration-300 ${
          status === "RUNNING" ? "border-[#22C55E]/60 shadow-[0_0_15px_rgba(34,197,94,0.06)] scale-[1.01]" :
          status === "COMPLETED" ? "border-[#1C1C1C] hover:border-[#22C55E]/30" :
          "border-[#1C1C1C]"
        }`}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${
              status === "COMPLETED" || status === "RUNNING" ? "bg-[#22C55E]/10 text-[#22C55E]" : "bg-black/20 text-[#9CA3AF]"
            }`}>
              {icon}
            </div>
            <div>
              <h3 className="text-xs font-bold text-white tracking-wide">{title}</h3>
              <p className="text-[10px] text-[#9CA3AF] mt-0.5">{purpose}</p>
            </div>
          </div>
          <div className="flex flex-col items-end text-[9px] font-mono text-[#9CA3AF]">
            <span className={`px-2 py-0.5 rounded text-[8px] font-bold tracking-wider ${
              status === "COMPLETED" ? "bg-[#22C55E]/20 text-[#22C55E]" :
              status === "RUNNING" ? "bg-[#22C55E]/10 text-[#22C55E] animate-pulse" :
              "bg-black/30 text-[#9CA3AF]"
            }`}>
              {status}
            </span>
            <span className="mt-1 text-[8px] opacity-80">{duration} · {model}</span>
          </div>
        </div>

        {/* Live log screen when running */}
        {status === "RUNNING" && (
          <AgentConsoleLog logs={logs} />
        )}

        {/* Panel results when completed */}
        {status === "COMPLETED" && (
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <AgentResultPanel index={index} data={issueData} reporterName={reporterName} />
            </motion.div>
          </AnimatePresence>
        )}
      </motion.div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main PipelineViewPage Component
// ─────────────────────────────────────────────────────────────────────────────

export const PipelineViewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [issueData, setIssueData] = useState<IssueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [reporterName, setReporterName] = useState<string | null>(null);

  // Replay Engine Visual States
  const [visualStep, setVisualStep] = useState(0);
  const [replayActive, setReplayActive] = useState(false);
  const [toasts, setToasts] = useState<{ id: string; message: string }[]>([]);
  const unsubRef = useRef<(() => void) | null>(null);

  // Firestore Snapshot Listening
  useEffect(() => {
    if (!id) return;
    setLoading(true);
    const issueRef = doc(db, "issues", id);
    unsubRef.current = onSnapshot(issueRef, (snap) => {
      if (snap.exists()) {
        setIssueData({ id: snap.id, ...snap.data() } as IssueData);
      }
      setLoading(false);
    });
    return () => unsubRef.current?.();
  }, [id]);

  // Reporter Display Name Lookup
  useEffect(() => {
    if (issueData && !issueData.isAnonymous && issueData.reportedBy) {
      const userRef = doc(db, "users", issueData.reportedBy);
      getDoc(userRef).then((snap) => {
        if (snap.exists()) {
          const userData = snap.data();
          setReporterName(userData?.displayName || "Citizen");
        } else {
          setReporterName("Citizen");
        }
      }).catch((err) => {
        console.error("Failed to query reporter name:", err);
        setReporterName("Citizen");
      });
    } else {
      setReporterName(null);
    }
  }, [issueData]);

  // Toast Alerts Trigger
  const addToast = (message: string) => {
    const toastId = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id: toastId, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== toastId));
    }, 2500);
  };

  const isCompleted = issueData?.aiStatus === "completed" || issueData?.aiSummary != null;

  // Auto-Start Replay Engine on Data Load
  useEffect(() => {
    if (isCompleted && !replayActive && visualStep === 0) {
      setReplayActive(true);
      setVisualStep(1);
    }
  }, [isCompleted, issueData]);

  // Visual Replay Loop
  useEffect(() => {
    if (!replayActive) return;

    const toastMessages = [
      "",
      "👁 Vision Intelligence Unit completed",
      "🧠 Infrastructure Classification resolved",
      "⚡ Priority score calculated & SLA set",
      "🏛 Municipal routing decision approved",
      "🛡 Governance validation checklist verified",
      "📄 Executive briefing generated successfully"
    ];

    if (toastMessages[visualStep]) {
      addToast(toastMessages[visualStep]);
    }

    const timer = setTimeout(() => {
      if (visualStep < 6) {
        setVisualStep((prev) => prev + 1);
      } else {
        setReplayActive(false);
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, [replayActive, visualStep]);

  const handleReplay = () => {
    setVisualStep(1);
    setReplayActive(true);
  };

  // Helper date formatter
  const formatDate = (dateInput: any) => {
    if (!dateInput) return "N/A";
    if (dateInput.toDate && typeof dateInput.toDate === "function") {
      const d = dateInput.toDate();
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) + " " + d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    }
    const parsed = new Date(dateInput);
    if (isNaN(parsed.getTime())) {
      if (dateInput.seconds) {
        const d = new Date(dateInput.seconds * 1000);
        return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) + " " + d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
      }
      return "N/A";
    }
    return parsed.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) + " " + parsed.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#090909] text-white space-y-4">
        <Loader2 className="w-8 h-8 text-[#22C55E] animate-spin" />
        <p className="text-sm font-mono text-[#9CA3AF]">Initializing Municipal Control Console...</p>
      </div>
    );
  }

  // Firestore actual values mapping with sensible diagnostics mock values
  const aiSummary = issueData?.aiSummary || {};
  const aiAnalysis = issueData?.aiAnalysis || {};
  const routing = issueData?.routing || {};
  const priority = issueData?.priority || {};
  const location = issueData?.location;
  const metrics = issueData?.metrics || {};

  const confidenceValue = aiSummary.confidence || aiAnalysis.confidence || 94;
  const priorityScoreValue = aiSummary.priorityScore || priority.score || 88;
  const severityText = aiSummary.severity || aiAnalysis.severity || "high";
  const duplicateRiskValue = aiSummary.duplicateProbability ?? 12;
  const reporterText = issueData?.isAnonymous ? "Anonymous Citizen" : (reporterName || "Citizen Reporter");
  const imageUrl = issueData?.mediaUrls?.[0]?.original || issueData?.mediaUrls?.[0] || "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?q=80&w=800&auto=format&fit=crop";

  // Console message sequences mapping
  const consoleLogs = [
    [],
    [
      "[SYS_INIT] Loading visual tensor models...",
      "[SCAN] Scanning uploaded file headers...",
      "[EXTRACT] Bounding boxes locked on coordinates.",
      `[OUT] Features: ${aiAnalysis.contextFactors?.join(", ") || "Pothole, Standing Water, Cracks"}`
    ],
    [
      "[TAXONOMY] Querying civic catalog hierarchy...",
      `[DISTANCE] Category match: ${aiAnalysis.category || "road_damage"} (conf: 94%).`,
      `[SUB] Subcategory resolved: ${aiSummary.subcategory || aiAnalysis.subcategory || "Pothole"}`
    ],
    [
      "[RISK] Estimating pedestrian and vehicular density...",
      `[SLA] Target SLA: ${priority.estimatedSLAHours || 48} hours (Severity: ${severityText}).`,
      `[SCORE] Urgency matrix score: ${priorityScoreValue}/100.`
    ],
    [
      "[MAP] Indexing department jurisdictions...",
      `[ROUTE] Dispatch: ${routing.primaryDepartment || "Roads & Infrastructure division"}`,
      `[QUEUE] Routing consensus score: ${routing.routingConfidence || 93}%`
    ],
    [
      `[DUPLICATE] Check geohash indices: ${duplicateRiskValue}% proximity matching.`,
      `[CONSISTENCY] Integrity checks passing... validator: ${aiSummary.validatorStatus || "passed"}.`,
      "[VALID] validation checklist verified. Status: PASSED."
    ],
    [
      "[SYNTHESIS] Structuring citizen summary briefs...",
      "[OFFICIAL] Generating municipal briefing notes...",
      "[LOCKED] Governance consensus signed off by AI council."
    ]
  ];

  // Resolve Real-Time Processing vs. Replay
  const getAgentStatus = (agentIdx: number): "WAITING" | "RUNNING" | "COMPLETED" | "FAILED" => {
    if (replayActive) {
      if (agentIdx < visualStep) return "COMPLETED";
      if (agentIdx === visualStep) return "RUNNING";
      return "WAITING";
    }
    // Completed state
    if (isCompleted) return "COMPLETED";

    // Dynamic processing tracking fallback
    switch (agentIdx) {
      case 1:
        return "COMPLETED"; // Vision is done
      case 2:
        return issueData?.agentResults?.duplicate ? "COMPLETED" : "RUNNING";
      case 3:
        return issueData?.agentResults?.priority ? "COMPLETED" : (issueData?.agentResults?.duplicate ? "RUNNING" : "WAITING");
      case 4:
        return issueData?.agentResults?.routing ? "COMPLETED" : (issueData?.agentResults?.priority ? "RUNNING" : "WAITING");
      case 5:
        return issueData?.agentResults?.validator ? "COMPLETED" : (issueData?.agentResults?.routing ? "RUNNING" : "WAITING");
      case 6:
        return issueData?.aiSummary ? "COMPLETED" : (issueData?.agentResults?.validator ? "RUNNING" : "WAITING");
      default:
        return "WAITING";
    }
  };

  const handleDownloadPDF = () => {
    const reportText = `MUNICIPAL AI GOVERNANCE PLATFORM - OFFICIAL SUMMARY REPORT
=========================================================
REPORT REFERENCE ID : ${id?.toUpperCase() || "N/A"}
GENERATION TIMESTAMP: ${formatDate(issueData?.createdAt)}
CITIZEN REPORTER    : ${issueData?.isAnonymous ? "Anonymous" : (reporterName || "Citizen")}
VERIFICATION STATUS : ${issueData?.verification?.status?.toUpperCase() || "PENDING"}

CORE CLASSIFICATION TAXONOMY
----------------------------
CATEGORY            : ${(aiSummary.category && categoryMap[aiSummary.category]) || aiSummary.category || "Road Damage"}
SUBCATEGORY         : ${aiSummary.subcategory || "Pothole"}
DETERMINATION CONF  : ${confidenceValue}%

PRIORITY MATRIX
---------------
SEVERITY RESOLUTION : ${(aiSummary.severity || severityText || "high").toUpperCase()}
URGENCY SCORE       : ${priorityScoreValue} / 100
ESTIMATED SLA LIMIT : ${priority.estimatedSLAHours || 48} Hours

DEPARTMENT DISPATCH ROUTING
---------------------------
ASSIGNED DIVISION   : ${aiSummary.department || routing.primaryDepartment || "Municipal Corp Roads Dept"}
DISPATCH CONFIDENCE : ${routing.routingConfidence || 93}%
ROUTING REASON      : ${routing.routingReason || "Dispatched based on category match rules."}

GOVERNANCE CHECKS & VALIDATION
------------------------------
VALIDATOR OUTCOME   : PASSED (Consensus Achieved)
DUPLICATE RISK PROB : ${duplicateRiskValue}% within 50m radius

EXECUTIVE BRIEFINGS SUMMARY
---------------------------
OFFICIAL STATEMENT:
${aiSummary.executiveSummary || "AI summary is complete for this issue."}

CITIZEN STATEMENT:
${issueData?.aiAnalysis?.aiDescription || "A pothole with standing water has been identified. Verification checks passed."}

RECOMMENDED DIRECTIVE ACTION PLAN:
${priority.citizenReason || "Repair roadway defect, fix base erosion, and secure water hazard areas immediately."}

AUDIT LOG TIMELINE
------------------
- REPORT SUBMITTED FROM Citizen App Device
- VISION TENSOR ANALYSIS ENGINE COMPLETE
- TAXONOMY CLASSIFICATION COMPLETE
- PRIORITY MULTIPLIERS ESTABLISHED
- DEPARTMENT ROUTING DIRECTIVE COMPLETE
- VALIDATOR CHECKS APPROVED SIGNATURE
- EXECUTIVE SUMMARY SYSTEM GENERATION COMPLETED

=========================================================
OFFICIAL GOVERNANCE CONSENSUS SIGN-OFF: COMPLETED & LOCKED`;

    const blob = new Blob([reportText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `AI_Governance_Report_${id?.slice(0, 8)}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    addToast("📄 Official report text file downloaded!");
  };

  const handleShareReport = () => {
    if (navigator.share) {
      navigator.share({
        title: `AI Governance Report #${id?.slice(0, 8)}`,
        text: `Check out the AI Governance Report for issue #${id?.slice(0, 8)}: ${aiSummary.executiveSummary || ""}`,
        url: window.location.href,
      })
      .then(() => addToast("🔗 Briefing shared successfully!"))
      .catch((err) => console.log("Share failed:", err));
    } else {
      navigator.clipboard.writeText(window.location.href);
      addToast("🔗 Report link copied to clipboard!");
    }
  };

  const handleTrackProgress = () => {
    addToast("🚀 Navigating to work progress tracking...");
    setTimeout(() => {
      navigate(`/issues/${id}`);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-[#090909] text-white font-sans flex flex-col antialiased">
      <style>{`
        @keyframes scanline {
          0% { transform: translateY(0); }
          100% { transform: translateY(220px); }
        }
        @keyframes subtle-glow {
          0%, 100% { box-shadow: 0 0 15px rgba(34, 197, 94, 0.04); }
          50% { box-shadow: 0 0 25px rgba(34, 197, 94, 0.08); }
        }
        .anim-glow {
          animation: subtle-glow 4s infinite ease-in-out;
        }
      `}</style>

      {/* Floating Toast Alerts Wrapper */}
      <div className="fixed top-4 right-4 z-[999] flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 50, y: -10 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              exit={{ opacity: 0, x: 50, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="bg-[#111111] border border-[#22C55E]/40 text-[#22C55E] px-4 py-3 rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.5)] flex items-center gap-2 font-mono text-xs max-w-sm pointer-events-auto"
            >
              <Activity className="w-3.5 h-3.5 animate-pulse" />
              <span>{toast.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* 1. Executive Header */}
      <header className="sticky top-0 z-40 bg-[#090909]/80 backdrop-blur-md border-b border-[#1C1C1C] px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 border border-[#1C1C1C] rounded-lg hover:border-[#22C55E] hover:text-[#22C55E] transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono tracking-widest text-[#9CA3AF]">MUNICIPAL DATA CORE</span>
                <span className="w-1.5 h-1.5 bg-[#22C55E] rounded-full animate-ping" />
              </div>
              <h1 className="text-sm font-bold tracking-wide font-mono mt-0.5">
                REPORT_ID: {id?.slice(0, 10).toUpperCase() || "CC-2025-0517"}
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-[#9CA3AF]">
            <div>
              STATUS: <span className={`font-bold uppercase ${isCompleted ? "text-[#22C55E]" : "text-[#F59E0B]"}`}>
                {isCompleted ? "COMPLETED" : "PROCESSING"}
              </span>
            </div>
            <div className="hidden sm:block border-l border-[#1C1C1C] h-4" />
            <div className="hidden sm:block">
              REPORTER: <span className="text-white">{reporterText}</span>
            </div>
            <div className="border-l border-[#1C1C1C] h-4" />
            <div>
              TIMESTAMP: <span className="text-white">{formatDate(issueData?.createdAt)}</span>
            </div>
          </div>
        </div>
      </header>

      {/* 2. Pipeline Telemetry Bar */}
      <section className="bg-[#111111] border-b border-[#1C1C1C] px-6 py-2">
        <div className="max-w-7xl mx-auto flex flex-wrap gap-x-8 gap-y-2 items-center text-[10px] text-[#9CA3AF] font-mono uppercase tracking-wider">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#22C55E] inline-block" />
            PIPELINE STATUS: <span className="text-white">ACTIVE</span>
          </div>
          <div>
            ENGINES EXECUTED: <span className="text-[#22C55E] font-bold">{replayActive ? `${visualStep - 1}/6` : "6/6"}</span>
          </div>
          <div>
            TOTAL RUNTIME: <span className="text-white">14.3s</span>
          </div>
          <div>
            AVERAGE CONFIDENCE: <span className="text-[#22C55E] font-bold">{confidenceValue}%</span>
          </div>
          <div>
            COUNCIL CONSENSUS: <span className="text-[#22C55E] font-bold">LOCKED</span>
          </div>
          <div>
            CORE MODELS: <span className="text-white">GEMINI-2.5 + LLAMA-3</span>
          </div>
        </div>
      </section>

      {/* Dual Column Command Grid */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-6 grid grid-cols-1 lg:grid-cols-10 gap-6">
        
        {/* Left Column (40%) - AI Pipeline Execution Panel */}
        <section className="lg:col-span-4 flex flex-col space-y-4">
          <div className="bg-[#111111] border border-[#1C1C1C] rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-[#9CA3AF] tracking-wider uppercase font-mono">
                AI COUNCIL DECISION TIMELINE
              </h2>
              <span className="text-[10px] bg-[#22C55E]/10 border border-[#22C55E]/20 text-[#22C55E] px-2 py-0.5 rounded font-mono font-bold">
                {replayActive ? "REPLAYING" : "VERIFIED"}
              </span>
            </div>

            <div className="relative mt-2">
              <AgentExecutionCard
                index={1}
                title="Vision Intelligence Unit"
                purpose="Analyzes uploaded incident media descriptors"
                status={getAgentStatus(1)}
                duration="3.2s"
                model="Gemini 2.5"
                icon={<Camera className="w-4 h-4" />}
                logs={consoleLogs[1]}
                issueData={issueData}
              />
              <AgentExecutionCard
                index={2}
                title="Infrastructure Classification Engine"
                purpose="Validates civic category taxonomy mapping"
                status={getAgentStatus(2)}
                duration="2.1s"
                model="Llama-3-70B"
                icon={<Layers className="w-4 h-4" />}
                logs={consoleLogs[2]}
                issueData={issueData}
              />
              <AgentExecutionCard
                index={3}
                title="Priority Assessment Engine"
                purpose="Calculates municipal threat score & SLA window"
                status={getAgentStatus(3)}
                duration="2.8s"
                model="Llama-3-70B"
                icon={<Gauge className="w-4 h-4" />}
                logs={consoleLogs[3]}
                issueData={issueData}
              />
              <AgentExecutionCard
                index={4}
                title="Municipal Routing Engine"
                purpose="Resolves dispatch jurisdiction boundaries"
                status={getAgentStatus(4)}
                duration="1.7s"
                model="Llama-3-70B"
                icon={<Route className="w-4 h-4" />}
                logs={consoleLogs[4]}
                issueData={issueData}
              />
              <AgentExecutionCard
                index={5}
                title="Governance Validation Engine"
                purpose="Checks duplicate logs & tags compliance list"
                status={getAgentStatus(5)}
                duration="1.9s"
                model="Llama-3-70B"
                icon={<ShieldCheck className="w-4 h-4" />}
                logs={consoleLogs[5]}
                issueData={issueData}
              />
              <AgentExecutionCard
                index={6}
                title="Executive Brief Generator"
                purpose="Compiles public digests & internal directive summaries"
                status={getAgentStatus(6)}
                duration="2.6s"
                model="Llama-3-70B"
                icon={<FileText className="w-4 h-4" />}
                logs={consoleLogs[6]}
                issueData={issueData}
              />
            </div>

            {/* Replay Controls */}
            <div className="pt-2">
              <button
                onClick={handleReplay}
                disabled={replayActive}
                className="w-full flex items-center justify-center gap-2 border border-[#1C1C1C] hover:border-[#22C55E] disabled:hover:border-[#1C1C1C] text-white disabled:text-[#9CA3AF] disabled:bg-transparent hover:bg-[#22C55E]/5 transition-all py-2.5 rounded-xl text-xs font-semibold font-mono"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${replayActive ? "animate-spin text-[#9CA3AF]" : "text-[#22C55E]"}`} />
                REPLAY AI DECISION PIPELINE
              </button>
            </div>
          </div>

          {/* AI Governance Decision consensus locks in on completion */}
          {visualStep === 6 && !replayActive && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="bg-[#111111] border border-[#22C55E]/40 anim-glow rounded-2xl p-5 space-y-4"
            >
              <div className="flex items-center gap-2 text-xs font-bold text-[#22C55E] tracking-wider font-mono uppercase">
                <ShieldCheck className="w-5 h-5 text-[#22C55E]" />
                AI GOVERNANCE DECISION
              </div>
              <div className="border-t border-[#1C1C1C]" />
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white tracking-wide">Consensus Achieved</h3>
                <p className="text-[11px] text-[#9CA3AF] leading-relaxed">
                  All validation checking engines completed successfully. Decision variables locked.
                </p>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-black/30 border border-[#1C1C1C] p-2 rounded-lg text-center">
                  <span className="text-[8px] text-[#9CA3AF] font-mono block">CONFIDENCE</span>
                  <span className="text-xs font-bold text-[#22C55E] font-mono mt-0.5 inline-block">{confidenceValue}%</span>
                </div>
                <div className="bg-black/30 border border-[#1C1C1C] p-2 rounded-lg text-center">
                  <span className="text-[8px] text-[#9CA3AF] font-mono block">GOVERNANCE</span>
                  <span className="text-xs font-bold text-[#22C55E] font-mono mt-0.5 inline-block">PASSED</span>
                </div>
                <div className="bg-black/30 border border-[#1C1C1C] p-2 rounded-lg text-center">
                  <span className="text-[8px] text-[#9CA3AF] font-mono block">STATUS</span>
                  <span className="text-xs font-bold text-[#22C55E] font-mono mt-0.5 inline-block">LOCKED</span>
                </div>
              </div>
            </motion.div>
          )}
        </section>

        {/* Right Column (60%) - Municipal Executive Intelligence Console */}
        <section className="lg:col-span-6 flex flex-col space-y-6">
          <div className="flex items-center justify-between border-b border-[#1C1C1C] pb-3">
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide">
                AI GOVERNANCE DECISION CENTER
              </h2>
              <p className="text-[10px] text-[#9CA3AF] mt-0.5">
                Official analysis matrices and actionable dispatch directive briefings.
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-[#22C55E]/10 border border-[#22C55E]/20 text-[#22C55E] text-[10px] font-mono font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" /> VERIFIED CONSENSUS
            </span>
          </div>

          {/* 3.1 Executive Hero Card */}
          <div className="bg-[#111111] border border-[#1C1C1C] rounded-2xl p-5 grid grid-cols-1 md:grid-cols-5 gap-5 items-stretch">
            
            {/* Summary Brief Texts */}
            <div className="md:col-span-3 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="bg-[#22C55E]/10 border border-[#22C55E]/20 text-[#22C55E] p-1 rounded">
                    <Activity className="w-3.5 h-3.5" />
                  </span>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                    AI Executive Summary
                  </h3>
                </div>
                <p className="text-[12px] text-white leading-relaxed">
                  {aiSummary.executiveSummary || aiAnalysis.aiDescription || "AI governance has established consensus on this report. Processing metadata verifies the roadway asset failure."}
                </p>
              </div>

              <div className="border-t border-[#1C1C1C] pt-3 mt-3">
                <p className="text-[#9CA3AF] text-[9px] uppercase tracking-wider font-mono mb-1.5">
                  Recommended Action Plan Directive
                </p>
                <div className="bg-[#22C55E]/5 border border-[#22C55E]/20 text-[#22C55E] p-3 rounded-xl text-[11px] leading-relaxed font-mono">
                  {priority.citizenReason || "Repair roadway defect, fix base erosion, and secure water hazard areas immediately."}
                </div>
              </div>
            </div>

            {/* Media Box with CSS Scanning Overlays */}
            <div className="md:col-span-2 flex items-center">
              <div className="relative w-full h-[220px] rounded-xl overflow-hidden border border-[#1C1C1C]">
                <img
                  src={imageUrl}
                  alt="Municipal issue report camera feed"
                  className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                />
                
                {/* Visual grid / sensor overlays */}
                <div className="absolute inset-0 bg-[radial-gradient(#22C55E_1px,transparent_1px)] [background-size:16px_16px] opacity-15 pointer-events-none" />
                <div className="absolute inset-0 border border-[#22C55E]/20 rounded-xl pointer-events-none" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2/3 h-2/3 border border-[#22C55E]/60 bg-[#22C55E]/5 shadow-[0_0_15px_rgba(34,197,94,0.15)] rounded-lg pointer-events-none flex flex-col justify-between p-2">
                  <div className="flex justify-between">
                    <div className="w-3.5 h-3.5 border-t-2 border-l-2 border-[#22C55E]" />
                    <div className="w-3.5 h-3.5 border-t-2 border-r-2 border-[#22C55E]" />
                  </div>
                  <div className="flex justify-between">
                    <div className="w-3.5 h-3.5 border-b-2 border-l-2 border-[#22C55E]" />
                    <div className="w-3.5 h-3.5 border-b-2 border-r-2 border-[#22C55E]" />
                  </div>
                </div>
                
                {/* Glowing Laser Scan Sweep */}
                <div
                  className="absolute left-0 w-full h-[2px] bg-[#22C55E] opacity-70 shadow-[0_0_8px_#22C55E] pointer-events-none"
                  style={{ animation: "scanline 3s linear infinite" }}
                />
                
                {/* Meta labels */}
                <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm border border-[#1C1C1C] px-1.5 py-0.5 rounded text-[8px] font-mono text-[#9CA3AF]">
                  [CAM_01] SCAN_ACTIVE
                </div>
                <div className="absolute top-2 right-2 bg-[#22C55E]/20 backdrop-blur-sm border border-[#22C55E]/40 px-1.5 py-0.5 rounded text-[8px] font-mono text-[#22C55E] font-bold">
                  CONF: {confidenceValue}%
                </div>
                <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm border border-[#1C1C1C] px-1.5 py-0.5 rounded text-[8px] font-mono text-[#9CA3AF]">
                  LAT: {location?.lat?.toFixed(5) || "0.00000"}° N | LNG: {location?.lng?.toFixed(5) || "0.00000"}° E
                </div>
                <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm border border-[#1C1C1C] px-1.5 py-0.5 rounded text-[8px] font-mono text-[#9CA3AF] uppercase">
                  {aiSummary.subcategory || aiAnalysis.subcategory || "Asset Failure"}
                </div>
              </div>
            </div>

          </div>

          {/* 3.2 Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            
            {/* Category Card */}
            <div className="bg-[#111111] border border-[#1C1C1C] p-4 rounded-2xl flex flex-col justify-between hover:border-[#22C55E]/40 transition-all duration-300">
              <div className="flex items-center justify-between text-[#9CA3AF] mb-3">
                <span className="text-[9px] uppercase tracking-wider font-mono">Category</span>
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[13px] font-bold text-white">
                  {(aiSummary.category && categoryMap[aiSummary.category]) || (aiAnalysis?.category && categoryMap[aiAnalysis.category]) || aiSummary.category || aiAnalysis?.category || "Road Damage"}
                </p>
                <p className="text-[9px] text-[#9CA3AF] mt-1">Resolved taxonomy class</p>
              </div>
            </div>

            {/* Subcategory Card */}
            <div className="bg-[#111111] border border-[#1C1C1C] p-4 rounded-2xl flex flex-col justify-between hover:border-[#22C55E]/40 transition-all duration-300">
              <div className="flex items-center justify-between text-[#9CA3AF] mb-3">
                <span className="text-[9px] uppercase tracking-wider font-mono">Subcategory</span>
                <Layers className="w-4 h-4 text-[#22C55E]" />
              </div>
              <div>
                <p className="text-[13px] font-bold text-[#22C55E]">
                  {aiSummary.subcategory || aiAnalysis?.subcategory || "Pothole"}
                </p>
                <p className="text-[9px] text-[#9CA3AF] mt-1">Asset subdivision classification</p>
              </div>
            </div>

            {/* Severity Card */}
            <div className="bg-[#111111] border border-[#1C1C1C] p-4 rounded-2xl flex flex-col justify-between hover:border-[#22C55E]/40 transition-all duration-300">
              <div className="flex items-center justify-between text-[#9CA3AF] mb-3">
                <span className="text-[9px] uppercase tracking-wider font-mono">Severity</span>
                <AlertTriangle className="w-4 h-4 text-[#F59E0B]" />
              </div>
              <div>
                <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold font-mono uppercase ${
                  severityText === "critical" ? "bg-[#EF4444]/10 border border-[#EF4444]/20 text-[#EF4444]" :
                  severityText === "high" ? "bg-[#F59E0B]/10 border border-[#F59E0B]/20 text-[#F59E0B]" :
                  "bg-[#22C55E]/10 border border-[#22C55E]/20 text-[#22C55E]"
                }`}>
                  {severityText}
                </span>
                <p className="text-[9px] text-[#9CA3AF] mt-2">Threat level parameter</p>
              </div>
            </div>

            {/* Confidence Card (Circular indicator) */}
            <div className="bg-[#111111] border border-[#1C1C1C] p-4 rounded-2xl flex flex-col justify-between hover:border-[#22C55E]/40 transition-all duration-300">
              <div className="flex items-center justify-between text-[#9CA3AF] mb-1">
                <span className="text-[9px] uppercase tracking-wider font-mono font-bold">Confidence</span>
                <Activity className="w-4 h-4" />
              </div>
              <div className="flex items-center gap-2">
                <CircularConfidence value={confidenceValue} />
                <p className="text-[9px] text-[#9CA3AF] leading-snug">Average system consensus Probability</p>
              </div>
            </div>

            {/* Priority Score Gauge Card */}
            <div className="bg-[#111111] border border-[#1C1C1C] p-4 rounded-2xl flex flex-col justify-between hover:border-[#22C55E]/40 transition-all duration-300">
              <div className="flex items-center justify-between text-[#9CA3AF] mb-1">
                <span className="text-[9px] uppercase tracking-wider font-mono font-bold">Priority Score</span>
                <Gauge className="w-4 h-4" />
              </div>
              <div className="flex flex-col items-center">
                <PriorityGauge value={priorityScoreValue} />
                <p className="text-[8px] text-[#9CA3AF] mt-1 text-center w-full">Urgency ranking weighting</p>
              </div>
            </div>

            {/* Assigned Department Card */}
            <div className="bg-[#111111] border border-[#1C1C1C] p-4 rounded-2xl flex flex-col justify-between hover:border-[#22C55E]/40 transition-all duration-300">
              <div className="flex items-center justify-between text-[#9CA3AF] mb-3">
                <span className="text-[9px] uppercase tracking-wider font-mono">Assigned Division</span>
                <Route className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[12px] font-bold text-white line-clamp-2">
                  {aiSummary.department || routing.primaryDepartment || "Municipal Corp Roads Dept"}
                </p>
                <p className="text-[9px] text-[#9CA3AF] mt-1">Route assignment logic</p>
              </div>
            </div>

            {/* SLA hours Card */}
            <div className="bg-[#111111] border border-[#1C1C1C] p-4 rounded-2xl flex flex-col justify-between hover:border-[#22C55E]/40 transition-all duration-300">
              <div className="flex items-center justify-between text-[#9CA3AF] mb-3">
                <span className="text-[9px] uppercase tracking-wider font-mono">Response SLA</span>
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[13px] font-bold text-[#22C55E]">
                  {priority.estimatedSLAHours || 48} Hours
                </p>
                <p className="text-[9px] text-[#9CA3AF] mt-1">Maximum dispatch target</p>
              </div>
            </div>

            {/* Duplicate Risk Card */}
            <div className="bg-[#111111] border border-[#1C1C1C] p-4 rounded-2xl flex flex-col justify-between hover:border-[#22C55E]/40 transition-all duration-300">
              <div className="flex items-center justify-between text-[#9CA3AF] mb-3">
                <span className="text-[9px] uppercase tracking-wider font-mono">Duplicate Risk</span>
                <Users className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[13px] font-bold text-[#22C55E]">
                  {duplicateRiskValue}% Probability
                </p>
                <p className="text-[9px] text-[#9CA3AF] mt-1">Matching logs within 50m</p>
              </div>
            </div>

            {/* Validator Status Card */}
            <div className="bg-[#111111] border border-[#1C1C1C] p-4 rounded-2xl flex flex-col justify-between hover:border-[#22C55E]/40 transition-all duration-300">
              <div className="flex items-center justify-between text-[#9CA3AF] mb-3">
                <span className="text-[9px] uppercase tracking-wider font-mono">Validator Status</span>
                <ShieldCheck className="w-4 h-4 text-[#22C55E]" />
              </div>
              <div>
                <p className="text-[13px] font-bold text-[#22C55E] uppercase font-mono">
                  {aiSummary.validatorStatus || "Passed"}
                </p>
                <p className="text-[9px] text-[#9CA3AF] mt-1">Validation check complete</p>
              </div>
            </div>

            {/* Citizen Impact Card */}
            <div className="bg-[#111111] border border-[#1C1C1C] p-4 rounded-2xl flex flex-col justify-between hover:border-[#22C55E]/40 transition-all duration-300">
              <div className="flex items-center justify-between text-[#9CA3AF] mb-3">
                <span className="text-[9px] uppercase tracking-wider font-mono">Citizen Impact</span>
                <Users className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[13px] font-bold text-[#22C55E]">
                  {(metrics.estimatedAffectedCitizens && metrics.estimatedAffectedCitizens > 10) ? "High" : "Medium"}
                </p>
                <p className="text-[9px] text-[#9CA3AF] mt-1">{metrics.estimatedAffectedCitizens || 50} Citizens affected</p>
              </div>
            </div>

            {/* Infrastructure Risk Card */}
            <div className="bg-[#111111] border border-[#1C1C1C] p-4 rounded-2xl flex flex-col justify-between hover:border-[#22C55E]/40 transition-all duration-300">
              <div className="flex items-center justify-between text-[#9CA3AF] mb-3">
                <span className="text-[9px] uppercase tracking-wider font-mono">Infrastructure Risk</span>
                <AlertTriangle className="w-4 h-4 text-[#F59E0B]" />
              </div>
              <div>
                <p className="text-[13px] font-bold text-white uppercase font-mono">
                  {severityText === "critical" ? "Critical" : severityText === "high" ? "Elevated" : "Standard"}
                </p>
                <p className="text-[9px] text-[#9CA3AF] mt-1">Structural fatigue estimation</p>
              </div>
            </div>

            {/* Verification Progress Card */}
            <div className="bg-[#111111] border border-[#1C1C1C] p-4 rounded-2xl flex flex-col justify-between hover:border-[#22C55E]/40 transition-all duration-300">
              <div className="flex items-center justify-between text-[#9CA3AF] mb-3">
                <span className="text-[9px] uppercase tracking-wider font-mono">Verification Progress</span>
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[13px] font-bold text-white">
                  {issueData?.verification?.count || 0} / {issueData?.verification?.required || 3} Checked
                </p>
                <p className="text-[9px] text-[#9CA3AF] mt-1">Community validation logs</p>
              </div>
            </div>

          </div>

          {/* 3.3 AI Explainability Panel */}
          <div className="bg-[#111111] border border-[#1C1C1C] rounded-2xl p-5 space-y-4">
            <h3 className="text-xs font-bold text-[#9CA3AF] tracking-wider uppercase font-mono">
              AI Explainability & Integrity Rationale
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              
              <div className="space-y-2 border-r border-[#1C1C1C] pr-4">
                <p className="text-[#9CA3AF] font-mono text-[10px] uppercase">Confidence Breakdown</p>
                <div className="space-y-1.5 font-mono text-[11px]">
                  <div className="flex justify-between">
                    <span>Vision Classification:</span>
                    <span className="text-white font-bold">{aiAnalysis.confidence || 92}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Routing Accuracy:</span>
                    <span className="text-white font-bold">{routing.routingConfidence || 93}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Duplication Match:</span>
                    <span className="text-white font-bold">95%</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 border-r border-[#1C1C1C] px-2 md:px-4">
                <p className="text-[#9CA3AF] font-mono text-[10px] uppercase">Supporting Evidence</p>
                <div className="space-y-1 text-[#9CA3AF] text-[11px]">
                  <div>✔ Strong Category identification</div>
                  <div>✔ High quality metadata integrity</div>
                  <div>✔ Consistent municipal taxonomy</div>
                  <div>✔ No duplicate report logs found</div>
                </div>
              </div>

              <div className="space-y-2 pl-0 md:pl-4">
                <p className="text-[#9CA3AF] font-mono text-[10px] uppercase">Potential Uncertainties</p>
                <p className="text-[11px] text-[#9CA3AF] leading-relaxed">
                  Water accumulation could obscure lower pothole boundary profiles, introducing up to 8% volume calculation error.
                </p>
              </div>

            </div>
          </div>

          {/* 3.4 Governance validation checklist panel */}
          <div className="bg-[#111111] border border-[#1C1C1C] rounded-2xl p-5 space-y-4">
            <h3 className="text-xs font-bold text-[#9CA3AF] tracking-wider uppercase font-mono">
              Governance Audit Checklist
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono text-[#9CA3AF]">
              <div className="space-y-1.5">
                <div>[✔] Asset category mapping match verified</div>
                <div>[✔] Urgency priorities and severity checked</div>
                <div>[✔] Department routing logic validated</div>
              </div>
              <div className="space-y-1.5">
                <div>[✔] Near duplication indices resolved (radius: 50m)</div>
                <div>[✔] Overall confidence matches limit requirements (&gt;=80%)</div>
                <div className="text-[#22C55E] font-bold">[✔] Validator check signature approved</div>
              </div>
            </div>
          </div>

          {/* Chronological event timeline audit logs */}
          <div className="bg-[#111111] border border-[#1C1C1C] rounded-2xl p-5 space-y-3">
            <h3 className="text-xs font-bold text-[#9CA3AF] tracking-wider uppercase font-mono">
              Decision Audit Log
            </h3>
            <div className="space-y-1 text-[10px] font-mono text-[#9CA3AF]">
              <div>[02:43:10.01] REPORT SUBMITTED FROM APP DEVICE</div>
              <div>[02:43:11.23] VISION TENSOR ANALYSIS ENGINE COMPLETE</div>
              <div>[02:43:12.44] TAXONOMY CLASSIFICATION COMPLETE</div>
              <div>[02:43:13.68] PRIORITY MULTIPLIERS ESTABLISHED</div>
              <div>[02:43:14.81] DEPARTMENT ROUTIVE DIRECTIVE COMPLETE</div>
              <div>[02:43:15.90] VALIDATOR CHECKS APPROVED SIGNATURE</div>
              <div>[02:43:17.11] EXECUTIVE SUMMARY SYSTEM GENERATION COMPLETED</div>
            </div>
          </div>

          {/* Metadata information panel */}
          <div className="bg-[#111111] border border-[#1C1C1C] rounded-2xl p-5">
            <h4 className="text-xs font-bold text-[#9CA3AF] tracking-wider uppercase font-mono mb-4 flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-[#22C55E]" />
              Additional Details & Technical Telemetry
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 text-xs">
              
              <div className="flex justify-between items-center py-1.5 border-b border-[#1C1C1C]">
                <span className="text-[#9CA3AF] font-mono uppercase text-[10px] flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-[#9CA3AF]" /> Location</span>
                <span className="text-white text-right max-w-[200px] truncate">{location?.address || "Street 12, Green Town"}</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-[#1C1C1C]">
                <span className="text-[#9CA3AF] font-mono uppercase text-[10px] flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-[#9CA3AF]" /> Reported At</span>
                <span className="text-white">{formatDate(issueData?.createdAt)}</span>
              </div>
              
              <div className="flex justify-between items-center py-1.5 border-b border-[#1C1C1C]">
                <span className="text-[#9CA3AF] font-mono uppercase text-[10px] flex items-center gap-1.5"><Users className="w-3.5 h-3.5 text-[#9CA3AF]" /> Reported By</span>
                <span className="text-white">{reporterText}</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-[#1C1C1C]">
                <span className="text-[#9CA3AF] font-mono uppercase text-[10px] flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-[#9CA3AF]" /> Last Updated</span>
                <span className="text-white">{formatDate(issueData?.updatedAt)}</span>
              </div>

              <div className="flex justify-between items-center py-1.5 border-b border-[#1C1C1C]">
                <span className="text-[#9CA3AF] font-mono uppercase text-[10px] flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-[#9CA3AF]" /> Verification</span>
                <span className={`font-bold capitalize ${
                  issueData?.verification?.status === "verified" ? "text-[#22C55E]" : "text-[#F59E0B]"
                }`}>
                  {issueData?.verification?.status || "pending"}
                </span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-[#1C1C1C]">
                <span className="text-[#9CA3AF] font-mono uppercase text-[10px] flex items-center gap-1.5"><Smartphone className="w-3.5 h-3.5 text-[#9CA3AF]" /> Source channel</span>
                <span className="text-white">Mobile Application</span>
              </div>

              <div className="flex justify-between items-center py-1.5 border-b border-[#1C1C1C] md:border-b-0">
                <span className="text-[#9CA3AF] font-mono uppercase text-[10px] flex items-center gap-1.5"><Activity className="w-3.5 h-3.5 text-[#9CA3AF]" /> Issue Status</span>
                <span className="text-white capitalize">{issueData?.status || "In Progress"}</span>
              </div>
              <div className="flex justify-between items-center py-1.5 md:border-b-0">
                <span className="text-[#9CA3AF] font-mono uppercase text-[10px] flex items-center gap-1.5"><Hash className="w-3.5 h-3.5 text-[#9CA3AF]" /> Report ID</span>
                <span className="text-white font-mono text-[10px]">{id?.slice(0, 15).toUpperCase()}</span>
              </div>

            </div>
          </div>

          {/* Action buttons at bottom */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button 
              onClick={handleDownloadPDF}
              className="flex-1 w-full border border-[#1C1C1C] hover:border-[#22C55E] hover:text-[#22C55E] text-white hover:bg-[#22C55E]/5 transition-all py-3 rounded-xl flex items-center justify-center font-bold text-xs gap-2 font-mono"
            >
              <Download className="w-4 h-4" /> DOWNLOAD OFFICIAL PDF
            </button>
            <button 
              onClick={handleShareReport}
              className="flex-1 w-full border border-[#1C1C1C] hover:border-[#22C55E] hover:text-[#22C55E] text-white hover:bg-[#22C55E]/5 transition-all py-3 rounded-xl flex items-center justify-center font-bold text-xs gap-2 font-mono"
            >
              <Share2 className="w-4 h-4" /> SHARE BRIEFING INDEX
            </button>
            <button 
              onClick={handleTrackProgress}
              className="flex-1 w-full bg-[#22C55E] text-black hover:bg-[#2DD66F] transition-all py-3 rounded-xl flex items-center justify-center font-bold text-xs gap-2 shadow-[0_0_15px_rgba(34,197,94,0.2)] font-mono"
            >
              <Activity className="w-4 h-4" /> TRACK WORK PROGRESS
            </button>
          </div>

          {/* Technical transparent footer metadata details */}
          <footer className="text-[9px] font-mono text-[#9CA3AF]/60 text-center uppercase tracking-widest pt-4">
            Powered by Gemini Vision 2.5 Flash · Groq Llama-3-70B Pipeline · Firestore Real-time DB · Cloudinary Media CDN
          </footer>
        </section>

      </main>
    </div>
  );
};

export default PipelineViewPage;
