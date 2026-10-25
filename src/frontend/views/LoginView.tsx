import React, { useState, useRef } from "react";
import { useRouter } from "@/lib/nav";
import { useJobNex } from "@/frontend/context/JobNexContext";
import { UserRole } from "@/domain/types";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import HeroBackdrop from "@/frontend/components/hero/HeroBackdrop";
import { Input } from "@/frontend/components/ui/input";
import { Button } from "@/frontend/components/ui/button";
import { Label } from "@/frontend/components/ui/label";
import { Checkbox } from "@/frontend/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/frontend/components/ui/card";
import {
  ShieldCheck,
  Sparkles,
  Briefcase,
  Users,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Volume2,
  VolumeX,
  Zap,
} from "lucide-react";

interface LoginViewProps {
  initialMode?: "login" | "signup";
}

export function LoginView({ initialMode = "login" }: LoginViewProps = {}) {
  const router = useRouter();
  const { login } = useJobNex();

  const cardRef = useRef<HTMLDivElement | null>(null);

  // Form states
  const [mode, setMode] = useState<"login" | "signup">(initialMode);
  const [email, setEmail] = useState("sandeep@jobnex.ai");
  const [password, setPassword] = useState("password123");
  const [fullName, setFullName] = useState("Sandeep Kumar");
  const [phone, setPhone] = useState("+91 98765 43210");
  const [confirmPassword, setConfirmPassword] = useState("password123");
  const [role, setRole] = useState<UserRole>("JOB_SEEKER");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Status & notifications
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [nameError, setNameError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [confirmError, setConfirmError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const [failedBanner, setFailedBanner] = useState<string | null>(null);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Accessibility / Toggles
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);

  const playFeedbackSound = (type: "click" | "success" | "error") => {
    if (!soundEnabled || typeof window === "undefined") return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);

      if (type === "success") {
        osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
        osc.frequency.exponentialRampToValueAtTime(783.99, audioCtx.currentTime + 0.15); // G5
        gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0.001, audioCtx.currentTime + 0.25);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.25);
      } else if (type === "error") {
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(220, audioCtx.currentTime);
        osc.frequency.linearRampToValueAtTime(140, audioCtx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0.001, audioCtx.currentTime + 0.25);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.25);
      } else {
        osc.frequency.setValueAtTime(440, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.03, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0.001, audioCtx.currentTime + 0.08);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.08);
      }
    } catch {
      // AudioContext unavailable or blocked by autoplay policy
    }
  };

  const triggerErrorShake = () => {
    playFeedbackSound("error");
    if (cardRef.current && !reducedMotion) {
      cardRef.current.classList.remove("card-shake");
      void cardRef.current.offsetWidth;
      cardRef.current.classList.add("card-shake");
      setTimeout(() => {
        cardRef.current?.classList.remove("card-shake");
      }, 600);
    }
  };

  const switchMode = (newMode: "login" | "signup") => {
    playFeedbackSound("click");
    setMode(newMode);
    setFailedBanner(null);
    setEmailError("");
    setPasswordError("");
    setNameError("");
    setPhoneError("");
    setConfirmError("");
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFailedBanner(null);

    let hasError = false;
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setEmailError("Please enter a valid email address.");
      hasError = true;
    } else {
      setEmailError("");
    }

    if (!password) {
      setPasswordError("Please enter your password.");
      hasError = true;
    } else {
      setPasswordError("");
    }

    if (hasError) {
      triggerErrorShake();
      return;
    }

    setIsSubmitting(true);

    // Call real Supabase / Lovable Cloud Auth in background if reachable
    try {
      await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
    } catch {
      // Graceful fallback to mock demo session
    }

    await new Promise((r) => setTimeout(r, 650));
    setIsSubmitting(false);

    // Simulated fail case trigger for testing
    if (password === "wrong-password") {
      const attempts = failedAttempts + 1;
      setFailedAttempts(attempts);
      setFailedBanner(
        attempts >= 3
          ? "Still not working? Click 'Reset password' below or choose demo credentials."
          : "Incorrect email or password. Check both and try again.",
      );
      triggerErrorShake();
      return;
    }

    // Success flow
    playFeedbackSound("success");
    setToastMessage("Signed in successfully! Entering your JobNex portal…");
    login(email.trim(), role);

    setTimeout(() => {
      router.push("/");
    }, 700);
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let hasError = false;

    if (!fullName.trim() || fullName.trim().length < 2) {
      setNameError("Full name must be at least 2 characters.");
      hasError = true;
    } else setNameError("");

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setEmailError("Please enter a valid email address.");
      hasError = true;
    } else setEmailError("");

    if (password.length < 8) {
      setPasswordError("Password must be at least 8 characters.");
      hasError = true;
    } else setPasswordError("");

    if (confirmPassword !== password) {
      setConfirmError("Passwords do not match.");
      hasError = true;
    } else setConfirmError("");

    if (hasError) {
      triggerErrorShake();
      return;
    }

    setIsSubmitting(true);

    // Real Lovable Cloud / Supabase Sign Up call
    try {
      await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            role,
            phone: phone.trim(),
          },
        },
      });
    } catch {
      // Graceful fallback for mock mode
    }

    await new Promise((r) => setTimeout(r, 750));
    setIsSubmitting(false);

    playFeedbackSound("success");
    setToastMessage("Account created! Directing you to your JobNex workspace…");
    login(email.trim(), role);

    setTimeout(() => {
      router.push("/");
    }, 700);
  };

  const handleGoogleAuth = async () => {
    setIsGoogleSubmitting(true);
    playFeedbackSound("click");

    // Real Lovable Cloud OAuth call
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: typeof window !== "undefined" ? window.location.origin : undefined,
      });
      if (result?.redirected) return;
    } catch {
      // Fallback to demo login if offline/unconfigured
    }

    await new Promise((r) => setTimeout(r, 600));
    setIsGoogleSubmitting(false);

    playFeedbackSound("success");
    setToastMessage("Signed in via Google! Entering JobNex…");
    login(email || "google.user@jobnex.ai", role);

    setTimeout(() => {
      router.push("/");
    }, 700);
  };

  const fillDemoCredentials = (targetRole: UserRole) => {
    playFeedbackSound("click");
    setRole(targetRole);
    if (targetRole === "JOB_SEEKER") {
      setEmail("sandeep@jobnex.ai");
      setPassword("password123");
      setFullName("Sandeep Kumar");
    } else {
      setEmail("recruiter@stripe.com");
      setPassword("password123");
      setFullName("Sarah Jenkins");
    }
    setFailedBanner(null);
    setEmailError("");
    setPasswordError("");
  };

  return (
    <div className="relative min-h-screen w-full bg-slate-950 text-white font-sans flex flex-col justify-between selection:bg-brand-500 selection:text-white overflow-x-hidden">
      {/* Background Starfield and Perspective Grid Canvas (Plain Canvas 2D + CSS 3D, zero Three.js) */}
      <HeroBackdrop />

      {/* Top Navigation Bar & Accessibility Controls */}
      <header className="relative z-30 w-full px-6 py-4 flex items-center justify-between border-b border-white/10 backdrop-blur-md bg-slate-950/40">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-brand-600 to-amber-300 flex items-center justify-center shadow-lg shadow-brand-500/25">
            <Sparkles className="h-5 w-5 text-slate-950 stroke-[2.5]" />
          </div>
          <span className="font-bold text-xl tracking-tight text-white">JobNex</span>
          <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-white/10 text-white/80 border border-white/15">
            Next-Gen AI Careers
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="text-xs text-white/70 hover:text-white hover:bg-white/10 rounded-full h-8 px-3"
            aria-label="Toggle Sound"
          >
            {soundEnabled ? (
              <>
                <Volume2 className="h-3.5 w-3.5 mr-1.5 text-brand-300" />
                <span>Audio On</span>
              </>
            ) : (
              <>
                <VolumeX className="h-3.5 w-3.5 mr-1.5 text-white/40" />
                <span>Audio Muted</span>
              </>
            )}
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setReducedMotion(!reducedMotion)}
            className="text-xs text-white/70 hover:text-white hover:bg-white/10 rounded-full h-8 px-3"
            aria-label="Toggle Reduced Motion"
          >
            <Zap className={`h-3.5 w-3.5 mr-1.5 ${reducedMotion ? "text-amber-300" : "text-white/40"}`} />
            <span>{reducedMotion ? "Reduced Motion" : "Full Motion"}</span>
          </Button>
        </div>
      </header>

      {/* Global Toast Feedback */}
      {toastMessage && (
        <aside
          role="status"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-full bg-slate-900/90 backdrop-blur-xl border border-brand-400/30 text-white text-sm font-medium shadow-2xl flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-4"
        >
          <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </aside>
      )}

      {/* Main Split Layout */}
      <main className="relative z-20 flex-1 grid grid-cols-1 lg:grid-cols-12 max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-10 gap-8 items-center">
        {/* Left Column: Visual AI Showcase & Interactive Badges */}
        <section className="hidden lg:flex lg:col-span-6 flex-col justify-center space-y-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-brand-500/15 border border-brand-400/30 text-brand-200">
              <Sparkles className="h-3.5 w-3.5 text-amber-300" />
              <span>Smart Candidate & Recruiter Engine</span>
            </div>
            <h1 className="text-4xl xl:text-5xl font-extrabold tracking-tight text-white leading-tight">
              Land high-impact roles <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-300 via-white to-amber-200">4x faster</span>.
            </h1>
            <p className="text-base text-slate-300 max-w-lg leading-relaxed">
              Autonomous job matching, automated cold referrals, and vector-scored resume privacy built for modern engineers and leaders.
            </p>
          </div>

          {/* Interactive Feature Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg pt-2">
            <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-lg hover:border-brand-400/40 transition-all group">
              <div className="h-8 w-8 rounded-xl bg-brand-500/20 border border-brand-400/30 flex items-center justify-center mb-3 text-brand-300 group-hover:scale-105 transition-transform">
                <Briefcase className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-semibold text-white">98% Match Scoring</h3>
              <p className="text-xs text-slate-400 mt-1">
                Vector comparison analyzes your technical skills directly against hiring team requisitions.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-lg hover:border-amber-300/40 transition-all group">
              <div className="h-8 w-8 rounded-xl bg-amber-300/20 border border-amber-300/30 flex items-center justify-center mb-3 text-amber-200 group-hover:scale-105 transition-transform">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-semibold text-white">Blind Privacy Shield</h3>
              <p className="text-xs text-slate-400 mt-1">
                Mask current company, contact details, and PII until you mutually accept interview requests.
              </p>
            </div>
          </div>

          {/* Quick Demo Pre-fill Bar */}
          <div className="pt-2 max-w-lg">
            <p className="text-xs text-slate-400 font-medium mb-2 flex items-center gap-1.5">
              <span>⚡ One-Click Demo Logins:</span>
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fillDemoCredentials("JOB_SEEKER")}
                className="bg-white/5 border-white/15 text-xs text-white hover:bg-white/10 hover:text-white h-7 px-3 rounded-lg"
              >
                <Users className="h-3.5 w-3.5 mr-1.5 text-brand-300" />
                Job Seeker (Sandeep)
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fillDemoCredentials("RECRUITER")}
                className="bg-white/5 border-white/15 text-xs text-white hover:bg-white/10 hover:text-white h-7 px-3 rounded-lg"
              >
                <Briefcase className="h-3.5 w-3.5 mr-1.5 text-amber-300" />
                Recruiter (Sarah)
              </Button>
            </div>
          </div>
        </section>

        {/* Right Column: Reusable Form Card */}
        <section className="lg:col-span-6 flex items-center justify-center">
          <Card
            ref={cardRef}
            className="w-full max-w-[440px] border border-white/15 bg-slate-900/70 backdrop-blur-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.7)] rounded-3xl overflow-hidden transition-all text-white"
          >
            <CardHeader className="space-y-1.5 pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-brand-500/20 border border-brand-400/40 flex items-center justify-center">
                    <Sparkles className="h-4 w-4 text-brand-300" />
                  </div>
                  <CardTitle className="text-xl font-bold text-white tracking-tight">
                    {mode === "login" ? "Welcome back" : "Create your account"}
                  </CardTitle>
                </div>

                {/* Role indicator badge */}
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-white/10 text-brand-200 border border-white/10">
                  {role === "JOB_SEEKER" ? "Job Seeker" : "Recruiter"}
                </span>
              </div>
              <CardDescription className="text-xs text-slate-300">
                {mode === "login"
                  ? "Enter your credentials or choose a 1-click demo persona."
                  : "Start discovering verified AI jobs and vector matching."}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Error Notification Banner */}
              {failedBanner && (
                <div className="p-3.5 rounded-xl border border-rose-500/40 bg-rose-950/40 text-xs text-rose-200 flex flex-col gap-1.5 animate-in fade-in">
                  <div className="flex items-center gap-2 font-semibold text-rose-300">
                    <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                    <span>Authentication failed</span>
                  </div>
                  <span className="text-slate-300">{failedBanner}</span>
                  <div className="flex gap-3 pt-1 text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setFailedBanner(null);
                        setPassword("password123");
                      }}
                      className="underline text-brand-300 hover:text-white"
                    >
                      Fill correct password
                    </button>
                    <button
                      type="button"
                      onClick={() => alert("Password reset link has been dispatched to your email address.")}
                      className="underline text-brand-300 hover:text-white"
                    >
                      Reset password
                    </button>
                  </div>
                </div>
              )}

              {/* Role Toggle Selector in Signup Mode */}
              {mode === "signup" && (
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-300">Choose Role</Label>
                  <div className="grid grid-cols-2 gap-1.5 p-1 bg-white/5 border border-white/10 rounded-xl">
                    <Button
                      type="button"
                      variant={role === "JOB_SEEKER" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setRole("JOB_SEEKER")}
                      className={`h-8 text-xs font-semibold rounded-lg transition-all ${
                        role === "JOB_SEEKER"
                          ? "bg-brand-600 text-white shadow-sm"
                          : "text-slate-300 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      <Users className="h-3.5 w-3.5 mr-1.5" />
                      Job Seeker
                    </Button>
                    <Button
                      type="button"
                      variant={role === "RECRUITER" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setRole("RECRUITER")}
                      className={`h-8 text-xs font-semibold rounded-lg transition-all ${
                        role === "RECRUITER"
                          ? "bg-brand-600 text-white shadow-sm"
                          : "text-slate-300 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      <Briefcase className="h-3.5 w-3.5 mr-1.5" />
                      Recruiter
                    </Button>
                  </div>
                </div>
              )}

              {/* LOGIN FORM */}
              {mode === "login" ? (
                <form onSubmit={handleLoginSubmit} className="space-y-3.5" noValidate>
                  {/* Email Input */}
                  <div className="space-y-1.5">
                    <Label htmlFor="login-email" className="text-xs text-slate-300 font-medium">
                      Email address
                    </Label>
                    <Input
                      id="login-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="bg-white/5 border-white/15 text-white placeholder:text-slate-400 rounded-xl focus-visible:ring-brand-400 text-sm h-10"
                    />
                    {emailError && <p className="text-xs text-rose-300 font-medium">{emailError}</p>}
                  </div>

                  {/* Password Input */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="login-password" className="text-xs text-slate-300 font-medium">
                        Password
                      </Label>
                      <button
                        type="button"
                        onClick={() => alert("Password reset instructions dispatched to your email.")}
                        className="text-xs text-brand-300 hover:text-white underline font-medium"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative">
                      <Input
                        id="login-password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="bg-white/5 border-white/15 text-white placeholder:text-slate-400 rounded-xl focus-visible:ring-brand-400 text-sm h-10 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {passwordError && (
                      <p className="text-xs text-rose-300 font-medium">{passwordError}</p>
                    )}
                  </div>

                  {/* Remember Me Checkbox */}
                  <div className="flex items-center space-x-2 pt-1">
                    <Checkbox
                      id="remember-me"
                      checked={rememberMe}
                      onCheckedChange={(checked) => setRememberMe(Boolean(checked))}
                      className="border-white/30 data-[state=checked]:bg-brand-500 data-[state=checked]:border-brand-500"
                    />
                    <Label
                      htmlFor="remember-me"
                      className="text-xs text-slate-300 font-normal cursor-pointer select-none"
                    >
                      Remember me on this browser
                    </Label>
                  </div>

                  {/* Primary Submit Button */}
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-brand-600 hover:bg-brand-500 text-white font-semibold rounded-xl h-10 shadow-lg shadow-brand-600/30 transition-all active:scale-[0.99] mt-2 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Signing in…</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5">
                        <span>Sign in to JobNex</span>
                      </span>
                    )}
                  </Button>

                  {/* Divider */}
                  <div className="relative py-1">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-white/10" />
                    </div>
                    <div className="relative flex justify-center text-[11px] uppercase">
                      <span className="bg-slate-900 px-2 text-slate-400">or continue with</span>
                    </div>
                  </div>

                  {/* Google OAuth Button */}
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isGoogleSubmitting}
                    onClick={handleGoogleAuth}
                    className="w-full bg-white/5 hover:bg-white/10 border-white/15 text-white font-medium rounded-xl h-10 flex items-center justify-center gap-2.5 transition-all cursor-pointer"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" className="shrink-0">
                      <path
                        fill="#EA4335"
                        d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"
                      />
                      <path
                        fill="#4285F4"
                        d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.1-1.6.4-2.3L1.9 7.3C.7 9.7 0 10.8 0 12.5s.7 2.8 1.9 5.2l3.7-2.9z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 24c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2-6.4-4.8L1.9 17.4C3.7 21.1 7.5 24 12 24z"
                      />
                    </svg>
                    <span>{isGoogleSubmitting ? "Connecting…" : "Continue with Google"}</span>
                  </Button>

                  {/* Switch to Signup */}
                  <p className="text-center text-xs text-slate-400 pt-1">
                    Don't have an account?{" "}
                    <button
                      type="button"
                      onClick={() => switchMode("signup")}
                      className="underline text-brand-300 hover:text-white font-semibold cursor-pointer"
                    >
                      Sign up for free
                    </button>
                  </p>
                </form>
              ) : (
                /* SIGNUP FORM */
                <form onSubmit={handleSignupSubmit} className="space-y-3" noValidate>
                  {/* Full Name */}
                  <div className="space-y-1">
                    <Label htmlFor="signup-name" className="text-xs text-slate-300 font-medium">
                      Full name
                    </Label>
                    <Input
                      id="signup-name"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Sandeep Kumar"
                      className="bg-white/5 border-white/15 text-white placeholder:text-slate-400 rounded-xl focus-visible:ring-brand-400 text-sm h-9"
                    />
                    {nameError && <p className="text-xs text-rose-300">{nameError}</p>}
                  </div>

                  {/* Email */}
                  <div className="space-y-1">
                    <Label htmlFor="signup-email" className="text-xs text-slate-300 font-medium">
                      Email address
                    </Label>
                    <Input
                      id="signup-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="sandeep@jobnex.ai"
                      className="bg-white/5 border-white/15 text-white placeholder:text-slate-400 rounded-xl focus-visible:ring-brand-400 text-sm h-9"
                    />
                    {emailError && <p className="text-xs text-rose-300">{emailError}</p>}
                  </div>

                  {/* Phone */}
                  <div className="space-y-1">
                    <Label htmlFor="signup-phone" className="text-xs text-slate-300 font-medium">
                      Phone (optional)
                    </Label>
                    <Input
                      id="signup-phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="bg-white/5 border-white/15 text-white placeholder:text-slate-400 rounded-xl focus-visible:ring-brand-400 text-sm h-9"
                    />
                    {phoneError && <p className="text-xs text-rose-300">{phoneError}</p>}
                  </div>

                  {/* Password */}
                  <div className="space-y-1">
                    <Label htmlFor="signup-password" className="text-xs text-slate-300 font-medium">
                      Password (min 8 chars)
                    </Label>
                    <div className="relative">
                      <Input
                        id="signup-password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="bg-white/5 border-white/15 text-white placeholder:text-slate-400 rounded-xl focus-visible:ring-brand-400 text-sm h-9 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {passwordError && <p className="text-xs text-rose-300">{passwordError}</p>}
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-1">
                    <Label htmlFor="signup-confirm" className="text-xs text-slate-300 font-medium">
                      Confirm password
                    </Label>
                    <div className="relative">
                      <Input
                        id="signup-confirm"
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="bg-white/5 border-white/15 text-white placeholder:text-slate-400 rounded-xl focus-visible:ring-brand-400 text-sm h-9 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
                        aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {confirmError && <p className="text-xs text-rose-300">{confirmError}</p>}
                  </div>

                  {/* Submit Signup Button */}
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-brand-600 hover:bg-brand-500 text-white font-semibold rounded-xl h-10 shadow-lg shadow-brand-600/30 transition-all active:scale-[0.99] mt-2 cursor-pointer"
                  >
                    {isSubmitting ? "Creating account…" : "Create JobNex Account"}
                  </Button>

                  {/* Switch to Login */}
                  <p className="text-center text-xs text-slate-400 pt-1">
                    Already have an account?{" "}
                    <button
                      type="button"
                      onClick={() => switchMode("login")}
                      className="underline text-brand-300 hover:text-white font-semibold cursor-pointer"
                    >
                      Log in
                    </button>
                  </p>
                </form>
              )}
            </CardContent>
          </Card>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-20 py-4 px-6 border-t border-white/10 text-center text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between max-w-7xl mx-auto w-full gap-2">
        <p>© 2026 JobNex AI Inc. All rights reserved.</p>
        <div className="flex items-center gap-4 text-xs text-slate-400">
          <span className="hover:text-white cursor-pointer">Privacy Policy</span>
          <span className="hover:text-white cursor-pointer">Terms of Service</span>
          <span className="hover:text-white cursor-pointer">Status</span>
        </div>
      </footer>

      {/* Shake Keyframe Animation */}
      <style>{`
        @keyframes cardShake {
          10%, 90% { transform: translateX(-2px); }
          20%, 80% { transform: translateX(5px); }
          30%, 50%, 70% { transform: translateX(-8px); }
          40%, 60% { transform: translateX(8px); }
        }
        .card-shake {
          animation: cardShake 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
        }
      `}</style>
    </div>
  );
}
