import { readFileSync } from "fs";
import { resolve } from "path";
import { initializeApp } from "firebase/app";
import { getFirestore, writeBatch, doc, collection, Timestamp, setDoc, getDocs } from "firebase/firestore";
import { getAuth, signInAnonymously } from "firebase/auth";

const DEMO_ISSUES = [
  {
    id: "INC-20260704-0001",
    subcategory: "Large Pothole",
    category: "road_damage",
    severity: "critical",
    confidence: 97,
    ward: "Koregaon Park",
    address: "North Main Road, Near German Bakery, Koregaon Park, Pune",
    landmark: "German Bakery",
    description: "A large pothole has appeared near the traffic signal. Vehicle damage and accident risk are extremely high.",
    department: "Roads & Infrastructure",
    slaHours: 2,
    status: "in_progress",
    lat: 18.5362, lng: 73.8930,
    agentSummary: "Vision Engine: Detected road depression near German Bakery (confidence 97%). Priority Engine: Escalated to critical safety hazard. Routing Engine: Assigned to Roads & Infrastructure.",
    citizenMessage: "Critical pothole reported near German Bakery. Roads Department has dispatched a crew to resolve this within 2 hours.",
    priority: 0,
    officer: "Officer Vikram",
    officerId: "OFF-RD-014",
    reporter: "Vikrant G.",
    image: "/images/pothole.png",
    timeStr: "2026-07-04T03:14:00Z"
  },
  {
    id: "INC-20260704-0002",
    subcategory: "Burst Water Main",
    category: "water_issue",
    severity: "high",
    confidence: 94,
    ward: "Shivajinagar",
    address: "Fergusson College Road, Near FC Social, Shivajinagar, Pune",
    landmark: "FC Social",
    description: "Water is gushing out from an underground main pipe, flooding the road and causing low water pressure in local wards.",
    department: "Water Supply & Sewerage",
    slaHours: 24,
    status: "assigned",
    lat: 18.5296, lng: 73.8472,
    agentSummary: "Vision Engine: Confirmed standing water from active pipe rupture near FC Social. Priority Engine: High severity. Routing Engine: Assigned to Water Supply Department.",
    citizenMessage: "Water leakage on FC Road reported. Pune Water Supply assigned to resolve within 24 hours.",
    priority: 1,
    officer: "Officer Suresh",
    officerId: "OFF-WT-009",
    reporter: "Aditi S.",
    image: "/images/water_main.png",
    timeStr: "2026-07-04T06:25:00Z"
  },
  {
    id: "INC-20260704-0003",
    subcategory: "Streetlight Outage",
    category: "electricity",
    severity: "high",
    confidence: 91,
    ward: "Kothrud",
    address: "Karve Road, Near Kothrud Stand, Kothrud, Pune",
    landmark: "Kothrud Stand",
    description: "Three consecutive streetlights are completely non-functional, making this busy road extremely dark and unsafe at night.",
    department: "Electricity Department",
    slaHours: 24,
    status: "submitted",
    lat: 18.5088, lng: 73.8115,
    agentSummary: "Vision Engine: Confirmed complete dark zone on Karve Road. Priority: High due to security and pedestrian risk. Routing: Assigned to Electricity Department.",
    citizenMessage: "Streetlight failure reported on Karve Road. Maharashtra Electricity assigned to repair within 24 hours.",
    priority: 1,
    officer: "Unassigned",
    officerId: "",
    reporter: "Rahul K.",
    image: "/images/streetlight.png",
    timeStr: "2026-07-04T09:42:00Z"
  },
  {
    id: "INC-20260704-0004",
    subcategory: "Illegal Garbage Dump",
    category: "waste_management",
    severity: "medium",
    confidence: 92,
    ward: "Viman Nagar",
    address: "Sakore Nagar Road, Near Symbiosis Campus, Viman Nagar, Pune",
    landmark: "Symbiosis Campus",
    description: "Large piles of plastic waste and organic garbage dumped on the pavement, blocking pedestrian access.",
    department: "Solid Waste Management",
    slaHours: 48,
    status: "assigned",
    lat: 18.5680, lng: 73.9178,
    agentSummary: "Vision Engine: Solid waste accumulation detected near Symbiosis. Priority: Medium. Routing: Assigned to Solid Waste Management.",
    citizenMessage: "Garbage dump reported on Sakore Nagar Road. Solid Waste Management assigned for collection.",
    priority: 2,
    officer: "Officer K. Patil",
    officerId: "OFF-EL-021",
    reporter: "Priya M.",
    image: "/images/garbage_dump.png",
    timeStr: "2026-07-04T11:15:00Z"
  },
  {
    id: "INC-20260704-0005",
    subcategory: "Fallen Tree Blocking Road",
    category: "green_spaces",
    severity: "high",
    confidence: 95,
    ward: "Deccan Gymkhana",
    address: "Bhandarkar Road, Near Deccan Gymkhana Club, Pune",
    landmark: "Deccan Gymkhana Club",
    description: "A large Gulmohar tree has fallen across the road, fully blocking traffic.",
    department: "Parks & Recreation",
    slaHours: 12,
    status: "resolved",
    lat: 18.5193, lng: 73.8436,
    agentSummary: "Vision Engine: Confirmed fallen tree blocking Deccan Gymkhana road. Priority: High. Routing: Assigned to Parks & Recreation.",
    citizenMessage: "Fallen tree reported on Bhandarkar Road. Parks & Recreation resolved and cleared the road.",
    priority: 1,
    officer: "Officer S. Deshpande",
    officerId: "OFF-PK-008",
    reporter: "Aniket J.",
    image: "/images/fallen_tree.png",
    timeStr: "2026-07-04T13:05:00Z"
  },
  {
    id: "INC-20260704-0006",
    subcategory: "Drainage Overflow",
    category: "drainage",
    severity: "critical",
    confidence: 96,
    ward: "Shivajinagar",
    address: "Fergusson College Road, Near Starbucks, Pune",
    landmark: "Starbucks FC Road",
    description: "Sewage drainage line is overflowing onto the footpath, causing extreme odor and unhygienic conditions.",
    department: "Drainage Department",
    slaHours: 4,
    status: "in_progress",
    lat: 18.5280, lng: 73.8412,
    agentSummary: "Vision Engine: Liquid sewage overflowing near Starbucks. Priority: Critical. Routing: Assigned to Drainage Department.",
    citizenMessage: "Drainage overflow reported near Starbucks. Drainage Department assigned to resolve within 4 hours.",
    priority: 0,
    officer: "Officer R. Shinde",
    officerId: "OFF-DR-011",
    reporter: "Tanmay B.",
    image: "/images/drain_overflow.png",
    timeStr: "2026-07-04T16:38:00Z"
  },
  {
    id: "INC-20260704-0007",
    subcategory: "Traffic Signal Failure",
    category: "other",
    severity: "critical",
    confidence: 97,
    ward: "Swargate",
    address: "Swargate Chowk, Near Jedhe Flyover, Swargate, Pune",
    landmark: "Jedhe Flyover",
    description: "Main traffic signal lights are completely blank at Swargate Chowk, causing extreme traffic gridlock.",
    department: "Traffic Management",
    slaHours: 2,
    status: "in_progress",
    lat: 18.5018, lng: 73.8629,
    agentSummary: "Vision Engine: Confirmed blank traffic signal at Swargate Chowk. Priority: Critical. Routing: Assigned to Traffic Management.",
    citizenMessage: "Traffic signal failure at Swargate Chowk reported. Traffic Management dispatched to resolve within 2 hours.",
    priority: 0,
    officer: "Officer Vikram",
    officerId: "OFF-RD-014",
    reporter: "Karan P.",
    image: "/images/traffic_signal.png",
    timeStr: "2026-07-03T10:15:00Z"
  },
  {
    id: "INC-20260704-0008",
    subcategory: "Open Manhole",
    category: "road_damage",
    severity: "critical",
    confidence: 98,
    ward: "Camp Area",
    address: "MG Road, Near West End Cinema, Camp, Pune",
    landmark: "West End Cinema",
    description: "An open storm-water manhole on MG Road has no cover or safety barricade. Extremely dangerous for two-wheelers.",
    department: "Roads & Infrastructure",
    slaHours: 4,
    status: "assigned",
    lat: 18.5126, lng: 73.8781,
    agentSummary: "Vision Engine: Confirmed missing manhole cover on MG Road. Priority: Critical. Routing: Assigned to Roads Department.",
    citizenMessage: "Missing manhole cover on MG Road reported. Roads Department assigned to secure the site within 4 hours.",
    priority: 0,
    officer: "Officer Suresh",
    officerId: "OFF-WT-009",
    reporter: "Zainab S.",
    image: "/images/open_manhole.png",
    timeStr: "2026-07-03T14:20:00Z"
  },
  {
    id: "INC-20260704-0009",
    subcategory: "Footpath Damage",
    category: "road_damage",
    severity: "medium",
    confidence: 89,
    ward: "Baner",
    address: "Baner Road, Near Balewadi High Street Entrance, Pune",
    landmark: "Balewadi High Street Entrance",
    description: "Several concrete footpath paving slabs are broken and loose, making walking hazardous for senior citizens.",
    department: "Roads & Infrastructure",
    slaHours: 48,
    status: "submitted",
    lat: 18.5590, lng: 73.7925,
    agentSummary: "Vision Engine: Displaced footpath slabs near Balewadi High Street. Priority: Medium. Routing: Assigned to Roads Department.",
    citizenMessage: "Broken footpath slabs on Baner Road reported. Roads Department scheduled for repair.",
    priority: 2,
    officer: "Unassigned",
    officerId: "",
    reporter: "Mahesh B.",
    image: "/images/footpath_damage.png",
    timeStr: "2026-07-03T19:05:00Z"
  },
  {
    id: "INC-20260704-0010",
    subcategory: "Water Leakage",
    category: "water_issue",
    severity: "low",
    confidence: 90,
    ward: "Hadapsar",
    address: "Solapur Road, Near Magarpatta City Main Gate, Pune",
    landmark: "Magarpatta City Gate",
    description: "Slow leakage of clean water from an air valve on the main supply line near Magarpatta.",
    department: "Water Supply & Sewerage",
    slaHours: 72,
    status: "resolved",
    lat: 18.5080, lng: 73.9288,
    agentSummary: "Vision Engine: Minor water valve seepage detected. Priority: Low. Routing: Assigned to Pune Water Supply.",
    citizenMessage: "Clean water leak reported on Solapur Road. Pune Water Supply has repaired the valve.",
    priority: 3,
    officer: "Officer Suresh",
    officerId: "OFF-WT-009",
    reporter: "Dinesh P.",
    image: "/images/water_leakage.png",
    timeStr: "2026-07-02T09:12:00Z"
  },
  {
    id: "INC-20260704-0011",
    subcategory: "Sewage Overflow",
    category: "drainage",
    severity: "high",
    confidence: 94,
    ward: "Yerawada",
    address: "Loop Road, Near Yerawada Jail Chowk, Pune",
    landmark: "Yerawada Jail Chowk",
    description: "Domestic sewage leaking onto Loop Road near Jail Chowk, creating odor and road slipperiness.",
    department: "Drainage Department",
    slaHours: 12,
    status: "assigned",
    lat: 18.5524, lng: 73.8845,
    agentSummary: "Vision Engine: Confirmed raw sewage backflow on Loop Road. Priority: High. Routing: Assigned to Drainage Department.",
    citizenMessage: "Sewage leak at Jail Chowk reported. Drainage Department assigned to clear the block within 12 hours.",
    priority: 1,
    officer: "Officer R. Shinde",
    officerId: "OFF-DR-011",
    reporter: "Nikhil S.",
    image: "/images/sewage_overflow.png",
    timeStr: "2026-07-02T13:45:00Z"
  },
  {
    id: "INC-20260704-0012",
    subcategory: "Broken Storm Drain",
    category: "drainage",
    severity: "medium",
    confidence: 88,
    ward: "Aundh",
    address: "DP Road, Near Aundh Gym, Pune",
    landmark: "Aundh Gym",
    description: "The steel grating of a storm water drainage inlet is cracked and collapsing under vehicles.",
    department: "Drainage Department",
    slaHours: 24,
    status: "resolved",
    lat: 18.5592, lng: 73.8043,
    agentSummary: "Vision Engine: Damaged inlet grating on DP Road. Priority: Medium. Routing: Assigned to Drainage Department.",
    citizenMessage: "Broken inlet grating reported on DP Road. Drainage Department has replaced the grating.",
    priority: 2,
    officer: "Officer R. Shinde",
    officerId: "OFF-DR-011",
    reporter: "Pradeep G.",
    image: "/images/storm_drain.png",
    timeStr: "2026-07-02T17:30:00Z"
  }
];

// Seeder environment configuration

// 1. Load env variables manually from .env
const envContent = readFileSync(resolve(".env"), "utf-8");
const envVars: Record<string, string> = {};
envContent.split("\n").forEach((line) => {
  const parts = line.split("=");
  if (parts.length >= 2) {
    envVars[parts[0].trim()] = parts.slice(1).join("=").trim();
  }
});

const firebaseConfig = {
  apiKey: envVars.VITE_FIREBASE_API_KEY,
  authDomain: envVars.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: envVars.VITE_FIREBASE_PROJECT_ID,
  messagingSenderId: envVars.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: envVars.VITE_FIREBASE_APP_ID,
};

console.log("Initializing Firebase with project:", firebaseConfig.projectId);
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Simple helper to remove undefined fields from object to match Firebase requirements
const removeUndefined = (obj: any): any => {
  if (obj === null || obj === undefined) return null;
  if (Array.isArray(obj)) {
    return obj.map(removeUndefined);
  }
  if (typeof obj === "object") {
    const res: any = {};
    for (const key in obj) {
      if (obj[key] !== undefined) {
        res[key] = removeUndefined(obj[key]);
      }
    }
    return res;
  }
  return obj;
};

async function seed() {
  console.log("Signing in anonymously...");
  const cred = await signInAnonymously(auth);
  const uid = cred.user.uid;
  console.log("Logged in with UID:", uid);

  console.log("Creating official profile to trigger custom claims...");
  const userRef = doc(collection(db, "users"), uid);
  await setDoc(userRef, {
    uid,
    email: "officer.vikram@pune.gov.in",
    displayName: "Officer Vikram",
    role: "official",
    createdAt: new Date().toISOString(),
    lastActiveAt: new Date().toISOString(),
  });

  console.log("Waiting 3 seconds for backend trigger to apply claims...");
  await new Promise(resolve => setTimeout(resolve, 3000));

  console.log("Refreshing ID token to get official claims...");
  await cred.user.getIdToken(true);

  console.log("Cleaning up legacy placeholder demo data from Firestore...");
  const issuesCol = collection(db, "issues");
  const snapshot = await getDocs(issuesCol);
  const deleteBatch = writeBatch(db);
  
  const canonicalIds = new Set(DEMO_ISSUES.map(issue => issue.id));
  let deletedCount = 0;
  
  snapshot.forEach((document) => {
    const data = document.data();
    const docId = document.id;
    
    // Deletion criteria
    const startsWithDemo = docId.startsWith("demo_") || docId.startsWith("mock_");
    
    const subcategory = (data.aiAnalysis?.subcategory || "").toLowerCase().trim();
    const userDesc = (data.userDescription || "").toLowerCase().trim();
    
    const isOldTitle = 
      subcategory === "large pothole on main road" ||
      subcategory === "burst water main — street flooding" ||
      subcategory === "illegal garbage dump blocking footpath" ||
      subcategory === "streetlight outage — dark road at night" ||
      subcategory === "fallen tree blocking road" ||
      subcategory === "infrastructure issue" ||
      subcategory === "broken water main" ||
      subcategory.includes("unknown ward") ||
      userDesc.includes("pothole on main road") ||
      userDesc.includes("street flooding") ||
      userDesc.includes("garbage dump blocking") ||
      userDesc.includes("streetlight outage") ||
      userDesc.includes("fallen tree blocking") ||
      userDesc.includes("infrastructure issue") ||
      userDesc.includes("broken water main");

    // Seeded incidents reported by demo_citizen or containing no images (or empty/placeholder camera icon)
    const isSeededByDemoCitizen = data.reportedBy === "demo_citizen" || data.reportedBy === "system_demo";
    const hasNoValidImage = !data.mediaUrls || data.mediaUrls.length === 0 || 
      !data.mediaUrls[0]?.original || 
      data.mediaUrls[0]?.original.includes("placeholder") ||
      data.mediaUrls[0]?.original.includes("camera") ||
      data.mediaUrls[0]?.original === "";
      
    const isLegacySeeded = isSeededByDemoCitizen && !canonicalIds.has(docId);
    
    if (startsWithDemo || isOldTitle || (isLegacySeeded && hasNoValidImage) || (isSeededByDemoCitizen && !canonicalIds.has(docId))) {
      deleteBatch.delete(document.ref);
      deletedCount++;
    }
  });
  
  if (deletedCount > 0) {
    console.log(`Executing deletion of ${deletedCount} legacy demo issues...`);
    await deleteBatch.commit();
    console.log("✓ Legacy issues deleted successfully.");
  } else {
    console.log("No legacy demo issues found to delete.");
  }

  console.log("Starting batch write of new seeded issues as official...");
  const batch = writeBatch(db);

  for (let i = 0; i < DEMO_ISSUES.length; i++) {
    const issue = DEMO_ISSUES[i];
    const issueId = issue.id;
    
    const createdAt = Timestamp.fromDate(new Date(issue.timeStr));
    const slaDeadline = Timestamp.fromDate(new Date(new Date(issue.timeStr).getTime() + issue.slaHours * 3_600_000));
    const completedAt = Timestamp.fromDate(new Date(new Date(issue.timeStr).getTime() + 4100));

    const docRef = doc(collection(db, "issues"), issueId);
    
    const isAIPublished = issue.status !== "submitted";

    batch.set(docRef, removeUndefined({
      id: issueId,
      reportedBy: "demo_citizen",
      isAnonymous: false,
      reporterTrustScore: 75,
      mediaUrls: [
        {
          original: issue.image,
          thumbnail: issue.image,
          type: "image"
        }
      ],
      location: {
        lat: issue.lat,
        lng: issue.lng,
        geohash: `pune_${i}`,
        address: issue.address,
        ward: issue.ward,
        city: "Pune",
        nearbyLandmarks: [issue.landmark],
      },
      userDescription: issue.description,
      aiAnalysis: {
        category: issue.category,
        subcategory: issue.subcategory,
        severity: issue.severity,
        aiDescription: issue.agentSummary,
        citizenMessage: issue.citizenMessage,
        confidence: issue.confidence,
        contextFactors: [`High Pedestrian Zone`, `Near ${issue.landmark}`],
        immediateRisk: issue.severity === "critical" ? "Immediate public safety risk" : undefined,
      },
      aiStatus: "success",
      priority: {
        level: issue.priority,
        label: issue.severity.toUpperCase(),
        score: issue.confidence,
        citizenReason: issue.citizenMessage,
        officialReason: `System escalated severity based on ward factor: ${issue.ward}.`,
        safetyVetoApplied: false,
        estimatedSLAHours: issue.slaHours,
        slaDeadline,
      },
      routing: {
        primaryDepartment: issue.department,
        secondaryDepartments: [],
        assignedOfficerId: issue.officerId || undefined,
        routingReason: "Pune Smart City automated routing.",
        routingConfidence: 94,
      },
      status: issue.status,
      statusHistory: [
        { status: "submitted", changedAt: createdAt, changedBy: `CITIZEN-${100 + i}`, note: "Incident registered." },
        { status: "assigned", changedAt: Timestamp.fromDate(new Date(createdAt.toDate().getTime() + 2 * 60_000)), changedBy: "System AI", note: `Automated routing to ${issue.department}.` }
      ],
      verification: { count: 0, required: 3, verifierIds: [], status: "pending" },
      metrics: { viewCount: 12 + i, shareCount: 2, upvoteCount: 4, estimatedAffectedCitizens: 50 },
      duplicateIssueIds: [],
      aiSummary: isAIPublished ? {
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
        completedAt,
      } : null,
      createdAt,
      updatedAt: createdAt,
    }), { merge: true });
  }

  await batch.commit();
  console.log("✓ Seeder execution complete!");
}

seed().catch(console.error);
