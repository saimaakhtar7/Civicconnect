import React, { useState } from "react";
import { doc, updateDoc, Timestamp } from "firebase/firestore";
import { db } from "../../config/firebase";
import { IssueDocument } from "../../types/issue.types";
import { motion } from "framer-motion";
import { 
  X, MapPin, Building, User, Clock, Brain, Camera, 
  CheckCircle, Play, CheckCircle2 
} from "lucide-react";
import { ISSUE_STATUSES } from "../../config/constants";

interface IssueDetailDrawerProps {
  issue: IssueDocument | null;
  onClose: () => void;
}

export const IssueDetailDrawer: React.FC<IssueDetailDrawerProps> = ({ issue, onClose }) => {
  const [updating, setUpdating] = useState(false);
  const [officerNotes, setOfficerNotes] = useState("");

  if (!issue) return null;

  const severityText = (issue.aiAnalysis?.severity || "medium").toLowerCase();
  const statusMeta = ISSUE_STATUSES.find((s) => s.value === issue.status);
  const mediaUrlObj = issue.mediaUrls?.[0] as any;
  const thumbnail = mediaUrlObj?.original || (typeof mediaUrlObj === "string" ? mediaUrlObj : undefined);
  const createdTime = issue.createdAt 
    ? new Date((issue.createdAt as any).toDate ? (issue.createdAt as any).toDate() : issue.createdAt)
    : new Date();

  // Status mapping colors matching 16. Better Status Colors
  const getStatusStyle = (status: string) => {
    switch (status) {
      case "submitted":
        return "bg-gray-500/10 border-gray-500/20 text-gray-300";
      case "under_ai_review":
        return "bg-purple-500/10 border-purple-500/20 text-purple-300";
      case "assigned":
        return "bg-blue-500/10 border-blue-500/20 text-blue-300";
      case "in_progress":
        return "bg-orange-500/10 border-orange-500/20 text-orange-300";
      case "resolved":
        return "bg-emerald-500/10 border-emerald-500/20 text-emerald-300";
      default:
        return "bg-gray-500/10 border-gray-500/20 text-gray-300";
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    setUpdating(true);
    try {
      const docRef = doc(db, "issues", issue.id);
      
      const newHistoryItem = {
        status: newStatus,
        changedAt: Timestamp.now(),
        changedBy: "Officer Vikram",
        note: officerNotes || "Status updated from operations center."
      };

      const updatedHistory = issue.statusHistory 
        ? [...issue.statusHistory, newHistoryItem]
        : [newHistoryItem];

      await updateDoc(docRef, {
        status: newStatus,
        statusHistory: updatedHistory,
        updatedAt: Timestamp.now()
      });
      setOfficerNotes("");
    } catch (err) {
      console.error("Failed to update status:", err);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
      />

      {/* Drawer Panel */}
      <motion.div 
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 220 }}
        className="relative w-full max-w-lg bg-[#111827] border-l border-[#273244] h-full flex flex-col shadow-2xl z-10 text-left"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#273244] bg-[#1A2332]">
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-[#6B7280] font-mono tracking-wider block">INCIDENT REPORT FILE</span>
            <h2 className="text-[15px] font-semibold text-[#F3F4F6] truncate mt-0.5 font-sans leading-none">
              {issue.id}
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#9CA3AF] hover:text-[#F3F4F6] hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          
          {/* Main Visual Image Card */}
          <div className="relative h-48 w-full bg-[#0A0F17] rounded-xl overflow-hidden border border-[#273244] flex items-center justify-center shrink-0">
            {thumbnail ? (
              <img src={thumbnail} alt="Incident Visual Proof" className="w-full h-full object-cover" />
            ) : (
              <div className="text-center space-y-2 text-[#6B7280]">
                <Camera className="w-8 h-8 mx-auto" />
                <span className="text-xs font-medium block">No Visual Evidence Provided</span>
              </div>
            )}
            
            {/* Severity tag top right */}
            <span className={`absolute top-3 right-3 px-2.5 py-0.5 rounded-full text-[11px] font-bold font-sans capitalize border ${
              severityText === "critical" ? "bg-[#DC2626]/10 border-[#DC2626]/20 text-[#DC2626]" :
              severityText === "high" ? "bg-[#F59E0B]/10 border-[#F59E0B]/20 text-[#F59E0B]" :
              "bg-[#16A34A]/10 border-[#16A34A]/25 text-[#16A34A]"
            }`}>
              {severityText} Priority
            </span>
          </div>

          {/* Incident Headers */}
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-[#F3F4F6] leading-tight font-sans">
              {issue.aiAnalysis?.subcategory || "General Triage Required"}
            </h3>
            <p className="text-xs text-[#9CA3AF] leading-relaxed font-sans">
              {issue.userDescription || "No initial citizen description provided."}
            </p>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 gap-3.5">
            <div className="bg-[#1A2332] border border-[#273244] p-3 rounded-xl space-y-1">
              <span className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider block">AI Confidence Score</span>
              <div className="flex items-center gap-1.5 text-[#16A34A] text-sm font-bold">
                <Brain className="w-4 h-4 text-[#16A34A]" /> {issue.aiAnalysis?.confidence || 90}% Confident
              </div>
            </div>
            <div className="bg-[#1A2332] border border-[#273244] p-3 rounded-xl space-y-1">
              <span className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider block">Estimated SLA Target</span>
              <div className="flex items-center gap-1.5 text-[#F3F4F6] text-sm font-bold">
                <Clock className="w-4 h-4 text-[#9CA3AF]" /> {issue.priority?.estimatedSLAHours || 24} hrs Remaining
              </div>
            </div>
          </div>

          {/* Metadata Fields Section */}
          <div className="bg-[#1A2332] border border-[#273244] rounded-xl p-4.5 space-y-3.5 text-xs text-[#9CA3AF]">
            <div className="flex items-center justify-between pb-2.5 border-b border-[#273244]/55">
              <span className="font-semibold text-[#6B7280]">Status State:</span>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider border ${getStatusStyle(issue.status)}`}>
                {statusMeta?.label || issue.status}
              </span>
            </div>

            <div className="flex items-start justify-between">
              <span className="font-semibold text-[#6B7280] shrink-0">GIS Coordinates:</span>
              <span className="font-mono text-right text-[#F3F4F6]">
                {issue.location?.lat.toFixed(5)}, {issue.location?.lng.toFixed(5)}
              </span>
            </div>

            <div className="flex items-start justify-between gap-4">
              <span className="font-semibold text-[#6B7280] shrink-0">Geographic Ward:</span>
              <span className="font-bold text-right text-[#F3F4F6] flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-[#9CA3AF]" /> {issue.location?.ward || "Pune Central"}
              </span>
            </div>

            <div className="flex items-start justify-between gap-4">
              <span className="font-semibold text-[#6B7280] shrink-0">Exact Address:</span>
              <span className="text-right text-[#F3F4F6] font-medium leading-tight">
                {issue.location?.address}
              </span>
            </div>

            <div className="flex items-start justify-between">
              <span className="font-semibold text-[#6B7280] shrink-0">Assigned Agency:</span>
              <span className="font-bold text-[#2563EB] flex items-center gap-1 bg-[#2563EB]/5 border border-[#2563EB]/25 px-2 py-0.5 rounded-lg">
                <Building className="w-3.5 h-3.5 text-[#2563EB]" /> {issue.routing?.primaryDepartment || "Triage Core"}
              </span>
            </div>

            <div className="flex items-start justify-between">
              <span className="font-semibold text-[#6B7280] shrink-0">Assigned Dispatcher:</span>
              <span className="font-bold text-[#F3F4F6] flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-[#9CA3AF]" /> {issue.routing?.assignedOfficerId ? "Officer Vikram" : "Unassigned"}
              </span>
            </div>

            <div className="flex items-start justify-between">
              <span className="font-semibold text-[#6B7280] shrink-0">Report Registered:</span>
              <span className="font-mono text-right text-[#F3F4F6]">
                {createdTime.toLocaleDateString()} {createdTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>

          {/* AI Decision Analysis Council Details */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider block">AI Decision Summary (Consensus)</span>
            <div className="bg-[#1A2332]/50 border border-[#273244] rounded-xl p-4.5 text-xs text-[#9CA3AF] leading-relaxed">
              {issue.aiAnalysis?.aiDescription || "AI analysis completed. No logs recorded."}
            </div>
          </div>

          {/* Timeline Tracking */}
          <div className="space-y-3">
            <span className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider block">Incident Lifecycle Timeline</span>
            <div className="relative border-l border-[#273244] ml-2 pl-4 space-y-4 text-xs text-left">
              {issue.statusHistory?.map((hist, idx) => {
                const histTime = hist.changedAt 
                  ? new Date((hist.changedAt as any).toDate ? (hist.changedAt as any).toDate() : hist.changedAt)
                  : new Date();
                return (
                  <div key={idx} className="relative">
                    <span className="absolute -left-6.5 top-0.5 bg-[#111827] border border-[#273244] text-[#9CA3AF] h-4 w-4 rounded-full flex items-center justify-center font-bold text-[8px] z-10">
                      {idx + 1}
                    </span>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#F3F4F6] capitalize">{hist.status.replace("_", " ")}</span>
                        <span className="text-[10px] text-[#6B7280] font-mono">
                          {histTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#9CA3AF] leading-normal">{hist.note}</p>
                      <span className="text-[9px] text-[#6B7280] font-semibold block">Actor: {hist.changedBy}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Action Panel Footer */}
        <div className="p-4 bg-[#1A2332] border-t border-[#273244] space-y-3">
          
          {/* Notes Input */}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Append log note before status action..."
              value={officerNotes}
              onChange={(e) => setOfficerNotes(e.target.value)}
              className="flex-1 bg-[#0A0F17] border border-[#273244] rounded-xl px-3 py-2 text-xs font-semibold text-[#F3F4F6] placeholder-[#6B7280] focus:outline-none focus:border-[#16A34A]/50 transition-colors"
            />
          </div>

          {/* Primary Operations Buttons */}
          <div className="flex gap-2.5">
            {issue.status === "submitted" && (
              <button 
                onClick={() => handleUpdateStatus("assigned")}
                disabled={updating}
                className="flex-1 py-2 bg-[#2563EB] hover:bg-[#2563EB]/90 text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" /> Acknowledge & Assign
              </button>
            )}
            
            {issue.status === "assigned" && (
              <button 
                onClick={() => handleUpdateStatus("in_progress")}
                disabled={updating}
                className="flex-1 py-2 bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Play className="w-4 h-4 fill-current" /> Dispatch Repair Crew
              </button>
            )}

            {issue.status === "in_progress" && (
              <button 
                onClick={() => handleUpdateStatus("resolved")}
                disabled={updating}
                className="flex-1 py-2 bg-[#16A34A] hover:bg-[#16A34A]/90 text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <CheckCircle className="w-4 h-4" /> Resolve Incident
              </button>
            )}

            {issue.status === "resolved" && (
              <div className="w-full text-center py-2 bg-[#16A34A]/10 border border-[#16A34A]/25 text-[#16A34A] text-xs font-bold rounded-xl select-none">
                ✓ Incident Resolved - Awaiting Citizen Closeout
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
export default IssueDetailDrawer;
