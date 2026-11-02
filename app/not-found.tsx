import Link from "next/link";

export default function NotFound() {
  return (
    <main className="shell flex flex-col items-center pt-16 text-center">
      <p className="font-mono text-sm text-fg-subtle">404</p>
      <h1 className="text-hero mt-4 max-w-[680px] text-4xl font-semibold tracking-tight sm:text-5xl">
        This page swiped left
      </h1>
      <p className="mt-6 max-w-[680px] text-lg text-fg-muted">
        The tool or page you were looking for is not here. It may have been renamed or removed from the directory.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/swipe" className="btn btn-primary">Back to swiping</Link>
        <Link href="/search" className="btn btn-secondary">Search tools</Link>
      </div>
    </main>
  );
}
