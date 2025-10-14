import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { v2 as cloudinary } from "cloudinary";

// config
const SITE = "https://www.matchmadepics.com";
const FOLDERS = (process.env.PAIRS_FOLDERS || "home,anime,cartoons,cute,lgbtq")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const OUT_PUBLIC = path.join(process.cwd(), "public");
const OUT_DATA_DIR = path.join(OUT_PUBLIC, "data");
const OUT_PAIR_DIR = path.join(OUT_PUBLIC, "pair");
const INDEX_HTML_PATH = path.join(process.cwd(), "index.html");
const BASE_CANVAS_ID = "canvas";

// cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// helpers
function pathForPair(folder, slug) {
  const seg = folder === "home" ? "" : `/${folder}`;
  return `/pair${seg}/${slug}`;
}

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}
function slugify(s = "") {
  return String(s)
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
function toTitleCase(s) {
  return String(s || "")
    .replace(/[-_]/g, " ")
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
function asOverlayId(publicId) {
  return String(publicId)
    .replace(/\.(png|jpe?g|webp|avif|gif)$/i, "")
    .replace(/\//g, ":");
}
function viewUrl(cloud, publicId, w = 900, fmt = "jpg") {
  return `https://res.cloudinary.com/${cloud}/image/upload/w_${w},c_fit,f_${fmt}/${publicId}`;
}
function buildOgPairUrl(cloud, leftPublicId, rightPublicId, baseId = BASE_CANVAS_ID) {
  const l = asOverlayId(leftPublicId);
  const r = asOverlayId(rightPublicId);
  return `https://res.cloudinary.com/${cloud}/image/upload/` +
    `w_1200,h_630,c_fill,b_black/` +
    `l_${l},w_600,h_630,c_fit,g_center,x_-320/` +
    `l_${r},w_600,h_630,c_fit,g_center,x_320/` +
    `${baseId}`;
}

// add near your helpers
function categoryHtml({ site, folder }) {
  const title = `${folder === "home" ? "Home" : folder.charAt(0).toUpperCase() + folder.slice(1)} Matching PFP Pairs | MatchMade`;
  const canonical = folder === "home" ? `${site}/` : `${site}/${folder}`;
  const desc = `Browse ${folder} matching profile picture pairs. Download both sides in one click.`;

  return `<!doctype html>
  <html lang="en">
  <head>
    <meta charset="utf-8"/>
    <meta name="viewport" content="width=device-width,initial-scale=1"/>
    <title>${title}</title>
    <meta name="description" content="${desc}"/>
    <link rel="canonical" href="${canonical}"/>
    <link rel="preconnect" href="https://res.cloudinary.com" crossorigin>
    <link rel="stylesheet" href="/backgroundApp.css">
    <meta property="og:type" content="website"/>
    <meta property="og:title" content="${title}"/>
    <meta property="og:description" content="${desc}"/>
    <meta property="og:url" content="${canonical}"/>

    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Dosis&family=Nunito&display=swap" rel="stylesheet">
  </head>
  <body class="App App-header">
    <main>
      <h1 class="title">MatchMade</h1>
      <p class="sub-title">${desc}</p>
      <p><a href="/">← Back to home</a></p>
      <!-- The SPA will still hydrate when loaded via / (fallback). This page exists so /${folder} returns 200 for crawlers. -->
    </main>
  </body>
  </html>`;
}
// emit a real HTML file for each category so /<category> returns 200
for (const folder of FOLDERS) {
  if (folder === "home") continue;
  const outDir = path.join(OUT_PUBLIC, folder);
  ensureDir(outDir);
  fs.writeFileSync(path.join(outDir, "index.html"), categoryHtml({ site: SITE, folder }), "utf8");
}

function pairHtml({ site, folder, slug, title, desc, ogImage, leftUrl, rightUrl }) {
  const canonical = `${site}${pathForPair(folder, slug)}`;
  const safeTitle = escapeHtml(title);
  const safeDesc  = escapeHtml(desc);
  const backHref  = folder === "home" ? "/" : `/${folder}`;
  const backLabel = folder === "home" ? "Home" : escapeHtml(folder);
  return `<!doctype html>
  <html lang="en">
  <head>
    <meta charset="utf-8"/>
    <meta name="viewport" content="width=device-width,initial-scale=1"/>
    <title>${safeTitle} | MatchMade</title>
    <meta name="description" content="${safeDesc}"/>
    <link rel="canonical" href="${canonical}"/>
    <link rel="preconnect" href="https://res.cloudinary.com" crossorigin>
    <link rel="stylesheet" href="/backgroundApp.css">

    <meta property="og:type" content="website"/>
    <meta property="og:site_name" content="MatchMade"/>
    <meta property="og:title" content="${safeTitle} | MatchMade"/>
    <meta property="og:description" content="${safeDesc}"/>
    <meta property="og:url" content="${canonical}"/>
    <meta property="og:image" content="${ogImage}"/>
    <meta property="og:image:width" content="1200"/>
    <meta property="og:image:height" content="630"/>
    <meta name="twitter:card" content="summary_large_image"/>
    <meta name="twitter:image" content="${ogImage}"/>

    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Dosis&family=Nunito&display=swap" rel="stylesheet">
  </head>
  <body class="App App-header">
    <main>
      <h1>${safeTitle}</h1>
      <figure>
        <img src="${leftUrl}" alt="${safeTitle} — Left" width="900" height="900" style="max-width:48%;height:auto"/>
        <img src="${rightUrl}" alt="${safeTitle} — Right" width="900" height="900" style="max-width:48%;height:auto"/>
      </figure>
      <p><a href="${backHref}">← Back to ${backLabel}</a></p>
    </main>
  </body>
  </html>`;
}

// cloudinary listing and pairing
async function listAllInFolder(folder) {
  const resources = [];
  let next = null;
  do {
    const res = await cloudinary.search
      .expression(`folder:${folder}/* AND resource_type:image`)
      .sort_by("public_id", "asc")
      .max_results(500)
      .next_cursor(next || undefined)
      .execute();
    resources.push(...(res.resources || []));
    next = res.next_cursor;
  } while (next);
  return resources;
}
function toPairs(resources) {
  const unmatched = [];
  const partial = new Map();
  const map = new Map();

  for (const r of resources) {
    const parts = r.public_id.split("/");
    const filename = parts.pop();
    const dir = parts.join("/");

    const m = filename.match(/^(.*?)[-_](left|right)$/i);
    if (!m) {
      unmatched.push(r.public_id);
      continue;
    }
    const base = m[1];
    const side = m[2].toLowerCase();
    const key = `${dir}/${base}`;

    if (!map.has(key)) map.set(key, { dir, base, left: null, right: null });
    map.get(key)[side] = r.public_id;

    const p = partial.get(key) || {};
    p[side] = r.public_id;
    partial.set(key, p);
  }

  const complete = [...map.values()]
    .filter((p) => p.left && p.right)
    .sort((a, b) => (a.base < b.base ? -1 : a.base > b.base ? 1 : 0))
    .map((p) => {
      const title = `${toTitleCase(p.base)} Pair`;
      return {
        title,
        base: p.base,
        imageSet: [
          { publicId: p.left, alt: `${title} — Left` },
          { publicId: p.right, alt: `${title} — Right` },
        ],
      };
    });

  const incomplete = [...partial.entries()]
    .filter(([, sides]) => !(sides.left && sides.right))
    .map(([key, sides]) => ({ key, left: !!sides.left, right: !!sides.right }));

  return { complete, unmatched, incomplete };
}

// sitemap and robots
function buildSitemapAndRobots() {
  const nowIso = new Date().toISOString();
  const urls = [];

  urls.push({ loc: `${SITE}/`, changefreq: "weekly", priority: "1.0", lastmod: nowIso });

  for (const folder of FOLDERS) {
    if (folder === "home") continue;
    urls.push({ loc: `${SITE}/${folder}`, changefreq: "weekly", priority: "0.9", lastmod: nowIso });
  }

  for (const folder of FOLDERS) {
    const p = path.join(OUT_DATA_DIR, `pairs-${folder}.json`);
    if (!fs.existsSync(p)) continue;
    const json = JSON.parse(fs.readFileSync(p, "utf8"));
    for (const item of json.items || []) {
      const slug = slugify(item.title || "");
      if (!slug) continue;
      urls.push({
        loc: `${SITE}${pathForPair(folder, slug)}`,
        changefreq: "monthly",
        priority: "0.8",
        lastmod: nowIso,
        images: (item.imageSet || []).map((img, idx) => {
          const loc = img.publicId
            ? viewUrl(process.env.CLOUDINARY_CLOUD_NAME, img.publicId, 1024, "jpg")
            : img.url;

          const side = idx === 0 ? "Left" : "Right";
          const folderLabel = folder === "home" ? "" : ` (${toTitleCase(folder)})`;

          return {
            loc,
            title: `${item.title} — ${side}`,
            caption: `${item.title} matching profile picture pair${folderLabel}`
          };
        })
      });
    }
  }
    const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" ` +
    `xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n` +
    urls.map(u => {
      const imagesXml = (u.images || [])
       .map(im => `    <image:image>`
       + `<image:loc>${im.loc}</image:loc>`
       + (im.title ? `<image:title>${escapeHtml(im.title)}</image:title>` : "")
       + (im.caption ? `<image:caption>${escapeHtml(im.caption)}</image:caption>` : "")
       + `</image:image>`)
        .join("\n");
      return [
        "  <url>",
        `    <loc>${u.loc}</loc>`,
        u.lastmod ? `    <lastmod>${u.lastmod}</lastmod>` : "",
        u.changefreq ? `    <changefreq>${u.changefreq}</changefreq>` : "",
        u.priority ? `    <priority>${u.priority}</priority>` : "",
        imagesXml,
        "  </url>"
      ].filter(Boolean).join("\n");
    }).join("\n") +
    `\n</urlset>\n`;

  const sitemapPath = path.join(OUT_PUBLIC, "sitemap.xml");
  fs.writeFileSync(sitemapPath, xml, "utf8");
  console.log(`   Wrote sitemap → ${path.relative(process.cwd(), sitemapPath)}`);

  const robotsPath = path.join(OUT_PUBLIC, "robots.txt");
  if (!fs.existsSync(robotsPath)) {
    fs.writeFileSync(
      robotsPath,
      `User-agent: *\nAllow: /\nSitemap: ${SITE}/sitemap.xml\n`,
      "utf8"
    );
    console.log(`   Wrote robots → ${path.relative(process.cwd(), robotsPath)}`);
  }
}

// inject home OG from first home pair
function injectHomeOgFromFirstPair() {
  try {
    const homeJsonPath = path.join(OUT_DATA_DIR, "pairs-home.json");
    let ogUrl = null;

    if (fs.existsSync(homeJsonPath)) {
      const home = JSON.parse(fs.readFileSync(homeJsonPath, "utf8"));
      const first = (home.items || [])[0];
      if (first?.imageSet?.length >= 2) {
        const left = first.imageSet[0].publicId;
        const right = first.imageSet[1].publicId;
        ogUrl = buildOgPairUrl(process.env.CLOUDINARY_CLOUD_NAME, left, right, BASE_CANVAS_ID);
      }
    }

    if (!ogUrl) {
      ogUrl = `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/w_1200,h_630,c_fill,b_black/${BASE_CANVAS_ID}`;
    }

    if (fs.existsSync(INDEX_HTML_PATH)) {
      let indexHtml = fs.readFileSync(INDEX_HTML_PATH, "utf8");
      indexHtml = indexHtml.replace(/%OG_PAIR_URL%/g, ogUrl);
      fs.writeFileSync(INDEX_HTML_PATH, indexHtml, "utf8");
      console.log(`   Injected OG image → ${ogUrl}`);
    }
  } catch (e) {
    console.warn("   Skipped OG injection:", e.message);
  }
}

// main
async function run() {
  const { CLOUDINARY_CLOUD_NAME: cloud } = process.env;
  if (!cloud || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    throw new Error("Missing Cloudinary env vars (CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET).");
  }

  ensureDir(OUT_DATA_DIR);
  ensureDir(OUT_PAIR_DIR);

  for (const folder of FOLDERS) {
    console.log(`→ Building pairs for folder: ${folder}`);
    const resources = await listAllInFolder(folder);
    const { complete, unmatched, incomplete } = toPairs(resources);

    const jsonOut = {
      folder,
      generatedAt: new Date().toISOString(),
      totalPairs: complete.length,
      items: complete,
    };
    const jsonPath = path.join(OUT_DATA_DIR, `pairs-${folder}.json`);
    fs.writeFileSync(jsonPath, JSON.stringify(jsonOut, null, 2), "utf8");
    console.log(`   Wrote ${complete.length} pairs → ${path.relative(process.cwd(), jsonPath)}`);

    for (const item of complete) {
      const slug = slugify(item.title);
      const leftId = item.imageSet[0].publicId;
      const rightId = item.imageSet[1].publicId;

      const ogImage = buildOgPairUrl(cloud, leftId, rightId, BASE_CANVAS_ID);
      const leftUrl = viewUrl(cloud, leftId, 900);
      const rightUrl = viewUrl(cloud, rightId, 900);
      const desc = `Download the ${item.title} matching profile picture pair. Left and Right images included.`;

      const html = pairHtml({
        site: SITE,
        folder,
        slug,
        title: item.title,
        desc,
        ogImage,
        leftUrl,
        rightUrl,
      });

      const relPairDir = folder === "home" ? path.join("pair", slug) : path.join("pair", folder, slug);
      const pairDir = path.join(OUT_PUBLIC, relPairDir);
      ensureDir(pairDir);
      fs.writeFileSync(path.join(pairDir, "index.html"), html, "utf8");
    }

    console.log(`   Found assets: ${resources.length}`);
    console.log(`   Complete pairs: ${complete.length}`);
    if (incomplete.length) {
      console.log("   Incomplete bases (missing a side):");
      incomplete.slice(0, 10).forEach((row) =>
        console.log(`     - ${row.key} (left:${row.left ? "ok" : "x"}, right:${row.right ? "ok" : "x"})`)
      );
      if (incomplete.length > 10) console.log(`     ...and ${incomplete.length - 10} more`);
    }
    if (unmatched.length) {
      console.log("   Unmatched filenames (no -left/-right):");
      unmatched.slice(0, 10).forEach((id) => console.log(`     - ${id}`));
      if (unmatched.length > 10) console.log(`     ...and ${unmatched.length - 10} more`);
    }
  }

  const categoriesPath = path.join(OUT_DATA_DIR, "categories.json");
  fs.writeFileSync(categoriesPath, JSON.stringify({ categories: FOLDERS }, null, 2), "utf8");
  console.log(`   Wrote categories → ${path.relative(process.cwd(), categoriesPath)}`);

  buildSitemapAndRobots();
  injectHomeOgFromFirstPair();

  console.log("✓ Done.");
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
