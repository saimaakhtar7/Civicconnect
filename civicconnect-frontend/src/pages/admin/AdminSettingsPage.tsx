import React, { useState, useEffect } from "react";
import { 
  Database, Cpu, Sliders, 
  Clock, RefreshCw, Save, ToggleLeft, ToggleRight, BarChart3
} from "lucide-react";
import { useAuthStore } from "../../stores/authStore";
import { adminService, SystemSettings } from "../../services/adminService";
import { Button } from "../../components/ui/button";
import { useNotificationStore } from "../../stores/notificationStore";
import { db } from "../../config/firebase";
import { generateMockAIReports, refreshAnalyticsAction } from "../../services/seederService";
import { populateDemoEnvironment, resetDemoEnvironment, getDemoEnvironmentStatus, DemoEnvironmentStatus } from "../../services/demoInitService";

export const AdminSettingsPage: React.FC = () => {
  const { user: currentUser } = useAuthStore();
  const { addNotification } = useNotificationStore();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [seedingStep, setSeedingStep] = useState("");
  const [status, setStatus] = useState<DemoEnvironmentStatus | null>(null);
  
  const [settings, setSettings] = useState<SystemSettings>({
    appName: "CivicConnect AI",
    maintenanceMode: false,
    enableAIClassification: true,
    enableDuplicateDetection: true,
    enableNotifications: true,
    defaultCitizenRole: "citizen"
  });

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const data = await adminService.getSystemSettings();
      setSettings(data);
    } catch (err) {
      console.error(err);
      addNotification({
        type: "error",
        title: "Load Failed",
        message: "Failed to read system settings."
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStatus = async () => {
    try {
      const data = await getDemoEnvironmentStatus();
      setStatus(data);
    } catch (err) {
      console.error("Failed to load demo environment status:", err);
    }
  };

  useEffect(() => {
    fetchSettings();
    fetchStatus();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    try {
      setSaving(true);
      await adminService.updateSystemSettings(settings, currentUser.uid, currentUser.role);
      addNotification({
        type: "success",
        title: "Settings Saved",
        message: "Global application configuration has been updated and audit logged."
      });
    } catch (err) {
      console.error(err);
      addNotification({
        type: "error",
        title: "Save Failed",
        message: "Failed to write settings to database."
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePopulateDemo = async () => {
    if (!currentUser) return;
    setSeeding(true);
    setSeedingStep("Initializing populator...");
    try {
      await populateDemoEnvironment((step) => setSeedingStep(step));
      addNotification({
        type: "success",
        title: "Demo Data Populated",
        message: "Successfully populated/updated versioned demo environment data."
      });
      await fetchStatus();
    } catch (err: any) {
      addNotification({ type: "error", title: "Seeding Error", message: err.message || "Seeding failed." });
    } finally {
      setSeeding(false);
      setSeedingStep("");
    }
  };

  const handleResetDemo = async () => {
    if (!currentUser) return;
    if (!window.confirm("This will clear ALL demo records and re-seed the environment. Real user data is preserved. Continue?")) return;
    setSeeding(true);
    setSeedingStep("Initializing reset...");
    try {
      await resetDemoEnvironment((step) => setSeedingStep(step));
      addNotification({
        type: "success",
        title: "Demo Environment Reset",
        message: "Demo environment has been cleared and re-seeded successfully."
      });
      await fetchStatus();
    } catch (err: any) {
      addNotification({ type: "error", title: "Reset Error", message: err.message || "Reset failed." });
    } finally {
      setSeeding(false);
      setSeedingStep("");
    }
  };

  const handleMockAI = async () => {
    if (!currentUser) return;
    setSeeding(true);
    try {
      const result = await generateMockAIReports(db);
      addNotification({ type: result.success ? "success" : "error", title: result.success ? "Mock AI Reports Generated" : "AI Report Failed", message: result.message });
      await fetchStatus();
    } catch (err: any) {
      addNotification({ type: "error", title: "AI Report Error", message: err.message });
    } finally {
      setSeeding(false);
    }
  };

  const handleRefreshAnalytics = async () => {
    if (!currentUser) return;
    setSeeding(true);
    try {
      const result = await refreshAnalyticsAction(db, currentUser.uid, currentUser.role);
      addNotification({ type: result.success ? "success" : "error", title: result.success ? "Analytics Refreshed" : "Refresh Failed", message: result.message });
      await fetchStatus();
    } catch (err: any) {
      addNotification({ type: "error", title: "Refresh Error", message: err.message });
    } finally {
      setSeeding(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12 text-[#9AA3B8] font-bold">
        <Clock className="w-6 h-6 mx-auto mb-2 animate-spin text-[#16A34A]" /> Querying system configurations...
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-28 text-left max-w-2xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <Database className="w-4 h-4 text-emerald-500" />
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-500">Global Variable Overrides</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">System Settings</h1>
          <p className="text-xs text-[#9AA3B8]">
            Configure global variables, toggle intelligence services pipelines, and activate system alerts.
          </p>
        </div>
        <Button onClick={fetchSettings} className="bg-white/5 border border-white/5 text-xs font-bold text-white hover:bg-white/10 shrink-0 self-start sm:self-center">
          <RefreshCw className="w-3.5 h-3.5" />
        </Button>
      </div>

      <form onSubmit={handleSaveSettings} className="bg-[#1E293B] border border-white/5 rounded-2xl p-6 shadow-lg space-y-6">
        
        {/* Core settings */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-white pb-2.5 border-b border-white/5 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-emerald-400" /> General Application Variables
          </h3>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase text-[#6B7280]">Application Brand Name</label>
            <input
              type="text"
              required
              value={settings.appName}
              onChange={(e) => setSettings({ ...settings, appName: e.target.value })}
              className="w-full bg-[#0F172A] border border-white/5 text-xs text-white p-3 rounded-xl focus:outline-none focus:border-emerald-500 font-medium"
            />
          </div>
        </div>

        {/* Toggle Switches */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-white pb-2.5 border-b border-white/5 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-emerald-400" /> Pipeline feature switches
          </h3>

          {[
            {
              title: "Maintenance Mode",
              desc: "Restricts normal citizen access to display a maintenance warning template.",
              value: settings.maintenanceMode,
              onChange: (val: boolean) => setSettings({ ...settings, maintenanceMode: val })
            },
            {
              title: "AI Auto-Classification",
              desc: "Passes reported images to Gemini AI visual model to categorize, write summaries, and routing recommendations.",
              value: settings.enableAIClassification,
              onChange: (val: boolean) => setSettings({ ...settings, enableAIClassification: val })
            },
            {
              title: "AI Duplicate Verification Filter",
              desc: "Uses geolocation geohashes and embeddings similarities to match new reports with open ones to reduce department congestion.",
              value: settings.enableDuplicateDetection,
              onChange: (val: boolean) => setSettings({ ...settings, enableDuplicateDetection: val })
            },
            {
              title: "System Notification Dispatches",
              desc: "Sends real-time email, database logs, and FCM notifications to municipal crew, officials, and citizens on state changes.",
              value: settings.enableNotifications,
              onChange: (val: boolean) => setSettings({ ...settings, enableNotifications: val })
            }
          ].map((item, idx) => (
            <div key={idx} className="flex justify-between items-start gap-4">
              <div className="space-y-0.5 max-w-[85%]">
                <span className="block text-xs font-bold text-white">{item.title}</span>
                <p className="text-[10px] text-[#9AA3B8] leading-relaxed">{item.desc}</p>
              </div>
              <button
                type="button"
                onClick={() => item.onChange(!item.value)}
                className="text-[#9AA3B8] hover:text-white transition-all cursor-pointer mt-0.5 shrink-0"
              >
                {item.value ? (
                  <ToggleRight className="w-9 h-9 text-emerald-500 fill-emerald-500/10" />
                ) : (
                  <ToggleLeft className="w-9 h-9 opacity-40 text-gray-500" />
                )}
              </button>
            </div>
          ))}
        </div>

        {/* Submit */}
        <div className="border-t border-white/5 pt-4 flex justify-end">
          <Button
            type="submit"
            disabled={saving}
            className="bg-[#16A34A] hover:bg-[#15803D] text-white font-bold text-xs py-2 px-6 rounded-xl flex items-center gap-1.5 shadow-md shadow-emerald-500/10"
          >
            {saving ? (
              <>Saving Configurations...</>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" /> Save Changes
              </>
            )}
          </Button>
        </div>
      </form>

      {/* ─── Demo Environment Console ───────────────────────────── */}
      <div className="mt-2 rounded-2xl border border-white/5 bg-white/[0.03] p-5 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Database className="w-4 h-4 text-violet-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-violet-400">Demo Environment Console</span>
        </div>
        <p className="text-[11px] text-[#9AA3B8]">
          Manage the live demo environment. Real user data, reports, and production records are always preserved during seeding and resets.
        </p>

        {/* Environment Status Section */}
        <div className="bg-[#0B132B]/50 border border-white/5 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <span className="text-[10px] font-bold text-[#9AA3B8] uppercase tracking-wider">Demo Environment Status</span>
            <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase ${status?.upToDate ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
              {status?.upToDate ? "Healthy & Synced" : "Pending Sync / Outdated"}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-[10px] text-[#6B7280] block">Seed Version</span>
              <span className="font-mono text-white font-bold">
                {status?.metaExists ? `v${status.version}` : "Not Seeded"}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-[#6B7280] block">Target Version</span>
              <span className="font-mono text-[#9AA3B8] font-bold">v{status?.currentVersion}</span>
            </div>
            <div className="col-span-2">
              <span className="text-[10px] text-[#6B7280] block">Last Seeded</span>
              <span className="text-white font-medium">
                {status?.seededAt ? new Date(status.seededAt).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' }) : "Never"}
              </span>
            </div>
          </div>

          <div className="border-t border-white/5 pt-3">
            <span className="text-[9px] font-bold text-[#6B7280] uppercase tracking-wider block mb-2">Collection Health Checks</span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-1.5 gap-x-4 text-[11px]">
              <div className="flex items-center gap-1.5 text-white">
                <span className="text-emerald-400">✔</span>
                <span>Demo Accounts: <span className="font-bold text-[#9AA3B8]">Ready</span></span>
              </div>
              <div className="flex items-center gap-1.5 text-white">
                <span className={status?.counts?.departments ? "text-emerald-400" : "text-red-400"}>
                  {status?.counts?.departments ? "✔" : "✗"}
                </span>
                <span>Departments: <span className="font-bold text-[#9AA3B8]">{status?.counts?.departments ?? 0}</span></span>
              </div>
              <div className="flex items-center gap-1.5 text-white">
                <span className={status?.counts?.categories ? "text-emerald-400" : "text-red-400"}>
                  {status?.counts?.categories ? "✔" : "✗"}
                </span>
                <span>Categories: <span className="font-bold text-[#9AA3B8]">{status?.counts?.categories ?? 0}</span></span>
              </div>
              <div className="flex items-center gap-1.5 text-white">
                <span className={status?.counts?.issues ? "text-emerald-400" : "text-red-400"}>
                  {status?.counts?.issues ? "✔" : "✗"}
                </span>
                <span>Issues: <span className="font-bold text-[#9AA3B8]">{status?.counts?.issues ?? 0}</span></span>
              </div>
              <div className="flex items-center gap-1.5 text-white">
                <span className={status?.counts?.discussions ? "text-emerald-400" : "text-red-400"}>
                  {status?.counts?.discussions ? "✔" : "✗"}
                </span>
                <span>Community: <span className="font-bold text-[#9AA3B8]">{status?.counts?.discussions ?? 0}</span></span>
              </div>
              <div className="flex items-center gap-1.5 text-white">
                <span className={status?.counts?.events ? "text-emerald-400" : "text-red-400"}>
                  {status?.counts?.events ? "✔" : "✗"}
                </span>
                <span>Events: <span className="font-bold text-[#9AA3B8]">{status?.counts?.events ?? 0}</span></span>
              </div>
              <div className="flex items-center gap-1.5 text-white col-span-2 sm:col-span-1">
                <span className={status?.aiPipeline ? "text-emerald-400" : "text-red-400"}>
                  {status?.aiPipeline ? "✔" : "✗"}
                </span>
                <span>AI Pipeline: <span className="font-bold text-[#9AA3B8]">{status?.aiPipeline ? "Verified" : "Missing"}</span></span>
              </div>
              <div className="flex items-center gap-1.5 text-white">
                <span className={status?.analytics ? "text-emerald-400" : "text-red-400"}>
                  {status?.analytics ? "✔" : "✗"}
                </span>
                <span>Analytics: <span className="font-bold text-[#9AA3B8]">{status?.analytics ? "Verified" : "Missing"}</span></span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Populate Demo Data */}
          <button
            type="button"
            onClick={handlePopulateDemo}
            disabled={seeding}
            className="flex items-start gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/15 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <Database className="w-5 h-5 text-emerald-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-bold text-white">Populate Demo Data</p>
              <p className="text-[11px] text-[#9AA3B8] mt-0.5">Adds departments, categories, 80 issues, 50 discussions, events, and notifications without overwriting existing records.</p>
            </div>
          </button>

          {/* Reset Demo Environment */}
          <button
            type="button"
            onClick={handleResetDemo}
            disabled={seeding}
            className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 hover:bg-red-500/15 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <RefreshCw className="w-5 h-5 text-red-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-bold text-white">Reset Demo Environment</p>
              <p className="text-[11px] text-[#9AA3B8] mt-0.5">Clears ONLY demo-tagged records and re-seeds fresh data. Real users and production reports are never touched.</p>
            </div>
          </button>

          {/* Generate Mock AI Reports */}
          <button
            type="button"
            onClick={handleMockAI}
            disabled={seeding}
            className="flex items-start gap-3 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/15 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <Cpu className="w-5 h-5 text-blue-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-bold text-white">Generate Mock AI Reports</p>
              <p className="text-[11px] text-[#9AA3B8] mt-0.5">Simulates Vision AI and routing pipeline results on up to 10 submitted issues, promoting them to in-progress.</p>
            </div>
          </button>

          {/* Refresh Analytics */}
          <button
            type="button"
            onClick={handleRefreshAnalytics}
            disabled={seeding}
            className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/15 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <BarChart3 className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-bold text-white">Refresh Analytics</p>
              <p className="text-[11px] text-[#9AA3B8] mt-0.5">Recalculates issue counts, resolved %, pending workloads, SLA compliance, and engagement metrics from live records.</p>
            </div>
          </button>
        </div>

        {seeding && (
          <div className="flex items-center gap-2 text-xs text-emerald-400 animate-pulse pt-1">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>Operation in progress: <span className="font-bold">{seedingStep}</span></span>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSettingsPage;
