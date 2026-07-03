import React from "react";
import { Trash2, Film, Image } from "lucide-react";
import { MediaUpload } from "../../../types/report.types";

interface MediaPreviewProps {
  media: MediaUpload;
  onRemove: () => void;
}

export const MediaPreview: React.FC<MediaPreviewProps> = ({ media, onRemove }) => {
  const isVideo = media.type === "video";
  const sizeMb = (media.sizeBytes / (1024 * 1024)).toFixed(2);

  return (
    <div className="relative overflow-hidden rounded-2xl bg-black border border-gray-200 shadow-sm group animate-card-slide-up">
      <div className="aspect-video w-full max-h-[360px] flex items-center justify-center">
        {isVideo ? (
          <video
            src={media.blobUrl}
            controls
            className="w-full h-full object-contain"
            playsInline
          />
        ) : (
          <img
            src={media.blobUrl}
            alt="Preview"
            className="w-full h-full object-contain"
          />
        )}
      </div>

      {/* Floating Header Info */}
      <div className="absolute top-4 left-4 z-10 flex items-center space-x-2 bg-black/60 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-xs font-medium">
        {isVideo ? <Film className="w-3.5 h-3.5" /> : <Image className="w-3.5 h-3.5" />}
        <span>{media.file.name}</span>
        <span className="opacity-60">|</span>
        <span>{sizeMb} MB</span>
      </div>

      {/* Trash float button */}
      <button
        onClick={onRemove}
        className="absolute top-4 right-4 z-10 p-2 bg-red-600 hover:bg-red-700 text-white rounded-full transition-colors shadow-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
        title="Remove Media"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
};
export default MediaPreview;
