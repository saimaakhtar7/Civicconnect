import React, { useState, useEffect, useRef, lazy, Suspense } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { auth } from "../config/firebase";
import { signInAnonymously } from "firebase/auth";
import { useAuthStore } from "../stores/authStore";
import {
  Shield, Play, Users, CheckCircle2, ArrowRight,
  Map, Cpu, Zap, Building, Activity, Landmark, BarChart3,
  ChevronRight, Menu, X, Bell, Brain, GitBranch, Lock,
  TrendingUp, Clock, Star, ChevronDown,
  Camera, Navigation, FileText,
  Eye, Gauge, Globe, Sparkles,
  TrendingDown, Minus, AlertTriangle
} from "lucide-react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import BeforeAfterSlider from "../components/ui/BeforeAfterSlider";
import { PageLoader } from "../components/ui/PageLoader";
import AIOrchestrationEngine from "../components/ui/AIOrchestrationEngine";
const CivicMap = lazy(() => import("../components/ui/CivicMap"));


/* ─── Scroll Reveal Wrapper ──────────────────────────────────── */
function RevealSection({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 25 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}


/* ─── FAQ Accordion Item ──────────────────────────────────────── */
function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="border border-[#1E293B] rounded-xl overflow-hidden cursor-pointer hover:border-white/10 bg-[#0E1726]/40 transition-all"
      onClick={() => setOpen(!open)}
    >
      <div className="flex items-center justify-between px-5 py-3.5">
        <span className="font-semibold text-white text-xs sm:text-sm">{q}</span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="w-4 h-4 text-[#9AA3B8]" />
        </motion.div>
      </div>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
          >
            <div className="px-5 pb-4 text-xs sm:text-sm text-[#9AA3B8] leading-relaxed border-t border-[#1E293B] pt-3 bg-[#0E1726]/20">
              {a}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════ */
/*  MAIN COMPONENT: REDESIGNED LANDING PAGE (GOVERNMENT EDITION)  */
/* ══════════════════════════════════════════════════════════════ */
export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user: currentUser, role: currentRole, loading, setUser } = useAuthStore();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [guestLoading, setGuestLoading] = useState(false);
  const [guestError, setGuestError] = useState<string | null>(null);
  const [testimonialIdx, setTestimonialIdx] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Live Operations state
  const INCIDENT_POOL = [
    { type: "road",  emoji: "🟠", label: "Pothole Critical",    loc: "Kothrud, Ward 12",    status: "Critical Alert", sc: "text-red-400",    dept: "PWD" },
    { type: "water", emoji: "🔵", label: "Water Leak",          loc: "Pimpri, Ward 5",      status: "Assigned",      sc: "text-blue-400",  dept: "Water Supply" },
    { type: "power", emoji: "🟡", label: "Streetlight Out",     loc: "Viman Nagar, Ward 8", status: "In Progress",   sc: "text-yellow-400",dept: "MSEDCL" },
    { type: "waste", emoji: "🟢", label: "Bin Overflow",        loc: "Deccan, Ward 10",     status: "Assigned",      sc: "text-green-400", dept: "Waste Mgmt" },
    { type: "road",  emoji: "🟠", label: "Open Manhole",        loc: "Kondhwa, Ward 25",    status: "Critical Alert", sc: "text-red-400",   dept: "PWD" },
    { type: "water", emoji: "🔵", label: "Sewage Overflow",     loc: "Bhosari, Ward 2",     status: "High Priority", sc: "text-blue-400",  dept: "Water Supply" },
    { type: "power", emoji: "🟡", label: "Transformer Fault",   loc: "Yerawada, Ward 8",    status: "In Progress",   sc: "text-yellow-400",dept: "MSEDCL" },
    { type: "road",  emoji: "🟠", label: "Tree Fallen",         loc: "Hinjewadi, Ward 6",   status: "Critical Alert", sc: "text-red-400",  dept: "Parks & Gardens" },
    { type: "waste", emoji: "🟢", label: "Garbage on Road",     loc: "Swargate, Ward 21",   status: "Assigned",      sc: "text-green-400", dept: "Waste Mgmt" },
    { type: "road",  emoji: "🟠", label: "Road Collapse",       loc: "Warje, Ward 19",      status: "Critical Alert", sc: "text-red-400",  dept: "PWD" },
  ];
  const incCounterRef = useRef(912);
  const [liveIncidents, setLiveIncidents] = useState(
    INCIDENT_POOL.slice(0, 5).map((p, i) => ({ ...p, id: `INC-${910 - i}` }))
  );
  const [slaData, setSlaData] = useState([
    { dept: "Water Supply",  val: 94, color: "bg-blue-500",   trend: "stable" },
    { dept: "Roads & Traffic", val: 81, color: "bg-orange-500", trend: "down"   },
    { dept: "MSEDCL",        val: 88, color: "bg-yellow-500", trend: "up"     },
    { dept: "Solid Waste",   val: 72, color: "bg-green-500",  trend: "up"     },
    { dept: "Parks & Garden",val: 95, color: "bg-teal-500",   trend: "stable" },
  ]);
  const [aiAccuracy, setAiAccuracy] = useState(98.4);



  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Auto-scroll testimonials (pause-aware)
  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setTestimonialIdx(i => (i + 1) % 5);
    }, 4000);
    return () => clearInterval(timer);
  }, [isPaused]);

  // Live incident feed — new entry every 3 s
  useEffect(() => {
    let idx = 0;
    const iv = setInterval(() => {
      idx = (idx + 1) % INCIDENT_POOL.length;
      const newInc = { ...INCIDENT_POOL[idx], id: `INC-${incCounterRef.current++}` };
      setLiveIncidents(prev => [newInc, ...prev.slice(0, 4)]);
    }, 3000);
    return () => clearInterval(iv);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // SLA fluctuation every 2.5 s
  useEffect(() => {
    const iv = setInterval(() => {
      setSlaData(prev => prev.map(d => {
        const delta = (Math.random() - 0.45) * 2.4;
        const nv = Math.round(Math.max(62, Math.min(99, d.val + delta)) * 10) / 10;
        return { ...d, val: nv, trend: delta > 0.6 ? "up" : delta < -0.6 ? "down" : "stable" };
      }));
    }, 2500);
    return () => clearInterval(iv);
  }, []);

  // AI accuracy fluctuation every 3.2 s
  useEffect(() => {
    const iv = setInterval(() => {
      setAiAccuracy(prev => Math.round(Math.max(97.0, Math.min(99.5, prev + (Math.random() - 0.45) * 0.3)) * 10) / 10);
    }, 3200);
    return () => clearInterval(iv);
  }, []);



  if (loading) return <PageLoader />;
  if (currentUser) {
    return (
      <Navigate
        to={currentRole === "citizen" ? "/" : currentRole === "official" ? "/dashboard" : "/onboarding"}
        replace
      />
    );
  }

  const handleContinueAsGuest = async () => {
    setGuestLoading(true);
    setGuestError(null);
    try {
      const credential = await signInAnonymously(auth);
      const uid = credential.user.uid;
      const profileData = {
        uid, email: "", displayName: "Guest Citizen", photoURL: null, role: "citizen",
        department: null,
        trust: { score: 50, tier: "new", totalReports: 0, verifiedReports: 0, falseReportCount: 0, verificationContributions: 0, resolutionConfirmations: 0, badges: [], lastUpdated: new Date().toISOString() },
        fcmTokens: [],
        notificationPreferences: { verificationRequests: true, statusUpdates: true, communityMilestones: true, weeklyDigest: false },
        createdAt: new Date().toISOString(),
        lastActiveAt: new Date().toISOString(),
      };
      setUser(profileData as any);
      navigate("/", { replace: true });
    } catch (err: any) {
      setGuestError(err.message || "Unable to start guest session.");
    } finally {
      setGuestLoading(false);
    }
  };

  const testimonials = [
    { quote: "CivicConnect AI has reduced our response time from days to hours. The AI routing is a genuine game changer for large-scale municipal operations.", name: "Dr. Amit Verma", role: "Operations Director", dept: "Smart City Mission", avatar: "AV", rating: 5 },
    { quote: "The transparency is amazing. I can track my report in real-time and get notified the moment it is resolved. Finally, real accountability.", name: "Meera Deshmukh", role: "Citizen Partner", dept: "Ward 4 Community", avatar: "MD", rating: 5 },
    { quote: "Heatmaps and analytics help us prioritize areas and allocate resources much more efficiently across all 128 wards.", name: "Rajesh Patil", role: "Municipal Engineer", dept: "Roads & Maintenance Dept", avatar: "RP", rating: 5 },
    { quote: "AI-based duplicate detection alone has saved us significant processing time. The platform is reliable, fast, and mission-critical for daily ops.", name: "Priya Sharma", role: "District Collector", dept: "District Administration", avatar: "PS", rating: 5 },
    { quote: "Partnering with CivicConnect AI has amplified our community programs. The data transparency helps build real citizen trust.", name: "Ananya Iyer", role: "Program Director", dept: "Clean City NGO", avatar: "AI", rating: 5 },
  ];

  // Timeline steps for Government AI Activity section
  const TIMELINE_STEPS = [
    { time: "08:24:00", step: "Report Filed",       desc: "Road damage reported via citizen app with photo evidence from Kothrud, Ward 12.", icon: FileText,    color: "text-emerald-400", dot: "border-emerald-500 bg-emerald-500/15", status: "done"    },
    { time: "08:24:08", step: "AI Classification",  desc: "6 AI agents analysed media, geo-tagged location, classified as Critical Road Damage.",  icon: Brain,       color: "text-purple-400",  dot: "border-purple-500 bg-purple-500/15",  status: "done"    },
    { time: "08:24:12", step: "Routed to PWD",      desc: "Automatically assigned to Public Works Department with 4-hour SLA deadline.",            icon: GitBranch,   color: "text-blue-400",   dot: "border-blue-500 bg-blue-500/15",     status: "done"    },
    { time: "08:26:30", step: "Officer Dispatched", desc: "Field officer Rajesh P. accepted task. GPS tracking activated. En Route.",              icon: Navigation,  color: "text-cyan-400",   dot: "border-cyan-500 bg-cyan-500/15",     status: "done"    },
    { time: "09:15:00", step: "Work Commenced",     desc: "Repair crew deployed on site. Status updated to In Progress. Est. 2 hours to complete.", icon: Zap,         color: "text-amber-400",  dot: "border-amber-500 bg-amber-500/15",   status: "active"  },
    { time: "11:40:00", step: "Issue Resolved",     desc: "AI verified completion photo. Issue closed. SLA met with 44 minutes to spare.",          icon: CheckCircle2, color: "text-emerald-400", dot: "border-dashed border-emerald-500/40 bg-transparent", status: "pending" },
    { time: "11:41:00", step: "Citizen Notified",   desc: "Push notification delivered. Citizen confirmed resolution and left ⭐⭐⭐⭐⭐ rating.",   icon: Bell,        color: "text-[#00E676]",  dot: "border-dashed border-[#00E676]/40 bg-transparent",  status: "pending" },
  ];

  // Platform Security features
  const SECURITY_FEATURES = [
    { label: "256-bit Encryption",    icon: Lock         },
    { label: "ISO 27001 Certified",   icon: Shield       },
    { label: "Government Cloud",      icon: Globe        },
    { label: "Role-Based Access",     icon: Users        },
    { label: "End-to-End Audit Logs", icon: FileText     },
    { label: "99.98% Uptime SLA",     icon: Activity     },
    { label: "24×7 AI Monitoring",    icon: Eye          },
  ];

  const faqs = [
    { q: "How does AI classify and prioritize issues?", a: "Our 6-agent AI council analyzes every incoming report using computer vision on uploaded photos, NLP on the description, geospatial clustering to detect duplicates, historical severity data, and SLA deadline intelligence. A consensus priority score is produced within seconds." },
    { q: "How are duplicate reports detected?", a: "The Duplicate Detection Agent uses geofence clustering (issues within 50m radius), semantic similarity on descriptions, image hash comparison, and temporal analysis. Detected duplicates are merged and the original reporter is credited." },
    { q: "How does real-time tracking work?", a: "Once a report is assigned, the citizen receives a live dashboard link showing officer GPS, current status, ETA, and photo proof of completion. All updates are streamed via Firestore real-time listeners." },
    { q: "Can citizens remain anonymous?", a: "Yes. Citizens can browse all public issue reports and the community map as a guest. To report an issue or engage with the community, a free citizen account is required (signup takes under 60 seconds)." },
    { q: "How secure is my data?", a: "CivicConnect uses Firebase Authentication with end-to-end encrypted Firestore documents, role-based Firestore Security Rules, and audit logging for every privileged action. No personally identifiable information is shared without consent." },
    { q: "How do field officers receive and resolve tasks?", a: "Field officers receive push alerts and turn-by-turn navigation on their dedicated mobile view. They can log status updates, write notes, and upload photo evidence directly to the municipal board for verification." },
    { q: "What is the Citizen Trust Score?", a: "Every citizen profile has a Trust Score (starting at 50). Verifying nearby issues and reporting genuine concerns increases your score, while false or spam reports lower it. Verified high-trust profiles have their reports routed faster." },
    { q: "How can citizens verify community issues?", a: "If a civic problem is reported in your locality, you can visit the live map to upvote it, mark it as 'Still exists', or 'Already fixed'. Community contributions build consensus and direct field operations to high-priority zones." },
  ];

  return (
    <div className="min-h-screen bg-[#08111F] text-[#F5F7FA] font-sans antialiased overflow-x-hidden relative selection:bg-[#00E676] selection:text-black">

      {/* Decorative Grid Line Patterns (Official Blueprint Tone) */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.025]"
          style={{ backgroundImage: "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)", backgroundSize: "60px 60px" }}
        />
        {/* Subtle glows (not overly bright) */}
        <div className="absolute top-[-20%] left-[-10%] w-[60%] aspect-square rounded-full bg-emerald-500/5 blur-[150px] pointer-events-none" />
        <div className="absolute top-[25%] right-[-10%] w-[50%] aspect-square rounded-full bg-blue-500/5 blur-[150px] pointer-events-none" />
        <div className="absolute bottom-[5%] left-[5%] w-[55%] aspect-square rounded-full bg-purple-500/5 blur-[150px] pointer-events-none" />
      </div>

      {/* ══════════════════════════════════════════════════════════ */}
      {/* NAVBAR – DO NOT CHANGE                                    */}
      {/* ══════════════════════════════════════════════════════════ */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled ? "bg-[#08111F]/90 backdrop-blur-xl border-b border-white/5 py-4 shadow-xl" : "bg-transparent py-6"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          {/* Logo & Tagline */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigate("/landing")}>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-lg shadow-emerald-500/20">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <span className="text-xl font-black tracking-tight text-white block">
                CivicConnect <span className="text-[#00E676]">AI</span>
              </span>
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest block leading-none mt-0.5">
                AI for Better Governance
              </span>
            </div>
          </div>

          {/* Center Links */}
          <nav className="hidden md:flex items-center space-x-8 text-sm font-semibold text-[#9AA3B8]">
            <a href="#home" className="text-white hover:text-[#00E676] transition-colors">Home</a>
            <a href="#platform" className="hover:text-white transition-colors">Platform</a>
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#solutions" className="hover:text-white transition-colors">Solutions</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a>
            <a href="#about" className="hover:text-white transition-colors">About</a>
          </nav>

          {/* Action Buttons */}
          <div className="hidden md:flex items-center space-x-3">
            <button
              onClick={handleContinueAsGuest}
              disabled={guestLoading}
              className="px-4 py-2 text-sm font-bold text-[#F5F7FA] border border-white/10 rounded-xl hover:bg-white/5 transition-all active:scale-[0.98]"
            >
              {guestLoading ? "Starting Guest Session..." : "Continue as Guest"}
            </button>
            <button
              onClick={() => navigate("/auth/signin")}
              className="px-4 py-2 text-sm font-bold text-[#F5F7FA] border border-white/10 rounded-xl hover:bg-white/5 transition-all active:scale-[0.98]"
            >
              Login
            </button>
            <button
              onClick={() => navigate("/auth/signup")}
              className="px-5 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 rounded-xl shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all active:scale-[0.98]"
            >
              Get Started
            </button>
          </div>

          {/* Mobile Hamburger */}
          <button
            className="md:hidden p-2 text-white hover:bg-white/5 rounded-lg"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation Drawer */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-[#08111F] border-b border-white/5 overflow-hidden"
            >
              <div className="px-6 py-6 flex flex-col space-y-4">
                <a
                  href="#home"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-white font-semibold py-2"
                >
                  Home
                </a>
                <a
                  href="#platform"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-[#9AA3B8] font-semibold py-2"
                >
                  Platform
                </a>
                <a
                  href="#features"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-[#9AA3B8] font-semibold py-2"
                >
                  Features
                </a>
                <a
                  href="#solutions"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-[#9AA3B8] font-semibold py-2"
                >
                  Solutions
                </a>
                <a
                  href="#how-it-works"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-[#9AA3B8] font-semibold py-2"
                >
                  How It Works
                </a>
                <div className="flex flex-col space-y-3 pt-4 border-t border-white/5">
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleContinueAsGuest();
                    }}
                    className="w-full py-2.5 text-center font-bold border border-white/10 rounded-xl"
                  >
                    Continue as Guest
                  </button>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      navigate("/auth/signin");
                    }}
                    className="w-full py-2.5 text-center font-bold border border-white/10 rounded-xl"
                  >
                    Login
                  </button>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      navigate("/auth/signup");
                    }}
                    className="w-full py-2.5 text-center font-bold bg-[#00E676] text-black rounded-xl"
                  >
                    Get Started
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ── SECTION 1: HERO (REWORKED DIGITAL TWIN & INTEGRATED COMMAND PORTAL) ── */}
      <section id="home" className="relative min-h-screen pt-36 pb-20 flex items-center z-10 overflow-hidden">
        {/* Futuristic Smart City / GIS Digital Twin SVG Background — pure code, no external assets */}
        <div className="absolute inset-0 z-[-1] overflow-hidden bg-[#06101C]">
          {/* Radial ambient glows */}
          <div className="absolute right-[-5%] top-[10%] w-[700px] h-[700px] rounded-full bg-blue-600/8 blur-[160px] pointer-events-none" />
          <div className="absolute left-[-5%] bottom-[5%] w-[500px] h-[500px] rounded-full bg-emerald-500/6 blur-[130px] pointer-events-none" />
          <div className="absolute top-[30%] left-[35%] w-[400px] h-[400px] rounded-full bg-purple-600/5 blur-[120px] pointer-events-none" />

          {/* GIS City Network SVG — satellite-grid topology */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <defs>
              {/* Fine isometric grid */}
              <pattern id="hero-grid" width="60" height="60" patternUnits="userSpaceOnUse">
                <path d="M 60 0 L 0 0 0 60" fill="none" stroke="rgba(255,255,255,0.022)" strokeWidth="0.8" />
              </pattern>
              {/* Intersection dots */}
              <pattern id="hero-dots" width="60" height="60" patternUnits="userSpaceOnUse">
                <circle cx="0" cy="0" r="0.8" fill="rgba(255,255,255,0.06)" />
              </pattern>
              <radialGradient id="fade-left" cx="0%" cy="50%" r="60%">
                <stop offset="0%" stopColor="#06101C" stopOpacity="1" />
                <stop offset="100%" stopColor="#06101C" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="fade-bottom" cx="50%" cy="100%" r="60%">
                <stop offset="0%" stopColor="#06101C" stopOpacity="1" />
                <stop offset="100%" stopColor="#06101C" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* Grid layers */}
            <rect width="100%" height="100%" fill="url(#hero-grid)" />
            <rect width="100%" height="100%" fill="url(#hero-dots)" />

            {/* Road / highway topology */}
            <motion.path d="M-100,350 L300,280 L600,320 L900,240 L1200,290 L1600,210" fill="none" stroke="rgba(0,230,118,0.18)" strokeWidth="1.5" strokeDasharray="8 5"
              animate={{ strokeDashoffset: [0, -260] }} transition={{ duration: 22, repeat: Infinity, ease: "linear" }} />
            <motion.path d="M-100,500 Q250,420 500,480 T1000,390 T1700,440" fill="none" stroke="rgba(0,230,118,0.1)" strokeWidth="1" strokeDasharray="5 8"
              animate={{ strokeDashoffset: [0, 200] }} transition={{ duration: 35, repeat: Infinity, ease: "linear" }} />

            {/* Water supply / utility paths */}
            <motion.path d="M0,150 Q300,80 700,180 T1400,120 T1800,160" fill="none" stroke="rgba(59,130,246,0.14)" strokeWidth="1" strokeDasharray="6 6"
              animate={{ strokeDashoffset: [0, -200] }} transition={{ duration: 28, repeat: Infinity, ease: "linear" }} />
            <motion.path d="M200,600 Q500,520 900,580 L1400,500 L1800,540" fill="none" stroke="rgba(59,130,246,0.10)" strokeWidth="0.8" strokeDasharray="4 8"
              animate={{ strokeDashoffset: [0, 180] }} transition={{ duration: 40, repeat: Infinity, ease: "linear" }} />

            {/* Purple AI telemetry arcs */}
            <motion.path d="M500,100 Q700,300 1000,200 T1600,350" fill="none" stroke="rgba(167,139,250,0.12)" strokeWidth="1" strokeDasharray="10 6"
              animate={{ strokeDashoffset: [0, -280] }} transition={{ duration: 32, repeat: Infinity, ease: "linear" }} />

            {/* City node cluster — ward hubs */}
            {[
              { cx: 180, cy: 310, r: 4, color: "#00E676", pulse: true },
              { cx: 420, cy: 260, r: 3, color: "#00E676", pulse: false },
              { cx: 700, cy: 330, r: 5, color: "#3B82F6", pulse: true },
              { cx: 950, cy: 200, r: 3.5, color: "#A78BFA", pulse: false },
              { cx: 1150, cy: 280, r: 4, color: "#3B82F6", pulse: true },
              { cx: 1380, cy: 180, r: 3, color: "#00E676", pulse: false },
              { cx: 300, cy: 470, r: 3, color: "#A78BFA", pulse: true },
              { cx: 850, cy: 510, r: 3.5, color: "#3B82F6", pulse: false },
            ].map(({ cx, cy, r, color, pulse }, i) => (
              <g key={i}>
                <circle cx={cx} cy={cy} r={r} fill={color} opacity={0.8} />
                {pulse && <circle cx={cx} cy={cy} r={r + 2} fill={color} opacity={0.2}>
                  <animate attributeName="r" values={`${r + 2};${r + 8};${r + 2}`} dur="2.5s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.2;0;0.2" dur="2.5s" repeatCount="indefinite" />
                </circle>}
                {/* inter-node connectivity lines */}
              </g>
            ))}

            {/* Coordinate overlay */}
            <text x="28" y="88" fill="rgba(255,255,255,0.14)" fontSize="7.5" fontFamily="monospace" letterSpacing="0.8">SYS.LOC: 18.5204° N  73.8567° E  |  REGION-04</text>
            <text x="28" y="102" fill="rgba(255,255,255,0.14)" fontSize="7.5" fontFamily="monospace" letterSpacing="0.8">SAT.SYNC: ACTIVE  |  NODES: 1,248 ONLINE  |  GRID: NOMINAL</text>

            {/* Fade masks so it blends cleanly into content */}
            <rect width="30%" height="100%" fill="url(#fade-left)" />
            <rect width="100%" height="35%" y="65%" fill="url(#fade-bottom)" />
          </svg>

          {/* Bottom gradient to dark */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#06101C]/50 to-[#08111F]" />
        </div>

        <div className="max-w-7xl mx-auto px-6 w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Hero Left Content */}
          <div className="lg:col-span-6 space-y-9 text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-md bg-[#10D977]/10 border border-[#10D977]/20 backdrop-blur-sm select-none">
              <Sparkles className="w-3.5 h-3.5 text-[#00E676]" />
              <span className="text-[9px] font-black uppercase tracking-widest text-[#10D977] font-mono">
                AI-Powered Civic Intelligence
              </span>
            </div>

            <h1 className="text-5xl sm:text-6xl font-black tracking-tight text-white leading-[0.98] max-w-2xl">
              Smarter Governance.<br />
              <span className="text-[#00E676] bg-gradient-to-r from-emerald-400 to-[#00E676] bg-clip-text text-transparent">
                Stronger Communities.
              </span>
            </h1>

            <p className="text-[#9AA3B8] text-base sm:text-lg font-normal leading-relaxed max-w-2xl">
              CivicConnect uses advanced AI and real-time analytical telemetry to help municipal governments detect issues, assign faster, resolve efficiently, and build transparent & data-driven cities.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <button
                onClick={handleContinueAsGuest}
                disabled={guestLoading}
                className="flex items-center justify-center gap-2.5 px-8 py-4 font-bold text-white bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 rounded-xl shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all active:scale-[0.98] cursor-pointer"
              >
                {guestLoading ? "Starting Guest Session..." : "Continue as Guest"}
                <ArrowRight className="w-5 h-5" />
              </button>
              <a
                href="#platform"
                className="flex items-center justify-center gap-2.5 px-8 py-4 font-bold text-[#F5F7FA] border border-white/10 rounded-xl hover:bg-white/5 transition-all cursor-pointer"
              >
                <Play className="w-4 h-4 text-emerald-400" />
                Watch Demo
              </a>
            </div>

            {guestError && (
              <div className="mt-4 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-200">
                {guestError}
              </div>
            )}
          </div>

          {/* Hero Right: Integrated AI Command Center Panel */}
          <div className="lg:col-span-6">
            <div className="bg-[#0C1523]/80 border border-white/10 rounded-2xl shadow-2xl relative overflow-hidden backdrop-blur-md">
              {/* Header Bar */}
              <div className="flex items-center justify-between border-b border-white/5 px-5 py-3.5 bg-white/[0.01]">
                <div className="flex items-center gap-2.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#00E676] animate-pulse" />
                  <span className="text-[10px] font-black text-white tracking-widest font-mono">PUNE COMMAND PORTAL // REGION-04</span>
                </div>
                <span className="text-[9px] font-bold text-[#9AA3B8] font-mono">[ ACTIVE: 24/7 ]</span>
              </div>

              {/* Unified Dashboard Grid */}
              <div className="grid grid-cols-3 divide-x divide-white/5 border-b border-white/5 bg-white/[0.005]">
                {/* Active Reports */}
                <div className="p-4 space-y-1">
                  <span className="text-[8px] font-bold text-[#6B7280] uppercase tracking-wider block font-mono">01 // Active Reports</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-black text-white">25,230+</span>
                  </div>
                  <span className="text-[9px] text-[#00E676] font-semibold block leading-none font-mono">ALL WARDS COVERED</span>
                </div>
                {/* AI Decisions */}
                <div className="p-4 space-y-1">
                  <span className="text-[8px] font-bold text-[#6B7280] uppercase tracking-wider block font-mono">02 // AI Decisions</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-black text-purple-400">12,842+</span>
                  </div>
                  <span className="text-[9px] text-purple-400 font-semibold block leading-none font-mono">AUTOMATED ACTIONS</span>
                </div>
                {/* Reports Routed */}
                <div className="p-4 space-y-1">
                  <span className="text-[8px] font-bold text-[#6B7280] uppercase tracking-wider block font-mono">03 // Reports Routed</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-black text-blue-400">11,231+</span>
                  </div>
                  <span className="text-[9px] text-blue-400 font-semibold block leading-none font-mono">THIS MONTH DISPATCH</span>
                </div>
              </div>

              {/* Sub metrics list inside command console */}
              <div className="p-5 grid grid-cols-2 sm:grid-cols-4 gap-4 bg-white/[0.01]">
                {[
                  { label: "Live Officers", val: "1,248", desc: "Active on field", color: "text-blue-400" },
                  { label: "Emergency Alerts", val: "34", desc: "Requires attention", color: "text-red-400" },
                  { label: "Avg. Routing Time", val: "43 sec", desc: "Real-time routing", color: "text-teal-400" },
                  { label: "AI Confidence", val: "98.4%", desc: "High accuracy", color: "text-[#00E676]" }
                ].map(({ label, val, desc, color }) => (
                  <div key={label} className="space-y-1 select-none">
                    <span className="text-[8px] text-[#6B7280] font-black uppercase tracking-wide block font-mono">{label}</span>
                    <span className={`text-base font-black block leading-none ${color}`}>{val}</span>
                    <span className="text-[8px] text-[#9AA3B8] block leading-tight">{desc}</span>
                  </div>
                ))}
              </div>

              {/* Live Issue Feed Ticker */}
              <div className="border-t border-white/5 bg-[#06101C]/60">
                <div className="px-5 py-2 border-b border-white/5 flex items-center gap-2">
                  <span className="h-1 w-1 rounded-full bg-red-400 animate-pulse" />
                  <span className="text-[8px] font-black text-[#6B7280] uppercase tracking-widest font-mono">LIVE INCIDENT FEED</span>
                </div>
                <div className="overflow-hidden" style={{ height: 72 }}>
                  <motion.div
                    animate={{ y: [0, -72] }}
                    transition={{ duration: 6, repeat: Infinity, ease: "linear", repeatDelay: 0.5 }}
                  >
                    {[
                      { type: "🔴", label: "Pothole Detected", loc: "Ward 12, Kothrud", time: "2m ago", color: "text-red-400" },
                      { type: "🟡", label: "Streetlight Outage", loc: "Ward 7, Aundh", time: "5m ago", color: "text-yellow-400" },
                      { type: "🟢", label: "Drainage Resolved", loc: "Ward 3, Wakad", time: "8m ago", color: "text-[#00E676]" },
                      { type: "🔵", label: "Water Leak Assigned", loc: "Ward 9, Baner", time: "11m ago", color: "text-blue-400" },
                      { type: "🔴", label: "Pothole Detected", loc: "Ward 12, Kothrud", time: "2m ago", color: "text-red-400" },
                      { type: "🟡", label: "Streetlight Outage", loc: "Ward 7, Aundh", time: "5m ago", color: "text-yellow-400" },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center justify-between px-5 py-[9px] border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors" style={{ height: 36 }}>
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-[10px] shrink-0">{item.type}</span>
                          <span className={`text-[9px] font-bold font-mono truncate ${item.color}`}>{item.label}</span>
                          <span className="text-[8px] text-[#4B5563] truncate hidden sm:block">{item.loc}</span>
                        </div>
                        <span className="text-[8px] text-[#4B5563] font-mono shrink-0 ml-2">{item.time}</span>
                      </div>
                    ))}
                  </motion.div>
                </div>
              </div>

              {/* Footer telemetry bar */}
              <div className="border-t border-white/5 px-5 py-2 bg-[#08111F]/50 flex items-center justify-between text-[8px] font-mono text-[#6B7280]">
                <div className="flex items-center gap-1.5">
                  <Activity className="w-3 h-3 text-[#00E676] animate-pulse" />
                  <span>TELEMETRY: OPERATIONAL</span>
                </div>
                <span>SLA: 100% COMPLIANT</span>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll cue */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 pointer-events-none select-none">
          <span className="text-[9px] font-bold text-[#4B5563] uppercase tracking-widest font-mono">Scroll to explore</span>
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
            className="w-5 h-5 flex items-center justify-center"
          >
            <ChevronDown className="w-4 h-4 text-[#4B5563]" />
          </motion.div>
        </div>
      </section>

      {/* ── SECTION 2: ONE PLATFORM. MANY STAKEHOLDERS. ──────────── */}
      <section id="solutions" className="relative py-20 z-10 border-t border-white/5 bg-[#0C1523]/40">
        <div className="max-w-7xl mx-auto px-6">
          <RevealSection className="text-center space-y-3 max-w-2xl mx-auto mb-14">
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              One Platform. Many Stakeholders.
            </h2>
          </RevealSection>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
            {[
              {
                role: "Citizens", icon: Users, desc: "Empowered to report, track & participate.", color: "border-emerald-500/20 text-[#00E676] bg-emerald-500/5",
                features: ["Report Issues", "Track Status Live", "Get Notified", "Upvote & Comment", "Community Voting"],
                btn: "Explore Citizen App →", route: "/auth/signin"
              },
              {
                role: "Field Officers", icon: Navigation, desc: "Execute tasks efficiently in the field.", color: "border-blue-500/20 text-blue-400 bg-blue-500/5",
                features: ["View Assigned Issues", "Update Status", "Upload Proof", "SLA & Timers", "AI Suggestions"],
                btn: "Explore Officer App →", route: "/auth/signin"
              },
              {
                role: "Department Admins", icon: Building, desc: "Manage operations and monitor performance.", color: "border-orange-500/20 text-orange-400 bg-orange-500/5",
                features: ["Manage Teams", "Monitor SLAs", "Department Dashboard", "Generate Reports", "Resource Allocation"],
                btn: "Explore Admin App →", route: "/auth/signin"
              },
              {
                role: "Municipal Leaders", icon: Landmark, desc: "Make smarter decisions with real-time insights.", color: "border-purple-500/20 text-purple-400 bg-purple-500/5",
                features: ["City-wide Overview", "Analytics & Insights", "Performance Metrics", "Data-driven Decisions", "Budget Analytics"],
                btn: "Explore Leader App →", route: "/auth/signin"
              },
              {
                role: "Community Partners", icon: Star, desc: "Collaborate for a better and cleaner city.", color: "border-teal-500/20 text-teal-400 bg-teal-500/5",
                features: ["Partner Dashboard", "Issue Collaboration", "Impact Tracking", "Community Programs", "Data Transparency"],
                btn: "Explore Partner App →", route: "/auth/signin"
              }
            ].map((card) => (
              <div key={card.role} className="bg-[#0E1726]/60 border border-white/5 rounded-2xl p-5 hover:border-white/10 hover:scale-[1.02] hover:shadow-xl transition-all duration-300 flex flex-col justify-between h-full group">
                <div>
                  <div className={`h-11 w-11 rounded-xl flex items-center justify-center border mb-4 ${card.color}`}>
                    <card.icon className="w-5.5 h-5.5" />
                  </div>
                  <h3 className="text-base font-black text-white block mb-1">{card.role}</h3>
                  <span className="text-[11px] text-[#9AA3B8] block mb-4 font-semibold leading-relaxed">{card.desc}</span>

                  {/* Dashboard Preview Mock Visual */}
                  <div className="h-20 rounded-xl bg-[#08111F] border border-white/5 p-2 mb-4 space-y-1.5 overflow-hidden text-[8px] font-mono leading-none text-[#6B7280]">
                    <div className="flex justify-between border-b border-white/5 pb-1">
                      <span className="text-white font-bold tracking-wide select-none">MOCK://TELEMETRY</span>
                      <span className="text-emerald-400">ACTIVE</span>
                    </div>
                    <div className="flex justify-between items-center bg-white/5 p-1 rounded">
                      <span>Incidents Queue</span>
                      <span className="text-white font-bold">14 Active</span>
                    </div>
                    <div className="w-full bg-white/5 h-1 rounded overflow-hidden mt-1">
                      <div className="bg-emerald-500 h-1" style={{ width: "70%" }} />
                    </div>
                  </div>

                  <ul className="space-y-1.5 mb-6">
                    {card.features.map(f => (
                      <li key={f} className="text-xs text-[#9AA3B8] flex items-center gap-1.5">
                        <span className="text-[#00E676] font-bold">✔</span> {f}
                      </li>
                    ))}
                  </ul>
                </div>
                <button
                  onClick={() => navigate(card.route)}
                  className="w-full py-2 bg-[#08111F] hover:bg-white/5 border border-white/8 rounded-xl font-bold text-[10px] text-white uppercase tracking-wider"
                >
                  {card.btn}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── GOVERNMENT AI ACTIVITY TIMELINE ──────────────────────────── */}
      <section className="relative py-20 z-10 border-b border-white/5 bg-[#0A131F]">
        <div className="max-w-7xl mx-auto px-6">
          <RevealSection className="text-center space-y-3 max-w-2xl mx-auto mb-14">
            <span className="text-xs font-black text-[#10D977] uppercase tracking-widest block">TODAY'S AI ACTIVITY</span>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">Live AI Decision Timeline</h2>
            <p className="text-xs sm:text-sm text-[#9AA3B8] max-w-lg mx-auto">
              Watch how AI processes a civic issue — from citizen report to full resolution — in a single day.
            </p>
          </RevealSection>

          {/* Timeline */}
          <div className="relative max-w-4xl mx-auto">
            {/* Vertical connector */}
            <div className="hidden md:block absolute left-1/2 top-4 bottom-4 w-px -translate-x-1/2"
              style={{ background: 'linear-gradient(to bottom, #10D977 0%, #3B82F6 40%, #8B5CF6 70%, rgba(255,255,255,0.05) 100%)' }}
            />

            <div className="space-y-6">
              {TIMELINE_STEPS.map((step, i) => {
                const Icon = step.icon;
                const isLeft = i % 2 === 0;
                return (
                  <RevealSection key={step.step} delay={i * 0.08}>
                    <div className={`flex ${isLeft ? 'md:flex-row' : 'md:flex-row-reverse'} flex-col items-center gap-4 md:gap-6`}>
                      {/* Content card */}
                      <div className="flex-1 w-full">
                        <div className={`bg-[#0E1726]/80 border ${
                          step.status === 'active' ? 'border-amber-500/30 shadow-amber-500/10 shadow-lg' :
                          step.status === 'done' ? 'border-white/8' : 'border-white/4 opacity-60'
                        } rounded-2xl p-4 hover:border-white/12 transition-all`}>
                          <div className="flex items-center gap-2 mb-1.5">
                            <div className={`h-6 w-6 rounded-lg flex items-center justify-center ${step.color} bg-white/5`}>
                              <Icon className="w-3.5 h-3.5" />
                            </div>
                            <span className={`text-[10px] font-black uppercase tracking-widest ${step.color}`}>{step.step}</span>
                            {step.status === 'active' && (
                              <span className="ml-auto text-[8px] font-black text-amber-400 uppercase tracking-widest flex items-center gap-1">
                                <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse inline-block"/>
                                In Progress
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-[#9AA3B8] leading-relaxed">{step.desc}</p>
                        </div>
                      </div>

                      {/* Center dot + time */}
                      <div className="flex flex-col items-center gap-1 shrink-0">
                        <div className={`h-9 w-9 rounded-full border-2 flex items-center justify-center z-10 ${step.dot}`}>
                          {step.status === 'done' ? (
                            <CheckCircle2 className="w-4 h-4 text-white" />
                          ) : step.status === 'active' ? (
                            <motion.div className="h-3 w-3 rounded-full bg-amber-400"
                              animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 1.2, repeat: Infinity }} />
                          ) : (
                            <span className="text-[8px] font-black text-white/30">{(i+1).toString().padStart(2,'0')}</span>
                          )}
                        </div>
                        <span className="text-[8px] font-mono text-[#4B5563] whitespace-nowrap">{step.time}</span>
                      </div>

                      {/* Spacer (opposite side) */}
                      <div className="flex-1 hidden md:block" />
                    </div>
                  </RevealSection>
                );
              })}
            </div>
          </div>
        </div>
      </section>


      {/* ── SECTION 3: AI DRIVEN GOVERNANCE IN ACTION (SLIDER & METRICS) ── */}
      <section id="platform" className="relative py-20 bg-[#0E1726]/30 border-y border-white/5 z-10">
        <div className="max-w-7xl mx-auto px-6 space-y-12">
          <RevealSection className="text-center space-y-3 max-w-3xl mx-auto">
            <span className="text-xs font-black text-[#10D977] uppercase tracking-widest block">THE POWER OF AI</span>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              See AI Driven Governance In Action
            </h2>
            <p className="text-xs sm:text-sm text-[#9AA3B8]">
              Drag the slider to compare reported infrastructure with completed repairs.
            </p>
          </RevealSection>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            {/* Left Column: AI Orchestration Engine */}
            <RevealSection className="lg:col-span-3" delay={0.1}>
              <div className="bg-[#0E1726]/80 border border-white/5 rounded-3xl p-5 flex flex-col justify-between h-full shadow-xl">
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-wider mb-1">AI Orchestration Engine</h3>
                  <p className="text-[10px] text-[#9AA3B8] mb-4 leading-relaxed">8 AI agents collaborate in real-time to classify, route, and resolve every civic report.</p>
                </div>
                <AIOrchestrationEngine />
              </div>
            </RevealSection>

            {/* Center: Preserved Before/After Slider Centerpiece */}
            <RevealSection className="lg:col-span-6" delay={0.2}>
              <div className="bg-[#0E1726]/80 border border-white/5 rounded-3xl p-5 shadow-xl h-full flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-[#00E676] animate-pulse" />
                      <span className="text-xs font-bold text-white">Live Repair Visualizer</span>
                    </div>
                    <span className="text-[10px] font-black uppercase text-[#9AA3B8] tracking-widest">Slide to compare</span>
                  </div>
                  <BeforeAfterSlider
                    beforeImage="/damaged_road.png"
                    afterImage="/repaired_road.png"
                    beforeLabel="BEFORE REPORT"
                    afterLabel="AFTER REPAIR"
                  />
                </div>
              </div>
            </RevealSection>

            {/* Right Column: AI Impact Today - animated stat rings */}
            <RevealSection className="lg:col-span-3" delay={0.3}>
              <div className="bg-[#0E1726]/80 border border-white/5 rounded-3xl p-5 flex flex-col justify-between h-full shadow-xl">
                <h3 className="text-sm font-black text-white uppercase tracking-wider mb-4">AI IMPACT TODAY</h3>
                <div className="space-y-2.5">
                  {[
                    { label: "Citizens Impacted",   pct: 91, val: "2.4M+",   color: "#10B981", tc: "text-emerald-400" },
                    { label: "Issues Resolved",     pct: 87, val: "1.2M+",   color: "#3B82F6", tc: "text-blue-400"   },
                    { label: "Cost Savings (Est.)", pct: 74, val: "₹14.6 Cr",color: "#A78BFA", tc: "text-purple-400" },
                    { label: "Citizen Satisfaction",pct: 89, val: "89%",     color: "#F97316", tc: "text-orange-400" },
                    { label: "Faster Response",     pct: 64, val: "64%↑",    color: "#06B6D4", tc: "text-cyan-400"   },
                    { label: "AI Monitoring",       pct:100, val: "24/7",    color: "#00E676", tc: "text-emerald-400"},
                  ].map(st => (
                    <div key={st.label} className="flex items-center gap-3">
                      {/* Mini donut */}
                      <svg width="36" height="36" viewBox="0 0 36 36" className="shrink-0">
                        <circle cx="18" cy="18" r="14" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="4"/>
                        <motion.circle cx="18" cy="18" r="14" fill="none" stroke={st.color} strokeWidth="4"
                          strokeLinecap="round"
                          strokeDasharray={`${2 * Math.PI * 14}`}
                          initial={{ strokeDashoffset: 2 * Math.PI * 14 }}
                          animate={{ strokeDashoffset: 2 * Math.PI * 14 * (1 - st.pct / 100) }}
                          transition={{ duration: 1.4, delay: 0.5, ease: 'easeOut' }}
                          style={{ transform: 'rotate(-90deg)', transformOrigin: '18px 18px' }}
                        />
                      </svg>
                      <div className="flex-1 min-w-0">
                        <span className="text-[9px] text-[#9AA3B8] font-bold block uppercase tracking-wide leading-none truncate">{st.label}</span>
                        <span className={`text-sm font-black block mt-0.5 ${st.tc}`}>{st.val}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </RevealSection>


          </div>
        </div>
      </section>

      {/* ── SECTION 4: EVERYTHING YOU NEED FOR MODERN GOVERNANCE ── */}
      <section id="features" className="relative py-20 z-10 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <RevealSection className="text-center space-y-3 max-w-2xl mx-auto mb-16">
            <span className="text-xs font-black text-[#10D977] uppercase tracking-widest block">PLATFORM FEATURES</span>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Everything You Need for Modern Governance
            </h2>
          </RevealSection>

          <RevealSection delay={0.1}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {[
                { title: "AI Smart Routing", desc: "Automatically assigns issues to the right department.", icon: Brain, color: "bg-purple-500/10 text-purple-400" },
                { title: "Duplicate Detection", desc: "AI identifies and merges duplicate or spam reports.", icon: Eye, color: "bg-blue-500/10 text-blue-400" },
                { title: "Live GIS Maps", desc: "Real-time maps, hotspots & telemetry overlays.", icon: Map, color: "bg-teal-500/10 text-teal-400" },
                { title: "Heatmaps", desc: "Visualize issue density and infrastructure stress.", icon: Gauge, color: "bg-amber-500/10 text-amber-400" },
                { title: "Live Dashboards", desc: "Department & city-wide operational dashboards.", icon: BarChart3, color: "bg-indigo-500/10 text-indigo-400" },
                { title: "Real-time Tracking", desc: "Track every issue from report to resolution.", icon: Navigation, color: "bg-orange-500/10 text-orange-400" },
                { title: "SLA Monitoring", desc: "Track response time and SLA compliance.", icon: Clock, color: "bg-red-500/10 text-red-400" },
                { title: "Media Upload", desc: "Upload images, videos & documents.", icon: Camera, color: "bg-cyan-500/10 text-cyan-400" },
                { title: "AI Verification", desc: "Verify images & details with AI.", icon: Shield, color: "bg-emerald-500/10 text-emerald-400" },
                { title: "Citizen Engagement", desc: "Upvote, comment & track community issues.", icon: Users, color: "bg-pink-500/10 text-pink-400" },
                { title: "Notifications", desc: "Real-time alerts via app, SMS, email & dashboard.", icon: Bell, color: "bg-emerald-500/10 text-emerald-400" },
                { title: "Multi-channel Access", desc: "Web, mobile app & offline field support.", icon: Globe, color: "bg-sky-500/10 text-sky-400" },
                { title: "Predictive Insights", desc: "AI predicts potential issues before they occur.", icon: Zap, color: "bg-yellow-500/10 text-yellow-400" },
                { title: "Resource Optimization", desc: "Allocate resources smartly using AI.", icon: Cpu, color: "bg-lime-500/10 text-lime-400" },
                { title: "Analytics & Reports", desc: "Powerful analytics for better decision making.", icon: FileText, color: "bg-purple-500/10 text-purple-400" }
              ].map(f => (
                <div key={f.title} className="bg-[#0E1726]/60 border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-all select-none">
                  <div className={`h-9 w-9 rounded-lg flex items-center justify-center mb-3.5 ${f.color}`}>
                    <f.icon className="w-5.5 h-5.5" />
                  </div>
                  <h3 className="font-bold text-white text-xs sm:text-sm mb-1">{f.title}</h3>
                  <p className="text-[11px] text-[#9AA3B8] leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </RevealSection>

          <RevealSection delay={0.2} className="text-center mt-8">
            <button onClick={() => navigate("/auth/signup")} className="inline-flex items-center gap-1 text-xs font-black text-[#00E676] uppercase tracking-wider hover:underline">
              Explore All Features <ChevronRight className="w-4 h-4" />
            </button>
          </RevealSection>
        </div>
      </section>

      {/* ── SECTION 5: CIVIC INTELLIGENCE MAP & ANALYTICS SNAPSHOT ── */}
      <section className="relative py-12 z-10 border-b border-white/5 bg-[#0C1523]/40">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            {/* Map Column — Real Leaflet GIS Map */}
            <RevealSection className="lg:col-span-4 flex flex-col justify-between" delay={0.1}>
              <div className="bg-[#0E1726]/80 border border-white/5 rounded-3xl p-5 shadow-xl flex flex-col justify-between h-full">
                <div>
                  <span className="text-[10px] font-black text-[#10D977] uppercase tracking-widest block mb-1">LIVE CITY OVERVIEW</span>
                  <h3 className="text-base font-black text-white mb-4">Pune Municipal GIS Map</h3>
                  <Suspense fallback={
                    <div className="h-[300px] rounded-2xl bg-[#061018] border border-white/5 flex items-center justify-center">
                      <span className="text-[10px] text-[#9AA3B8] font-mono animate-pulse">Loading GIS Map…</span>
                    </div>
                  }>
                    <CivicMap height={300} />
                  </Suspense>
                  <p className="text-[9px] text-[#6B7280] mt-2 leading-relaxed">
                    Real incidents on OpenStreetMap. Toggle layers to filter by type. Click a marker to view details.
                  </p>
                </div>
                <button onClick={() => navigate("/map")} className="w-full flex items-center justify-center gap-2 py-2.5 mt-4 bg-[#08111F] hover:bg-white/5 border border-white/10 rounded-xl font-bold text-xs text-white uppercase tracking-wider">
                  <Map className="w-4 h-4 text-[#10D977]" /> View Full Command Map
                </button>
              </div>
            </RevealSection>
            {/* Analytics Snapshot Column */}
            <RevealSection className="lg:col-span-5" delay={0.2}>
              <div className="bg-[#0E1726]/80 border border-white/5 rounded-3xl p-6 shadow-xl h-full flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <span className="text-[10px] font-black text-[#10D977] uppercase tracking-widest block mb-1">ANALYTICS SNAPSHOT</span>
                      <h3 className="text-lg font-black text-white">Real-Time City Metrics</h3>
                    </div>
                    <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-full">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-[8px] font-mono font-bold text-emerald-400 uppercase">Live telemetry active</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: "Total Issues", val: "12,842", sub: "reported across city", trend: "up", change: "+12.4%", color: "text-white", spark: "M0,20 Q15,10 30,15 T60,5 T90,2" },
                      { label: "Resolved Issues", val: "11,231", sub: "citizens confirmed", trend: "up", change: "+14.8%", color: "text-[#10D977]", spark: "M0,22 Q15,18 30,10 T60,8 T90,1" },
                      { label: "In Progress", val: "1,611", sub: "currently active", trend: "down", change: "-8.2%", color: "text-blue-400", spark: "M0,8 Q15,14 30,12 T60,18 T90,20" },
                      { label: "Avg Routing", val: "43 sec", sub: "report to division", trend: "down", change: "-64.1%", color: "text-purple-400", spark: "M0,22 Q15,12 30,15 T60,8 T90,2" },
                      { label: "AI Accuracy", val: "98.4%", sub: "classification score", trend: "up", change: "+2.1%", color: "text-teal-400", spark: "M0,18 Q15,16 30,19 T60,20 T90,22" },
                      { label: "Departments", val: "340", sub: "connected units", trend: "stable", change: "0.0%", color: "text-amber-400", spark: "M0,12 H90" },
                      { label: "Active Officers", val: "127", sub: "live on the field", trend: "up", change: "+4.2%", color: "text-indigo-400", spark: "M0,10 Q15,12 30,8 T60,15 T90,22" },
                      { label: "Citizen Activity", val: "2.4M", sub: "upvotes & verification", trend: "up", change: "+18.9%", color: "text-pink-400", spark: "M0,20 Q15,15 30,18 T60,10 T90,2" },
                      { label: "Cost Saved (Est)", val: "₹14.6 Cr", sub: "budget optimized", trend: "up", change: "+11.2%", color: "text-[#10D977]", spark: "M0,18 Q15,14 30,16 T60,12 T90,2" },
                    ].map(({ label, val, sub, trend, change, color, spark }) => (
                      <div key={label} className="bg-[#08111F]/60 border border-white/5 rounded-2xl p-3 flex flex-col justify-between hover:border-white/10 transition-all select-none">
                        <div>
                          <div className="flex justify-between items-start gap-1">
                            <span className="text-[8px] font-bold text-[#9AA3B8] uppercase tracking-wider block leading-none mb-1.5 truncate max-w-[70%]">{label}</span>
                            <span className={`text-[7px] font-bold ${
                              trend === "up" ? "text-emerald-400" : trend === "down" ? "text-red-400" : "text-gray-500"
                            }`}>
                              {change}
                            </span>
                          </div>
                          <span className={`text-sm sm:text-base font-black block ${color}`}>{val}</span>
                        </div>

                        {/* Mini SVG Sparkline */}
                        <div className="h-6 w-full my-1.5 opacity-60">
                          <svg className="w-full h-full" viewBox="0 0 90 24" preserveAspectRatio="none">
                            <motion.path
                              d={spark}
                              fill="none"
                              stroke={trend === "up" ? "#10D977" : trend === "down" ? "#EF4444" : "#9AA3B8"}
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              initial={{ pathLength: 0 }}
                              animate={{ pathLength: 1 }}
                              transition={{ duration: 1.2, ease: "easeOut" }}
                            />
                          </svg>
                        </div>

                        <div className="flex items-center justify-between text-[7px] text-[#6B7280] leading-none mt-1">
                          <span className="truncate max-w-[80%]">{sub}</span>
                          <span className="h-1 w-1 rounded-full bg-emerald-500 animate-ping inline-block" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </RevealSection>

            {/* Impact Columns */}
            <RevealSection className="lg:col-span-3" delay={0.3}>
              <div className="bg-[#0E1726]/80 border border-white/5 rounded-3xl p-5 shadow-xl h-full flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-black text-[#10D977] uppercase tracking-widest block mb-2">IMPACT THAT MATTERS</span>
                  <h3 className="text-lg font-black text-white mb-6">Key Results</h3>
                </div>

                <div className="space-y-3">
                  {[
                    { title: "Faster Response", desc: "Average response time reduced by 64%", icon: Clock, color: "text-emerald-400 bg-emerald-500/10" },
                    { title: "Better Transparency", desc: "Real-time tracking & public visibility", icon: Eye, color: "text-blue-400 bg-blue-500/10" },
                    { title: "Data-Driven Decisions", desc: "AI insights for proactive governance", icon: Brain, color: "text-purple-400 bg-purple-500/10" },
                    { title: "Efficient Operations", desc: "Optimize resources & reduce manual work", icon: Cpu, color: "text-amber-400 bg-amber-500/10" }
                  ].map(imp => (
                    <div key={imp.title} className="p-3 bg-[#08111F]/50 border border-white/5 rounded-xl space-y-1.5">
                      <div className="flex items-center gap-2">
                        <div className={`h-6 w-6 rounded flex items-center justify-center shrink-0 ${imp.color}`}>
                          <imp.icon className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-xs font-bold text-white block">{imp.title}</span>
                      </div>
                      <p className="text-[10px] text-[#9AA3B8] leading-normal">{imp.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </RevealSection>
          </div>
        </div>
      </section>

      {/* ── SECTION 6: LIVE OPERATIONS DASHBOARD ─────────────────── */}
      <section className="relative py-12 z-10 border-b border-white/5 bg-[#08111F]/60">
        <div className="max-w-7xl mx-auto px-6">
          <RevealSection className="text-center space-y-3 max-w-2xl mx-auto mb-12">
            <span className="text-xs font-black text-[#10D977] uppercase tracking-widest block">GOVERNMENT COMMAND CENTER</span>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">Live Operations Control</h2>
          </RevealSection>

          <RevealSection delay={0.1}>
            <div className="bg-[#0E1726]/80 border border-white/5 rounded-3xl p-6 shadow-2xl max-w-5xl mx-auto">
              {/* Header bar */}
              <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-5">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
                  <span className="text-xs font-black text-white uppercase tracking-wider">NOC — Operations Control</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-bold text-[#9AA3B8] uppercase">Telemetry Live</span>
                  <span className="ml-2 text-[8px] font-mono text-[#4B5563]">{new Date().toLocaleTimeString('en-IN', { hour12: false })}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Dynamic Incident Feed */}
                <div className="bg-[#08111F]/60 border border-white/5 rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[9px] font-black text-[#9AA3B8] uppercase tracking-wider">Live Incidents Feed</span>
                    <span className="text-[8px] font-mono text-emerald-400">STREAMING</span>
                  </div>
                  <div className="space-y-2 overflow-hidden" style={{ minHeight: 230 }}>
                    <AnimatePresence mode="popLayout">
                      {liveIncidents.map((inc) => (
                        <motion.div key={inc.id}
                          initial={{ opacity: 0, y: -20, scale: 0.97 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ duration: 0.4, ease: 'easeOut' }}
                          className="p-2.5 bg-white/[0.025] border border-white/5 rounded-xl"
                        >
                          <div className="flex items-start justify-between gap-1">
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 mb-0.5">
                                <span className="text-[8px] font-black text-white">{inc.id}</span>
                                <span className="text-[7px] font-mono text-[#4B5563] ml-auto">{inc.emoji}</span>
                              </div>
                              <span className="text-[9px] font-bold text-white block truncate">{inc.label}</span>
                              <span className="text-[8px] text-[#6B7280] block truncate">{inc.loc}</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between mt-1.5">
                            <span className="text-[7px] text-[#6B7280]">{inc.dept}</span>
                            <span className={`text-[7px] font-black uppercase tracking-wider ${inc.sc}`}>{inc.status}</span>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Animated SLA Bars */}
                <div className="bg-[#08111F]/60 border border-white/5 rounded-2xl p-4">
                  <span className="text-[9px] font-black text-[#9AA3B8] uppercase tracking-wider block mb-4">Department SLA Compliance</span>
                  <div className="space-y-4">
                    {slaData.map(dept => {
                      const TIcon = dept.trend === 'up' ? TrendingUp : dept.trend === 'down' ? TrendingDown : Minus;
                      const tc    = dept.trend === 'up' ? 'text-emerald-400' : dept.trend === 'down' ? 'text-red-400' : 'text-[#9AA3B8]';
                      return (
                        <div key={dept.dept}>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[9px] font-bold text-[#9AA3B8] truncate max-w-[60%]">{dept.dept}</span>
                            <div className="flex items-center gap-1">
                              <TIcon className={`w-2.5 h-2.5 ${tc}`} />
                              <span className="text-[9px] font-black text-white">{dept.val.toFixed(1)}%</span>
                            </div>
                          </div>
                          <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                            <motion.div className={`${dept.color} h-1.5 rounded-full`}
                              animate={{ width: `${dept.val}%` }}
                              transition={{ duration: 1, ease: 'easeInOut' }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Emergency alert ticker */}
                  <div className="mt-4 p-2.5 bg-red-500/5 border border-red-500/20 rounded-xl flex items-start gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5 animate-pulse" />
                    <div>
                      <span className="text-[8px] font-black text-red-400 uppercase block">Active Alert</span>
                      <span className="text-[8px] text-[#9AA3B8]">INC-912 — Hanging wires, Shivajinagar. PWD dispatched.</span>
                    </div>
                  </div>

                  {/* Additional status metrics */}
                  <div className="grid grid-cols-2 gap-2 mt-3.5 pt-3.5 border-t border-white/5">
                    <div className="bg-white/[0.01] border border-white/5 rounded-xl p-2">
                      <span className="text-[8px] text-[#6B7280] font-bold block uppercase leading-none mb-1">Active Crews</span>
                      <span className="text-xs font-black text-white">48 Deployed</span>
                    </div>
                    <div className="bg-white/[0.01] border border-white/5 rounded-xl p-2">
                      <span className="text-[8px] text-[#6B7280] font-bold block uppercase leading-none mb-1">Response Time</span>
                      <span className="text-xs font-black text-emerald-400">14.2m Avg</span>
                    </div>
                  </div>
                </div>

                {/* AI Accuracy Gauge */}
                <div className="bg-[#08111F]/60 border border-white/5 rounded-2xl p-4 flex flex-col justify-between">
                  <div>
                    <span className="text-[9px] font-black text-[#9AA3B8] uppercase tracking-wider block mb-3">AI Prediction Accuracy</span>
                    {/* SVG Circular Gauge */}
                    <div className="relative flex items-center justify-center my-2">
                      <svg width="120" height="120" viewBox="0 0 120 120" className="mx-auto">
                        <circle cx="60" cy="60" r="48" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="8"/>
                        <motion.circle cx="60" cy="60" r="48" fill="none" stroke="#00E676" strokeWidth="8"
                          strokeLinecap="round"
                          strokeDasharray={`${2 * Math.PI * 48}`}
                          animate={{ strokeDashoffset: 2 * Math.PI * 48 * (1 - aiAccuracy / 100) }}
                          transition={{ duration: 1.2, ease: 'easeInOut' }}
                          style={{ transform: 'rotate(-90deg)', transformOrigin: '60px 60px' }}
                        />
                        <motion.circle cx="60" cy="60" r="38" fill="none" stroke="rgba(0,230,118,0.08)" strokeWidth="1"/>
                      </svg>
                      <div className="absolute flex flex-col items-center">
                        <motion.span className="text-xl font-black text-[#00E676]" key={aiAccuracy}
                          initial={{ opacity: 0.6 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}
                        >{aiAccuracy}%</motion.span>
                        <span className="text-[6px] font-mono text-[#6B7280] uppercase tracking-wider">ACCURACY</span>
                      </div>
                    </div>

                    <div className="w-full space-y-1.5 mt-2">
                      {[
                        { label: 'Classification', val: '98.4%', color: 'text-emerald-400' },
                        { label: 'Routing',        val: '99.1%', color: 'text-blue-400'    },
                        { label: 'Verification',   val: '97.2%', color: 'text-purple-400'  },
                      ].map(r => (
                        <div key={r.label} className="flex items-center justify-between">
                          <span className="text-[8px] text-[#6B7280] font-medium">{r.label}</span>
                          <span className={`text-[8px] font-black ${r.color}`}>{r.val}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Real-time system log terminal */}
                  <div className="bg-black/35 border border-white/5 rounded-xl p-2 font-mono text-[7px] text-[#10D977]/80 leading-relaxed mt-4 space-y-0.5">
                    <div className="flex justify-between border-b border-white/5 pb-1 mb-1 text-[6px] text-[#6B7280]">
                      <span>SYSTEM OPERATIONS LOG</span>
                      <span className="animate-pulse">● LIVE</span>
                    </div>
                    <div className="truncate">&gt; [08:48:20] AI Core cluster initialized.</div>
                    <div className="truncate">&gt; [08:48:21] Dedup: 0 conflicts found in 50m.</div>
                    <div className="truncate">&gt; [08:48:22] Incident routed to Solid Waste board.</div>
                    <div className="truncate">&gt; [08:48:23] SLA priority calculated: High Priority.</div>
                  </div>

                  <div className="mt-4 w-full flex items-center justify-between text-[7px] font-mono text-[#4B5563] border-t border-white/5 pt-2">
                    <span>SLA: COMPLIANT</span>
                    <span className="text-emerald-400 font-bold">CONFIDENCE: HIGH</span>
                  </div>
                </div>
              </div>
            </div>
          </RevealSection>
        </div>
      </section>


      {/* ── SECTION 7: CIVIC IMPACT & PERFORMANCE (REPLACE TECH STACK) ── */}
      <section className="relative py-20 z-10 border-b border-white/5 bg-[#0C1523]/20">
        <div className="max-w-7xl mx-auto px-6">
          <RevealSection className="text-center space-y-3 max-w-2xl mx-auto mb-14">
            <span className="text-xs font-black text-[#10D977] uppercase tracking-widest block">PERFORMANCE METRICS</span>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Civic Impact & Performance
            </h2>
          </RevealSection>

          <RevealSection delay={0.1}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
              {[
                { label: "Reports Resolved", val: "11,231+", color: "text-[#00E676]" },
                { label: "Avg. Resolution Time", val: "18 Hours", color: "text-blue-400" },
                { label: "Manual Work Reduced", val: "64%", color: "text-purple-400" },
                { label: "Citizen Participation", val: "25k+ Active", color: "text-[#00E676]" },
                { label: "AI Routing Accuracy", val: "98.4%", color: "text-teal-400" },
                { label: "Departments Connected", val: "340 Units", color: "text-amber-400" },
                { label: "Funds Saved (Est.)", val: "₹14.6 Cr", color: "text-emerald-400" },
                { label: "Citizen Satisfaction", val: "89%", color: "text-orange-400" },
              ].map(kpi => (
                <div key={kpi.label} className="bg-[#0E1726]/60 border border-white/5 rounded-2xl p-5 text-center">
                  <span className="text-[10px] font-bold text-[#9AA3B8] uppercase tracking-wider block leading-none mb-2">{kpi.label}</span>
                  <span className={`text-xl sm:text-2xl font-black block ${kpi.color}`}>{kpi.val}</span>
                </div>
              ))}
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ── SECTION 8: PLATFORM WORKFLOW ─────────────────────────── */}
      <section id="how-it-works" className="relative py-20 z-10 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <RevealSection className="text-center space-y-3 max-w-2xl mx-auto mb-16">
            <span className="text-xs font-black text-[#10D977] uppercase tracking-widest block">HOW IT WORKS</span>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Platform Workflow
            </h2>
          </RevealSection>

          <div className="grid grid-cols-1 md:grid-cols-9 gap-4 text-center items-start relative">
            {[
              { step: "01", name: "Citizen Report", desc: "Submitted via app/web with media." },
              { step: "02", name: "AI Analysis", desc: "Analyzes photos & text description." },
              { step: "03", name: "Duplicate Check", desc: "Flags duplicates in a geofence." },
              { step: "04", name: "Priority Assignment", desc: "Assigns dynamic SLA and deadline." },
              { step: "05", name: "Dept Allocation", desc: "Routes report directly to department." },
              { step: "06", name: "Officer Action", desc: "Dispatched crew completes the job." },
              { step: "07", name: "Photo Verification", desc: "AI verifies completion photo proof." },
              { step: "08", name: "Citizen Notification", desc: "Citizen gets verified fix alert." },
              { step: "09", name: "Analytics Logs", desc: "SLA metrics written to dashboard." },
            ].map((node, i) => (
              <div key={node.step} className="flex flex-col items-center relative group">
                <div className="h-10 w-10 rounded-full border border-white/10 bg-[#0E1726] flex items-center justify-center font-black text-xs text-white mb-3">
                  {node.step}
                </div>
                <span className="text-xs font-bold text-white block mb-1 leading-tight">{node.name}</span>
                <p className="text-[10px] text-[#9AA3B8] leading-normal px-2">{node.desc}</p>
                {i < 8 && (
                  <div className="hidden md:block absolute top-5 left-[calc(100%_-_8px)] z-20">
                    <ChevronRight className="w-4 h-4 text-white/10" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 9: WHY CIVICCONNECT AI IS BETTER ─────────────── */}
      <section className="relative py-20 z-10 border-b border-white/5 bg-[#0C1523]/40">
        <div className="max-w-4xl mx-auto px-6">
          <RevealSection className="text-center space-y-3 max-w-2xl mx-auto mb-14">
            <span className="text-xs font-black text-[#10D977] uppercase tracking-widest block">COMPARISON SUMMARY</span>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Why CivicConnect AI is Better
            </h2>
          </RevealSection>

          <RevealSection delay={0.1}>
            <div className="bg-[#0E1726]/80 border border-white/5 rounded-3xl overflow-hidden shadow-2xl text-xs">
              <div className="grid grid-cols-3 bg-white/[0.02] border-b border-white/5 font-black text-[#9AA3B8] p-4 uppercase tracking-wider text-[10px]">
                <div>Operations Layer</div>
                <div className="text-red-400">Traditional System</div>
                <div className="text-[#10D977]">CivicConnect AI</div>
              </div>
              {[
                { f: "Manual routing", vs: "AI routing" },
                { f: "Paper records", vs: "Digital workflows" },
                { f: "Delayed response", vs: "Real-time action" },
                { f: "No transparency", vs: "Live tracking" },
                { f: "No prediction", vs: "Predictive AI" },
                { f: "Department silos", vs: "Unified platform" },
              ].map((row, idx) => (
                <div key={row.f} className={`grid grid-cols-3 p-4 border-b border-white/5 items-center ${idx % 2 === 0 ? "bg-white/[0.01]" : ""}`}>
                  <div className="font-bold text-[#9AA3B8]">{row.f}</div>
                  <div className="text-[#9AA3B8] flex items-center gap-1.5">
                    <span className="text-red-400 font-bold">✕</span> Traditional System
                  </div>
                  <div className="text-white font-bold flex items-center gap-1.5">
                    <span className="text-[#10D977] font-bold">✓</span> {row.vs}
                  </div>
                </div>
              ))}
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ── SECTION 10: TESTIMONIALS (3-CARD CAROUSEL) ── */}
      <section className="relative py-20 z-10 border-b border-white/5 bg-[#0C1523]/40">
        <div className="max-w-7xl mx-auto px-6">
          <RevealSection className="text-center space-y-3 max-w-2xl mx-auto mb-14">
            <span className="text-xs font-black text-[#10D977] uppercase tracking-widest block">WHAT PEOPLE SAY</span>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Trusted by Leaders & Citizens
            </h2>
          </RevealSection>

          <div
            className="relative"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            {/* Carousel Container */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center max-w-5xl mx-auto">
              {[
                { offset: -1, style: "opacity-60 scale-95 hidden md:flex" },
                { offset: 0,  style: "opacity-100 scale-100 border-[#10D977]/30 shadow-lg shadow-[#10D977]/5" },
                { offset: 1,  style: "opacity-60 scale-95 hidden md:flex" }
              ].map(({ offset, style }) => {
                const idx = (testimonialIdx + offset + 5) % 5;
                const item = testimonials[idx];
                const isCenter = offset === 0;

                return (
                  <motion.div
                    key={`${idx}-${offset}`}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: isCenter ? 1.03 : 0.95 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.45 }}
                    className={`bg-[#0E1726]/85 border border-white/5 rounded-3xl p-6 flex flex-col justify-between min-h-[220px] transition-all duration-300 ${style}`}
                  >
                    <div>
                      <div className="flex gap-0.5 mb-3 text-amber-400">
                        {Array.from({ length: item.rating }).map((_, s) => (
                          <Star key={s} className="w-3 h-3 fill-current" />
                        ))}
                      </div>
                      <p className="text-xs text-[#D1D5DB] leading-relaxed italic mb-5">
                        "{item.quote}"
                      </p>
                    </div>

                    <div className="flex items-center gap-3 border-t border-white/5 pt-4">
                      <div className="h-9 w-9 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center font-black text-white text-xs shrink-0">
                        {item.avatar}
                      </div>
                      <div className="min-w-0">
                        <span className="font-bold text-white block text-xs truncate">{item.name}</span>
                        <span className="text-[9px] text-[#10D977] font-bold block truncate">
                          {item.role} • {item.dept}
                        </span>
                      </div>
                      {isCenter && (
                        <div className="ml-auto bg-emerald-500/10 border border-emerald-500/25 px-1.5 py-0.5 rounded text-[7px] font-mono font-bold text-emerald-400">
                          VERIFIED
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Slider Dots */}
            <div className="flex justify-center gap-2 mt-8">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setTestimonialIdx(i)}
                  className={`h-1.5 rounded-full transition-all ${
                    i === testimonialIdx ? "w-6 bg-[#10D977]" : "w-1.5 bg-white/20"
                  }`}
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 11: PLATFORM SECURITY & FAQ (SIDE-BY-SIDE) ── */}
      <section className="relative py-20 z-10 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            
            {/* Left: Platform Security (Government Trust Metrics) */}
            <RevealSection className="lg:col-span-5 flex flex-col justify-between" delay={0.1}>
              <div className="bg-[#0E1726]/80 border border-white/5 rounded-3xl p-6 shadow-xl flex flex-col justify-between h-full">
                <div>
                  <span className="text-[10px] font-black text-[#10D977] uppercase tracking-widest block mb-2">
                    ENTERPRISE SECURITY
                  </span>
                  <h3 className="text-lg font-black text-white mb-4">Government Grade Security</h3>
                  <p className="text-xs text-[#9AA3B8] leading-relaxed mb-6">
                    Designed to comply with sovereign data hosting mandates, national intelligence standards, and municipal audit guidelines.
                  </p>

                  <div className="space-y-3">
                    {SECURITY_FEATURES.map((item) => {
                      const Icon = item.icon;
                      return (
                        <div key={item.label} className="flex items-center gap-3 p-3 bg-[#08111F]/50 border border-white/5 rounded-xl hover:border-white/10 transition-colors">
                          <div className="h-7 w-7 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                            <Icon className="w-4 h-4" />
                          </div>
                          <span className="text-xs font-bold text-white">{item.label}</span>
                          <span className="ml-auto text-[8px] font-mono text-emerald-400 font-bold bg-emerald-500/5 px-2 py-0.5 rounded">
                            ACTIVE
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-6 flex items-center gap-2 border-t border-white/5 pt-4 text-[9px] font-mono text-[#6B7280]">
                  <Lock className="w-3.5 h-3.5 text-emerald-400" />
                  <span>COMPLIANT WITH CERT-IN &amp; MEITY GUIDELINES</span>
                </div>
              </div>
            </RevealSection>

            {/* Right: FAQ Accordion */}
            <RevealSection className="lg:col-span-7" delay={0.2}>
              <div className="bg-[#0E1726]/80 border border-white/5 rounded-3xl p-6 shadow-xl h-full flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-black text-[#10D977] uppercase tracking-widest block mb-2">
                    FREQUENTLY ASKED QUESTIONS
                  </span>
                  <h3 className="text-lg font-black text-white mb-6">Common Inquiries</h3>

                  <div className="space-y-2.5">
                    {faqs.map(faq => <FAQItem key={faq.q} {...faq} />)}
                  </div>
                </div>

                <button onClick={() => navigate("/auth/signup")} className="w-full flex items-center justify-center gap-1.5 py-3 bg-[#08111F] hover:bg-white/5 border border-white/10 rounded-xl font-bold text-xs text-[#10D977] uppercase tracking-wider mt-6">
                  View All FAQs <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </RevealSection>

          </div>
        </div>
      </section>

      {/* ── SECTION 12: FINAL CTA ────────────────────────────────── */}
      <section className="relative py-24 z-10 overflow-hidden border-b border-white/5">
        <div className="absolute inset-0 bg-gradient-radial from-emerald-900/10 via-[#08111F] to-[#08111F] pointer-events-none" />
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <RevealSection className="space-y-6 bg-[#0E1726]/80 border border-white/5 rounded-3xl p-10 shadow-2xl">
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Ready to Digitally Transform Your City?
            </h2>
            <p className="text-xs sm:text-sm text-[#9AA3B8] max-w-lg mx-auto leading-relaxed">
              Join municipalities modernizing governance with AI-powered civic intelligence, real-time analytics, and transparent citizen engagement.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <button
                onClick={handleContinueAsGuest}
                disabled={guestLoading}
                className="flex items-center justify-center gap-2 px-8 py-3 font-bold border border-white/10 rounded-xl hover:bg-white/5 text-xs text-white uppercase tracking-wider"
              >
                {guestLoading ? "Starting..." : "Continue as Guest"}
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => navigate("/auth/signup")}
                className="flex items-center justify-center gap-2 px-8 py-3 font-bold bg-[#00E676] hover:bg-[#10D977] text-xs text-black rounded-xl uppercase tracking-wider shadow-lg shadow-[#00E676]/20"
              >
                Get Started
              </button>
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────────── */}
      <footer id="about" className="relative bg-[#060D17] border-t border-white/5 z-10">
        <div className="max-w-7xl mx-auto px-6 pt-16 pb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-white/5">
            {/* Tagline */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigate("/landing")}>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-md">
                  <Shield className="h-4 w-4" />
                </div>
                <span className="text-lg font-black text-white">CivicConnect <span className="text-[#00E676]">AI</span></span>
              </div>
              <p className="text-xs text-[#9AA3B8] leading-relaxed max-w-xs">
                An enterprise-grade AI Governance Platform empowering municipal corporations, local districts, and citizens to collaborate on public infrastructure improvements.
              </p>
            </div>

            {/* Platform links */}
            <div className="space-y-4">
              <h4 className="text-xs font-black uppercase tracking-widest text-white">Platform</h4>
              <ul className="space-y-2">
                <li><a href="#home" className="text-xs text-[#9AA3B8] hover:text-white transition-colors">Home</a></li>
                <li><a href="#features" className="text-xs text-[#9AA3B8] hover:text-white transition-colors">Features</a></li>
                <li><a href="#platform" className="text-xs text-[#9AA3B8] hover:text-white transition-colors">How It Works</a></li>
                <li><span className="text-xs text-[#9AA3B8] hover:text-white transition-colors cursor-pointer" onClick={() => navigate("/map")}>Interactive GIS Map</span></li>
              </ul>
            </div>

            {/* Solutions & Compliance */}
            <div className="space-y-4">
              <h4 className="text-xs font-black uppercase tracking-widest text-white">Governance &amp; RTI</h4>
              <ul className="space-y-2">
                <li><span className="text-xs text-[#9AA3B8] hover:text-white transition-colors cursor-pointer">Right to Information (RTI)</span></li>
                <li><span className="text-xs text-[#9AA3B8] hover:text-white transition-colors cursor-pointer">Accessibility Policy</span></li>
                <li><span className="text-xs text-[#9AA3B8] hover:text-white transition-colors cursor-pointer">Security Compliance</span></li>
                <li><span className="text-xs text-[#9AA3B8] hover:text-white transition-colors cursor-pointer">Developer APIs</span></li>
              </ul>
            </div>

            {/* Newsletter & Status */}
            <div className="space-y-4">
              <h4 className="text-xs font-black uppercase tracking-widest text-white">Platform Status</h4>
              <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3 py-2 text-xs text-white">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] font-bold text-emerald-400 uppercase">All Systems Operational</span>
              </div>
              <div className="flex gap-2 mt-2">
                <input type="email" placeholder="Enter your email" className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500/50" />
                <button className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-xs font-bold text-white transition-colors">Join</button>
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center gap-4 pt-8 text-xs text-[#6B7280]">
            <span>© {new Date().getFullYear()} CivicConnect AI Platform. All rights reserved.</span>
            <span>Government-grade platform optimized for licensed municipal boards and local corporations.</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
