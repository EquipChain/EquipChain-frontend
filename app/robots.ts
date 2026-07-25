import type { MetadataRoute } from "next"

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"
const isProduction = process.env.NODE_ENV === "production"

export default function robots(): MetadataRoute.Robots {
  if (isProduction) {
    return {
      rules: [
        {
          userAgent: "*",
          allow: "/",
          disallow: ["/admin/", "/api/"],
        },
      ],
      sitemap: `${baseUrl}/sitemap.xml`,
    }
  }

  return {
    rules: {
      userAgent: "*",
      disallow: "/",
    },
  }
}
