import React from "react";
import { LoadingSpinner } from "./LoadingSpinner";

export const PageLoader: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#081220] p-4 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-emerald-500/5 blur-[80px] pointer-events-none" />

      <div className="relative flex flex-col items-center space-y-5 z-10">
        {/* Animated logo ring */}
        <div className="relative">
          <LoadingSpinner size="lg" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-5 h-5 rounded-full bg-[#22C55E]/20 border border-[#22C55E]/40" />
          </div>
        </div>
        <div className="text-center space-y-1">
          <h2 className="text-lg font-black text-white tracking-tight">CivicConnect AI</h2>
          <p className="text-xs text-[#9AA3B8] font-medium">Initializing governance platform...</p>
        </div>
        {/* Pulsing progress bar */}
        <div className="w-40 h-0.5 bg-white/5 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-transparent via-[#22C55E] to-transparent rounded-full animate-[shimmer_1.5s_ease-in-out_infinite]" />
        </div>
      </div>
    </div>
  );
};
