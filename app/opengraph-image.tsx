import { ImageResponse } from "next/og";
import { tools } from "@/lib/data";

// Link preview for the whole site (tool and alternative pages inherit it).
export const alt = "humble: open source tools people actually recommend";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Site colours as hex; images cannot read CSS variables.
const PAPER = "#000000";
const INK = "#ffffff";
const MUTED = "#9b9b9b";
const ACCENT = "#b5f23d";
const RULE = "#313131";

export default function Image() {
  const top = [...tools].sort((a, b) => b.mentionCount - a.mentionCount).slice(0, 3);
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: PAPER, padding: 72, color: INK }}>
        <div style={{ display: "flex", fontSize: 32, fontWeight: 700 }}>humble</div>
        <div style={{ display: "flex", marginTop: 56, fontSize: 76, fontWeight: 700, lineHeight: 1.05, letterSpacing: -2, maxWidth: 900 }}>
          Find open source tools people actually use
        </div>
        <div style={{ display: "flex", marginTop: 28, fontSize: 32, color: MUTED }}>
          {`${tools.length} open source tools, ranked by how many people vouch for them.`}
        </div>
        <div style={{ display: "flex", marginTop: "auto", borderTop: `2px solid ${RULE}`, paddingTop: 28, gap: 48, fontSize: 28 }}>
          <span style={{ color: MUTED }}>Most recommended</span>
          {top.map((t) => (
            <div key={t.fullName} style={{ display: "flex", gap: 12 }}>
              <span style={{ color: ACCENT, fontWeight: 700 }}>{t.mentionCount}</span>
              <span>{t.name}</span>
            </div>
          ))}
        </div>
      </div>
    ),
    size,
  );
}
