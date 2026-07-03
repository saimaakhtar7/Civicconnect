import React, { useState } from "react";
import { useReportStore } from "../../../stores/reportStore";
import DropZone from "../media/DropZone";
import MediaPreview from "../media/MediaPreview";
import { ImageCompressionService } from "../../../services/imageCompressionService";
import { Button } from "../../ui/button";
import { ArrowRight, Loader2 } from "lucide-react";

interface Step1MediaProps {
  onNext: () => void;
}

export const Step1Media: React.FC<Step1MediaProps> = ({ onNext }) => {
  const { draft, setDraftMedia } = useReportStore();
  const [compressing, setCompressing] = useState(false);

  const handleFileAccepted = async (file: File) => {
    setCompressing(true);
    let processedFile = file;

    if (file.type.startsWith("image/")) {
      processedFile = await ImageCompressionService.compressImage(file);
    }

    const type = file.type.startsWith("video/") ? "video" : "image";
    const blobUrl = URL.createObjectURL(processedFile);

    setDraftMedia({
      file: processedFile,
      blobUrl,
      type,
      sizeBytes: processedFile.size,
    });
    setCompressing(false);
  };

  const handleRemove = () => {
    if (draft.media?.blobUrl) {
      URL.revokeObjectURL(draft.media.blobUrl);
    }
    setDraftMedia(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-gray-900">Upload Media Evidence</h2>
        <p className="text-sm text-gray-500 mt-1">
          Provide a photo or short video showing the issue. AI will analyze the details automatically.
        </p>
      </div>

      {compressing ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-gray-200 shadow-sm min-h-[220px]">
          <Loader2 className="w-8 h-8 text-civic-blue animate-spin mb-3" />
          <p className="text-sm font-semibold text-gray-900">Optimising media file...</p>
          <p className="text-xs text-gray-400 mt-1">Compressing payload for rapid upload</p>
        </div>
      ) : draft.media ? (
        <MediaPreview media={draft.media} onRemove={handleRemove} />
      ) : (
        <DropZone onFileAccepted={handleFileAccepted} />
      )}

      <div className="flex justify-end pt-4 border-t border-gray-100">
        <Button
          onClick={onNext}
          disabled={!draft.media || compressing}
          className="px-6"
        >
          Proceed to Analysis
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};
export default Step1Media;
