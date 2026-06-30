"use client";

import * as React from "react";
import Link from "next/link";
import { Bookmark, Clock, KeyRound, LogOut, Star, User } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { authClient } from "../lib/auth-client";

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
    <>
      {Array.from({ length: 4 }).map((_, index) => (
        <div className="profile-title-card profile-title-card-empty" aria-hidden="true" key={index}>
          <span className="profile-empty-card-art" />
          <span className="profile-empty-card-line" />
          <small className="profile-empty-card-line is-short" />
        </div>
      ))}
      <p className="profile-muted profile-rail-empty-copy">{message}</p>
    </>
  );
}

export default function ProfilePage() {
  const session = authClient.useSession();
  const [data, setData] = React.useState<ProfileData | null>(null);

  React.useEffect(() => {
    fetch("/api/me", { credentials: "include" })
      .then((response) => response.json())
      .then(setData)
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

  if (session.isPending || !data) {
    return (
      <main className="profile-page">
        <div className="netflix-loader" />
      </main>
    );
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
  const continueWatching = data.continueWatching || [];
  const watchLater = data.watchLater || [];
  const ratings = data.ratings || [];

  return (
    <main className="profile-page">
      <section className="profile-hero reveal-up">
        <div>
          <p className="section-kicker">Profile</p>
          <h1>{user.username || user.name || "JokaFlix user"}</h1>
          <p>{user.email}</p>
        </div>
        <div className="profile-actions">
          <Button onClick={addPasskey} className="profile-action-button">
            <KeyRound /> Add passkey
          </Button>
          <Button onClick={signOut} variant="ghost" className="profile-action-button">
            <LogOut /> Sign out
          </Button>
        </div>
      </section>

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
          )) : <EmptyProfileRail message="Start watching something and it will appear here." />}
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
          )) : <EmptyProfileRail message="Save movies or shows from a title page." />}
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
          )) : <EmptyProfileRail message="Rate a title to tune recommendations." />}
        </div>
      </section>
    </main>
  );
}
