"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, MailCheck, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { authSlides } from "./auth-slides";

async function authFetch(path: string, body: Record<string, unknown>) {
  const response = await fetch(`/api/auth${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.message || data?.error || "Verification failed");
  }
  return data;
}

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams?.get("email") || "";
  const [otp, setOtp] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [resending, setResending] = React.useState(false);
  const [activeSlide, setActiveSlide] = React.useState(0);
  const submittedOtpRef = React.useRef("");

  const cleanEmail = email.trim();
  const cleanOtp = otp.replace(/\D/g, "").slice(0, 6);

  React.useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % authSlides.length);
    }, 4200);
    return () => window.clearInterval(timer);
  }, []);

  const verify = React.useCallback(async (code: string) => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      toast.error("Open the verification page from the email we sent you");
      return;
    }
    if (code.length !== 6 || loading || submittedOtpRef.current === code) {
      return;
    }

    submittedOtpRef.current = code;
    setLoading(true);
    try {
      await authFetch("/email-otp/verify-email", { email: cleanEmail, otp: code });
      toast.success("Email verified", {
        description: "You can now sign in to JokaFlix.",
      });
      router.push("/signin");
    } catch (error) {
      submittedOtpRef.current = "";
      toast.error(error instanceof Error ? error.message : "Invalid or expired code");
    } finally {
      setLoading(false);
    }
  }, [cleanEmail, loading, router]);

  const handleOtpChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextOtp = event.target.value.replace(/\D/g, "").slice(0, 6);
    setOtp(nextOtp);
    if (nextOtp.length < 6) {
      submittedOtpRef.current = "";
    }
    if (nextOtp.length === 6) {
      void verify(nextOtp);
    }
  };

  const resend = async () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      toast.error("Enter your email before requesting a new code");
      return;
    }

    setResending(true);
    try {
      await authFetch("/email-otp/send-verification-otp", { email: cleanEmail, type: "email-verification" });
      toast.success("New code sent", {
        description: "Check your inbox for the latest OTP.",
      });
      setOtp("");
      submittedOtpRef.current = "";
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to resend code");
    } finally {
      setResending(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-page-shell reveal-up">
        <div className="auth-form-panel is-otp">
          <div className="auth-otp-icon">
            <MailCheck />
          </div>

          <div className="auth-copy auth-otp-copy">
            <p>Email verification</p>
            <h1>Enter your code</h1>
            <span>We sent a one-time code to your email. Use it to activate ratings, watchlists, and recommendations.</span>
          </div>

          <div className="auth-otp-fields">
            <label className="auth-field">
              <span>Verification code</span>
              <input
                value={cleanOtp}
                onChange={handleOtpChange}
                placeholder="000000"
                inputMode="numeric"
                className="auth-otp-input"
                disabled={loading}
              />
            </label>
          </div>

          <div className="auth-otp-actions">
            {loading ? (
              <div className="auth-otp-status" aria-live="polite">
                <Loader2 className="animate-spin" />
                Verifying code
              </div>
            ) : null}

            <button className="auth-otp-resend" type="button" onClick={resend} disabled={resending}>
              {resending ? <Loader2 className="animate-spin" /> : <RotateCcw />}
              Send a new code
            </button>
          </div>

          <p className="auth-switch-copy auth-otp-switch">
            Already verified?
            <Link href="/signin">Sign in</Link>
          </p>
        </div>

        <aside className="auth-carousel-panel" aria-label="JokaFlix account benefits">
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
