import React from "react";
import { PriorityLevel } from "../../types/user.types";
import { priorityToColor, priorityToLabel } from "../../utils/priority.utils";
import { AlertCircle, AlertTriangle, Info, ShieldAlert } from "lucide-react";

interface SeverityBadgeProps {
  level: PriorityLevel;
  className?: string;
}

export const SeverityBadge: React.FC<SeverityBadgeProps> = ({ level, className = "" }) => {
  const getIcon = () => {
    switch (level) {
      case 0:
        return <ShieldAlert className="w-4 h-4 mr-1 shrink-0" />;
      case 1:
        return <AlertTriangle className="w-4 h-4 mr-1 shrink-0" />;
      case 2:
        return <AlertCircle className="w-4 h-4 mr-1 shrink-0" />;
      case 3:
      case 4:
        return <Info className="w-4 h-4 mr-1 shrink-0" />;
      default:
        return null;
    }
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${priorityToColor(
        level
      )} ${className}`}
    >
      {getIcon()}
      {priorityToLabel(level)}
    </span>
  );
};
