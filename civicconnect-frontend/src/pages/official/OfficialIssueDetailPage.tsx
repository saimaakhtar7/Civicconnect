import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "../../config/firebase";
import { IssueDocument } from "../../types/issue.types";
import { IssueStatus } from "../../types/user.types";
import { useAuthStore } from "../../stores/authStore";
import { useNotificationStore } from "../../stores/notificationStore";
import { SeverityBadge } from "../../components/ui/SeverityBadge";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/card";
import { ISSUE_STATUSES } from "../../config/constants";
import BeforeAfterSlider from "../../components/ui/BeforeAfterSlider";
import {
  ArrowLeft, CheckCircle2, Loader2, Wrench, Hammer, Send, Check
} from "lucide-react";
import { Button } from "../../components/ui/button";

export const OfficialIssueDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { addNotification } = useNotificationStore();

  const [issue, setIssue] = useState<IssueDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // Form States
  const [resolutionNote, setResolutionNote] = useState("");
  const [materials, setMaterials] = useState("");
  const [cost, setCost] = useState("");
  const [selectedDept, setSelectedDept] = useState("");

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    const docRef = doc(db, "issues", id);

    const unsubscribe = onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data() as IssueDocument;
        setIssue(data);
        setSelectedDept(data.routing?.primaryDepartment || "");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [id]);

  const handleUpdateStatus = async (newStatus: IssueStatus, noteText: string) => {
    if (!issue || !user) return;
    setUpdating(true);
    try {
      const docRef = doc(db, "issues", issue.id);

      const statusHistoryEntry = {
        status: newStatus,
        changedAt: new Date(),
        changedBy: user.displayName || "Officer",
        note: noteText,
      };

      const updatedHistory = [...(issue.statusHistory || []), statusHistoryEntry];

      await updateDoc(docRef, {
        status: newStatus,
        statusHistory: updatedHistory,
        updatedAt: new Date(),
      });

      addNotification({
        type: "success",
        title: "Status Updated",
        message: `Issue #${issue.id.slice(0, 5)} status changed to ${newStatus}.`,
      });
    } catch (err) {
      console.error("Failed to update status:", err);
    } finally {
      setUpdating(false);
    }
  };

  const handleReassignDepartment = async () => {
    if (!issue || !user) return;
    setUpdating(true);
    try {
      const docRef = doc(db, "issues", issue.id);
      await updateDoc(docRef, {
        "routing.primaryDepartment": selectedDept,
        "routing.routingReason": `Reassigned manually by Officer ${user.displayName}.`,
        updatedAt: new Date(),
      });
      addNotification({
        type: "info",
        title: "Department Reassigned",
        message: `Reassigned to ${selectedDept}.`,
      });
    } catch (err) {
      console.error("Reassign failed:", err);
    } finally {
      setUpdating(false);
    }
  };

  const handleSubmitResolution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!issue || !user) return;
    setUpdating(true);

    // Seed default repaired media if none uploaded (e.g. Pune clean road repair sample)
    const mockAfterUrl = "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&q=80&w=800";

    try {
      const docRef = doc(db, "issues", issue.id);
      const statusHistoryEntry = {
        status: "resolved" as IssueStatus,
        changedAt: new Date(),
        changedBy: user.displayName || "Officer",
        note: `Repairs completed. Materials: ${materials}. Cost: $${cost}. ${resolutionNote}`,
      };

      const resolutionData = {
        resolvedBy: user.uid,
        resolvedAt: new Date(),
        afterMediaUrls: [mockAfterUrl],
        resolutionNote,
        materialsUsed: materials.split(",").map((s) => s.trim()),
        estimatedRepairCost: parseFloat(cost) || 0,
        aiVerification: {
          verdict: "FULLY_RESOLVED",
          confidence: 95,
          citizenMessage: "Visual match confirms successful repavement.",
          qualityScore: 92,
        },
      };

      await updateDoc(docRef, {
        status: "resolved" as IssueStatus,
        statusHistory: [...(issue.statusHistory || []), statusHistoryEntry],
        resolution: resolutionData,
        updatedAt: new Date(),
      });

      addNotification({
        type: "success",
        title: "Issue Resolved",
        message: "Completion notes and details logged. Awaiting citizen confirmation.",
      });
    } catch (err) {
      console.error("Resolution submit failed:", err);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 text-[#22C55E] animate-spin" />
      </div>
    );
  }

  if (!issue) {
    return (
      <div className="text-center py-12 text-[#9AA3B8] font-medium">
        Issue details not found.
      </div>
    );
  }

  const statusMeta = ISSUE_STATUSES.find((s) => s.value === issue.status);
  const beforePhoto = issue.mediaUrls?.[0]?.original;
  const afterPhoto = issue.resolution?.afterMediaUrls?.[0];

  // SLA department lists
  const deptList = [
    "Roads & Infrastructure Department",
    "Pune Municipal Water Supply",
    "MSEDCL — Maharashtra Electricity",
    "PCMC Solid Waste Management",
    "Drainage Department",
    "Pune Garden Department",
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-24">
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-[#9AA3B8] hover:text-white transition-colors cursor-pointer font-semibold"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Issue Queue
      </button>

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#1E293B] border border-white/5 rounded-2xl p-5 shadow-xl">
        <div className="space-y-0.5">
          <span className="text-[10px] font-black text-[#9AA3B8] uppercase tracking-wider block">ID: #{issue.id.slice(0, 8)}</span>
          <h1 className="text-xl font-black text-white">{issue.aiAnalysis?.subcategory || "Civic Incident"}</h1>
          <p className="text-xs text-[#9AA3B8] font-medium">Ward: {issue.location?.ward} · Pune</p>
        </div>
        <div className="flex items-center gap-2">
          <SeverityBadge level={issue.priority?.level as any} />
          {statusMeta && (
            <span className={`text-xs font-black uppercase tracking-wider px-2.5 py-1 rounded-full ${statusMeta.color}`}>
              {statusMeta.label}
            </span>
          )}
        </div>
      </div>

      {/* Before / After Photo Comparison */}
      {issue.status === "resolved" || issue.status === "closed" ? (
        afterPhoto && beforePhoto ? (
          <div className="space-y-2">
            <span className="text-[10px] font-black text-[#9AA3B8] uppercase tracking-wider block">Repair Verification (Before vs Repaired)</span>
            <BeforeAfterSlider beforeImage={beforePhoto} afterImage={afterPhoto} />
          </div>
        ) : null
      ) : (
        beforePhoto && (
          <div className="aspect-video bg-[#0F172A] rounded-2xl overflow-hidden border border-white/5 shadow-xl">
            <img src={beforePhoto} alt="Incident Site" className="w-full h-full object-cover" />
          </div>
        )
      )}

      {/* Triage & Department Re-Routing Card */}
      {issue.status !== "resolved" && issue.status !== "closed" && (
        <Card>
          <CardHeader>
            <CardTitle>Triage &amp; Re-routing</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row items-center gap-4">
            <div className="flex-1 w-full">
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-[12px] px-3 py-2.5 text-xs font-bold text-[#F5F7FA] focus:outline-none focus:ring-2 focus:ring-[#22C55E]/40 cursor-pointer transition-all"
                style={{ background: "rgba(255,255,255,0.03)" }}
              >
                {deptList.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <Button
              onClick={handleReassignDepartment}
              disabled={updating || selectedDept === issue.routing?.primaryDepartment}
              className="w-full sm:w-auto"
            >
              Reassign Dept
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Workflow Timeline Logs */}
      <Card>
        <CardHeader>
          <CardTitle>Lifecycle Audit Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {issue.statusHistory?.map((log, idx) => (
              <div key={idx} className="flex gap-3 items-start relative pb-3 border-l border-white/5 pl-4 last:border-0 last:pb-0">
                <div className="w-3 h-3 rounded-full bg-[#22C55E] shrink-0 mt-1 border-2 border-[#0F172A] absolute -left-1.5" />
                <div className="min-w-0 space-y-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-black text-white capitalize">{log.status}</span>
                    <span className="text-[10px] text-[#9AA3B8] font-semibold">
                      {new Date((log.changedAt as any).toDate ? (log.changedAt as any).toDate() : log.changedAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#9AA3B8] font-medium">Author: {log.changedBy}</p>
                  {log.note && (
                    <p className="text-xs text-[#9AA3B8] bg-white/[0.03] rounded-xl p-2.5 mt-1 border border-white/5 font-medium leading-relaxed">
                      {log.note}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Actions / Lifecycle Operations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Operations Form */}
        {issue.status === "submitted" && (
          <Card className="flex flex-col justify-center items-center p-6 text-center border-dashed border-white/10">
            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-2xl mb-4">
              <Wrench className="w-6 h-6 text-blue-400" />
            </div>
            <h3 className="text-sm font-black text-white">Acknowledge Report</h3>
            <p className="text-xs text-[#9AA3B8] max-w-xs mt-1.5 mb-5 font-medium leading-relaxed">
              Acknowledge this report to assign it to your crew and mark work status as Active.
            </p>
            <Button
              onClick={() => handleUpdateStatus("assigned", "Incident acknowledged by response officer.")}
              disabled={updating}
              className="w-full"
            >
              Start Assignment
            </Button>
          </Card>
        )}

        {issue.status === "assigned" && (
          <Card className="flex flex-col justify-center items-center p-6 text-center border-dashed border-white/10">
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl mb-4">
              <Wrench className="w-6 h-6 text-amber-400" />
            </div>
            <h3 className="text-sm font-black text-white">Initiate Repair Work</h3>
            <p className="text-xs text-[#9AA3B8] max-w-xs mt-1.5 mb-5 font-medium leading-relaxed">
              Mark this ticket status as "In Progress" as physical dispatch repair work begins.
            </p>
            <Button
              onClick={() => handleUpdateStatus("in_progress", "Repair dispatch operations initiated on site.")}
              disabled={updating}
              className="w-full"
            >
              Mark In Progress
            </Button>
          </Card>
        )}

        {/* Resolution Completion Notes Form */}
        {(issue.status === "in_progress" || issue.status === "assigned") && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Hammer className="w-4 h-4 text-[#22C55E]" />
                Submit Resolution Notes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitResolution} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-[#9AA3B8] uppercase tracking-wider block">Materials Used</label>
                    <input
                      type="text"
                      placeholder="e.g. Cold asphalt mix, Gravel"
                      value={materials}
                      onChange={(e) => setMaterials(e.target.value)}
                      required
                      className="w-full bg-white/5 border border-white/10 rounded-[12px] px-3 py-2 text-xs font-semibold text-[#F5F7FA] placeholder-[#9AA3B8]/50 focus:outline-none focus:ring-2 focus:ring-[#22C55E]/40 transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-[#9AA3B8] uppercase tracking-wider block">Repair Cost ($)</label>
                    <input
                      type="number"
                      placeholder="e.g. 150"
                      value={cost}
                      onChange={(e) => setCost(e.target.value)}
                      required
                      className="w-full bg-white/5 border border-white/10 rounded-[12px] px-3 py-2 text-xs font-semibold text-[#F5F7FA] placeholder-[#9AA3B8]/50 focus:outline-none focus:ring-2 focus:ring-[#22C55E]/40 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-[#9AA3B8] uppercase tracking-wider block">Completion Notes</label>
                  <textarea
                    rows={3}
                    placeholder="Enter details of repavement, clearing, or wiring completed..."
                    value={resolutionNote}
                    onChange={(e) => setResolutionNote(e.target.value)}
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-[12px] p-3 text-xs font-semibold text-[#F5F7FA] placeholder-[#9AA3B8]/50 focus:outline-none focus:ring-2 focus:ring-[#22C55E]/40 transition-all resize-none"
                  />
                </div>

                <Button type="submit" disabled={updating} className="w-full">
                  <Send className="w-4 h-4" />
                  Submit Official Resolution
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Resolved State Informer */}
        {issue.status === "resolved" && (
          <Card className="md:col-span-2 p-6 bg-emerald-500/10 border-emerald-500/20 flex flex-col items-center text-center">
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl mb-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
            </div>
            <h3 className="text-sm font-black text-emerald-300">Resolution Submitted</h3>
            <p className="text-xs text-emerald-400/80 max-w-md mt-1.5 font-medium">
              Repairs completed on {new Date(issue.resolution?.resolvedAt ? (issue.resolution.resolvedAt as any).toDate ? (issue.resolution.resolvedAt as any).toDate() : issue.resolution.resolvedAt : new Date()).toLocaleString()}. Citizen reporter has been alerted to review.
            </p>
          </Card>
        )}

        {/* Closed State Informer */}
        {issue.status === "closed" && (
          <Card className="md:col-span-2 p-6 bg-blue-500/10 border-blue-500/20 flex flex-col items-center text-center">
            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-2xl mb-3">
              <Check className="w-6 h-6 text-blue-400" />
            </div>
            <h3 className="text-sm font-black text-blue-300">Ticket Closed &amp; Verified</h3>
            <p className="text-xs text-blue-400/80 max-w-md mt-1.5 font-medium">
              This issue has been verified resolved by the citizen reporter.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
};

export default OfficialIssueDetailPage;
