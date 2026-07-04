import React from "react";
import { Navigation, Loader2, MapPin } from "lucide-react";

interface CurrentLocationButtonProps {
  onClick: () => void;
  loading: boolean;
}

export const CurrentLocationButton: React.FC<CurrentLocationButtonProps> = ({ onClick, loading }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className={`
        group relative w-full flex items-center justify-center gap-2.5
        px-4 py-3 rounded-xl font-semibold text-sm
        transition-all duration-300 ease-out
        outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60 focus-visible:ring-offset-2
        overflow-hidden
        ${loading
          ? "bg-emerald-500/10 border border-emerald-400/20 text-emerald-400/60 cursor-not-allowed"
          : "bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-500 hover:to-green-400 text-white shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:-translate-y-0.5 active:translate-y-0 border border-emerald-500/30 cursor-pointer"
        }
      `}
    >
      {/* Animated background shimmer on hover */}
      {!loading && (
        <span
          className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0
                     translate-x-[-100%] group-hover:translate-x-[100%]
                     transition-transform duration-700 ease-in-out pointer-events-none"
        />
      )}

      {/* Loading ripple ring */}
      {loading && (
        <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="w-8 h-8 rounded-full border-2 border-emerald-400/30 animate-ping" />
        </span>
      )}

      {/* Icon */}
      <span className={`relative flex items-center justify-center w-7 h-7 rounded-lg
        ${loading ? "bg-emerald-400/10" : "bg-white/15 group-hover:bg-white/20"}
        transition-colors duration-200`}
      >
        {loading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
        ) : (
          <Navigation className="w-3.5 h-3.5 fill-white/30 text-white
                                  group-hover:scale-110 transition-transform duration-200" />
        )}
      </span>

      {/* Label */}
      <span className="relative flex flex-col items-start leading-tight">
        <span className={`text-[13px] font-bold tracking-wide ${loading ? "text-emerald-400/70" : "text-white"}`}>
          {loading ? "Acquiring GPS Signal…" : "Use Current GPS Location"}
        </span>
        {!loading && (
          <span className="text-[10px] font-normal text-white/60 tracking-wide">
            Auto-detect &amp; pin your position
          </span>
        )}
        {loading && (
          <span className="text-[10px] font-normal text-emerald-400/50 tracking-wide">
            Please allow location access
          </span>
        )}
      </span>

      {/* Right indicator dot */}
      {!loading && (
        <span className="relative ml-auto">
          <MapPin className="w-4 h-4 text-white/50 group-hover:text-white/80 transition-colors duration-200" />
        </span>
      )}
    </button>
  );
};

export default CurrentLocationButton;
