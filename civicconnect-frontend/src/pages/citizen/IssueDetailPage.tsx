import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, onSnapshot, updateDoc, increment } from "firebase/firestore";
import { db } from "../../config/firebase";
import { IssueDocument } from "../../types/issue.types";
import { IssueStatus } from "../../types/user.types";
import { useAuthStore } from "../../stores/authStore";
import { useNotificationStore } from "../../stores/notificationStore";
import { SeverityBadge } from "../../components/ui/SeverityBadge";
import { ISSUE_STATUSES } from "../../config/constants";
import BeforeAfterSlider from "../../components/ui/BeforeAfterSlider";
import {
  ArrowLeft, MapPin, Building, Cpu, AlertTriangle, Loader2, CheckCircle2, XCircle
} from "lucide-react";
import { Button } from "../../components/ui/button";

export const IssueDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, setUser } = useAuthStore();
  const { addNotification } = useNotificationStore();

  const [issue, setIssue] = useState<IssueDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // Verification Form State
  const [citizenComments, setCitizenComments] = useState("");

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    const docRef = doc(db, "issues", id);

    const unsubscribe = onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        setIssue(snap.data() as IssueDocument);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [id]);

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
      };

      const updatedHistory = [...(issue.statusHistory || []), statusHistoryEntry];

      // Update Issue Document
      await updateDoc(docRef, {
        status: nextStatus,
        statusHistory: updatedHistory,
        updatedAt: new Date(),
      });

      // Award XP & update local store if approved
      if (approved) {
        const userRef = doc(db, "users", user.uid);

        await updateDoc(userRef, {
          "trust.score": increment(5), // Increase trust score by 5
          "trust.totalReports": increment(1),
          "trust.resolutionConfirmations": increment(1),
        });

        // Update local user state
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
        <Loader2 className="w-8 h-8 text-civic-blue animate-spin" />
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

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5 pb-24">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center text-sm text-gray-500 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back
      </button>

      {/* Before / After Slider Comparison */}
      {(issue.status === "resolved" || issue.status === "closed") && afterPhoto && beforePhoto ? (
        <div className="space-y-2">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Repairs Comparison Slider</span>
          <BeforeAfterSlider beforeImage={beforePhoto} afterImage={afterPhoto} />
        </div>
      ) : (
        beforePhoto && (
          <div className="aspect-video bg-black rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
            {issue.mediaUrls[0].type === "video" ? (
              <video src={beforePhoto} controls className="w-full h-full object-contain" playsInline />
            ) : (
              <img src={beforePhoto} alt="Issue location" className="w-full h-full object-cover" />
            )}
          </div>
        )
      )}

      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-xl font-bold text-gray-900 leading-tight">
            {issue.aiAnalysis?.subcategory || "Community Issue"}
          </h1>
          <SeverityBadge level={level as any} />
        </div>
        {statusMeta && (
          <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${statusMeta.color}`}>
            {statusMeta.label}
          </span>
        )}
      </div>

      {/* AI Analysis Briefing */}
      {issue.aiAnalysis?.aiDescription && (
        <div className="p-4 bg-purple-50/50 border border-purple-100 rounded-xl">
          <div className="flex items-center text-xs font-bold text-purple-700 uppercase tracking-wider mb-2">
            <Cpu className="w-3.5 h-3.5 mr-1" />AI Council Deliberation Summaries
          </div>
          <p className="text-xs text-gray-700 leading-relaxed">{issue.aiAnalysis.aiDescription}</p>
        </div>
      )}

      {/* Location Details */}
      <div className="grid grid-cols-1 gap-3">
        <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
          <MapPin className="w-5 h-5 text-civic-blue shrink-0 mt-0.5" />
          <div>
            <span className="block text-[10px] uppercase font-bold tracking-wider text-gray-400">Location</span>
            <span className="text-sm font-medium text-gray-900">{issue.location?.address}</span>
            <span className="block text-xs text-gray-500 mt-0.5">Ward: {issue.location?.ward}</span>
          </div>
        </div>

        <div className="flex items-center space-x-3 p-4 bg-blue-50/40 rounded-xl border border-blue-100">
          <Building className="w-5 h-5 text-civic-blue shrink-0" />
          <div>
            <span className="block text-[10px] uppercase font-bold tracking-wider text-blue-400">Department Routing</span>
            <span className="text-sm font-medium text-blue-900">{issue.routing?.primaryDepartment}</span>
          </div>
        </div>
      </div>

      {/* Resolution Notes Block */}
      {issue.resolution && (
        <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-xl">
          <span className="block text-[10px] uppercase font-bold tracking-wider text-emerald-800">Resolution Note</span>
          <p className="text-xs text-emerald-950 mt-1 leading-relaxed">{issue.resolution.resolutionNote}</p>
          {issue.resolution.aiVerification?.citizenMessage && (
            <div className="mt-2 text-[10px] text-emerald-700">
              <strong>AI Verification:</strong> {issue.resolution.aiVerification.citizenMessage}
            </div>
          )}
        </div>
      )}

      {/* Citizen Verification Actions */}
      {issue.status === "resolved" && issue.reportedBy === user?.uid && (
        <div className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-2xl space-y-4">
          <div>
            <h3 className="text-xs font-bold text-purple-900 uppercase tracking-wider">Confirm Operations Repair</h3>
            <p className="text-xs text-purple-700 mt-0.5">
              Review before & repaired photos. Confirm if the issue is fully solved.
            </p>
          </div>

          <div className="space-y-2">
            <textarea
              rows={2}
              placeholder="Leave optional comments or inspection feedback..."
              value={citizenComments}
              onChange={(e) => setCitizenComments(e.target.value)}
              className="w-full bg-white border border-purple-200 rounded-xl p-3 text-xs focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleVerifyResolution(true)}
              disabled={updating}
              className="flex items-center justify-center gap-1.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" />
              Approve Repair
            </button>
            <button
              onClick={() => handleVerifyResolution(false)}
              disabled={updating}
              className="flex items-center justify-center gap-1.5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-colors"
            >
              <XCircle className="w-4 h-4" />
              Reject & Reopen
            </button>
          </div>
        </div>
      )}

      {/* Timeline Tracking */}
      <div className="pt-4 border-t border-gray-100">
        <span className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Incident Timeline</span>
        <div className="space-y-4">
          {issue.statusHistory?.map((log, idx) => (
            <div key={idx} className="flex gap-3 items-start relative pl-4 border-l border-gray-200 last:border-0 pb-3 last:pb-0">
              <div className="w-2.5 h-2.5 rounded-full bg-gray-400 absolute -left-1.5 border-2 border-white" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-900 capitalize">{log.status}</span>
                  <span className="text-[9px] text-gray-400 font-semibold">
                    {new Date((log.changedAt as any).toDate ? (log.changedAt as any).toDate() : log.changedAt).toLocaleDateString()}
                  </span>
                </div>
                {log.note && <p className="text-[11px] text-gray-500 mt-0.5">{log.note}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default IssueDetailPage;
