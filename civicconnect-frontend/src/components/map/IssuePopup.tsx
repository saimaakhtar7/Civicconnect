import React from "react";
import { IssueDocument } from "../../types/issue.types";
import { SeverityBadge } from "../ui/SeverityBadge";
import { MapPin, Clock, Building } from "lucide-react";
import { getRelativeTime } from "../../utils/date.utils";

interface IssuePopupProps {
  issue: IssueDocument;
  onClose: () => void;
  onViewDetail: (id: string) => void;
}

export const IssuePopup: React.FC<IssuePopupProps> = ({ issue, onClose, onViewDetail }) => {
  const summary = issue.aiSummary;
  const severityLevelMap = { critical: 0, high: 1, medium: 2, low: 3 };
  const level = severityLevelMap[(summary?.severity || issue.aiAnalysis?.severity) as keyof typeof severityLevelMap] ?? 2;
  const thumbnail = issue.mediaUrls?.[0]?.original;

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-200 w-[280px] overflow-hidden animate-card-slide-up">
      {/* Thumbnail */}
      {thumbnail && (
        <div className="h-36 bg-gray-100 overflow-hidden">
          <img src={thumbnail} alt="Issue" className="w-full h-full object-cover" />
        </div>
      )}

      {/* Content */}
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <h4 className="text-sm font-bold text-gray-900 leading-tight">
            {summary?.subcategory || issue.aiAnalysis?.subcategory || "Community Issue"}
          </h4>
          <SeverityBadge level={level as any} />
        </div>

        <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">
          {summary?.executiveSummary || issue.aiAnalysis?.aiDescription}
        </p>

        <div className="space-y-1.5 text-xs text-gray-500">
          <div className="flex items-center space-x-1.5">
            <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <span className="line-clamp-1">{issue.location?.address || "Location not specified"}</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <Building className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <span>{issue.routing?.primaryDepartment || "Department TBD"}</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <span>{issue.createdAt ? getRelativeTime(issue.createdAt as any) : "Just now"}</span>
          </div>
        </div>

        <div className="flex gap-2 pt-1 border-t border-gray-100">
          <button
            onClick={onClose}
            className="flex-1 text-xs text-gray-500 hover:text-gray-700 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
          <button
            onClick={() => onViewDetail(issue.id)}
            className="flex-1 text-xs font-semibold text-white bg-civic-blue hover:bg-civic-blue-dark py-1.5 rounded-lg transition-colors"
          >
            View Detail
          </button>
        </div>
      </div>
    </div>
  );
};
export default IssuePopup;
