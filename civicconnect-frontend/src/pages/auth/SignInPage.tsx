import React, { useState, useEffect, useCallback, memo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword, signInWithPopup, signInAnonymously } from "firebase/auth";
import { auth, googleProvider } from "../../config/firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../config/firebase";
import { useAuthStore } from "../../stores/authStore";
import { UserRole } from "../../types/user.types";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
  Shield, Lock, Mail, User, Landmark, Sparkles,
  ShieldAlert, Settings2, Eye, EyeOff, Copy, Check,
  CheckCircle, XCircle
} from "lucide-react";

// ─── Role Card Config ────────────────────────────────────────────────────────

interface WorkspaceProfile {
  role: UserRole;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  accentColor: string;
  borderColor: string;
  glowColor: string;
  badgeColor: string;
  permissions: { label: string; allowed: boolean }[];
  description: string;
}

const WORKSPACE_PROFILES: WorkspaceProfile[] = [
  {
    role: "citizen",
    title: "Citizen",
    subtitle: "Community Participation",
    icon: User,
    accentColor: "text-emerald-400",
    borderColor: "border-emerald-500/30",
    glowColor: "shadow-emerald-500/20",
    badgeColor: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
    description: "Report civic issues, support complaints, join community events, and volunteer.",
    permissions: [
      { label: "Report Issues", allowed: true },
      { label: "Support Complaints", allowed: true },
      { label: "Join Events & Volunteer", allowed: true },
      { label: "Moderate Community", allowed: false },
      { label: "Manage Users", allowed: false },
    ],
  },
  {
    role: "official",
    title: "Municipal Official",
    subtitle: "Department Operations",
    icon: Landmark,
    accentColor: "text-blue-400",
    borderColor: "border-blue-500/30",
    glowColor: "shadow-blue-500/20",
    badgeColor: "bg-blue-500/10 border-blue-500/20 text-blue-400",
    description: "Manage assigned complaints, update issue lifecycle, assign workers, upload resolution evidence.",
    permissions: [
      { label: "Department Queue", allowed: true },
      { label: "Issue Status Updates", allowed: true },
      { label: "Resolution Evidence", allowed: true },
      { label: "User Management", allowed: false },
      { label: "System Settings", allowed: false },
    ],
  },
  {
    role: "moderator",
    title: "Community Moderator",
    subtitle: "Community Safety",
    icon: ShieldAlert,
    accentColor: "text-orange-400",
    borderColor: "border-orange-500/30",
    glowColor: "shadow-orange-500/20",
    badgeColor: "bg-orange-500/10 border-orange-500/20 text-orange-400",
    description: "Moderate discussions, verify reports, remove content, and maintain community safety.",
    permissions: [
      { label: "Moderate Discussions", allowed: true },
      { label: "Verify Reports", allowed: true },
      { label: "Remove Content", allowed: true },
      { label: "Change Issue Status", allowed: false },
      { label: "User Role Management", allowed: false },
    ],
  },
  {
    role: "admin",
    title: "Administrator",
    subtitle: "Platform Governance",
    icon: Settings2,
    accentColor: "text-purple-400",
    borderColor: "border-purple-500/30",
    glowColor: "shadow-purple-500/20",
    badgeColor: "bg-purple-500/10 border-purple-500/20 text-purple-400",
    description: "Manage platform users, departments, categories, analytics, and all system settings.",
    permissions: [
      { label: "User & Role Management", allowed: true },
      { label: "Departments & Categories", allowed: true },
      { label: "Analytics & Settings", allowed: true },
      { label: "Moderation Oversight", allowed: true },
      { label: "Platform Governance", allowed: true },
    ],
  },
];

// Demo accounts – only shown in DEV or when flag is set
const DEMO_ACCOUNTS = [
  { role: "citizen" as UserRole, email: "citizen@civicconnect.ai", label: "Citizen Demo", color: "text-emerald-400" },
  { role: "official" as UserRole, email: "official@civicconnect.ai", label: "Official Demo", color: "text-blue-400" },
  { role: "moderator" as UserRole, email: "moderator@civicconnect.ai", label: "Moderator Demo", color: "text-orange-400" },
  { role: "admin" as UserRole, email: "admin@civicconnect.ai", label: "Admin Demo", color: "text-purple-400" },
];

const SHOW_DEMO = import.meta.env.DEV === true || import.meta.env.VITE_ENABLE_DEMO_ACCOUNTS === "true";

// ─── Role redirect helper ────────────────────────────────────────────────────

function getRoleRedirect(role: UserRole): string {
  switch (role) {
    case "admin":      return "/dashboard/admin";
    case "moderator":  return "/dashboard/moderator";
    case "official":   return "/dashboard";
    default:           return "/";
  }
}

// ─── WorkspaceCard (memoised) ────────────────────────────────────────────────

const WorkspaceCard = memo(({
  profile, selected, onSelect
}: {
  profile: WorkspaceProfile;
  selected: boolean;
  onSelect: (role: UserRole) => void;
}) => {
  const Icon = profile.icon;
  return (
    <button
      type="button"
      aria-pressed={selected}
      aria-label={`Select ${profile.title} workspace`}
      onClick={() => onSelect(profile.role)}
      className={`
        group relative w-full text-left p-4 rounded-xl border transition-all duration-200 cursor-pointer
        focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500
        ${selected
          ? `${profile.borderColor} bg-white/[0.04] shadow-lg ${profile.glowColor}`
          : "border-white/5 bg-white/[0.02] hover:border-white/10 hover:bg-white/[0.04]"
        }
      `}
    >
      {/* Active indicator dot */}
      {selected && (
        <span className={`absolute top-3 right-3 w-1.5 h-1.5 rounded-full ${profile.accentColor.replace("text-", "bg-")} animate-pulse`} />
      )}

      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg border shrink-0 transition-colors ${selected ? `${profile.badgeColor}` : "bg-white/5 border-white/5 text-[#9AA3B8]"}`}>
          <Icon className={`w-4 h-4 ${selected ? profile.accentColor : ""}`} />
        </div>
        <div className="min-w-0">
          <span className={`block text-sm font-bold leading-tight ${selected ? "text-white" : "text-[#D1D5DB]"}`}>
            {profile.title}
          </span>
          <span className={`block text-[10px] font-semibold mt-0.5 ${selected ? profile.accentColor : "text-[#6B7280]"}`}>
            {profile.subtitle}
          </span>
        </div>
      </div>
    </button>
  );
});
WorkspaceCard.displayName = "WorkspaceCard";

// ─── CopyButton ──────────────────────────────────────────────────────────────

const CopyButton = ({ text }: { text: string }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };
  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={`Copy ${text}`}
      className="p-1 text-[#6B7280] hover:text-white transition-colors cursor-pointer rounded"
    >
      {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
    </button>
  );
};

// ─── SignInPage ───────────────────────────────────────────────────────────────

export const SignInPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, setUser } = useAuthStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Visual-only: which card is highlighted. NEVER used for authorization.
  const [selectedCard, setSelectedCard] = useState<UserRole>("citizen");

  const selectedProfile = WORKSPACE_PROFILES.find(p => p.role === selectedCard)!;

  // ── Redirect if already authenticated ──────────────────────────────────────
  useEffect(() => {
    if (!authLoading && user) {
      navigate(getRoleRedirect(user.role), { replace: true });
    }
  }, [authLoading, user, navigate]);

  if (authLoading) return <div />;

  // ── Post-auth: fetch Firestore role and redirect ───────────────────────────
  const handlePostAuthRedirect = async (uid: string) => {
    try {
      const snap = await getDoc(doc(db, "users", uid));
      if (snap.exists()) {
        const data = snap.data();
        setUser(data as any);
        navigate(getRoleRedirect(data.role as UserRole), { replace: true });
      } else {
        // New user — send to onboarding
        navigate("/onboarding", { replace: true });
      }
    } catch (err) {
      console.error("Failed to fetch Firestore profile:", err);
      navigate("/onboarding", { replace: true });
    }
  };

  // ── Email/password sign in ─────────────────────────────────────────────────
  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      await handlePostAuthRedirect(cred.user.uid);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to sign in. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  // ── Google sign in ────────────────────────────────────────────────────────
  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError("");
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      await handlePostAuthRedirect(cred.user.uid);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to sign in with Google.");
    } finally {
      setLoading(false);
    }
  };

  // ── Demo sign in (anonymous + seeded profile) ─────────────────────────────
  const handleDemoSignIn = async (role: UserRole) => {
    setLoading(true);
    setError("");

    // Demographic seeds per role
    const DEMO_SEEDS: Record<UserRole, any> = {
      citizen: {
        displayName: "Priya Sharma",
        email: "citizen@civicconnect.ai",
        role: "citizen",
        department: null,
        trust: { score: 72, tier: "silver", totalReports: 5, verifiedReports: 4, falseReportCount: 0, verificationContributions: 8, resolutionConfirmations: 3, badges: [{ id: "b1", name: "First Report", description: "", icon: "🏅", earnedAt: new Date() }], lastUpdated: new Date() },
        reputation: 72, volunteerHours: 6, fcmTokens: [], notificationPreferences: { verificationRequests: true, statusUpdates: true, communityMilestones: true, weeklyDigest: false }, createdAt: new Date(), lastActiveAt: new Date()
      },
      official: {
        displayName: "Officer Vikram",
        email: "official@civicconnect.ai",
        role: "official",
        department: "Roads",
        officerCode: "ROADS101",
        trust: { score: 100, tier: "platinum", totalReports: 0, verifiedReports: 0, falseReportCount: 0, verificationContributions: 0, resolutionConfirmations: 0, badges: [{ id: "b2", name: "Certified Responder", description: "", icon: "🏆", earnedAt: new Date() }], lastUpdated: new Date() },
        reputation: 100, volunteerHours: 0, fcmTokens: [], notificationPreferences: { verificationRequests: true, statusUpdates: true, communityMilestones: false, weeklyDigest: true }, createdAt: new Date(), lastActiveAt: new Date()
      },
      moderator: {
        displayName: "Maya Reddy",
        email: "moderator@civicconnect.ai",
        role: "moderator",
        department: null,
        trust: { score: 90, tier: "gold", totalReports: 2, verifiedReports: 2, falseReportCount: 0, verificationContributions: 20, resolutionConfirmations: 10, badges: [{ id: "b3", name: "Community Guardian", description: "", icon: "🛡️", earnedAt: new Date() }], lastUpdated: new Date() },
        reputation: 90, volunteerHours: 12, fcmTokens: [], notificationPreferences: { verificationRequests: true, statusUpdates: true, communityMilestones: true, weeklyDigest: false }, createdAt: new Date(), lastActiveAt: new Date()
      },
      admin: {
        displayName: "Admin User",
        email: "admin@civicconnect.ai",
        role: "admin",
        department: null,
        trust: { score: 100, tier: "platinum", totalReports: 0, verifiedReports: 0, falseReportCount: 0, verificationContributions: 0, resolutionConfirmations: 0, badges: [], lastUpdated: new Date() },
        reputation: 100, volunteerHours: 0, fcmTokens: [], notificationPreferences: { verificationRequests: true, statusUpdates: true, communityMilestones: true, weeklyDigest: true }, createdAt: new Date(), lastActiveAt: new Date()
      },
    };

    try {
      const cred = await signInAnonymously(auth);
      const uid = cred.user.uid;
      const seed = { uid, ...DEMO_SEEDS[role] };

      // Write the profile to Firestore so rules & listeners see the correct role
      await setDoc(doc(db, "users", uid), seed, { merge: true });

      setUser(seed as any);
      navigate(getRoleRedirect(role), { replace: true });
    } catch (err: any) {
      console.error("Demo login failed:", err);
      setError(err.message || "Failed to launch demo sandbox.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-[#081220] text-[#F5F7FA] font-sans antialiased overflow-hidden relative">
      {/* Background Grid */}
      <div className="absolute inset-0 grid-pattern pointer-events-none opacity-40 z-0" />

      {/* Blur orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] aspect-square rounded-full bg-emerald-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[10%] right-[-10%] w-[45%] aspect-square rounded-full bg-purple-500/5 blur-[120px] pointer-events-none" />

      {/* ── Left panel (desktop) ─────────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-16 overflow-hidden border-r border-white/5 z-10 bg-[#0F172A]/40 backdrop-blur-sm">
        <div className="absolute inset-0 z-[-1] overflow-hidden">
          <img src="/smart_city_hero.png" alt="Smart City Governance" className="w-full h-full object-cover opacity-15" />
          <div className="absolute inset-0 bg-gradient-to-tr from-[#081220] via-[#081220]/80 to-[#081220]/20" />
        </div>

        {/* Branding */}
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigate("/landing")}>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-lg shadow-emerald-500/20">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <span className="text-xl font-black tracking-tight text-white block">
              CivicConnect <span className="text-[#22C55E]">AI</span>
            </span>
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest block leading-none mt-0.5">
              AI for Better Governance
            </span>
          </div>
        </div>

        {/* Mission statement */}
        <div className="space-y-6 max-w-lg">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <Sparkles className="w-3.5 h-3.5 text-[#22C55E]" />
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Enterprise AI Operations</span>
          </div>
          <h2 className="text-4xl font-black leading-tight text-white tracking-tight">
            Smarter Governance.<br />
            <span className="text-[#22C55E]">Stronger Communities.</span>
          </h2>
          <p className="text-[#9AA3B8] text-base leading-relaxed">
            Manage municipal workloads, route emergency alerts, and confirm hardware and maintenance repairs automatically using multi-agent operations.
          </p>

          {/* Role info panel — updates when card is selected */}
          <div className={`border rounded-2xl p-4 space-y-3 transition-all duration-300 ${selectedProfile.borderColor} bg-white/[0.02]`}>
            <div className="flex items-center gap-2">
              <selectedProfile.icon className={`w-4 h-4 ${selectedProfile.accentColor}`} />
              <span className={`text-xs font-black uppercase tracking-wider ${selectedProfile.accentColor}`}>
                {selectedProfile.title} Workspace
              </span>
            </div>
            <p className="text-[11px] text-[#9AA3B8] leading-relaxed font-medium">{selectedProfile.description}</p>
            <div className="space-y-1.5 pt-1 border-t border-white/5">
              {selectedProfile.permissions.map((p) => (
                <div key={p.label} className="flex items-center gap-2 text-[11px] font-semibold">
                  {p.allowed
                    ? <CheckCircle className="w-3 h-3 text-emerald-400 shrink-0" />
                    : <XCircle className="w-3 h-3 text-[#6B7280] shrink-0" />
                  }
                  <span className={p.allowed ? "text-[#D1D5DB]" : "text-[#4B5563]"}>{p.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="text-xs text-[#9AA3B8]">
          © {new Date().getFullYear()} CivicConnect AI Platform. Secured by Government-grade encryption.
        </div>
      </div>

      {/* ── Right panel: Login form ───────────────────────────────────────────── */}
      <div className="w-full lg:w-1/2 flex items-start justify-center p-6 sm:p-10 z-10 relative overflow-y-auto">
        <div className="w-full max-w-md space-y-6 py-6">

          {/* Mobile branding */}
          <div className="text-center lg:hidden space-y-3">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-[#22C55E]">
              <Shield className="h-7 w-7" />
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-tight text-white">CivicConnect AI</h2>
              <p className="text-xs text-[#9AA3B8] uppercase tracking-wider font-semibold mt-1">AI-Powered Governance Platform</p>
            </div>
          </div>

          {/* Desktop heading */}
          <div className="hidden lg:block text-left space-y-1">
            <h2 className="text-2xl font-black tracking-tight text-white">Welcome Back</h2>
            <p className="text-sm text-[#9AA3B8]">Access the CivicConnect operations suite</p>
          </div>

          {/* Error message */}
          {error && (
            <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-xs font-semibold text-red-400">
              {error}
            </div>
          )}

          {/* ── Workspace selector ─────────────────────────────────────────── */}
          <div className="space-y-3 bg-[#1A2332]/50 border border-[#273244] rounded-2xl p-4">
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#16A34A] block">
                COMMAND CENTER PROFILES
              </span>
              <div className="h-px bg-[#273244] w-full" />
              <p className="text-[11px] text-[#9CA3AF] leading-normal font-semibold pt-0.5">
                Preview a workspace. Your actual role is always read from Firestore after login.
              </p>
            </div>

            {/* 2×2 grid */}
            <div className="grid grid-cols-2 gap-2.5">
              {WORKSPACE_PROFILES.map((profile) => (
                <WorkspaceCard
                  key={profile.role}
                  profile={profile}
                  selected={selectedCard === profile.role}
                  onSelect={setSelectedCard}
                />
              ))}
            </div>

            {/* Contextual description strip */}
            <div className={`flex items-start gap-2 rounded-xl border p-3 transition-all duration-300 ${selectedProfile.borderColor} bg-white/[0.02]`}>
              <selectedProfile.icon className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${selectedProfile.accentColor}`} />
              <p className="text-[10px] text-[#9CA3AF] leading-relaxed font-medium">
                <span className={`font-black ${selectedProfile.accentColor}`}>{selectedProfile.title}: </span>
                {selectedProfile.description}
              </p>
            </div>
          </div>

          {/* ── Email form ────────────────────────────────────────────────── */}
          <form className="space-y-4" onSubmit={handleEmailSignIn}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="email" className="text-xs font-bold text-[#9AA3B8] uppercase tracking-wider">
                  Email Address
                </Label>
                <div className="relative mt-1.5">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#9AA3B8]">
                    <Mail className="h-4 w-4" />
                  </div>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="pl-10 py-3.5 bg-white/5 border border-white/5 text-[#F5F7FA] placeholder-[#9AA3B8]/40 focus:ring-1 focus:ring-[#22C55E] focus:border-[#22C55E] rounded-xl text-sm"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="password" className="text-xs font-bold text-[#9AA3B8] uppercase tracking-wider">
                  Password
                </Label>
                <div className="relative mt-1.5">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#9AA3B8]">
                    <Lock className="h-4 w-4" />
                  </div>
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pl-10 py-3.5 pr-10 bg-white/5 border border-white/5 text-[#F5F7FA] placeholder-[#9AA3B8]/40 focus:ring-1 focus:ring-[#22C55E] focus:border-[#22C55E] rounded-xl text-sm"
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-[#9AA3B8] hover:text-white cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 rounded-xl text-white font-bold transition-all shadow-lg shadow-emerald-500/20 cursor-pointer"
              loading={loading}
            >
              Sign In with Email
            </Button>
          </form>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/5" />
            </div>
            <div className="relative flex justify-center text-xs uppercase tracking-wider font-semibold">
              <span className="bg-[#081220] px-3.5 text-[#9AA3B8]">Or continue with</span>
            </div>
          </div>

          {/* Google */}
          <Button
            type="button"
            variant="outline"
            className="w-full py-3 border border-white/10 hover:bg-white/5 text-white rounded-xl flex items-center justify-center gap-2 cursor-pointer font-bold"
            onClick={handleGoogleSignIn}
            disabled={loading}
          >
            <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
            </svg>
            Google Workspace
          </Button>

          {/* ── Demo accounts (DEV only) ──────────────────────────────────── */}
          {SHOW_DEMO && (
            <div className="space-y-3 bg-[#1A2332]/50 border border-[#273244]/80 rounded-2xl p-4">
              <div className="space-y-0.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 block">
                  🔐 Demo Profiles — Dev Only
                </span>
                <p className="text-[10px] text-[#6B7280] font-medium">
                  Quick-launch sandbox sessions. Each seeds its own anonymous Firestore profile.
                </p>
              </div>

              {/* Quick-launch buttons */}
              <div className="grid grid-cols-2 gap-2">
                {DEMO_ACCOUNTS.map((acc) => {
                  const profile = WORKSPACE_PROFILES.find(p => p.role === acc.role)!;
                  const Icon = profile.icon;
                  return (
                    <button
                      key={acc.role}
                      type="button"
                      disabled={loading}
                      onClick={() => handleDemoSignIn(acc.role)}
                      className={`
                        group flex items-center gap-2 p-2.5 bg-white/[0.03] border rounded-xl
                        hover:bg-white/[0.06] transition-all text-left cursor-pointer
                        disabled:opacity-50 disabled:cursor-not-allowed ${profile.borderColor}
                      `}
                    >
                      <div className={`p-1.5 rounded-lg border shrink-0 ${profile.badgeColor}`}>
                        <Icon className={`w-3 h-3 ${profile.accentColor}`} />
                      </div>
                      <div className="min-w-0">
                        <span className="block text-[11px] font-bold text-white leading-tight">{acc.label}</span>
                        <span className={`block text-[9px] font-semibold ${profile.accentColor} uppercase tracking-wide`}>
                          {acc.role}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Email reference table */}
              <div className="border-t border-white/5 pt-3 space-y-1.5">
                <span className="text-[9px] font-black uppercase tracking-wider text-[#6B7280] block">Demo Credentials</span>
                {DEMO_ACCOUNTS.map((acc) => (
                  <div key={acc.email} className="flex items-center justify-between text-[10px]">
                    <span className={`font-bold ${acc.color}`}>{acc.label}</span>
                    <div className="flex items-center gap-1">
                      <span className="font-mono text-[#9AA3B8]">{acc.email}</span>
                      <CopyButton text={acc.email} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sign up link */}
          <div className="text-center">
            <p className="text-xs text-[#9AA3B8]">
              Don't have an account?{" "}
              <Link to="/auth/signup" className="font-bold text-[#22C55E] hover:text-emerald-400 transition-colors">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignInPage;
