// Build static JSON files with image pairs for each folder,
// so GitHub Pages can serve them without a server.

import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { v2 as cloudinary } from 'cloudinary';

// CONFIG: which Cloudinary folders to export (match your categories)
const FOLDERS = (process.env.PAIRS_FOLDERS || 'home,anime,cartoons,cute,lgbtq')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

// Output directory inside /public (so Vite serves it statically)
const OUT_DIR = path.join(process.cwd(), 'public', 'data');

// Cloudinary credentials must come from env (CI/local)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

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

/**
 * Pair files using "<base>-left" / "<base>-right"  OR  "<base>_left" / "<base>_right" (case-insensitive)
 * Returns:
 *  - complete: [{ title, imageSet:[{publicId,alt},{publicId,alt}] }, ...]
 *  - unmatched: [public_id,...]  (filenames that didn't match the pattern)
 *  - incomplete: [{ key, left:boolean, right:boolean }, ...] (bases missing one side)
 */
const toTitle = (s) =>
  String(s)
    .replace(/[-_]+/g, " ")   // kebab/snake → spaces
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, c => c.toUpperCase()); // title case

function toPairs(resources) {
  const unmatched = [];
  const partial = new Map();          // key -> {left?, right?}
  const map = new Map();              // key -> {dir, base, left, right}

  for (const r of resources) {
    const parts = r.public_id.split('/');
    const filename = parts.pop();     // e.g. "anime-girl-hold-left"
    const dir = parts.join('/');      // e.g. "home"

    const m = filename.match(/^(.*?)[-_](left|right)$/i);
    if (!m) {
      unmatched.push(r.public_id);
      continue;
    }
    const base = m[1];
    const side = m[2].toLowerCase();  // "left" | "right"

    const key = `${dir}/${base}`;
    if (!map.has(key)) map.set(key, { dir, base, left: null, right: null });
    map.get(key)[side] = r.public_id;

    const p = partial.get(key) || {};
    p[side] = r.public_id;
    partial.set(key, p);
  }

  const complete = [...map.values()]
  .filter(p => p.left && p.right)
  .sort((a, b) => (a.base < b.base ? -1 : a.base > b.base ? 1 : 0))
  .map(p => {
    const title = `${toTitle(p.base)} Pair`;
    return {
      title,
      imageSet: [
        { publicId: p.left,  alt: `${title} — Left`  },
        { publicId: p.right, alt: `${title} — Right` },
      ],
    };
  });


  const incomplete = [...partial.entries()]
    .filter(([, sides]) => !(sides.left && sides.right))
    .map(([key, sides]) => ({ key, left: !!sides.left, right: !!sides.right }));

  return { complete, unmatched, incomplete };
}

async function run() {
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    throw new Error('Missing Cloudinary env vars (CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET).');
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
      items: complete,                 // flat array; client paginates
    };
    const outPath = path.join(OUT_DIR, `pairs-${folder}.json`);
    fs.writeFileSync(outPath, JSON.stringify(out, null, 2), 'utf8');

    console.log(`   Found assets: ${resources.length}`);
    console.log(`   Complete pairs: ${complete.length}`);
    if (incomplete.length) {
      console.log('   Incomplete bases (missing a side):');
      incomplete.slice(0, 10).forEach(row =>
        console.log(`     - ${row.key} (left:${row.left ? '✓' : '✗'}, right:${row.right ? '✓' : '✗'})`)
      );
      if (incomplete.length > 10) console.log(`     ...and ${incomplete.length - 10} more`);
    }
    if (unmatched.length) {
      console.log('   Unmatched filenames (no -left/-right):');
      unmatched.slice(0, 10).forEach(id => console.log(`     - ${id}`));
      if (unmatched.length > 10) console.log(`     ...and ${unmatched.length - 10} more`);
    }
    console.log(`   Wrote ${complete.length} pairs → ${path.relative(process.cwd(), outPath)}`);
  }

  const categoriesOut = path.join(OUT_DIR, 'categories.json');
  fs.writeFileSync(
    categoriesOut,
    JSON.stringify({ categories: FOLDERS }, null, 2),
    'utf8'
  );
  console.log(`   Wrote categories → ${path.relative(process.cwd(), categoriesOut)}`);

  console.log('✓ Done.');
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
