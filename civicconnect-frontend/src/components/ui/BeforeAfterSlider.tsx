import React, { useState, useRef } from "react";
import { ChevronsLeftRight } from "lucide-react";

interface BeforeAfterSliderProps {
  beforeImage: string;
  afterImage: string;
  beforeLabel?: string;
  afterLabel?: string;
}

export const BeforeAfterSlider: React.FC<BeforeAfterSliderProps> = ({
  beforeImage,
  afterImage,
  beforeLabel = "Before",
  afterLabel = "Repaired"
}) => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTouchOrMove = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const position = ((clientX - rect.left) / rect.width) * 100;
    setSliderPosition(Math.max(0, Math.min(100, position)));
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (e.buttons !== 1) return; // Only trigger on active click/drag
    handleTouchOrMove(e.clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length > 0) {
      handleTouchOrMove(e.touches[0].clientX);
    }
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onTouchMove={handleTouchMove}
      className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden select-none border border-gray-200 shadow-sm cursor-ew-resize"
    >
      {/* Before Image */}
      <img src={beforeImage} alt="Before State" className="absolute inset-0 w-full h-full object-cover" />
      <span className="absolute top-4 left-4 bg-black/60 text-white font-bold text-xs uppercase px-2.5 py-1 rounded-lg backdrop-blur">
        {beforeLabel}
      </span>

      {/* After Image Overlay Container */}
      <div
        className="absolute inset-y-0 right-0 overflow-hidden"
        style={{ left: `${sliderPosition}%` }}
      >
        <img
          src={afterImage}
          alt="After State"
          className="absolute top-0 right-0 w-full h-full object-cover"
          style={{
            width: containerRef.current ? containerRef.current.getBoundingClientRect().width : "100%",
            maxWidth: "none"
          }}
        />
        <span className="absolute top-4 right-4 bg-emerald-600/90 text-white font-bold text-xs uppercase px-2.5 py-1 rounded-lg backdrop-blur">
          {afterLabel}
        </span>
      </div>

      {/* Divider Bar & Drag Button */}
      <div
        className="absolute inset-y-0 w-1 bg-white hover:bg-emerald-400 cursor-ew-resize flex items-center justify-center"
        style={{ left: `${sliderPosition}%`, transform: "translateX(-50%)" }}
      >
        <div className="w-8 h-8 rounded-full bg-white text-gray-800 border-2 border-emerald-400 flex items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95">
          <ChevronsLeftRight className="w-4 h-4 text-emerald-600" />
        </div>
      </div>
    </div>
  );
};

export default BeforeAfterSlider;
