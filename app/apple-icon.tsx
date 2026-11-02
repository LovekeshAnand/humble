import { ImageResponse } from "next/og";

// Home screen icon for iPhone and iPad: the same card stack mark as icon.svg, as a PNG.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#000000" }}>
        <svg width="180" height="180" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
          <rect x="15" y="14" width="30" height="38" rx="7" fill="#313131" transform="rotate(-12 30 33)" />
          <rect x="19" y="12" width="30" height="38" rx="7" fill="#b5f23d" transform="rotate(8 34 31)" />
          <path d="M30 22h10v19l-5-3.6-5 3.6z" fill="#000000" transform="rotate(8 34 31)" />
        </svg>
      </div>
    ),
    size,
  );
}
