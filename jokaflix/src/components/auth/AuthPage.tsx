"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { getCountryDataList } from "countries-list";
import { Check, ChevronDown, ChevronLeft, Eye, EyeOff, KeyRound, Loader2, LogIn, UserPlus, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { authClient } from "../../lib/auth-client";
import { authSlides } from "./auth-slides";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

type AuthMode = "signin" | "signup";

const genders = ["Prefer not to say", "Female", "Male", "Non-binary", "Other"];
const countries = getCountryDataList()
  .map((country) => country.name)
  .sort((a, b) => a.localeCompare(b));

const passwordRequirements = [
  { id: "length", label: "At least 10 characters", test: (password: string) => password.length >= 10 },
  { id: "uppercase", label: "One uppercase letter", test: (password: string) => /[A-Z]/.test(password) },
  { id: "lowercase", label: "One lowercase letter", test: (password: string) => /[a-z]/.test(password) },
  { id: "number", label: "One number", test: (password: string) => /\d/.test(password) },
  { id: "symbol", label: "One symbol", test: (password: string) => /[^A-Za-z0-9]/.test(password) },
];

function passwordScore(password: string) {
  let score = 0;
  if (password.length >= 10) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[a-z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  return score;
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
    throw new Error(data?.message || data?.error || "Authentication failed");
  }
  return data;
}

function normalizeUsername(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "")
    .slice(0, 24);
}

function usernameSuggestions(name: string, email: string) {
  const source = normalizeUsername(name.replace(/\s+/g, "")) || normalizeUsername(email.split("@")[0] || "jokafan");
  const fallback = source.length >= 3 ? source : "jokafan";
  const suffix = String(Math.max(100, name.length * 17 + email.length * 11)).slice(0, 3);
  return Array.from(new Set([
    fallback,
    `${fallback}${new Date().getFullYear()}`.slice(0, 24),
    `${fallback}_${suffix}`.slice(0, 24),
  ]));
}

function AuthDropdown({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="auth-field">
      <span>{label}</span>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button type="button" className="auth-dropdown-trigger">
            <span>{value}</span>
            <ChevronDown />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="auth-dropdown-content" align="start">
          <DropdownMenuRadioGroup value={value} onValueChange={onChange}>
            {options.map((option) => (
              <DropdownMenuRadioItem className="auth-dropdown-item" value={option} key={option}>
                {option}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </label>
  );
}

export default function AuthPage({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const session = authClient.useSession();
  const [activeSlide, setActiveSlide] = React.useState(0);
  const [showPassword, setShowPassword] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [usernameAvailable, setUsernameAvailable] = React.useState<boolean | null>(null);
  const [usernameChecking, setUsernameChecking] = React.useState(false);
  const [signupStep, setSignupStep] = React.useState(1);
  const [form, setForm] = React.useState({
    name: "",
    email: "",
    username: "",
    password: "",
    nationality: "Tanzania",
    gender: "Prefer not to say",
  });
  const score = passwordScore(form.password);
  const isSignUp = mode === "signup";
  const nextPath = searchParams?.get("next") || "/profile";
  const suggestions = React.useMemo(() => usernameSuggestions(form.name, form.email), [form.email, form.name]);
  const cleanUsername = normalizeUsername(form.username);
  const passwordChecks = passwordRequirements.map((requirement) => ({
    ...requirement,
    met: requirement.test(form.password),
  }));

  React.useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % authSlides.length);
    }, 4200);
    return () => window.clearInterval(timer);
  }, []);

  React.useEffect(() => {
    if (!session.data?.user) return;
    router.replace(nextPath);
  }, [nextPath, router, session.data?.user]);

  React.useEffect(() => {
    if (!isSignUp || form.username.trim().length < 3) {
      setUsernameAvailable(null);
      setUsernameChecking(false);
      return;
    }

    const timer = window.setTimeout(async () => {
      setUsernameChecking(true);
      try {
        const response = await fetch("/api/user/username-availability", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: form.username.trim() }),
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(result?.message || "Unable to check username");
        setUsernameAvailable(typeof result.available === "boolean" ? result.available : null);
      } catch {
        setUsernameAvailable(null);
      } finally {
        setUsernameChecking(false);
      }
    }, 380);

    return () => window.clearTimeout(timer);
  }, [form.username, isSignUp]);

  const update = (key: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setForm((current) => ({ ...current, [key]: event.target.value }));
  };

  const setField = (key: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
    if (key === "username") {
      setUsernameAvailable(null);
      setUsernameChecking(value.trim().length >= 3);
    }
  };

  const canContinueSignup = () => {
    if (signupStep === 1) {
      return form.name.trim().length >= 2 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim());
    }
    if (signupStep === 2) {
      return Boolean(form.nationality && form.gender);
    }
    return cleanUsername.length >= 3 && usernameAvailable !== false && !usernameChecking && score >= 4;
  };

  const nextSignupStep = () => {
    if (!canContinueSignup()) {
      toast.error(
        signupStep === 1
          ? "Enter your name and a valid email"
          : signupStep === 2
            ? "Choose your nationality and gender"
            : "Choose an available username and a stronger password"
      );
      return;
    }
    setSignupStep((step) => Math.min(step + 1, 3));
  };

  const signIn = async () => {
    setLoading(true);
    try {
      const identifier = form.email.trim();
      const path = identifier.includes("@") ? "/sign-in/email" : "/sign-in/username";
      const body = identifier.includes("@")
        ? { email: identifier, password: form.password, rememberMe: true }
        : { username: identifier, password: form.password, rememberMe: true };
      await authFetch(path, body);
      await session.refetch();
      window.dispatchEvent(new Event("jokaflix:auth-changed"));
      router.refresh();
      toast.success("Signed in");
      router.push(nextPath);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to sign in");
    } finally {
      setLoading(false);
    }
  };

  const signUp = async () => {
    if (score < 4) {
      toast.error("Use a stronger password");
      return;
    }
    if (cleanUsername.length < 3) {
      toast.error("Choose a username with at least 3 characters");
      return;
    }
    if (usernameAvailable === false) {
      toast.error("That username is already taken");
      return;
    }

    setLoading(true);
    try {
      const emailHealth = await fetch("/api/email/health", { method: "POST" });
      if (!emailHealth.ok) {
        const data = await emailHealth.json().catch(() => ({}));
        throw new Error(data?.message || "Email delivery is not available right now");
      }
      await authFetch("/sign-up/email", {
        name: form.name.trim() || form.username.trim(),
        email: form.email.trim(),
        username: cleanUsername,
        displayUsername: cleanUsername,
        password: form.password,
        nationality: form.nationality,
        gender: form.gender,
        callbackURL: "/profile",
      });
      toast.success("Check your email for the code", {
        description: "Enter the OTP to verify your account.",
      });
      router.push(`/verify-email?email=${encodeURIComponent(form.email.trim())}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to create account");
    } finally {
      setLoading(false);
    }
  };

  const signInWithPasskey = async () => {
    setLoading(true);
    try {
      const result = await authClient.signIn.passkey();
      if (result.error) throw new Error(result.error.message);
      await session.refetch();
      window.dispatchEvent(new Event("jokaflix:auth-changed"));
      router.refresh();
      toast.success("Signed in with passkey");
      router.push(nextPath);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Passkey sign-in failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-page-shell reveal-up">
        <div className={`auth-form-panel ${isSignUp ? "is-signup" : "is-signin"}`}>
          <Link href="/" className="auth-page-brand">
            <img src="/logo-sub.png" alt="" />
            <span>JokaFlix</span>
          </Link>

          <div className="auth-copy">
            <p>{isSignUp ? "Start your account" : "Welcome back"}</p>
            <h1>{isSignUp ? "Create account" : "Sign in"}</h1>
            <span>{isSignUp ? "Build your watchlist, ratings, and recommendations." : "Return to your profile, ratings, and continue watching."}</span>
          </div>

          {isSignUp && (
            <div className="auth-stepper" aria-label="Signup steps">
              {[1, 2, 3].map((step) => (
                <React.Fragment key={step}>
                  <span className={`auth-step-dot ${signupStep >= step ? "is-active" : ""} ${signupStep === step ? "is-current" : ""}`}>
                    {step}
                  </span>
                  {step < 3 && <i className={signupStep > step ? "is-active" : ""} />}
                </React.Fragment>
              ))}
            </div>
          )}

          {!isSignUp ? (
            <>
              <label className="auth-field">
                <span>Email or username</span>
                <input value={form.email} onChange={update("email")} placeholder="you@email.com or username" />
              </label>
              <label className="auth-field">
                <span>Password</span>
                <div className="auth-password-row">
                  <input type={showPassword ? "text" : "password"} value={form.password} onChange={update("password")} placeholder="Use a strong password" />
                  <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label="Toggle password visibility">
                    {showPassword ? <EyeOff /> : <Eye />}
                  </button>
                </div>
              </label>
            </>
          ) : signupStep === 1 ? (
            <>
              <label className="auth-field">
                <span>Name</span>
                <input value={form.name} onChange={update("name")} placeholder="Your full name" />
              </label>
              <label className="auth-field">
                <span>Email</span>
                <input value={form.email} onChange={update("email")} placeholder="you@email.com" />
              </label>
            </>
          ) : signupStep === 2 ? (
            <div className="auth-select-grid">
              <AuthDropdown label="Nationality" value={form.nationality} options={countries} onChange={(value) => setField("nationality", value)} />
              <AuthDropdown label="Gender" value={form.gender} options={genders} onChange={(value) => setField("gender", value)} />
            </div>
          ) : (
            <>
              <label className="auth-field">
                <span>Username</span>
                <input value={form.username} onChange={(event) => setField("username", normalizeUsername(event.target.value))} placeholder="jokafan" />
                <div className="auth-username-suggestions" aria-label="Username suggestions">
                  {suggestions.map((suggestion) => (
                    <button type="button" key={suggestion} onClick={() => setField("username", suggestion)}>
                      {suggestion}
                    </button>
                  ))}
                </div>
                {form.username.trim().length >= 3 && (
                  <small className={usernameAvailable ? "auth-ok" : usernameAvailable === false ? "auth-bad" : "auth-muted"}>
                    {usernameChecking ? "Checking username..." : usernameAvailable ? "Username is available" : usernameAvailable === false ? "Username is already taken" : "Type to check availability"}
                  </small>
                )}
              </label>
              <label className="auth-field">
                <span>Password</span>
                <div className="auth-password-row">
                  <input type={showPassword ? "text" : "password"} value={form.password} onChange={update("password")} placeholder="Use a strong password" />
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
            </>
          )}

          {isSignUp ? (
            <div className="auth-step-actions">
              {signupStep > 1 && (
                <Button variant="ghost" className="auth-back-button" onClick={() => setSignupStep((step) => Math.max(1, step - 1))} disabled={loading}>
                  <ChevronLeft />
                  Back
                </Button>
              )}
              <Button className="auth-primary-button" onClick={signupStep === 3 ? signUp : nextSignupStep} disabled={loading || (signupStep === 3 && !canContinueSignup())}>
                {loading ? <Loader2 className="animate-spin" /> : signupStep === 3 ? <UserPlus /> : null}
                {signupStep === 3 ? "Create account" : "Continue"}
              </Button>
            </div>
          ) : (
            <Button className="auth-primary-button" onClick={signIn} disabled={loading}>
              {loading ? <Loader2 className="animate-spin" /> : <LogIn />}
              Sign in
            </Button>
          )}

          {!isSignUp && (
            <Button variant="ghost" className="auth-passkey-button" onClick={signInWithPasskey} disabled={loading}>
              <KeyRound />
              Sign in with passkey
            </Button>
          )}

          <p className="auth-switch-copy">
            {isSignUp ? "Already have an account?" : "Don't have an account?"}
            <Link href={isSignUp ? "/signin" : "/signup"}>{isSignUp ? "Sign in" : "Get access"}</Link>
          </p>
        </div>

        <aside className="auth-carousel-panel" aria-label="JokaFlix account benefits">
          {authSlides.map((slide, index) => (
            <article className={`auth-carousel-slide ${index === activeSlide ? "is-active" : ""}`} key={slide.title}>
              <img src={slide.image} alt="" className="auth-carousel-bg" />
              <div className="auth-carousel-copy">
                <div className="auth-page-brand is-small">
                  <img src="/logo-sub.png" alt="" />
                  <span>JokaFlix</span>
                </div>
                <h2>{slide.title}</h2>
                <p>{slide.copy}</p>
              </div>
              <img src={slide.poster} alt="" className="auth-floating-poster" />
            </article>
          ))}
          <div className="auth-carousel-dots">
            {authSlides.map((slide, index) => (
              <button type="button" aria-label={`Show ${slide.title}`} className={index === activeSlide ? "is-active" : ""} key={slide.title} onClick={() => setActiveSlide(index)} />
            ))}
          </div>
        </aside>
      </section>
    </main>
  );
}
