import React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  className = "",
  disabled,
  ...props
}) => {
  const baseStyle =
    "inline-flex items-center justify-center font-bold rounded-[14px] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#081220] disabled:pointer-events-none disabled:opacity-40 cursor-pointer";

  const variants = {
    primary:
      "bg-[#22C55E] hover:bg-[#16A34A] active:scale-[0.98] text-white shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 focus-visible:ring-[#22C55E]",
    secondary:
      "bg-white/5 hover:bg-white/10 active:scale-[0.98] text-white border border-white/10 focus-visible:ring-white/20",
    outline:
      "border border-white/10 bg-transparent hover:bg-white/5 active:scale-[0.98] text-[#F5F7FA] focus-visible:ring-white/20",
    ghost:
      "hover:bg-white/5 active:scale-[0.98] text-[#9AA3B8] hover:text-white focus-visible:ring-white/10",
    danger:
      "bg-red-500/10 hover:bg-red-500/20 active:scale-[0.98] text-red-400 border border-red-500/20 hover:border-red-500/40 focus-visible:ring-red-500",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs gap-1.5",
    md: "px-4 py-2 text-sm gap-2",
    lg: "px-5 py-2.5 text-base gap-2",
  };

  return (
    <button
      className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg
          className="animate-spin -ml-1 h-4 w-4 text-current shrink-0"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {children}
    </button>
  );
};
