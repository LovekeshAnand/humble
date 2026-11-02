import type { Metadata } from "next";
import { CONTACT } from "@/lib/data";

export const metadata: Metadata = {
  title: "Privacy",
  description: "What humble stores about you: your saves and skips, in your own browser, and nothing else.",
  alternates: { canonical: "/privacy" },
};

const POINTS = [
  { q: "No accounts, no tracking", a: "humble has no sign in, no analytics and no advertising. There is no server that receives anything about you." },
  { q: "Your saves stay in your browser", a: "Tools you save or skip, and the interests you pick, are stored in your browser's local storage. Clearing your site data removes them." },
  { q: "Share links contain only tool names", a: "When you copy a share link, it lists the GitHub names of your saved tools. Anyone with the link can see that list." },
  { q: "Avatars load from GitHub", a: "Project avatars are loaded from GitHub's avatar service, so GitHub sees a normal image request from your browser." },
  { q: "Public comments, public links", a: "Quotes come from public posts on Hacker News, Stack Exchange, Lobsters, Lemmy and Fosstodon, always shown with a link back to the original." },
];

export default function PrivacyPage() {
  return (
    <main className="shell max-w-3xl pt-8 sm:pt-12">
      <h1 className="text-hero text-4xl font-semibold tracking-tight sm:text-5xl">Privacy</h1>
      <p className="mt-6 text-lg text-fg-muted">The short version: humble knows nothing about you.</p>
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
