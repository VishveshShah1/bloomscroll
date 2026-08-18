import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/**
 * Served at /robots.txt. Points crawlers at the sitemap and keeps them out of
 * the auth-gated and operator-only areas — those either bounce to /signin or
 * 403, so crawling them only wastes budget.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // /welcome and /comeback are the extension's install and uninstall
        // landing tabs — real pages, but destinations only for someone
        // arriving from Chrome, and they'd compete with the real pages.
        disallow: [
          "/dashboard",
          "/admin",
          "/api/",
          "/signin",
          "/success",
          "/canceled",
          "/welcome",
          "/comeback",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
