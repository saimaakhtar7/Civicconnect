import React from "react";
import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className = "",
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center p-10 text-center bg-[#1E293B] rounded-2xl border border-dashed border-white/10 ${className}`}
    >
      <div className="p-4 bg-white/5 border border-white/5 text-[#9AA3B8]/50 rounded-2xl mb-5 shadow-inner">
        <Icon className="w-8 h-8" />
      </div>
      <h3 className="text-base font-black text-white mb-1">{title}</h3>
      <p className="text-sm text-[#9AA3B8] max-w-sm mb-6 font-medium leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center px-5 py-2.5 bg-[#22C55E] hover:bg-[#16A34A] active:scale-[0.98] text-white rounded-[14px] text-sm font-bold shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};
