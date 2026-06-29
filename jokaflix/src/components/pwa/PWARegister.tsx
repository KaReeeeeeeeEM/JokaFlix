"use client";

import * as React from "react";

export default function PWARegister() {
  React.useEffect(() => {
    if (!("serviceWorker" in navigator) || process.env.NODE_ENV !== "production") return;

    const register = async () => {
      try {
        await navigator.serviceWorker.register("/service-worker.js", { scope: "/" });
      } catch (error) {
        console.warn("Service worker registration failed", error);
      }
    };

    if (document.readyState === "complete") {
      register();
      return;
    }

    window.addEventListener("load", register, { once: true });
    return () => window.removeEventListener("load", register);
  }, []);

  return null;
}
