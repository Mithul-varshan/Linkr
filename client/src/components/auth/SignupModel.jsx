import React, { useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  Link2,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { API_BASE_URL } from "../../config/api";

export default function SignupModel({
  isOpen,
  onClose,
  onSwitchToLogin,
  onSuccess,
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const emailRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const t = setTimeout(() => emailRef.current?.focus(), 40);
    setError("");

    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      clearTimeout(t);
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const canSubmit = email.trim() && password.trim() && password.length >= 6;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit || isLoading) return;

    try {
      setIsLoading(true);
      setError("");

      const response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Signup failed");
        return;
      }

      if (typeof onSuccess === "function") {
        onSuccess({
          user: data.user,
          token: data.token,
        });
      }

      setEmail("");
      setPassword("");
    } catch {
      setError("Unable to connect to server. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <button
        className="absolute inset-0 bg-black/75 backdrop-blur-md transition-opacity cursor-default"
        onClick={onClose}
        aria-label="Close signup modal"
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-[420px] overflow-hidden rounded-[28px] border border-emerald-500/20 bg-[#0a1613]/95 p-6 sm:p-7 shadow-[0_25px_60px_rgba(0,0,0,0.8),0_0_50px_rgba(52,211,153,0.12)] backdrop-blur-2xl">
        {/* Ambient Top Glows */}
        <div className="pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2 h-40 w-64 rounded-full bg-emerald-500/15 blur-3xl" />
        <div className="pointer-events-none absolute top-10 right-0 h-28 w-28 rounded-full bg-amber-400/10 blur-2xl" />

        {/* Header Row */}
        <div className="relative flex items-center justify-between pb-5 border-b border-white/[0.08]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-300 text-emerald-950 shadow-[0_10px_24px_rgba(52,211,153,0.25)]">
              <Link2 size={19} strokeWidth={2.5} />
            </div>
            <div>
              <span className="block text-base font-black tracking-tight text-white">
                Linkr
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-300/70">
                <Sparkles size={11} className="text-amber-300" /> New Account
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Close"
          >
            <X size={15} />
          </button>
        </div>

        {/* Title Area */}
        <div className="relative pt-5 pb-2">
          <h2 className="text-xl font-black tracking-tight text-white sm:text-2xl">
            Create your account
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            Get unlimited links, custom slugs & real-time analytics
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="relative mt-4 space-y-4">
          {/* Email Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Email Address
            </label>
            <div className="relative flex items-center rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 transition-all focus-within:border-emerald-400/70 focus-within:bg-white/[0.07] focus-within:ring-2 focus-within:ring-emerald-400/20">
              <Mail size={16} className="shrink-0 text-slate-500 mr-2.5" />
              <input
                ref={emailRef}
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-transparent text-sm text-white placeholder-slate-500 outline-none"
              />
            </div>
          </div>

          {/* Password Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                Password
              </label>
              <span className="text-[10px] text-slate-500">Min. 6 chars</span>
            </div>
            <div className="relative flex items-center rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 transition-all focus-within:border-emerald-400/70 focus-within:bg-white/[0.07] focus-within:ring-2 focus-within:ring-emerald-400/20">
              <Lock size={16} className="shrink-0 text-slate-500 mr-2.5" />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a strong password"
                className="w-full bg-transparent text-sm text-white placeholder-slate-500 outline-none pr-8"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 text-slate-400 hover:text-slate-200 transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-3.5 py-2.5 text-xs text-red-300">
              <AlertCircle size={15} className="shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!canSubmit || isLoading}
            className="w-full cursor-pointer rounded-xl bg-emerald-400 py-3 px-4 text-sm font-black text-emerald-950 shadow-[0_10px_24px_rgba(52,211,153,0.25)] transition-all hover:bg-emerald-300 hover:shadow-[0_12px_28px_rgba(52,211,153,0.35)] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Creating Account...</span>
              </>
            ) : (
              <>
                <span>Sign Up Free</span>
                <ArrowRight size={15} />
              </>
            )}
          </button>

          {/* Switch to Login */}
          <p className="text-center text-xs text-slate-400 pt-1">
            Already have an account?{" "}
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="font-bold text-emerald-400 hover:text-emerald-300 transition-colors underline-offset-4 hover:underline"
            >
              Log in
            </button>
          </p>

          {/* Footer Security Badge */}
          <div className="flex items-center justify-center gap-1.5 border-t border-white/[0.06] pt-3 text-[11px] text-slate-500">
            <ShieldCheck size={13} className="text-emerald-400/80" />
            <span>100% Free • No credit card required</span>
          </div>
        </form>
      </div>
    </div>
  );
}
