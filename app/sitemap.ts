import type { MetadataRoute } from "next";
import { CATEGORIES } from "@/lib/categories";
import { SITE_URL, alternatives, toolPath, tools, updatedAt } from "@/lib/data";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: SITE_URL, lastModified: updatedAt, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/swipe`, lastModified: updatedAt, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/search`, lastModified: updatedAt, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/categories`, lastModified: updatedAt, changeFrequency: "daily", priority: 0.8 },
    { url: `${SITE_URL}/alternatives`, lastModified: updatedAt, changeFrequency: "daily", priority: 0.8 },
    ...CATEGORIES.map((c) => ({ url: `${SITE_URL}/categories/${c.slug}`, lastModified: updatedAt, priority: 0.8 })),
    ...alternatives.map((a) => ({ url: `${SITE_URL}/alternatives/${a.slug}`, lastModified: updatedAt, priority: 0.7 })),
    ...tools.map((t) => ({ url: `${SITE_URL}${toolPath(t)}`, lastModified: t.lastMentioned, priority: 0.6 })),
  ];
}
