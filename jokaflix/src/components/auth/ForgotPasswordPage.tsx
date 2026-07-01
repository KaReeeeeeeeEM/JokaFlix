"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, CheckCircle2, ChevronLeft, Eye, EyeOff, Loader2, Mail, RotateCcw, ShieldCheck, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { authSlides } from "./auth-slides";

const passwordRequirements = [
  { id: "length", label: "At least 10 characters", test: (password: string) => password.length >= 10 },
  { id: "uppercase", label: "One uppercase letter", test: (password: string) => /[A-Z]/.test(password) },
  { id: "lowercase", label: "One lowercase letter", test: (password: string) => /[a-z]/.test(password) },
  { id: "number", label: "One number", test: (password: string) => /\d/.test(password) },
  { id: "symbol", label: "One symbol", test: (password: string) => /[^A-Za-z0-9]/.test(password) },
];

const RESEND_WAIT_SECONDS = 60;
const WRONG_CODE_LIMIT = 3;
const BASE_HOLD_SECONDS = 30;
const MAX_HOLD_SECONDS = 300;

function passwordScore(password: string) {
  return passwordRequirements.reduce((score, requirement) => score + (requirement.test(password) ? 1 : 0), 0);
}

function secondsLeft(until: number, now: number) {
  return Math.max(0, Math.ceil((until - now) / 1000));
}

function isOtpResetError(message: string) {
  return /code|otp|token|expired|invalid|verification/i.test(message);
}

async function authFetch(path: string, body: Record<string, unknown>) {
  const response = await fetch(`/api/auth${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.message || data?.error || "Password reset failed");
  }
  return data;
}

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [activeSlide, setActiveSlide] = React.useState(0);
  const [step, setStep] = React.useState<"email" | "verify" | "password" | "done">("email");
  const [email, setEmail] = React.useState("");
  const [otp, setOtp] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [resendAvailableAt, setResendAvailableAt] = React.useState(0);
  const [holdUntil, setHoldUntil] = React.useState(0);
  const [failedAttempts, setFailedAttempts] = React.useState(0);
  const [holdLevel, setHoldLevel] = React.useState(0);
  const [now, setNow] = React.useState(() => Date.now());
  const cleanEmail = email.trim().toLowerCase();
  const cleanOtp = otp.replace(/\D/g, "").slice(0, 6);
  const resendRemaining = secondsLeft(resendAvailableAt, now);
  const holdRemaining = secondsLeft(holdUntil, now);
  const score = passwordScore(password);
  const passwordChecks = passwordRequirements.map((requirement) => ({
    ...requirement,
    met: requirement.test(password),
  }));
  const passwordsMatch = password.length > 0 && password === confirmPassword;
  const canReset = score >= 4 && passwordsMatch;

  React.useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % authSlides.length);
    }, 4200);
    return () => window.clearInterval(timer);
  }, []);

  React.useEffect(() => {
    if (!resendRemaining && !holdRemaining) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [holdRemaining, resendRemaining]);

  React.useEffect(() => {
    if (step !== "verify" || loading || holdRemaining > 0 || cleanOtp.length !== 6) return;

    const timer = window.setTimeout(() => {
      setFailedAttempts(0);
      setHoldUntil(0);
      setStep("password");
    }, 220);

    return () => window.clearTimeout(timer);
  }, [cleanOtp.length, holdRemaining, loading, step]);

  const startResendCooldown = () => {
    setNow(Date.now());
    setResendAvailableAt(Date.now() + RESEND_WAIT_SECONDS * 1000);
  };

  const registerFailedCodeAttempt = () => {
    setFailedAttempts((current) => {
      const next = current + 1;
      if (next < WRONG_CODE_LIMIT) return next;

      const nextHoldLevel = holdLevel + 1;
      const holdSeconds = Math.min(BASE_HOLD_SECONDS * 2 ** holdLevel, MAX_HOLD_SECONDS);
      const nextNow = Date.now();
      setNow(nextNow);
      setHoldLevel(nextHoldLevel);
      setHoldUntil(nextNow + holdSeconds * 1000);
      toast.error(`Too many wrong codes. Try again in ${holdSeconds} seconds.`);
      return 0;
    });
  };

  const requestCode = async () => {
    if (resendRemaining > 0) {
      toast.error(`Wait ${resendRemaining} seconds before requesting another code`);
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      toast.error("Enter a valid email address");
      return;
    }

    setLoading(true);
    try {
      const emailHealth = await fetch("/api/email/health", { method: "POST" });
      if (!emailHealth.ok) {
        const data = await emailHealth.json().catch(() => ({}));
        throw new Error(data?.message || "Email delivery is not available right now");
      }

      await authFetch("/email-otp/request-password-reset", { email: cleanEmail });
      setStep("verify");
      setOtp("");
      setPassword("");
      setConfirmPassword("");
      setFailedAttempts(0);
      setHoldUntil(0);
      setHoldLevel(0);
      startResendCooldown();
      toast.success("Check your email for the reset code");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to send reset code");
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async () => {
    if (!canReset) {
      toast.error(password !== confirmPassword ? "Passwords do not match" : "Use a stronger password");
      return;
    }

    setLoading(true);
    try {
      await authFetch("/email-otp/reset-password", {
        email: cleanEmail,
        otp: cleanOtp,
        password,
      });
      setStep("done");
      toast.success("Password updated");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to reset password";

      if (isOtpResetError(message)) {
        registerFailedCodeAttempt();
        setOtp("");
        setStep("verify");
        toast.error("That reset code is not valid or has expired. Enter the latest code from your email.");
        return;
      }

      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-page-shell reveal-up">
        <div className="auth-form-panel is-forgot">
          <div className="auth-copy">
            <p>Password recovery</p>
            <h1>{step === "done" ? "Password reset" : "Forgot password"}</h1>
            <span>
              {step === "email"
                ? "Enter your account email and we will send a one-time reset code."
                : step === "verify"
                  ? "Enter the reset code from your email. You will continue automatically after 6 digits."
                  : step === "password"
                    ? "Choose a stronger password. We will confirm the reset code as the password is changed."
                    : "Your password has been changed. You can now sign in with the new password."}
            </span>
          </div>

          {step === "email" && (
            <>
              <label className="auth-field">
                <span>Email</span>
                <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@email.com" />
              </label>
              <Button className="auth-primary-button" onClick={requestCode} disabled={loading}>
                {loading ? <Loader2 className="animate-spin" /> : <Mail />}
                Send reset code
              </Button>
            </>
          )}

          {step === "verify" && (
            <>
              <label className="auth-field">
                <span>Verification code</span>
                <input
                  className="auth-otp-input"
                  inputMode="numeric"
                  disabled={loading || holdRemaining > 0}
                  value={cleanOtp}
                  onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="000000"
                />
              </label>
              <div className="auth-otp-actions">
                <div className="auth-otp-status">
                  {holdRemaining > 0 ? (
                    <>
                      <ShieldCheck />
                      Try again in {holdRemaining}s
                    </>
                  ) : cleanOtp.length === 6 ? (
                    <>
                      <CheckCircle2 />
                      Opening password step
                    </>
                  ) : (
                    <>
                    </>
                  )}
                </div>
                <Button variant="ghost" className="auth-back-button" onClick={() => setStep("email")} disabled={loading}>
                  <ChevronLeft />
                  Back
                </Button>
              </div>
              {failedAttempts > 0 && holdRemaining === 0 && (
                <small className="auth-bad">
                  Wrong code attempts: {failedAttempts}/{WRONG_CODE_LIMIT}
                </small>
              )}
              <button type="button" className="auth-resend-link" onClick={requestCode} disabled={loading || resendRemaining > 0}>
                <RotateCcw />
                <span>{resendRemaining > 0 ? `Send a new code in ${resendRemaining}s` : "Send a new code"}</span>
              </button>
            </>
          )}

          {step === "password" && (
            <>
              <label className="auth-field">
                <span>New password</span>
                <div className="auth-password-row">
                  <input type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Use a strong password" />
                  <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label="Toggle password visibility">
                    {showPassword ? <EyeOff /> : <Eye />}
                  </button>
                </div>
                <div className="auth-password-rules">
                  {passwordChecks.map((requirement) => (
                    <span className={requirement.met ? "is-met" : ""} key={requirement.id}>
                      {requirement.met ? <Check /> : <X />}
                      {requirement.label}
                    </span>
                  ))}
                </div>
              </label>
              <label className="auth-field">
                <span>Confirm password</span>
                <div className="auth-password-row">
                  <input type={showPassword ? "text" : "password"} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Repeat new password" />
                  <CheckCircle2 className={passwordsMatch ? "auth-confirm-icon is-valid" : "auth-confirm-icon"} />
                </div>
                {confirmPassword.length > 0 && !passwordsMatch && <small className="auth-bad">Passwords do not match</small>}
              </label>
              <div className="auth-step-actions">
                <Button variant="ghost" className="auth-back-button" onClick={() => setStep("verify")} disabled={loading}>
                  <ChevronLeft />
                  Back
                </Button>
                <Button className="auth-primary-button" onClick={resetPassword} disabled={loading || !canReset}>
                  {loading ? <Loader2 className="animate-spin" /> : <ShieldCheck />}
                  Reset password
                </Button>
              </div>
            </>
          )}

          {step === "done" && (
            <>
              <div className="auth-success-panel">
                <ShieldCheck />
                <span>Your JokaFlix password has been updated.</span>
              </div>
              <Button className="auth-primary-button" onClick={() => router.push("/signin")}>
                Sign in
              </Button>
            </>
          )}

          <p className="auth-switch-copy">
            Remembered your password?
            <Link href="/signin">Sign in</Link>
          </p>
        </div>

        <aside className="auth-carousel-panel" aria-label="JokaFlix account recovery">
          {authSlides.map((slide, index) => (
            <article className={`auth-carousel-slide ${index === activeSlide ? "is-active" : ""}`} key={slide.image}>
              <img src={slide.image} alt="" className="auth-carousel-bg" />
              <img src={slide.poster} alt="" className="auth-floating-poster" />
            </article>
          ))}
          <div className="auth-carousel-dots">
            {authSlides.map((slide, index) => (
              <button type="button" aria-label={`Show carousel image ${index + 1}`} className={index === activeSlide ? "is-active" : ""} key={slide.image} onClick={() => setActiveSlide(index)} />
            ))}
          </div>
        </aside>
      </section>
    </main>
  );
}
