import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { removeUndefined } from "../../utils/firestore.utils";
import { auth, db } from "../../config/firebase";
import { useAuthStore } from "../../stores/authStore";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Shield, User, Lock, Mail, Eye, EyeOff } from "lucide-react";

export const SignUpPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuthStore();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      navigate(user.role === "citizen" ? "/" : "/dashboard", { replace: true });
    }
  }, [authLoading, user, navigate]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await updateProfile(user, {
        displayName: name,
      });

      // Initialize the Firestore user document
      const userDocRef = doc(db, "users", user.uid);
      await setDoc(userDocRef, removeUndefined({
        uid: user.uid,
        email: user.email || "",
        displayName: name,
        role: "citizen", // Default is citizen, can configure further during onboarding
        department: null,
        trust: {
          score: 100,
          tier: "new",
          totalReports: 0,
          verifiedReports: 0,
          falseReportCount: 0,
          verificationContributions: 0,
          resolutionConfirmations: 0,
          badges: [],
          lastUpdated: new Date().toISOString(),
        },
        fcmTokens: [],
        notificationPreferences: {
          verificationRequests: true,
          statusUpdates: true,
          communityMilestones: true,
          weeklyDigest: false,
        },
        createdAt: new Date().toISOString(),
        lastActiveAt: new Date().toISOString(),
      }));

      // Redirect to onboarding to confirm role assignment
      navigate("/onboarding");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to create account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

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
          <h2 className="text-4xl font-black leading-tight text-white tracking-tight">
            Empower Your Neighborhood.<br />
            <span className="text-[#22C55E]">Report & Track Effortlessly.</span>
          </h2>
          <p className="text-[#9AA3B8] text-base leading-relaxed">
            Join thousands of active citizens coordinating with municipal boards. Submit report media, check AI routing status, and confirm successful resolutions.
          </p>
        </div>

        {/* Bottom: Footer note */}
        <div className="text-xs text-[#9AA3B8]">
          © {new Date().getFullYear()} CivicConnect AI Platform. Secured by Government-grade encryption.
        </div>
      </div>

      {/* Right side: Signup Form */}
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
            <h2 className="text-2xl font-black tracking-tight text-white">Create Account</h2>
            <p className="text-sm text-[#9AA3B8]">Join the CivicConnect citizen directory</p>
          </div>

          {error && (
            <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-xs font-semibold text-red-400">
              {error}
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSignUp}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name" className="text-xs font-bold text-[#9AA3B8] uppercase tracking-wider">Full Name</Label>
                <div className="relative mt-1.5">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#9AA3B8]">
                    <User className="h-4 w-4" />
                  </div>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    className="pl-10.5 py-3.5 bg-white/5 border border-white/5 text-[#F5F7FA] placeholder-[#9AA3B8]/40 focus:ring-1 focus:ring-[#22C55E] focus:border-[#22C55E] rounded-xl text-sm"
                  />
                </div>
              </div>
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
                <Label htmlFor="password" className="text-xs font-bold text-[#9AA3B8] uppercase tracking-wider">Password</Label>
                <div className="relative mt-1.5">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#9AA3B8]">
                    <Lock className="h-4 w-4" />
                  </div>
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pl-10.5 py-3.5 pr-10 bg-white/5 border border-white/5 text-[#F5F7FA] placeholder-[#9AA3B8]/40 focus:ring-1 focus:ring-[#22C55E] focus:border-[#22C55E] rounded-xl text-sm"
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

            <div>
              <Button type="submit" variant="primary" className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 rounded-xl text-white font-bold transition-all shadow-lg shadow-emerald-500/20 cursor-pointer" loading={loading}>
                Sign Up
              </Button>
            </div>
          </form>

          <div className="text-center">
            <p className="text-xs text-[#9AA3B8]">
              Already have an account?{" "}
              <Link to="/auth/signin" className="font-bold text-[#22C55E] hover:text-emerald-400 transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;
