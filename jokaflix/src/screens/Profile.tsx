"use client";

import * as React from "react";
import Link from "next/link";
import { Bookmark, Clock, KeyRound, LogOut, Save, Star, User } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { authClient } from "../lib/auth-client";
import { Dialog, DialogContent, DialogTitle } from "../components/ui/dialog";

type ProfileTitleItem = {
  media_type: "movie" | "tv";
  tmdb_id: string | number;
  title?: string | null;
  poster_path?: string | null;
  backdrop_path?: string | null;
  season?: number | null;
  episode?: number | null;
  rating?: string | number | null;
};

type ProfileData = {
  user?: unknown;
  profile?: {
    avatar_url?: string | null;
  } | null;
  continueWatching?: ProfileTitleItem[];
  watchLater?: ProfileTitleItem[];
  ratings?: ProfileTitleItem[];
};

function posterUrl(path?: string | null) {
  return path ? `https://image.tmdb.org/t/p/w500${path}` : "";
}

function titleHref(item: ProfileTitleItem) {
  return `/${item.media_type === "tv" ? "series" : "movie"}/${item.tmdb_id}`;
}

function EmptyProfileRail({ message }: { message: string }) {
  return (
    <div className="profile-empty-rail">
      <p>{message}</p>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <main className="profile-page">
      {["Continue Watching", "Watch Later", "Your Ratings"].map((title) => (
        <section className="profile-section" key={title}>
          <div className="profile-section-title">
            <span className="profile-loading-title-dot" />
            <h2>{title}</h2>
          </div>
          <div className="profile-rail">
            {Array.from({ length: 4 }).map((_, index) => (
              <div className="profile-title-card profile-title-card-loading" aria-hidden="true" key={index} />
            ))}
          </div>
        </section>
      ))}
    </main>
  );
}

export default function ProfilePage() {
  const session = authClient.useSession();
  const [data, setData] = React.useState<ProfileData | null>(null);
  const [avatarUrl, setAvatarUrl] = React.useState("");
  const [avatarSaving, setAvatarSaving] = React.useState(false);
  const [avatarOpen, setAvatarOpen] = React.useState(false);

  React.useEffect(() => {
    fetch("/api/me", { credentials: "include" })
      .then((response) => response.json())
      .then((result) => {
        setData(result);
        setAvatarUrl(result?.profile?.avatar_url || "");
      })
      .catch(() => setData({ user: null }));
  }, [session.data?.user?.id]);

  const signOut = async () => {
    await authClient.signOut();
    toast.success("Signed out");
    window.location.href = "/";
  };

  const addPasskey = async () => {
    const result = await authClient.passkey.addPasskey({ name: "JokaFlix passkey", authenticatorAttachment: "platform" });
    if (result.error) {
      toast.error(result.error.message);
      return;
    }
    toast.success("Passkey added");
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
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result?.error || "Unable to save profile image");
      setData((current) => current ? { ...current, profile: { ...(current.profile || {}), avatar_url: avatarUrl.trim() || null } } : current);
      window.dispatchEvent(new Event("jokaflix:profile-updated"));
      toast.success("Profile image updated");
      setAvatarOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save profile image");
    } finally {
      setAvatarSaving(false);
    }
  };

  if (session.isPending || !data) {
    return <ProfileSkeleton />;
  }

  if (!session.data?.user) {
    return (
      <main className="profile-page">
        <section className="profile-empty">
          <User />
          <h1>Sign in to see your profile</h1>
          <p>Your ratings, watch later list, and progress will appear here.</p>
          <Button asChild>
            <Link href="/signin?next=/profile">Sign in</Link>
          </Button>
        </section>
      </main>
    );
  }

  const user = session.data.user as { username?: string | null; name?: string | null; email?: string | null };
  const displayName = user.username || user.name || "JokaFlix user";
  const initials = displayName.trim().slice(0, 1).toUpperCase() || "J";
  const continueWatching = data.continueWatching || [];
  const watchLater = data.watchLater || [];
  const ratings = data.ratings || [];

  return (
    <main className="profile-page">
      <section className="profile-hero reveal-up">
        <div className="profile-identity">
          <button type="button" className="profile-avatar" onClick={() => setAvatarOpen(true)} aria-label="Change profile image">
            {data.profile?.avatar_url ? <img src={data.profile.avatar_url} alt="" /> : <span>{initials}</span>}
          </button>
          <div>
            <p className="section-kicker">Profile</p>
            <h1>{displayName}</h1>
            <p>{user.email}</p>
          </div>
        </div>
        <div className="profile-side-actions">
          <div className="profile-actions">
            <Button onClick={addPasskey} className="profile-action-button">
              <KeyRound /> Add passkey
            </Button>
            <Button onClick={signOut} variant="ghost" className="profile-action-button">
              <LogOut /> Sign out
            </Button>
          </div>
        </div>
      </section>

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
            <Button variant="ghost" onClick={() => setAvatarUrl("")}>Remove image</Button>
            <Button className="auth-primary-button" onClick={saveAvatar} disabled={avatarSaving}>
              <Save />
              Save image
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <section className="profile-section">
        <div className="profile-section-title">
          <Clock />
          <h2>Continue Watching</h2>
        </div>
        <div className="profile-rail">
          {continueWatching.length ? continueWatching.map((item) => (
            <Link href={titleHref(item)} className="profile-title-card" key={`${item.media_type}-${item.tmdb_id}-${item.season || 0}-${item.episode || 0}`}>
              {posterUrl(item.backdrop_path || item.poster_path) && <img src={posterUrl(item.backdrop_path || item.poster_path)} alt="" />}
              <span>{item.title || `${item.media_type === "tv" ? "Series" : "Movie"} ${item.tmdb_id}`}</span>
              <small>{item.season ? `S${item.season} E${item.episode || 1}` : "Movie"}</small>
            </Link>
          )) : <EmptyProfileRail message="No movies yet" />}
        </div>
      </section>

      <section className="profile-section">
        <div className="profile-section-title">
          <Bookmark />
          <h2>Watch Later</h2>
        </div>
        <div className="profile-rail">
          {watchLater.length ? watchLater.map((item) => (
            <Link href={titleHref(item)} className="profile-title-card" key={`${item.media_type}-${item.tmdb_id}`}>
              {posterUrl(item.backdrop_path || item.poster_path) && <img src={posterUrl(item.backdrop_path || item.poster_path)} alt="" />}
              <span>{item.title}</span>
              <small>{item.media_type === "tv" ? "Series" : "Movie"}</small>
            </Link>
          )) : <EmptyProfileRail message="No saved movies yet" />}
        </div>
      </section>

      <section className="profile-section">
        <div className="profile-section-title">
          <Star />
          <h2>Your Ratings</h2>
        </div>
        <div className="profile-rail">
          {ratings.length ? ratings.map((item) => (
            <Link href={titleHref(item)} className="profile-title-card" key={`${item.media_type}-${item.tmdb_id}`}>
              {posterUrl(item.backdrop_path || item.poster_path) && <img src={posterUrl(item.backdrop_path || item.poster_path)} alt="" />}
              <span>{item.title || item.tmdb_id}</span>
              <small>{Number(item.rating).toFixed(1)} / 10</small>
            </Link>
          )) : <EmptyProfileRail message="No ratings yet" />}
        </div>
      </section>
    </main>
  );
}
