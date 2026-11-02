import { tools, toLean } from "@/lib/data";
import Directory from "./directory";

export default function Home() {
  return (
    <main className="shell pt-12 sm:pt-16">
      <h1 className="text-3xl sm:text-[2.5rem]">Software Hacker News keeps recommending</h1>
      <p className="lead mt-3 text-ink-2">
        Describe your problem. Get the open source tools commenters vouch for.
      </p>
      <Directory tools={tools.map(toLean)} />
    </main>
  );
}
