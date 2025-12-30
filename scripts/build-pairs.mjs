import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { v2 as cloudinary } from "cloudinary";


// config
const SITE = "https://www.matchmadepics.com";

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

const PARENT = "categories";

// Per-category subtitles used in static HTML stubs / meta descriptions
const CATEGORY_SUBTITLES = {
  home:
    "Find matching profile pics for friends, couples and besties. Browse anime, cartoons, cute, games, movies and LGBTQ matching pfps and download both sides in one click.",
  anime:
    "Soft, cute and cool anime matching profile pics for friends, couples and besties. Pick an anime matching profile picture pair and save both sides for Discord, Instagram or TikTok.",
  cartoons:
    "Cartoon matching profile pics inspired by your favorite shows and characters. Choose a cartoon matching profile picture pair for you and your friend or special someone.",
  cute:
    "Adorable, cozy and pastel matching profile pics with soft vibes. Browse cute matching profile picture pairs for you and your favorite person and download both sides together.",
  games:
    "Game and gamer-themed matching profile pics. Find matching profile picture pairs for Discord, and more, and grab both sides in one tap.",
  lgbtq:
    "Pride-friendly LGBTQ matching profile pics for friends and partners. Discover matching profile picture pairs that reflect your identity and download both images easily.",
  movies:
    "Movie and TV inspired matching profile pics for film lovers and besties. Choose a matching profile picture pair from your favorite characters and save both sides.",
};

function getCategorySubtitle(folder) {
  const key = (folder || "home").toLowerCase();
  if (CATEGORY_SUBTITLES[key]) return CATEGORY_SUBTITLES[key];

  const label = key === "home" ? "Home" : toTitleCase(key);
  return `Browse ${label.toLowerCase()} matching profile pics (matching profile picture pairs). Download both sides in one click.`;
}

// Helpers
// ---- Dynamic folder discovery under /categories ----
async function listSubfoldersPaginated(parent = PARENT) {
  const all = [];
  let next;
  while (true) {
    const res = await cloudinary.api.sub_folders(parent, { next_cursor: next });
    if (Array.isArray(res.folders)) all.push(...res.folders.map(f => f.name));
    if (!res.next_cursor) break;
    next = res.next_cursor;
  }
  return all;
}

/**
 * Final category list priority:
 * 1) If PAIRS_FOLDERS is set, use it (explicit control).
 * 2) Else, auto-discover subfolders under /categories.
 * 3) Optional allow/deny filters via PAIRS_ALLOW / PAIRS_DENY.
 * 4) Fallback default if Admin API fails.
 * Keeps 'home' first even if home isn't under /categories.
 */
async function getCategoryFolders() {
  const parseCsv = (s = "") =>
    String(s).split(",").map(x => x.trim()).filter(Boolean);

  const envList = parseCsv(process.env.PAIRS_FOLDERS || "");
  if (envList.length) return envList;

  try {
    let list = await listSubfoldersPaginated(PARENT); // e.g. ["anime","cartoons","cute","lgbtq"]

    // optional allow/deny
    const allow = new Set(parseCsv(process.env.PAIRS_ALLOW || ""));
    const deny = new Set(parseCsv(process.env.PAIRS_DENY || ""));
    if (allow.size) list = list.filter(n => allow.has(n));
    if (deny.size) list = list.filter(n => !deny.has(n));

    // ensure 'home' is present and first (your site uses it)
    if (!list.includes("home")) list = ["home", ...list];

    list.sort((a, b) => {
      if (a === "home" && b !== "home") return -1;
      if (b === "home" && a !== "home") return 1;
      return a.localeCompare(b);
    });

    return list.length ? list : ["home", "anime", "cartoons", "cute", "lgbtq"];
  } catch (err) {
    console.warn("Cloudinary Admin API failed; using fallback:", err?.message);
    return ["home", "anime", "cartoons", "cute", "lgbtq"];
  }
}

let FOLDERS = [];

function pathForPair(folder, slug) {
  const seg = folder === "home" ? "" : `/${folder}`;
  return `/pair${seg}/${slug}/`;
}

function makeAltText(title, side, folder) {
  const theme = folder && folder !== "home" ? `${toTitleCase(folder)} ` : "";
  const sideLabel = side === "left" ? "left side" : "right side";
  return `${theme}matching profile picture pair titled “${title}”, ${sideLabel}`;
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
function stripTrailingPair(title = "") {
  return String(title).replace(/\s*Pair$/i, "").trim();
}
function asOverlayId(publicId) {
  return String(publicId)
    .replace(/\.(png|jpe?g|webp|avif|gif)$/i, "")
    .replace(/\//g, ":");
}
function viewUrl(cloud, publicId, w = 900) {
  return `https://res.cloudinary.com/${cloud}/image/upload/f_auto,q_auto,w_${w},c_fit/${publicId}`;
}

function buildOgPairUrl(cloud, leftPublicId, rightPublicId, baseId = BASE_CANVAS_ID) {
  const l = asOverlayId(leftPublicId);
  const r = asOverlayId(rightPublicId);
  return `https://res.cloudinary.com/${cloud}/image/upload/` +
    `f_auto,q_auto,w_1200,h_630,c_fill,b_black/` +
    `l_${l},w_600,h_630,c_fit,g_center,x_-320/` +
    `l_${r},w_600,h_630,c_fit,g_center,x_320/` +
    `${baseId}`;
}


function rawImageUrl(cloud, publicId) {
  return `https://res.cloudinary.com/${cloud}/image/upload/${publicId}`;
}

function jsonLdBreadcrumb({ site, parts }) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: parts.map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: p.name,
      item: `${site}${p.path}`
    }))
  };
}

function jsonLdPairPage({ site, cloud, folder, slug, title, leftPublicId, rightPublicId }) {
  const url = `${site}${pathForPair(folder, slug)}`;
  const mk = (pubId, side) => ({
    "@type": "ImageObject",
    name: `${title} — ${side}`,
    caption: `${title} matching profile picture pair${folder === "home" ? "" : ` (${toTitleCase(folder)})`}`,
    url,
    contentUrl: rawImageUrl(cloud, pubId),
    thumbnailUrl: viewUrl(cloud, pubId, 512)
  });
  return [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: title,
      url,
      hasPart: [mk(leftPublicId, "Left"), mk(rightPublicId, "Right")]
    },
    jsonLdBreadcrumb({
      site,
      parts: [
        { name: "Home", path: "/" },
        ...(folder !== "home" ? [{ name: toTitleCase(folder), path: `/${folder}` }] : []),
        { name: title, path: pathForPair(folder, slug) }
      ]
    })
  ];
}

function jsonLdCategoryPage({ site, folder, items }) {
  const url = folder === "home" ? `${site}/` : `${site}/${folder}/`;
  return [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: `${folder === "home" ? "Home" : toTitleCase(folder)} Matching PFP Pairs`,
      url,
      mainEntity: {
        "@type": "ItemList",
        itemListElement: (items || []).slice(0, 50).map((it, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: it.title,
          url: `${site}${pathForPair(folder, slugify(it.title))}`
        }))
      }
    },
    jsonLdBreadcrumb({
      site,
      parts: [
        { name: "Home", path: "/" },
        ...(folder !== "home" ? [{ name: toTitleCase(folder), path: `/${folder}` }] : [])
      ]
    })
  ];
}
function safeMaxIso(a, b) {
  const t1 = a ? Date.parse(a) : 0;
  const t2 = b ? Date.parse(b) : 0;
  const max = Math.max(t1, t2);
  return max ? new Date(max).toISOString() : undefined;
}

//keep near helpers
function categoryHtml({ site, folder, items, generatedAt }) {
  const label = folder === "home" ? "Home" : toTitleCase(folder);
  const isHome = folder === "home";

  const title = isHome
    ? "Matching Profile Pics – Anime, Cartoons, Cute, Games, Movies & LGBTQ | MatchMade"
    : `${label} Matching Profile Pics | MatchMade`;

  const canonical = isHome ? `${site}/` : `${site}/${folder}/`;
  const desc = getCategorySubtitle(folder);
  const og = `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/f_auto,q_auto,w_1200,h_630,c_fill,b_black/${BASE_CANVAS_ID}`;

  const [pageLd, crumbsLd] = jsonLdCategoryPage({ site, folder, items });
  if (generatedAt) pageLd.dateModified = generatedAt;
  const jsonLd = JSON.stringify([pageLd, crumbsLd], null, 0);

  const h1Text = isHome ? "MatchMade | Home" : `MatchMade | ${label}`;

  return `<!doctype html>
  <html lang="en">
  <head>
    <meta charset="utf-8"/>
    <meta name="viewport" content="width=device-width,initial-scale=1"/>
    <title>${title}</title>
    <meta name="description" content="${escapeHtml(desc)}"/>
    <meta name="robots" content="index, follow, max-image-preview:large">
    <link rel="canonical" href="${canonical}"/>
    <link rel="preconnect" href="https://res.cloudinary.com" crossorigin>
    <link rel="stylesheet" href="/backgroundApp.css">

    <meta property="og:type" content="website"/>
    <meta property="og:site_name" content="MatchMade"/>
    <meta property="og:title" content="${escapeHtml(title)}"/>
    <meta property="og:description" content="${escapeHtml(desc)}"/>
    <meta property="og:url" content="${canonical}"/>
    <meta property="og:image" content="${og}"/>
    <meta property="og:image:width" content="1200"/>
    <meta property="og:image:height" content="630"/>

    <script type="application/ld+json">${jsonLd}</script>
  </head>
  <body class="App App-header">
    <main>
      <h1>${escapeHtml(h1Text)}</h1>
      <p class="sub-title">${escapeHtml(desc)}</p>
      <p><a href="/">← Back to home</a></p>
      <!-- Real HTML stub so /${folder} returns 200 for crawlers. SPA handles navigation client-side. -->
    </main>
  </body>
  </html>`;
}



function pairHtml({ site, cloud, folder, slug, title, desc, ogImage, leftId, rightId, leftUrl, rightUrl, leftCreatedAt, rightCreatedAt }) {
  const canonical = `${site}${pathForPair(folder, slug)}`;
  const safeTitle = escapeHtml(title);
  const safeDesc = escapeHtml(desc);
  const backHref = folder === "home" ? "/" : `/${folder}/`;
  const backLabel = folder === "home" ? "Home" : escapeHtml(folder);

  const leftTs = leftCreatedAt ? Date.parse(leftCreatedAt) : 0;
  const rightTs = rightCreatedAt ? Date.parse(rightCreatedAt) : 0;
  const latestTs = Math.max(leftTs, rightTs) || Date.now();
  const earliestTs = Math.min(...[leftTs, rightTs].filter(Boolean)) || latestTs;
  const dateModified = new Date(latestTs).toISOString();
  const datePublished = new Date(earliestTs).toISOString();
  const jsonLd = JSON.stringify(
    {
      ...jsonLdPairPage({ site, cloud, folder, slug, title, leftPublicId: leftId, rightPublicId: rightId })[0],
      datePublished,
      dateModified
    },
    null, 0
  );

  return `<!doctype html>
  <html lang="en">
  <head>
    <meta charset="utf-8"/>
    <meta name="viewport" content="width=device-width,initial-scale=1"/>
    <title>${folder === "home" ? safeTitle : `${safeTitle} | ${toTitleCase(folder)} | MatchMade`}</title>
    <meta name="description" content="${safeDesc}"/>
    <meta name="robots" content="index, follow, max-image-preview:large">
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
    <meta property="og:updated_time" content="${dateModified}"/>
    <meta name="twitter:card" content="summary_large_image"/>
    <meta name="twitter:image" content="${ogImage}"/>

    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Dosis&family=Nunito&display=swap" rel="stylesheet">
    <script type="application/ld+json">${jsonLd}</script>
  </head>
  <body class="App App-header">
    <main>
      <h1>${safeTitle}</h1>
      <figure>
        <img src="${leftUrl}" alt="${escapeHtml(makeAltText(title, "left", folder))}"  width="900" height="900" style="max-width:48%;height:auto"/>
        <img src="${rightUrl}" alt="${escapeHtml(makeAltText(title, "right", folder))}" width="900" height="900" style="max-width:48%;height:auto"/>
      </figure>
      <p><a href="${backHref}">← Back to ${backLabel}</a></p>
    </main>
  </body>
  </html>`;
}

// cloudinary listing and pairing
async function listAllInFolder(folder) {
  const folderPath = `${PARENT}/${folder}`; // e.g. categories/anime
  const all = [];
  let nextCursor;

  do {
    let search = cloudinary.search
      .expression(`folder:${folderPath}/* AND resource_type:image`)
      .sort_by("public_id", "asc")
      .max_results(500)
      .with_field("tags")
      .with_field("context"); // 👈 THIS is the important part

    if (nextCursor) {
      search = search.next_cursor(nextCursor);
    }

    const res = await search.execute();
    all.push(...res.resources);
    nextCursor = res.next_cursor;
  } while (nextCursor);

  return all;
}



function toPairs(resources) {
  const unmatched = [];
  const partial = new Map();
  const map = new Map();

  for (const r of resources) {
    const createdAt = r.created_at || null;

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

    // ---- read artist credit from Cloudinary context ----
    const ctx = r.context || {};
    const custom = ctx.custom || ctx;

    const artistName = custom.artist || null;
    const artistUrl = custom.artist_url || null;

    if (!map.has(key)) {
      map.set(key, {
        dir,
        base,
        left: null,
        right: null,
        leftMeta: null,
        rightMeta: null,
        leftTags: [],
        rightTags: [],
        creditName: null,
        creditUrl: null,
      });
    }

    const entry = map.get(key);

    if (artistName && !entry.creditName) entry.creditName = artistName;
    if (artistUrl && !entry.creditUrl) entry.creditUrl = artistUrl;

    entry[side] = r.public_id;
    entry[`${side}Meta`] = { createdAt };
    entry[`${side}Tags`] = Array.isArray(r.tags) ? r.tags : [];

    const p = partial.get(key) || {};
    p[side] = r.public_id;
    partial.set(key, p);
  }

  const complete = [...map.values()]
    .filter((p) => p.left && p.right)
    .sort((a, b) => (a.base < b.base ? -1 : a.base > b.base ? 1 : 0))
    .map((p) => {
      const title = `${toTitleCase(p.base)} Pair`;
      const folderName = p.dir.split("/")[0];

      const tagSet = new Set([
        ...(p.leftTags || []),
        ...(p.rightTags || []),
      ]);
      const tags = [...tagSet];

      // ---- build the credit object that goes into JSON ----
      const credit = p.creditName
        ? { name: p.creditName, url: p.creditUrl || null }
        : null;

      return {
        title,
        base: p.base,
        tags,
        credit,
        imageSet: [
          {
            publicId: p.left,
            alt: makeAltText(title, "left", folderName),
            createdAt: p.leftMeta?.createdAt || null,
          },
          {
            publicId: p.right,
            alt: makeAltText(title, "right", folderName),
            createdAt: p.rightMeta?.createdAt || null,
          },
        ],
      };
    });

  const incomplete = [...partial.entries()]
    .filter(([, sides]) => !(sides.left && sides.right))
    .map(([key, sides]) => ({
      key,
      left: !!sides.left,
      right: !!sides.right,
    }));

  return { complete, unmatched, incomplete };
}



// sitemap and robots
function buildSitemapAndRobots() {
  const urls = [];
  const folderNewest = new Map(); // folder -> ISO lastmod (newest pair item)
  let newestAll = 0;

  // Pairs + gather newest times
  for (const folder of FOLDERS) {
    const p = path.join(OUT_DATA_DIR, `pairs-${folder}.json`);
    if (!fs.existsSync(p)) continue;
    const json = JSON.parse(fs.readFileSync(p, "utf8"));
    let newestInFolder = 0;

    for (const item of json.items || []) {
      const slug = slugify(item.title || "");
      if (!slug) continue;

      const pairLast = safeMaxIso(item.imageSet?.[0]?.createdAt, item.imageSet?.[1]?.createdAt);
      const pairTs = pairLast ? Date.parse(pairLast) : 0;
      newestInFolder = Math.max(newestInFolder, pairTs);
      newestAll = Math.max(newestAll, pairTs);

      urls.push({
        loc: `${SITE}${pathForPair(folder, slug)}`,
        changefreq: "monthly",
        priority: "0.8",
        lastmod: pairLast,
        images: (item.imageSet || []).map((img, idx) => {
          const loc = img.publicId
            ? viewUrl(process.env.CLOUDINARY_CLOUD_NAME, img.publicId, 1024)
            : img.url;
          const side = idx === 0 ? "Left" : "Right";
          const capFolder = folder === "home" ? "" : ` (${toTitleCase(folder)})`;
          return {
            loc,
            title: `${item.title} — ${side}`,
            caption: `${stripTrailingPair(item.title)} matching profile picture pair${capFolder}`
          };
        })
      });
    }

    // category entry (skip home here; we’ll add home separately)
    if (folder !== "home") {
      folderNewest.set(folder, newestInFolder ? new Date(newestInFolder).toISOString() : undefined);
      urls.push({
        loc: `${SITE}/${folder}/`,
        changefreq: "weekly",
        priority: "0.9",
        lastmod: folderNewest.get(folder),
      });
    }
  }

  // Home entry = newest across all folders
  urls.unshift({
    loc: `${SITE}/`,
    changefreq: "weekly",
    priority: "1.0",
    lastmod: newestAll ? new Date(newestAll).toISOString() : undefined,
  });

  // Build XML (only include <lastmod> if present)
  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n` +
    urls.map(u => {
      const imagesXml = (u.images || [])
        .map(im => `    <image:image>` +
          `<image:loc>${im.loc}</image:loc>` +
          (im.title ? `<image:title>${escapeHtml(im.title)}</image:title>` : "") +
          (im.caption ? `<image:caption>${escapeHtml(im.caption)}</image:caption>` : "") +
          `</image:image>`).join("\n");

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
      ogUrl = `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/f_auto,q_auto,w_1200,h_630,c_fill,b_black/${BASE_CANVAS_ID}`;
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

  // NEW: discover categories now
  FOLDERS = await getCategoryFolders();
  console.log("→ Using categories:", FOLDERS.join(", "));

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
      const leftCreatedAt = item.imageSet[0].createdAt || null;
      const rightCreatedAt = item.imageSet[1].createdAt || null;

      const ogImage = buildOgPairUrl(cloud, leftId, rightId, BASE_CANVAS_ID);
      const leftUrl = viewUrl(cloud, leftId, 900);
      const rightUrl = viewUrl(cloud, rightId, 900);
      const cleanFolder = folder === "home" ? "" : `${toTitleCase(folder)} `;
      const desc = `Browse ${cleanFolder}matching profile pics for friends or special someone. Download both sides in one click.`;

      const html = pairHtml({
        site: SITE,
        cloud,
        folder,
        slug,
        title: item.title,
        desc,
        ogImage,
        leftId,
        rightId,
        leftUrl,
        rightUrl,
        leftCreatedAt,
        rightCreatedAt
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
  // emit a real HTML file for each category so /<category> returns 200
  for (const folder of FOLDERS) {
    if (folder === "home") continue;
    const outDir = path.join(OUT_PUBLIC, folder);
    ensureDir(outDir);
    const fp = path.join(OUT_DATA_DIR, `pairs-${folder}.json`);
    let items = [];
    let lastmod = null;

    if (fs.existsSync(fp)) {
      const data = JSON.parse(fs.readFileSync(fp, "utf8"));
      items = data.items || [];

      // compute newest per folder from item image timestamps
      const newest = items.reduce((acc, it) => {
        const iso = safeMaxIso(it.imageSet?.[0]?.createdAt, it.imageSet?.[1]?.createdAt);
        return Math.max(acc, iso ? Date.parse(iso) : 0);
      }, 0);
      lastmod = newest ? new Date(newest).toISOString() : null;
    }

    fs.writeFileSync(
      path.join(outDir, "index.html"),
      categoryHtml({ site: SITE, folder, items, generatedAt: lastmod }),
      "utf8"
    );
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
