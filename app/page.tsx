import data from "@/data/directory.json";
import Directory, { type Tool } from "./directory";

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10">
      <h1 className="text-3xl font-bold tracking-tight">hackfree</h1>
      <p className="mt-2 max-w-2xl opacity-70">
        Free, open source software that real people recommend on Hacker News: in comments, in Ask HN threads and on the front page. Describe your problem and get the tools people vouch for. Collected
        automatically and licence-checked against GitHub.
      </p>
      <p className="mt-1 text-xs opacity-50">Last updated {new Date(data.updatedAt).toUTCString()}</p>
      <div className="mt-6">
        <Directory tools={data.tools as Tool[]} />
      </div>
    </main>
  );
}
