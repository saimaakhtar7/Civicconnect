import React from "react";
import { Eye, Tag } from "lucide-react";

interface ObjectDetectionListProps {
  objects: string[];
}

export const ObjectDetectionList: React.FC<ObjectDetectionListProps> = ({ objects }) => {
  if (objects.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
        <Eye className="w-3.5 h-3.5 mr-1" />
        <span>Visible Elements Detected</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {objects.map((obj, idx) => (
          <span
            key={idx}
            className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-ai-purple border border-purple-100"
          >
            <Tag className="w-3 h-3 mr-1 opacity-70" />
            {obj}
          </span>
        ))}
      </div>
    </div>
  );
};
export default ObjectDetectionList;
