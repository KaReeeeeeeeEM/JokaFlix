import { Button } from "../ui/button";
import logo from "../../assets/logo-sub.png";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { Dialog, DialogContent, DialogTitle } from "../ui/dialog";
import React from "react";
import { Film, Grid3X3, Home, QrCode, Search, Tv, type LucideIcon } from "lucide-react";
import { ThemeToggle } from "../global/header/theme-toggle";

type HeaderProps = {
  onSearch?: () => void;
  onQRCode?: () => void;
  onWatchlist?: () => void;
};

export default function Header({ }: HeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [qrOpen, setQROpen] = React.useState(false);

  const qrUrl = "https://jokaflix.vercel.app";
  const qrImg = `https://quickchart.io/qr?text=${encodeURIComponent(qrUrl)}`;

  const handleSearch = () => {
    const params = new URLSearchParams(location.search);
    params.set("search", "1");
    navigate({ pathname: location.pathname, search: params.toString() }, { replace: false });
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
        <img
          src={logo}
          alt="JokaFlix Logo"
          className="h-12 w-12 cursor-pointer rounded-full object-contain md:h-14 md:w-14"
          onClick={() => navigate("/")}
        />
        <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center rounded-full border border-[var(--app-border)] bg-[var(--app-panel)] p-1 text-xs font-semibold text-[var(--app-muted)] shadow-2xl shadow-black/10 backdrop-blur-xl md:flex">
          {[
            ["Home", "/"],
            ["Movies", "/movies"],
            ["Series", "/series"],
            ["Genres", "/genres"],
          ].map(([label, href]) => (
            <NavLink
              className={({ isActive }) =>
                `rounded-full px-5 py-2 transition hover:text-[#e50914] ${
                  isActive ? "bg-gradient-to-r from-[#b20710] to-[#e50914] text-white" : ""
                }`
              }
              to={href}
              key={label}
            >
              {label}
            </NavLink>
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
      <nav className="mobile-bottom-nav md:hidden" aria-label="Primary mobile navigation">
        {mobileLinks.map(({ label, href, icon: NavIcon }) => {
          return (
            <NavLink
              className={({ isActive }) => `mobile-bottom-link ${isActive ? "is-active" : ""}`}
              to={href}
              key={label}
            >
              <NavIcon className="h-5 w-5" />
              <span>{label}</span>
            </NavLink>
          );
        })}
      </nav>
    </>
  );
}
