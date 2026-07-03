import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { doc, updateDoc } from "firebase/firestore";
import { removeUndefined } from "../../utils/firestore.utils";
import { db } from "../../config/firebase";
import { useAuthStore } from "../../stores/authStore";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { UserRole } from "../../types/user.types";
import { User, Landmark } from "lucide-react";

export const OnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, setUser } = useAuthStore();
  const [selectedRole, setSelectedRole] = useState<UserRole>("citizen");
  const [departmentCode, setDepartmentCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRoleSelection = (role: UserRole) => {
    setSelectedRole(role);
    setError("");
  };

  const handleCompleteOnboarding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setError("");

    let updateData: Record<string, any> = {
      role: selectedRole,
      department: null,
      officerCode: null,
    };

    if (selectedRole === "official" || selectedRole === "admin") {
      // Validate code (e.g. ROADS101, WATER202, ELEC303, SWM404, PARKS505)
      const cleanedCode = departmentCode.trim().toUpperCase();
      let matchedDept = "";
      if (cleanedCode.startsWith("ROADS")) matchedDept = "roads";
      else if (cleanedCode.startsWith("WATER")) matchedDept = "water";
      else if (cleanedCode.startsWith("ELEC")) matchedDept = "electricity";
      else if (cleanedCode.startsWith("SWM")) matchedDept = "swm";
      else if (cleanedCode.startsWith("PARKS")) matchedDept = "parks";

      if (!matchedDept && selectedRole === "official") {
        setError("Invalid department officer registration code.");
        setLoading(false);
        return;
      }
      
      updateData = {
        ...updateData,
        department: matchedDept || "Administration",
        officerCode: cleanedCode,
        wardId: "ward_1", // Default ward seed
      };
    }

    try {
      const userDocRef = doc(db, "users", user.uid);
      await updateDoc(userDocRef, removeUndefined(updateData));

      // Sync local store
      setUser({
        ...user,
        ...updateData,
      } as any);

      // Redirect based on role
      if (selectedRole === "citizen") {
        navigate("/");
      } else {
        navigate("/dashboard");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to update profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-[#081220] text-[#F5F7FA] font-sans antialiased overflow-hidden relative items-center justify-center px-4 py-12">
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 grid-pattern pointer-events-none opacity-40 z-0" />

      {/* Decorative Blur Orbs */}
      <div className="absolute top-[-15%] left-[-15%] w-[55%] aspect-square rounded-full bg-emerald-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-15%] right-[-15%] w-[55%] aspect-square rounded-full bg-purple-500/5 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-lg space-y-8 glass-card p-8 rounded-[20px] shadow-2xl relative border border-white/5 bg-[#0F172A]/75 backdrop-blur-md z-10">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-black text-white tracking-tight">
            Choose Your Role
          </h2>
          <p className="text-sm text-[#9AA3B8]">
            Select how you would like to interact with the platform
          </p>
        </div>

        {error && (
          <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-xs font-semibold text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleCompleteOnboarding} className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Citizen card */}
            <div
              onClick={() => handleRoleSelection("citizen")}
              className={`flex flex-col items-center p-6 cursor-pointer rounded-xl border transition-all text-center ${
                selectedRole === "citizen"
                  ? "border-[#22C55E] bg-emerald-500/10 shadow-lg shadow-emerald-500/5"
                  : "border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/10"
              }`}
            >
              <div className={`p-3 rounded-full mb-3 ${selectedRole === "citizen" ? "bg-emerald-500/20 text-[#22C55E]" : "bg-white/5 text-[#9AA3B8]"}`}>
                <User className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-white text-sm">Citizen Partner</h3>
              <p className="text-[11px] text-[#9AA3B8] leading-relaxed mt-2">
                Report infrastructure issues, verify resolved works, and build public trust.
              </p>
            </div>

            {/* Official card */}
            <div
              onClick={() => handleRoleSelection("official")}
              className={`flex flex-col items-center p-6 cursor-pointer rounded-xl border transition-all text-center ${
                selectedRole === "official"
                  ? "border-[#22C55E] bg-emerald-500/10 shadow-lg shadow-emerald-500/5"
                  : "border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/10"
              }`}
            >
              <div className={`p-3 rounded-full mb-3 ${selectedRole === "official" ? "bg-emerald-500/20 text-[#22C55E]" : "bg-white/5 text-[#9AA3B8]"}`}>
                <Landmark className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-white text-sm">Municipal Officer</h3>
              <p className="text-[11px] text-[#9AA3B8] leading-relaxed mt-2">
                Acknowledge incoming reports, schedule crew repairs, and log action proof.
              </p>
            </div>
          </div>

          {selectedRole === "official" && (
            <div className="space-y-2 border-t border-white/5 pt-5 animate-card-slide-up">
              <Label htmlFor="code" className="text-xs font-bold text-[#9AA3B8] uppercase tracking-wider">Department Authorization Code</Label>
              <Input
                id="code"
                type="text"
                required
                value={departmentCode}
                onChange={(e) => setDepartmentCode(e.target.value)}
                placeholder="e.g. ROADS101, WATER202"
                className="mt-1.5 py-3.5 bg-white/5 border border-white/5 text-[#F5F7FA] placeholder-[#9AA3B8]/40 focus:ring-1 focus:ring-[#22C55E] focus:border-[#22C55E] rounded-xl text-sm"
              />
              <p className="text-[10px] text-[#9AA3B8]/60 leading-relaxed mt-1">
                Authorized codes start with category name (ROADS, WATER, ELEC, SWM, PARKS) followed by 3 digits.
              </p>
            </div>
          )}

          <Button type="submit" variant="primary" className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 rounded-xl text-white font-bold transition-all shadow-lg shadow-emerald-500/20 cursor-pointer" loading={loading}>
            Complete Setup
          </Button>
        </form>
      </div>
    </div>
  );
};

export default OnboardingPage;
