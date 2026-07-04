export interface GamificationStats {
  reputation: number;
  level: number;
  xpToNextLevel: number;
  progressPct: number;
  rankName: string;
  badges: Array<{ id: string; name: string; desc: string; unlocked: boolean }>;
}

export const BADGE_DEFINITIONS = [
  { id: "first_report", name: "First Report", desc: "Submitted your first community report" },
  { id: "community_helper", name: "Community Helper", desc: "Completed 3 accurate verifications" },
  { id: "volunteer", name: "Volunteer", desc: "Registered and participated in a civic event" },
  { id: "rep_100", name: "100 Reputation", desc: "Earned a reputation score of 100 or higher" },
  { id: "rep_500", name: "500 Reputation", desc: "Earned a reputation score of 500 or higher" },
  { id: "top_reporter", name: "Top Reporter", desc: "Submitted 5 verified reports" },
  { id: "neighborhood_guardian", name: "Neighborhood Guardian", desc: "Confirmed 3 issue resolutions" },
  { id: "environment_protector", name: "Environment Protector", desc: "Reported 3 green/waste issues" },
  { id: "clean_city_champion", name: "Clean City Champion", desc: "Confirmed 10 issue resolutions" },
  { id: "rapid_reporter", name: "Rapid Reporter", desc: "Submitted 8 verified reports" },
  { id: "verified_contributor", name: "Verified Contributor", desc: "Completed 10 verifications" }
];

export function calculateUserGamification(user: any): GamificationStats {
  const reportsSubmitted = user?.trust?.totalReports || 0;
  const verificationsDone = user?.trust?.verificationContributions || 0;
  const resolutionsConfirmed = user?.trust?.resolutionConfirmations || 0;
  const volunteerHours = user?.volunteerHours || 0;
  const eventsParticipated = user?.eventsParticipated?.length || 0;
  const supportedIssues = user?.supportedIssues?.length || 0;

  // Calculate Reputation Score (XP-based system)
  const reputation = (user?.reputation != null) 
    ? user.reputation 
    : (reportsSubmitted * 50 + verificationsDone * 20 + resolutionsConfirmed * 30 + volunteerHours * 15 + supportedIssues * 5);

  const level = Math.floor(reputation / 100) + 1;
  const xpInCurrentLevel = reputation % 100;
  const progressPct = xpInCurrentLevel;
  const xpToNextLevel = 100 - xpInCurrentLevel;

  // Determine user rank title
  let rankName = "Novice Watcher";
  if (level >= 10) rankName = "Civic Legend";
  else if (level >= 7) rankName = "Grand Guardian";
  else if (level >= 5) rankName = "Ward Champion";
  else if (level >= 3) rankName = "Active Citizen";

  // Evaluate badge requirements
  const badges = BADGE_DEFINITIONS.map((def) => {
    let unlocked = false;
    switch (def.id) {
      case "first_report":
        unlocked = reportsSubmitted > 0;
        break;
      case "community_helper":
        unlocked = verificationsDone >= 3;
        break;
      case "volunteer":
        unlocked = volunteerHours > 0 || eventsParticipated > 0;
        break;
      case "rep_100":
        unlocked = reputation >= 100;
        break;
      case "rep_500":
        unlocked = reputation >= 500;
        break;
      case "top_reporter":
        unlocked = reportsSubmitted >= 5;
        break;
      case "neighborhood_guardian":
        unlocked = resolutionsConfirmed >= 3;
        break;
      case "environment_protector":
        unlocked = reportsSubmitted >= 3;
        break;
      case "clean_city_champion":
        unlocked = resolutionsConfirmed >= 10;
        break;
      case "rapid_reporter":
        unlocked = reportsSubmitted >= 8;
        break;
      case "verified_contributor":
        unlocked = verificationsDone >= 10;
        break;
    }
    return { ...def, unlocked };
  });

  return {
    reputation,
    level,
    xpToNextLevel,
    progressPct,
    rankName,
    badges
  };
}
