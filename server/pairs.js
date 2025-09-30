// server/pairs.js
import express from "express";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const router = express.Router();

/**
 * GET /api/pairs?folder=home&page=1&perPage=6
 * Returns paginated LEFT/RIGHT pairs from a Cloudinary folder.
 * Pairing rule: files named <base>-left and <base>-right (any extension).
 */
router.get("/", async (req, res) => {
  try {
    const folder   = (req.query.folder || "home").replace(/^\/+/, "");
    const page     = Math.max(parseInt(req.query.page || "1", 10), 1);
    const perPage  = Math.max(parseInt(req.query.perPage || "6", 10), 1);

    // 1) Fetch up to 500 images from folder (sort by public_id for deterministic pairing)
    // NOTE: if you expect >500 assets per folder, we can extend this with next_cursor.
    const result = await cloudinary.search
      .expression(`folder:${folder}/* AND resource_type:image`)
      .sort_by("public_id", "asc")
      .max_results(500)
      .execute();

    // 2) Build a map baseName -> { left?: resource, right?: resource }
    // baseName strips a single "-left" or "-right" suffix from the filename (not folder).
    const pairsMap = new Map();

    for (const r of result.resources) {
      // r.public_id includes folder, e.g., "home/anime-girl-hold-left"
      const parts = r.public_id.split("/");
      const fname = parts.pop();            // "anime-girl-hold-left"
      const dir   = parts.join("/");        // "home"
      const base  = fname
        .replace(/-left$/i, "")
        .replace(/-right$/i, "");

      const side  = /-left$/i.test(fname)  ? "left"
                  : /-right$/i.test(fname) ? "right"
                  : null;

      if (!side) continue; // skip files that don't follow the naming convention

      const key = `${dir}/${base}`;
      if (!pairsMap.has(key)) pairsMap.set(key, { dir, base, left: null, right: null });
      pairsMap.get(key)[side] = r;
    }

    // 3) Keep only complete pairs (both sides present), sort by key
    const completePairs = [...pairsMap.values()]
      .filter(p => p.left && p.right)
      .sort((a, b) => (a.base < b.base ? -1 : a.base > b.base ? 1 : 0));

    const totalPairs = completePairs.length;
    const totalPages = Math.max(1, Math.ceil(totalPairs / perPage));
    const safePage   = Math.min(page, totalPages);
    const start      = (safePage - 1) * perPage;
    const pageSlice  = completePairs.slice(start, start + perPage);

    // 4) Shape for the client
    const items = pageSlice.map(p => ({
      title: p.base.replace(/[-_]+/g, " ").trim(),  // human-ish title
      imageSet: [
        { publicId: p.left.public_id,  alt: `${p.base} left`  },
        { publicId: p.right.public_id, alt: `${p.base} right` },
      ],
    }));

    // Cache gently (optional)
    res.set("Cache-Control", "public, max-age=60"); // 1 min
    res.json({ items, page: safePage, perPage, totalPairs, totalPages, folder });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to list pairs" });
  }
});

export default router;
