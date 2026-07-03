import React from "react";

export const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className = "",
  ...props
}) => (
  <div
    className={`bg-[#1E293B] rounded-[18px] border border-white/5 shadow-xl text-[#F5F7FA] ${className}`}
    {...props}
  />
);

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className = "",
  ...props
}) => <div className={`flex flex-col space-y-1.5 p-6 border-b border-white/5 ${className}`} {...props} />;

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  className = "",
  ...props
}) => (
  <h3
    className={`text-base font-black leading-none tracking-tight text-white ${className}`}
    {...props}
  />
);

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({
  className = "",
  ...props
}) => <p className={`text-xs font-semibold text-[#9AA3B8] ${className}`} {...props} />;

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className = "",
  ...props
}) => <div className={`p-6 ${className}`} {...props} />;

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className = "",
  ...props
}) => <div className={`flex items-center p-6 border-t border-white/5 ${className}`} {...props} />;
