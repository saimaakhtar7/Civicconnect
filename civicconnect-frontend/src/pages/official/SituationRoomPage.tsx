import React from "react";
import { Card } from "../../components/ui/card";
import { Radio } from "lucide-react";

export const SituationRoomPage: React.FC = () => {
  return (
    <div className="space-y-6 animate-card-slide-up">
      <h1 className="text-2xl font-bold tracking-tight text-gray-900">AI Situation Room</h1>
      <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed min-h-[400px]">
        <div className="p-4 bg-purple-50 text-ai-purple rounded-full mb-4">
          <Radio className="w-10 h-10 animate-pulse" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Live Command Center</h2>
        <p className="text-sm text-gray-500 max-w-md">
          The emergency command board tracking city-wide P0 alerts, active agent processing logs, and real-time heatmap overlays will be built in Sprint 2.
        </p>
      </Card>
    </div>
  );
};
export default SituationRoomPage;
