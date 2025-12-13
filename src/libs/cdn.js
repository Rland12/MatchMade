/**
 * Cloudinary URL builder for images.
 *
 * Goals:
 * - Sensible defaults for perf (f_auto, q_auto, dpr_auto)
 * - Safe gravity handling (only with crop modes that support it)
 * - No duplicate format directives (avoid f_auto + f_webp together)
 * - Small helpers for downloads and srcset
 *
 * Usage:
 *   cldUrl("anime-girl-hold-left", { w: 560, h: 560, fit: "fill", g: "auto" })
 *   cldUrl("anime-girl-hold-left", { w: 900, fit: "fit" }) // modal
 */

export function cldUrl(publicId, opts = {}) {
  const cloud = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  if (!cloud) throw new Error("Missing VITE_CLOUDINARY_CLOUD_NAME");
  if (!publicId) throw new Error("cldUrl: publicId is required");

  const {
    // Sizing & cropping
    w,
    h,
    fit = "fill",     // c_fill by default (good thumbs)
    g,                // gravity (only when supported)
    ar,               // optional aspect ratio (e.g., "1:1" or "16:9")
    bg,               // background color for pad modes, e.g. "auto" or "white"

    // Quality/format
    f = "auto",       // format auto
    q = "auto:eco",       // quality auto lower bandwidth by default
    dpr = 1,     // DPR auto (retina aware)
    format,           // explicit format override (webp/avif/jpg/...)
    // NOTE: if `format` is provided, we won't emit f_auto.

    // Misc
    v,                // explicit version number (cache busting)
    blur,             // e_blur:2000 for LQIP
    attach,           // fl_attachment (true|string for filename)
    flags,            // custom flags array or string, e.g., ["progressive"] or "progressive"
    extra,            // extra raw transforms array, appended as-is (advanced)

    // Resource routing
    resourceType = "image", // "image" | "video" | "raw"
    deliveryType = "upload" // "upload" | "fetch" | ...
  } = opts;

  // Only include gravity for modes that support it
  const gravityAllowed = ["fill", "crop", "thumb", "lfill", "mfit"].includes(fit);

  // Build the ordered transformation parts
  const parts = [
    // format/quality/DPR (avoid double "f_" by using `format` to override)
    format ? `f_${format}` : (f && `f_${f}`),
    q && `q_${q}`,
    dpr && `dpr_${dpr}`,

    // sizing/cropping
    w && `w_${w}`,
    h && `h_${h}`,
    (w || h || ar) && `c_${fit}`,
    ar && `ar_${ar}`,
    gravityAllowed && g && `g_${g}`,
    bg && `b_${bg}`,      // background for pad/fit modes

    // effects / flags
    blur && `e_blur:${blur}`,
    flags && (Array.isArray(flags) ? flags.map(fl => `fl_${fl}`) : `fl_${flags}`),

    // attachment (download)
    attach && (typeof attach === "string" ? `fl_attachment:${attach}` : "fl_attachment"),

    // any extra raw transforms last (e.g., ["e_contrast:30", "e_sharpen"])
    extra && (Array.isArray(extra) ? extra : [extra])
  ]
    .flat()
    .filter(Boolean);

  const tx = parts.length ? `${parts.join(",")}/` : "";
  const ver = v ? `v${v}/` : "";

  // IMPORTANT: do not encode slashes in publicId; Cloudinary uses "/" to denote folders
  return `https://res.cloudinary.com/${cloud}/${resourceType}/${deliveryType}/${tx}${ver}${publicId}`;
}

/**
 * Convenience: build a forced-download URL (adds fl_attachment with filename).
 * - Keeps your view URLs clean and your download logic readable.
 */
export function cldDownloadUrl(publicId, filename = "download") {
  return cldUrl(publicId, { attach: filename });
}

/**
 * Convenience: build a simple width-based srcset string.
 * - widths: array of numbers (e.g., [360, 560, 800])
 * - pass-through "baseOpts" for crop/quality choices
 */
export function cldSrcSet(publicId, widths = [360, 560, 800], baseOpts = {}) {
  return widths
    .map(w => `${cldUrl(publicId, { ...baseOpts, w })} ${w}w`)
    .join(", ");
}
