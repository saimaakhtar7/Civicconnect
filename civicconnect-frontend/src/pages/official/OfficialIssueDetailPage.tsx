import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, onSnapshot, updateDoc, increment, arrayUnion } from "firebase/firestore";
import { db } from "../../config/firebase";
import { IssueStatus } from "../../types/user.types";
import { useAuthStore } from "../../stores/authStore";
import { useNotificationStore } from "../../stores/notificationStore";
import { SeverityBadge } from "../../components/ui/SeverityBadge";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/card";
import { ISSUE_STATUSES } from "../../config/constants";
import BeforeAfterSlider from "../../components/ui/BeforeAfterSlider";
import {
  ArrowLeft, Loader2, Hammer, Send, Cpu
} from "lucide-react";
import { Button } from "../../components/ui/button";

export const OfficialIssueDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { addNotification } = useNotificationStore();

  const [issue, setIssue] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // Form States
  const [resolutionNote, setResolutionNote] = useState("");
  const [materials, setMaterials] = useState("");
  const [cost, setCost] = useState("");
  const [selectedDept, setSelectedDept] = useState("");
  
  // New workflow states
  const [selectedWorker, setSelectedWorker] = useState("Worker Patil");
  const [estimatedTime, setEstimatedTime] = useState("");
  const [updateNote, setUpdateNote] = useState("");
  const [escalationLevel, setEscalationLevel] = useState("L1");
  const [progressPhoto, setProgressPhoto] = useState("");

  // Simulated AI resolution states
  const [aiSuggestions, setAiSuggestions] = useState<any>(null);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    const docRef = doc(db, "issues", id);

    const unsubscribe = onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setIssue({ id: snap.id, ...data });
        setSelectedDept(data.routing?.primaryDepartment || "");
        setEscalationLevel(data.routing?.escalationLevel || "L1");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [id]);

  // Run Gemini resolution assistance
  const runAiAssistance = () => {
    if (!issue) return;
    setAiLoading(true);
    setTimeout(() => {
      setAiSuggestions({
        impact: "Severe water leakage affecting 30+ residential units nearby.",
        cause: "Pipe fracture due to high municipal pressure overload.",
        equipment: "Hydraulic leak detector, Replacement PVC coupling, PVC Weld glue.",
        resolutionTime: "Estimated repair duration: 4 hours",
        priority: "HIGH (Urgent utility service disruption)"
      });
      setAiLoading(false);
      addNotification({
        type: "ai",
        title: "Gemini Analysis Complete",
        message: "Recommended equipment and causes generated successfully."
      });
    }, 1200);
  };

  const handleUpdateStatus = async (newStatus: IssueStatus, noteText: string, workerName?: string, estTime?: string) => {
    if (updating || !issue || !user) return;
    setUpdating(true);
    try {
      const docRef = doc(db, "issues", issue.id);

      const statusHistoryEntry = {
        status: newStatus,
        changedAt: new Date(),
        changedBy: user.displayName || "Officer",
        note: noteText,
        officer: workerName || user.displayName || "Officer",
        department: selectedDept || issue.routing?.primaryDepartment || "Operations",
        imageUrl: progressPhoto || undefined
      };

      const updatedHistory = [...(issue.statusHistory || []), statusHistoryEntry];

      const updates: Record<string, any> = {
        status: newStatus,
        statusHistory: updatedHistory,
        updatedAt: new Date(),
      };

      if (workerName) updates["routing.assignedWorker"] = workerName;
      if (estTime) updates["routing.estimatedCompletion"] = estTime;
      if (progressPhoto) {
        updates.mediaUrls = arrayUnion({
          original: progressPhoto,
          thumbnail: progressPhoto,
          type: "image"
        });
      }

      await updateDoc(docRef, updates);

      addNotification({
        type: "success",
        title: "Lifecycle Updated",
        message: `Issue status progressed to "${newStatus}".`,
      });
      setUpdateNote("");
      setProgressPhoto("");
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

  const handleEscalate = async () => {
    if (!issue || !user) return;
    setUpdating(true);
    try {
      const docRef = doc(db, "issues", issue.id);
      await updateDoc(docRef, {
        "routing.escalationLevel": escalationLevel,
        "priority.score": increment(15), // Escalate increases priority score by 15
        updatedAt: new Date(),
      });
      addNotification({
        type: "warning",
        title: "Issue Escalated",
        message: `Incident escalated to level ${escalationLevel}.`
      });
    } catch (err) {
      console.error("Escalation failed:", err);
    } finally {
      setUpdating(false);
    }
  };

  const handleSubmitResolution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!issue || !user) return;
    setUpdating(true);

    const mockAfterUrl = "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&q=80&w=800";

    try {
      const docRef = doc(db, "issues", issue.id);
      const statusHistoryEntry = {
        status: "resolved" as IssueStatus,
        changedAt: new Date(),
        changedBy: user.displayName || "Officer",
        note: `Repairs completed. Materials: ${materials}. Cost: $${cost}. ${resolutionNote}`,
        officer: selectedWorker || user.displayName || "Officer",
        department: selectedDept || issue.routing?.primaryDepartment || "Operations",
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
        message: "Completion notes logged. Awaiting citizen approval.",
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

  // Worker lists
  const workers = [
    { name: "Worker Patil", role: "Utility Inspector", activeIssues: 2 },
    { name: "Plumber Shinde", role: "Water Technician", activeIssues: 4 },
    { name: "Electrician Kulkarni", role: "Wired Electrician", activeIssues: 1 },
    { name: "Engineer Deshmukh", role: "Civic Planner", activeIssues: 3 }
  ];

  const selectedWorkerInfo = workers.find((w) => w.name === selectedWorker);

  // Departments List
  const deptList = [
    "Roads & Infrastructure Department",
    "Pune Municipal Water Supply",
    "MSEDCL — Maharashtra Electricity",
    "PCMC Solid Waste Management",
    "Drainage Department",
    "Pune Garden Department",
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-28 text-left">
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-[#9AA3B8] hover:text-white transition-colors cursor-pointer font-semibold"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Issue Queue
      </button>

      {/* Header Info */}
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

      {/* Before / After Slider Comparison */}
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
        <Card className="bg-[#1E293B] border border-white/5 shadow-md p-5 space-y-4">
          <CardHeader className="p-0 border-b border-white/5 pb-2.5">
            <CardTitle className="text-sm font-black text-white uppercase tracking-wider">Triage, Routing &amp; Escalation</CardTitle>
          </CardHeader>
          <CardContent className="p-0 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Department reassign */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">Department Assignment</label>
                <div className="flex gap-2">
                  <select
                    value={selectedDept}
                    onChange={(e) => setSelectedDept(e.target.value)}
                    className="flex-1 bg-[#0F172A] border border-white/10 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-[#22C55E]"
                  >
                    {deptList.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                  <Button onClick={handleReassignDepartment} className="bg-white/5 border border-white/10 text-xs font-semibold text-white hover:bg-white/10 py-2 h-auto">
                    Reassign
                  </Button>
                </div>
              </div>

              {/* Escalation Level */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">Escalation Tier</label>
                <div className="flex gap-2">
                  <select
                    value={escalationLevel}
                    onChange={(e) => setEscalationLevel(e.target.value)}
                    className="flex-1 bg-[#0F172A] border border-white/10 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-orange-500"
                  >
                    <option value="L1">L1 - Ward Supervisor</option>
                    <option value="L2">L2 - Senior Engineer</option>
                    <option value="L3">L3 - Commissioner Office</option>
                  </select>
                  <Button onClick={handleEscalate} className="bg-orange-600 hover:bg-orange-700 text-xs font-bold text-white py-2 h-auto">
                    Escalate
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI RESOLUTION GENERATION ASSISTANT */}
      <Card className="bg-[#1E293B] border border-white/5 shadow-md p-5 space-y-4">
        <CardHeader className="p-0 border-b border-white/5 pb-2.5 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-1.5">
            <Cpu className="w-4 h-4 text-purple-400" /> AI Resolution Assistant
          </CardTitle>
          <Button onClick={runAiAssistance} disabled={aiLoading} className="bg-purple-600 hover:bg-purple-700 text-[10px] font-bold py-1 px-3 h-auto">
            {aiLoading ? "Generating..." : "Generate AI Advice"}
          </Button>
        </CardHeader>
        <CardContent className="p-0 text-xs text-[#9AA3B8] space-y-3 font-medium">
          {aiSuggestions ? (
            <div className="space-y-2.5 animate-card-slide-up">
              <div>
                <strong className="text-purple-400 block mb-0.5">Estimated Impact & Cause</strong>
                <span>{aiSuggestions.impact} ({aiSuggestions.cause})</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1.5 border-t border-white/5">
                <div>
                  <strong className="text-purple-400 block mb-0.5">Required Equipment</strong>
                  <span>{aiSuggestions.equipment}</span>
                </div>
                <div>
                  <strong className="text-purple-400 block mb-0.5">Priority & SLA Time</strong>
                  <span>{aiSuggestions.priority} · {aiSuggestions.resolutionTime}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-4 flex flex-col items-center justify-center">
              <Cpu className="w-8 h-8 text-purple-500/20 mb-2" />
              <span>Click "Generate AI Advice" to load Gemini repair recommendations.</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Assignment workflow fields */}
      {issue.status !== "resolved" && issue.status !== "closed" && (
        <Card className="bg-[#1E293B] border border-white/5 shadow-md p-5 space-y-4">
          <CardHeader className="p-0 border-b border-white/5 pb-2.5">
            <CardTitle className="text-sm font-black text-white uppercase tracking-wider">Department Assignment Workflow</CardTitle>
          </CardHeader>
          <CardContent className="p-0 space-y-4 text-xs text-[#9AA3B8]">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Select worker */}
              <div className="space-y-1.5">
                <label className="font-semibold block text-white">Assign Dispatch Crew/Worker</label>
                <select
                  value={selectedWorker}
                  onChange={(e) => setSelectedWorker(e.target.value)}
                  className="w-full bg-[#0F172A] border border-white/10 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-[#22C55E]"
                >
                  {workers.map((w) => (
                    <option key={w.name} value={w.name}>
                      {w.name} ({w.role})
                    </option>
                  ))}
                </select>
                {selectedWorkerInfo && (
                  <span className="text-[10px] text-emerald-400 font-bold block mt-1">
                    Workload: {selectedWorkerInfo.activeIssues} active tasks in progress
                  </span>
                )}
              </div>

              {/* Estimate Completion */}
              <div className="space-y-1.5">
                <label className="font-semibold block text-white">Estimated Completion Time</label>
                <input
                  type="datetime-local"
                  value={estimatedTime}
                  onChange={(e) => setEstimatedTime(e.target.value)}
                  className="w-full bg-[#0F172A] border border-white/10 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-[#22C55E]"
                />
              </div>
            </div>

            {/* Attach Progress photo */}
            <div className="space-y-1.5">
              <label className="font-semibold block text-white">Attach Site Progress Photo URL (Optional)</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="https://images.unsplash.com/..."
                  value={progressPhoto}
                  onChange={(e) => setProgressPhoto(e.target.value)}
                  className="flex-1 bg-[#0F172A] border border-white/10 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-[#22C55E]"
                />
                {progressPhoto && (
                  <div className="w-10 h-10 border border-white/10 rounded-lg overflow-hidden shrink-0">
                    <img src={progressPhoto} alt="Progress Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
            </div>

            {/* Update notes */}
            <div className="space-y-1.5">
              <label className="font-semibold block text-white">Public Status Update Note</label>
              <textarea
                placeholder="Enter status update notes for citizen notification..."
                value={updateNote}
                rows={2}
                onChange={(e) => setUpdateNote(e.target.value)}
                className="w-full bg-[#0F172A] border border-white/10 rounded-xl p-3 text-xs font-semibold text-white focus:outline-none focus:border-[#22C55E] resize-none"
              />
            </div>

            {/* Transition Actions buttons based on status */}
            <div className="flex flex-wrap gap-2 pt-2">
              {issue.status === "submitted" && (
                <Button onClick={() => handleUpdateStatus("community_verification", updateNote || "Issue verified on map.", selectedWorker, estimatedTime)} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex-1">
                  1. Verify Incident Authenticity
                </Button>
              )}
              {issue.status === "community_verification" && (
                <Button onClick={() => handleUpdateStatus("ai_processing", updateNote || "AI Triage analysis completed.", selectedWorker, estimatedTime)} className="bg-[#16A34A] hover:bg-[#16A34A]/90 text-white font-bold flex-1">
                  2. Complete Triage Review
                </Button>
              )}
              {issue.status === "ai_processing" && (
                <Button onClick={() => handleUpdateStatus("assigned", updateNote || "Incident routed to department.", selectedWorker, estimatedTime)} className="bg-purple-600 hover:bg-purple-700 text-white font-bold flex-1">
                  3. Assign Department &amp; Crew
                </Button>
              )}
              {issue.status === "assigned" && (
                <Button onClick={() => handleUpdateStatus("in_progress", updateNote || "Crew dispatched to site.", selectedWorker, estimatedTime)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold flex-1">
                  4. Dispatched Field Inspection
                </Button>
              )}
              {issue.status === "in_progress" && (
                <div className="flex gap-2 w-full">
                  <Button onClick={() => handleUpdateStatus("in_progress", updateNote || "Site repair work initiated.", selectedWorker, estimatedTime)} className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold flex-1">
                    5. Log Repair Progress
                  </Button>
                  <Button onClick={() => handleUpdateStatus("resolved_pending_verification", updateNote || "Physical repairs finished.", selectedWorker, estimatedTime)} className="bg-[#16A34A] hover:bg-[#16A34A]/90 text-white font-bold flex-1">
                    6. Complete Construction Work
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resolution Notes Block */}
      {(issue.status === "work completed" || issue.status === "in_progress") && (
        <Card className="bg-[#1E293B] border border-white/5 shadow-md p-5 space-y-4">
          <CardHeader className="p-0 border-b border-white/5 pb-2.5 flex items-center gap-1.5">
            <Hammer className="w-4 h-4 text-emerald-400" />
            <CardTitle className="text-sm font-black text-white uppercase tracking-wider">Log Resolution Details</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <form onSubmit={handleSubmitResolution} className="space-y-4 text-xs text-[#9AA3B8]">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-semibold block text-white">Materials Used</label>
                  <input
                    type="text"
                    placeholder="e.g. cold asphalt, PVC couplings"
                    value={materials}
                    onChange={(e) => setMaterials(e.target.value)}
                    required
                    className="w-full bg-[#0F172A] border border-white/10 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-semibold block text-white">Repair Cost ($)</label>
                  <input
                    type="number"
                    placeholder="e.g. 240"
                    value={cost}
                    onChange={(e) => setCost(e.target.value)}
                    required
                    className="w-full bg-[#0F172A] border border-white/10 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold block text-white">Resolution Note Remarks</label>
                <textarea
                  rows={2}
                  placeholder="Enter details of composting, repaving, cleaning completed..."
                  value={resolutionNote}
                  onChange={(e) => setResolutionNote(e.target.value)}
                  required
                  className="w-full bg-[#0F172A] border border-white/10 rounded-xl p-3 text-xs font-semibold text-white focus:outline-none resize-none"
                />
              </div>

              <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
                <Send className="w-4 h-4 mr-1" /> Progress Status to "Resolved"
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Workflow Timeline Logs */}
      <Card className="bg-[#1E293B] border border-white/5 shadow-md p-5 space-y-4">
        <CardHeader className="p-0 border-b border-white/5 pb-2.5">
          <CardTitle className="text-sm font-black text-white uppercase tracking-wider">Timeline Audit Logs</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="space-y-4 relative pl-3.5 ml-2 border-l border-white/5">
            {issue.statusHistory?.map((log: any, idx: number) => (
              <div key={idx} className="relative space-y-0.5 text-left">
                <div className="absolute -left-[20px] top-1 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-[#1E293B]" />
                <div className="flex items-center gap-2 flex-wrap leading-none">
                  <span className="text-xs font-black text-white capitalize">{log.status}</span>
                  <span className="text-[10px] text-[#6B7280] font-mono font-bold">
                    {new Date((log.changedAt as any).toDate ? (log.changedAt as any).toDate() : log.changedAt).toLocaleString()}
                  </span>
                </div>
                <p className="text-[10px] text-[#9AA3B8] font-bold">Officer: {log.officer || log.changedBy} ({log.department || "Operations"})</p>
                {log.note && (
                  <p className="text-[11px] text-[#9AA3B8] bg-white/[0.02] rounded-xl p-2 mt-1 border border-white/5 font-semibold">
                    {log.note}
                  </p>
                )}
                {log.imageUrl && (
                  <div className="w-20 h-16 rounded overflow-hidden border border-white/5 mt-1.5">
                    <img src={log.imageUrl} alt="Progress site attachment" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OfficialIssueDetailPage;
