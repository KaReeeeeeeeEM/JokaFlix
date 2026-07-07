export type AuthChangeDetail = {
  user?: unknown;
  profile?: { avatar_url?: string | null } | null;
  signedOut?: boolean;
};

const AUTH_CHANGED_EVENT = "jokaflix:auth-changed";
const AUTH_STORAGE_KEY = "jokaflix-auth-event";

export function notifyAuthChanged(detail: AuthChangeDetail) {
  if (typeof window === "undefined") return;

  window.dispatchEvent(new CustomEvent<AuthChangeDetail>(AUTH_CHANGED_EVENT, { detail }));

  try {
    window.localStorage.setItem(
      AUTH_STORAGE_KEY,
      JSON.stringify({ signedOut: Boolean(detail.signedOut), hasUser: Boolean(detail.user), at: Date.now() }),
    );
  } catch {
    // Storage can be unavailable in private browsing; the same-tab event already ran.
  }
}

export { AUTH_CHANGED_EVENT, AUTH_STORAGE_KEY };
