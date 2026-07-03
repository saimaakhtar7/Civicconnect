import React from "react";
import { useAuthStore } from "../../stores/authStore";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/card";
import { AlertCircle, CheckCircle2, Clock, Landmark, Radio } from "lucide-react";

export const DashboardPage: React.FC = () => {
  const { user } = useAuthStore();

  const kpis = [
    { label: "Active Issues", value: "0", subtext: "0 assigned to you", icon: AlertCircle, color: "text-blue-600 bg-blue-50" },
    { label: "Resolved Today", value: "0", subtext: "0 verified by AI", icon: CheckCircle2, color: "text-green-600 bg-green-50" },
    { label: "SLA Breach Risk", value: "0", subtext: "Within 2 hours", icon: Clock, color: "text-red-600 bg-red-50" },
  ];

  return (
    <div className="space-y-6 animate-card-slide-up">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500">
            Welcome back, Officer {user?.displayName || "Official"}.
          </p>
        </div>
        <span className="inline-flex items-center rounded-md bg-blue-50 px-2.5 py-1 text-xs font-semibold text-civic-blue ring-1 ring-inset ring-blue-700/10">
          Department: {user?.department?.toUpperCase()}
        </span>
      </div>

      {/* KPI stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <Card key={idx}>
              <CardContent className="pt-6 flex justify-between items-start">
                <div className="space-y-2">
                  <span className="text-sm font-medium text-gray-500">{kpi.label}</span>
                  <span className="block text-3xl font-extrabold text-gray-900">{kpi.value}</span>
                  <span className="block text-xs text-gray-500">{kpi.subtext}</span>
                </div>
                <div className={`p-3 rounded-lg ${kpi.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Live feed placeholder */}
        <Card className="p-6">
          <CardHeader className="px-0 pt-0">
            <CardTitle>Recent Ward Activity</CardTitle>
          </CardHeader>
          <CardContent className="px-0 pb-0 flex flex-col items-center justify-center min-h-[200px] text-gray-500 text-center border-2 border-dashed border-gray-100 rounded-lg">
            <Radio className="w-8 h-8 mb-2 text-gray-400 animate-pulse" />
            <h4 className="font-semibold text-gray-900">Live Agent Feed</h4>
            <p className="text-xs text-gray-400 mt-1 max-w-xs">
              Live updates of Firestore updates from active AI Agent pipelines are scheduled for Sprint 2.
            </p>
          </CardContent>
        </Card>

        {/* Quick action list */}
        <Card className="p-6">
          <CardHeader className="px-0 pt-0">
            <CardTitle>Municipal Administration</CardTitle>
          </CardHeader>
          <CardContent className="px-0 pb-0 space-y-4">
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
              <Landmark className="w-5 h-5 text-gray-400" />
              <div>
                <h4 className="text-sm font-semibold text-gray-900">SLA Target Rules</h4>
                <p className="text-xs text-gray-500">ROADS: 4h Critical, 24h High, 72h Medium</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
              <Landmark className="w-5 h-5 text-gray-400" />
              <div>
                <h4 className="text-sm font-semibold text-gray-900">Officer Registration Code</h4>
                <p className="text-xs text-gray-500">{user?.officerCode || "N/A"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
export default DashboardPage;
