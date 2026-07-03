import React, { useState } from "react";
import { useReportStore } from "../../../stores/reportStore";
import { Button } from "../../ui/button";
import { Label } from "../../ui/label";
import { ArrowLeft, ArrowRight, Eye, EyeOff, Tag } from "lucide-react";


interface Step4DetailsProps {
  onNext: () => void;
  onBack: () => void;
}

const QUICK_TAGS = ["Dangerous", "Recurring", "Near School", "Main Road", "Residential", "Emergency"];

export const Step4Details: React.FC<Step4DetailsProps> = ({ onNext, onBack }) => {
  const { draft, setDraftDetails } = useReportStore();
  const [description, setDescription] = useState(draft.userDescription);
  const [isAnonymous, setIsAnonymous] = useState(draft.isAnonymous);
  const [tags, setTags] = useState<string[]>(draft.tags);
  const [incidentTime, setIncidentTime] = useState(
    draft.incidentTime ? new Date(draft.incidentTime).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16)
  );

  const MAX_CHARS = 300;

  const toggleTag = (tag: string) => {
    setTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  };

  const handleNext = () => {
    setDraftDetails({
      userDescription: description,
      isAnonymous,
      incidentTime: new Date(incidentTime).toISOString(),
      tags,
    });
    onNext();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-gray-900">Additional Details</h2>
        <p className="text-sm text-gray-500 mt-1">
          Add extra context to help authorities act faster. All fields are optional.
        </p>
      </div>

      {/* Description */}
      <div>
        <div className="flex justify-between items-center mb-1">
          <Label htmlFor="extra-desc">Additional Notes (Optional)</Label>
          <span className={`text-xs ${description.length > MAX_CHARS ? "text-red-500" : "text-gray-400"}`}>
            {description.length}/{MAX_CHARS}
          </span>
        </div>
        <textarea
          id="extra-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value.slice(0, MAX_CHARS))}
          rows={4}
          placeholder="Describe anything the AI might have missed — sounds, smells, frequency, when it started..."
          className="flex w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-civic-blue/20 focus:border-civic-blue resize-none"
        />
      </div>

      {/* When it happened */}
      <div>
        <Label htmlFor="incident-time">When did this happen?</Label>
        <input
          id="incident-time"
          type="datetime-local"
          value={incidentTime}
          onChange={(e) => setIncidentTime(e.target.value)}
          className="flex h-10 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-500 mt-1 focus:outline-none focus:ring-2 focus:ring-civic-blue/20 focus:border-civic-blue"
        />
      </div>

      {/* Quick Tags */}
      <div>
        <Label>Quick Tags</Label>
        <div className="flex flex-wrap gap-2 mt-2">
          {QUICK_TAGS.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => toggleTag(tag)}
              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                tags.includes(tag)
                  ? "bg-civic-blue text-white border-civic-blue"
                  : "bg-white text-gray-600 border-gray-300 hover:border-civic-blue hover:text-civic-blue"
              }`}
            >
              <Tag className="w-3 h-3 mr-1" />
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Anonymous Toggle */}
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
        <div className="flex items-start space-x-3">
          {isAnonymous ? (
            <EyeOff className="w-5 h-5 text-gray-500 mt-0.5 shrink-0" />
          ) : (
            <Eye className="w-5 h-5 text-civic-blue mt-0.5 shrink-0" />
          )}
          <div>
            <p className="text-sm font-semibold text-gray-900">
              {isAnonymous ? "Reporting Anonymously" : "Reporting as Yourself"}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              {isAnonymous
                ? "Your identity will be hidden. Trust score points are forfeited."
                : "Your profile earns trust score points for resolved reports."}
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsAnonymous((prev) => !prev)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-civic-blue focus:ring-offset-2 ${
            isAnonymous ? "bg-gray-300" : "bg-civic-blue"
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
              isAnonymous ? "translate-x-1" : "translate-x-6"
            }`}
          />
        </button>
      </div>

      <div className="flex justify-between pt-4 border-t border-gray-100">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Button onClick={handleNext} className="px-6">
          Review Submission
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};
export default Step4Details;
