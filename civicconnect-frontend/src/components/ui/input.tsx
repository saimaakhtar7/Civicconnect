import React from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", type = "text", ...props }, ref) => {
    const hasBg = /\bbg-/.test(className);
    const hasText = /\btext-/.test(className);
    const hasBorder = /\bborder-/.test(className);
    const hasPlaceholder = /\bplaceholder-/.test(className);
    const hasHeight = /\bh-/.test(className) || /\bpy-/.test(className);

    const baseClasses = [
      "flex w-full rounded-[12px] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-civic-blue/20 focus:border-civic-blue",
      !hasHeight && "h-10",
      !hasBg && "bg-white",
      !hasText && "text-gray-900",
      !hasBorder && "border border-gray-300",
      !hasPlaceholder && "placeholder-gray-500"
    ].filter(Boolean).join(" ");

    return (
      <input
        ref={ref}
        type={type}
        className={`${baseClasses} ${className}`}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";
