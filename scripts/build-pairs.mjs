// Build static JSON files with image pairs for each folder
// so GitHub Pages can serve them without a server.

import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { v2 as cloudinary } from 'cloudinary';

// === CONFIG ===
const FOLDERS = (process.env.PAIRS_FOLDERS || 'home,anime,cartoons,cute,lgbtq')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

const OUT_DIR = path.join(process.cwd(), 'public', 'data');

// === Cloudinary Auth ===
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// === Helpers ===
async function listAllInFolder(folder) {
  const resources = [];
  let next = null;
  do {
    const res = await cloudinary.search
      .expression(`folder:${folder}/* AND resource_type:image`)
      .sort_by('public_id', 'asc')
      .max_results(500)
      .next_cursor(next || undefined)
      .execute();

    resources.push(...(res.resources || []));
    next = res.next_cursor;
  } while (next);
  return resources;
}

// Cloudinary overlay-friendly IDs
function asOverlayId(publicId) {
  return String(publicId)
    .replace(/\.(png|jpe?g|webp|avif|gif)$/i, "")
    .replace(/\//g, ":");
}

// Build OpenGraph card (side-by-side 1200x630)
function buildOgPairUrl(cloudName, leftPublicId, rightPublicId, baseId = "canvas") {
  const l = asOverlayId(leftPublicId);
  const r = asOverlayId(rightPublicId);

  return `https://res.cloudinary.com/${cloudName}/image/upload/` +
         `w_1200,h_630,c_fill,b_black/` +
         `l_${l},w_600,h_630,c_fit,g_center,x_-320/` +
         `l_${r},w_600,h_630,c_fit,g_center,x_320/` +
         `${baseId}`;
}

// Title case helper
const toTitle = (s) =>
  String(s)
    .replace(/[-_]+/g, " ")
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, c => c.toUpperCase());

// Build pairs
function toPairs(resources) {
  const unmatched = [];
  const partial = new Map();
  const map = new Map();

  for (const r of resources) {
    const parts = r.public_id.split('/');
    const filename = parts.pop();
    const dir = parts.join('/');

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
    .filter(p => p.left && p.right)
    .sort((a, b) => a.base.localeCompare(b.base))
    .map(p => {
      const title = `${toTitle(p.base)} Pair`;
      return {
        title,
        imageSet: [
          { publicId: p.left,  alt: `${title} — Left` },
          { publicId: p.right, alt: `${title} — Right` },
        ],
      };
    });

  const incomplete = [...partial.entries()]
    .filter(([, sides]) => !(sides.left && sides.right))
    .map(([key, sides]) => ({ key, left: !!sides.left, right: !!sides.right }));

  return { complete, unmatched, incomplete };
}

// === Main Runner ===
async function run() {
  if (!process.env.CLOUDINARY_CLOUD_NAME ||
      !process.env.CLOUDINARY_API_KEY ||
      !process.env.CLOUDINARY_API_SECRET) {
    throw new Error('Missing Cloudinary env vars.');
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });

  for (const folder of FOLDERS) {
    console.log(`→ Building pairs for folder: ${folder}`);

    const resources = await listAllInFolder(folder);
    const { complete, unmatched, incomplete } = toPairs(resources);

    const out = {
      folder,
      generatedAt: new Date().toISOString(),
      totalPairs: complete.length,
      items: complete,
    };
    const outPath = path.join(OUT_DIR, `pairs-${folder}.json`);
    fs.writeFileSync(outPath, JSON.stringify(out, null, 2), 'utf8');

    console.log(`   Found assets: ${resources.length}`);
    console.log(`   Complete pairs: ${complete.length}`);
    if (incomplete.length) console.log(`   Incomplete: ${incomplete.length}`);
    if (unmatched.length) console.log(`   Unmatched: ${unmatched.length}`);
    console.log(`   Wrote → ${path.relative(process.cwd(), outPath)}`);
  }

  // Categories.json
  const categoriesOut = path.join(OUT_DIR, 'categories.json');
  fs.writeFileSync(
    categoriesOut,
    JSON.stringify({ categories: FOLDERS }, null, 2),
    'utf8'
  );

  // OG image injection
  try {
    const cloud = process.env.CLOUDINARY_CLOUD_NAME;
    const homePath = path.join(OUT_DIR, "pairs-home.json");
    const indexPath = path.join(process.cwd(), "index.html");

    let ogUrl = null;
    if (fs.existsSync(homePath)) {
      const home = JSON.parse(fs.readFileSync(homePath, "utf8"));
      const first = (home.items || [])[0];
      if (first?.imageSet?.length >= 2) {
        ogUrl = buildOgPairUrl(cloud, first.imageSet[0].publicId, first.imageSet[1].publicId);
      }
    }
    if (!ogUrl) {
      ogUrl = `https://res.cloudinary.com/${cloud}/image/upload/w_1200,h_630,c_fill,b_black/canvas`;
    }

    let indexHtml = fs.readFileSync(indexPath, "utf8");
    indexHtml = indexHtml.replace(/%OG_PAIR_URL%/g, ogUrl);
    fs.writeFileSync(indexPath, indexHtml, "utf8");

    console.log(`   Injected OG image → ${ogUrl}`);
  } catch (e) {
    console.warn("   Skipped OG injection (non-fatal):", e.message);
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
