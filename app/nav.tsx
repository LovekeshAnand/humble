"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Show, SignInButton, UserButton } from "@clerk/nextjs";
import { GithubLogoIcon } from "@phosphor-icons/react";
import { REPO_URL } from "@/lib/format";
import { useSaved } from "@/lib/saved";

const LINKS = [
  { href: "/swipe", label: "Swipe" },
  { href: "/search", label: "Search" },
  { href: "/categories", label: "Categories" },
  { href: "/alternatives", label: "Alternatives" },
];

const isCurrent = (path: string, href: string) => (href === "/" ? path === "/" : path.startsWith(href));

// Floating pill nav; on phones a full height menu with links arriving in reading order.
export default function Nav() {
  const path = usePathname();
  const n = useSaved().liked.length;
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const saved = (
    <Link
      href="/saved"
      data-tour="saved"
      aria-current={isCurrent(path, "/saved") ? "page" : undefined}
      className="inline-flex items-center gap-2 rounded-full bg-save px-3 py-1 text-sm font-semibold text-save-ink transition-transform duration-300 ease-(--ease-soft) hover:-translate-y-px"
    >
      Saved
      <span className="rounded-full bg-black/15 px-2 font-mono text-xs leading-5">{n}</span>
    </Link>
  );

  return (
    <>
      <header data-tour-root className="fixed inset-x-0 top-3 z-300 flex justify-center px-4">
        <nav
          aria-label="Main"
          className="flex w-full max-w-3xl items-center justify-between gap-4 rounded-full border border-line-strong bg-surface/75 py-2 pr-2 pl-5 backdrop-blur-xl"
        >
          <Link href="/" className="text-base font-semibold tracking-tight" onClick={() => setOpen(false)}>
            humble
          </Link>
          <ul className="hidden items-center gap-1 md:flex">
            {LINKS.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  aria-current={isCurrent(path, l.href) ? "page" : undefined}
                  className="rounded-full px-3 py-1 text-sm font-medium text-fg-muted transition-colors duration-300 ease-(--ease-soft) hover:text-fg aria-[current=page]:bg-raised aria-[current=page]:text-fg"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="flex items-center gap-2">
            {/* Optional account: keeps saves on every device. */}
            <Show when="signed-out">
              <SignInButton mode="modal">
                <button type="button" className="hidden rounded-full px-3 py-1 text-sm font-medium text-fg-muted transition-colors duration-300 ease-(--ease-soft) hover:text-fg sm:inline-flex">
                  Sign in
                </button>
              </SignInButton>
            </Show>
            <Show when="signed-in">
              <span className="hidden sm:inline-flex"><UserButton /></span>
            </Show>
            <a
              href={REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="humble on GitHub (opens in a new tab)"
              className="grid size-9 place-items-center rounded-full text-fg-muted transition-colors duration-300 ease-(--ease-soft) hover:bg-raised hover:text-fg"
            >
              <GithubLogoIcon size={20} aria-hidden="true" />
            </a>
            {saved}
            <button
              type="button"
              className="relative grid size-10 place-items-center rounded-full md:hidden"
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? "Close menu" : "Open menu"}
              onClick={() => setOpen(!open)}
            >
              <span className={`absolute h-0.5 w-5 rounded-full bg-fg transition-transform duration-500 ease-(--ease-soft) ${open ? "rotate-45" : "-translate-y-1"}`} />
              <span className={`absolute h-0.5 w-5 rounded-full bg-fg transition-transform duration-500 ease-(--ease-soft) ${open ? "-rotate-45" : "translate-y-1"}`} />
            </button>
          </div>
        </nav>
      </header>

      <div
        id="mobile-menu"
        hidden={!open}
        className="fixed inset-0 z-250 bg-page/95 px-6 pt-24 backdrop-blur-2xl md:hidden"
      >
        <ul className="flex flex-col gap-2">
          {LINKS.map((l, i) => (
            <li key={l.href} className="menu-item" style={{ animationDelay: `${Math.min(i * 60, 340)}ms` }}>
              <Link
                href={l.href}
                onClick={() => setOpen(false)}
                aria-current={isCurrent(path, l.href) ? "page" : undefined}
                className="block py-2 text-3xl font-semibold text-fg-muted aria-[current=page]:text-fg"
              >
                {l.label}
              </Link>
            </li>
          ))}
          <li className="menu-item" style={{ animationDelay: "240ms" }}>
            <a href={REPO_URL} target="_blank" rel="noopener noreferrer" onClick={() => setOpen(false)} className="flex items-center gap-3 py-2 text-3xl font-semibold text-fg-muted">
              <GithubLogoIcon size={28} aria-hidden="true" /> GitHub<span className="visually-hidden"> (opens in a new tab)</span>
            </a>
          </li>
          <li className="menu-item mt-6" style={{ animationDelay: "300ms" }}>
            <Show when="signed-out">
              <SignInButton mode="modal">
                <button type="button" className="btn btn-secondary w-full" onClick={() => setOpen(false)}>Sign in to sync your saves</button>
              </SignInButton>
            </Show>
            <Show when="signed-in">
              <div className="flex items-center gap-3 text-fg-muted"><UserButton /> Your saves sync to your account</div>
            </Show>
          </li>
        </ul>
      </div>
    </>
  );
}
