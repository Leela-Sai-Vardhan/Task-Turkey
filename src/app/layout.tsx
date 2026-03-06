import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const siteUrl = "https://task-turkey.vercel.app"; // update if you add a custom domain

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Task Turkey — Turn Your Free AI Tools Into Real Earnings",
    template: "%s | Task Turkey",
  },
  description:
    "Earn tokens by generating AI videos for real YouTube channels. No subscriptions, no upfront cost — just your creativity and free AI tools.",
  keywords: ["AI video", "earn money online", "task rewards", "AI tools", "YouTube creators", "tokens"],
  openGraph: {
    type: "website",
    url: siteUrl,
    title: "Task Turkey — Turn Your Free AI Tools Into Real Earnings",
    description:
      "Generate AI videos for real YouTube channels and earn tokens. Free to join, zero investment required.",
    siteName: "Task Turkey",
  },
  twitter: {
    card: "summary_large_image",
    title: "Task Turkey — Earn by Creating AI Videos",
    description:
      "Generate AI videos for real YouTube channels and earn tokens. Free to join.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans antialiased">
        {children}
        <Toaster
          position="bottom-right"
          theme="dark"
          toastOptions={{
            style: {
              background: "rgba(18, 18, 36, 0.95)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "#fff",
              backdropFilter: "blur(12px)",
            },
          }}
        />
        <Analytics />
      </body>
    </html>
  );
}
