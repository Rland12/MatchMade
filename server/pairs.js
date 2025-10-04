// server/pairs.js
import express from "express";
import { v2 as cloudinary } from "cloudinary";

// --- Cloudinary auth from env ---
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const router = express.Router();

// Helpers
const toTitle = (s) =>
  String(s)
    .replace(/[-_]+/g, " ")
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());

/** Fetch *all* images in a folder (follows next_cursor if >500). */
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

/**
 * GET /api/pairs?folder=home&page=1&perPage=6
 * Returns paginated LEFT/RIGHT pairs from a Cloudinary folder.
 * Pairing rule: filenames end with `<base>-left|_left` and `<base>-right|_right` (case-insensitive).
 */
router.get("/", async (req, res) => {
  try {
    const rawFolder = String(req.query.folder || "home");
    const folder = rawFolder.replace(/^\/+/, ""); // strip leading slashes

    const page = Math.max(1, parseInt(String(req.query.page || "1"), 10) || 1);
    const perPage = Math.min(
      48, // hard cap so nobody asks for a thousand
      Math.max(1, parseInt(String(req.query.perPage || "6"), 10) || 6)
    );

    // 1) Fetch all images (sorted) for deterministic pairing
    const resources = await listAllInFolder(folder);

    // 2) Build pairs: key = "<dir>/<base>"
    // Accept endings: -left/_left and -right/_right
    const rx = /^(.*?)[-_](left|right)$/i;
    const pairsMap = new Map(); // key -> { dir, base, left, right }

    for (const r of resources) {
      const parts = r.public_id.split("/");
      const fname = parts.pop() || "";
      const dir = parts.join("/");

      const m = fname.match(rx);
      if (!m) continue;

      const base = m[1];
      const side = m[2].toLowerCase(); // "left" | "right"

      const key = `${dir}/${base}`;
      if (!pairsMap.has(key)) pairsMap.set(key, { dir, base, left: null, right: null });
      pairsMap.get(key)[side] = r;
    }

    // 3) Keep only complete pairs and sort by base
    const completePairs = [...pairsMap.values()]
      .filter((p) => p.left && p.right)
      .sort((a, b) => a.base.localeCompare(b.base));

    const totalPairs = completePairs.length;
    const totalPages = Math.max(1, Math.ceil(totalPairs / perPage));
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * perPage;
    const pageSlice = completePairs.slice(start, start + perPage);

    // 4) Shape for client
    const items = pageSlice.map((p) => {
      const title = `${toTitle(p.base)} Pair`;
      return {
        title,
        imageSet: [
          { publicId: p.left.public_id,  alt: `${title} — Left`  },
          { publicId: p.right.public_id, alt: `${title} — Right` },
        ],
      };
    });

    // Cache lightly (1 minute); adjust as needed
    res.set("Cache-Control", "public, max-age=60");
    res.json({ items, page: safePage, perPage, totalPairs, totalPages, folder });
  } catch (err) {
    console.error("[/api/pairs] Error:", err?.message || err);
    res.status(500).json({ error: "Failed to list pairs" });
  }
});

export default router;
