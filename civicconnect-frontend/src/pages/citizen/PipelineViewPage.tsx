import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../../config/firebase";
import {
  Loader2, Cpu, ArrowLeft, Activity
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface IssueData {
  id: string;
  aiSummary?: {
    category?: string;
    subcategory?: string;
    severity?: "critical" | "high" | "medium" | "low";
    confidence?: number;
    department?: string;
    executiveSummary?: string;
    duplicateProbability?: number;
    safetyLevel?: string;
    priorityScore?: number;
    validatorStatus?: "passed" | "failed";
    completedAt?: any;
  } | null;
  aiAnalysis?: any;
  priority?: any;
  routing?: any;
  createdAt?: any;
  updatedAt?: any;
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

// Main PipelineViewPage
// ─────────────────────────────────────────────────────────────────────────────
export const PipelineViewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [issueData, setIssueData] = useState<IssueData | null>(null);
  const [loading, setLoading] = useState(true);
  const unsubRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    const issueRef = doc(db, "issues", id);
    unsubRef.current = onSnapshot(issueRef, (snap) => {
      if (snap.exists()) {
        setIssueData({ id: snap.id, ...snap.data() } as IssueData);
      }
      setLoading(false);
    });
    return () => unsubRef.current?.();
  }, [id]);

  const aiSummary = issueData?.aiSummary;
  const summaryComplete = aiSummary != null;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-3">
        <Loader2 className="w-8 h-8 text-civic-blue animate-spin" />
        <p className="text-sm text-gray-500">Loading AI Council Session...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6 pb-24">
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center text-sm text-gray-500 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back
      </button>

      {/* Header */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white rounded-2xl p-5">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Activity className="w-5 h-5 text-purple-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-purple-300">AI City Council</span>
            </div>
            <h1 className="text-lg font-bold">Issue #{id?.slice(0, 8)}</h1>
            <p className="text-sm text-gray-400 mt-0.5">
              {aiSummary?.subcategory || issueData?.aiAnalysis?.subcategory || "Community Issue"} · AI Summary
            </p>
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-bold ${
            summaryComplete ? "bg-emerald-500/20 text-emerald-400" :
            "bg-gray-700 text-gray-400"
          }`}>
            {summaryComplete ? "✓ AI Summary Complete" : "○ Awaiting Summary"}
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <Cpu className="w-4 h-4 text-purple-500" />
          <h2 className="text-sm font-bold text-gray-900">AI Summary</h2>
        </div>
        {aiSummary ? (
          <>
            <p className="text-sm text-gray-700 leading-relaxed">
              {aiSummary.executiveSummary || issueData?.aiAnalysis?.aiDescription || "AI summary is complete for this issue."}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
                <p className="text-[10px] uppercase tracking-wider text-gray-400">Category</p>
                <p className="text-sm font-bold text-gray-900 mt-1">{aiSummary.category || issueData?.aiAnalysis?.category || "N/A"}</p>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
                <p className="text-[10px] uppercase tracking-wider text-gray-400">Subcategory</p>
                <p className="text-sm font-bold text-gray-900 mt-1">{aiSummary.subcategory || issueData?.aiAnalysis?.subcategory || "N/A"}</p>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
                <p className="text-[10px] uppercase tracking-wider text-gray-400">Severity</p>
                <p className="text-sm font-bold text-gray-900 mt-1">{aiSummary.severity || issueData?.aiAnalysis?.severity || "N/A"}</p>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
                <p className="text-[10px] uppercase tracking-wider text-gray-400">Confidence</p>
                <p className="text-sm font-bold text-gray-900 mt-1">{aiSummary.confidence != null ? `${aiSummary.confidence}%` : "N/A"}</p>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
                <p className="text-[10px] uppercase tracking-wider text-gray-400">Department</p>
                <p className="text-sm font-bold text-gray-900 mt-1">{aiSummary.department || issueData?.routing?.primaryDepartment || "N/A"}</p>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
                <p className="text-[10px] uppercase tracking-wider text-gray-400">Duplicate Risk</p>
                <p className="text-sm font-bold text-gray-900 mt-1">{aiSummary.duplicateProbability != null ? `${aiSummary.duplicateProbability}%` : "N/A"}</p>
              </div>
            </div>
            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 text-sm text-emerald-800">
              <p className="font-bold">Validator Status</p>
              <p>{aiSummary.validatorStatus === "passed" ? "Pass" : aiSummary.validatorStatus === "failed" ? "Fail" : "Unknown"}</p>
            </div>
          </>
        ) : (
          <div className="text-gray-500 text-sm">
            AI summary is not yet available. The browser pipeline is still processing the report, or the issue has not been analyzed yet.
          </div>
        )}
      </div>
    </div>
  );
};

export default PipelineViewPage;
