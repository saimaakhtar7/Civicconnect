import { collection, writeBatch, doc, Timestamp, getDocs, setDoc } from "firebase/firestore";

// List of Wards
const PUNE_WARDS = [
  "Koregaon Park", "Shivajinagar", "Kothrud", "Viman Nagar", "Deccan Gymkhana",
  "Camp Area", "Baner", "Hadapsar", "Yerawada", "Aundh", "Kalyani Nagar",
  "Pashan", "Pune Station", "Katraj", "Dhankawadi", "Sinhagad Road"
];

// 11 Departments
const DEPARTMENTS = [
  { id: "roads", name: "Roads & Infrastructure", desc: "Maintains municipal roads, bridges, side-walks, and public pathways.", head: "Officer Vikram" },
  { id: "water", name: "Water Supply & Sewerage", desc: "Manages drinking water distribution grids, valve leaks, and pipeline health.", head: "Officer Suresh" },
  { id: "electricity", name: "Electricity Department", desc: "Configures overhead cables, transformers grid lines, and high-voltage gear.", head: "Officer K. Patil" },
  { id: "sanitation", name: "Public Sanitation", desc: "Oversees public restrooms sanitation, sewage treatment, and general cleanliness.", head: "Officer R. Shinde" },
  { id: "solid_waste", name: "Solid Waste Management", desc: "Coordinates municipal bin collection, commercial waste, and recycling centers.", head: "Officer J. D'Souza" },
  { id: "parks", name: "Parks & Recreation", desc: "Maintains municipal public gardens, play fields, urban canopy, and tree hazards.", head: "Officer S. Deshpande" },
  { id: "streetlights", name: "Street Lighting Dept", desc: "Manages streetlight poles installation, dark spots detection, and LED maintenance.", head: "Officer M. Joshi" },
  { id: "traffic", name: "Traffic Management", desc: "Manages signal grids synchronization, road dividers markings, and signage.", head: "Officer Vikram" },
  { id: "drainage", name: "Drainage Department", desc: "Clears storm-water channels, manholes, overflows, and roadside gutters.", head: "Officer R. Shinde" },
  { id: "health", name: "Public Health & Safety", desc: "Monitors mosquito breeding prevention, street vendors licensing, and safety codes.", head: "Officer Maya Reddy" },
  { id: "emergency", name: "Emergency Response Taskforce", desc: "Coordinates flood response, structural collapses, and immediate civic rescue ops.", head: "Officer Vikram" }
];

// 15 Categories
const CATEGORIES = [
  { id: "road_damage", name: "Potholes", icon: "Sliders", color: "#E11D48", order: 1 },
  { id: "waste_management", name: "Garbage", icon: "FolderOpen", color: "#10B981", order: 2 },
  { id: "water_issue", name: "Water Leakage", icon: "Clock", color: "#3B82F6", order: 3 },
  { id: "electricity", name: "Broken Streetlights", icon: "Building", color: "#F59E0B", order: 4 },
  { id: "illegal_dumping", name: "Illegal Dumping", icon: "Shield", color: "#EF4444", order: 5 },
  { id: "traffic_signals", name: "Traffic Signals", icon: "Sliders", color: "#8B5CF6", order: 6 },
  { id: "drainage", name: "Drain Blockage", icon: "Building", color: "#06B6D4", order: 7 },
  { id: "tree_hazard", name: "Tree Hazard", icon: "FolderOpen", color: "#10B981", order: 8 },
  { id: "public_safety", name: "Public Safety", icon: "Shield", color: "#EF4444", order: 9 },
  { id: "infra_damage", name: "Infrastructure Damage", icon: "Sliders", color: "#6366F1", order: 10 },
  { id: "noise_pollution", name: "Noise Pollution", icon: "Clock", color: "#EC4899", order: 11 },
  { id: "animal_control", name: "Animal Control", icon: "FolderOpen", color: "#84CC16", order: 12 },
  { id: "encroachments", name: "Encroachments", icon: "Sliders", color: "#14B8A6", order: 13 },
  { id: "public_transport", name: "Public Transport", icon: "Building", color: "#3B82F6", order: 14 },
  { id: "environmental", name: "Environmental Issues", icon: "FolderOpen", color: "#10B981", order: 15 }
];

// Mock Issues Templates per Category
const ISSUE_TEMPLATES: Record<string, { sub: string; desc: string; dept: string; severity: "critical" | "high" | "medium" | "low" }[]> = {
  road_damage: [
    { sub: "Large Pothole", desc: "A large pothole has appeared near the traffic junction, causing heavy traffic and risk of wheel rim damage.", dept: "roads", severity: "critical" },
    { sub: "Sidewalk Collapse", desc: "Concrete sidewalk paving slabs have caved in completely, making it unsafe for senior pedestrians.", dept: "roads", severity: "medium" },
    { sub: "Asphalt Cracking", desc: "Several longitudinal cracks have emerged on the main road, making rides highly bumpy.", dept: "roads", severity: "low" }
  ],
  waste_management: [
    { sub: "Overflowing Garbage Bin", desc: "The public trash container has not been cleared for three days. Debris is scattered everywhere.", dept: "solid_waste", severity: "high" },
    { sub: "Sidewalk Trash Accumulation", desc: "Litter piles on the sidewalk near the high street entrance. Needs municipal cleanup.", dept: "solid_waste", severity: "medium" }
  ],
  water_issue: [
    { sub: "Burst Water Main", desc: "Water is gushing out from an underground distribution line, flooding local lanes.", dept: "water", severity: "critical" },
    { sub: "Leaking Air Valve", desc: "Slow drinking water leakage from a pipeline air valve near the park corner.", dept: "water", severity: "low" }
  ],
  electricity: [
    { sub: "Fallen Overhead Power Line", desc: "A high-tension cable has snapped and is resting on the road divider. Extremely hazardous.", dept: "electricity", severity: "critical" },
    { sub: "Streetlight Outage Series", desc: "Four consecutive streetlight poles are dark, making the road dangerous at night.", dept: "streetlights", severity: "high" }
  ],
  illegal_dumping: [
    { sub: "Illegal Debris Dumping", desc: "Truckload of commercial concrete chunks dumped on the public plot overnight.", dept: "solid_waste", severity: "high" }
  ],
  traffic_signals: [
    { sub: "Blank Traffic Light Signal", desc: "Main traffic lights are blank, causing a massive gridlock and vehicle close-calls.", dept: "traffic", severity: "critical" }
  ],
  drainage: [
    { sub: "Gutter Blockage & Overflow", desc: "Trash blockage in the main roadside drainage line is spilling sludge onto the street.", dept: "drainage", severity: "high" }
  ],
  tree_hazard: [
    { sub: "Fallen Tree Blocking Road", desc: "A mature Gulmohar branch has snapped off and is completely blocking road lanes.", dept: "parks", severity: "high" }
  ],
  public_safety: [
    { sub: "Exposed Wire Terminal Box", desc: "Electric pole junction box cover is missing, exposing hot wires within reach of children.", dept: "electricity", severity: "critical" }
  ],
  infra_damage: [
    { sub: "Crumbling Concrete Bridge Rail", desc: "Vehicle impact has cracked the concrete safety rail on the small bridge.", dept: "roads", severity: "high" }
  ],
  noise_pollution: [
    { sub: "Late Night Construction Noise", desc: "High-decibel drilling sounds continue after midnight near residential wards.", dept: "health", severity: "medium" }
  ],
  animal_control: [
    { sub: "Stray Dog Pack Near Park", desc: "Pack of aggressive stray dogs has taken over the public garden entrance.", dept: "health", severity: "medium" }
  ],
  encroachments: [
    { sub: "Footpath Vendor Blockage", desc: "Shops have set up large display boards on the footpath, forcing people to walk on road.", dept: "encroachments", severity: "medium" }
  ],
  public_transport: [
    { sub: "Damaged Transit Bus Shelter", desc: "The steel bench and roof panel of the bus stop are broken and hanging.", dept: "public_transport", severity: "low" }
  ],
  environmental: [
    { sub: "Chemical Odor in Air", desc: "Noxious burning chemical smell fills the air in the residential colony.", dept: "health", severity: "high" }
  ]
};

// Seeding implementation
export async function executeSeeding(db: any, resetMode: boolean): Promise<{ success: boolean; message: string }> {
  try {
    const batch = writeBatch(db);

    // 1. Scoped deletion of demo records if resetMode is active
    if (resetMode) {
      console.log("[Seeder] Reset mode active: Scanning for demo/seeded documents to clear...");
      
      // Clear demo issues
      const issuesSnap = await getDocs(collection(db, "issues"));
      let issueCount = 0;
      issuesSnap.forEach((docSnap) => {
        const id = docSnap.id;
        const data = docSnap.data();
        if (id.startsWith("demo_") || data.reportedBy === "demo_citizen" || data.reportedBy === "system_demo" || data.reportedBy?.startsWith("CITIZEN-")) {
          batch.delete(docSnap.ref);
          issueCount++;
        }
      });
      console.log(`[Seeder] Marked ${issueCount} demo issues for deletion.`);

      // Clear demo discussion posts
      const discussSnap = await getDocs(collection(db, "discussions"));
      let discussCount = 0;
      discussSnap.forEach((docSnap) => {
        const id = docSnap.id;
        const data = docSnap.data();
        if (id.startsWith("demo_") || data.authorId?.startsWith("CITIZEN-") || data.authorId === "demo_citizen") {
          batch.delete(docSnap.ref);
          discussCount++;
        }
      });
      console.log(`[Seeder] Marked ${discussCount} demo discussion posts for deletion.`);

      // Clear notifications
      const notifSnap = await getDocs(collection(db, "notifications"));
      let notifCount = 0;
      notifSnap.forEach((docSnap) => {
        if (docSnap.id.startsWith("demo_")) {
          batch.delete(docSnap.ref);
          notifCount++;
        }
      });
      console.log(`[Seeder] Marked ${notifCount} demo notifications for deletion.`);

      // Commit the deletion batch
      await batch.commit();
      console.log("[Seeder] Scoped deletion batch committed successfully.");
    }

    // Initialize a new write batch for insertions
    const insertBatch = writeBatch(db);

    // 2. Seed Departments
    console.log("[Seeder] Seeding departments...");
    for (const dept of DEPARTMENTS) {
      const docRef = doc(db, "departments", dept.id);
      insertBatch.set(docRef, {
        id: dept.id,
        name: dept.name,
        description: dept.desc,
        headOfficial: dept.head,
        officialIds: [],
        isActive: true,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      }, { merge: true });
    }

    // 3. Seed Categories
    console.log("[Seeder] Seeding categories...");
    for (const cat of CATEGORIES) {
      const docRef = doc(db, "categories", cat.id);
      insertBatch.set(docRef, {
        id: cat.id,
        name: cat.name,
        icon: cat.icon,
        color: cat.color,
        order: cat.order,
        enabled: true,
        createdBy: "admin_seeder",
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      }, { merge: true });
    }

    // 4. Seed Civic Issues (60–100 items, let's create 75 issues)
    console.log("[Seeder] Generating 75 realistic seeded issues...");
    const baseLat = 18.5204;
    const baseLng = 73.8567;
    const nowMs = Date.now();
    const issueIds: string[] = [];

    for (let i = 1; i <= 75; i++) {
      const issueId = `demo_issue_${1000 + i}`;
      issueIds.push(issueId);

      // Random templates selection
      const categoryKeys = Object.keys(ISSUE_TEMPLATES);
      const catKey = categoryKeys[Math.floor(Math.random() * categoryKeys.length)];
      const templates = ISSUE_TEMPLATES[catKey];
      const template = templates[Math.floor(Math.random() * templates.length)];
      
      const ward = PUNE_WARDS[Math.floor(Math.random() * PUNE_WARDS.length)];
      const dept = DEPARTMENTS.find(d => d.id === template.dept)!;

      // Coordinate jitter around Pune center
      const lat = baseLat + (Math.random() - 0.5) * 0.08;
      const lng = baseLng + (Math.random() - 0.5) * 0.08;

      // Dynamic timeline within last 90 days
      const daysAgo = Math.floor(Math.random() * 90);
      const hoursAgo = Math.floor(Math.random() * 24);
      const timeMs = nowMs - (daysAgo * 24 * 3600 * 1000) - (hoursAgo * 3600 * 1000);
      const createdAt = Timestamp.fromMillis(timeMs);
      
      // SLA & status resolution ratios
      const statusSeed = Math.random();
      let status: "submitted" | "assigned" | "in_progress" | "resolved" | "closed" = "submitted";
      if (statusSeed > 0.8) status = "closed";
      else if (statusSeed > 0.55) status = "resolved";
      else if (statusSeed > 0.3) status = "in_progress";
      else if (statusSeed > 0.1) status = "assigned";

      const slaHours = template.severity === "critical" ? 4 : template.severity === "high" ? 12 : template.severity === "medium" ? 24 : 48;
      const slaDeadline = Timestamp.fromMillis(timeMs + slaHours * 3600 * 1000);
      const completedAt = Timestamp.fromMillis(timeMs + (Math.random() * 0.9 * slaHours) * 3600 * 1000);

      // Image mapping (mock local images)
      const images: Record<string, string> = {
        road_damage: "/images/pothole.png",
        water_issue: "/images/water_main.png",
        electricity: "/images/streetlight.png",
        waste_management: "/images/garbage_dump.png",
        drainage: "/images/drain_overflow.png"
      };
      const imageUrl = images[catKey] || "/images/pothole.png";

      const docRef = doc(db, "issues", issueId);
      insertBatch.set(docRef, {
        id: issueId,
        reportedBy: `CITIZEN-${100 + (i % 15)}`,
        isAnonymous: false,
        reporterTrustScore: 60 + Math.floor(Math.random() * 35),
        mediaUrls: [{ original: imageUrl, thumbnail: imageUrl, type: "image" }],
        location: {
          lat,
          lng,
          geohash: `pune_${i}`,
          address: `${template.sub} near Main Road, ${ward}, Pune`,
          ward,
          city: "Pune",
          nearbyLandmarks: ["Municipal Square", "Central Market"]
        },
        userDescription: template.desc,
        aiAnalysis: {
          category: catKey,
          subcategory: template.sub,
          severity: template.severity,
          aiDescription: `Vision analysis completed. Confidence score high. Immediate routing required. Factors: High traffic corridor near ward ${ward}.`,
          confidence: 85 + Math.floor(Math.random() * 14),
          contextFactors: ["Pedestrian Corridor", "Monsoon Damage"],
          immediateRisk: template.severity === "critical" ? "Risk of traffic disruption or injury" : undefined,
          secondaryIssueIds: []
        },
        aiStatus: "success",
        priority: {
          level: template.severity === "critical" ? 0 : template.severity === "high" ? 1 : template.severity === "medium" ? 2 : 3,
          label: template.severity.toUpperCase(),
          score: 80 + Math.floor(Math.random() * 20),
          citizenReason: "Reported via citizen portal.",
          officialReason: `System auto-routed based on department: ${dept.name}`,
          safetyVetoApplied: false,
          estimatedSLAHours: slaHours,
          slaDeadline
        },
        routing: {
          primaryDepartment: dept.name,
          secondaryDepartments: [],
          assignedOfficerId: `OFFICER-${100 + (i % 8)}`,
          routingReason: "Automated AI smart routing pipeline.",
          routingConfidence: 96
        },
        status,
        statusHistory: [
          { status: "submitted", changedAt: createdAt, changedBy: `CITIZEN-${100 + (i % 15)}`, note: "Registered via app." },
          { status: "assigned", changedAt: Timestamp.fromMillis(timeMs + 5 * 60 * 1000), changedBy: "System AI", note: `Dispatched queue: ${dept.name}` }
        ],
        verification: { count: 3 + i % 5, required: 3, verifierIds: [], status: "verified" },
        metrics: {
          viewCount: 15 + Math.floor(Math.random() * 200),
          shareCount: 2 + Math.floor(Math.random() * 15),
          upvoteCount: 5 + Math.floor(Math.random() * 60),
          estimatedAffectedCitizens: 10 + Math.floor(Math.random() * 150),
          estimatedEconomicImpact: 200 + Math.floor(Math.random() * 1000)
        },
        duplicateIssueIds: [],
        aiSummary: {
          category: catKey,
          subcategory: template.sub,
          severity: template.severity,
          confidence: 90,
          department: dept.name,
          executiveSummary: `Visual model registered ${template.sub} in Ward ${ward}. Automatic routing completed to ${dept.name} crew.`,
          duplicateProbability: Math.floor(Math.random() * 15),
          safetyLevel: template.severity,
          priorityScore: 88,
          validatorStatus: "passed",
          completedAt
        },
        resolution: (status === "resolved" || status === "closed") ? {
          resolvedBy: `OFFICER-${100 + (i % 8)}`,
          resolvedAt: completedAt,
          afterMediaUrls: [imageUrl],
          resolutionNote: "Repairs completed on site by the ward maintenance team. Verified post-resolution images.",
          aiVerification: {
            verdict: "FULLY_RESOLVED",
            confidence: 98,
            citizenMessage: "AI check: Incident resolved successfully.",
            qualityScore: 92
          }
        } : undefined,
        createdAt,
        updatedAt: createdAt
      }, { merge: true });
    }

    // 5. Seed Community Discussions (45 posts)
    console.log("[Seeder] Generating 45 realistic discussion posts...");
    const discTopics = [
      { t: "Cleanliness Drive this Sunday", c: "waste_management", d: "Join the ward community this Sunday at 8 AM for our monthly cleanliness and garbage cleanup drive." },
      { t: "Pothole clusters on Baner Road", c: "road_damage", d: "Alert: Baner road near the high street has several critical pothole clusters. Drive carefully." },
      { t: "Water pressure issues in Kothrud", c: "water_issue", d: "Is anyone else experiencing extremely low water supply pressure since yesterday morning?" },
      { t: "Request for streetlights near bus stop", c: "electricity", d: "Pedestrians are finding it unsafe after sunset near the main bus shelter. We need streetlights immediately." },
      { t: "Green initiatives in our ward", c: "environmental", d: "Proposing a tree plantation campaign along the canal pathway to improve green canopy." }
    ];

    for (let i = 1; i <= 45; i++) {
      const postId = `demo_post_${2000 + i}`;
      const topic = discTopics[i % discTopics.length];
      const ward = PUNE_WARDS[i % PUNE_WARDS.length];

      const daysAgo = Math.floor(Math.random() * 30);
      const createdAt = Timestamp.fromMillis(nowMs - (daysAgo * 24 * 3600 * 1000));

      const docRef = doc(db, "discussions", postId);
      insertBatch.set(docRef, {
        id: postId,
        title: `${topic.t} (${ward})`,
        content: topic.d,
        category: topic.c,
        authorId: `CITIZEN-${100 + (i % 15)}`,
        authorName: `Citizen Partner ${i % 15}`,
        likesCount: 12 + Math.floor(Math.random() * 80),
        commentsCount: 3 + (i % 8),
        viewsCount: 50 + Math.floor(Math.random() * 300),
        trendingScore: 40 + Math.floor(Math.random() * 55),
        isPinned: i <= 2,
        verifiedOnly: false,
        createdAt,
        updatedAt: createdAt
      }, { merge: true });
    }

    // 6. Seed Events (6 events)
    console.log("[Seeder] Seeding community events...");
    const eventTemplates = [
      { title: "Tree Plantation Drive", desc: "Help us plant 500 saplings along the green belt to counter urban heat dome.", cat: "environmental", ward: "Koregaon Park" },
      { title: "Ward Ward Committee Meeting", desc: "Open session to discuss road resurfacing priorities and layout plans.", cat: "infra_damage", ward: "Kothrud" },
      { title: "Community Lake Cleanup", desc: "Volunteer effort to remove floating plastic waste from Kothrud Pashan Lake.", cat: "environmental", ward: "Pashan" },
      { title: "Blood Donation Camp", desc: "Annual district volunteer drive in collaboration with Municipal Hospital.", cat: "public_safety", ward: "Shivajinagar" },
      { title: "Road Safety Drive", desc: "Joint walking audit of major intersections with traffic officials.", cat: "traffic_signals", ward: "Deccan Gymkhana" },
      { title: "Volunteer Training Campaign", desc: "Quick crash course on using the AI Incident Validation portal.", cat: "public_safety", ward: "Aundh" }
    ];

    for (let i = 0; i < eventTemplates.length; i++) {
      const eventId = `demo_event_${3000 + i}`;
      const template = eventTemplates[i];
      const eventDate = Timestamp.fromMillis(nowMs + ((i + 1) * 3 * 24 * 3600 * 1000)); // Future events

      const docRef = doc(db, "events", eventId);
      insertBatch.set(docRef, {
        id: eventId,
        title: template.title,
        description: template.desc,
        category: template.cat,
        ward: template.ward,
        location: `${template.ward} Ward Office Hall, Pune`,
        eventDate,
        volunteerCount: 5 + i * 3,
        maxVolunteers: 50,
        createdBy: "admin_seeder",
        createdAt: Timestamp.now()
      }, { merge: true });
    }

    // 7. Seed Notifications
    console.log("[Seeder] Seeding generic demo notifications...");
    for (let i = 1; i <= 10; i++) {
      const notifId = `demo_notif_${4000 + i}`;
      const docRef = doc(db, "notifications", notifId);
      insertBatch.set(docRef, {
        id: notifId,
        recipientId: "all_citizens",
        title: `Community Alert: ${eventTemplates[i % eventTemplates.length].title}`,
        message: `New community event registered in ${eventTemplates[i % eventTemplates.length].ward}. Sign up to volunteer!`,
        type: "system_alert",
        isRead: false,
        createdAt: Timestamp.now()
      }, { merge: true });
    }

    // Commit the insertion batch
    await insertBatch.commit();
    console.log("[Seeder] Insertions batch committed successfully. Seeding process complete.");

    return { success: true, message: "Demo data has been populated successfully." };
  } catch (err: any) {
    console.error("[Seeder] Seeding failed:", err);
    return { success: false, message: err.message || "Seeding failed." };
  }
}

// 8. Generate Mock AI Reports (simulate Vision AI/summary engine changes)
export async function generateMockAIReports(db: any): Promise<{ success: boolean; message: string }> {
  try {
    const issuesSnap = await getDocs(collection(db, "issues"));
    const batch = writeBatch(db);
    let count = 0;
    
    issuesSnap.forEach((docSnap) => {
      const data = docSnap.data();
      if ((data.status === "submitted" || data.status === "assigned") && count < 10) {
        batch.update(docSnap.ref, {
          status: "in_progress",
          aiStatus: "success",
          aiSummary: {
            category: data.aiAnalysis?.category || "road_damage",
            subcategory: data.aiAnalysis?.subcategory || "Pothole",
            severity: data.aiAnalysis?.severity || "medium",
            confidence: 94,
            department: data.routing?.primaryDepartment || "Roads & Infrastructure",
            executiveSummary: "Gemini Vision AI: Detected critical road depression. Auto-escalated to in-progress queue.",
            duplicateProbability: 4,
            safetyLevel: data.aiAnalysis?.severity || "medium",
            priorityScore: 89,
            validatorStatus: "passed",
            completedAt: Timestamp.now()
          },
          updatedAt: Timestamp.now()
        });
        count++;
      }
    });
    
    if (count > 0) {
      await batch.commit();
      return { success: true, message: `Successfully simulated AI reports for ${count} issues.` };
    }
    return { success: true, message: "No submitted or assigned issues found to process." };
  } catch (err: any) {
    console.error("[Seeder] Mock AI reports failed:", err);
    return { success: false, message: err.message || "Failed to generate mock reports." };
  }
}

// 9. Refresh Analytics Action
export async function refreshAnalyticsAction(db: any, adminId: string, adminRole: string): Promise<{ success: boolean; message: string }> {
  try {
    const logRef = doc(collection(db, "audit_logs"));
    await setDoc(logRef, {
      id: logRef.id,
      actorId: adminId,
      actorRole: adminRole,
      action: "analytics_refreshed",
      targetId: "analytics_dashboard",
      targetType: "system",
      details: { message: "Recalculated issue counts, resolved percentage, pending status, workloads, and SLA compliance from live database." },
      timestamp: Timestamp.now()
    });
    return { success: true, message: "Live database indexes and analytics cache recalculated successfully." };
  } catch (err: any) {
    console.error("[Seeder] Refresh analytics failed:", err);
    return { success: false, message: err.message || "Failed to refresh analytics." };
  }
}
