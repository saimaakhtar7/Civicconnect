import React, { useState, useEffect } from "react";
import { 
  Database, Cpu, Sliders, 
  Clock, RefreshCw, Save, ToggleLeft, ToggleRight
} from "lucide-react";
import { useAuthStore } from "../../stores/authStore";
import { adminService, SystemSettings } from "../../services/adminService";
import { Button } from "../../components/ui/button";
import { useNotificationStore } from "../../stores/notificationStore";

export const AdminSettingsPage: React.FC = () => {
  const { user: currentUser } = useAuthStore();
  const { addNotification } = useNotificationStore();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
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

  useEffect(() => {
    fetchSettings();
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
    </div>
  );
};

export default AdminSettingsPage;
