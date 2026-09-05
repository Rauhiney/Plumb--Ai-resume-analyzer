const ITEMS = [
  "ATS OPTIMIZATION",
  "PLUMB NEURAL REASONING",
  "RECRUITER MATCH SCORE",
  "TECH STACK AUDIT",
  "BULLET REWRITE ENGINE",
  "KEYWORD DENSITY SCAN",
];

export const Marquee = () => {
  const row = [...ITEMS, ...ITEMS];
  return (
    <div
      data-testid="editorial-marquee"
      className="relative overflow-hidden border-y border-cyan-500/20 bg-[#0E131F]/60 py-5"
    >
      <div className="marquee-track flex w-max items-center gap-10">
        {[...row, ...row].map((item, i) => (
          <span
            key={i}
            className="flex items-center gap-10 font-code text-xs uppercase tracking-[0.3em] text-cyan-400/70"
          >
            {item}
            <span className="text-emerald-400/60">//</span>
          </span>
        ))}
      </div>
    </div>
  );
};
