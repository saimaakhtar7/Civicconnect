import React from "react";
import { AlertTriangle } from "lucide-react";

interface HazardCardProps {
  hazards: string[];
}

export const HazardCard: React.FC<HazardCardProps> = ({ hazards }) => {
  if (hazards.length === 0) return null;

  return (
    <div className="p-4 bg-orange-50/50 border border-orange-100 rounded-xl space-y-2">
      <div className="flex items-center text-xs font-bold text-orange-800 uppercase tracking-wider">
        <AlertTriangle className="w-4 h-4 mr-1 text-orange-600 animate-pulse" />
        <span>Potential Area Hazards</span>
      </div>
      <ul className="text-xs text-orange-700 space-y-1 list-disc pl-4">
        {hazards.map((hazard, idx) => (
          <li key={idx}>{hazard}</li>
        ))}
      </ul>
    </div>
  );
};
export default HazardCard;
