import { collection, writeBatch, doc, Timestamp } from "firebase/firestore";
import { db } from "../config/firebase";
import { removeUndefined } from "../utils/firestore.utils";

const DEMO_ISSUES = [
  {
    subcategory: "Large Pothole on Main Road",
    category: "road_damage",
    severity: "critical",
    confidence: 96,
    ward: "Koregaon Park",
    address: "Boat Club Road, Koregaon Park, Pune",
    description: "A large pothole has appeared near the traffic signal. Vehicle damage and accident risk are high.",
    department: "Roads & Infrastructure Department",
    slaHours: 4,
    status: "in_progress",
    lat: 18.5318, lng: 73.8949,
    agentSummary: "Vision Agent detected 2 potholes of diameter ~60cm. Safety Agent flagged major traffic hazard near school zone. Priority Agent escalated to CRITICAL. Routing Agent assigned to Roads Dept with 4hr SLA.",
    citizenMessage: "A critical road hazard has been detected near Boat Club Road. Roads Department has been notified and will respond within 4 hours.",
    priority: 0,
  },
  {
    subcategory: "Burst Water Main — Street Flooding",
    category: "water_issue",
    severity: "high",
    confidence: 91,
    ward: "Shivajinagar",
    address: "FC Road, Shivajinagar, Pune",
    description: "Water is gushing from a burst underground pipe, flooding the road and causing traffic disruption.",
    department: "Pune Municipal Water Supply",
    slaHours: 24,
    status: "assigned",
    lat: 18.5296, lng: 73.8472,
    agentSummary: "Vision evidence shows standing water and active pipe burst. Safety Agent rated HIGH risk for pedestrians and vehicles. Routing Agent confirmed Water Supply Department.",
    citizenMessage: "A burst water main on FC Road has been reported. Water Supply Department has been assigned and will dispatch a crew within 24 hours.",
    priority: 1,
  },
  {
    subcategory: "Illegal Garbage Dump Blocking Footpath",
    category: "waste_management",
    severity: "medium",
    confidence: 88,
    ward: "Viman Nagar",
    address: "Sakore Nagar Road, Viman Nagar, Pune",
    description: "Large amounts of garbage have been dumped on the footpath blocking pedestrian access.",
    department: "PCMC Solid Waste Management",
    slaHours: 72,
    status: "community_verification",
    lat: 18.5680, lng: 73.9178,
    agentSummary: "Solid waste accumulation identified. No immediate life-safety risk. Medium urgency based on public hygiene concern. PCMC Waste Management assigned.",
    citizenMessage: "A garbage dumping complaint on Sakore Nagar Road has been acknowledged. PCMC Waste Management will collect within 72 hours.",
    priority: 2,
  },
  {
    subcategory: "Streetlight Outage — Dark Road at Night",
    category: "electricity",
    severity: "high",
    confidence: 84,
    ward: "Kothrud",
    address: "Karve Road, Kothrud, Pune",
    description: "Multiple streetlights are non-functional making Karve Road extremely dark and unsafe at night.",
    department: "MSEDCL — Maharashtra Electricity",
    slaHours: 24,
    status: "submitted",
    lat: 18.5088, lng: 73.8115,
    agentSummary: "Nighttime visibility hazard confirmed. Safety Agent rated HIGH due to crime risk and accident potential. MSEDCL assigned for emergency street lighting repair.",
    citizenMessage: "Streetlight failure on Karve Road has been escalated to MSEDCL for urgent repair within 24 hours.",
    priority: 1,
  },
  {
    subcategory: "Fallen Tree Blocking Road",
    category: "green_spaces",
    severity: "high",
    confidence: 92,
    ward: "Deccan Gymkhana",
    address: "Bhandarkar Road, Deccan, Pune",
    description: "A large tree fell due to strong winds and is blocking one lane of Bhandarkar Road.",
    department: "Pune Garden Department",
    slaHours: 12,
    status: "resolved",
    lat: 18.5193, lng: 73.8436,
    agentSummary: "Tree fall confirmed by Vision Agent. Emergency clearance team deployed. Resolved within SLA window.",
    citizenMessage: "The fallen tree on Bhandarkar Road has been cleared by the Garden Department. Road is now open.",
    priority: 1,
  },
];

export class DemoSeeder {
  /**
   * Seeds realistic demo issues into Firestore with completed AI pipeline data.
   * Safe to call multiple times — uses consistent IDs to avoid duplicates.
   */
  static async seedDemoIssues(): Promise<void> {
    const batch = writeBatch(db);
    const now = Date.now();

    for (let i = 0; i < DEMO_ISSUES.length; i++) {
      const issue = DEMO_ISSUES[i];
      const issueId = `demo_${issue.category}_${i}`;
      const createdAt = Timestamp.fromDate(new Date(now - (i + 1) * 7_200_000)); // stagger by 2h
      const slaDeadline = new Date(createdAt.toDate().getTime() + issue.slaHours * 3_600_000);


      const docRef = doc(collection(db, "issues"), issueId);
      batch.set(docRef, removeUndefined({
        id: issueId,
        reportedBy: "demo_citizen",
        isAnonymous: false,
        reporterTrustScore: 75,
        mediaUrls: [],
        location: {
          lat: issue.lat, lng: issue.lng,
          geohash: `demo_${issueId}`,
          address: issue.address,
          ward: issue.ward,
          city: "Pune",
          nearbyLandmarks: [],
        },
        userDescription: issue.description,
        aiAnalysis: {
          category: issue.category,
          subcategory: issue.subcategory,
          severity: issue.severity,
          aiDescription: issue.agentSummary,
          citizenMessage: issue.citizenMessage,
          confidence: issue.confidence,
          contextFactors: [],
          immediateRisk: issue.severity === "critical" ? "Immediate public safety risk" : undefined,
        },
        priority: {
          level: issue.priority,
          label: issue.severity.toUpperCase(),
          score: issue.confidence,
          citizenReason: issue.citizenMessage,
          estimatedSLAHours: issue.slaHours,
          slaDeadline,
        },
        routing: {
          primaryDepartment: issue.department,
          escalationLevel: issue.severity === "critical" ? "L3" : issue.severity === "high" ? "L2" : "L1",
          routingReason: "AI City Council consensus routing.",
          routingConfidence: 94,
        },
        status: issue.status,
        statusHistory: [{ status: "submitted", changedAt: createdAt, changedBy: "demo_citizen", note: "Demo issue." }],
        verification: { count: 0, required: 3, verifierIds: [], status: "pending" },
        metrics: { viewCount: 12, shareCount: 2, upvoteCount: 4, estimatedAffectedCitizens: 50 },
        duplicateIssueIds: [],
        aiSummary: {
          category: issue.category,
          subcategory: issue.subcategory,
          severity: issue.severity,
          confidence: issue.confidence,
          department: issue.department,
          executiveSummary: issue.agentSummary,
          duplicateProbability: 5,
          safetyLevel: issue.severity === "critical" ? "critical" : issue.severity === "high" ? "high" : "medium",
          priorityScore: issue.confidence,
          validatorStatus: "passed",
          completedAt: Timestamp.fromDate(new Date(createdAt.toDate().getTime() + 4100)),
        },
        createdAt,
        updatedAt: createdAt,
      }), { merge: true });
    }

    await batch.commit();
    console.log("[DemoSeeder] ✓ Demo issues seeded to Firestore.");
  }
}
