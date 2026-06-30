"use client";

import { Suspense } from "react";
import { usePathname } from "next/navigation";
import { Toaster } from "sonner";
import Header from "../components/layout/Header";
import SearchDrawer from "../components/global/search/Search";
import PWARegister from "../components/pwa/PWARegister";
import SplashScreen from "../components/pwa/SplashScreen";
import LoginNudge from "../components/auth/LoginNudge";

export default function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "/";
  const isPlayerRoute = pathname.startsWith("/play/");
  const isAuthFlowRoute = ["/signin", "/signup", "/verify-email"].some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  return (
    <>
      <PWARegister />
      <SplashScreen />
      <Suspense fallback={null}>
        {!isAuthFlowRoute && <LoginNudge />}
        {!isPlayerRoute && <Header />}
        {!isPlayerRoute && <SearchDrawer />}
      </Suspense>
      <Toaster richColors position="top-center" toastOptions={{ className: "jokaflix-toast" }} />
      <Suspense fallback={null}>{children}</Suspense>
    </>
  );
}
