import React, { useCallback, useState } from "react";
import { useReportStore } from "../../../stores/reportStore";
import { useAuthStore } from "../../../stores/authStore";
import { useNotificationStore } from "../../../stores/notificationStore";
import { db } from "../../../config/firebase";
import { collection, query, where, getDocs, updateDoc, doc, increment, arrayUnion } from "firebase/firestore";
import { DuplicateDetectionService, DuplicateCheckResult } from "../../../services/duplicateDetectionService";
import LocationPicker from "../location/LocationPicker";
import { LocationSelection } from "../../../types/report.types";
import { Button } from "../../ui/button";
import { ArrowLeft, ArrowRight, AlertTriangle, ThumbsUp, ExternalLink, Loader2 } from "lucide-react";
import { IssueDocument } from "../../../types/issue.types";

interface Step3LocationProps {
  onNext: () => void;
  onBack: () => void;
}

export const Step3Location: React.FC<Step3LocationProps> = ({ onNext, onBack }) => {
  const { draft, setDraftLocation, resetDraft } = useReportStore();
  const { user, setUser } = useAuthStore();
  const { addNotification } = useNotificationStore();

  const [checking, setChecking] = useState(false);
  const [duplicateCheckResult, setDuplicateCheckResult] = useState<DuplicateCheckResult | null>(null);
  const [matchedIssue, setMatchedIssue] = useState<any | null>(null);

  const handleLocationVerified = useCallback(
    (selection: LocationSelection) => {
      setDraftLocation(selection);
    },
    [setDraftLocation]
  );

  const handleContinue = async () => {
    if (!draft.location || !draft.aiAnalysis) return;
    setChecking(true);

    try {
      // Query unresolved issues from Firestore
      const issuesRef = collection(db, "issues");
      const q = query(issuesRef, where("status", "in", ["submitted", "assigned", "in_progress"]));
      const snap = await getDocs(q);
      const existingIssues = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as IssueDocument[];

      // Check duplicates
      const checkResult = DuplicateDetectionService.checkForDuplicates(
        {
          category: draft.aiAnalysis.category,
          location: { lat: draft.location.lat, lng: draft.location.lng },
          userDescription: draft.userDescription
        },
        existingIssues
      );

      if (checkResult.isDuplicate && checkResult.confidence >= 70) {
        setDuplicateCheckResult(checkResult);
        // Find details of the top matched issue
        const matched = existingIssues.find((i) => i.id === checkResult.matchedIssueIds[0]);
        setMatchedIssue(matched || null);
      } else {
        onNext();
      }
    } catch (err) {
      console.error("Duplicate check failed:", err);
      onNext(); // Proceed anyway on error for resilient UX
    } finally {
      setChecking(false);
    }
  };

  const handleSupportExisting = async () => {
    if (!matchedIssue || !user) return;
    setChecking(true);
    try {
      const issueRef = doc(db, "issues", matchedIssue.id);
      
      const alreadySupported = matchedIssue.supportedBy?.includes(user.uid);
      if (alreadySupported) {
        addNotification({
          type: "info",
          title: "Already Supported",
          message: "You are already supporting this issue."
        });
        resetDraft();
        return;
      }

      await updateDoc(issueRef, {
        supportCount: increment(1),
        supportedBy: arrayUnion(user.uid),
        "metrics.upvoteCount": increment(1),
        // Boost priority score dynamically by 10 points per support up to a ceiling of 100
        "priority.score": increment(10)
      });

      // Update local user stats (reputation and XP up)
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        "trust.score": increment(2),
        "trust.verificationContributions": increment(1)
      });

      setUser({
        ...user,
        trust: {
          ...user.trust,
          score: (user.trust?.score || 85) + 2,
          verificationContributions: (user.trust?.verificationContributions || 0) + 1
        }
      } as any);

      addNotification({
        type: "success",
        title: "Issue Supported!",
        message: "You have supported this existing report instead of creating a duplicate. +20 XP awarded."
      });

      resetDraft();
      window.location.href = "/";
    } catch (err) {
      console.error("Failed to support existing issue:", err);
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="space-y-6 text-left">
      <div>
        <h2 className="text-lg font-bold text-gray-900">Pin the Location</h2>
        <p className="text-sm text-gray-500 mt-1">
          Use GPS, search an address, or drag the pin on the map to mark the exact issue location.
        </p>
      </div>

      <LocationPicker
        onLocationVerified={handleLocationVerified}
        initialSelection={draft.location}
      />

      {/* Duplicate Dialog Overlay */}
      {duplicateCheckResult && matchedIssue && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#1E293B] border border-white/10 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 text-left">
            <div className="flex items-center gap-2.5 text-orange-400">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-black text-white">Duplicate Report Detected</h3>
            </div>
            
            <p className="text-xs text-[#9AA3B8] font-semibold leading-relaxed">
              This issue appears to have already been reported nearby with a{" "}
              <strong className="text-orange-400 font-bold">{duplicateCheckResult.confidence}% confidence score</strong>.
            </p>

            <div className="bg-[#0F172A] border border-white/5 p-4 rounded-2xl space-y-2.5 text-xs text-[#9AA3B8]">
              <span className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider block">Existing Incident Details</span>
              <div className="space-y-1">
                <span className="block text-white font-bold leading-tight">
                  {matchedIssue.aiAnalysis?.subcategory || matchedIssue.title || "Civic Incident"}
                </span>
                <span className="block text-[11px] text-[#6B7280] font-semibold">{matchedIssue.location?.address}</span>
              </div>
              <p className="text-[11px] italic leading-normal">
                "{matchedIssue.userDescription || matchedIssue.aiAnalysis?.aiDescription}"
              </p>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <Button onClick={handleSupportExisting} disabled={checking} className="w-full bg-[#16A34A] hover:bg-[#16A34A]/90 text-white font-bold text-xs flex items-center justify-center gap-1.5 py-2.5">
                <ThumbsUp className="w-4 h-4" /> Support Existing Issue
              </Button>
              <Button
                variant="outline"
                onClick={() => window.open(`/issues/${matchedIssue.id}`, "_blank")}
                className="w-full border-white/10 text-white hover:bg-white/5 text-xs font-bold flex items-center justify-center gap-1.5 py-2.5"
              >
                <ExternalLink className="w-4 h-4" /> View Existing Report
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setDuplicateCheckResult(null);
                  onNext();
                }}
                className="w-full bg-white/5 hover:bg-white/10 text-white text-xs font-bold py-2.5"
              >
                Continue Anyway
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between pt-4 border-t border-gray-100">
        <Button variant="outline" onClick={onBack} disabled={checking}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Button onClick={handleContinue} disabled={!draft.location || checking} className="px-6 bg-civic-blue hover:bg-civic-blue-dark text-white font-bold">
          {checking ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <>
              Continue
              <ArrowRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default Step3Location;
