import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import Lenis from "lenis";
import { Toaster } from "sonner";
import { BrainCircuit } from "lucide-react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Landing from "./pages/Landing";
import AuthPage from "./pages/Auth";
import Dashboard from "./pages/Dashboard";

function Protected({ children }) {
  const { user } = useAuth();
  if (user === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#07090E]">
        <BrainCircuit className="h-8 w-8 animate-pulse text-cyan-400" />
      </div>
    );
  }
  if (!user) return <Navigate to="/auth" replace />;
  return children;
}

function ScrollManager() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function App() {
  useEffect(() => {
    const lenis = new Lenis({ lerp: 0.09 });
    let rafId;
    const raf = (time) => {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    };
    rafId = requestAnimationFrame(raf);
    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, []);

  return (
    <AuthProvider>
      <BrowserRouter>
        <ScrollManager />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route
            path="/dashboard"
            element={
              <Protected>
                <Dashboard />
              </Protected>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster theme="dark" richColors position="bottom-right" />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
