import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword, signInWithPopup, signInAnonymously } from "firebase/auth";
import { auth, googleProvider } from "../../config/firebase";
import { useAuthStore } from "../../stores/authStore";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Shield, Lock, Mail, User, Landmark, Sparkles } from "lucide-react";

export const SignInPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, setUser } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading && user) {
      const target = user.role === "citizen" ? "/" : user.role === "official" ? "/dashboard" : "/onboarding";
      navigate(target, { replace: true });
    }
  }, [authLoading, user, navigate]);

  if (authLoading) {
    return <div />;
  }

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to sign in. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError("");
    try {
      await signInWithPopup(auth, googleProvider);
      navigate("/dashboard");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to sign in with Google.");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoSignIn = async (role: "citizen" | "official") => {
    setLoading(true);
    setError("");
    try {
      const cred = await signInAnonymously(auth);
      const uid = cred.user.uid;

      // Seed user profile directly to bypass onboarding and establish role
      const profileData = {
        uid,
        email: `demo_${role}_${uid.slice(0, 5)}@civicconnect.ai`,
        displayName: role === "citizen" ? "Demo Citizen" : "Officer Vikram (Roads Dept)",
        role,
        trust: {
          score: role === "citizen" ? 85 : 100,
          tier: role === "citizen" ? "verified" : "expert",
          totalReports: role === "citizen" ? 3 : 0,
          verifiedReports: role === "citizen" ? 2 : 0,
          falseReportCount: 0,
          verificationContributions: 12,
          resolutionConfirmations: 4,
          badges: role === "citizen" ? ["First Report", "Community Watcher"] : ["Certified Responder"],
          lastUpdated: new Date().toISOString(),
        },
        department: role === "official" ? "Roads" : null,
        officerCode: role === "official" ? "ROADS101" : null,
        fcmTokens: [],
        notificationPreferences: {
          verificationRequests: true,
          statusUpdates: true,
          communityMilestones: true,
          weeklyDigest: false,
        },
        createdAt: new Date().toISOString(),
        lastActiveAt: new Date().toISOString(),
      };

      // Optimistically set local profile to avoid delay
      setUser(profileData as any);

      // Navigation - `useAuth` will create/sync the profile in background.
      navigate(role === "citizen" ? "/" : "/dashboard");
    } catch (err: any) {
      console.error("Demo login failed:", err);
      setError(err.message || "Failed to launch demo sandbox.");
    } finally {
      setLoading(false);
    }
  };

  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="flex min-h-screen w-full bg-[#081220] text-[#F5F7FA] font-sans antialiased overflow-hidden relative">
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 grid-pattern pointer-events-none opacity-40 z-0" />

      {/* Decorative Blur Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] aspect-square rounded-full bg-emerald-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[10%] right-[-10%] w-[45%] aspect-square rounded-full bg-purple-500/5 blur-[120px] pointer-events-none" />

      {/* Left side: Premium governance visualization (Desktop only) */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-16 overflow-hidden border-r border-white/5 z-10 bg-[#0F172A]/40 backdrop-blur-sm">
        {/* Background Image Overlay */}
        <div className="absolute inset-0 z-[-1] overflow-hidden">
          <img
            src="/smart_city_hero.png"
            alt="Smart City Governance"
            className="w-full h-full object-cover opacity-15"
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-[#081220] via-[#081220]/80 to-[#081220]/20" />
        </div>

        {/* Top: Branding */}
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

        {/* Center: Mission statement */}
        <div className="space-y-6 max-w-lg">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <Sparkles className="w-3.5 h-3.5 text-[#22C55E]" />
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              Enterprise AI Operations
            </span>
          </div>
          <h2 className="text-4xl font-black leading-tight text-white tracking-tight">
            Smarter Governance.<br />
            <span className="text-[#22C55E]">Stronger Communities.</span>
          </h2>
          <p className="text-[#9AA3B8] text-base leading-relaxed">
            Manage municipal workloads, route emergency alerts, and confirm hardware and maintenance repairs automatically using multi-agent operations.
          </p>
        </div>

        {/* Bottom: Footer note */}
        <div className="text-xs text-[#9AA3B8]">
          © {new Date().getFullYear()} CivicConnect AI Platform. Secured by Government-grade encryption.
        </div>
      </div>

      {/* Right side: Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 z-10 relative">
        <div className="w-full max-w-md space-y-8 glass-card p-8 rounded-[20px] shadow-2xl relative border border-white/5 bg-[#0F172A]/75 backdrop-blur-md">
          {/* Logo on mobile only */}
          <div className="text-center lg:hidden space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-[#22C55E]">
              <Shield className="h-7 w-7" />
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-tight text-white">CivicConnect AI</h2>
              <p className="text-xs text-[#9AA3B8] uppercase tracking-wider font-semibold mt-1">AI-Powered Governance Platform</p>
            </div>
          </div>

          <div className="hidden lg:block text-left space-y-1">
            <h2 className="text-2xl font-black tracking-tight text-white">Welcome Back</h2>
            <p className="text-sm text-[#9AA3B8]">Access the CivicConnect operations suite</p>
          </div>

          {error && (
            <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-xs font-semibold text-red-400">
              {error}
            </div>
          )}

          {/* Quick Demo Sandbox Access */}
          <div className="bg-gradient-to-r from-[#1E293B] to-[#0F172A] border border-white/5 rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs font-black text-white uppercase tracking-wider">One-Click Demo Sandbox</h3>
            </div>
            <p className="text-[11px] text-[#9AA3B8] leading-relaxed">
              Instantly experience the governance suite. Select a role below to launch the sandbox.
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => handleDemoSignIn("citizen")}
                disabled={loading}
                className="flex flex-col items-center justify-center p-3 bg-white/5 border border-white/5 hover:border-emerald-500/30 hover:bg-white/10 rounded-xl transition-all text-center group cursor-pointer"
              >
                <User className="w-4 h-4 text-emerald-400 mb-1 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold text-white">Demo Citizen</span>
                <span className="text-[9px] text-[#9AA3B8] mt-0.5">Report & Vote</span>
              </button>
              <button
                type="button"
                onClick={() => handleDemoSignIn("official")}
                disabled={loading}
                className="flex flex-col items-center justify-center p-3 bg-white/5 border border-white/5 hover:border-emerald-500/30 hover:bg-white/10 rounded-xl transition-all text-center group cursor-pointer"
              >
                <Landmark className="w-4 h-4 text-emerald-400 mb-1 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold text-white">Demo Officer</span>
                <span className="text-[9px] text-[#9AA3B8] mt-0.5">Manage Queue</span>
              </button>
            </div>
          </div>

          <form className="space-y-5" onSubmit={handleEmailSignIn}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="email" className="text-xs font-bold text-[#9AA3B8] uppercase tracking-wider">Email Address</Label>
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
                    className="pl-10.5 py-3.5 bg-white/5 border border-white/5 text-[#F5F7FA] placeholder-[#9AA3B8]/40 focus:ring-1 focus:ring-[#22C55E] focus:border-[#22C55E] rounded-xl text-sm"
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center">
                  <Label htmlFor="password" className="text-xs font-bold text-[#9AA3B8] uppercase tracking-wider">Password</Label>
                </div>
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
                    className="pl-10.5 py-3.5 pr-10 bg-white/5 border border-white/5 text-[#F5F7FA] placeholder-[#9AA3B8]/40 focus:ring-1 focus:ring-[#22C55E] focus:border-[#22C55E] rounded-xl text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-[#9AA3B8] hover:text-white cursor-pointer"
                  >
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div>
              <Button type="submit" variant="primary" className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 rounded-xl text-white font-bold transition-all shadow-lg shadow-emerald-500/20 cursor-pointer" loading={loading}>
                Sign In with Email
              </Button>
            </div>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/5" />
            </div>
            <div className="relative flex justify-center text-xs uppercase tracking-wider font-semibold">
              <span className="bg-[#0F172A] px-3.5 text-[#9AA3B8]">Or continue with</span>
            </div>
          </div>

          <div>
            <Button
              type="button"
              variant="outline"
              className="w-full py-3 border border-white/10 hover:bg-white/5 text-white rounded-xl flex items-center justify-center gap-2 cursor-pointer font-bold"
              onClick={handleGoogleSignIn}
              disabled={loading}
            >
              <svg className="h-4 w-4 text-red-500 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
              </svg>
              Google Workspace
            </Button>
          </div>

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
