import { motion } from "framer-motion";

const R = 64;
const CIRC = 2 * Math.PI * R;

function scoreColor(score) {
  if (score >= 80) return { stroke: "#00FF9D", text: "text-emerald-400" };
  if (score >= 60) return { stroke: "#00F3FF", text: "text-cyan-400" };
  if (score >= 40) return { stroke: "#FFB800", text: "text-amber-400" };
  return { stroke: "#FF3B5C", text: "text-rose-500" };
}

export const ScoreGauge = ({ score = 0, label = "ATS SCORE", size = 180 }) => {
  const { stroke, text } = scoreColor(score);
  return (
    <div data-testid="ats-score-gauge" className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 160 160" className="-rotate-90">
        <circle cx="80" cy="80" r={R} fill="none" stroke="#1E293B" strokeWidth="8" />
        <motion.circle
          cx="80"
          cy="80"
          r={R}
          fill="none"
          stroke={stroke}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={CIRC}
          initial={{ strokeDashoffset: CIRC }}
          animate={{ strokeDashoffset: CIRC - (CIRC * score) / 100 }}
          transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
          style={{ filter: `drop-shadow(0 0 10px ${stroke})` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className={`font-display text-4xl font-bold ${text}`}
        >
          {score}
        </motion.span>
        <span className="mt-1 font-code text-[10px] uppercase tracking-[0.25em] text-slate-400">
          {label}
        </span>
      </div>
    </div>
  );
};
