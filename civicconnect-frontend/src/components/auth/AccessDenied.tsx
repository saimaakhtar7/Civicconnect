import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShieldAlert, ArrowLeft, Home } from "lucide-react";
import { Button } from "../ui/button";
import { useAuthStore } from "../../stores/authStore";

export const AccessDenied: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const handleBack = () => {
    navigate(-1);
  };

  const getDashboardRedirect = () => {
    if (!user) return "/auth/signin";
    return user.role === "citizen" ? "/" : "/dashboard";
  };

  return (
    <div className="min-h-screen bg-[#0A0F17] flex items-center justify-center p-4">
      <div className="relative max-w-md w-full bg-[#111827]/80 backdrop-blur-xl border border-white/5 p-8 rounded-3xl shadow-2xl text-center space-y-6 overflow-hidden">
        {/* Glow decorative block */}
        <span className="absolute -top-10 -left-10 w-32 h-32 bg-red-500/10 rounded-full blur-2xl pointer-events-none" />
        <span className="absolute -bottom-10 -right-10 w-32 h-32 bg-red-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Warning Icon Badge */}
        <div className="mx-auto flex items-center justify-center w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 animate-pulse">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-black text-white tracking-tight">403: Access Denied</h1>
          <p className="text-xs text-[#9AA3B8] leading-relaxed">
            You do not have the required permissions to view this resource. This zone is restricted.
          </p>
        </div>

        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 text-left text-xs space-y-1.5 font-medium text-[#6B7280]">
          <div className="flex justify-between">
            <span>Your Identity:</span>
            <span className="text-white font-bold">{user?.displayName || "Visitor / Anonymous"}</span>
          </div>
          <div className="flex justify-between">
            <span>Your System Role:</span>
            <span className="text-red-400 font-bold uppercase tracking-wider">{user?.role || "visitor"}</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button
            onClick={handleBack}
            variant="outline"
            className="flex-1 border-white/10 text-white hover:bg-white/5 font-bold text-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
            Go Back
          </Button>

          <Link to={getDashboardRedirect()} className="flex-1">
            <Button
              className="w-full bg-[#16A34A] hover:bg-[#15803D] text-white font-bold text-xs"
            >
              <Home className="w-3.5 h-3.5 mr-1.5" />
              Go Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AccessDenied;
