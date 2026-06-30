"use client";

import { Button } from "../ui/button";
import logo from "../../assets/logo-sub.png";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Dialog, DialogContent, DialogTitle } from "../ui/dialog";
import React from "react";
import { Film, Grid3X3, Home, Loader2, QrCode, Save, Search, Tv, User, type LucideIcon } from "lucide-react";
import { ThemeToggle } from "../global/header/theme-toggle";
import { authClient } from "../../lib/auth-client";
import { toast } from "sonner";

type AudioWindow = Window & {
  webkitAudioContext?: typeof AudioContext;
};

export default function Header() {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const [qrOpen, setQROpen] = React.useState(false);
  const [avatarOpen, setAvatarOpen] = React.useState(false);
  const [avatarUrl, setAvatarUrl] = React.useState("");
  const [avatarSaving, setAvatarSaving] = React.useState(false);
  const [profile, setProfile] = React.useState<{ avatar_url?: string | null } | null>(null);
  const session = authClient.useSession();
  const user = session.data?.user as { name?: string | null; username?: string | null; email?: string | null } | undefined;
  const displayName = user?.username || user?.name || user?.email || "JokaFlix user";
  const initials = displayName.trim().slice(0, 1).toUpperCase() || "J";

  const qrUrl = "https://jokaflix.vercel.app";
  const qrImg = `https://quickchart.io/qr?text=${encodeURIComponent(qrUrl)}`;

  const loadProfile = React.useCallback(async () => {
    if (!session.data?.user) {
      setProfile(null);
      setAvatarUrl("");
      return;
    }
    const response = await fetch("/api/me", { credentials: "include" });
    const data = await response.json().catch(() => ({}));
    setProfile(data.profile || null);
    setAvatarUrl(data.profile?.avatar_url || "");
  }, [session.data?.user]);

  React.useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  React.useEffect(() => {
    const listener = () => void loadProfile();
    window.addEventListener("jokaflix:auth-changed", listener);
    window.addEventListener("jokaflix:profile-updated", listener);
    return () => {
      window.removeEventListener("jokaflix:auth-changed", listener);
      window.removeEventListener("jokaflix:profile-updated", listener);
    };
  }, [loadProfile]);

  const handleSearch = () => {
    const params = new URLSearchParams(searchParams?.toString());
    params.set("search", "1");
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handleMobileNavFeedback = () => {
    if (typeof window === "undefined") return;

    if ("vibrate" in navigator) {
      navigator.vibrate?.(18);
    }

    try {
      const AudioContextClass = window.AudioContext || (window as AudioWindow).webkitAudioContext;
      if (!AudioContextClass) return;

      const audioContext = new AudioContextClass();
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      const now = audioContext.currentTime;

      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(720, now);
      oscillator.frequency.exponentialRampToValueAtTime(420, now + 0.045);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.055, now + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.07);

      oscillator.connect(gain);
      gain.connect(audioContext.destination);
      oscillator.start(now);
      oscillator.stop(now + 0.075);
      window.setTimeout(() => audioContext.close(), 140);
    } catch {
      // Mobile browsers can block audio even inside gestures; haptics still runs where supported.
    }
  };

  const openAccount = () => {
    if (!session.data?.user) {
      router.push(`/signin?next=${encodeURIComponent(pathname)}`);
      return;
    }
    setAvatarOpen(true);
  };

  const saveAvatar = async () => {
    setAvatarSaving(true);
    try {
      const response = await fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ avatarUrl }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.error || "Unable to save profile image");
      toast.success("Profile image updated");
      window.dispatchEvent(new Event("jokaflix:profile-updated"));
      await loadProfile();
      setAvatarOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save profile image");
    } finally {
      setAvatarSaving(false);
    }
  };

  const mobileLinks: { label: string; href: string; icon: LucideIcon }[] = [
    { label: "Home", href: "/", icon: Home },
    { label: "Movies", href: "/movies", icon: Film },
    { label: "Series", href: "/series", icon: Tv },
    { label: "Genres", href: "/genres", icon: Grid3X3 },
  ];

  return (
    <>
      <header className="site-header fixed left-0 right-0 top-0 z-30 mx-auto flex w-full items-center justify-between px-4 py-5 md:px-10">
        <Image
          src={logo}
          alt="JokaFlix Logo"
          width={56}
          height={56}
          className="h-12 w-12 cursor-pointer rounded-full object-contain md:h-14 md:w-14"
          onClick={() => router.push("/")}
        />
        <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center rounded-full border border-[var(--app-border)] bg-[var(--app-panel)] p-1 text-xs font-semibold text-[var(--app-muted)] shadow-2xl shadow-black/10 backdrop-blur-xl md:flex">
          {[
            ["Home", "/"],
            ["Movies", "/movies"],
            ["Series", "/series"],
            ["Genres", "/genres"],
          ].map(([label, href]) => (
            <Link
              className={`rounded-full px-5 py-2 transition hover:text-[#e50914] ${
                pathname === href ? "bg-gradient-to-r from-[#b20710] to-[#e50914] text-white" : ""
              }`}
              href={href}
              key={label}
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2 rounded-full border border-[var(--app-border)] bg-[var(--app-panel)] p-1 backdrop-blur-xl">
          <Button variant="ghost" size="icon" onClick={handleSearch} className="h-10 w-10 cursor-pointer rounded-full text-[#e50914] hover:bg-white/10 hover:text-[#e50914]" aria-label="Search">
            <Search className="h-5 w-5" />
          </Button>
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            onClick={openAccount}
            className={`header-avatar-button h-10 w-10 cursor-pointer rounded-full text-[#e50914] hover:bg-white/10 hover:text-[#e50914] ${session.data?.user ? "is-authenticated" : ""}`}
            aria-label={session.data?.user ? "Account profile image" : "Sign in"}
          >
            {session.data?.user && profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" />
            ) : session.data?.user ? (
              <span>{initials}</span>
            ) : (
              <User className="h-5 w-5" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="hidden h-10 w-10 cursor-pointer rounded-full bg-gradient-to-r from-[#b20710] to-[#e50914] text-white hover:opacity-90 md:grid"
            onClick={() => setQROpen(true)}
            aria-label="Share QR"
          >
            <QrCode className="h-5 w-5" />
          </Button>
          {/* <Button variant="ghost" size="icon" onClick={onWatchlist} aria-label="Watchlist">
            <svg xmlns="http://www.w3.org/2000/svg" fill="red" viewBox="0 0 24 24" strokeWidth={1.5} stroke="red" className="w-7 h-7">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" />
            </svg>
          </Button> */}
          {/* <ThemeToggle /> */}
        </div>
      </header>
      <Dialog open={qrOpen} onOpenChange={setQROpen}>
        <DialogContent className="flex flex-col items-center justify-center gap-4 rounded-lg border-[var(--app-border)] bg-[var(--app-panel-strong)] p-8">
          <DialogTitle>
            <span className="text-lg font-bold text-[#e50914]">Scan to visit JokaFlix</span>
          </DialogTitle>
          <img
            src={qrImg}
            alt="JokaFlix QR Code"
            className="w-48 h-48 bg-white rounded-lg"
            style={{ imageRendering: "pixelated" }}
          />
          <span className="text-xs text-gray-400 break-all">{qrUrl}</span>
        </DialogContent>
      </Dialog>
      <Dialog open={avatarOpen} onOpenChange={setAvatarOpen}>
        <DialogContent className="avatar-dialog" showCloseButton>
          <DialogTitle>Profile Image</DialogTitle>
          <div className="avatar-preview">
            {avatarUrl ? <img src={avatarUrl} alt="" /> : <span>{initials}</span>}
          </div>
          <label className="avatar-url-field">
            <span>Image URL</span>
            <input value={avatarUrl} onChange={(event) => setAvatarUrl(event.target.value)} placeholder="https://example.com/avatar.jpg" />
          </label>
          <div className="avatar-dialog-actions">
            <Button variant="ghost" onClick={() => router.push("/profile")}>Open profile</Button>
            <Button className="auth-primary-button" onClick={saveAvatar} disabled={avatarSaving}>
              {avatarSaving ? <Loader2 className="animate-spin" /> : <Save />}
              Save image
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <nav className="mobile-bottom-nav md:hidden" aria-label="Primary mobile navigation">
        {mobileLinks.map(({ label, href, icon: NavIcon }) => {
          return (
            <Link
              className={`mobile-bottom-link ${pathname === href ? "is-active" : ""}`}
              href={href}
              key={label}
              onClick={handleMobileNavFeedback}
            >
              <NavIcon className="h-5 w-5" />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
