import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/card";
import { Trophy, Star, ShieldAlert, Award, Calendar, ArrowRight, Zap, Target } from "lucide-react";

export const CommunityPage: React.FC = () => {
  const leaderboard = [
    { rank: 1, name: "Pranav M.", xp: 1240, reports: 18, tier: "champion", badge: "Gold Reporter" },
    { rank: 2, name: "Aishwarya K.", xp: 980, reports: 14, tier: "leader", badge: "Civic Watch" },
    { rank: 3, name: "Rahul S.", xp: 850, reports: 12, tier: "leader", badge: "Verifier expert" },
    { rank: 4, name: "Sneha G.", xp: 620, reports: 9, tier: "verified", badge: "Active Citizen" },
    { rank: 5, name: "Vikram P.", xp: 480, reports: 7, tier: "verified", badge: "First responder" },
  ];

  const challenges = [
    {
      title: "Viman Nagar Waste Drive",
      desc: "Verify 3 solid waste reports in Sakore Road sector. Double XP active.",
      xpReward: 100,
      timeLeft: "2 days left",
      icon: Target,
      color: "text-emerald-600 bg-emerald-50 border-emerald-200",
    },
    {
      title: "Rainy Season Pothole Alert",
      desc: "Report active road damage reports in Shivajinagar. Earn special Monsoon safety badge.",
      xpReward: 150,
      timeLeft: "5 days left",
      icon: ShieldAlert,
      color: "text-amber-600 bg-amber-50 border-amber-200",
    },
  ];

  const badges = [
    { name: "Civic Pioneer", desc: "Unlock by submitting your first community report", icon: Award, color: "text-blue-500 bg-blue-50" },
    { name: "Expert Verifier", desc: "Complete 10 accurate report verifications", icon: Trophy, color: "text-purple-500 bg-purple-50" },
    { name: "Urban Guardian", desc: "Verify 3 critical P0 resolution completions", icon: Star, color: "text-yellow-500 bg-yellow-50" },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-24">
      {/* Header */}
      <div>
        <div className="flex items-center gap-1.5 mb-1">
          <Trophy className="w-4 h-4 text-yellow-500" />
          <span className="text-xs font-bold uppercase tracking-wider text-yellow-600">Community Rankings</span>
        </div>
        <h1 className="text-2xl font-black text-gray-900 tracking-tight">Ward Leaderboard</h1>
        <p className="text-xs text-gray-500 mt-0.5">
          See how your contributions score against other civic champions this month.
        </p>
      </div>

      {/* Ward Challenges */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Active Challenges</span>
          <span className="text-xs font-semibold text-civic-blue flex items-center gap-1">All Challenges <ArrowRight className="w-3 h-3" /></span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {challenges.map((c) => {
            const Icon = c.icon;
            return (
              <Card key={c.title} className={`border ${c.color.split(" ").pop()}`}>
                <CardContent className="pt-4 space-y-2">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg ${c.color.split(" ").slice(0, 2).join(" ")}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-gray-900">{c.title}</span>
                    </div>
                    <span className="text-[9px] font-bold text-gray-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {c.timeLeft}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-600 leading-relaxed">{c.desc}</p>
                  <div className="flex justify-between items-center pt-1">
                    <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5" /> +{c.xpReward} XP
                    </span>
                    <button className="text-[10px] font-bold text-civic-blue hover:text-civic-blue-dark">Join Drive</button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Leaderboard Table */}
      <Card>
        <CardHeader className="border-b border-gray-100 pb-2">
          <CardTitle className="text-sm font-bold text-gray-700">Top Civic Contributors</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="space-y-3.5">
            {leaderboard.map((user) => (
              <div key={user.rank} className="flex items-center justify-between gap-4 p-3 bg-gray-50/50 border border-gray-100 rounded-xl">
                <div className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center font-black text-xs ${
                    user.rank === 1 ? "bg-yellow-100 text-yellow-700" :
                    user.rank === 2 ? "bg-gray-200 text-gray-700" :
                    user.rank === 3 ? "bg-orange-100 text-orange-700" : "bg-gray-100 text-gray-500"
                  }`}>
                    {user.rank}
                  </span>
                  <div>
                    <span className="text-xs font-bold text-gray-900 block">{user.name}</span>
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block mt-0.5">
                      {user.badge} · {user.reports} Reports
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-black text-gray-900">{user.xp} XP</span>
                  <span className="block text-[9px] font-bold text-purple-600 bg-purple-50 px-1.5 py-0.2 rounded-full uppercase mt-1">
                    {user.tier}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Achievement Badges Overview */}
      <div className="space-y-3">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Unlockable Achievements</span>
        <div className="space-y-2">
          {badges.map((b) => {
            const Icon = b.icon;
            return (
              <div key={b.name} className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-xl">
                <div className={`p-2 rounded-xl shrink-0 ${b.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-gray-900 block">{b.name}</span>
                  <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">{b.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CommunityPage;
