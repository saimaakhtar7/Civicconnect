import React from "react";
import { Card } from "../../components/ui/card";
import { FileText } from "lucide-react";

export const ExecutiveReportPage: React.FC = () => {
  return (
    <div className="space-y-6 animate-card-slide-up">
      <h1 className="text-2xl font-bold tracking-tight text-gray-900">Executive Briefings</h1>
      <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed min-h-[400px]">
        <div className="p-4 bg-purple-50 text-ai-purple rounded-full mb-4">
          <FileText className="w-10 h-10" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">AI Executive Summary</h2>
        <p className="text-sm text-gray-500 max-w-md">
          Daily and weekly executive briefs compiled by Gemini 1.5 Pro summarizing municipal stats will be built in Sprint 3.
        </p>
      </Card>
    </div>
  );
};
export default ExecutiveReportPage;
