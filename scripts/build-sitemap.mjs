// scripts/build-sitemap.mjs
import fs from "node:fs";
import path from "node:path";

const SITE = "https://www.matchmadepics.com";
const PUBLIC_DIR = path.join(process.cwd(), "public");
const DATA_DIR = path.join(PUBLIC_DIR, "data");
const OUT = path.join(PUBLIC_DIR, "sitemap.xml");

function xmlEscape(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function urlTag(loc, changefreq = "weekly", priority = "0.8") {
  return [
    "  <url>",
    `    <loc>${xmlEscape(loc)}</loc>`,
    `    <changefreq>${changefreq}</changefreq>`,
    `    <priority>${priority}</priority>`,
    "  </url>"
  ].join("\n");
}

(async () => {
  // Default categories in case the file isn't there yet
  let categories = ["anime", "cartoons", "cute", "lgbtq"];

  try {
    const catsPath = path.join(DATA_DIR, "categories.json");
    if (fs.existsSync(catsPath)) {
      const json = JSON.parse(fs.readFileSync(catsPath, "utf8"));
      if (Array.isArray(json.categories) && json.categories.length) {
        categories = json.categories;
      }
    }
  } catch (e) {
    console.warn("[sitemap] Could not load categories.json, using defaults:", e.message);
  }

  const parts = [];
  parts.push('<?xml version="1.0" encoding="UTF-8"?>');
  parts.push('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');

  // Home
  parts.push(urlTag(`${SITE}/`, "daily", "1.0"));

  // Category pages (lowercase in your router)
  for (const cat of categories) {
    parts.push(urlTag(`${SITE}/${String(cat).toLowerCase()}`));
  }

  // If you ever add static pages, append here:
  // parts.push(urlTag(`${SITE}/about`, "monthly", "0.4"));

  parts.push("</urlset>");

  fs.writeFileSync(OUT, parts.join("\n") + "\n", "utf8");
  console.log(`[sitemap] Wrote ${path.relative(process.cwd(), OUT)}`);
})();
