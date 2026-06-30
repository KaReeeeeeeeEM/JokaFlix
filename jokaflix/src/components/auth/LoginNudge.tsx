"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Film, X } from "lucide-react";
import { authClient } from "../../lib/auth-client";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";

export default function LoginNudge() {
  const session = authClient.useSession();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const [open, setOpen] = React.useState(false);
  const next = `${pathname}${searchParams?.toString() ? `?${searchParams.toString()}` : ""}`;
  const isAuthRoute = pathname.startsWith("/signin") || pathname.startsWith("/signup");

  React.useEffect(() => {
    if (isAuthRoute) {
      setOpen(false);
      return;
    }

    if (session.isPending || session.data?.user) return;
    if (window.localStorage.getItem("jokaflix-login-nudge-dismissed")) return;

    const timer = window.setTimeout(() => {
      setOpen(true);
    }, 1800);

    return () => window.clearTimeout(timer);
  }, [isAuthRoute, session.data?.user, session.isPending]);

  React.useEffect(() => {
    const listener = () => {
      if (!isAuthRoute) setOpen(true);
    };
    window.addEventListener("jokaflix:login-nudge", listener);
    return () => window.removeEventListener("jokaflix:login-nudge", listener);
  }, [isAuthRoute]);

  const dismiss = () => {
    window.localStorage.setItem("jokaflix-login-nudge-dismissed", "1");
    setOpen(false);
  };

  return (
    <Dialog open={open && !session.data?.user && !isAuthRoute} onOpenChange={setOpen}>
      <DialogContent className="login-nudge-dialog" showCloseButton={false}>
        <button type="button" className="login-nudge-close" onClick={dismiss} aria-label="Close">
          <X />
        </button>
        <div className="login-nudge-icon">
          <Film />
        </div>
        <DialogTitle className="login-nudge-title">A BETTER JOKAFLIX</DialogTitle>
        <DialogDescription>
          Save titles, rate movies, continue watching, and get recommendations that follow your taste.
        </DialogDescription>
        <div className="login-nudge-actions">
          <Button asChild className="auth-primary-button">
            <Link
              href={`/signin?next=${encodeURIComponent(next)}`}
              onClick={() => setOpen(false)}
              onMouseDown={() => setOpen(false)}
            >
              Sign in
            </Link>
          </Button>
          <button type="button" onClick={dismiss}>Later</button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
