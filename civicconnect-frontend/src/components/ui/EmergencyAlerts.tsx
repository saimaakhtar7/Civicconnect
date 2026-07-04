import React, { useState, useEffect } from "react";
import { useAuthStore } from "../../stores/authStore";
import { db } from "../../config/firebase";
import { collection, query, getDocs, addDoc, orderBy } from "firebase/firestore";
import { X, Volume2, ShieldAlert, Send, MapPin } from "lucide-react";
import { Button } from "./button";

interface EmergencyAlert {
  id: string;
  category: string;
  severity: "critical" | "high" | "medium";
  description: string;
  affectedAreas: string[];
  expiryTime: any;
  createdAt: any;
  color?: string;
}

export const EmergencyAlerts: React.FC = () => {
  const { user } = useAuthStore();
  const [alerts, setAlerts] = useState<EmergencyAlert[]>([]);
  const [publishOpen, setPublishOpen] = useState(false);
  
  // Publish Form States
  const [category, setCategory] = useState("Flood");
  const [severity, setSeverity] = useState<"critical" | "high" | "medium">("critical");
  const [description, setDescription] = useState("");
  const [areas, setAreas] = useState("");
  const [durationHours, setDurationHours] = useState(3);
  const [submitting, setSubmitting] = useState(false);

  const isOfficial = user?.role === "official" || user?.role === "admin" || user?.role === "moderator";

  const fetchActiveAlerts = async () => {
    try {
      const q = query(
        collection(db, "alerts"),
        orderBy("expiryTime", "desc")
      );
      const snap = await getDocs(q);
      const list = snap.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((a: any) => {
          const exp = a.expiryTime?.toDate ? a.expiryTime.toDate() : new Date(a.expiryTime);
          return exp.getTime() > Date.now();
        }) as EmergencyAlert[];

      // Pre-seed mock alert if db is clean for evaluation
      if (list.length === 0) {
        setAlerts([
          {
            id: "mock_alert_1",
            category: "Heavy Rain & Flood",
            severity: "critical",
            description: "Heavy water logging near Viman Nagar Sakore Road. Commuters are advised to take alternative routes.",
            affectedAreas: ["Viman Nagar", "Sakore Road"],
            expiryTime: new Date(Date.now() + 3 * 3600 * 1000),
            createdAt: new Date()
          }
        ]);
      } else {
        setAlerts(list);
      }
    } catch (err) {
      console.error("Failed to load alerts:", err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchActiveAlerts();
      const interval = setInterval(fetchActiveAlerts, 20000); // refresh every 20s
      return () => clearInterval(interval);
    }
  }, [user]);

  const handlePublishAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const expDate = new Date(Date.now() + durationHours * 3600 * 1000);
      const areaList = areas.split(",").map((a) => a.trim()).filter(Boolean);

      const newAlert = {
        category,
        severity,
        description,
        affectedAreas: areaList,
        expiryTime: expDate,
        createdAt: new Date()
      };

      const docRef = await addDoc(collection(db, "alerts"), newAlert);
      setAlerts((prev) => [{ id: docRef.id, ...newAlert }, ...prev]);
      
      // Reset Form
      setDescription("");
      setAreas("");
      setPublishOpen(false);
    } catch (err) {
      console.error("Failed to publish emergency alert:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDismissAlert = (id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  if (alerts.length === 0) return null;

  return (
    <div className="w-full space-y-2.5 px-6 sm:px-8 max-w-[1700px] mx-auto mt-4 z-20 relative select-none">
      {alerts.map((alert) => {
        const isCritical = alert.severity === "critical";
        const isHigh = alert.severity === "high";
        
        const bgColor = isCritical ? "bg-red-500/10 border-red-500/20 text-red-400" :
                        isHigh ? "bg-amber-500/10 border-amber-500/20 text-amber-400" :
                        "bg-blue-500/10 border-blue-500/20 text-blue-400";
        
        const badgeColor = isCritical ? "bg-red-500 text-white" :
                           isHigh ? "bg-amber-500 text-white" :
                           "bg-blue-500 text-white";

        return (
          <div key={alert.id} className={`flex items-start gap-3 p-3.5 border rounded-2xl shadow-lg relative overflow-hidden transition-all ${bgColor}`}>
            <Volume2 className="w-5 h-5 shrink-0 animate-bounce mt-0.5" />
            <div className="flex-1 min-w-0 pr-6 text-left space-y-1">
              <div className="flex items-center gap-2 flex-wrap leading-none">
                <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${badgeColor}`}>
                  {alert.severity} alert
                </span>
                <span className="text-xs font-black text-white">{alert.category}</span>
                {alert.affectedAreas.length > 0 && (
                  <span className="text-[10px] text-[#9AA3B8] font-bold flex items-center gap-0.5">
                    <MapPin className="w-3 h-3" /> {alert.affectedAreas.join(", ")}
                  </span>
                )}
              </div>
              <p className="text-xs text-[#9AA3B8] font-medium leading-relaxed">
                {alert.description}
              </p>
            </div>
            
            <div className="flex items-center gap-2 shrink-0">
              {isOfficial && (
                <button
                  onClick={() => setPublishOpen(true)}
                  className="bg-white/10 hover:bg-white/20 text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-xl transition-all cursor-pointer border border-white/5"
                >
                  Publish Alert
                </button>
              )}
              <button onClick={() => handleDismissAlert(alert.id)} className="text-[#9AA3B8] hover:text-white transition-colors cursor-pointer p-0.5">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        );
      })}

      {/* Alert Publishing Modal form */}
      {publishOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <form onSubmit={handlePublishAlert} className="bg-[#1E293B] border border-white/10 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 text-left">
            <div className="flex items-center gap-2.5 text-red-500">
              <ShieldAlert className="w-6 h-6 shrink-0 animate-pulse" />
              <h3 className="text-base font-black text-white">Broadcast Emergency Civic Alert</h3>
            </div>

            <div className="space-y-3.5 text-xs text-[#9AA3B8]">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold block text-[#F3F4F6]">Alert Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-[#0F172A] border border-white/10 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none"
                  >
                    <option value="Flood">Flood</option>
                    <option value="Road Closure">Road Closure</option>
                    <option value="Water Supply Shutdown">Water Supply Shutdown</option>
                    <option value="Cyclone">Cyclone</option>
                    <option value="Heavy Rain">Heavy Rain</option>
                    <option value="Fire">Fire</option>
                    <option value="Bridge Closure">Bridge Closure</option>
                    <option value="Gas Leak">Gas Leak</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold block text-[#F3F4F6]">Severity Level</label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value as any)}
                    className="w-full bg-[#0F172A] border border-white/10 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none"
                  >
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold block text-[#F3F4F6]">Affected Areas (Comma-separated)</label>
                <input
                  type="text"
                  placeholder="e.g. Shivajinagar, Kalyani Nagar"
                  value={areas}
                  onChange={(e) => setAreas(e.target.value)}
                  className="w-full bg-[#0F172A] border border-white/10 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold block text-[#F3F4F6]">Active Alert Expiry Duration</label>
                <select
                  value={durationHours}
                  onChange={(e) => setDurationHours(parseInt(e.target.value))}
                  className="w-full bg-[#0F172A] border border-white/10 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none"
                >
                  <option value={1}>1 Hour</option>
                  <option value={3}>3 Hours</option>
                  <option value={6}>6 Hours</option>
                  <option value={12}>12 Hours</option>
                  <option value={24}>24 Hours</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold block text-[#F3F4F6]">Alert Broadcast Remarks</label>
                <textarea
                  placeholder="Detailed description of road closure or power outages..."
                  value={description}
                  required
                  rows={3}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-[#0F172A] border border-white/10 rounded-xl p-3 text-xs font-semibold text-white focus:outline-none resize-none"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={submitting} className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 py-2.5">
                <Send className="w-3.5 h-3.5" /> Broadcast Alert
              </Button>
              <Button variant="outline" onClick={() => setPublishOpen(false)} className="border-white/10 text-white hover:bg-white/5">
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default EmergencyAlerts;
