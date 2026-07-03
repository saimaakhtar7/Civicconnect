import React from "react";
import { useReportStore } from "../../../stores/reportStore";
import ConfidenceMeter from "./ConfidenceMeter";
import ObjectDetectionList from "./ObjectDetectionList";
import HazardCard from "./HazardCard";
import { Clock, BadgeInfo } from "lucide-react";
import { SeverityBadge } from "../../ui/SeverityBadge";

export const AIAnalysisCard: React.FC = () => {
  const { draft } = useReportStore();
  const analysis = draft.aiAnalysis;

  if (!analysis) return null;

  const severityLevelMap = { critical: 0, high: 1, medium: 2, low: 3 };
  const level = severityLevelMap[analysis.severity as keyof typeof severityLevelMap] ?? 2;

  return (
    <div className="space-y-4">
      {/* Top Banner KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Confidence Circle */}
        <ConfidenceMeter confidence={analysis.confidence} />

        {/* Severity & SLA Info */}
        <div className="flex flex-col justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-3">
          <div className="space-y-1">
            <span className="block text-[10px] uppercase font-bold tracking-wider text-gray-400">AI Priority Classification</span>
            <SeverityBadge level={level as any} />
          </div>
          
          <div className="flex items-center space-x-2 text-xs text-gray-500 border-t border-gray-200/60 pt-2">
            <Clock className="w-4 h-4 text-gray-400" />
            <span>Processed in {((analysis.processingTimeMs || 0) / 1000).toFixed(2)}s</span>
          </div>
        </div>
      </div>

      {/* Hazard Banner */}
      <HazardCard hazards={analysis.possibleHazards} />

      {/* Detected Elements */}
      <ObjectDetectionList objects={analysis.detectedObjects} />

      {/* Context info */}
      {analysis.urgencyReason && (
        <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-xl flex items-start space-x-3">
          <BadgeInfo className="w-5 h-5 text-civic-blue shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h5 className="text-xs font-bold text-blue-900 uppercase tracking-wider">AI Reasoning Log</h5>
            <p className="text-xs text-blue-800 leading-relaxed">{analysis.urgencyReason}</p>
          </div>
        </div>
      )}
    </div>
  );
};
export default AIAnalysisCard;
