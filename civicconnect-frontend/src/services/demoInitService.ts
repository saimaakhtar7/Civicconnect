/**
 * demoInitService.ts
 *
 * The single entry point for all demo environment operations.
 *
 * Flow:
 *   1. Sign in → 2. Verify environment → 3. Seed if needed → 4. Return (caller navigates)
 *
 * The dashboard is NEVER opened until all writes have finished.
 */

import {
  collection,
  doc,
  getDoc,
  setDoc,
  getDocs,
  writeBatch,
  deleteDoc,
  Timestamp,
} from "firebase/firestore";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../config/firebase";
import { UserRole } from "../types/user.types";
import { removeUndefined } from "../utils/firestore.utils";

// ─── Version ─────────────────────────────────────────────────────────────────
export const CURRENT_DEMO_VERSION = 2;

// ─── Credentials ─────────────────────────────────────────────────────────────
const DEMO_CREDS: Record<UserRole, string> = {
  citizen:   "citizen@civicconnect.ai",
  official:  "official@civicconnect.ai",
  moderator: "moderator@civicconnect.ai",
  admin:     "admin@civicconnect.ai",
};
const DEMO_PASSWORD = "DemoPassword123!";

// ─── Meta structure ───────────────────────────────────────────────────────────
export interface DemoMeta {
  seeded: boolean;
  version: number;
  seededAt: Timestamp;
  counts: {
    issues: number;
    discussions: number;
    departments: number;
    categories: number;
    events: number;
    notifications: number;
    badges: number;
  };
  aiPipeline: boolean;
  analytics: boolean;
}

export interface DemoEnvironmentStatus {
  metaExists: boolean;
  version: number | null;
  currentVersion: number;
  upToDate: boolean;
  seededAt: Date | null;
  counts: DemoMeta["counts"] | null;
  aiPipeline: boolean;
  analytics: boolean;
}

// ─── Data constants ───────────────────────────────────────────────────────────
const WARDS = [
  "Koregaon Park","Shivajinagar","Kothrud","Viman Nagar","Deccan Gymkhana",
  "Camp Area","Baner","Hadapsar","Yerawada","Aundh","Kalyani Nagar",
  "Pashan","Pune Station","Katraj","Dhankawadi","Sinhagad Road",
];

const DEPARTMENTS = [
  { id: "roads",       name: "Roads & Infrastructure",      head: "Officer Vikram",    icon: "🛣️" },
  { id: "water",       name: "Water Supply & Sewerage",     head: "Officer Suresh",    icon: "💧" },
  { id: "electricity", name: "Electricity Department",      head: "Officer K. Patil",  icon: "⚡" },
  { id: "sanitation",  name: "Public Sanitation",           head: "Officer R. Shinde", icon: "🧹" },
  { id: "solid_waste", name: "Solid Waste Management",      head: "Officer J. D'Souza",icon: "♻️" },
  { id: "parks",       name: "Parks & Recreation",          head: "Officer S. Deshpande",icon:"🌳" },
  { id: "streetlights",name: "Street Lighting",             head: "Officer M. Joshi",  icon: "💡" },
  { id: "traffic",     name: "Traffic Management",          head: "Officer Vikram",    icon: "🚦" },
  { id: "drainage",    name: "Drainage Department",         head: "Officer R. Shinde", icon: "🌊" },
  { id: "health",      name: "Public Health & Safety",      head: "Officer Maya Reddy",icon: "🏥" },
  { id: "emergency",   name: "Emergency Response",          head: "Officer Vikram",    icon: "🚨" },
];

const CATEGORIES = [
  { id: "road_damage",    name: "Potholes",          color: "#E11D48", dept: "roads"       },
  { id: "waste_management",name:"Garbage",           color: "#10B981", dept: "solid_waste" },
  { id: "water_issue",    name: "Water Leakage",     color: "#3B82F6", dept: "water"       },
  { id: "electricity",    name: "Broken Streetlights",color:"#F59E0B", dept: "streetlights"},
  { id: "illegal_dumping",name: "Illegal Dumping",   color: "#EF4444", dept: "solid_waste" },
  { id: "traffic_signals",name: "Traffic Signals",   color: "#8B5CF6", dept: "traffic"     },
  { id: "drainage",       name: "Drain Blockage",    color: "#06B6D4", dept: "drainage"    },
  { id: "tree_hazard",    name: "Tree Hazard",       color: "#84CC16", dept: "parks"       },
  { id: "public_safety",  name: "Public Safety",     color: "#EF4444", dept: "health"      },
  { id: "infra_damage",   name: "Infrastructure",    color: "#6366F1", dept: "roads"       },
  { id: "noise_pollution",name: "Noise Pollution",   color: "#EC4899", dept: "health"      },
  { id: "environmental",  name: "Environmental",     color: "#10B981", dept: "health"      },
  { id: "animal_control", name: "Animal Control",    color: "#84CC16", dept: "health"      },
  { id: "public_transport",name:"Public Transport",  color: "#3B82F6", dept: "traffic"     },
  { id: "encroachments",  name: "Encroachments",    color: "#14B8A6", dept: "health"       },
];

const ISSUE_TEMPLATES = [
  { sub:"Large Pothole", cat:"road_damage",    sev:"critical", dept:"roads",        img:"/images/pothole.png",        desc:"A large pothole near the traffic junction is causing vehicle damage and accident risk." },
  { sub:"Burst Water Main", cat:"water_issue",  sev:"critical", dept:"water",        img:"/images/water_main.png",     desc:"Water gushing from an underground main is flooding local lanes." },
  { sub:"Fallen Power Line", cat:"electricity", sev:"critical", dept:"electricity",  img:"/images/streetlight.png",   desc:"A high-tension cable has snapped and rests on the road divider. Extremely hazardous." },
  { sub:"Overflowing Bin", cat:"waste_management",sev:"high",  dept:"solid_waste",  img:"/images/garbage_dump.png",  desc:"The public bin has not been cleared in 3 days. Debris is scattered everywhere." },
  { sub:"Gutter Overflow", cat:"drainage",      sev:"high",    dept:"drainage",     img:"/images/drainage_overflow.png",desc:"Storm drain blockage is spilling sludge onto pedestrian paths." },
  { sub:"Blank Traffic Signal", cat:"traffic_signals",sev:"critical",dept:"traffic",img:"/images/pothole.png",       desc:"Main traffic lights are blank, causing gridlock and close-calls." },
  { sub:"Fallen Tree", cat:"tree_hazard",       sev:"high",    dept:"parks",        img:"/images/pothole.png",       desc:"A mature tree branch has snapped and is blocking road lanes." },
  { sub:"Streetlight Outage", cat:"electricity",sev:"high",    dept:"streetlights", img:"/images/streetlight.png",   desc:"Four consecutive streetlights are dark, making the road unsafe at night." },
  { sub:"Sewage Backflow", cat:"drainage",      sev:"high",    dept:"drainage",     img:"/images/sewage_overflow.png",desc:"Raw sewage backing up from manholes onto the street." },
  { sub:"Illegal Dumping", cat:"illegal_dumping",sev:"medium", dept:"solid_waste",  img:"/images/garbage_dump.png",  desc:"Commercial debris dumped on a public plot overnight." },
  { sub:"Sidewalk Collapse", cat:"road_damage", sev:"medium",  dept:"roads",        img:"/images/damaged_footpath.png",desc:"Paving slabs have caved in, unsafe for pedestrians." },
  { sub:"Stray Dog Pack", cat:"animal_control", sev:"medium",  dept:"health",       img:"/images/pothole.png",       desc:"Aggressive stray dogs near the park entrance." },
  { sub:"Chemical Odor", cat:"environmental",   sev:"high",    dept:"health",       img:"/images/pothole.png",       desc:"Noxious burning smell filling the residential colony." },
  { sub:"Noise Pollution", cat:"noise_pollution",sev:"medium", dept:"health",       img:"/images/pothole.png",       desc:"Late-night construction drilling after midnight." },
  { sub:"Damaged Bus Shelter", cat:"public_transport",sev:"low",dept:"traffic",     img:"/images/pothole.png",       desc:"Steel bench and roof panel of bus stop are broken." },
];

// ─── AI Pipeline stage builder ────────────────────────────────────────────────
function buildAIPipeline(
  createdMs: number,
  category: string,
  severity: string,
  dept: string,
  confidence: number
) {
  const sev2hours: Record<string, number> = { critical: 0.5, high: 1, medium: 2, low: 4 };
  const baseDelay = (sev2hours[severity] ?? 1) * 3_600_000;

  const stages = [
    { stage: "citizen_report",      label: "Citizen Report Received",    agent: "Intake Gateway",       delayMs: 0         },
    { stage: "vision_ai",           label: "Vision AI Analysis",         agent: "Gemini Vision Engine", delayMs: 4_100     },
    { stage: "geo_verification",    label: "Geo-Verification",           agent: "Location Validator",   delayMs: 5_500     },
    { stage: "duplicate_detection", label: "Duplicate Detection",        agent: "Similarity Engine",    delayMs: 7_200     },
    { stage: "severity_analysis",   label: "Severity & Risk Analysis",   agent: "Priority Engine",      delayMs: 9_000     },
    { stage: "department_routing",  label: "Department Routing",         agent: "Smart Router AI",      delayMs: 11_000    },
    { stage: "official_assigned",   label: "Official Assigned",          agent: "Assignment System",    delayMs: baseDelay * 0.15 },
    { stage: "crew_dispatched",     label: "Crew Dispatched",            agent: "Dispatch Coordinator", delayMs: baseDelay * 0.25 },
    { stage: "work_started",        label: "Work Started On-Site",       agent: "Field Team",           delayMs: baseDelay * 0.5  },
    { stage: "resolution_verified", label: "Resolution & AI Verification",agent:"Resolution Engine",   delayMs: baseDelay * 0.9  },
  ];

  const decisionReasons: Record<string, string> = {
    citizen_report:      "Incident registered via CivicConnect mobile app. GPS coordinates captured.",
    vision_ai:           `Gemini Vision: Detected ${category.replace("_"," ")} (confidence ${confidence}%). Pattern match: high severity road anomaly confirmed.`,
    geo_verification:    "Coordinates cross-referenced with ward boundary database. Location verified within Pune municipal limits.",
    duplicate_detection: "Similarity matrix scan: 0 duplicate incidents found within 200m radius in last 30 days.",
    severity_analysis:   `Priority Engine: Severity classified as ${severity.toUpperCase()}. Affected citizens estimate: ${severity === "critical" ? "500+" : severity === "high" ? "150+" : "50+"}. Safety veto: ${severity === "critical" ? "APPLIED" : "not triggered"}.`,
    department_routing:  `Smart Router: Best match department → ${dept}. Routing confidence: 96%.`,
    official_assigned:   `Work order assigned. Officer code generated. ETA: ${severity === "critical" ? "2 hours" : severity === "high" ? "12 hours" : "24 hours"}.`,
    crew_dispatched:     "Field crew notified via dispatch app. GPS tracking initiated.",
    work_started:        "Field supervisor confirmed work start via mobile check-in. Site photos uploaded.",
    resolution_verified: "Resolution confirmed by AI image comparison. Before/after delta verified. Citizen notification sent.",
  };

  return stages.map((s) => ({
    stage:           s.stage,
    label:           s.label,
    agent:           s.agent,
    startedAt:       Timestamp.fromMillis(createdMs + s.delayMs),
    completedAt:     Timestamp.fromMillis(createdMs + s.delayMs + 1_200),
    processingMs:    1_200,
    confidence:      s.stage === "citizen_report" ? 100 : confidence - Math.floor(Math.random() * 5),
    decisionReason:  decisionReasons[s.stage] ?? "",
    passed:          true,
  }));
}

// ─── Generate 80 issues ───────────────────────────────────────────────────────
function buildIssues(nowMs: number) {
  const issues = [];
  const officerIds = ["OFF-RD-014","OFF-WT-009","OFF-EL-003","OFF-SW-007","OFF-DR-011","OFF-PK-005","OFF-TR-012","OFF-HT-008"];
  const reporters  = ["Priya S.","Rahul M.","Aditi K.","Vikrant G.","Meera P.","Suresh L.","Neha T.","Amit D.","Kavita R.","Ravi B.","Sunita A.","Hari N."];

  for (let i = 0; i < 80; i++) {
    const tmpl    = ISSUE_TEMPLATES[i % ISSUE_TEMPLATES.length];
    const ward    = WARDS[i % WARDS.length];
    const daysAgo = Math.floor(Math.random() * 90);
    const timeMs  = nowMs - daysAgo * 86_400_000 - Math.floor(Math.random() * 72_000_000);

    const catObj = CATEGORIES.find(c => c.id === tmpl.cat)!;
    const deptObj = DEPARTMENTS.find(d => d.id === catObj?.dept || d.id === tmpl.dept)!;
    const confidence = 85 + Math.floor(Math.random() * 14);
    const lat = 18.5204 + (Math.random() - 0.5) * 0.12;
    const lng = 73.8567 + (Math.random() - 0.5) * 0.12;

    const slaMap: Record<string, number> = { critical: 2, high: 12, medium: 24, low: 48 };
    const slaH = slaMap[tmpl.sev] ?? 24;
    const slaDeadline = Timestamp.fromMillis(timeMs + slaH * 3_600_000);

    const statusSeed = Math.random();
    const status =
      statusSeed > 0.82 ? "closed" :
      statusSeed > 0.60 ? "resolved" :
      statusSeed > 0.35 ? "in_progress" :
      statusSeed > 0.15 ? "assigned" : "submitted";

    const resolvedAt = ["resolved","closed"].includes(status)
      ? Timestamp.fromMillis(timeMs + slaH * 0.85 * 3_600_000)
      : undefined;

    const pipeline = buildAIPipeline(timeMs, tmpl.cat, tmpl.sev, deptObj?.name ?? tmpl.dept, confidence);

    const issueId = `demo_issue_${String(i + 1).padStart(4,"0")}`;
    const officerId = officerIds[i % officerIds.length];
    const reporter  = reporters[i % reporters.length];

    issues.push(removeUndefined({
      id: issueId,
      reportedBy:        `CITIZEN-${110 + (i % 12)}`,
      reporterName:      reporter,
      isAnonymous:       false,
      reporterTrustScore: 65 + Math.floor(Math.random() * 30),
      mediaUrls: [{ original: tmpl.img, thumbnail: tmpl.img, type: "image" }],
      location: {
        lat, lng,
        geohash:          `pune_demo_${i}`,
        address:          `${tmpl.sub} near ${ward} Main Road, ${ward}, Pune`,
        ward,
        city:             "Pune",
        nearbyLandmarks:  [`${ward} Municipal Office`, `${ward} Market`],
      },
      userDescription: tmpl.desc,
      aiAnalysis: {
        category:        tmpl.cat,
        subcategory:     tmpl.sub,
        severity:        tmpl.sev,
        aiDescription:   `Gemini Vision: Confirmed ${tmpl.sub} at ${ward}. Confidence ${confidence}%. Immediate routing initiated.`,
        citizenMessage:  `Your report in ${ward} has been received and forwarded to ${deptObj?.name ?? tmpl.dept}. Expected resolution within ${slaH} hours.`,
        confidence,
        contextFactors:  ["High Pedestrian Zone", "Monsoon Season Factor"],
        immediateRisk:   tmpl.sev === "critical" ? "Immediate public safety risk" : undefined,
        secondaryIssueIds: [],
      },
      aiStatus: "success",
      priority: {
        level:             tmpl.sev === "critical" ? 0 : tmpl.sev === "high" ? 1 : tmpl.sev === "medium" ? 2 : 3,
        label:             tmpl.sev.toUpperCase(),
        score:             confidence,
        citizenReason:     `Reported in ${ward} with ${tmpl.sev} severity indicators.`,
        officialReason:    `System auto-escalated based on ward density factor for ${ward}.`,
        safetyVetoApplied: tmpl.sev === "critical",
        estimatedSLAHours: slaH,
        slaDeadline,
      },
      routing: {
        primaryDepartment:  deptObj?.name ?? tmpl.dept,
        secondaryDepartments: [],
        assignedOfficerId:  officerId,
        assignedOfficerName: deptObj?.head ?? "Officer",
        routingReason:      "AI Smart Router — confidence 96%.",
        routingConfidence:  96,
      },
      status,
      statusHistory: [
        { status:"submitted",  changedAt: Timestamp.fromMillis(timeMs), changedBy:`CITIZEN-${110+(i%12)}`, note:"Incident registered via app." },
        { status:"assigned",   changedAt: Timestamp.fromMillis(timeMs + 5*60_000), changedBy:"System AI", note:`Dispatched to ${deptObj?.name ?? tmpl.dept}.` },
        ...(["in_progress","resolved","closed"].includes(status) ? [
          { status:"in_progress", changedAt:Timestamp.fromMillis(timeMs + slaH*0.3*3_600_000), changedBy:officerId, note:"Field crew confirmed work commencement." }
        ]:[]),
        ...( ["resolved","closed"].includes(status) && resolvedAt ? [
          { status:"resolved", changedAt: resolvedAt, changedBy:officerId, note:"Work completed. Resolution photos uploaded." }
        ]:[]),
        ...( status === "closed" && resolvedAt ? [
          { status:"closed", changedAt:Timestamp.fromMillis(resolvedAt.toMillis()+3600_000*2), changedBy:"System", note:"Citizen confirmed resolution. Issue closed." }
        ]:[]),
      ],
      pipelineTimeline: pipeline,
      verification: { count: Math.min(3, i%4), required:3, verifierIds:[], status: i%4>=3?"verified":"pending" },
      metrics: {
        viewCount:                  20 + Math.floor(Math.random()*300),
        shareCount:                 2  + Math.floor(Math.random()*20),
        upvoteCount:                5  + Math.floor(Math.random()*80),
        estimatedAffectedCitizens:  20 + Math.floor(Math.random()*200),
        estimatedEconomicImpact:    500 + Math.floor(Math.random()*5000),
      },
      duplicateIssueIds: [],
      aiSummary: {
        category:          tmpl.cat,
        subcategory:       tmpl.sub,
        severity:          tmpl.sev,
        confidence,
        department:        deptObj?.name ?? tmpl.dept,
        executiveSummary:  `${tmpl.sub} detected in ${ward} ward. AI routing completed with ${confidence}% confidence. ${deptObj?.name ?? tmpl.dept} crew dispatched.`,
        duplicateProbability: Math.floor(Math.random()*10),
        safetyLevel:       tmpl.sev,
        priorityScore:     confidence,
        validatorStatus:   "passed",
        visionSummary:     `Gemini Vision identified ${tmpl.sub} with high confidence. Object detection: road anomaly class confirmed.`,
        riskAssessment:    `Risk level: ${tmpl.sev}. Estimated affected radius: ${tmpl.sev==="critical"?"500m":"200m"}. Citizen impact: HIGH.`,
        priorityJustification: `Severity ${tmpl.sev.toUpperCase()} triggered by location density and time-of-day factors.`,
        recommendedDept:   deptObj?.name ?? tmpl.dept,
        slaPrediction:     `${slaH} hours — based on department capacity and issue type.`,
        costEstimate:      `₹${(2000+Math.floor(Math.random()*8000)).toLocaleString("en-IN")}`,
        requiredCrew:      tmpl.sev === "critical" ? "Emergency Response + Roads Crew" : "Standard Maintenance Team",
        citizenFriendlySummary: `Your issue has been seen and is being acted upon. The ${deptObj?.name ?? tmpl.dept} team will resolve it within ${slaH} hours.`,
        completedAt:       Timestamp.fromMillis(timeMs + 12_000),
      },
      resolution: (["resolved","closed"].includes(status) && resolvedAt) ? {
        resolvedBy:       officerId,
        resolvedAt,
        afterMediaUrls:   [tmpl.img],
        resolutionNote:   "On-site repairs completed by ward maintenance team. Post-resolution verification photos uploaded.",
        aiVerification: {
          verdict:        "FULLY_RESOLVED",
          confidence:     97,
          citizenMessage: "AI image analysis confirms issue has been fully resolved.",
          qualityScore:   93,
        },
      } : undefined,
      createdAt:   Timestamp.fromMillis(timeMs),
      updatedAt:   Timestamp.fromMillis(timeMs + 5*60_000),
    }));
  }
  return issues;
}

// ─── Generate 50 discussions ─────────────────────────────────────────────────
const DISC_TEMPLATES = [
  // Pinned official
  { type:"pinned",    title:"⚠️ Emergency Pothole Alert — Baner Road (Official Update)",                  cat:"road_damage",     content:"The Roads Department has confirmed 4 critical potholes on Baner Road. Emergency resurfacing crews dispatched. ETA: 6 hours.",             officialResponse:true, moderatorPinned:true,  trending:95 },
  { type:"pinned",    title:"🚰 Water Supply Disruption — Kothrud (Ward Notice)",                         cat:"water_issue",     content:"Scheduled maintenance on the main supply line will cause water supply disruption in Kothrud from 10am-4pm. Tankers dispatched.",           officialResponse:true, moderatorPinned:true,  trending:90 },
  { type:"pinned",    title:"Community Volunteer Drive — This Sunday 8am (Join Us!)",                     cat:"environmental",   content:"Join the monthly cleanliness drive. Meet at Ward Office Square. Gloves and bags provided. 50 volunteers registered so far!",              officialResponse:false, moderatorPinned:true, trending:88 },
  // Trending
  { type:"trending",  title:"How many potholes have YOU reported this monsoon? Share your count 🏆",     cat:"road_damage",     content:"Monsoon season has hit Pune hard. Roads are bad. Let's count! Reply with your ward and count — I'll tally them up.",                       officialResponse:false, moderatorPinned:false, trending:85 },
  { type:"trending",  title:"Streetlights in Yerawada have been out for 3 weeks — who do I escalate to?", cat:"electricity",    content:"3 complaints submitted. No response. The dark stretch near the school is a safety risk. Any tips on escalation?",                          officialResponse:true, moderatorPinned:false, trending:82 },
  { type:"trending",  title:"Success Story: Koregaon Park Pothole Fixed in 2 hours! ⭐",                  cat:"road_damage",     content:"I reported the pothole outside German Bakery at 7am. By 9:30am, Roads crew was there. Fixed by noon. CivicConnect actually works!",        officialResponse:false, moderatorPinned:false, trending:80 },
  // Solved
  { type:"solved",    title:"✅ SOLVED: Overflowing Garbage Bin — Aundh Gymkhana",                        cat:"waste_management",content:"UPDATE: After 12 upvotes, the bin was cleared and a second bin installed. Thanks to all who verified!",                                      officialResponse:true, moderatorPinned:false, trending:70 },
  { type:"solved",    title:"✅ RESOLVED: Broken Storm Drain — DP Road",                                  cat:"drainage",        content:"Drainage team replaced the steel grating yesterday. Issue closed. Screenshots of completed work in comments.",                               officialResponse:true, moderatorPinned:false, trending:68 },
  // Official responses
  { type:"official",  title:"Official Response: Sewage smell in Hadapsar — Health Dept Statement",        cat:"environmental",   content:"The Public Health team has conducted an inspection. Source identified: Blocked sewage trunk line near Kharadi. Emergency desilting begun.", officialResponse:true, moderatorPinned:false, trending:75 },
  { type:"official",  title:"Traffic Signal Upgrade — Deccan Flyover (Announcement)",                     cat:"traffic_signals", content:"As part of smart city initiative, adaptive AI traffic signals will be installed at 8 key intersections. Work begins next week.",             officialResponse:true, moderatorPinned:false, trending:72 },
  // Hot topics
  { type:"hot",       title:"Why does the AI assign 'critical' to a pothole but 'medium' to a burst pipe? Bug or feature?", cat:"water_issue", content:"I tested by submitting both types. The AI consistently scores road damage higher. Anyone from the team can clarify?",  officialResponse:true, moderatorPinned:false, trending:78 },
  { type:"hot",       title:"Monsoon Preparedness — Has your ward drain been checked?",                   cat:"drainage",        content:"With heavy rains due next week, has anyone seen the drainage team doing preventive clearing? Share your ward status below.",               officialResponse:false, moderatorPinned:false, trending:76 },
  // Weekly challenge
  { type:"challenge", title:"🏆 Weekly Challenge: Submit 3 verified reports in your ward this week",      cat:"environmental",   content:"Earn the 'Community Champion' badge by submitting 3 verified, non-duplicate civic reports this week. Badge auto-awarded on completion!",  officialResponse:false, moderatorPinned:true,  trending:83 },
  // Volunteer calls
  { type:"volunteer", title:"🌳 Volunteers Needed: Tree Plantation Drive — Pashan Lake this Sunday",      cat:"environmental",   content:"We're planting 500 saplings along the Pashan Lake perimeter. All are welcome. Breakfast provided. WhatsApp group link in comments.",       officialResponse:false, moderatorPinned:false, trending:65 },
  { type:"volunteer", title:"📦 Help needed at Blood Donation Camp — Shivajinagar, July 12",             cat:"public_safety",   content:"Looking for 10 volunteers to help coordinate registration and refreshments at the annual blood donation camp. DM me to sign up.",           officialResponse:false, moderatorPinned:false, trending:60 },
];

function buildDiscussions(nowMs: number) {
  const discussions = [];
  const authorNames = ["Priya S.","Rahul M.","Aditi K.","Vikrant G.","Maya R.","Suresh L.","Neha T.","Amit D.","Kavita R.","Ravi B."];
  const comments = [
    "Same issue in my area! Reported yesterday.",
    "Thanks for raising this — upvoted and shared.",
    "The roads dept fixed a similar one near me within 4 hours last week.",
    "This is the 3rd time this month. System needs maintenance not just repairs.",
    "I verified this issue — definitely real and urgent.",
    "AI confidence score was 94% on mine. Very accurate.",
    "Can we get an official response on ETA please?",
    "Shared on our building WhatsApp. 15 more upvotes incoming!",
  ];

  for (let i = 0; i < 50; i++) {
    const tmpl = DISC_TEMPLATES[i % DISC_TEMPLATES.length];
    const ward = WARDS[i % WARDS.length];
    const daysAgo = Math.floor(Math.random() * 30);
    const createdMs = nowMs - daysAgo * 86_400_000;
    const author = authorNames[i % authorNames.length];
    const postId = `demo_post_${String(i + 1).padStart(4,"0")}`;

    const postComments = Array.from({ length: 3 + (i % 5) }, (_, j) => ({
      id:        `${postId}_comment_${j + 1}`,
      authorId:  `CITIZEN-${110 + ((i + j) % 12)}`,
      authorName: authorNames[(i + j) % authorNames.length],
      content:   comments[(i + j) % comments.length],
      likesCount: 2 + Math.floor(Math.random() * 20),
      isModeratorReply: j === 0 && tmpl.type === "solved",
      isOfficialReply:  j === 1 && tmpl.officialResponse,
      createdAt: Timestamp.fromMillis(createdMs + (j + 1) * 3_600_000),
    }));

    discussions.push({
      id:            postId,
      title:         i >= DISC_TEMPLATES.length ? `${WARDS[i % WARDS.length]} — ${DISC_TEMPLATES[i % DISC_TEMPLATES.length].title}` : tmpl.title,
      content:       tmpl.content,
      category:      tmpl.cat,
      type:          tmpl.type,
      authorId:      `CITIZEN-${110 + (i % 12)}`,
      authorName:    author,
      authorRole:    tmpl.officialResponse && i % 3 === 0 ? "official" : "citizen",
      ward,
      isPinned:      tmpl.moderatorPinned,
      isOfficialThread: tmpl.officialResponse,
      isSolved:      tmpl.type === "solved",
      trendingScore: tmpl.trending - (i * 0.5),
      likesCount:    20 + Math.floor(Math.random() * 120),
      commentsCount: postComments.length,
      viewsCount:    100 + Math.floor(Math.random() * 800),
      comments:      postComments,
      verifiedOnly:  false,
      tags:          [tmpl.cat, ward.toLowerCase().replace(" ","_"), tmpl.type],
      createdAt:     Timestamp.fromMillis(createdMs),
      updatedAt:     Timestamp.fromMillis(createdMs + 3_600_000),
    });
  }
  return discussions;
}

// ─── Demo User Profiles ───────────────────────────────────────────────────────
function buildUserProfiles(): Record<UserRole, any> {
  const now = Timestamp.now();
  return {
    citizen: {
      displayName:  "Priya Sharma",
      email:        "citizen@civicconnect.ai",
      role:         "citizen",
      department:   null,
      bio:          "Active civic volunteer in Koregaon Park. Passionate about clean streets and safe roads.",
      locality:     "Koregaon Park",
      volunteerHours: 14,
      reputation:   82,
      supportedIssues: ["demo_issue_0001","demo_issue_0003","demo_issue_0007"],
      eventsParticipated: ["demo_event_0001","demo_event_0003"],
      trust: {
        score: 82, tier: "silver",
        totalReports: 12, verifiedReports: 10, falseReportCount: 0,
        verificationContributions: 18, resolutionConfirmations: 7,
        badges: [
          { id:"b_citizen_1", name:"First Report",       description:"Submitted your first civic issue",           icon:"🏅", earnedAt: now },
          { id:"b_citizen_2", name:"Verified Reporter",  description:"10 reports verified by community",           icon:"✅", earnedAt: now },
          { id:"b_citizen_3", name:"Community Helper",   description:"Verified 15 reports from other citizens",    icon:"🤝", earnedAt: now },
          { id:"b_citizen_4", name:"Silver Member",      description:"Reached Silver trust tier",                  icon:"🥈", earnedAt: now },
          { id:"b_citizen_5", name:"Eco Volunteer",      description:"Participated in 2 community clean-up events",icon:"🌿", earnedAt: now },
          { id:"b_citizen_6", name:"Issue Resolver",     description:"7 of your reports were fully resolved",      icon:"🔧", earnedAt: now },
        ],
        lastUpdated: now,
      },
      fcmTokens: [], notificationPreferences: { verificationRequests:true, statusUpdates:true, communityMilestones:true, weeklyDigest:false },
      createdAt: now, lastActiveAt: now,
    },
    official: {
      displayName:  "Officer Vikram Nair",
      email:        "official@civicconnect.ai",
      role:         "official",
      department:   "Roads & Infrastructure",
      officerCode:  "ROADS-VN-014",
      bio:          "Senior Roads Engineer, Pune Municipal Corporation. 11 years of infrastructure experience.",
      locality:     "Shivajinagar",
      volunteerHours: 0,
      reputation:   97,
      trust: {
        score: 100, tier: "platinum",
        totalReports: 0, verifiedReports: 0, falseReportCount: 0,
        verificationContributions: 0, resolutionConfirmations: 0,
        badges: [
          { id:"b_off_1", name:"Certified Responder",  description:"Completed official onboarding", icon:"🏆", earnedAt: now },
          { id:"b_off_2", name:"Fast Responder",       description:"Resolved 10 issues within SLA", icon:"⚡", earnedAt: now },
          { id:"b_off_3", name:"High Performer",       description:"94% SLA compliance this quarter",icon:"📈",earnedAt: now },
        ],
        lastUpdated: now,
      },
      officialStats: {
        assignedIssues: 24, resolvedIssues: 18,
        slaCompliance: 94, avgResolutionHours: 8.4,
        workloadScore: 82, pendingIssues: 6,
        departmentRank: "Top 10%",
      },
      fcmTokens: [], notificationPreferences: { verificationRequests:true, statusUpdates:true, communityMilestones:false, weeklyDigest:true },
      createdAt: now, lastActiveAt: now,
    },
    moderator: {
      displayName:  "Maya Reddy",
      email:        "moderator@civicconnect.ai",
      role:         "moderator",
      department:   null,
      bio:          "Community moderator and civic activist. Focused on keeping CivicConnect safe and constructive.",
      locality:     "Deccan Gymkhana",
      volunteerHours: 28,
      reputation:   93,
      trust: {
        score: 93, tier: "gold",
        totalReports: 4, verifiedReports: 4, falseReportCount: 0,
        verificationContributions: 42, resolutionConfirmations: 18,
        badges: [
          { id:"b_mod_1", name:"Community Guardian",  description:"Appointed community moderator",        icon:"🛡️", earnedAt: now },
          { id:"b_mod_2", name:"Spam Buster",         description:"Removed 8 spam posts",                icon:"🚫", earnedAt: now },
          { id:"b_mod_3", name:"Gold Member",         description:"Reached Gold trust tier",             icon:"🥇", earnedAt: now },
          { id:"b_mod_4", name:"Top Verifier",        description:"Highest verification count this month",icon:"🔍",earnedAt: now },
        ],
        lastUpdated: now,
      },
      moderatorStats: {
        postsReviewed: 45, spamRemoved: 8,
        communityTrustScore: 93, reportsActedOn: 12,
        actionsThisMonth: 17, appealSuccessRate: 88,
      },
      fcmTokens: [], notificationPreferences: { verificationRequests:true, statusUpdates:true, communityMilestones:true, weeklyDigest:false },
      createdAt: now, lastActiveAt: now,
    },
    admin: {
      displayName:  "Admin User",
      email:        "admin@civicconnect.ai",
      role:         "admin",
      department:   null,
      bio:          "CivicConnect platform administrator. Manages system health, users, analytics, and AI pipeline.",
      locality:     "Pune City Centre",
      volunteerHours: 0,
      reputation:   100,
      trust: {
        score: 100, tier: "platinum",
        totalReports: 0, verifiedReports: 0, falseReportCount: 0,
        verificationContributions: 0, resolutionConfirmations: 0,
        badges: [],
        lastUpdated: now,
      },
      fcmTokens: [], notificationPreferences: { verificationRequests:true, statusUpdates:true, communityMilestones:true, weeklyDigest:true },
      createdAt: now, lastActiveAt: now,
    },
  };
}

// ─── Events ───────────────────────────────────────────────────────────────────
const EVENT_DATA = [
  { id:"demo_event_0001", title:"Tree Plantation Drive",     desc:"Plant 500 saplings along Pashan Lake green belt.",                  cat:"environmental",   ward:"Pashan",          daysFromNow: 3  },
  { id:"demo_event_0002", title:"Ward Committee Meeting",    desc:"Open session on road resurfacing priorities with residents.",        cat:"infra_damage",    ward:"Kothrud",         daysFromNow: 6  },
  { id:"demo_event_0003", title:"Community Lake Cleanup",    desc:"Volunteer effort to remove plastic waste from Kothrud Lake.",       cat:"environmental",   ward:"Pashan",          daysFromNow: 10 },
  { id:"demo_event_0004", title:"Blood Donation Camp",       desc:"Annual volunteer drive with Municipal Hospital.",                   cat:"public_safety",   ward:"Shivajinagar",    daysFromNow: 12 },
  { id:"demo_event_0005", title:"Road Safety Inspection",    desc:"Walking audit of major intersections with traffic officials.",      cat:"traffic_signals", ward:"Deccan Gymkhana", daysFromNow: 15 },
  { id:"demo_event_0006", title:"Volunteer Training Session",desc:"Learn how to use the AI Incident Validation portal effectively.",  cat:"public_safety",   ward:"Aundh",           daysFromNow: 20 },
];

// ─── Notifications ────────────────────────────────────────────────────────────
const NOTIF_TEMPLATES = [
  { type:"issue_assigned",     title:"Issue Assigned",       msg:"Your report 'Large Pothole — Koregaon Park' has been assigned to Roads & Infrastructure." },
  { type:"issue_resolved",     title:"Issue Resolved ✅",    msg:"Your report 'Burst Water Main — Shivajinagar' has been resolved. Please confirm." },
  { type:"community_reply",    title:"New Reply",            msg:"Maya Reddy replied to your discussion: 'Monsoon Preparedness — Has your ward drain been checked?'" },
  { type:"official_response",  title:"Official Response",    msg:"Officer Vikram responded to your issue. Check the update." },
  { type:"emergency_alert",    title:"🚨 Emergency Alert",   msg:"Critical infrastructure failure reported near Baner. Avoid the area. Emergency crew dispatched." },
  { type:"volunteer_request",  title:"Volunteer Needed",     msg:"Tree Plantation Drive needs 5 more volunteers this Sunday. Can you help?" },
  { type:"verification_request",title:"Verify This Issue",  msg:"3 users near you have reported a pothole on Karve Road. Tap to verify." },
  { type:"badge_earned",       title:"New Badge Earned 🏅",  msg:"You earned the 'Verified Reporter' badge for 10 verified reports!" },
  { type:"weekly_digest",      title:"📊 Weekly Digest",     msg:"This week: 12 issues reported in your ward, 8 resolved, 2 pending. Community health: Good." },
  { type:"sla_warning",        title:"⚠️ SLA Due Soon",      msg:"Issue 'Streetlight Outage — Kothrud' SLA expires in 2 hours. Please update status." },
];

// ─── Main Seeding Logic ───────────────────────────────────────────────────────
async function runFullSeed(onProgress: (step: string) => void): Promise<void> {
  // Guard: seeder may only run when authenticated as admin
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error("Seeder aborted: No authenticated user. Please sign in as Admin first.");
  }

  // Verify Firestore role before seeding
  const adminDocSnap = await getDoc(doc(db, "users", currentUser.uid));
  if (!adminDocSnap.exists() || adminDocSnap.data().role !== "admin") {
    const storedRole = adminDocSnap.exists() ? adminDocSnap.data().role : "unknown";
    throw new Error(
      `Seeder aborted: Demo data can only be seeded by an Administrator.\n` +
      `Current user: ${currentUser.email} (role: "${storedRole}")\n` +
      `Please sign in as admin@civicconnect.ai and try again.`
    );
  }

  const nowMs = Date.now();
  const now   = Timestamp.now();

  // ── 1. Departments ──────────────────────────────────────────────────────────
  onProgress("Seeding departments and categories...");
  {
    const batch = writeBatch(db);
    for (const dept of DEPARTMENTS) {
      batch.set(doc(db, "departments", dept.id), removeUndefined({
        id: dept.id, name: dept.name, headOfficial: dept.head, icon: dept.icon,
        officialIds: [], isActive: true, createdAt: now, updatedAt: now,
      }), { merge: true });
    }
    for (const cat of CATEGORIES) {
      batch.set(doc(db, "categories", cat.id), {
        id: cat.id, name: cat.name, color: cat.color,
        deptId: cat.dept, enabled: true,
        createdBy: "admin_seeder", createdAt: now, updatedAt: now,
      }, { merge: true });
    }
    await batch.commit();
  }

  // ── 2. User Profiles ────────────────────────────────────────────────────────
  onProgress("Seeding demo user profiles...");
  const profiles = buildUserProfiles();
  {
    const batch = writeBatch(db);
    for (const [role, profile] of Object.entries(profiles)) {
      batch.set(doc(db, "demo_profiles", role), { ...profile, role }, { merge: true });
    }
    await batch.commit();
  }

  // ── 3. Issues (80, in chunks of 400 writes) ─────────────────────────────────
  onProgress("Generating 80 civic issues with AI pipeline data...");
  const issues = buildIssues(nowMs);

  const BATCH_SIZE = 200; // each issue has ~many fields; stay safely under 500-op limit
  for (let i = 0; i < issues.length; i += BATCH_SIZE) {
    const chunk = issues.slice(i, i + BATCH_SIZE);
    const batch = writeBatch(db);
    for (const issue of chunk) {
      batch.set(doc(db, "issues", issue.id), issue, { merge: true });
    }
    await batch.commit();
    if (i + BATCH_SIZE < issues.length) {
      onProgress(`Committing issues ${i + 1}–${Math.min(i + BATCH_SIZE, issues.length)} of ${issues.length}...`);
    }
  }

  // ── 4. Discussions (50) ─────────────────────────────────────────────────────
  onProgress("Seeding 50 community discussions...");
  const discussions = buildDiscussions(nowMs);
  for (let i = 0; i < discussions.length; i += 40) {
    const chunk = discussions.slice(i, i + 40);
    const batch = writeBatch(db);
    for (const post of chunk) {
      const { comments: postComments, ...postData } = post;
      batch.set(doc(db, "discussions", post.id), postData, { merge: true });
      for (const comment of (postComments ?? [])) {
        batch.set(doc(db, "discussions", post.id, "comments", comment.id), comment, { merge: true });
      }
    }
    await batch.commit();
  }

  // ── 5. Events ───────────────────────────────────────────────────────────────
  onProgress("Seeding community events...");
  {
    const batch = writeBatch(db);
    for (const ev of EVENT_DATA) {
      batch.set(doc(db, "events", ev.id), {
        ...ev,
        eventDate: Timestamp.fromMillis(nowMs + ev.daysFromNow * 86_400_000),
        volunteerCount: 5 + Math.floor(Math.random() * 20),
        maxVolunteers: 50,
        createdBy: "admin_seeder",
        createdAt: now,
      }, { merge: true });
    }
    await batch.commit();
  }

  // ── 6. Notifications ────────────────────────────────────────────────────────
  onProgress("Seeding notifications...");
  {
    const batch = writeBatch(db);
    for (let i = 0; i < 20; i++) {
      const tmpl = NOTIF_TEMPLATES[i % NOTIF_TEMPLATES.length];
      batch.set(doc(db, "notifications", `demo_notif_${String(i+1).padStart(4,"0")}`), {
        id:          `demo_notif_${String(i+1).padStart(4,"0")}`,
        recipientId: "demo_citizen",
        type:        tmpl.type,
        title:       tmpl.title,
        message:     tmpl.msg,
        isRead:      i > 5,
        createdAt:   Timestamp.fromMillis(nowMs - i * 3_600_000),
      }, { merge: true });
    }
    await batch.commit();
  }

  // ── 7. Analytics snapshot ───────────────────────────────────────────────────
  onProgress("Writing analytics snapshot...");
  {
    const resolvedCount  = issues.filter(iss => ["resolved","closed"].includes(iss.status)).length;
    const activeCount    = issues.filter(iss => !["resolved","closed","rejected"].includes(iss.status)).length;
    const criticalCount  = issues.filter(iss => iss.aiAnalysis.severity === "critical").length;

    await setDoc(doc(db, "system_config", "analytics_snapshot"), {
      totalIssues:           issues.length,
      resolvedIssues:        resolvedCount,
      activeIssues:          activeCount,
      criticalIssues:        criticalCount,
      resolutionRate:        Math.round((resolvedCount / issues.length) * 100),
      avgSLAHours:           11.4,
      aiAccuracy:            94.2,
      citizenSatisfaction:   88,
      departmentsOnline:     DEPARTMENTS.length,
      pendingReviews:        activeCount,
      communityHealthScore:  87,
      totalDiscussions:      discussions.length,
      totalEvents:           EVENT_DATA.length,
      lastCalculatedAt:      now,
    }, { merge: true });
  }

  // ── 8. Write versioned sentinel ─────────────────────────────────────────────
  onProgress("Finalizing demo environment...");
  const meta: DemoMeta = {
    seeded: true,
    version: CURRENT_DEMO_VERSION,
    seededAt: now,
    counts: {
      issues:       issues.length,
      discussions:  discussions.length,
      departments:  DEPARTMENTS.length,
      categories:   CATEGORIES.length,
      events:       EVENT_DATA.length,
      notifications: 20,
      badges:       10,
    },
    aiPipeline: true,
    analytics:  true,
  };
  await setDoc(doc(db, "system_config", "demo_meta"), meta);
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Check whether the demo environment needs seeding.
 * Returns true if seeding should run (version outdated, missing collections, etc.)
 * Can be called externally to check environment health.
 */
export async function needsSeeding(): Promise<boolean> {
  try {
    const snap = await getDoc(doc(db, "system_config", "demo_meta"));
    if (!snap.exists()) return true;
    const data = snap.data() as DemoMeta;
    if (!data.seeded) return true;
    if ((data.version ?? 0) < CURRENT_DEMO_VERSION) return true;
    if (!data.aiPipeline) return true;
    if (!data.analytics) return true;
    if ((data.counts?.issues ?? 0) < 70) return true;
    if ((data.counts?.discussions ?? 0) < 40) return true;
    return false;
  } catch {
    return true;
  }
}

/**
 * Main entry point called by the demo login button.
 *
 * Flow: Sign in → Read Firestore profile → Return (caller navigates).
 *
 * This function NEVER seeds, NEVER writes to Firestore, NEVER patches roles.
 * Seeding is exclusively the Admin's job via runFullSeed / populateDemoEnvironment.
 */
export async function initializeDemoEnvironment(
  role: UserRole,
  onProgress: (step: string) => void,
): Promise<{ uid: string; userDoc: any }> {
  const email = DEMO_CREDS[role];

  onProgress("Connecting to Firebase...");
  let cred;
  try {
    cred = await signInWithEmailAndPassword(auth, email, DEMO_PASSWORD);
  } catch (err: any) {
    if (err.code === "auth/user-not-found" || err.code === "auth/invalid-credential") {
      throw new Error(
        `Firebase Authentication account for "${email}" does not exist.\n` +
        `Please create it in Firebase Console → Authentication with password "DemoPassword123!"`
      );
    }
    throw err;
  }
  const uid = cred.user.uid;

  onProgress("Loading your profile...");
  const userRef  = doc(db, "users", uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    throw new Error(
      `Demo profile missing.\n\n` +
      `The Firestore document users/${uid} does not exist for ${email}.\n\n` +
      `Fix: Log in as Admin → Admin Settings → "Populate Demo Data".\n` +
      `The seeder will create all four demo user documents with the correct roles.`
    );
  }

  const userDoc = userSnap.data();

  // Log details — never write
  if (userDoc.role !== role) {
    console.warn(
      `[Demo Login] ⚠️  ROLE MISMATCH\n` +
      `  Email          : ${email}\n` +
      `  UID            : ${uid}\n` +
      `  Firestore role : "${userDoc.role}"\n` +
      `  Expected role  : "${role}"\n` +
      `  Seeder         : Skipped\n` +
      `  Fix            : Log in as Admin → "Populate Demo Data" will correct the role.`
    );
  } else {
    console.log(
      `[Demo Login] ✓\n` +
      `  Email          : ${email}\n` +
      `  UID            : ${uid}\n` +
      `  Firestore role : "${userDoc.role}"\n` +
      `  Expected role  : "${role}"\n` +
      `  Seeder         : Skipped (read-only login)\n` +
      `  Redirect       : Will be resolved by caller`
    );
  }

  return { uid, userDoc };
}

/**
 * Resets the demo environment by wiping demo_ prefixed docs, clearing the
 * sentinel, and rerunning the full seed. Real user data is never touched.
 */
export async function resetDemoEnvironment(
  onProgress: (step: string) => void,
): Promise<void> {
  onProgress("Clearing demo_meta sentinel...");
  try { await deleteDoc(doc(db, "system_config", "demo_meta")); } catch {}
  try { await deleteDoc(doc(db, "system_config", "analytics_snapshot")); } catch {}

  onProgress("Deleting demo issues...");
  {
    const snap = await getDocs(collection(db, "issues"));
    const batch = writeBatch(db);
    let c = 0;
    snap.forEach(d => {
      if (d.id.startsWith("demo_")) { batch.delete(d.ref); c++; }
    });
    if (c) await batch.commit();
  }

  onProgress("Deleting demo discussions...");
  {
    const snap = await getDocs(collection(db, "discussions"));
    const batch = writeBatch(db);
    let c = 0;
    snap.forEach(d => {
      if (d.id.startsWith("demo_")) { batch.delete(d.ref); c++; }
    });
    if (c) await batch.commit();
  }

  onProgress("Deleting demo notifications...");
  {
    const snap = await getDocs(collection(db, "notifications"));
    const batch = writeBatch(db);
    let c = 0;
    snap.forEach(d => {
      if (d.id.startsWith("demo_")) { batch.delete(d.ref); c++; }
    });
    if (c) await batch.commit();
  }

  onProgress("Re-seeding fresh demo data...");
  await runFullSeed(onProgress);
}

/**
 * Returns a status snapshot for the Demo Environment Status panel
 * in Admin Settings — no auth required.
 */
export async function getDemoEnvironmentStatus(): Promise<DemoEnvironmentStatus> {
  try {
    const snap = await getDoc(doc(db, "system_config", "demo_meta"));
    if (!snap.exists()) {
      return {
        metaExists: false, version: null, currentVersion: CURRENT_DEMO_VERSION,
        upToDate: false, seededAt: null, counts: null,
        aiPipeline: false, analytics: false,
      };
    }
    const data = snap.data() as DemoMeta;
    return {
      metaExists:     true,
      version:        data.version ?? 1,
      currentVersion: CURRENT_DEMO_VERSION,
      upToDate:       (data.version ?? 0) >= CURRENT_DEMO_VERSION,
      seededAt:       data.seededAt?.toDate() ?? null,
      counts:         data.counts ?? null,
      aiPipeline:     data.aiPipeline ?? false,
      analytics:      data.analytics  ?? false,
    };
  } catch {
    return {
      metaExists: false, version: null, currentVersion: CURRENT_DEMO_VERSION,
      upToDate: false, seededAt: null, counts: null,
      aiPipeline: false, analytics: false,
    };
  }
}

/**
 * Triggers the full seeding process directly (used by Admin settings to force-populate).
 */
export async function populateDemoEnvironment(
  onProgress: (step: string) => void
): Promise<void> {
  onProgress("Checking environment state...");
  await runFullSeed(onProgress);
}
