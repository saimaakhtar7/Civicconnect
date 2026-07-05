import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

/* ── Agent definitions ───────────────────────────────────────────────────── */
interface Agent {
  id: number; label: string; sub: string; color: string;
  angle: number; desc: string;
}

const AGENTS: Agent[] = [
  { id:0, label:"Citizen Report",  sub:"INPUT",    color:"#10B981", angle:0,   desc:"Receives and parses citizen reports with geo-tagged location and attached media." },
  { id:1, label:"Media Verify",    sub:"VISION AI", color:"#3B82F6", angle:45,  desc:"Analyses uploaded images using computer vision to validate content authenticity." },
  { id:2, label:"Duplicate Check", sub:"GEO-DEDUP", color:"#8B5CF6", angle:90,  desc:"Detects duplicate reports within a 50m geofence using semantic similarity." },
  { id:3, label:"Severity AI",     sub:"ML MODEL",  color:"#F59E0B", angle:135, desc:"Predicts issue severity using historical patterns and NLP scoring." },
  { id:4, label:"Priority Engine", sub:"SCORING",   color:"#EF4444", angle:180, desc:"Assigns dynamic SLA deadlines based on impact and resource availability." },
  { id:5, label:"Dept Assign",     sub:"ROUTING",   color:"#06B6D4", angle:225, desc:"Routes each report to the correct government department automatically." },
  { id:6, label:"Field Dispatch",  sub:"FIELD OPS", color:"#10B981", angle:270, desc:"Notifies field officers and tracks their en-route GPS status in real-time." },
  { id:7, label:"Citizen Alert",   sub:"OUTPUT",    color:"#A78BFA", angle:315, desc:"Sends status updates and resolution proof back to the reporting citizen." },
];

const CX = 175, CY = 175, R = 115;

function nodePos(angle: number) {
  const rad = (angle - 90) * (Math.PI / 180);
  return { x: CX + R * Math.cos(rad), y: CY + R * Math.sin(rad) };
}

/* ── Main component ──────────────────────────────────────────────────────── */
export const AIOrchestrationEngine: React.FC = () => {
  const [active, setActive]   = useState(0);
  const [hovered, setHovered] = useState<number | null>(null);

  useEffect(() => {
    const t = setInterval(() => setActive(a => (a + 1) % 8), 1600);
    return () => clearInterval(t);
  }, []);

  const fromPos = nodePos(AGENTS[active].angle);
  const toPos   = nodePos(AGENTS[(active + 1) % 8].angle);

  return (
    <div className="relative w-full select-none">
      <svg viewBox="0 0 350 380" className="w-full" style={{ maxHeight: 340 }} aria-hidden="true">
        <defs>
          <filter id="aoe-glow">
            <feGaussianBlur stdDeviation="3" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <radialGradient id="aoe-core" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="#00E676" stopOpacity="0.35"/>
            <stop offset="100%" stopColor="#00E676" stopOpacity="0"/>
          </radialGradient>
        </defs>

        {/* ── Decorative outer rings ── */}
        <circle cx={CX} cy={CY} r={R + 24} fill="none" stroke="rgba(255,255,255,0.025)" strokeWidth="1"/>
        <motion.circle cx={CX} cy={CY} r={R + 15} fill="none" stroke="#00E676"
          strokeWidth="0.7" strokeDasharray="5 9" strokeOpacity="0.18"
          animate={{ rotate: 360 }} transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
          style={{ transformOrigin: `${CX}px ${CY}px` }}
        />
        <motion.circle cx={CX} cy={CY} r={R + 7} fill="none" stroke="#3B82F6"
          strokeWidth="0.4" strokeDasharray="3 11" strokeOpacity="0.12"
          animate={{ rotate: -360 }} transition={{ duration: 34, repeat: Infinity, ease: "linear" }}
          style={{ transformOrigin: `${CX}px ${CY}px` }}
        />

        {/* ── Connection lines ── */}
        {AGENTS.map((agent, i) => {
          const pos     = nodePos(agent.angle);
          const isActive = i === active || i === (active + 1) % 8;
          const isHov    = hovered === i;
          return (
            <line key={`ln-${i}`}
              x1={CX} y1={CY} x2={pos.x} y2={pos.y}
              stroke={isActive || isHov ? agent.color : "rgba(255,255,255,0.07)"}
              strokeWidth={isActive ? 1.6 : isHov ? 1 : 0.6}
              strokeDasharray={isActive ? "none" : "3 4"}
              opacity={isActive ? 0.75 : 0.5}
              style={{ transition: "all 0.4s ease" }}
            />
          );
        })}

        {/* ── AI Core ── */}
        <circle cx={CX} cy={CY} r={44} fill="url(#aoe-core)"/>
        <motion.circle cx={CX} cy={CY} r={30} fill="rgba(0,230,118,0.07)"
          stroke="#00E676" strokeWidth={1.2} strokeOpacity={0.5}
          animate={{ r: [28, 33, 28], opacity: [0.5, 0.9, 0.5] }}
          transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
        />
        <circle cx={CX} cy={CY} r={20} fill="rgba(0,230,118,0.12)"
          stroke="#00E676" strokeWidth={1} strokeOpacity={0.7} filter="url(#aoe-glow)"/>
        <circle cx={CX} cy={CY} r={11} fill="#00E676" opacity={0.92}/>
        <text x={CX} y={CY - 46} fill="#00E676" fontSize="7" fontFamily="monospace"
          fontWeight="900" textAnchor="middle" letterSpacing="1.5">AI CORE</text>
        <text x={CX} y={CY + 54} fill="rgba(255,255,255,0.18)" fontSize="5.5"
          fontFamily="monospace" textAnchor="middle" letterSpacing="0.6">ORCHESTRATION ENGINE v3</text>

        {/* ── Primary traveling particle (keyed to force remount = restart) ── */}
        <motion.circle
          key={`pp-${active}`} r={4.5}
          fill={AGENTS[active].color} filter="url(#aoe-glow)"
          animate={{
            cx: [fromPos.x, CX, toPos.x],
            cy: [fromPos.y, CY, toPos.y],
            opacity: [0, 1, 1, 0],
            scale: [0.8, 1.4, 1.2, 0.4],
          }}
          transition={{ duration: 1.4, ease: [0.4, 0, 0.2, 1], times: [0, 0.38, 0.82, 1] }}
        />

        {/* ── Background ghost particles (continuous staggered flow) ── */}
        {AGENTS.map((agent, i) => {
          const np = nodePos(agent.angle);
          const nn = nodePos(AGENTS[(i + 1) % 8].angle);
          return (
            <motion.circle key={`gp-${i}`} r={2.5} fill={agent.color} opacity={0.3}
              animate={{
                cx: [np.x, CX, nn.x],
                cy: [np.y, CY, nn.y],
                opacity: [0, 0.38, 0.38, 0],
              }}
              transition={{ duration: 3.8, delay: i * 0.48, repeat: Infinity, ease: "linear", times: [0, 0.38, 0.85, 1] }}
            />
          );
        })}

        {/* ── Agent nodes ── */}
        {AGENTS.map((agent, i) => {
          const pos      = nodePos(agent.angle);
          const isActive = i === active || i === (active + 1) % 8;
          const isHov    = hovered === i;
          const textY    = pos.y < CY ? pos.y - 20 : pos.y + 23;
          const subY     = pos.y < CY ? pos.y - 11 : pos.y + 33;

          return (
            <g key={`nd-${i}`} style={{ cursor: "pointer" }}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            >
              {/* Active pulse ring */}
              {isActive && (
                <motion.circle cx={pos.x} cy={pos.y} r={10} fill="none"
                  stroke={agent.color} strokeWidth={1}
                  animate={{ r: [10, 20], opacity: [0.6, 0] }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: "easeOut" }}
                />
              )}
              {/* Node circle */}
              <circle cx={pos.x} cy={pos.y} r={isHov ? 13 : 10}
                fill={isActive || isHov ? agent.color + "22" : "#0C1523"}
                stroke={isActive || isHov ? agent.color : "rgba(255,255,255,0.12)"}
                strokeWidth={isActive ? 2 : 1}
                filter={isActive ? "url(#aoe-glow)" : "none"}
                style={{ transition: "all 0.3s ease" }}
              />
              <circle cx={pos.x} cy={pos.y} r={4}
                fill={isActive || isHov ? agent.color : "rgba(255,255,255,0.22)"}
                style={{ transition: "all 0.3s ease" }}
              />
              {/* Label */}
              <text x={pos.x} y={textY}
                fill={isActive || isHov ? agent.color : "rgba(255,255,255,0.58)"}
                fontSize="7.5" fontFamily="monospace" fontWeight={isActive ? "900" : "600"}
                textAnchor="middle" style={{ transition: "all 0.3s ease" }}
              >
                {agent.label}
              </text>
              <text x={pos.x} y={subY}
                fill="rgba(255,255,255,0.25)" fontSize="5.5"
                fontFamily="monospace" textAnchor="middle"
              >
                {agent.sub}
              </text>
            </g>
          );
        })}
      </svg>

      {/* ── Hover tooltip ── */}
      <AnimatePresence>
        {hovered !== null && (
          <motion.div
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }} transition={{ duration: 0.15 }}
            className="absolute bottom-0 left-0 right-0 bg-[#0C1523]/96 border border-white/10 rounded-xl p-3 backdrop-blur-sm pointer-events-none"
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="h-1.5 w-1.5 rounded-full shrink-0"
                style={{ background: AGENTS[hovered].color }}/>
              <span className="text-[10px] font-black text-white uppercase tracking-wider">
                {AGENTS[hovered].label}
              </span>
              <span className="text-[8px] font-mono text-[#6B7280] ml-auto">
                {AGENTS[hovered].sub}
              </span>
            </div>
            <p className="text-[9px] text-[#9AA3B8] leading-relaxed">
              {AGENTS[hovered].desc}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AIOrchestrationEngine;
