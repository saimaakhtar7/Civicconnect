import React from "react";
import { Timestamp } from "firebase/firestore";
import { CheckCircle2, Clock, AlertCircle, Eye, Zap } from "lucide-react";

interface TimelineEvent {
  status: string;
  changedAt: Timestamp | Date;
  changedBy: string;
  note?: string;
}

interface IssueTimelineProps {
  statusHistory: TimelineEvent[];
  isCompact?: boolean;
}

/**
 * Issue Lifecycle Timeline Component
 * Displays the complete history of status changes for an issue
 */
export const IssueTimeline: React.FC<IssueTimelineProps> = ({
  statusHistory,
  isCompact = false,
}) => {
  if (!statusHistory || statusHistory.length === 0) {
    return (
      <div className="text-center py-8 text-[#9AA3B8] text-sm">
        No status history available
      </div>
    );
  }

  // Sort by date descending (most recent first)
  const sortedHistory = [...statusHistory].sort((a, b) => {
    const dateA = a.changedAt instanceof Timestamp ? a.changedAt.toDate() : new Date(a.changedAt);
    const dateB = b.changedAt instanceof Timestamp ? b.changedAt.toDate() : new Date(b.changedAt);
    return dateB.getTime() - dateA.getTime();
  });

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "reported":
        return <AlertCircle className="w-4 h-4" />;
      case "under review":
        return <Eye className="w-4 h-4" />;
      case "assigned":
        return <Zap className="w-4 h-4" />;
      case "in progress":
        return <Clock className="w-4 h-4" />;
      case "resolved":
        return <CheckCircle2 className="w-4 h-4" />;
      case "closed":
        return <CheckCircle2 className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string): string => {
    const statusLower = status.toLowerCase();
    if (statusLower.includes("reported")) return "text-blue-400";
    if (statusLower.includes("review")) return "text-yellow-400";
    if (statusLower.includes("assigned")) return "text-purple-400";
    if (statusLower.includes("progress")) return "text-[#22C55E]";
    if (statusLower.includes("resolved")) return "text-emerald-500";
    if (statusLower.includes("closed")) return "text-gray-400";
    return "text-[#22C55E]";
  };

  const getStatusBgColor = (status: string): string => {
    const statusLower = status.toLowerCase();
    if (statusLower.includes("reported")) return "bg-blue-500/10";
    if (statusLower.includes("review")) return "bg-yellow-500/10";
    if (statusLower.includes("assigned")) return "bg-purple-500/10";
    if (statusLower.includes("progress")) return "bg-emerald-500/10";
    if (statusLower.includes("resolved")) return "bg-emerald-500/10";
    if (statusLower.includes("closed")) return "bg-gray-500/10";
    return "bg-emerald-500/10";
  };

  const formatDate = (date: Timestamp | Date): string => {
    const d = date instanceof Timestamp ? date.toDate() : new Date(date);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isCompact) {
    // Compact view: just show key transitions
    return (
      <div className="space-y-2">
        {sortedHistory.slice(0, 3).map((event, idx) => (
          <div key={idx} className="flex items-center gap-2 text-xs">
            <div className={`p-1 rounded ${getStatusBgColor(event.status)}`}>
              <div className={`${getStatusColor(event.status)}`}>
                {getStatusIcon(event.status)}
              </div>
            </div>
            <span className="text-[#9AA3B8]">{event.status}</span>
            <span className="text-[#6B7280] ml-auto">
              {formatDate(event.changedAt)}
            </span>
          </div>
        ))}
        {sortedHistory.length > 3 && (
          <p className="text-xs text-[#9AA3B8] italic">
            +{sortedHistory.length - 3} more events
          </p>
        )}
      </div>
    );
  }

  // Full timeline view
  return (
    <div className="space-y-6">
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#22C55E]/20 to-transparent" />

        {/* Timeline events */}
        <div className="space-y-6">
          {sortedHistory.map((event, idx) => (
            <div key={idx} className="relative pl-14 pb-4">
              {/* Timeline dot */}
              <div
                className={`absolute left-0 w-9 h-9 rounded-full ${getStatusBgColor(
                  event.status
                )} border-2 border-[#1E293B] flex items-center justify-center`}
              >
                <div className={`${getStatusColor(event.status)}`}>
                  {getStatusIcon(event.status)}
                </div>
              </div>

              {/* Event content */}
              <div className="bg-[#1E293B] border border-white/5 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`font-bold ${getStatusColor(event.status)}`}>
                      {event.status}
                    </span>
                  </div>
                  <span className="text-xs text-[#6B7280]">
                    {formatDate(event.changedAt)}
                  </span>
                </div>

                {event.note && (
                  <p className="text-sm text-[#9AA3B8]">{event.note}</p>
                )}

                <div className="text-xs text-[#6B7280] pt-2 border-t border-white/5">
                  Changed by:{" "}
                  <span className="text-[#22C55E] font-semibold">
                    {event.changedBy || "System"}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/**
 * Issue Lifecycle Info Component
 * Shows the current stage in the lifecycle with description
 */
export const IssueLifecycleInfo: React.FC<{ currentStatus: string }> = ({
  currentStatus,
}) => {
  const lifecycleStages = {
    reported: {
      stage: 1,
      label: "Reported",
      description: "Issue submitted by citizen",
      color: "text-blue-400",
      bgColor: "bg-blue-500/10",
    },
    "under review": {
      stage: 2,
      label: "Under Review",
      description: "AI analysis and verification in progress",
      color: "text-yellow-400",
      bgColor: "bg-yellow-500/10",
    },
    assigned: {
      stage: 3,
      label: "Assigned",
      description: "Routed to responsible department",
      color: "text-purple-400",
      bgColor: "bg-purple-500/10",
    },
    "in progress": {
      stage: 4,
      label: "In Progress",
      description: "Department is actively working on resolution",
      color: "text-[#22C55E]",
      bgColor: "bg-emerald-500/10",
    },
    resolved: {
      stage: 5,
      label: "Resolved",
      description: "Action completed and verified",
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
    },
    closed: {
      stage: 6,
      label: "Closed",
      description: "Issue archived",
      color: "text-gray-400",
      bgColor: "bg-gray-500/10",
    },
  };

  const stage = lifecycleStages[currentStatus.toLowerCase() as keyof typeof lifecycleStages] || lifecycleStages.reported;

  return (
    <div className={`rounded-xl p-4 ${stage.bgColor} border border-white/5 space-y-2`}>
      <div className="flex items-center gap-2">
        <div className={`${stage.color}`}>{getStatusIcon(currentStatus)}</div>
        <div>
          <span className={`font-bold ${stage.color}`}>{stage.label}</span>
          <span className="text-[#9AA3B8] text-sm ml-2">({stage.stage}/6)</span>
        </div>
      </div>
      <p className="text-sm text-[#9AA3B8] ml-6">{stage.description}</p>
    </div>
  );
};

const getStatusIcon = (status: string) => {
  switch (status.toLowerCase()) {
    case "reported":
      return <AlertCircle className="w-4 h-4" />;
    case "under review":
      return <Eye className="w-4 h-4" />;
    case "assigned":
      return <Zap className="w-4 h-4" />;
    case "in progress":
      return <Clock className="w-4 h-4" />;
    case "resolved":
      return <CheckCircle2 className="w-4 h-4" />;
    case "closed":
      return <CheckCircle2 className="w-4 h-4" />;
    default:
      return <Clock className="w-4 h-4" />;
  }
};
