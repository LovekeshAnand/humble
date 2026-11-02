import type { Metadata } from "next";
import Link from "next/link";
import { Familjen_Grotesk, IBM_Plex_Sans, JetBrains_Mono } from "next/font/google";
import { REPO_URL, SITE_URL, fmtDate, updatedAt } from "@/lib/data";
import "./globals.css";

const familjen = Familjen_Grotesk({ variable: "--font-familjen", subsets: ["latin"], weight: ["500", "600"] });
const plex = IBM_Plex_Sans({ variable: "--font-plex", subsets: ["latin"], weight: ["400", "500"] });
const jetbrains = JetBrains_Mono({ variable: "--font-jetbrains", subsets: ["latin"], weight: ["400"] });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "hackfree: open source tools Hacker News recommends", template: "%s | hackfree" },
  description:
    "Describe your problem and find the free, open source tools Hacker News commenters keep recommending, with their own words and links to every comment.",
  alternates: { types: { "application/rss+xml": "/feed.xml" } },
  openGraph: { siteName: "hackfree", type: "website" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${familjen.variable} ${plex.variable} ${jetbrains.variable}`}>
      <body className="flex min-h-dvh flex-col">
        <header className="border-b border-rule">
          <nav className="shell flex min-h-14 items-center justify-between gap-4" aria-label="Main">
            <Link href="/" className="font-display text-lg font-semibold tracking-tight">
              hackfree
            </Link>
            <div className="flex items-center gap-5 text-sm">
              <Link href="/alternatives" className="link">Alternatives</Link>
              <a href="/feed.xml" className="link">RSS</a>
            </div>
          </nav>
        </header>
        <div className="flex-1">{children}</div>
        <footer className="mt-24 border-t border-rule">
          <div className="shell grid gap-2 py-8 text-sm text-muted sm:grid-cols-[1fr_auto]">
            <p>
              Built from public Hacker News comments through the HN Algolia API. Licences and stars from GitHub.
              Updated {fmtDate(updatedAt)}.
            </p>
            <a href={REPO_URL} className="link">Source on GitHub</a>
          </div>
        </footer>
      </body>
    </html>
  );
}
