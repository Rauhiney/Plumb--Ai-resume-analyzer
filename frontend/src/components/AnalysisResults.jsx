import { motion } from "framer-motion";
import { CheckCircle2, AlertTriangle, Copy, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { ScoreGauge } from "./ScoreGauge";

const SUB_LABELS = {
  keyword_density: "Keyword Density",
  impact_quantifiers: "Impact Quantifiers",
  executive_tone: "Executive Tone",
  formatting_health: "Formatting Health",
};

function barColor(v) {
  if (v >= 80) return "bg-emerald-400";
  if (v >= 60) return "bg-cyan-400";
  if (v >= 40) return "bg-amber-400";
  return "bg-rose-500";
}

export const AnalysisResults = ({ result }) => {
  const copy = async (text) => {
    await navigator.clipboard.writeText(text);
    toast.success("Improved bullet copied to clipboard.");
  };

  return (
    <motion.div
      data-testid="analysis-results"
      initial="hidden"
      animate="show"
      variants={{ show: { transition: { staggerChildren: 0.08 } } }}
      className="space-y-4"
    >
      {/* Score + summary */}
      <motion.div
        variants={{ hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0 } }}
        className="glass-panel hud-border flex flex-col items-center gap-6 p-8 sm:flex-row"
      >
        <ScoreGauge score={result.overall_score ?? 0} />
        <div className="flex-1 text-center sm:text-left">
          <span className="border border-cyan-400/40 bg-cyan-400/10 px-3 py-1 font-code text-[10px] uppercase tracking-[0.25em] text-cyan-400">
            {result.verdict || "ANALYZED"}
          </span>
          <p data-testid="analysis-summary" className="mt-4 text-sm leading-relaxed text-slate-300">
            {result.summary}
          </p>
        </div>
      </motion.div>

      {/* Sub scores */}
      <motion.div
        variants={{ hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0 } }}
        className="glass-panel hud-border p-6"
        data-testid="sub-scores-panel"
      >
        <h3 className="font-code text-xs uppercase tracking-[0.25em] text-cyan-400">// Scoring Vectors</h3>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          {Object.entries(result.sub_scores || {}).map(([key, value]) => (
            <div key={key} data-testid={`sub-score-${key}`}>
              <div className="mb-2 flex items-center justify-between font-code text-[11px] uppercase tracking-[0.15em]">
                <span className="text-slate-400">{SUB_LABELS[key] || key}</span>
                <span className="text-slate-200">{value}</span>
              </div>
              <div className="h-1.5 w-full bg-slate-800">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${value}%` }}
                  transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
                  className={`h-full ${barColor(value)}`}
                />
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Skills */}
      <motion.div
        variants={{ hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0 } }}
        className="glass-panel hud-border p-6"
        data-testid="skills-panel"
      >
        <h3 className="font-code text-xs uppercase tracking-[0.25em] text-cyan-400">// Skills Matrix</h3>
        <div className="mt-5">
          <p className="mb-3 font-code text-[10px] uppercase tracking-[0.2em] text-emerald-400">Detected</p>
          <div className="flex flex-wrap gap-2">
            {(result.skills_detected || []).map((s) => (
              <span key={s} className="border border-emerald-400/40 bg-emerald-400/10 px-3 py-1 font-code text-xs text-emerald-400">
                {s}
              </span>
            ))}
          </div>
          {(result.skills_missing || []).length > 0 && (
            <>
              <p className="mb-3 mt-6 font-code text-[10px] uppercase tracking-[0.2em] text-amber-400">Missing / High Value</p>
              <div className="flex flex-wrap gap-2">
                {result.skills_missing.map((s) => (
                  <span key={s} className="border border-amber-400/40 bg-amber-400/10 px-3 py-1 font-code text-xs text-amber-400">
                    {s}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
      </motion.div>

      {/* Strengths & weaknesses */}
      <div className="grid gap-4 lg:grid-cols-2">
        <motion.div
          variants={{ hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0 } }}
          className="glass-panel hud-border p-6"
          data-testid="strengths-panel"
        >
          <h3 className="font-code text-xs uppercase tracking-[0.25em] text-emerald-400">// Strengths</h3>
          <ul className="mt-5 space-y-3">
            {(result.strengths || []).map((s, i) => (
              <li key={i} className="flex gap-3 text-sm leading-relaxed text-slate-300">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                {s}
              </li>
            ))}
          </ul>
        </motion.div>
        <motion.div
          variants={{ hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0 } }}
          className="glass-panel hud-border p-6"
          data-testid="weaknesses-panel"
        >
          <h3 className="font-code text-xs uppercase tracking-[0.25em] text-amber-400">// Vulnerabilities</h3>
          <ul className="mt-5 space-y-4">
            {(result.weaknesses || []).map((w, i) => (
              <li key={i} className="flex gap-3">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                <div>
                  <p className="text-sm text-slate-200">{w.issue}</p>
                  <p className="mt-1 font-code text-xs leading-relaxed text-slate-500">
                    FIX: <span className="text-cyan-400">{w.fix}</span>
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </motion.div>
      </div>

      {/* Rewrites */}
      {(result.rewrites || []).length > 0 && (
        <motion.div
          variants={{ hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0 } }}
          className="glass-panel hud-border p-6"
          data-testid="rewrites-panel"
        >
          <h3 className="font-code text-xs uppercase tracking-[0.25em] text-violet-400">// Tactical Rewrites</h3>
          <div className="mt-5 space-y-5">
            {result.rewrites.map((r, i) => (
              <div key={i} className="border border-white/10 bg-[#0D111A] p-5">
                <p className="font-code text-[10px] uppercase tracking-[0.2em] text-rose-400">Before</p>
                <p className="mt-1 text-sm text-slate-400 line-through decoration-rose-500/50">{r.before}</p>
                <div className="my-3 flex items-center gap-2 text-cyan-400">
                  <ArrowRight className="h-4 w-4" />
                </div>
                <p className="font-code text-[10px] uppercase tracking-[0.2em] text-emerald-400">After</p>
                <p className="mt-1 text-sm leading-relaxed text-slate-100">{r.after}</p>
                <button
                  data-testid={`copy-rewrite-btn-${i}`}
                  onClick={() => copy(r.after)}
                  className="mt-4 flex items-center gap-2 border border-cyan-400/40 px-4 py-2 font-code text-[10px] uppercase tracking-[0.2em] text-cyan-400 transition-colors hover:bg-cyan-400 hover:text-black"
                >
                  <Copy className="h-3 w-3" /> Copy Improved Bullet
                </button>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};
