import React, { useState, useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { auth } from "../config/firebase";
import { signInAnonymously } from "firebase/auth";
import { useAuthStore } from "../stores/authStore";
import {
  Shield, Play, Users, CheckCircle2, ArrowRight,
  Map, Cpu, Zap, Building, Activity, Landmark, ShieldAlert, BarChart3, ChevronRight, Menu, X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import BeforeAfterSlider from "../components/ui/BeforeAfterSlider";
import { PageLoader } from "../components/ui/PageLoader";

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user: currentUser, role: currentRole, loading, setUser } = useAuthStore();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [guestLoading, setGuestLoading] = useState(false);
  const [guestError, setGuestError] = useState<string | null>(null);

  // Monitor scroll to update navbar styling
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (loading) {
    return <PageLoader />;
  }

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
        uid,
        email: "",
        displayName: "Guest Citizen",
        photoURL: null,
        role: "citizen",
        department: null,
        trust: {
          score: 50,
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
      };
      // Optimistically set local profile to avoid loader and delay.
      setUser(profileData as any);

      // Navigate immediately; `useAuth` will create/sync the profile in background.
      navigate("/", { replace: true });
    } catch (err: any) {
      console.error("Guest sign-in failed:", err);
      setGuestError(err.message || "Unable to start guest session.");
    } finally {
      setGuestLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#081220] text-[#F5F7FA] font-sans antialiased overflow-x-hidden relative selection:bg-emerald-500 selection:text-white">
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 grid-pattern pointer-events-none opacity-40 z-0" />

      {/* Decorative Blur Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] aspect-square rounded-full bg-emerald-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute top-[20%] right-[-10%] w-[40%] aspect-square rounded-full bg-blue-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[10%] left-[5%] w-[45%] aspect-square rounded-full bg-purple-500/10 blur-[120px] pointer-events-none" />

      {/* ── Navbar ─────────────────────────────────────────────────── */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? "bg-[#0F172A]/85 backdrop-blur-md border-b border-white/5 py-4 shadow-xl"
            : "bg-transparent py-6"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          {/* Logo & Tagline */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigate("/")}>
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

          {/* Center Navigation Links */}
          <nav className="hidden md:flex items-center space-x-8 text-sm font-semibold text-[#9AA3B8]">
            <a href="#home" className="text-white hover:text-[#22C55E] transition-colors">Home</a>
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
              className="md:hidden bg-[#0F172A] border-b border-white/5 overflow-hidden"
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
                    className="w-full py-2.5 text-center font-bold bg-[#22C55E] text-white rounded-xl"
                  >
                    Get Started
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ── Hero Section ───────────────────────────────────────────── */}
      <section id="home" className="relative min-h-screen pt-32 pb-24 flex items-center z-10">
        {/* Hero Image & Overlay */}
        <div className="absolute inset-0 z-[-1] overflow-hidden">
          <img
            src="/smart_city_hero.png"
            alt="Smart City Hero"
            className="w-full h-full object-cover opacity-25"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#081220]/80 via-[#081220]/95 to-[#081220]" />
        </div>

        <div className="max-w-7xl mx-auto px-6 w-full grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
          {/* Hero Left Content */}
          <div className="lg:col-span-7 space-y-8 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <Zap className="w-3.5 h-3.5 text-[#22C55E]" />
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                AI-Powered Civic Intelligence
              </span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-[1.1] max-w-2xl">
              Smarter Governance.<br />
              <span className="text-[#22C55E] bg-gradient-to-r from-emerald-400 to-[#22C55E] bg-clip-text text-transparent">
                Stronger Communities.
              </span>
            </h1>

            <p className="text-[#9AA3B8] text-lg sm:text-xl font-normal leading-relaxed max-w-xl">
              CivicConnect uses advanced AI and real-time analytical telemetry to help municipal governments route reports, automatically analyze hazards, and build trusted public partnerships.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={handleContinueAsGuest}
                disabled={guestLoading}
                className="flex items-center justify-center gap-2 px-8 py-4 font-bold text-white bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 rounded-xl shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all active:scale-[0.98]"
              >
                {guestLoading ? "Starting Guest Session..." : "Continue as Guest"}
                <ArrowRight className="w-5 h-5" />
              </button>
              <a
                href="#how-it-works"
                className="flex items-center justify-center gap-2 px-8 py-4 font-bold text-[#F5F7FA] border border-white/10 rounded-xl hover:bg-white/5 transition-all"
              >
                <Play className="w-4 h-4 text-emerald-400" />
                Watch Demo
              </a>
            </div>
            {guestError && (
              <div className="mt-4 rounded-2xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-200">
                {guestError}
              </div>
            )}

            {/* Trusted By Badges */}
            <div className="pt-8 border-t border-white/5 space-y-4">
              <span className="text-xs font-bold uppercase tracking-widest text-[#9AA3B8]">
                Trusted by Municipalities and Communities
              </span>
              <div className="flex flex-wrap gap-8 items-center opacity-40">
                <div className="flex items-center gap-2">
                  <Landmark className="w-5 h-5" />
                  <span className="text-sm font-bold tracking-wider">Municipal Corps</span>
                </div>
                <div className="flex items-center gap-2">
                  <Building className="w-5 h-5" />
                  <span className="text-sm font-bold tracking-wider">Smart Cities Mission</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5" />
                  <span className="text-sm font-bold tracking-wider">District Admin</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  <span className="text-sm font-bold tracking-wider">Urban Boards</span>
                </div>
              </div>
            </div>
          </div>

          {/* Hero Right: Floating Analytics Cards */}
          <div className="lg:col-span-5 relative h-[450px] w-full hidden lg:block">
            {/* Background glowing circle */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-emerald-500/5 blur-[80px]" />

            {/* Card 1: Active Citizens */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-4 left-4 w-72 glass-card p-5 rounded-2xl flex items-center gap-4 hover:border-white/10 transition-colors"
            >
              <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                <Users className="w-6 h-6 text-[#22C55E]" />
              </div>
              <div>
                <span className="text-xs font-bold text-[#9AA3B8] block uppercase tracking-wider">Active Citizens</span>
                <span className="text-2xl font-black text-white block mt-0.5">25,230+</span>
                <span className="text-[10px] text-emerald-400 font-semibold block mt-0.5">Engaged across platform</span>
              </div>
            </motion.div>

            {/* Card 2: Issues Reported */}
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="absolute top-[160px] right-4 w-72 glass-card p-5 rounded-2xl flex items-center gap-4 hover:border-white/10 transition-colors"
            >
              <div className="h-12 w-12 rounded-xl bg-[#3B82F6]/10 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-6 h-6 text-[#3B82F6]" />
              </div>
              <div>
                <span className="text-xs font-bold text-[#9AA3B8] block uppercase tracking-wider">Issues Reported</span>
                <span className="text-2xl font-black text-white block mt-0.5">12,842+</span>
                <span className="text-[10px] text-[#3B82F6] font-semibold block mt-0.5">Resolved with civic action</span>
              </div>
            </motion.div>

            {/* Card 3: Resolution Rate */}
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 2 }}
              className="absolute bottom-4 left-12 w-72 glass-card p-5 rounded-2xl flex items-center gap-4 hover:border-white/10 transition-colors"
            >
              <div className="h-12 w-12 rounded-xl bg-purple-500/10 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <span className="text-xs font-bold text-[#9AA3B8] block uppercase tracking-wider">Resolution Rate</span>
                <span className="text-2xl font-black text-white block mt-0.5">87%</span>
                <span className="text-[10px] text-purple-400 font-semibold block mt-0.5">Issues resolved efficiently</span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Stats Strip ────────────────────────────────────────────── */}
      <section className="relative py-16 border-y border-white/5 bg-[#0F172A]/40 backdrop-blur-sm z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4">
            <div className="text-center space-y-2">
              <div className="text-3xl sm:text-5xl font-black text-white">12,842+</div>
              <div className="text-xs sm:text-sm font-bold text-[#9AA3B8] uppercase tracking-widest">Issues Reported</div>
            </div>
            <div className="text-center space-y-2">
              <div className="text-3xl sm:text-5xl font-black text-white">11,231+</div>
              <div className="text-xs sm:text-sm font-bold text-[#9AA3B8] uppercase tracking-widest">Issues Resolved</div>
            </div>
            <div className="text-center space-y-2">
              <div className="text-3xl sm:text-5xl font-black text-white">25,230+</div>
              <div className="text-xs sm:text-sm font-bold text-[#9AA3B8] uppercase tracking-widest">Active Citizens</div>
            </div>
            <div className="text-center space-y-2">
              <div className="text-3xl sm:text-5xl font-black text-[#22C55E]">87%</div>
              <div className="text-xs sm:text-sm font-bold text-[#9AA3B8] uppercase tracking-widest">Resolution Rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Platform Features ──────────────────────────────────────── */}
      <section id="features" className="relative py-28 z-10">
        <div className="max-w-7xl mx-auto px-6 text-center space-y-16">
          <div className="space-y-4 max-w-2xl mx-auto">
            <span className="text-xs font-black text-[#22C55E] uppercase tracking-widest">Platform Features</span>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
              Everything you need for better governance
            </h2>
            <p className="text-[#9AA3B8] text-base leading-relaxed">
              Powerful artificial intelligence workflows and real-time interactive mapping built to streamline municipal coordination and operations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {/* Feature 1 */}
            <div className="bg-[#1E293B] border border-white/5 rounded-2xl p-6 text-left space-y-6 hover:border-[#22C55E]/30 transition-all group hover:scale-[1.02]">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center group-hover:bg-[#22C55E] group-hover:text-white transition-all text-[#22C55E]">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div className="space-y-2">
                <h3 className="text-base font-bold text-white">Smart Issue Reporting</h3>
                <p className="text-xs text-[#9AA3B8] leading-relaxed">
                  Citizens can report public issues with media uploads, automatic location detection, and AI tags.
                </p>
              </div>
              <div className="flex items-center gap-1 text-xs font-bold text-[#22C55E]">
                <span>Learn more</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Feature 2 */}
            <div className="bg-[#1E293B] border border-white/5 rounded-2xl p-6 text-left space-y-6 hover:border-[#22C55E]/30 transition-all group hover:scale-[1.02]">
              <div className="h-10 w-10 rounded-xl bg-indigo-500/10 flex items-center justify-center group-hover:bg-indigo-500 group-hover:text-white transition-all text-indigo-400">
                <Cpu className="w-5 h-5" />
              </div>
              <div className="space-y-2">
                <h3 className="text-base font-bold text-white">AI Analysis</h3>
                <p className="text-xs text-[#9AA3B8] leading-relaxed">
                  Intelligent agents verify issues, categorize severity levels, and draft responses automatically.
                </p>
              </div>
              <div className="flex items-center gap-1 text-xs font-bold text-[#22C55E]">
                <span>Learn more</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Feature 3 */}
            <div className="bg-[#1E293B] border border-white/5 rounded-2xl p-6 text-left space-y-6 hover:border-[#22C55E]/30 transition-all group hover:scale-[1.02]">
              <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500 group-hover:text-white transition-all text-blue-400">
                <Map className="w-5 h-5" />
              </div>
              <div className="space-y-2">
                <h3 className="text-base font-bold text-white">Smart Maps</h3>
                <p className="text-xs text-[#9AA3B8] leading-relaxed">
                  Geospatial mapping and clustering show hotspots, assignment logs, and current repairs.
                </p>
              </div>
              <div className="flex items-center gap-1 text-xs font-bold text-[#22C55E]">
                <span>Learn more</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Feature 4 */}
            <div className="bg-[#1E293B] border border-white/5 rounded-2xl p-6 text-left space-y-6 hover:border-[#22C55E]/30 transition-all group hover:scale-[1.02]">
              <div className="h-10 w-10 rounded-xl bg-purple-500/10 flex items-center justify-center group-hover:bg-purple-500 group-hover:text-white transition-all text-purple-400">
                <Users className="w-5 h-5" />
              </div>
              <div className="space-y-2">
                <h3 className="text-base font-bold text-white">Community Engagement</h3>
                <p className="text-xs text-[#9AA3B8] leading-relaxed">
                  Allows citizens to vote on critical reports and track live development updates on a feed.
                </p>
              </div>
              <div className="flex items-center gap-1 text-xs font-bold text-[#22C55E]">
                <span>Learn more</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Feature 5 */}
            <div className="bg-[#1E293B] border border-white/5 rounded-2xl p-6 text-left space-y-6 hover:border-[#22C55E]/30 transition-all group hover:scale-[1.02]">
              <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center group-hover:bg-amber-500 group-hover:text-white transition-all text-amber-400">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div className="space-y-2">
                <h3 className="text-base font-bold text-white">Analytics & Reports</h3>
                <p className="text-xs text-[#9AA3B8] leading-relaxed">
                  Real-time status updates and department workloads compiled into executive briefings.
                </p>
              </div>
              <div className="flex items-center gap-1 text-xs font-bold text-[#22C55E]">
                <span>Learn more</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Why CivicMind (Before vs After Slider) ───────────────── */}
      <section id="platform" className="relative py-24 bg-[#0F172A]/30 border-y border-white/5 z-10">
        <div className="max-w-7xl mx-auto px-6 space-y-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
            {/* Why CivicMind Text */}
            <div className="lg:col-span-5 space-y-6 text-left">
              <span className="text-xs font-black text-[#22C55E] uppercase tracking-widest">Why CivicConnect</span>
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                Transform physical cities with digital coordination
              </h2>
              <p className="text-[#9AA3B8] leading-relaxed">
                Empower departments to execute swift fixes. View current road repairs, electrical restoration, waste cleanup, and water supply resolutions. Check before-and-after states directly below.
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4 text-[#22C55E]" />
                  </div>
                  <div>
                    <span className="font-bold text-white block text-sm">Automated Routing</span>
                    <span className="text-xs text-[#9AA3B8]">AI instantly routes civic reports directly to assigned departments.</span>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4 text-[#22C55E]" />
                  </div>
                  <div>
                    <span className="font-bold text-white block text-sm">Telemetric Hotspots</span>
                    <span className="text-xs text-[#9AA3B8]">Analyze issue heatmaps to proactively plan municipal infrastructure investments.</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Slider Comparison Box */}
            <div className="lg:col-span-7 bg-[#1E293B] border border-white/5 rounded-3xl p-4 shadow-2xl">
              <div className="mb-4 flex items-center justify-between px-2">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[#22C55E] animate-pulse" />
                  <span className="text-xs font-bold text-white">Live Repair Visualizer</span>
                </div>
                <span className="text-[10px] font-bold uppercase text-[#9AA3B8]">Slide to compare</span>
              </div>
              <BeforeAfterSlider
                beforeImage="/damaged_road.png"
                afterImage="/repaired_road.png"
                beforeLabel="Citizen Pothole Report"
                afterLabel="Roads Dept Action Taken"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── How It Works (Timeline) ────────────────────────────────── */}
      <section id="how-it-works" className="relative py-28 z-10">
        <div className="max-w-7xl mx-auto px-6 text-center space-y-20">
          <div className="space-y-4 max-w-2xl mx-auto">
            <span className="text-xs font-black text-[#22C55E] uppercase tracking-widest">Operations Flow</span>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Modern digital infrastructure workflow
            </h2>
            <p className="text-[#9AA3B8]">
              Witness the telemetry path of a submitted report from citizen upload to officer resolution.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-8 relative">
            {/* Step 1 */}
            <div className="relative group space-y-4 text-center md:text-left">
              <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 text-[#22C55E] flex items-center justify-center mx-auto md:mx-0 shadow-lg group-hover:scale-105 transition-transform font-black">
                1
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white">Citizen Report</h3>
                <p className="text-xs text-[#9AA3B8] leading-relaxed">
                  Citizen reports hazard or issue via mobile. AI automatically tags details and location.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative group space-y-4 text-center md:text-left">
              <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto md:mx-0 shadow-lg group-hover:scale-105 transition-transform font-black">
                2
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white">AI Analysis</h3>
                <p className="text-xs text-[#9AA3B8] leading-relaxed">
                  6-agent AI council deliberates, determines duplicate check, routing, and priority metrics.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative group space-y-4 text-center md:text-left">
              <div className="h-12 w-12 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center mx-auto md:mx-0 shadow-lg group-hover:scale-105 transition-transform font-black">
                3
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white">Department Assigned</h3>
                <p className="text-xs text-[#9AA3B8] leading-relaxed">
                  Assigned department accepts the ticket, scheduling municipal repair crews.
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="relative group space-y-4 text-center md:text-left">
              <div className="h-12 w-12 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center mx-auto md:mx-0 shadow-lg group-hover:scale-105 transition-transform font-black">
                4
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white">Officer Resolves</h3>
                <p className="text-xs text-[#9AA3B8] leading-relaxed">
                  Crew completes maintenance repairs and uploads resolved photo proof.
                </p>
              </div>
            </div>

            {/* Step 5 */}
            <div className="relative group space-y-4 text-center md:text-left">
              <div className="h-12 w-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto md:mx-0 shadow-lg group-hover:scale-105 transition-transform font-black">
                5
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white">Citizen Notified</h3>
                <p className="text-xs text-[#9AA3B8] leading-relaxed">
                  Citizen verifies the fix. Public trust score and metrics update dynamically.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── AI Showcase / Dashboard Mock ────────────────────────────── */}
      <section className="relative py-24 bg-[#0F172A]/40 border-t border-white/5 z-10">
        <div className="max-w-7xl mx-auto px-6 space-y-16">
          <div className="space-y-4 text-center max-w-2xl mx-auto">
            <span className="text-xs font-black text-[#22C55E] uppercase tracking-widest">Analytics Command</span>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Live Governance Dashboard
            </h2>
            <p className="text-[#9AA3B8]">
              Witness a live interactive snapshot of municipal activity telemetry.
            </p>
          </div>

          <div className="bg-[#1E293B] border border-white/5 rounded-3xl p-6 shadow-2xl space-y-8 max-w-5xl mx-auto">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#22C55E] animate-pulse" />
                <span className="text-xs font-bold text-white">Pune Smart City Operations Control</span>
              </div>
              <div className="flex gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span className="text-[10px] font-bold text-[#9AA3B8] uppercase">Telemetry Active</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Box 1 */}
              <div className="glass-card p-5 rounded-2xl space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-[#9AA3B8] uppercase tracking-wider">AI Priority Dispatch</span>
                  <Cpu className="w-4 h-4 text-purple-400" />
                </div>
                <div className="space-y-2">
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                    <span className="text-[9px] font-bold uppercase tracking-wide text-red-400 block">Critical · Roads</span>
                    <span className="text-xs font-bold text-white block mt-0.5">Water main leak on Baner Road</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                    <span className="text-[9px] font-bold uppercase tracking-wide text-[#22C55E] block">Assigned · Power</span>
                    <span className="text-xs font-bold text-white block mt-0.5">Street light blackout near school</span>
                  </div>
                </div>
              </div>

              {/* Box 2 */}
              <div className="glass-card p-5 rounded-2xl space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-[#9AA3B8] uppercase tracking-wider">Department SLA Stats</span>
                  <Building className="w-4 h-4 text-[#22C55E]" />
                </div>
                <div className="space-y-3 pt-2">
                  <div>
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-[#9AA3B8]">Water Supply</span>
                      <span className="text-[#22C55E]">94% SLA</span>
                    </div>
                    <div className="w-full bg-white/5 h-1.5 rounded-full mt-1.5 overflow-hidden">
                      <div className="bg-[#22C55E] h-1.5 rounded-full" style={{ width: "94%" }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-[#9AA3B8]">Roads & Traffic</span>
                      <span className="text-amber-400">81% SLA</span>
                    </div>
                    <div className="w-full bg-white/5 h-1.5 rounded-full mt-1.5 overflow-hidden">
                      <div className="bg-amber-400 h-1.5 rounded-full" style={{ width: "81%" }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Box 3 */}
              <div className="glass-card p-5 rounded-2xl space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-[#9AA3B8] uppercase tracking-wider">AI Prediction Score</span>
                  <BarChart3 className="w-4 h-4 text-[#3B82F6]" />
                </div>
                <div className="text-center py-4">
                  <span className="text-4xl font-black text-white block">98.4%</span>
                  <span className="text-xs text-[#9AA3B8] block mt-1">Accuracy in routing telemetry</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Testimonials ───────────────────────────────────────────── */}
      <section className="relative py-28 z-10">
        <div className="max-w-7xl mx-auto px-6 text-center space-y-16">
          <div className="space-y-4 max-w-2xl mx-auto">
            <span className="text-xs font-black text-[#22C55E] uppercase tracking-widest">Endorsements</span>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Endorsed by civic leaders & administrators
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Testimonial 1 */}
            <div className="bg-[#1E293B] border border-white/5 rounded-2xl p-8 text-left space-y-6">
              <div className="flex gap-1 text-[#22C55E]">
                <Zap className="w-4 h-4 fill-current" />
                <Zap className="w-4 h-4 fill-current" />
                <Zap className="w-4 h-4 fill-current" />
                <Zap className="w-4 h-4 fill-current" />
                <Zap className="w-4 h-4 fill-current" />
              </div>
              <p className="text-sm text-[#9AA3B8] leading-relaxed italic">
              "Implementing CivicConnect AI inside our municipal corporation transformed our response times from 5 business days to less than 24 hours. The automated routing eliminates human assigning errors completely."
              </p>
              <div>
                <span className="block font-bold text-white text-sm">Shri R. K. Joshi</span>
                <span className="block text-xs text-[#22C55E] font-semibold mt-0.5">Municipal Commissioner, Ward 4 Control</span>
              </div>
            </div>

            {/* Testimonial 2 */}
            <div className="bg-[#1E293B] border border-white/5 rounded-2xl p-8 text-left space-y-6">
              <div className="flex gap-1 text-[#22C55E]">
                <Zap className="w-4 h-4 fill-current" />
                <Zap className="w-4 h-4 fill-current" />
                <Zap className="w-4 h-4 fill-current" />
                <Zap className="w-4 h-4 fill-current" />
                <Zap className="w-4 h-4 fill-current" />
              </div>
              <p className="text-sm text-[#9AA3B8] leading-relaxed italic">
                "The live twin maps allow our smart city command center to view critical water and electrical outage hotspots immediately. CivicConnect represents the future of real-time municipal telemetry."
              </p>
              <div>
                <span className="block font-bold text-white text-sm">Dr. Amit Verma</span>
                <span className="block text-xs text-[#22C55E] font-semibold mt-0.5">Operations Director, Smart City Mission</span>
              </div>
            </div>

            {/* Testimonial 3 */}
            <div className="bg-[#1E293B] border border-white/5 rounded-2xl p-8 text-left space-y-6">
              <div className="flex gap-1 text-[#22C55E]">
                <Zap className="w-4 h-4 fill-current" />
                <Zap className="w-4 h-4 fill-current" />
                <Zap className="w-4 h-4 fill-current" />
                <Zap className="w-4 h-4 fill-current" />
                <Zap className="w-4 h-4 fill-current" />
              </div>
              <p className="text-sm text-[#9AA3B8] leading-relaxed italic">
                "As a citizen reporter, I love the transparency. I get an automatic AI response within 2 minutes of reporting, and I can track the pipeline status in real-time as the assigned crews start repairs."
              </p>
              <div>
                <span className="block font-bold text-white text-sm">Meera Deshmukh</span>
                <span className="block text-xs text-[#22C55E] font-semibold mt-0.5">Pune Citizen Partner</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────── */}
      <footer id="about" className="relative border-t border-white/5 py-16 bg-[#081220] z-10">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12 text-left">
          {/* Col 1 */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#22C55E] text-white">
                <Shield className="h-4.5 w-4.5" />
              </div>
              <span className="text-lg font-black tracking-tight text-white">
                CivicConnect <span className="text-[#22C55E]">AI</span>
              </span>
            </div>
            <p className="text-xs text-[#9AA3B8] leading-relaxed">
              CivicConnect is an enterprise-grade AI Governance Platform. We empower municipal corporations, local districts, and citizens to collaborate on public improvements.
            </p>
          </div>

          {/* Col 2 */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-widest text-[#22C55E]">Platform Links</h4>
            <ul className="space-y-2 text-xs text-[#9AA3B8]">
              <li><a href="#home" className="hover:text-white transition-colors">Home Landing</a></li>
              <li><a href="#features" className="hover:text-white transition-colors">Features List</a></li>
              <li><a href="#platform" className="hover:text-white transition-colors">SLA & Repairs</a></li>
              <li><a href="#how-it-works" className="hover:text-white transition-colors">Operations Flow</a></li>
            </ul>
          </div>

          {/* Col 3 */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-widest text-[#22C55E]">Resources</h4>
            <ul className="space-y-2 text-xs text-[#9AA3B8]">
              <li><span className="hover:text-white transition-colors cursor-pointer">Admin Briefings</span></li>
              <li><span className="hover:text-white transition-colors cursor-pointer">Digital Twin Map</span></li>
              <li><span className="hover:text-white transition-colors cursor-pointer">Privacy Policy</span></li>
              <li><span className="hover:text-white transition-colors cursor-pointer">Terms of Service</span></li>
            </ul>
          </div>

          {/* Col 4 */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-widest text-[#22C55E]">Support</h4>
            <ul className="space-y-2 text-xs text-[#9AA3B8]">
              <li><span className="hover:text-white transition-colors cursor-pointer">Official Portal</span></li>
              <li><span className="hover:text-white transition-colors cursor-pointer">Citizen Help Center</span></li>
              <li><span className="hover:text-white transition-colors cursor-pointer">Integrations</span></li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 pt-12 mt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 text-xs text-[#9AA3B8]">
          <span>
            © {new Date().getFullYear()} CivicConnect AI Platform. All rights reserved.
          </span>
          <span className="text-center md:text-right">
            Disclaimer: Government-grade platform operations are optimized for licensed municipal boards.
          </span>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
