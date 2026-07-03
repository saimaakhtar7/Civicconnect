import React, { useEffect, useState } from "react";
import { Loader2, CheckCircle2, Circle } from "lucide-react";

interface Stage {
  id: number;
  label: string;
}

const STAGES: Stage[] = [
  { id: 1, label: "Scanning image payload..." },
  { id: 2, label: "Detecting urban infrastructure elements..." },
  { id: 3, label: "Triage: Finding structural defects..." },
  { id: 4, label: "SLA: Estimating priority & safety risk..." },
  { id: 5, label: "Generating summaries & annotations..." },
  { id: 6, label: "Determining target municipal department..." },
];

interface AnalysisTimelineProps {
  onComplete?: () => void;
  isProcessing: boolean;
}

export const AnalysisTimeline: React.FC<AnalysisTimelineProps> = ({ onComplete, isProcessing }) => {
  const [currentStage, setCurrentStage] = useState(1);

  useEffect(() => {
    if (!isProcessing) return;

    const interval = setInterval(() => {
      setCurrentStage((prev) => {
        if (prev < STAGES.length) {
          return prev + 1;
        } else {
          clearInterval(interval);
          if (onComplete) {
            // Slight delay before completing
            setTimeout(onComplete, 400);
          }
          return prev;
        }
      });
    }, 1800); // 1.8 seconds per step to look like deep processing

    return () => clearInterval(interval);
  }, [isProcessing, onComplete]);

  useEffect(() => {
    if (isProcessing || currentStage >= STAGES.length) return;

    const finishTimer = setTimeout(() => {
      if (onComplete) onComplete();
    }, 200);

    return () => clearTimeout(finishTimer);
  }, [isProcessing, currentStage, onComplete]);

  return (
    <div className="space-y-4 p-6 bg-white rounded-2xl border border-gray-200 shadow-sm max-w-md mx-auto">
      <div className="text-center mb-6">
        <h3 className="text-md font-bold text-gray-900">Gemini Vision Orchestrator</h3>
        <p className="text-xs text-gray-500 mt-1">Analyzing media stream details in real-time</p>
      </div>

      <div className="space-y-4">
        {STAGES.map((stage) => {
          const isDone = currentStage > stage.id;
          const isActive = currentStage === stage.id && isProcessing;

          return (
            <div
              key={stage.id}
              className={`flex items-center space-x-3 text-sm transition-all duration-300 ${
                isActive ? "text-ai-purple font-semibold translate-x-1" : isDone ? "text-gray-500" : "text-gray-300"
              }`}
            >
              {isDone ? (
                <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
              ) : isActive ? (
                <Loader2 className="w-5 h-5 text-ai-purple animate-spin shrink-0" />
              ) : (
                <Circle className="w-5 h-5 shrink-0" />
              )}
              <span>{stage.label}</span>
            </div>
          );
        })}
      </div>

      {isProcessing && (
        <div className="pt-4 border-t border-gray-100 flex flex-col items-center">
          <span className="text-[10px] uppercase font-mono tracking-widest text-ai-purple animate-pulse">
            Executing Agent Triage
          </span>
        </div>
      )}
    </div>
  );
};
export default AnalysisTimeline;
