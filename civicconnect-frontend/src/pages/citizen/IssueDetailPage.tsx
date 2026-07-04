import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, onSnapshot, updateDoc, increment, arrayUnion, arrayRemove } from "firebase/firestore";
import { db } from "../../config/firebase";
import { IssueDocument } from "../../types/issue.types";
import { IssueStatus } from "../../types/user.types";
import { useAuthStore } from "../../stores/authStore";
import { useNotificationStore } from "../../stores/notificationStore";
import { SeverityBadge } from "../../components/ui/SeverityBadge";
import { ISSUE_STATUSES } from "../../config/constants";
import BeforeAfterSlider from "../../components/ui/BeforeAfterSlider";
import {
  ArrowLeft, MapPin, Building, Cpu, AlertTriangle, Loader2, 
  CheckCircle2, XCircle, Heart, Users
} from "lucide-react";
import { Button } from "../../components/ui/button";

const LIFECYCLE_STAGES = [
  "reported",
  "verified",
  "under review",
  "assigned",
  "field inspection",
  "work started",
  "work completed",
  "resolved",
  "closed"
];

const LIFECYCLE_DETAILS: Record<string, { label: string; desc: string }> = {
  reported: { label: "Reported", desc: "Issue submitted by citizen" },
  verified: { label: "Verified", desc: "Incident authenticity approved" },
  "under review": { label: "Under Review", desc: "AI analysis and triage routing active" },
  assigned: { label: "Assigned", desc: "Routed to responsible municipal department" },
  "field inspection": { label: "Field Inspection", desc: "Crew dispatched for site inspection" },
  "work started": { label: "Work Started", desc: "Physical repairs initiated on site" },
  "work completed": { label: "Work Completed", desc: "Physical repairs finished, checking quality" },
  resolved: { label: "Resolved", desc: "Official resolution note logged by crew" },
  closed: { label: "Closed", desc: "Resolution verified and ticket archived" }
};

export const IssueDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, setUser } = useAuthStore();
  const { addNotification } = useNotificationStore();

  const [issue, setIssue] = useState<IssueDocument | any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [citizenComments, setCitizenComments] = useState("");

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    const docRef = doc(db, "issues", id);

    const unsubscribe = onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        setIssue({ id: snap.id, ...snap.data() } as any);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [id]);

  // Support/Upvote Toggle Handler
  const handleToggleSupport = async () => {
    if (!issue || !user) return;
    
    const isSupported = issue.supportedBy?.includes(user.uid);
    const issueRef = doc(db, "issues", issue.id);

    try {
      if (isSupported) {
        await updateDoc(issueRef, {
          supportCount: increment(-1),
          supportedBy: arrayRemove(user.uid),
          "metrics.upvoteCount": increment(-1),
          // Undo boost
          "priority.score": increment(-10)
        });
        addNotification({
          type: "info",
          title: "Support Cancelled",
          message: "You removed your support from this issue."
        });
      } else {
        await updateDoc(issueRef, {
          supportCount: increment(1),
          supportedBy: arrayUnion(user.uid),
          "metrics.upvoteCount": increment(1),
          // Boost priority score by 10 points
          "priority.score": increment(10)
        });
        addNotification({
          type: "success",
          title: "Issue Supported",
          message: "You added your support to this issue report. Priority score boosted."
        });
      }
    } catch (err) {
      console.error("Support toggle failed:", err);
    }
  };

  const handleVerifyResolution = async (approved: boolean) => {
    if (!issue || !user) return;
    setUpdating(true);

    const nextStatus: IssueStatus = approved ? "closed" : "in_progress";
    const actionText = approved ? "Resolution verified & approved." : "Resolution rejected by citizen.";

    try {
      const docRef = doc(db, "issues", issue.id);

      const statusHistoryEntry = {
        status: nextStatus,
        changedAt: new Date(),
        changedBy: user.displayName || "Citizen",
        note: `${actionText} Comments: ${citizenComments}`,
        officer: user.displayName || "Citizen",
        department: issue.routing?.primaryDepartment || "Citizen Review"
      };

      const updatedHistory = [...(issue.statusHistory || []), statusHistoryEntry];

      await updateDoc(docRef, {
        status: nextStatus,
        statusHistory: updatedHistory,
        updatedAt: new Date(),
      });

      if (approved) {
        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, {
          "trust.score": increment(5),
          "trust.totalReports": increment(1),
          "trust.resolutionConfirmations": increment(1),
        });

        setUser({
          ...user,
          trust: {
            ...user.trust,
            score: (user.trust?.score || 85) + 5,
            resolutionConfirmations: (user.trust?.resolutionConfirmations || 0) + 1,
          }
        } as any);

        addNotification({
          type: "success",
          title: "XP & Trust Score Up!",
          message: `Resolution approved! You earned +30 XP and +5 Trust Score.`,
        });
      } else {
        addNotification({
          type: "warning",
          title: "Issue Reopened",
          message: "Report sent back to assigned department queue.",
        });
      }

      setCitizenComments("");
    } catch (err) {
      console.error("Verification submit failed:", err);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-[#16A34A] animate-spin" />
      </div>
    );
  }

  if (!issue) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
        <AlertTriangle className="w-10 h-10 text-orange-400 mb-3" />
        <h3 className="font-bold text-gray-900">Issue Not Found</h3>
        <Button variant="outline" onClick={() => navigate("/")} className="mt-4">
          <ArrowLeft className="w-4 h-4 mr-2" />Go Home
        </Button>
      </div>
    );
  }

  const severityLevelMap = { critical: 0, high: 1, medium: 2, low: 3 };
  const level = severityLevelMap[issue.aiAnalysis?.severity as keyof typeof severityLevelMap] ?? 2;
  const statusMeta = ISSUE_STATUSES.find((s) => s.value === issue.status);
  
  const beforePhoto = issue.mediaUrls?.[0]?.original;
  const afterPhoto = issue.resolution?.afterMediaUrls?.[0];

  const supportCount = issue.supportCount || issue.supportedBy?.length || 0;
  const isSupported = user && issue.supportedBy?.includes(user.uid);
  
  // Calculate mock nearby citizen count based on coordinates/ward
  const mockNearbyCount = (issue.location?.ward?.length || 5) * 4;

  const currentStatusIdx = LIFECYCLE_STAGES.indexOf(issue.status?.toLowerCase()) !== -1 
    ? LIFECYCLE_STAGES.indexOf(issue.status.toLowerCase()) 
    : 0;

  // Determine reporter name display (Anonymity Check)
  const isUserReporter = user && user.uid === issue.reportedBy;
  const isStaffViewer = user?.role === "official" || user?.role === "admin" || user?.role === "moderator";
  const displayReporterName = (issue.isAnonymous && !isUserReporter && !isStaffViewer)
    ? "Anonymous Citizen"
    : (issue.reporterName || "Citizen Reporter");

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6 pb-24 text-left">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center text-sm text-[#9AA3B8] hover:text-white transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back
      </button>

      {/* Before / After Slider Comparison */}
      {(issue.status === "resolved" || issue.status === "closed") && afterPhoto && beforePhoto ? (
        <div className="space-y-2">
          <span className="text-xs font-bold text-[#9AA3B8] uppercase tracking-wider block">Repairs Comparison Slider</span>
          <BeforeAfterSlider beforeImage={beforePhoto} afterImage={afterPhoto} />
        </div>
      ) : (
        beforePhoto && (
          <div className="aspect-video bg-black rounded-2xl overflow-hidden border border-white/5 shadow-sm">
            {issue.mediaUrls[0].type === "video" ? (
              <video src={beforePhoto} controls className="w-full h-full object-contain" playsInline />
            ) : (
              <img src={beforePhoto} alt="Issue location" className="w-full h-full object-cover" />
            )}
          </div>
        )
      )}

      {/* Header Info */}
      <div className="bg-[#1E293B] border border-white/5 p-5 rounded-2xl space-y-3.5 shadow-md">
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="text-[10px] font-black text-[#6B7280] uppercase tracking-wider block">Reporter: {displayReporterName}</span>
            <h1 className="text-xl font-bold text-white leading-tight mt-1">
              {issue.aiAnalysis?.subcategory || "Community Issue"}
            </h1>
          </div>
          <SeverityBadge level={level as any} />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {statusMeta && (
            <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${statusMeta.color}`}>
              {statusMeta.label}
            </span>
          )}
          <span className="text-[10px] font-bold text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-full uppercase">
            Priority Score: {issue.priority?.score || 80}
          </span>
        </div>
      </div>

      {/* Support & Upvote Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {/* Support Button */}
        {user && (
          <button
            onClick={handleToggleSupport}
            className={`flex items-center justify-center gap-2 p-4 border rounded-2xl font-bold text-sm shadow-md transition-all active:scale-[0.98] ${
              isSupported
                ? "bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20"
                : "bg-[#16A34A] hover:bg-[#16A34A]/90 border-transparent text-white"
            }`}
          >
            <Heart className={`w-5 h-5 ${isSupported ? "fill-red-400 text-red-400" : ""}`} />
            {isSupported ? "Undo Support" : "Support Issue"}
          </button>
        )}

        {/* Proximity widget statistics */}
        <div className="bg-[#1E293B] border border-white/5 rounded-2xl p-4 flex items-center gap-3">
          <Users className="w-7 h-7 text-purple-400 shrink-0" />
          <div>
            <span className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider block">Impact Telemetry</span>
            <span className="text-xs text-white font-bold block">{supportCount} Citizens supporting</span>
            <span className="text-[10px] text-[#9AA3B8] font-semibold mt-0.5 block">~{mockNearbyCount} neighbors affected in ward</span>
          </div>
        </div>
      </div>

      {/* AI Analysis Briefing */}
      {issue.aiAnalysis?.aiDescription && (
        <div className="p-4 bg-purple-500/5 border border-purple-500/15 rounded-xl">
          <div className="flex items-center text-xs font-bold text-purple-400 uppercase tracking-wider mb-2">
            <Cpu className="w-3.5 h-3.5 mr-1" />AI Council Deliberation Summaries
          </div>
          <p className="text-xs text-[#9AA3B8] leading-relaxed">{issue.aiAnalysis.aiDescription}</p>
        </div>
      )}

      {/* Location Details */}
      <div className="grid grid-cols-1 gap-3">
        <div className="flex items-start space-x-3 p-4 bg-[#1E293B] rounded-xl border border-white/5">
          <MapPin className="w-5 h-5 text-civic-blue shrink-0 mt-0.5" />
          <div>
            <span className="block text-[10px] uppercase font-bold tracking-wider text-[#6B7280]">Location</span>
            <span className="text-sm font-medium text-white">{issue.location?.address}</span>
            <span className="block text-xs text-[#9AA3B8] mt-0.5">Ward: {issue.location?.ward}</span>
          </div>
        </div>

        <div className="flex items-center space-x-3 p-4 bg-blue-500/5 rounded-xl border border-blue-500/15">
          <Building className="w-5 h-5 text-blue-400 shrink-0" />
          <div>
            <span className="block text-[10px] uppercase font-bold tracking-wider text-blue-400">Department Routing</span>
            <span className="text-sm font-medium text-white">{issue.routing?.primaryDepartment}</span>
          </div>
        </div>
      </div>

      {/* Resolution Notes Block */}
      {issue.resolution && (
        <div className="p-4 bg-emerald-500/5 border border-emerald-500/15 rounded-xl">
          <span className="block text-[10px] uppercase font-bold tracking-wider text-emerald-400">Resolution Note</span>
          <p className="text-xs text-[#9AA3B8] mt-1 leading-relaxed">{issue.resolution.resolutionNote}</p>
          {issue.resolution.aiVerification?.citizenMessage && (
            <div className="mt-2 text-[10px] text-emerald-400">
              <strong>AI Verification:</strong> {issue.resolution.aiVerification.citizenMessage}
            </div>
          )}
        </div>
      )}

      {/* Citizen Verification Actions */}
      {issue.status === "resolved" && issue.reportedBy === user?.uid && (
        <div className="p-4 bg-[#1E293B] border border-white/5 rounded-2xl space-y-4">
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Confirm Operations Repair</h3>
            <p className="text-xs text-[#9AA3B8] mt-0.5 font-medium leading-relaxed">
              Review before & repaired photos. Confirm if the issue is fully solved.
            </p>
          </div>

          <div className="space-y-2">
            <textarea
              rows={2}
              placeholder="Leave optional comments or inspection feedback..."
              value={citizenComments}
              onChange={(e) => setCitizenComments(e.target.value)}
              className="w-full bg-[#0F172A] border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleVerifyResolution(true)}
              disabled={updating}
              className="flex items-center justify-center gap-1.5 py-2.5 bg-[#16A34A] hover:bg-[#16A34A]/90 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              Approve Repair
            </button>
            <button
              onClick={() => handleVerifyResolution(false)}
              disabled={updating}
              className="flex items-center justify-center gap-1.5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              <XCircle className="w-4 h-4" />
              Reject & Reopen
            </button>
          </div>
        </div>
      )}

      {/* STRICTOR ISSUE LIFECYCLE TIMELINE TRACKING */}
      <div className="pt-4 border-t border-white/5">
        <span className="block text-xs font-bold text-[#9AA3B8] uppercase tracking-wider mb-4">Incident Lifecycle Timeline</span>
        <div className="space-y-4 relative pl-3 ml-2 border-l border-white/5">
          {LIFECYCLE_STAGES.map((stage, stageIdx) => {
            const isActive = stageIdx <= currentStatusIdx;
            const isCurrent = stageIdx === currentStatusIdx;
            const meta = LIFECYCLE_DETAILS[stage];
            
            // Find historic logs matching this stage
            const logs = issue.statusHistory?.filter((h: any) => h.status?.toLowerCase() === stage);
            const latestLog = logs && logs.length > 0 ? logs[logs.length - 1] : null;

            return (
              <div key={stage} className={`relative pb-3 last:pb-0 text-left ${isActive ? "opacity-100" : "opacity-40"}`}>
                {/* Node indicator */}
                <div className={`absolute -left-[20px] top-1 w-3.5 h-3.5 rounded-full border-2 border-[#0F172A] transition-all ${
                  isCurrent ? "bg-[#16A34A] scale-110" : isActive ? "bg-[#16A34A]/60" : "bg-white/5"
                }`} />

                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap leading-none">
                    <span className={`text-xs font-black capitalize ${isCurrent ? "text-[#16A34A]" : "text-white"}`}>
                      {meta.label}
                    </span>
                    {latestLog && (
                      <span className="text-[9px] text-[#6B7280] font-mono font-bold uppercase">
                        {new Date((latestLog.changedAt as any).toDate ? (latestLog.changedAt as any).toDate() : latestLog.changedAt).toLocaleString()}
                      </span>
                    )}
                  </div>
                  
                  <p className="text-[10px] text-[#9AA3B8] font-semibold">{meta.desc}</p>
                  
                  {latestLog && latestLog.note && (
                    <p className="text-[11px] text-[#9AA3B8] bg-white/[0.02] p-2.5 rounded-xl border border-white/5 font-medium leading-relaxed mt-1">
                      {latestLog.note}
                    </p>
                  )}

                  {latestLog && latestLog.officer && (
                    <span className="text-[9px] text-[#6B7280] font-bold block pt-0.5">
                      Responsible Officer: <strong className="text-[#9AA3B8]">{latestLog.officer}</strong> ({latestLog.department || "Municipal Crew"})
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default IssueDetailPage;
