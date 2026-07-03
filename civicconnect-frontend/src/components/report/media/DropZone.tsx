import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { ValidationService } from "../../../services/validationService";
import { Upload, Camera, FileVideo, ShieldAlert } from "lucide-react";

interface DropZoneProps {
  onFileAccepted: (file: File) => void;
}

export const DropZone: React.FC<DropZoneProps> = ({ onFileAccepted }) => {
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      setError(null);
      if (acceptedFiles.length === 0) return;

      const file = acceptedFiles[0];
      const validation = ValidationService.validateFile(file);

      if (!validation.valid) {
        setError(validation.error || "Invalid file selection.");
        return;
      }

      onFileAccepted(file);
    },
    [onFileAccepted]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".webp", ".heic"],
      "video/*": [".mp4", ".mov", ".mkv"],
    },
  });

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-300 min-h-[220px] ${
          isDragActive
            ? "border-civic-blue bg-blue-50/30 scale-[0.99]"
            : "border-gray-200 hover:border-gray-300 bg-white"
        }`}
      >
        <input {...getInputProps()} />
        <div className="p-4 bg-gray-50 text-gray-400 rounded-full mb-4">
          <Upload className={`w-8 h-8 ${isDragActive ? "text-civic-blue animate-bounce" : ""}`} />
        </div>
        <p className="text-sm font-semibold text-gray-900 text-center">
          {isDragActive ? "Drop your media file here..." : "Drag & drop photos or video here"}
        </p>
        <p className="text-xs text-gray-500 mt-1 text-center">
          or click to browse files from your device
        </p>
        <div className="flex gap-4 mt-6 text-xs text-gray-400">
          <span className="flex items-center"><Camera className="w-3.5 h-3.5 mr-1" /> JPEG, PNG, WEBP (15MB max)</span>
          <span className="flex items-center"><FileVideo className="w-3.5 h-3.5 mr-1" /> MP4, MOV (50MB max)</span>
        </div>
      </div>

      {error && (
        <div className="flex items-center p-4 text-sm text-red-800 bg-red-50 rounded-xl border border-red-100 animate-card-slide-up">
          <ShieldAlert className="w-5 h-5 mr-2 shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};
export default DropZone;
