import type { Metadata, Viewport } from "next";
import "../index.css";
import { Providers } from "./providers";
import AppChrome from "./app-chrome";

export const metadata: Metadata = {
  title: "JokaFlix",
  description: "Browse movies and series on JokaFlix.",
  manifest: "/manifest.json",
  applicationName: "JokaFlix",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "JokaFlix",
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
  themeColor: "#e50914",
  colorScheme: "dark light",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>
          <AppChrome>{children}</AppChrome>
        </Providers>
      </body>
    </html>
  );
}
