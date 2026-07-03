import React from "react";
import { Card } from "../../components/ui/card";
import { BarChart3 } from "lucide-react";

export const AnalyticsPage: React.FC = () => {
  return (
    <div className="space-y-6 animate-card-slide-up">
      <h1 className="text-2xl font-bold tracking-tight text-gray-900">Analytics</h1>
      <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed min-h-[400px]">
        <div className="p-4 bg-blue-50 text-civic-blue rounded-full mb-4">
          <BarChart3 className="w-10 h-10" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Metrics & Community Health Index</h2>
        <p className="text-sm text-gray-500 max-w-md">
          Ward health trackers, SLA performance metrics, resolution rate trends, and chart visualizations (Recharts) are scheduled for Sprint 3.
        </p>
      </Card>
    </div>
  );
};
export default AnalyticsPage;
