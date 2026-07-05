import React, { useState, useRef } from "react";
import { useReportStore } from "../../../stores/reportStore";
import { useAuthStore } from "../../../stores/authStore";
import { auth } from "../../../config/firebase";
import { CloudinaryService } from "../../../services/cloudinaryService";
import { IssueService } from "../../../services/issueService";
import { AgentOrchestrator } from "../../../services/ai/orchestrator";
import { useNotificationStore } from "../../../stores/notificationStore";
import { Button } from "../../ui/button";
import { SeverityBadge } from "../../ui/SeverityBadge";
import { ArrowLeft, CheckCircle2, Loader2, MapPin, Building, Camera, Eye, EyeOff } from "lucide-react";
import { nanoid } from "nanoid";
import { useNavigate } from "react-router-dom";
import { UploadState } from "../../../types/report.types";
import UploadProgress from "../media/UploadProgress";

interface Step5ReviewProps {
  onBack: () => void;
}

export const Step5Review: React.FC<Step5ReviewProps> = ({ onBack }) => {
  const { draft, resetDraft } = useReportStore();
  const { user } = useAuthStore();
  const { addNotification } = useNotificationStore();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [uploadState, setUploadState] = useState<UploadState>({ progress: 0, status: "idle" });
  const [submitError, setSubmitError] = useState<string | null>(null);
  const cancelRef = useRef<(() => void) | null>(null);

  React.useEffect(() => {
    return () => {
      if (cancelRef.current) {
        cancelRef.current();
      }
    };
  }, []);

  const analysis = draft.aiAnalysis;
  const location = draft.location;
  const media = draft.media;

  const severityLevelMap = { critical: 0, high: 1, medium: 2, low: 3 };
  const severityLevel = severityLevelMap[analysis?.severity as keyof typeof severityLevelMap] ?? 2;
  const isGuest = auth.currentUser?.isAnonymous ?? false;

  const handleSubmit = async () => {
    const currentUid = user?.uid || auth.currentUser?.uid || null;
    const reporterName = user?.displayName || auth.currentUser?.displayName || "Citizen";
    const reporterTrustScore = user?.trust?.score || 0;

    if (!media || !location || !analysis) {
      setSubmitError("Missing required information. Please go back and complete all steps.");
      return;
    }

    if (!currentUid && !draft.isAnonymous) {
      setSubmitError("You must sign in or continue as anonymous before submitting.");
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    setUploadState({ progress: 0, status: "compressing" });

    const issueId = nanoid(10);

    try {
      setUploadState({ progress: 5, status: "uploading" });

      const { promise: uploadPromise, cancel } = CloudinaryService.uploadImage(
        media.file,
        (progress) => {
          console.debug("[Step5Review] upload progress", progress);
          setUploadState((prev) => ({ ...prev, progress, status: "uploading" }));
        }
      );

      cancelRef.current = cancel;
      const mediaUrl = await uploadPromise;

      setUploadState({ progress: 100, status: "completed" });
      console.debug("[Step5Review] upload completed", mediaUrl);

      // Step 2: Write to Firestore
      const submittedId = await IssueService.submitIssue(
        currentUid,
        reporterName,
        reporterTrustScore,
        draft,
        mediaUrl,
        issueId
      );

      // Trigger the frontend AI pipeline after the issue document is created in Firestore.
      console.log("[Pipeline] about to create AgentOrchestrator", { issueId: submittedId, path: `issues/${submittedId}` });
      const orchestrator = new AgentOrchestrator(submittedId, (agentId, status, details) => {
        console.debug(`[Pipeline] ${agentId} ${status}`, details);
      });
      console.log("[Pipeline] orchestrator instantiated", { issueId: submittedId });
      console.log("[Pipeline] about to run orchestrator", { issueId: submittedId });
      try {
        await orchestrator.run({
        ...draft,
        location: {
          lat: location.lat,
          lng: location.lng,
          address: location.address,
          ward: location.ward,
          city: location.city,
        },
        aiAnalysis: {
          category: analysis.category,
          subcategory: analysis.subcategory,
          severity: analysis.severity,
          aiDescription: analysis.description,
          confidence: analysis.confidence,
          contextFactors: analysis.contextFactors,
          urgencyReason: analysis.urgencyReason,
          departmentSuggestion: analysis.departmentSuggestion,
          processingTimeMs: analysis.processingTimeMs,
          detectedObjects: analysis.detectedObjects,
          possibleHazards: analysis.possibleHazards,
        },
        nearbyIssues: [],
      });
      console.log("[Pipeline] orchestrator.run completed", { issueId: submittedId });
      } catch (pipelineError) {
        console.error("AI pipeline failed to start:", pipelineError);
        addNotification({
          type: "error",
          title: "AI Processing Error",
          message: "The issue was submitted, but AI analysis could not start. Please refresh the page to retry.",
        });
      }

      addNotification({
        type: "ai",
        title: "Issue Submitted",
        message: "Your report is now being analysed by the AI City Council. Watch the live session!",
        issueId: submittedId,
      });

      // Success — reset store, navigate to pipeline viewer
      resetDraft();
      navigate(`/app/report/${submittedId}/pipeline`);
    } catch (err: any) {
      console.error("Submission failed:", err);
      setSubmitError(err.message || "Submission failed. Please try again.");
      setUploadState((prev) => ({ ...prev, status: "failed", error: err.message || "Upload failed" }));

      setSubmitting(false);
    } finally {
      cancelRef.current = null;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-gray-900">Review Your Report</h2>
        <p className="text-sm text-gray-500 mt-1">
          Check all details before submission. Your report will be sent to the relevant department immediately.
        </p>
      </div>

      {/* Media Preview */}
      {media && (
        <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-black aspect-video max-h-56">
          {media.type === "video" ? (
            <video src={media.blobUrl} className="w-full h-full object-contain" playsInline muted />
          ) : (
            <img src={media.blobUrl} alt="Issue Preview" className="w-full h-full object-contain" />
          )}
          <div className="absolute bottom-3 left-3 flex items-center space-x-2 bg-black/60 backdrop-blur text-white text-xs px-2 py-1 rounded-full">
            <Camera className="w-3 h-3" />
            <span>{(media.sizeBytes / (1024 * 1024)).toFixed(2)} MB</span>
          </div>
        </div>
      )}

      {isGuest && (
        <div className="rounded-2xl border border-amber-300/20 bg-amber-50/80 p-4 text-sm text-amber-900">
          <strong>Guest Mode active</strong>. You can still submit this report, but signing in with Google will preserve your profile and report history.
        </div>
      )}

      {/* AI Summary Card */}
      {analysis && (
        <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-sm space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-bold text-gray-900 text-sm">{analysis.title}</h3>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">{analysis.description}</p>
            </div>
            <div className="shrink-0">
              <SeverityBadge level={severityLevel as any} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs border-t border-gray-100 pt-3">
            <div>
              <span className="block text-gray-400 uppercase font-bold tracking-wider text-[10px]">Category</span>
              <span className="font-semibold text-gray-800 capitalize">{analysis.category?.replace(/_/g, " ")}</span>
            </div>
            <div>
              <span className="block text-gray-400 uppercase font-bold tracking-wider text-[10px]">Confidence</span>
              <span className="font-semibold text-gray-800">{analysis.confidence}%</span>
            </div>
          </div>
        </div>
      )}

      {/* Location */}
      {location && (
        <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
          <MapPin className="w-5 h-5 text-civic-blue shrink-0 mt-0.5" />
          <div>
            <span className="block text-[10px] uppercase font-bold tracking-wider text-gray-400">Location</span>
            <span className="text-sm font-medium text-gray-900">{location.address}</span>
            <span className="block text-xs text-gray-500 mt-0.5">Ward: {location.ward} · {location.city}</span>
          </div>
        </div>
      )}

      {/* Department */}
      {analysis?.departmentSuggestion && (
        <div className="flex items-center space-x-3 p-4 bg-blue-50/50 rounded-xl border border-blue-100">
          <Building className="w-5 h-5 text-civic-blue shrink-0" />
          <div>
            <span className="block text-[10px] uppercase font-bold tracking-wider text-blue-400">Routing To</span>
            <span className="text-sm font-medium text-blue-900">{analysis.departmentSuggestion}</span>
          </div>
        </div>
      )}

      {/* Anonymous indicator */}
      <div className="flex items-center space-x-2 text-xs text-gray-500 px-1">
        {draft.isAnonymous ? (
          <><EyeOff className="w-4 h-4" /><span>Submitting as anonymous</span></>
        ) : (
          <><Eye className="w-4 h-4 text-civic-blue" /><span>Submitting as {user?.displayName || "Citizen"}</span></>
        )}
      </div>

      {/* Upload Progress */}
      <UploadProgress state={uploadState} />

      {/* Error */}
      {submitError && (
        <div className="p-3 text-xs text-red-700 bg-red-50 border border-red-100 rounded-xl">
          {submitError}
        </div>
      )}

      <div className="flex justify-between pt-4 border-t border-gray-100">
        <Button variant="outline" onClick={onBack} disabled={submitting}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={submitting || !media || !location || !analysis}
          className="px-6 bg-civic-blue hover:bg-civic-blue-dark"
        >
          {submitting ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Submitting...</>
          ) : (
            <><CheckCircle2 className="w-4 h-4 mr-2" />Submit Report</>
          )}
        </Button>
      </div>
    </div>
  );
};
export default Step5Review;
