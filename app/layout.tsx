import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import { CONTACT, SITE_URL, SUGGEST_URL, fmtDate, updatedAt } from "@/lib/data";
import ExtLink from "./ext-link";
import Analytics from "./analytics";
import Nav from "./nav";
import "./globals.css";

const geist = Geist({ variable: "--font-geist", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "humble: open source tools people actually use", template: "%s | humble" },
  description:
    "Swipe through free, open source tools recommended on Hacker News, Stack Exchange, Lobsters, Lemmy and Fosstodon. Save the ones you like and keep their links.",
  alternates: { types: { "application/rss+xml": "/feed.xml" } },
  openGraph: { siteName: "humble", type: "website" },
  twitter: { card: "summary_large_image" },
  // Google Search Console: paste the HTML tag token into NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION on Vercel.
  verification: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION ? { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION } : undefined,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geist.variable} ${geistMono.variable}`}>
      <body className="flex min-h-dvh flex-col">
        <a href="#main" className="skip-link">Skip to content</a>
        <Nav />
        <div id="main" tabIndex={-1} className="flex-1 pt-24 outline-none">{children}</div>
        <footer className="mt-24 border-t border-line">
          <div className="shell grid gap-8 py-12 text-sm sm:grid-cols-[minmax(0,1fr)_auto]">
            <div>
              <p className="text-base font-semibold">humble</p>
              <p className="mt-2 max-w-md text-fg-muted">
                Built from public discussions on Hacker News, Stack Exchange, Lobsters, Lemmy and Fosstodon, through
                their official APIs. Licences and stars from GitHub. Updated {fmtDate(updatedAt)}.
              </p>
              <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-fg-muted">
                <li><a href={SUGGEST_URL} className="link hover:text-fg">Suggest a tool</a></li>
                <li><Link href="/privacy" className="link hover:text-fg">Privacy</Link></li>
              </ul>
            </div>
            <div>
              <p className="font-semibold">Made by {CONTACT.name}</p>
              <ul className="mt-2 flex flex-col gap-2 text-fg-muted" aria-label="Contact">
                <li><a href={`mailto:${CONTACT.email}`} className="link hover:text-fg">{CONTACT.email}</a></li>
                <li><ExtLink href={CONTACT.x} className="link hover:text-fg">X</ExtLink></li>
                <li><ExtLink href={CONTACT.linkedin} className="link hover:text-fg">LinkedIn</ExtLink></li>
              </ul>
            </div>
          </div>
        </footer>
        <Analytics />
      </body>
    </html>
  );
}
