"use client";

import * as React from "react";
import { authClient } from "../../lib/auth-client";
import { AUTH_CHANGED_EVENT, AUTH_STORAGE_KEY, type AuthChangeDetail } from "../../lib/auth-events";

type AuthChangeEvent = CustomEvent<AuthChangeDetail>;

export default function AuthSessionSync() {
  const session = authClient.useSession();

  React.useEffect(() => {
    const syncSession = async (_event?: Event) => {
      await session.refetch();
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
  }, [session]);

  return null;
}
