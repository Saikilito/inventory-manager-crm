import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { usePlocState } from "@hooks/use-ploc-state";
import { useAuthPloc } from "@contexts/auth-context";
import { z } from "zod";
import {
  KeyRound,
  Shield,
  Mail,
  TrendingUp,
  DollarSign,
  Terminal,
  ArrowRight,
} from "lucide-react";
import { ElectronicBrainLogo } from "@components/shell/ElectronicBrainLogo";

import ErrorAlert from "../../components/Error";

const loginSchema = z.object({
  email: z.string().min(1, { message: "Username or email is required" }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters" }),
});

const LOGS = [
  "> Gateway: Secure Socket Active",
  "> Database: Connection Established",
  "> AI Copilot: Online & Listening...",
  "> System Integrity: 100% Secure",
];

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const ploc = useAuthPloc();
  const state = usePlocState(ploc);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {},
  );
  const [visibleLogs, setVisibleLogs] = useState<string[]>([]);

  // If the user becomes authenticated, redirect them to the panel
  useEffect(() => {
    if (state.kind === "auth:authenticated") {
      navigate("/clients", { replace: true });
    }
  }, [state.kind, navigate]);

  // Terminal typewriter effect
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    let currentLineIndex = 0;

    const showNextLine = () => {
      if (currentLineIndex < LOGS.length) {
        setVisibleLogs((prev) => [...prev, LOGS[currentLineIndex]]);
        currentLineIndex++;
        timer = setTimeout(showNextLine, 1000);
      }
    };

    timer = setTimeout(showNextLine, 500);

    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Zod validation
    const validationResult = loginSchema.safeParse({ email, password });
    if (!validationResult.success) {
      const formattedErrors: { email?: string; password?: string } = {};
      validationResult.error.issues.forEach((issue) => {
        const path = issue.path[0] as "email" | "password";
        formattedErrors[path] = issue.message;
      });
      setErrors(formattedErrors);
      return;
    }

    setErrors({});
    await ploc.login(email, password);
  };

  const isButtonDisabled =
    !email || !password || state.kind === "auth:authenticating";
  const errorMessage =
    state.kind === "auth:error" ? state.errorMessage : undefined;

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-stone-50 dark:bg-stone-950 transition-colors duration-300">
      {/* LEFT SIDE: Obsidian Splash Panel (60% width - hidden on mobile) */}
      <div className="hidden lg:flex lg:col-span-7 xl:col-span-8 bg-stone-950 relative flex-col justify-between p-12 overflow-hidden border-r border-stone-850">
        {/* Glow Effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] rounded-full bg-emerald-500/10 blur-[80px] animate-pulse-glow" />
          <div
            className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[400px] h-[400px] rounded-full bg-indigo-500/10 blur-[100px] animate-pulse-glow"
            style={{ animationDelay: "2s" }}
          />
        </div>

        {/* Floating Widgets */}
        <div className="absolute top-12 right-12 bg-stone-900/40 backdrop-blur-md border border-stone-850 rounded-2xl p-5 shadow-2xl animate-float max-w-xs">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 rounded-xl text-emerald-400">
              <TrendingUp className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <p className="text-[10px] text-stone-400 uppercase tracking-wider font-semibold">
                Stock Efficiency
              </p>
              <h3 className="text-lg font-black text-white">98.4%</h3>
            </div>
          </div>
        </div>

        <div className="absolute bottom-32 right-16 bg-stone-900/40 backdrop-blur-md border border-stone-850 rounded-2xl p-5 shadow-2xl animate-float-delayed max-w-xs">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/20 rounded-xl text-indigo-400">
              <DollarSign className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <p className="text-[10px] text-stone-400 uppercase tracking-wider font-semibold">
                Monthly Revenue
              </p>
              <h3 className="text-lg font-black text-white">$328.5k USD</h3>
            </div>
          </div>
        </div>

        {/* Header Branding */}
        <div className="flex items-center gap-3 z-10 animate-fadeIn">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-900/10">
            <ElectronicBrainLogo className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-sm font-black text-white uppercase tracking-wider">
              Invertor-AI
            </h2>
            <p className="text-[10px] text-stone-400">
              Inventory & AI Command Center
            </p>
          </div>
        </div>

        {/* Center Main Message */}
        <div
          className="my-auto max-w-xl z-10 space-y-4 animate-fadeIn"
          style={{ animationDelay: "0.2s" }}
        >
          <span className="px-3 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full text-xs font-bold tracking-wider uppercase inline-block">
            Stock Intelligence & CRM
          </span>
          <h1 className="text-4xl xl:text-5xl font-black text-white tracking-tight leading-tight">
            Inventory Control powered by{" "}
            <span className="text-amber-400">AI Copilot</span>
          </h1>
          <p className="text-stone-400 text-sm leading-relaxed max-w-md">
            Manage critical stock, analyze sales and audit logs in real-time
            using our intelligent predictive model.
          </p>

          {/* Typewriter Terminal Console */}
          <div className="mt-8 bg-stone-900/80 border border-stone-800 rounded-xl p-4 font-mono text-xs text-stone-300 shadow-xl max-w-md">
            <div className="flex items-center gap-2 mb-3 border-b border-stone-800 pb-2">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span className="text-stone-500 font-bold">
                system-terminal.sh
              </span>
            </div>
            <div className="space-y-1.5 min-h-[90px]">
              {visibleLogs.map((log, i) => (
                <div
                  key={i}
                  className="animate-fadeIn font-semibold text-emerald-400 font-mono"
                >
                  {log}
                </div>
              ))}
              <div className="animate-pulse inline-block w-2 h-4 bg-emerald-400 ml-0.5" />
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div
          className="text-stone-500 text-xs z-10 animate-fadeIn"
          style={{ animationDelay: "0.4s" }}
        >
          &copy; {new Date().getFullYear()} Invertor-AI. Made with Clean &
          Screaming Architecture.
        </div>
      </div>

      {/* RIGHT SIDE: The Centered Login Card (40% width on Desktop, 100% on Mobile) */}
      <div className="col-span-1 lg:col-span-5 xl:col-span-4 flex items-center justify-center p-6 relative overflow-hidden bg-white dark:bg-stone-950 transition-colors duration-300">
        {/* Glow Effects for Mobile view (hidden on Desktop) */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none lg:hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-emerald-500/10 blur-[80px] animate-pulse-glow" />
        </div>

        <div className="w-full max-w-md space-y-8 bg-white dark:bg-stone-900 lg:bg-transparent lg:dark:bg-transparent border border-stone-200 dark:border-stone-800/80 lg:border-none p-8 lg:p-0 rounded-2xl shadow-xl lg:shadow-none z-10 transition-colors duration-300">
          <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
            {/* Mobile Branding (hidden on Desktop) */}
            <div className="flex items-center gap-3 mb-6 lg:hidden">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shadow-lg">
                <ElectronicBrainLogo className="w-6 h-6" />
              </div>
              <div className="text-left">
                <h2 className="text-sm font-black text-stone-900 dark:text-white uppercase tracking-wider">
                  Invertor-AI
                </h2>
                <p className="text-[10px] text-stone-500 dark:text-stone-400">
                  Inventory & AI
                </p>
              </div>
            </div>

            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 mb-4 transition-colors duration-300">
              <KeyRound className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-stone-900 dark:text-stone-150">
              Sign In
            </h1>
            <p className="text-sm text-stone-500 dark:text-stone-400 mt-1.5 font-medium">
              Enter your credentials to access the system
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {errorMessage && <ErrorAlert error={errorMessage} />}

            <div className="space-y-1.5">
              <label className="text-sm font-bold text-stone-700 dark:text-stone-300">
                Username / Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-stone-400 dark:text-stone-500 pointer-events-none" />
                <input
                  type="text"
                  name="user"
                  className="w-full h-11 pl-10 pr-4 bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl text-stone-950 dark:text-white placeholder-stone-400 dark:placeholder-stone-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-500 transition-all text-sm font-semibold"
                  placeholder="Username or Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="username"
                />
              </div>
              {errors.email && (
                <p className="text-xs text-red-500 dark:text-red-450 font-bold animate-fadeIn">
                  {errors.email}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-bold text-stone-700 dark:text-stone-300">
                Password
              </label>
              <div className="relative">
                <Shield className="absolute left-3.5 top-3.5 h-4 w-4 text-stone-400 dark:text-stone-500 pointer-events-none" />
                <input
                  type="password"
                  name="password"
                  className="w-full h-11 pl-10 pr-4 bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl text-stone-950 dark:text-white placeholder-stone-400 dark:placeholder-stone-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-500 transition-all text-sm font-semibold"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
              </div>
              {errors.password && (
                <p className="text-xs text-red-500 dark:text-red-450 font-bold animate-fadeIn">
                  {errors.password}
                </p>
              )}
            </div>

            <button
              disabled={isButtonDisabled}
              type="submit"
              className="w-full h-11 bg-stone-950 hover:bg-stone-900 dark:bg-white dark:hover:bg-stone-100 text-white dark:text-stone-950 font-bold rounded-xl shadow-sm hover:shadow transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 cursor-pointer text-sm"
            >
              {state.kind === "auth:authenticating" ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5 text-current"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.14 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <span>Signing In...</span>
                </>
              ) : (
                <span className="flex items-center gap-2">
                  Sign In
                  <ArrowRight className="w-4 h-4" />
                </span>
              )}
            </button>

            <div className="relative flex items-center justify-center my-4">
              <div
                className="absolute inset-0 flex items-center"
                aria-hidden="true"
              >
                <div className="w-full border-t border-stone-200 dark:border-stone-800" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white dark:bg-stone-900 lg:dark:bg-stone-950 px-2 text-stone-400 dark:text-stone-500 font-bold">
                  OR
                </span>
              </div>
            </div>

            <button
              type="button"
              className="w-full h-11 bg-white hover:bg-stone-50 dark:bg-stone-900 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-200 border border-stone-200 dark:border-stone-800 font-bold rounded-xl shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 cursor-pointer text-sm"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>
          </form>

          <div className="text-center lg:text-left text-xs text-stone-500 dark:text-stone-400 border-t border-stone-100 dark:border-stone-800/60 pt-5">
            Having trouble signing in? Contact the system administrator.
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
