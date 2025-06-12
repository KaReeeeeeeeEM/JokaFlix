import { Button } from "../ui/button";
import logo from "../../assets/logo-sub.png";
import { useNavigate, useLocation } from "react-router-dom";
import { FaSearch } from "react-icons/fa";
import { Dialog, DialogContent, DialogTitle } from "../ui/dialog";
import React from "react";

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

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-30 flex items-center justify-between w-full px-4 py-4 mx-auto xl:px-32 bg-gradient-to-b from-black/80 to-transparent">
        <img
          src={logo}
          alt="JokaFlix Logo"
          className="cursor-pointer w-14 h-14 md:w-24 md:h-24"
          onClick={() => navigate("/")}
        />
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handleSearch} className="cursor-pointer" aria-label="Search">
            <FaSearch className="w-7 h-7 text-primary" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="cursor-pointer"
            onClick={() => setQROpen(true)}
            aria-label="Share QR"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="orange" className="w-7 h-7">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 3.75 9.375v-4.5ZM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 0 1-1.125-1.125v-4.5ZM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 13.5 9.375v-4.5Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.75h.75v.75h-.75v-.75ZM6.75 16.5h.75v.75h-.75v-.75ZM16.5 6.75h.75v.75h-.75v-.75ZM13.5 13.5h.75v.75h-.75v-.75ZM13.5 19.5h.75v.75h-.75v-.75ZM19.5 13.5h.75v.75h-.75v-.75ZM19.5 19.5h.75v.75h-.75v-.75ZM16.5 16.5h.75v.75h-.75v-.75Z" />
            </svg>
          </Button>
          {/* <Button variant="ghost" size="icon" onClick={onWatchlist} aria-label="Watchlist">
            <svg xmlns="http://www.w3.org/2000/svg" fill="orange" viewBox="0 0 24 24" strokeWidth={1.5} stroke="orange" className="w-7 h-7">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" />
            </svg>
          </Button> */}
          {/* <ThemeToggle /> */}
        </div>
      </header>
      <Dialog open={qrOpen} onOpenChange={setQROpen}>
        <DialogContent className="flex flex-col items-center justify-center gap-4 p-8 bg-black rounded-lg">
          <DialogTitle>
            <span className="text-lg font-bold text-primary">Scan to visit JokaFlix</span>
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
    </>
  );
}
