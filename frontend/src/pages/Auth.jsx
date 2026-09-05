import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { BrainCircuit, Eye, EyeOff, Loader2, Terminal } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import { formatApiError } from "../lib/api";

export default function AuthPage() {
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "login") {
        await login(email, password);
        toast.success("Access granted. Welcome back.");
      } else {
        await register(name, email, password);
        toast.success("Account created. Console unlocked.");
      }
      navigate("/dashboard");
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = () => {
    setMode("login");
    setEmail("demo@nexus.cv");
    setPassword("demo1234");
    setError("");
    toast.info("Demo credentials loaded — hit Access Console.");
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#07090E] px-4">
      <div className="absolute inset-0 bg-grid-cyan" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,#07090E_80%)]" />

      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="glass-panel relative z-10 w-full max-w-md p-8 shadow-[0_0_60px_rgba(0,243,255,0.08)] sm:p-10"
        data-testid="auth-card"
      >
        <Link to="/" className="flex items-center gap-2" data-testid="auth-home-link">
          <BrainCircuit className="h-6 w-6 text-cyan-400" />
          <span className="font-display text-lg font-bold tracking-tight">
            Plumb <span className="text-cyan-400">— AI Resume Analyzer</span>
          </span>
        </Link>

        <div className="mt-8 flex border border-white/10 font-code text-xs uppercase tracking-[0.2em]">
          {["login", "register"].map((m) => (
            <button
              key={m}
              data-testid={`auth-tab-${m}`}
              onClick={() => { setMode(m); setError(""); }}
              className={`flex-1 py-3 transition-colors ${
                mode === m
                  ? "bg-cyan-400 font-bold text-black"
                  : "text-slate-400 hover:text-cyan-400"
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="mt-8 space-y-5">
          {mode === "register" && (
            <div>
              <label className="mb-2 block font-code text-[10px] uppercase tracking-[0.25em] text-slate-400">
                Callsign / Name
              </label>
              <input
                data-testid="auth-name-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full border border-white/10 bg-[#0D111A] px-4 py-3 text-sm text-slate-100 outline-none transition-colors focus:border-cyan-400"
                placeholder="Ada Lovelace"
              />
            </div>
          )}
          <div>
            <label className="mb-2 block font-code text-[10px] uppercase tracking-[0.25em] text-slate-400">
              Email
            </label>
            <input
              data-testid="auth-email-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border border-white/10 bg-[#0D111A] px-4 py-3 text-sm text-slate-100 outline-none transition-colors focus:border-cyan-400"
              placeholder="you@company.com"
            />
          </div>
          <div>
            <label className="mb-2 block font-code text-[10px] uppercase tracking-[0.25em] text-slate-400">
              Password
            </label>
            <div className="relative">
              <input
                data-testid="auth-password-input"
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full border border-white/10 bg-[#0D111A] px-4 py-3 pr-12 text-sm text-slate-100 outline-none transition-colors focus:border-cyan-400"
                placeholder="••••••••"
              />
              <button
                type="button"
                data-testid="auth-toggle-password-btn"
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition-colors hover:text-cyan-400"
              >
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {error && (
            <p data-testid="auth-error" className="border border-rose-500/40 bg-rose-500/10 px-4 py-3 font-code text-xs text-rose-400">
              {error}
            </p>
          )}

          <motion.button
            data-testid="auth-submit-btn"
            whileTap={{ scale: 0.97 }}
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 bg-cyan-400 py-3.5 font-code text-sm font-bold uppercase tracking-[0.2em] text-black transition-colors hover:bg-emerald-400 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Terminal className="h-4 w-4" />}
            {mode === "login" ? "Access Console" : "Create Account"}
          </motion.button>
        </form>

        <button
          data-testid="auth-demo-fill-btn"
          onClick={fillDemo}
          className="mt-5 w-full border border-violet-500/40 bg-violet-500/10 py-3 font-code text-xs uppercase tracking-[0.2em] text-violet-400 transition-colors hover:bg-violet-500 hover:text-black"
        >
          Fill Demo Candidate
        </button>
      </motion.div>
    </div>
  );
}
