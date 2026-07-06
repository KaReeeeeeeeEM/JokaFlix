import type { Metadata, Viewport } from "next";
import "../index.css";
import { Providers } from "./providers";
import AppChrome from "./app-chrome";
import { JsonLd } from "../components/seo/JsonLd";
import { createMetadata, siteConfig, siteJsonLd } from "../lib/seo";

export const metadata: Metadata = {
  ...createMetadata(),
  manifest: "/manifest.json",
  applicationName: siteConfig.name,
  authors: [{ name: siteConfig.name, url: siteConfig.url }],
  creator: siteConfig.name,
  publisher: siteConfig.name,
  category: "Entertainment",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: siteConfig.name,
  },
  icons: {
    icon: [
      { url: "/favicon.png", sizes: "500x500", type: "image/png" },
      { url: "/logo-sub.png", sizes: "500x500", type: "image/png" },
    ],
    apple: [{ url: "/logo-sub.png", sizes: "500x500", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  themeColor: siteConfig.themeColor,
  colorScheme: "dark light",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <JsonLd data={siteJsonLd()} />
        <Providers>
          <AppChrome>{children}</AppChrome>
        </Providers>
      </body>
    </html>
  );
}
