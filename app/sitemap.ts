import type { MetadataRoute } from "next";
import { NAV_ITEMS } from "@/src/lib/navigation";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

// ============================================================================
// Sitemap — generated from the navigation registry
// ============================================================================
// The sitemap previously listed routes by hand with arbitrary priorities.
// Deriving the entries from NAV_ITEMS guarantees every section a user can
// navigate to is also discoverable by crawlers, and adding a nav item
// automatically extends the sitemap.

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
  ];

  const sectionPriorities: Record<string, number> = {
    "/dashboard": 0.9,
    "/meters": 0.8,
    "/billing": 0.7,
    "/streams": 0.6,
  };

  const sections: MetadataRoute.Sitemap = NAV_ITEMS.map(({ href }) => ({
    url: `${baseUrl}${href}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: sectionPriorities[href] ?? 0.5,
  }));

  return [...staticPages, ...sections];
}
