// src/pages/PairDetail.jsx
// Standalone pair-details page used for deep-links and SEO.
// Loads the folder JSON, finds the matching pair by slug,
// and renders the two images + one-click ZIP download.
// No grid or modal here.

import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { slugify } from "@/utils/slug";
import { cldUrl } from "@/libs/cdn";
import JSZip from "jszip";
import { saveAs } from "file-saver";

const VIEW_W = 720; // preview width per side

export default function PairDetail() {
  const { folder, slug } = useParams();
  const [state, setState] = useState({ loading: true, error: null, items: [] });

  // Fetch the JSON for this folder
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setState((s) => ({ ...s, loading: true, error: null }));
        const res = await fetch(`/data/pairs-${encodeURIComponent(folder)}.json?v=${__MM_BUILD__}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (cancelled) return;
        setState({ loading: false, error: null, items: data.items || [] });
      } catch (e) {
        if (!cancelled) setState({ loading: false, error: e.message, items: [] });
      }
    })();
    return () => { cancelled = true; };
  }, [folder]);

  const pair = useMemo(
    () => state.items.find((p) => slugify(p.title) === slug),
    [state.items, slug]
  );

  const doZipDownload = async () => {
    if (!pair) return;
    try {
      const zip = new JSZip();
      const base = slugify(pair.title) || "matchmade-pair";
      const folderZip = zip.folder(base) || zip;

      // Fetch each image as blob (Cloudinary CORS is fine)
      const blobs = await Promise.all(
        pair.imageSet.map(async (img, idx) => {
          const raw = img.publicId ? cldUrl(img.publicId) : img.url;
          const res = await fetch(raw, { mode: "cors" });
          if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
          const blob = await res.blob();
          const extByMime = {
            "image/avif": "avif",
            "image/webp": "webp",
            "image/jpeg": "jpg",
            "image/png": "png",
            "image/gif": "gif",
          }[blob.type];
          const extByUrl = (raw.split(".").pop() || "").split("?")[0].toLowerCase();
          const ext = extByMime || extByUrl || "jpg";
          return { name: `image_${idx + 1}.${ext}`, blob };
        })
      );

      blobs.forEach(({ name, blob }) => folderZip.file(name, blob));
      const zipBlob = await zip.generateAsync({ type: "blob" });
      saveAs(zipBlob, `${base}.zip`);
    } catch (e) {
      console.error("ZIP download failed:", e);
      alert("Download failed. Please try again.");
    }
  };

  if (state.loading) {
    return (
      <div className="container">
        <div className="pair-grid" aria-hidden="true">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="pair-card">
              <div className="pair-thumb">
                <div className="mm-imgwrap"><div className="mm-skel" /></div>
              </div>
              <div className="pair-thumb">
                <div className="mm-imgwrap"><div className="mm-skel" /></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  if (state.error || !pair) {
    return (
      <div className="container py-5 text-center">
        <p>Pair not found.</p>
        <p><Link to={`/${folder}`}>← Back to {folder}</Link></p>
      </div>
    );
  }

  // Build nice preview URLs
  const leftSrc  = pair.imageSet[0].publicId ? cldUrl(pair.imageSet[0].publicId, { w: VIEW_W, fit: "fit" })  : pair.imageSet[0].url;
  const rightSrc = pair.imageSet[1].publicId ? cldUrl(pair.imageSet[1].publicId, { w: VIEW_W, fit: "fit" }) : pair.imageSet[1].url;

  return (
    <div className="container py-4">
      <h1 className="mb-3">{pair.title}</h1>

      <div className="row g-3 align-items-start">
        <div className="col-md-6 d-flex justify-content-center">
          <img src={leftSrc} alt={`${pair.title} — Left`} className="img-fluid rounded" />
        </div>
        <div className="col-md-6 d-flex justify-content-center">
          <img src={rightSrc} alt={`${pair.title} — Right`} className="img-fluid rounded" />
        </div>
      </div>

      <div className="mt-4 d-flex gap-3">
        <button className="btn btn-primary" onClick={doZipDownload}>Download Image Pair</button>
        <Link className="btn btn-outline-secondary" to={`/${folder}`}>Back to {folder}</Link>
      </div>
    </div>
  );
}
