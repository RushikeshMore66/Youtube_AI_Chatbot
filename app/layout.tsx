import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { SITE_NAME, SITE_URL } from "@/lib/site";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

const description = "Paste a YouTube link and get a summary, study notes, a LinkedIn/blog post and a chat with the video.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${SITE_NAME} — YouTube videos to notes, posts and chat`, template: `%s · ${SITE_NAME}` },
  description,
  openGraph: { title: SITE_NAME, description, siteName: SITE_NAME, type: "website" },
  twitter: { card: "summary_large_image", title: SITE_NAME, description },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#7c3aed",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={geistSans.variable}>
      <body className="min-h-dvh font-sans antialiased">{children}</body>
    </html>
  );
}
