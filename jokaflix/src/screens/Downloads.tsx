"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { ArrowLeft, Copy, Download, HardDrive, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { useFetch } from "../api";

type DownloadOption = {
  quality: string;
  label: string;
  size: string;
  note: string;
};

const options: DownloadOption[] = [
  {
    quality: "1080p",
    label: "Full HD",
    size: "2.4 GB",
    note: "Best for TVs and laptops",
  },
  {
    quality: "720p",
    label: "HD",
    size: "1.2 GB",
    note: "Balanced quality and size",
  },
  {
    quality: "480p",
    label: "Mobile",
    size: "650 MB",
    note: "Smaller file for phones",
  },
];

export default function DownloadsPage() {
  const params = useParams<{ mediaType: string; id: string }>();
  const mediaType = params?.mediaType ?? "movie";
  const id = params?.id ?? "";
  const searchParams = useSearchParams();
  const season = searchParams?.get("season");
  const isSeries = mediaType === "tv" || mediaType === "series";
  const apiType = isSeries ? "tv" : "movie";
  const titleKey = isSeries ? "name" : "title";
  const dateKey = isSeries ? "first_air_date" : "release_date";
  const downloadBase = process.env.NEXT_PUBLIC_DOWNLOAD_BASE_URL as string | undefined;

  const { data, loading } = useFetch<any>(
    {
      url: `https://api.themoviedb.org/3/${apiType}/${id}?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}`,
    },
    { enabled: !!id }
  );

  const title = data?.[titleKey] || "Download";
  const year = data?.[dateKey]?.slice(0, 4);
  const backdrop = data?.backdrop_path || data?.poster_path;
  const backdropUrl = backdrop ? `https://image.tmdb.org/t/p/original${backdrop}` : "";

  const buildDownloadUrl = (quality: string) => {
    if (!downloadBase || !id) return "";
    const normalizedBase = downloadBase.replace(/\/$/, "");
    const params = new URLSearchParams({ quality });
    if (season) params.set("season", season);
    return `${normalizedBase}/${apiType}/${id}?${params.toString()}`;
  };

  const copyPageLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
    toast.success("Download page link copied");
  };

  return (
    <main className="download-page">
      {backdropUrl && <img src={backdropUrl} alt="" className="download-backdrop" />}
      <div className="download-overlay" />

      <section className="download-shell reveal-up">
        <div className="download-topbar">
          <Link href={isSeries ? `/series/${id}` : `/movie/${id}`} className="download-top-action">
            <ArrowLeft className="h-5 w-5" />
            Details
          </Link>
          <button type="button" onClick={copyPageLink} className="download-top-action">
            <Copy className="h-5 w-5" />
            Copy link
          </button>
        </div>

        <div className="download-hero">
          <p className="section-kicker">Downloads</p>
          <h1>{loading ? "Loading title" : title}</h1>
          <p>
            {year ? `${year} · ` : ""}
            {isSeries ? `Series${season ? ` · Season ${season}` : ""}` : "Movie"} download options.
          </p>
        </div>

        <div className="download-options">
          {options.map((option) => {
            const href = buildDownloadUrl(option.quality);
            const enabled = Boolean(href);
            return (
              <article className={enabled ? "download-option-card" : "download-option-card is-disabled"} key={option.quality}>
                <div>
                  <span className="download-quality">{option.quality}</span>
                  <h2>{option.label}</h2>
                  <p>{option.note}</p>
                </div>
                <div className="download-meta">
                  <span>
                    <HardDrive className="h-4 w-4" />
                    {option.size}
                  </span>
                  {enabled ? (
                    <a href={href} className="download-option-button">
                      <Download className="h-4 w-4" />
                      Download
                    </a>
                  ) : (
                    <button
                      type="button"
                      className="download-option-button"
                      onClick={() => toast.message("Download source pending", { description: "Connect a verified download backend first." })}
                    >
                      Source pending
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}
