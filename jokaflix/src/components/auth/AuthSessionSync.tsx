"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { authClient } from "../../lib/auth-client";
import { AUTH_CHANGED_EVENT, AUTH_STORAGE_KEY, type AuthChangeDetail } from "../../lib/auth-events";

type AuthChangeEvent = CustomEvent<AuthChangeDetail>;

export default function AuthSessionSync() {
  const router = useRouter();
  const session = authClient.useSession();

  React.useEffect(() => {
    const syncSession = async (event?: Event) => {
      const detail = event && "detail" in event ? (event as AuthChangeEvent).detail : undefined;
      await session.refetch();
      if (detail?.signedOut) {
        router.refresh();
      }
    };

    const syncFromStorage = (event: StorageEvent) => {
      if (event.key === AUTH_STORAGE_KEY) {
        void syncSession();
      }
    };

    window.addEventListener(AUTH_CHANGED_EVENT, syncSession);
    window.addEventListener("storage", syncFromStorage);

    return () => {
      window.removeEventListener(AUTH_CHANGED_EVENT, syncSession);
      window.removeEventListener("storage", syncFromStorage);
    };
  }, [router, session]);

  return null;
}
