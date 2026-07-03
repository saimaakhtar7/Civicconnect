import { Timestamp } from "firebase/firestore";

export type AgentId =
  | "vision"
  | "verification"
  | "duplicate"
  | "priority"
  | "safety"
  | "routing"
  | "resolution"
  | "summary";

export type AgentStatus = "pending" | "running" | "completed" | "failed" | "skipped";

export interface AgentResultDocument {
  agentId: AgentId;
  status: AgentStatus;
  startedAt: Timestamp | Date;
  completedAt?: Timestamp | Date;
  processingTimeMs: number;
  confidence?: number;
  result: Record<string, any>;   // Agent-specific schema
  rawGeminiInput?: string;       // Stored for debugging
  rawGeminiOutput?: string;
  error?: string;
  fallbackApplied: boolean;
  retryCount: number;
}

export interface PipelineState {
  issueId: string;
  pipelineId: string;
  status: "running" | "completed" | "failed";
  currentAgent: AgentId | null;
  startedAt: Timestamp | Date;
  completedAt?: Timestamp | Date;
  results: Record<AgentId, AgentResultDocument | null>;
}
