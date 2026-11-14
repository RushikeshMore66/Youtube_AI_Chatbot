import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return ["", "/pricing", "/privacy", "/terms", "/refund"].map((p) => ({ url: `${SITE_URL}${p}` }));
}
