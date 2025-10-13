// src/pages/PairPage.jsx
// Dedicated route for a single pair: /pair/:folder/:slug
// - Renders both images so crawlers can index them.
// - Emits per-pair <title>, description, canonical, and (optional) OG/Twitter.
// - Still works with your modal via a window event if you want.

import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Helmet } from "@dr.pogodin/react-helmet";
import { cldUrl } from "@/libs/cdn";
import { slugify } from "@/utils/slug";

const SITE = "https://www.matchmadepics.com";
const VIEW = { w: 900, fit: "fit" }; // safe transform for display

export default function PairPage() {
  const { folder, slug } = useParams();
  const [state, setState] = useState({ loading: true, error: null, pair: null });

  // Load the folder's JSON and locate this pair by slug
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setState({ loading: true, error: null, pair: null });
        const res = await fetch(`/data/pairs-${encodeURIComponent(folder)}.json`, { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        const found = (json.items || []).find((it) => slugify(it.title) === slug);
        if (cancelled) return;
        if (!found) throw new Error("Pair not found");
        setState({ loading: false, error: null, pair: found });
      } catch (e) {
        if (!cancelled) setState({ loading: false, error: e.message, pair: null });
      }
    })();
    return () => { cancelled = true; };
  }, [folder, slug]);

  if (state.loading) return <div className="container py-5 text-center">Loading…</div>;
  if (state.error || !state.pair) {
    return (
      <div className="container py-5 text-center">
        <h2 className="mb-3">We couldn’t find that pair.</h2>
        <Link className="btn btn-secondary" to={`/${folder}`}>Back to {folder}</Link>
      </div>
    );
  }

  const { title, imageSet = [] } = state.pair;

  // Resolve display URLs (Cloudinary or legacy)
  const imgs = imageSet.map((img, i) => {
    const isCloud = !!img.publicId;
    const url = isCloud ? cldUrl(img.publicId, VIEW) : img.url;
    const alt = img.alt || `${title} — ${i === 0 ? "Left" : "Right"}`;
    return { url, alt, publicId: img.publicId };
  });

  // Per-page meta
  const canonical = `${SITE}/pair/${folder}/${slug}`;
  const metaTitle = `${title} | MatchMade`;
  const metaDesc = `Download the ${title} matching profile picture pair. Left & Right images included.`;
  const ogImage = imgs[0]?.url || ""; // For Google only; social bots may not run JS on GH Pages.

  return (
    <>
      <Helmet>
        <title>{metaTitle}</title>
        <meta name="description" content={metaDesc} />
        <link rel="canonical" href={canonical} />

        {/* Helpful for Google (social bots may ignore runtime tags on GH Pages) */}
        <meta property="og:title" content={metaTitle} />
        <meta property="og:description" content={metaDesc} />
        <meta property="og:url" content={canonical} />
        {ogImage && <meta property="og:image" content={ogImage} />}
        {ogImage && <meta name="twitter:image" content={ogImage} />}
        <meta name="twitter:card" content="summary_large_image" />
      </Helmet>

      <div className="container py-4">
        <nav className="mb-3">
          <Link to="/" className="me-2">Home</Link> /{" "}
          <Link to={`/${folder}`} className="ms-2 text-capitalize">{folder}</Link>
        </nav>

        <h1 className="h3 mb-3">{title}</h1>

        <div className="row">
          {imgs.map((im, idx) => (
            <div className="col-12 col-md-6 d-flex justify-content-center mb-3" key={im.url + idx}>
              <img
                src={im.url}
                alt={im.alt}
                className="img-fluid"
                loading="eager"
                decoding="async"
              />
            </div>
          ))}
        </div>

        {/* Optional: open your existing Bootstrap modal with the same pair */}
        <button
          type="button"
          className="btn btn-primary"
        
          onClick={() => {
            window.dispatchEvent(new CustomEvent("mm:setSelectedImages", { detail: state.pair }));
          }}
        >
          Open in Modal
        </button>
      </div>
    </>
  );
}
