"use client";
import { useEffect, useRef, useState } from "react";

// Big statement whose words light up in reading order as they cross 65% of the viewport.
export default function TaglineReveal({ lines }: { lines: string[] }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const [lit, setLit] = useState(0);
  const words = lines.flatMap((l, li) => l.split(" ").map((w, wi) => ({ w, br: li > 0 && wi === 0 })));

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const spans = [...el.querySelectorAll<HTMLSpanElement>("[data-word]")];
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setLit(spans.length);
      return;
    }
    let frame = 0;
    const update = () => {
      frame = 0;
      const line = window.innerHeight * 0.65;
      setLit((prev) => Math.max(prev, spans.filter((s) => s.getBoundingClientRect().top < line).length)); // once lit, stays lit
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { window.removeEventListener("scroll", onScroll); cancelAnimationFrame(frame); };
  }, []);

  return (
    <p ref={ref} className="mx-auto max-w-[680px] text-4xl font-semibold tracking-tight sm:text-5xl">
      {words.map(({ w, br }, i) => (
        <span key={i}>
          {br && <br />}
          <span data-word className="transition-colors duration-500 ease-(--ease-soft)" style={{ color: i < lit ? "var(--color-fg)" : "rgb(255 255 255 / 0.3)" }}>
            {w}
          </span>{" "}
        </span>
      ))}
    </p>
  );
}
