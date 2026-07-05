import React, { useState, useEffect } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../config/firebase";
import { useAuthStore } from "../../stores/authStore";
import { getTranslation } from "../../utils/translation";
import { 
  Settings, User, Bell, Moon, 
  Clock, Shield, Key, Sliders, CheckCircle2, RotateCcw, Eye, EyeOff
} from "lucide-react";

export const SettingsPage: React.FC = () => {
  const { user, setUser } = useAuthStore();

  // 1. Config State variables
  const [profileName, setProfileName] = useState(user?.displayName || "Officer Vikram");
  const [department, setDepartment] = useState(user?.department || "Roads & Infrastructure");
  const [password, setPassword] = useState("••••••••");
  const [showPassword, setShowPassword] = useState(false);
  
  const [notifySla, setNotifySla] = useState(true);
  const [notifyUrgent, setNotifyUrgent] = useState(true);
  
  const [themeMode, setThemeMode] = useState("dark");
  const [language, setLanguage] = useState("en-IN");
  const [timezone, setTimezone] = useState("IST (UTC+5:30)");
  const [accessibility, setAccessibility] = useState("default");
  
  const [demoApiKey, setDemoApiKey] = useState("cc_live_pune_9a382e1c9d8e41");
  const [showToast, setShowToast] = useState(false);

  // 2. Load configurations from localStorage on mount
  useEffect(() => {
    const savedName = localStorage.getItem("settings_profileName") || user?.displayName;
    const savedDept = localStorage.getItem("settings_department") || user?.department;
    const savedNotifySla = localStorage.getItem("settings_notifySla");
    const savedNotifyUrgent = localStorage.getItem("settings_notifyUrgent");
    const savedTheme = localStorage.getItem("settings_themeMode");
    const savedLang = localStorage.getItem("settings_language");
    
    if (savedName) setProfileName(savedName);
    if (savedDept) setDepartment(savedDept);
    if (savedNotifySla) setNotifySla(savedNotifySla === "true");
    if (savedNotifyUrgent) setNotifyUrgent(savedNotifyUrgent === "true");
    if (savedTheme) setThemeMode(savedTheme);
    if (savedLang) setLanguage(savedLang);
  }, [user]);

  // 3. Save to localStorage and update database/store
  const handleSave = async () => {
    localStorage.setItem("settings_profileName", profileName);
    localStorage.setItem("settings_department", department);
    localStorage.setItem("settings_notifySla", notifySla ? "true" : "false");
    localStorage.setItem("settings_notifyUrgent", notifyUrgent ? "true" : "false");
    localStorage.setItem("settings_themeMode", themeMode);
    localStorage.setItem("settings_language", language);

    // Apply theme changes globally
    document.documentElement.setAttribute("data-theme", themeMode);

    // Update Firebase profile and user store if user is logged in
    if (user) {
      const updatedUser = {
        ...user,
        displayName: profileName,
        department: department
      };
      setUser(updatedUser);
      
      try {
        const userDocRef = doc(db, "users", user.uid);
        await updateDoc(userDocRef, {
          displayName: profileName,
          department: department
        });
      } catch (err) {
        console.error("Firestore user profile update failed:", err);
      }
    }

    // Trigger window events to notify other components (e.g. sidebar, header)
    window.dispatchEvent(new Event("settings-updated"));

    setShowToast(true);
    setTimeout(() => setShowToast(false), 3500);
  };

  // 4. Reset options
  const handleReset = async () => {
    const defaultName = "Officer Vikram";
    const defaultDept = "Roads & Infrastructure";
    
    setProfileName(defaultName);
    setDepartment(defaultDept);
    setPassword("••••••••");
    setNotifySla(true);
    setNotifyUrgent(true);
    setThemeMode("dark");
    setLanguage("en-IN");
    setTimezone("IST (UTC+5:30)");
    setAccessibility("default");
    setDemoApiKey("cc_live_pune_9a382e1c9d8e41");

    localStorage.clear();
    
    document.documentElement.setAttribute("data-theme", "dark");
    
    if (user) {
      const updatedUser = {
        ...user,
        displayName: defaultName,
        department: defaultDept
      };
      setUser(updatedUser);
      try {
        const userDocRef = doc(db, "users", user.uid);
        await updateDoc(userDocRef, {
          displayName: defaultName,
          department: defaultDept
        });
      } catch (err) {
        console.error("Firestore user profile reset failed:", err);
      }
    }
    
    window.dispatchEvent(new Event("settings-updated"));
  };

  const sectionHeaderClass = "flex items-center gap-2 border-b border-[#273244]/55 pb-2 text-[#F3F4F6] text-xs font-bold uppercase tracking-wider";
  const inputClass = "w-full bg-[#1A2332] border border-[#273244] rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-[#16A34A]/50 transition-colors";

  return (
    <div className="space-y-6 pb-12 select-none text-left max-w-4xl mx-auto">
      
      {/* Page Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Settings className="w-4 h-4 text-[#16A34A]" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#16A34A]">{getTranslation("Operations Console", language)}</span>
        </div>
        <h1 className="text-3xl font-bold text-white tracking-tight">{getTranslation("System Settings", language)}</h1>
        <p className="text-sm text-[#9CA3AF] font-medium leading-none">
          {getTranslation("Configure profile details, alert preferences, and API tokens. Settings persist locally.", language)}
        </p>
      </div>

      {/* Success Notification Alert */}
      {showToast && (
        <div className="p-3.5 bg-[#16A34A]/10 border border-[#16A34A]/25 text-[#16A34A] text-xs font-bold rounded-xl flex items-center gap-2 select-none transition-all">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>✓ Settings saved successfully! Configuration stored in local browser state.</span>
        </div>
      )}

      {/* Main Settings Form */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Profile and department */}
        <div className="bg-[#111827] border border-[#273244] rounded-xl p-5 shadow-sm space-y-4">
          <div className={sectionHeaderClass}>
            <User className="w-4 h-4 text-[#9CA3AF]" />
            <span>{getTranslation("Profile & Department", language)}</span>
          </div>

          <div className="space-y-3.5 text-xs text-[#9CA3AF]">
            <div className="space-y-1.5">
              <label className="font-semibold block">{getTranslation("Official Profile Name", language)}</label>
              <input
                type="text"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                className={inputClass}
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold block">{getTranslation("Primary Department", language)}</label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className={inputClass}
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold block">{getTranslation("Account Password", language)}</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`${inputClass} pr-10`}
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-[#9AA3B8] hover:text-white cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* System Preferences */}
        <div className="bg-[#111827] border border-[#273244] rounded-xl p-5 shadow-sm space-y-4">
          <div className={sectionHeaderClass}>
            <Sliders className="w-4 h-4 text-[#9CA3AF]" />
            <span>{getTranslation("System Preferences", language)}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-[#9CA3AF]">
            
            {/* Theme */}
            <div className="space-y-1.5">
              <label className="font-semibold flex items-center gap-1.5">
                <Moon className="w-3.5 h-3.5" /> {getTranslation("Workspace Theme", language)}
              </label>
              <select
                value={themeMode}
                onChange={(e) => setThemeMode(e.target.value)}
                className={inputClass}
              >
                <option value="dark">{getTranslation("Dark Theme (Default)", language)}</option>
                <option value="light">{getTranslation("Light Theme", language)}</option>
              </select>
            </div>

            {/* Language */}
            <div className="space-y-1.5">
              <label className="font-semibold flex items-center gap-1.5">
                <Globus className="w-3.5 h-3.5" /> {getTranslation("Language", language)}
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className={inputClass}
              >
                <option value="en-IN">English (India)</option>
                <option value="mr-IN">Marathi (मराठी)</option>
                <option value="hi-IN">Hindi (हिंदी)</option>
              </select>
            </div>

            {/* Timezone */}
            <div className="space-y-1.5">
              <label className="font-semibold flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> {getTranslation("Timezone", language)}
              </label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className={inputClass}
              >
                <option value="IST (UTC+5:30)">IST (UTC+5:30)</option>
                <option value="UTC">UTC (GMT)</option>
              </select>
            </div>

            {/* Accessibility */}
            <div className="space-y-1.5">
              <label className="font-semibold flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5" /> {getTranslation("Accessibility", language)}
              </label>
              <select
                value={accessibility}
                onChange={(e) => setAccessibility(e.target.value)}
                className={inputClass}
              >
                <option value="default">{getTranslation("Default sizing", language)}</option>
                <option value="large">{getTranslation("Large text scale", language)}</option>
                <option value="contrast">{getTranslation("High contrast color", language)}</option>
              </select>
            </div>

          </div>
        </div>

        {/* Notifications and Alerts */}
        <div className="bg-[#111827] border border-[#273244] rounded-xl p-5 shadow-sm space-y-4">
          <div className={sectionHeaderClass}>
            <Bell className="w-4 h-4 text-[#9CA3AF]" />
            <span>{getTranslation("Notification & Alerts", language)}</span>
          </div>

          <div className="space-y-3.5 text-xs text-[#9CA3AF]">
            
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-[#F3F4F6] block">{getTranslation("SLA Warning Notices", language)}</span>
                <span className="text-[10px] text-[#6B7280]">{getTranslation("Ping when incident SLA approaches breach limits.", language)}</span>
              </div>
              <input
                type="checkbox"
                checked={notifySla}
                onChange={(e) => setNotifySla(e.target.checked)}
                className="w-8 h-4 bg-gray-700 rounded-full appearance-none checked:bg-[#16A34A] cursor-pointer relative before:content-[''] before:absolute before:h-3 before:w-3 before:bg-white before:rounded-full before:top-0.5 before:left-0.5 checked:before:translate-x-4 transition-all"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-[#F3F4F6] block">{getTranslation("P0 Safety Alerts", language)}</span>
                <span className="text-[10px] text-[#6B7280]">{getTranslation("Trigger SMS notification on critical public safety risks.", language)}</span>
              </div>
              <input
                type="checkbox"
                checked={notifyUrgent}
                onChange={(e) => setNotifyUrgent(e.target.checked)}
                className="w-8 h-4 bg-gray-700 rounded-full appearance-none checked:bg-[#16A34A] cursor-pointer relative before:content-[''] before:absolute before:h-3 before:w-3 before:bg-white before:rounded-full before:top-0.5 before:left-0.5 checked:before:translate-x-4 transition-all"
              />
            </div>

          </div>
        </div>

        {/* Security and API Keys */}
        <div className="bg-[#111827] border border-[#273244] rounded-xl p-5 shadow-sm space-y-4">
          <div className={sectionHeaderClass}>
            <Key className="w-4 h-4 text-[#9CA3AF]" />
            <span>{getTranslation("Developer Sandbox Keys", language)}</span>
          </div>

          <div className="space-y-3 text-xs text-[#9CA3AF]">
            <div className="space-y-1.5">
              <label className="font-semibold block">{getTranslation("Active API Access Key", language)}</label>
              <input
                type="text"
                readOnly
                value={demoApiKey}
                className="w-full bg-[#0A0F17] border border-[#273244] rounded-xl px-3 py-2 text-xs font-mono font-bold text-[#8B5CF6] focus:outline-none"
              />
              <span className="text-[9px] text-[#6B7280] block">{getTranslation("Developer credential key allocated for GIS and AI pipelines.", language)}</span>
            </div>
          </div>
        </div>

      </div>

      {/* Primary Actions Button Triggers */}
      <div className="flex items-center justify-end gap-3.5 bg-[#111827] border border-[#273244] p-4.5 rounded-xl">
        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 px-4 py-2 bg-white/5 border border-[#273244] hover:bg-white/10 text-[#9CA3AF] hover:text-[#F3F4F6] text-xs font-bold rounded-xl transition-all cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" /> {getTranslation("Reset Settings", language)}
        </button>
        <button
          onClick={handleSave}
          className="flex items-center gap-1.5 px-5 py-2.5 bg-[#16A34A] hover:bg-[#16A34A]/90 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
        >
          <CheckCircle2 className="w-4 h-4" /> {getTranslation("Save Configuration", language)}
        </button>
      </div>

    </div>
  );
};

// Fallback message square icon in case it's not imported
const Globus = (props: any) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

export default SettingsPage;
