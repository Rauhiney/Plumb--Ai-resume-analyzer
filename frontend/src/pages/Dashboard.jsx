import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  BrainCircuit,
  FileUp,
  History,
  Loader2,
  LogOut,
  Play,
  Sparkles,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { api, formatApiError } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { AnalysisResults } from "../components/AnalysisResults";

const SAMPLE_RESUME = `JORDAN REYES
Senior Full-Stack Engineer | jordan.reyes@email.com | San Francisco, CA

SUMMARY
Full-stack engineer with 7 years of experience building web platforms.

EXPERIENCE
Senior Software Engineer — CloudNova (2021 - Present)
- Worked on the payments platform used by enterprise clients.
- Responsible for microservices in Node.js and React frontends.
- Helped improve system reliability.
- Mentored junior engineers on the team.

Software Engineer — DataSpring (2018 - 2021)
- Built internal dashboards for the analytics team.
- Fixed bugs and maintained legacy Python services.
- Participated in code reviews.

SKILLS
JavaScript, TypeScript, React, Node.js, Python, PostgreSQL, Docker, AWS, GraphQL

EDUCATION
B.S. Computer Science — UC Davis (2018)`;

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [resumeText, setResumeText] = useState("");
  const [targetJd, setTargetJd] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const fileInput = useRef(null);

  const loadHistory = useCallback(async () => {
    try {
      const res = await api.get("/analyses");
      setHistory(res.data);
    } catch {
      /* silent */
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleLogout = async () => {
    await logout();
    toast.info("Session terminated.");
    navigate("/");
  };

  const handleFile = async (file) => {
    if (!file) return;
    setParsing(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await api.post("/extract-text", form);
      setResumeText(res.data.text);
      toast.success(`Extracted text from ${res.data.filename}`);
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setParsing(false);
    }
  };

  const runAnalysis = async () => {
    if (resumeText.trim().length < 50) {
      toast.error("Resume text is too short — upload a file or paste at least a few lines.");
      return;
    }
    setAnalyzing(true);
    setResult(null);
    try {
      const res = await api.post("/analyze", {
        resume_text: resumeText,
        target_jd: targetJd,
      });
      setResult(res.data.result);
      toast.success("Scan complete. Verdict delivered.");
      loadHistory();
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setAnalyzing(false);
    }
  };

  const loadAnalysis = async (id) => {
    try {
      const res = await api.get(`/analyses/${id}`);
      setResumeText(res.data.resume_text || "");
      setTargetJd(res.data.target_jd || "");
      setResult(res.data.result);
      setShowHistory(false);
      toast.info("Previous scan reloaded.");
    } catch (err) {
      toast.error(formatApiError(err));
    }
  };

  const deleteAnalysis = async (id, e) => {
    e.stopPropagation();
    try {
      await api.delete(`/analyses/${id}`);
      setHistory((h) => h.filter((x) => x.id !== id));
      toast.success("Scan purged from archive.");
    } catch (err) {
      toast.error(formatApiError(err));
    }
  };

  return (
    <div className="min-h-screen bg-[#07090E] text-slate-100">
      <header
        data-testid="dashboard-header"
        className="sticky top-0 z-40 flex items-center justify-between border-b border-cyan-500/20 bg-[#07090E]/85 px-4 py-4 backdrop-blur-xl sm:px-8"
      >
        <Link to="/" className="flex items-center gap-2" data-testid="dashboard-home-link">
          <BrainCircuit className="h-6 w-6 text-cyan-400" />
          <span className="font-display text-lg font-bold tracking-tight">
            Plumb <span className="text-cyan-400">— AI Resume Analyzer</span>
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <span data-testid="dashboard-user-email" className="hidden font-code text-xs text-slate-400 sm:block">
            {user?.email}
          </span>
          <button
            data-testid="history-toggle-btn"
            onClick={() => setShowHistory((v) => !v)}
            className={`flex items-center gap-2 border px-4 py-2 font-code text-xs uppercase tracking-[0.15em] transition-colors ${
              showHistory
                ? "border-cyan-400 bg-cyan-400 text-black"
                : "border-white/15 text-slate-300 hover:border-cyan-400 hover:text-cyan-400"
            }`}
          >
            <History className="h-4 w-4" /> Archive
          </button>
          <button
            data-testid="logout-btn"
            onClick={handleLogout}
            className="flex items-center gap-2 border border-white/15 px-4 py-2 font-code text-xs uppercase tracking-[0.15em] text-slate-300 transition-colors hover:border-rose-500 hover:text-rose-400"
          >
            <LogOut className="h-4 w-4" /> Exit
          </button>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-8 lg:grid-cols-2 lg:py-12">
        {/* INPUT CONSOLE */}
        <section className="space-y-5" data-testid="input-console">
          <div
            data-testid="file-dropzone"
            onClick={() => fileInput.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              handleFile(e.dataTransfer.files?.[0]);
            }}
            className="glass-panel hud-border group flex cursor-pointer flex-col items-center justify-center border-dashed p-10 text-center transition-colors"
          >
            {parsing ? (
              <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
            ) : (
              <FileUp className="h-8 w-8 text-cyan-400 transition-transform group-hover:-translate-y-1" />
            )}
            <p className="mt-4 font-code text-xs uppercase tracking-[0.2em] text-slate-300">
              Drop resume file or click to browse
            </p>
            <p className="mt-2 font-code text-[10px] uppercase tracking-[0.2em] text-slate-500">
              PDF // DOCX // TXT
            </p>
            <input
              ref={fileInput}
              data-testid="file-input"
              type="file"
              accept=".pdf,.docx,.txt"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
          </div>

          <div className="glass-panel hud-border relative p-5">
            <div className="mb-3 flex items-center justify-between">
              <label className="font-code text-[10px] uppercase tracking-[0.25em] text-cyan-400">
                // Resume Buffer
              </label>
              <button
                data-testid="load-sample-btn"
                onClick={() => { setResumeText(SAMPLE_RESUME); toast.info("Sample resume loaded."); }}
                className="flex items-center gap-1.5 font-code text-[10px] uppercase tracking-[0.15em] text-violet-400 transition-colors hover:text-violet-300"
              >
                <Sparkles className="h-3 w-3" /> Load Sample
              </button>
            </div>
            <textarea
              data-testid="resume-text-input"
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              rows={12}
              placeholder="Paste your full resume text here..."
              className="w-full resize-y border border-white/10 bg-[#0D111A] p-4 font-code text-xs leading-relaxed text-slate-200 outline-none transition-colors placeholder:text-slate-600 focus:border-cyan-400"
            />
            {analyzing && (
              <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="scanline-anim absolute left-0 h-0.5 w-full bg-cyan-400 shadow-[0_0_20px_#00F3FF]" />
              </div>
            )}
          </div>

          <div className="glass-panel hud-border p-5">
            <label className="mb-3 block font-code text-[10px] uppercase tracking-[0.25em] text-violet-400">
              // Target Job Description (optional)
            </label>
            <textarea
              data-testid="target-jd-input"
              value={targetJd}
              onChange={(e) => setTargetJd(e.target.value)}
              rows={5}
              placeholder="Paste the job description you're targeting for a tailored match score..."
              className="w-full resize-y border border-white/10 bg-[#0D111A] p-4 font-code text-xs leading-relaxed text-slate-200 outline-none transition-colors placeholder:text-slate-600 focus:border-violet-400"
            />
          </div>

          <motion.button
            data-testid="analyze-btn"
            whileTap={{ scale: 0.97 }}
            onClick={runAnalysis}
            disabled={analyzing}
            className="flex w-full items-center justify-center gap-3 bg-cyan-400 py-4 font-code text-sm font-bold uppercase tracking-[0.25em] text-black transition-colors hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {analyzing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Scanning Neural Layers...
              </>
            ) : (
              <>
                <Play className="h-4 w-4" /> Initiate Deep Scan
              </>
            )}
          </motion.button>
        </section>

        {/* OUTPUT / HISTORY */}
        <section data-testid="output-console">
          {showHistory ? (
            <div className="glass-panel hud-border p-6" data-testid="history-panel">
              <h3 className="font-code text-xs uppercase tracking-[0.25em] text-cyan-400">
                // Scan Archive ({history.length})
              </h3>
              <div className="mt-5 space-y-3">
                {history.length === 0 && (
                  <p className="font-code text-xs text-slate-500">No previous scans. Run your first analysis.</p>
                )}
                {history.map((h) => (
                  <button
                    key={h.id}
                    data-testid={`history-item-${h.id}`}
                    onClick={() => loadAnalysis(h.id)}
                    className="flex w-full items-center justify-between gap-3 border border-white/10 bg-[#0D111A] p-4 text-left transition-colors hover:border-cyan-400/50"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm text-slate-200">{h.resume_excerpt || "Resume scan"}</p>
                      <p className="mt-1 font-code text-[10px] uppercase tracking-[0.15em] text-slate-500">
                        {new Date(h.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <span className={`font-display text-xl font-bold ${
                        (h.result?.overall_score ?? 0) >= 80
                          ? "text-emerald-400"
                          : (h.result?.overall_score ?? 0) >= 60
                            ? "text-cyan-400"
                            : "text-amber-400"
                      }`}>
                        {h.result?.overall_score ?? "—"}
                      </span>
                      <Trash2
                        data-testid={`history-delete-${h.id}`}
                        onClick={(e) => deleteAnalysis(h.id, e)}
                        className="h-4 w-4 text-slate-500 transition-colors hover:text-rose-500"
                      />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : result ? (
            <AnalysisResults result={result} />
          ) : (
            <div className="glass-panel hud-border flex h-full min-h-[420px] flex-col items-center justify-center p-10 text-center" data-testid="output-placeholder">
              {analyzing ? (
                <>
                  <Loader2 className="h-10 w-10 animate-spin text-cyan-400" />
                  <p className="mt-6 font-code text-xs uppercase tracking-[0.25em] text-cyan-400">
                    AI engine parsing...
                  </p>
                  <p className="mt-2 max-w-xs font-code text-[10px] leading-relaxed text-slate-500">
                    Semantic extraction → vector scoring → vulnerability mapping → rewrite synthesis
                  </p>
                </>
              ) : (
                <>
                  <BrainCircuit className="h-10 w-10 text-slate-700" />
                  <p className="mt-6 font-code text-xs uppercase tracking-[0.25em] text-slate-500">
                    Awaiting resume input
                  </p>
                  <p className="mt-2 max-w-xs text-sm text-slate-500">
                    Drop a file, paste text, or load the sample — then initiate the deep scan.
                  </p>
                </>
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
