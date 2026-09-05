import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BrainCircuit,
  FileScan,
  Gauge,
  Sparkles,
  Target,
  Zap,
} from "lucide-react";
import { Hero3D } from "../components/Hero3D";
import { Marquee } from "../components/Marquee";
import { Reveal } from "../components/Reveal";
import { useAuth } from "../context/AuthContext";

const HERO_LINES = ["YOUR RESUME,", "DECODED BY", "NEURAL PRECISION."];

const CHAPTERS = [
  {
    num: "01",
    title: "PARSING THE UNSEEN",
    body: "Traditional ATS filters silently discard 74% of qualified candidates over arbitrary formatting flaws. Plumb reads between the lines — context, trajectory, and signal a keyword counter could never see.",
  },
  {
    num: "02",
    title: "NEURAL SEMANTIC MATCH",
    body: "Plumb's neural reasoning evaluates experience depth, quantified achievement, and target-role alignment — then scores you the way a hiring committee actually would.",
  },
  {
    num: "03",
    title: "TACTICAL REWRITE ENGINE",
    body: "Weak bullets are flagged and instantly reforged with executive impact verbs and metrics. Copy the upgrade, paste it in, move up the shortlist.",
  },
];

const FEATURES = [
  {
    icon: Gauge,
    title: "Live ATS Gauge",
    body: "A single neon score, calibrated across keyword density, impact quantifiers, tone, and formatting health.",
    accent: "text-cyan-400",
  },
  {
    icon: Target,
    title: "Target JD Matcher",
    body: "Paste any job description. Get the exact skills gap standing between you and the interview.",
    accent: "text-violet-400",
  },
  {
    icon: Sparkles,
    title: "Bullet Rewriter",
    body: "Before / after rewrites with one-click copy. Every fix is concrete, never generic advice.",
    accent: "text-emerald-400",
  },
  {
    icon: FileScan,
    title: "PDF / DOCX Parsing",
    body: "Drop the file recruiters see. We extract, structure, and scan it in seconds.",
    accent: "text-amber-400",
  },
];

export default function Landing() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const goApp = () => navigate(user ? "/dashboard" : "/auth");

  return (
    <div className="relative min-h-screen bg-[#07090E] text-slate-100">
      {/* NAV */}
      <header
        data-testid="landing-nav"
        className="fixed inset-x-0 top-0 z-50 flex items-center justify-between border-b border-cyan-500/20 bg-[#07090E]/80 px-6 py-4 backdrop-blur-xl lg:px-12"
      >
        <div className="flex items-center gap-3">
          <BrainCircuit className="h-6 w-6 text-cyan-400" />
          <span className="font-display text-lg font-bold tracking-tight">
            Plumb <span className="text-cyan-400">— AI Resume Analyzer</span>
          </span>
        </div>
        <nav className="hidden items-center gap-8 font-code text-xs uppercase tracking-[0.2em] text-slate-400 md:flex">
          <a href="#manifesto" className="transition-colors hover:text-cyan-400">Manifesto</a>
          <a href="#features" className="transition-colors hover:text-cyan-400">Systems</a>
        </nav>
        <motion.button
          data-testid="nav-access-btn"
          whileTap={{ scale: 0.97 }}
          onClick={goApp}
          className="border border-cyan-400 bg-cyan-400/10 px-5 py-2 font-code text-xs font-semibold uppercase tracking-[0.2em] text-cyan-400 transition-colors hover:bg-cyan-400 hover:text-black"
        >
          {user ? "Open Console" : "Access Terminal"}
        </motion.button>
      </header>

      {/* HERO */}
      <section className="relative flex min-h-screen items-center overflow-hidden">
        <div className="absolute inset-0 bg-grid-cyan" />
        <Hero3D />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,#07090E_78%)]" />

        <div className="relative z-10 mx-auto w-full max-w-7xl px-6 pt-28 lg:px-12">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="mb-6 flex items-center gap-3 font-code text-xs uppercase tracking-[0.3em] text-cyan-400"
          >
            <span className="pulse-dot inline-block h-2 w-2 rounded-full bg-emerald-400" />
            AI Resume Analyzer
          </motion.p>

          <h1 className="font-display text-4xl font-bold leading-none tracking-tighter sm:text-6xl lg:text-8xl">
            {HERO_LINES.map((line, i) => (
              <span key={line} className="block overflow-hidden pb-1">
                <motion.span
                  initial={{ y: "110%" }}
                  animate={{ y: 0 }}
                  transition={{ delay: 0.35 + i * 0.18, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                  className={`block ${i === 2 ? "text-glow-cyan text-cyan-400" : ""}`}
                >
                  {line}
                </motion.span>
              </span>
            ))}
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1, duration: 0.8 }}
            className="mt-8 max-w-xl text-base leading-relaxed text-slate-300 sm:text-lg"
          >
            Upload your resume. Our neural engine scores it against real ATS
            logic, exposes the gaps, and rewrites your bullets into ammunition.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.3, duration: 0.8 }}
            className="mt-10 flex flex-wrap items-center gap-4"
          >
            <motion.button
              data-testid="hero-scan-btn"
              whileTap={{ scale: 0.97 }}
              onClick={goApp}
              className="group flex items-center gap-3 bg-cyan-400 px-8 py-4 font-code text-sm font-bold uppercase tracking-[0.2em] text-black transition-colors hover:bg-emerald-400"
            >
              Scan My Resume
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </motion.button>
            <a
              data-testid="hero-manifesto-link"
              href="#manifesto"
              className="border border-white/15 px-8 py-4 font-code text-sm uppercase tracking-[0.2em] text-slate-300 transition-colors hover:border-cyan-400 hover:text-cyan-400"
            >
              Read Manifesto
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.6, duration: 1 }}
            className="mt-14 flex flex-wrap gap-8 font-code text-[11px] uppercase tracking-[0.2em] text-slate-500"
          >
            <span><span className="text-cyan-400">4</span> scoring vectors</span>
            <span><span className="text-cyan-400">&lt;15s</span> full analysis</span>
            <span><span className="text-cyan-400">∞</span> rewrite ammo</span>
          </motion.div>
        </div>
      </section>

      <Marquee />

      {/* MANIFESTO */}
      <section id="manifesto" className="relative mx-auto max-w-7xl px-6 py-24 lg:px-12 lg:py-36">
        <Reveal>
          <p className="mb-4 font-code text-xs uppercase tracking-[0.3em] text-cyan-400">
            // The Manifesto
          </p>
          <h2 className="max-w-3xl font-display text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
            The hiring pipeline is a machine.
            <span className="text-slate-500"> So we built you a better one.</span>
          </h2>
        </Reveal>

        <div className="mt-16 grid gap-px overflow-hidden border border-white/10 bg-white/10 md:grid-cols-3">
          {CHAPTERS.map((c, i) => (
            <Reveal key={c.num} delay={i * 0.12} className="bg-[#0E131F]">
              <div data-testid={`manifesto-chapter-${c.num}`} className="group h-full p-8 transition-colors hover:bg-[#141C2E] lg:p-10">
                <span className="font-code text-sm text-cyan-400/60">{c.num}</span>
                <h3 className="mt-6 font-display text-xl font-semibold tracking-tight transition-colors group-hover:text-cyan-400">
                  {c.title}
                </h3>
                <p className="mt-4 text-sm leading-relaxed text-slate-400">{c.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* FEATURES BENTO */}
      <section id="features" className="relative mx-auto max-w-7xl px-6 pb-24 lg:px-12 lg:pb-36">
        <Reveal>
          <p className="mb-4 font-code text-xs uppercase tracking-[0.3em] text-cyan-400">
            // Weapon Systems
          </p>
          <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
            Four vectors. One verdict.
          </h2>
        </Reveal>

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={i * 0.1}>
              <motion.div
                data-testid={`feature-card-${i}`}
                whileHover={{ y: -6 }}
                className="glass-panel hud-border h-full p-7 transition-colors"
              >
                <f.icon className={`h-7 w-7 ${f.accent}`} />
                <h3 className="mt-5 font-display text-lg font-medium tracking-tight">{f.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-400">{f.body}</p>
              </motion.div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden border-t border-cyan-500/20">
        <div className="absolute inset-0 bg-grid-cyan opacity-50" />
        <div className="relative mx-auto max-w-7xl px-6 py-24 text-center lg:px-12 lg:py-32">
          <Reveal>
            <Zap className="mx-auto h-8 w-8 text-emerald-400" />
            <h2 className="mx-auto mt-6 max-w-3xl font-display text-3xl font-bold tracking-tighter sm:text-4xl lg:text-5xl">
              Stop guessing.
              <span className="text-glow-cyan text-cyan-400"> Start scoring.</span>
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-slate-400 sm:text-base">
              Your next application deserves better than a keyword counter's
              blind verdict. Run the scan. See what the machine sees.
            </p>
            <motion.button
              data-testid="cta-scan-btn"
              whileTap={{ scale: 0.97 }}
              onClick={goApp}
              className="mt-10 inline-flex items-center gap-3 bg-cyan-400 px-10 py-4 font-code text-sm font-bold uppercase tracking-[0.2em] text-black transition-colors hover:bg-emerald-400"
            >
              Initiate Scan <ArrowRight className="h-4 w-4" />
            </motion.button>
          </Reveal>
        </div>
      </section>

      <footer className="border-t border-white/10 px-6 py-8 lg:px-12">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 sm:flex-row">
          <span className="font-display text-sm font-bold tracking-tight">
            Plumb <span className="text-cyan-400">— AI Resume Analyzer</span>
          </span>
          <span
            data-testid="footer-credit"
            className="font-code text-[11px] uppercase tracking-[0.25em] text-slate-400"
          >
            Designed & built by <span className="text-cyan-400">Rauhiney Kashyap</span>
          </span>
          <span className="font-code text-[10px] uppercase tracking-[0.25em] text-slate-500">
            Neural Resume Intelligence // 2026
          </span>
        </div>
      </footer>
    </div>
  );
}
