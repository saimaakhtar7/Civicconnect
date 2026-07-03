import React from "react";
import { motion } from "framer-motion";
import { UploadState } from "../../../types/report.types";
import { Loader2 } from "lucide-react";

interface UploadProgressProps {
  state: UploadState;
}

export const UploadProgress: React.FC<UploadProgressProps> = ({ state }) => {
  if (state.status === "idle") return null;

  const getStatusLabel = () => {
    switch (state.status) {
      case "compressing":
        return "Compressing media files...";
      case "uploading":
        return `Uploading report media (${state.progress}%)...`;
      case "completed":
        return "Media successfully uploaded!";
      case "failed":
        return `Upload failed: ${state.error || "Network error"}`;
      default:
        return "";
    }
  };

  return (
    <div className="p-4 bg-white rounded-xl border border-gray-200 space-y-3 shadow-sm animate-card-slide-up">
      <div className="flex items-center justify-between text-xs font-semibold text-gray-700">
        <span className="flex items-center">
          {state.status !== "completed" && state.status !== "failed" && (
            <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin text-civic-blue" />
          )}
          {getStatusLabel()}
        </span>
        {state.status === "uploading" && <span>{state.progress}%</span>}
      </div>

      <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
        <motion.div
          className={`h-full ${state.status === "failed" ? "bg-red-500" : "bg-civic-blue"}`}
          initial={{ width: 0 }}
          animate={{
            width: state.status === "compressing" ? "10%" : `${state.progress}%`,
          }}
          transition={{ duration: 0.3 }}
        />
      </div>
    </div>
  );
};
export default UploadProgress;
