import type { MetadataRoute } from "next";
import { SITE_URL, alternatives, toolPath, tools, updatedAt } from "@/lib/data";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: SITE_URL, lastModified: updatedAt, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/alternatives`, lastModified: updatedAt, changeFrequency: "daily", priority: 0.8 },
    ...alternatives.map((a) => ({ url: `${SITE_URL}/alternatives/${a.slug}`, lastModified: updatedAt, priority: 0.7 })),
    ...tools.map((t) => ({ url: `${SITE_URL}${toolPath(t)}`, lastModified: t.lastMentioned, priority: 0.6 })),
  ];
}
