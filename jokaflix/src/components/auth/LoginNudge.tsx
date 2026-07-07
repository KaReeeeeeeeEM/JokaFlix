"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Film, X } from "lucide-react";
import { authClient } from "../../lib/auth-client";
import { AUTH_CHANGED_EVENT, type AuthChangeDetail } from "../../lib/auth-events";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";

export default function LoginNudge() {
  const session = authClient.useSession();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const [open, setOpen] = React.useState(false);
  const next = `${pathname}${searchParams?.toString() ? `?${searchParams.toString()}` : ""}`;
  const isBlockedRoute = ["/signin", "/signup", "/verify-email", "/forgot-password"].some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  React.useEffect(() => {
    if (session.data?.user) {
      setOpen(false);
      window.localStorage.setItem("jokaflix-login-nudge-dismissed", "1");
    }
  }, [session.data?.user]);

  React.useEffect(() => {
    if (isBlockedRoute) {
      setOpen(false);
      return;
    }

    if (session.isPending || session.data?.user) return;
    if (window.localStorage.getItem("jokaflix-login-nudge-dismissed")) return;

    const timer = window.setTimeout(() => {
      setOpen(true);
    }, 1800);

    return () => window.clearTimeout(timer);
  }, [isBlockedRoute, session.data?.user, session.isPending]);

  React.useEffect(() => {
    const closeForAuthenticatedUser = (event: Event) => {
      const detail = (event as CustomEvent<AuthChangeDetail>).detail;
      if (detail?.signedOut) {
        setOpen(false);
        window.localStorage.setItem("jokaflix-login-nudge-dismissed", "1");
        void session.refetch();
        return;
      }
      void session.refetch().then(() => {
        setOpen(false);
        window.localStorage.setItem("jokaflix-login-nudge-dismissed", "1");
      });
    };
    window.addEventListener(AUTH_CHANGED_EVENT, closeForAuthenticatedUser);
    return () => window.removeEventListener(AUTH_CHANGED_EVENT, closeForAuthenticatedUser);
  }, [session]);

  React.useEffect(() => {
    const listener = async () => {
      await session.refetch();
      if (!isBlockedRoute && !session.data?.user) setOpen(true);
    };
    window.addEventListener("jokaflix:login-nudge", listener);
    return () => window.removeEventListener("jokaflix:login-nudge", listener);
  }, [isBlockedRoute, session]);

  const dismiss = () => {
    window.localStorage.setItem("jokaflix-login-nudge-dismissed", "1");
    setOpen(false);
  };

  return (
    <Dialog open={open && !session.data?.user && !isBlockedRoute} onOpenChange={setOpen}>
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
