import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
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
  beforeLabel = "BEFORE REPORT",
  afterLabel  = "AFTER REPAIR",
}) => {
  const [pos, setPos]             = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [showTip, setShowTip]     = useState(false);
  const [hasIntro, setHasIntro]   = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const posRef       = useRef(50);
  const isInView     = useInView(containerRef, { once: true, margin: "-60px" });

  /* smooth eased animation to a target percentage */
  const animateTo = useCallback((target: number, duration = 900) => {
    const startVal  = posRef.current;
    const startTime = performance.now();
    const tick = (now: number) => {
      const t      = Math.min((now - startTime) / duration, 1);
      const eased  = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      const v      = startVal + (target - startVal) * eased;
      posRef.current = v;
      setPos(v);
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, []);

  /* intro animation sequence on first viewport entry */
  useEffect(() => {
    if (!isInView || hasIntro) return;
    setHasIntro(true);
    const t1 = setTimeout(() => animateTo(16, 1000), 400);   // sweep left
    const t2 = setTimeout(() => animateTo(50, 900),  1550);  // return center
    const t3 = setTimeout(() => setShowTip(true),    2700);  // tooltip in
    const t4 = setTimeout(() => setShowTip(false),   4400);  // tooltip out
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, [isInView, hasIntro, animateTo]);

  /* pointer events — works for both mouse and touch */
  const calcPos = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const v    = Math.max(2, Math.min(98, ((clientX - rect.left) / rect.width) * 100));
    posRef.current = v;
    setPos(v);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    calcPos(e.clientX);
  };
  const onPointerMove = (e: React.PointerEvent) => { if (isDragging) calcPos(e.clientX); };
  const onPointerUp   = () => setIsDragging(false);

  /* image width reference (for the "after" image to fill its clip region) */
  const containerWidth = containerRef.current?.getBoundingClientRect().width ?? "100%";

  return (
    <div
      ref={containerRef}
      className="relative w-full rounded-2xl overflow-hidden select-none border border-white/5"
      style={{ aspectRatio: "5/3", cursor: isDragging ? "col-resize" : "ew-resize" }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      {/* ── BEFORE (full-width background) ── */}
      <div className="absolute inset-0 bg-gradient-to-br from-red-950/60 via-[#0C1523] to-[#080E1A]">
        <img
          src={beforeImage} alt="Before state"
          className="absolute inset-0 w-full h-full object-cover"
          draggable={false}
          onError={e => { (e.target as HTMLImageElement).style.opacity = "0"; }}
        />
        {/* dark overlay so label reads cleanly */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/30 to-transparent pointer-events-none"/>
      </div>

      {/* BEFORE label */}
      <motion.span
        initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3, duration: 0.4 }}
        className="absolute top-3 left-3 z-20 bg-black/70 text-white font-black text-[9px] uppercase px-2.5 py-1 rounded-lg tracking-[0.12em] backdrop-blur pointer-events-none"
      >
        {beforeLabel}
      </motion.span>

      {/* ── AFTER (clipped overlay) ── */}
      <div
        className="absolute inset-y-0 right-0 overflow-hidden"
        style={{ left: `${pos}%` }}
      >
        <div
          className="absolute inset-y-0 bg-gradient-to-br from-emerald-950/40 via-[#061018] to-[#060e18]"
          style={{ left: 0, width: containerWidth }}
        >
          <img
            src={afterImage} alt="After state"
            className="absolute inset-0 h-full object-cover"
            style={{ width: containerWidth, maxWidth: "none", left: 0 }}
            draggable={false}
            onError={e => { (e.target as HTMLImageElement).style.opacity = "0"; }}
          />
          <div className="absolute inset-0 bg-gradient-to-l from-black/20 to-transparent pointer-events-none"/>
        </div>

        {/* AFTER label */}
        <motion.span
          initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5, duration: 0.4 }}
          className="absolute top-3 right-3 z-20 bg-emerald-600/90 text-white font-black text-[9px] uppercase px-2.5 py-1 rounded-lg tracking-[0.12em] backdrop-blur pointer-events-none"
        >
          {afterLabel}
        </motion.span>
      </div>

      {/* ── Divider line + handle ── */}
      <div
        className="absolute inset-y-0 z-30 flex items-center justify-center pointer-events-none"
        style={{ left: `${pos}%`, transform: "translateX(-50%)" }}
      >
        {/* line */}
        <div
          className={`absolute inset-y-0 transition-all duration-150 ${
            isDragging
              ? "w-[2px] bg-emerald-400 shadow-lg shadow-emerald-400/60"
              : "w-[1.5px] bg-white/55"
          }`}
        />
        {/* handle circle */}
        <motion.div
          animate={{
            scale: isDragging ? 1.18 : 1,
            boxShadow: isDragging
              ? "0 0 0 3px rgba(0,230,118,0.3), 0 0 24px rgba(0,230,118,0.4)"
              : "0 0 0 2px rgba(255,255,255,0.1), 0 4px 12px rgba(0,0,0,0.5)",
          }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="relative z-10 h-10 w-10 rounded-full bg-white border-2 border-emerald-400 flex items-center justify-center"
        >
          <ChevronsLeftRight className="w-4 h-4 text-emerald-600" />
        </motion.div>
      </div>

      {/* ── "Drag to compare" tooltip ── */}
      <AnimatePresence>
        {showTip && (
          <motion.div
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }} transition={{ duration: 0.2 }}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 z-40 pointer-events-none"
          >
            <div className="bg-black/85 text-white text-[9px] font-bold uppercase tracking-[0.15em] px-3.5 py-1.5 rounded-lg backdrop-blur whitespace-nowrap flex items-center gap-2">
              <ChevronsLeftRight className="w-3 h-3 text-emerald-400" />
              Drag to compare
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BeforeAfterSlider;
