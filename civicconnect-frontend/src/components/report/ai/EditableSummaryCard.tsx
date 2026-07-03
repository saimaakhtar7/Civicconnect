import React from "react";
import { useReportStore } from "../../../stores/reportStore";
import { ISSUE_CATEGORIES } from "../../../config/constants";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { PenSquare } from "lucide-react";
import { IssueCategory } from "../../../types/user.types";

export const EditableSummaryCard: React.FC = () => {
  const { draft, updateAIField } = useReportStore();
  const analysis = draft.aiAnalysis;

  if (!analysis) return null;

  return (
    <div className="space-y-4 bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
      <div className="flex items-center space-x-1.5 pb-2 border-b border-gray-100">
        <PenSquare className="w-4 h-4 text-civic-blue" />
        <h4 className="text-sm font-bold text-gray-900">Review & Edit AI Analysis</h4>
      </div>

      <div className="space-y-3">
        {/* Title */}
        <div>
          <Label htmlFor="edit-title">Suggested Title</Label>
          <Input
            id="edit-title"
            value={analysis.title}
            onChange={(e) => updateAIField("title", e.target.value)}
            className="mt-1"
          />
        </div>

        {/* Description */}
        <div>
          <Label htmlFor="edit-desc">Generated Description</Label>
          <textarea
            id="edit-desc"
            value={analysis.description}
            onChange={(e) => updateAIField("description", e.target.value)}
            rows={3}
            className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-civic-blue/20 focus:border-civic-blue mt-1"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Category */}
          <div>
            <Label htmlFor="edit-category">Category</Label>
            <select
              id="edit-category"
              value={analysis.category}
              onChange={(e) => updateAIField("category", e.target.value as IssueCategory)}
              className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-civic-blue/20 focus:border-civic-blue mt-1"
            >
              {ISSUE_CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Severity */}
          <div>
            <Label htmlFor="edit-severity">Severity Rating</Label>
            <select
              id="edit-severity"
              value={analysis.severity}
              onChange={(e) => updateAIField("severity", e.target.value as any)}
              className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-civic-blue/20 focus:border-civic-blue mt-1"
            >
              <option value="critical">Critical (Immediate response)</option>
              <option value="high">High (Within 24h)</option>
              <option value="medium">Medium (Within 3-5 days)</option>
              <option value="low">Low (Within 2 weeks)</option>
            </select>
          </div>
        </div>

        {/* Suggested Department */}
        <div>
          <Label htmlFor="edit-dept">Assigned Department</Label>
          <Input
            id="edit-dept"
            value={analysis.departmentSuggestion}
            onChange={(e) => updateAIField("departmentSuggestion", e.target.value)}
            className="mt-1"
          />
        </div>
      </div>
    </div>
  );
};
export default EditableSummaryCard;
