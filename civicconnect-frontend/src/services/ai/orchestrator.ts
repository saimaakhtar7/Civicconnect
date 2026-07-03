import { doc, serverTimestamp, updateDoc, type DocumentReference } from "firebase/firestore";
import { db } from "../../config/firebase";
import { AgentInputData, DuplicateAgent, SafetyAgent, PriorityAgent, RoutingAgent, ExecutiveAgent, ValidatorAgent } from "./agents";

interface IssueMemory {
  timeline: string[];
  evidenceHistory: string[];
  confidenceHistory: Array<{ agentId: string; confidence: number; timestamp: Date }>;
  reasoningHistory: any[];
  agentNotes: string[];
  decisionRevisions: any[];
  consensus: Record<string, any>;
}

type AgentStatus = "running" | "completed" | "failed";

interface AgentResult {
  status: AgentStatus;
  durationMs: number;
  output: Record<string, any>;
  error?: string;
}

interface AgentResultsMap {
  duplicate?: AgentResult;
  safety?: AgentResult;
  priority?: AgentResult;
  routing?: AgentResult;
  executive?: AgentResult;
  validator?: AgentResult;
  [key: string]: AgentResult | undefined;
}

interface ProcessingMetrics {
  [agentId: string]: {
    durationMs: number;
    confidence: number;
    timestamp: Date;
    status: AgentStatus;
  };
}

const FALLBACKS: Record<string, any> = {
  duplicate: { duplicateProbability: 0, matchedIssues: [], findings: "Duplicate detection not available.", commentsForNextAgent: "Proceed with normal processing.", confidence: 50 },
  safety: { safetyLevel: "medium", affectedPopulation: "general population", emergencyRequired: false, findings: "Safety assessment unavailable.", commentsForNextAgent: "Defaulted to normal handling.", confidence: 50 },
  priority: { priority: "medium", score: 50, findings: "Priority synthesis unavailable.", commentsForNextAgent: "Standard medium urgency.", decisionRevision: { originalDecision: "unknown", reasonForRevision: "Fallback used", updatedDecision: "medium" }, confidence: 50 },
  routing: { department: "General Municipal Department", escalationLevel: "L1", slaHours: 72, findings: "Routing fallback used.", commentsForNextAgent: "Use default department.", confidence: 50 },
  executive: { summary: "Executive summary unavailable.", decision: "Your issue is under review.", nextActions: ["Wait for official update"], findings: "Fallback executive summary applied.", confidence: 50 },
  validator: { isValid: true, validationWarnings: [], reEvaluationTarget: "none", findings: "Validation fallback used.", confidence: 50 },
};

function sanitizeAgentResult(raw: any): Record<string, any> {
  if (!raw || typeof raw !== "object") {
    return {};
  }
  return raw;
}

function buildAiSummary(issueData: any, results: AgentResultsMap) {
  // Read nested outputs consistently from results[agent].output
  const visionConfidence = issueData.aiAnalysis?.confidence || 0;
  const duplicateOut = results.duplicate?.output || {};
  const safetyOut = results.safety?.output || {};
  const priorityOut = results.priority?.output || {};
  const routingOut = results.routing?.output || {};
  const executiveOut = results.executive?.output || {};
  const validatorOut = results.validator?.output || {};

  const confidenceValues = [
    visionConfidence,
    duplicateOut.confidence || 0,
    safetyOut.confidence || 0,
    priorityOut.confidence || 0,
    routingOut.confidence || 0,
    executiveOut.confidence || 0,
    validatorOut.confidence || 0,
  ];
  const averageConfidence = confidenceValues.reduce((sum, value) => sum + value, 0) / Math.max(confidenceValues.length, 1);

  return {
    category: issueData.aiAnalysis?.category || routingOut.category || "other",
    subcategory: issueData.aiAnalysis?.subcategory || routingOut.subcategory || "General Triage",
    severity: issueData.aiAnalysis?.severity || priorityOut.severity || "medium",
    confidence: Math.round(averageConfidence),
    department: routingOut.department || issueData.aiAnalysis?.departmentSuggestion || "General Municipal Department",
    executiveSummary: executiveOut.decision || executiveOut.summary || issueData.aiAnalysis?.aiDescription || "Executive summary unavailable.",
    duplicateProbability: duplicateOut.duplicateProbability || 0,
    safetyLevel: safetyOut.safetyLevel || "medium",
    priorityScore: priorityOut.score || priorityOut.priorityScore || 0,
    validatorStatus: validatorOut.isValid ? "passed" : "failed",
    completedAt: new Date(),
  };
}

export class AgentOrchestrator {
  private issueRef: DocumentReference;
  private progressCallback?: (agentId: string, status: AgentStatus, details?: any) => void;

  constructor(issueId: string, progressCallback?: (agentId: string, status: AgentStatus, details?: any) => void) {
    if (!issueId) {
      throw new Error("AgentOrchestrator requires a valid issueId.");
    }
    this.issueRef = doc(db, "issues", issueId);
    this.progressCallback = progressCallback;
  }

  private async safeUpdateDoc(payload: Record<string, any>) {
    try {
      console.log("safeUpdateDoc: attempting update", { path: this.issueRef.path, payload });
      await updateDoc(this.issueRef, payload);
      console.log("safeUpdateDoc: update success", { path: this.issueRef.path });
      return true;
    } catch (err: any) {
      console.error("safeUpdateDoc: Firestore update failed:", err?.message || err, { path: this.issueRef.path, payload });
      try {
        // Best-effort: mark status failed with error message
        const failurePayload = {
          aiStatus: "failed",
          aiStatusMessage: `Firestore update error: ${err?.message || String(err)}`,
          updatedAt: serverTimestamp(),
        };
        console.log("safeUpdateDoc: attempting to write failure status", { path: this.issueRef.path, failurePayload });
        await updateDoc(this.issueRef, failurePayload);
        console.log("safeUpdateDoc: failure status written", { path: this.issueRef.path });
      } catch (err2: any) {
        console.error("safeUpdateDoc: Failed to write failure status to Firestore:", err2?.message || err2, { path: this.issueRef.path });
      }
      return false;
    }
  }

  // Option A: executeStep returns { status, durationMs, output }
  private async executeStep(agentId: string, agent: any, input: AgentInputData): Promise<AgentResult> {
    this.progressCallback?.(agentId, "running");
    const start = Date.now();

    try {
      const raw = await agent.run(input);
      const duration = Date.now() - start;
      const sanitized = sanitizeAgentResult(raw);
      const result: AgentResult = {
        status: "completed",
        durationMs: duration,
        output: sanitized,
      };
      this.progressCallback?.(agentId, "completed", result);
      return result;
    } catch (error: any) {
      const duration = Date.now() - start;
      const fallback = FALLBACKS[agentId] || { error: true };
      const result: AgentResult = {
        status: "failed",
        durationMs: duration,
        output: sanitizeAgentResult(fallback),
        error: error?.message || "Agent execution error",
      };
      this.progressCallback?.(agentId, "failed", result);
      return result;
    }
  }

  async run(issueData: any) {
    // Mark pipeline starting
    await this.safeUpdateDoc({ aiStatus: "processing", aiStatusMessage: "Pipeline started", updatedAt: serverTimestamp() });

    const issueDetails = {
      category: issueData.aiAnalysis?.category || "other",
      subcategory: issueData.aiAnalysis?.subcategory || "General Triage",
      severityEstimate: issueData.aiAnalysis?.severity || "medium",
      userDescription: issueData.userDescription || "",
      location: {
        lat: issueData.location?.lat || 0,
        lng: issueData.location?.lng || 0,
        address: issueData.location?.address || "",
        ward: issueData.location?.ward || "",
      },
    };

    const caseMemory: IssueMemory = {
      timeline: ["pipeline_started"],
      evidenceHistory: issueData.aiAnalysis?.contextFactors || [],
      confidenceHistory: [
        { agentId: "vision", confidence: issueData.aiAnalysis?.confidence || 0, timestamp: new Date() },
      ],
      reasoningHistory: [],
      agentNotes: [],
      decisionRevisions: [],
      consensus: {},
    };

    const results: AgentResultsMap = {
      vision: { status: "completed", durationMs: 0, output: { ...(issueData.aiAnalysis || {}) } },
    };

    const processingMetrics: ProcessingMetrics = {};

    const duplicateAgent = new DuplicateAgent();
    const safetyAgent = new SafetyAgent();
    const priorityAgent = new PriorityAgent();
    const routingAgent = new RoutingAgent();
    const executiveAgent = new ExecutiveAgent();
    const validatorAgent = new ValidatorAgent();

    const nearbyIssues: any[] = issueData.nearbyIssues || [];

    // Run agents sequentially and collect results/metrics. Always resilient to failures.
    const runAgent = async (id: string, agentInstance: any) => {
      const res = await this.executeStep(id, agentInstance, { issueDetails, previousResults: results, caseMemory, nearbyIssues } as any);
      // store agent result map with status/duration/output
      results[id] = res;
      caseMemory.timeline.push(`${id}_completed`);
      const conf = (res.output && typeof res.output.confidence === "number") ? res.output.confidence : 0;
      caseMemory.confidenceHistory.push({ agentId: id, confidence: conf, timestamp: new Date() });
      processingMetrics[id] = { durationMs: res.durationMs, confidence: conf, timestamp: new Date(), status: res.status };
      // best-effort persist intermediate state for observability
      const intermediatePayload = {
        [`agentResults.${id}`]: res,
        pipelineTimeline: caseMemory.timeline,
        processingMetrics: processingMetrics,
        updatedAt: serverTimestamp(),
      };
      const intermediateOk = await this.safeUpdateDoc(intermediatePayload);
      if (!intermediateOk) {
        console.error("runAgent: intermediate Firestore write failed", { agentId: id, issuePath: this.issueRef.path });
      }
    };

    await runAgent("duplicate", duplicateAgent);
    await runAgent("safety", safetyAgent);
    await runAgent("priority", priorityAgent);
    await runAgent("routing", routingAgent);
    await runAgent("executive", executiveAgent);
    await runAgent("validator", validatorAgent);

    // Build final summary from agent outputs
    const finalSummary = buildAiSummary(issueData, results);

    const totalDuration = Object.values(processingMetrics).reduce((acc, v) => acc + (v?.durationMs || 0), 0);

    const finalPayload: Record<string, any> = {
      agentResults: {
        duplicate: results.duplicate,
        safety: results.safety,
        priority: results.priority,
        routing: results.routing,
        executive: results.executive,
        validator: results.validator,
      },
      aiSummary: finalSummary,
      pipelineTimeline: caseMemory.timeline,
      processingMetrics: {
        ...processingMetrics,
        totalDuration,
      },
      aiStatus: "completed",
      aiStatusMessage: "Pipeline completed successfully",
      updatedAt: serverTimestamp(),
    };

    const ok = await this.safeUpdateDoc(finalPayload);
    if (!ok) {
      console.warn("Final Firestore write failed — pipeline marked failed in document if possible.");
    }

    console.log("Pipeline finished");
    return finalSummary;
  }
}
