import React from "react";
import { motion } from "framer-motion";

interface ConfidenceMeterProps {
  confidence: number;
}

export const ConfidenceMeter: React.FC<ConfidenceMeterProps> = ({ confidence }) => {
  // Get color based on rating
  const getColor = () => {
    if (confidence >= 85) return "text-green-500 stroke-green-500";
    if (confidence >= 70) return "text-yellow-500 stroke-yellow-500";
    return "text-orange-500 stroke-orange-500";
  };

  const radius = 30;
  const strokeWidth = 6;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (confidence / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-xl border border-gray-100">
      <div className="relative w-20 h-20 flex items-center justify-center">
        {/* SVG gauge */}
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="40"
            cy="40"
            r={radius}
            className="stroke-gray-200 fill-transparent"
            strokeWidth={strokeWidth}
          />
          <motion.circle
            cx="40"
            cy="40"
            r={radius}
            className={`fill-transparent transition-all duration-1000 ${getColor()}`}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute text-center">
          <span className="block text-lg font-bold text-gray-900">{confidence}%</span>
          <span className="text-[8px] uppercase tracking-wider font-semibold text-gray-400">Match</span>
        </div>
      </div>
      <span className="text-xs font-semibold text-gray-500 mt-2">AI Confidence Rating</span>
    </div>
  );
};
export default ConfidenceMeter;
