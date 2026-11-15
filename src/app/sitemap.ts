import type { MetadataRoute } from "next";
import { siteUrl } from "@/server/site-url";

export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: siteUrl(), changeFrequency: "monthly", priority: 1 }];
}
