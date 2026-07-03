import { AGENT_SYSTEM_PROMPTS } from "./prompts";

export interface AgentInputData {
  issueDetails: {
    category: string;
    subcategory: string;
    severityEstimate: string;
    userDescription: string;
    location: {
      lat: number;
      lng: number;
      address: string;
      ward: string;
    };
  };
  previousResults: Record<string, any>;
  caseMemory: any;
  nearbyIssues?: any[];
}

export abstract class CouncilAgent {
  protected agentId: string;
  protected systemPrompt: string;

  constructor(agentId: string, systemPrompt: string) {
    this.agentId = agentId;
    this.systemPrompt = systemPrompt;
  }

  abstract run(input: AgentInputData): Promise<any>;
}

export class DuplicateAgent extends CouncilAgent {
  constructor() {
    super("duplicate", AGENT_SYSTEM_PROMPTS.duplicate);
  }
  async run(input: AgentInputData): Promise<any> {
    console.log(`[duplicate] Running duplicate check locally`);
    const nearby = input.nearbyIssues || [];
    const matches: any[] = [];
    let probability = 0;

    for (const issue of nearby) {
      const sameSub = (issue.aiAnalysis?.subcategory || "").toLowerCase() === (input.issueDetails.subcategory || "").toLowerCase();
      const desc = (issue.userDescription || issue.aiAnalysis?.aiDescription || "").toLowerCase();
      const newDesc = (input.issueDetails.userDescription || "").toLowerCase();
      const textOverlap = newDesc && desc && (desc.includes(newDesc) || newDesc.includes(desc));
      if (sameSub || textOverlap) {
        matches.push({ id: issue.id, similarity: sameSub ? 0.9 : 0.6 });
      }
    }

    if (matches.length > 0) probability = Math.min(95, 60 + matches.length * 10);
    else probability = 10;

    return {
      duplicateProbability: probability,
      matchedIssues: matches,
      findings: matches.length ? "Potential duplicates detected based on subcategory/text match." : "No nearby duplicates found.",
      commentsForNextAgent: "Proceed with routing and priority synthesis.",
      confidence: probability,
    };
  }
}

export class SafetyAgent extends CouncilAgent {
  constructor() {
    super("safety", AGENT_SYSTEM_PROMPTS.safety);
  }
  async run(input: AgentInputData): Promise<any> {
    console.log(`[safety] Running safety assessment locally`);
    const vision = input.previousResults.vision?.output || input.previousResults.vision || {};
    const hazards = vision.possibleHazards || vision.hazards || [];
    const objects = vision.detectedObjects || vision.objects || [];

    let safetyLevel = "medium";
    let emergencyRequired = false;
    if ((hazards && hazards.length > 0) || objects.includes("fire") || objects.includes("flood")) {
      safetyLevel = "critical";
      emergencyRequired = true;
    } else if (objects.length > 0) {
      safetyLevel = "high";
    }

    const confidence = emergencyRequired ? 90 : objects.length > 0 ? 70 : 50;

    return {
      safetyLevel,
      affectedPopulation: objects.includes("school") ? "school children" : "general population",
      emergencyRequired,
      findings: hazards.length ? `Hazards: ${hazards.join(", ")}` : "No immediate hazards detected.",
      commentsForNextAgent: "Consider increasing priority if emergencyRequired is true.",
      confidence,
    };
  }
}

export class PriorityAgent extends CouncilAgent {
  constructor() {
    super("priority", AGENT_SYSTEM_PROMPTS.priority);
  }
  async run(input: AgentInputData): Promise<any> {
    console.log(`[priority] Running priority synthesis locally`);
    const vision = input.previousResults.vision?.output || input.previousResults.vision || {};
    const duplicate = input.previousResults.duplicate || {};
    const safety = input.previousResults.safety || {};

    // Base score from severityEstimate
    const base = (input.issueDetails.severityEstimate === "critical") ? 90 : (input.issueDetails.severityEstimate === "high") ? 75 : (input.issueDetails.severityEstimate === "medium") ? 50 : 25;
    let score = base;

    if (duplicate.duplicateProbability && duplicate.duplicateProbability >= 80) {
      score = Math.max(10, Math.round(score * 0.5));
    }
    if (safety && safety.emergencyRequired) {
      score = Math.min(100, score + 30);
    }

    const priorityLabel = score >= 80 ? "critical" : score >= 60 ? "high" : score >= 30 ? "medium" : "low";

    return {
      priority: priorityLabel,
      score,
      findings: `Computed priority based on visual severity and safety assessment.`,
      commentsForNextAgent: "Use priority score for routing SLA calculation.",
      confidence: Math.round((vision.confidence || 50) * 0.8 + (100 - Math.abs(50 - score)) * 0.2),
    };
  }
}

export class RoutingAgent extends CouncilAgent {
  constructor() {
    super("routing", AGENT_SYSTEM_PROMPTS.routing);
  }
  async run(input: AgentInputData): Promise<any> {
    console.log(`[routing] Running routing decision locally`);
    const priority = input.previousResults.priority || {};
    const category = input.issueDetails.category || "other";

    const departmentMap: Record<string, string> = {
      road_damage: "Roads & Infrastructure",
      water_issue: "Water Supply & Sewerage",
      electricity: "Electricity Department",
      waste_management: "Sanitation Department",
      public_safety: "Emergency Services",
      drainage: "Drainage & Sewage",
    };

    const department = departmentMap[category] || "General Services";
    const slaHours = priority.score ? Math.max(4, Math.round(72 - priority.score / 1.5)) : 72;

    return {
      department,
      escalationLevel: priority.score >= 80 ? "L3" : "L1",
      slaHours,
      findings: `Routed to ${department} with SLA ${slaHours} hours based on priority.`,
      confidence: Math.min(95, Math.round(priority.score || 50)),
    };
  }
}

export class ExecutiveAgent extends CouncilAgent {
  constructor() {
    super("executive", AGENT_SYSTEM_PROMPTS.executive);
  }
  async run(input: AgentInputData): Promise<any> {
    console.log(`[executive] Generating executive summary locally`);
    const vision = input.previousResults.vision?.output || input.previousResults.vision || {};
    const duplicate = input.previousResults.duplicate || {};
    const safety = input.previousResults.safety || {};
    const priority = input.previousResults.priority || {};
    const routing = input.previousResults.routing || {};

    const technical = `Vision: ${vision.subcategory || vision.title || 'N/A'}; Priority: ${priority.priority || priority.score}; Routing: ${routing.department || 'TBD'}; Duplicate check: ${duplicate.duplicateProbability ? `${duplicate.duplicateProbability}%` : 'none'}`;
    const citizen = safety.emergencyRequired
      ? "Immediate response required. Authorities have been notified."
      : `Your report has been routed to ${routing.department || 'the relevant department'} and will be reviewed.`;

    return {
      summary: technical,
      decision: citizen,
      nextActions: ["Acknowledge report", "Assign to department", "Schedule inspection"],
      findings: "Executive summary generated from agent outputs.",
      confidence: 80,
    };
  }
}

export class ValidatorAgent extends CouncilAgent {
  constructor() {
    super("validator", AGENT_SYSTEM_PROMPTS.validator);
  }
  async run(input: AgentInputData): Promise<any> {
    console.log(`[validator] Running validation locally`);
    const executive = input.previousResults.executive || {};
    const routing = input.previousResults.routing || {};
    const priority = input.previousResults.priority || {};

    const warnings: string[] = [];
    if (priority && priority.priority === "critical" && (!executive.nextActions || executive.nextActions.length === 0)) {
      warnings.push("Critical priority but no executive next actions defined.");
    }
    if (routing && routing.department === "General Services" && priority && priority.score >= 80) {
      warnings.push("High priority routed to General Services - consider escalation.");
    }

    return {
      isValid: warnings.length === 0,
      validationWarnings: warnings,
      reEvaluationTarget: warnings.length ? "executive" : "none",
      findings: warnings.length ? warnings.join(";") : "Validated successfully.",
      confidence: warnings.length ? 60 : 90,
    };
  }
}
