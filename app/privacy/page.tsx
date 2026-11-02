import type { Metadata } from "next";
import { CONTACT } from "@/lib/data";

export const metadata: Metadata = {
  title: "Privacy",
  description: "What humble stores about you: optional account, saved tools, and the two analytics tools it uses.",
  alternates: { canonical: "/privacy" },
};

const POINTS = [
  { q: "Accounts are optional", a: "You can use everything without signing in. If you do sign in, Clerk handles the account (email or social login) and humble stores one thing: the list of tools you saved, in a Neon Postgres database, so it follows you between devices. Signing out removes the list from that browser. To delete your account and saved list, email the address below." },
  { q: "No advertising", a: "humble shows no ads and sells no data." },
  { q: "Analytics", a: "humble uses Google Analytics to count visits and Microsoft Clarity to see how pages are used, including anonymised session recordings and heatmaps. Both set cookies. Clarity masks text you type. You can block them with any content blocker and the site keeps working." },
  { q: "Your saves stay in your browser", a: "Tools you save or skip, and the interests you pick, are stored in your browser's local storage. Clearing your site data removes them." },
  { q: "Share links contain only tool names", a: "When you copy a share link, it lists the GitHub names of your saved tools. Anyone with the link can see that list." },
  { q: "Avatars load from GitHub", a: "Project avatars are loaded from GitHub's avatar service, so GitHub sees a normal image request from your browser." },
  { q: "Public comments, public links", a: "Quotes come from public posts on Hacker News, Stack Exchange, Lobsters, Lemmy and Fosstodon, always shown with a link back to the original." },
];

export default function PrivacyPage() {
  return (
    <main className="shell max-w-3xl pt-8 sm:pt-12">
      <h1 className="text-hero text-4xl font-semibold tracking-tight sm:text-5xl">Privacy</h1>
      <p className="mt-6 text-lg text-fg-muted">The short version: no account needed, your saves stay in your browser unless you sign in, and two analytics tools count how the site is used.</p>
      <dl className="mt-12 grid gap-4">
        {POINTS.map((p) => (
          <div key={p.q} className="rounded-3xl border border-line bg-surface p-6">
            <dt className="font-semibold">{p.q}</dt>
            <dd className="mt-2 text-fg-muted">{p.a}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-12 text-fg-muted">
        Questions? Write to <a href={`mailto:${CONTACT.email}`} className="link hover:text-fg">{CONTACT.email}</a>.
      </p>
    </main>
  );
}
