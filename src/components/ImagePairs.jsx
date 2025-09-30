// ImagePairs.jsx
// Loads image pairs from static JSON (/data/pairs-<folder>.json),
// paginates 6 pairs per page, and lays them out in 3 balanced columns.

import { useParams, useSearchParams } from "react-router-dom";
import NotFound from "./NotFound";
import { cldUrl } from "../libs/cdn";
import { useEffect, useMemo, useState } from "react";

const PAIRS_PER_PAGE = 6;

// Map route category -> Cloudinary folder (update as needed)
const folderForCategory = (cat) => {
  const slug = (cat || "/").replace(/^\/+/, "").toLowerCase();
  if (!slug) return "home";
  const map = { anime: "anime", cartoons: "cartoons", cute: "cute", lgbtq: "lgbtq" };
  return map[slug] || slug;
};


function ImagePairs({ handleClick }) {
  // Category from route ("/" default)
  const category = useParams().category || "/";
  const folder   = folderForCategory(category);

  // Page from URL (?p=); keep in URL so links are shareable
  const [searchParams, setSearchParams] = useSearchParams();
  const rawPage = parseInt(searchParams.get("p") || "1", 10);
  const pageFromUrl = Number.isFinite(rawPage) ? Math.max(1, rawPage) : 1;

  // Local state for the JSON payload + paging
  const [state, setState] = useState({
    loading: true,
    error: null,
    allPairs: [],   // flat array of pairs for the folder
  });

// Fetch the static JSON for the selected folder (single, safe fetch)
useEffect(() => {
  let cancelled = false;

  (async () => {
    try {
      // show spinner
      setState({ loading: true, error: null, allPairs: [] });

      const url = `/data/pairs-${encodeURIComponent(folder)}.json`;
      console.log("[ImagePairs] category:", category, "folder:", folder, "url:", url);

      const res = await fetch(url, { cache: "no-store" });
      const ct = res.headers.get("content-type") || "";

      // Guard: 200 HTML (index.html) masquerading as JSON is common on dev servers
      if (!res.ok || !ct.includes("application/json")) {
        const text = await res.text().catch(() => "");
        console.error("[ImagePairs] BAD RESPONSE", {
          status: res.status,
          ct,
          sample: text.slice(0, 200),
        });
        throw new Error(`Bad JSON for ${folder}`);
      }

      const data = await res.json();
      console.log("[ImagePairs] loaded pairs:", data.items?.length ?? 0);
      if (cancelled) return;

      const all = data.items || [];
      setState({ loading: false, error: null, allPairs: all });

      // Clamp ?p to valid range once
      const totalPages = Math.max(1, Math.ceil(all.length / PAIRS_PER_PAGE));
      const clamped = Math.min(Math.max(pageFromUrl, 1), totalPages);
      if (clamped !== pageFromUrl) {
        const next = new URLSearchParams(searchParams);
        next.set("p", String(clamped));
        setSearchParams(next, { replace: true });
      }
    } catch (err) {
      if (cancelled) return;
      setState({ loading: false, error: err.message, allPairs: [] });
    }
  })();

  return () => { cancelled = true; };
// eslint-disable-next-line react-hooks/exhaustive-deps
}, [folder]);

  // Derive pagination from state + URL
  const { totalPages, page, pageItems } = useMemo(() => {
    const total = state.allPairs.length;
    const pages = Math.max(1, Math.ceil(total / PAIRS_PER_PAGE));
    const safePage = Math.min(Math.max(pageFromUrl, 1), pages);
    const start = (safePage - 1) * PAIRS_PER_PAGE;
    const items = state.allPairs.slice(start, start + PAIRS_PER_PAGE);
    return { totalPages: pages, page: safePage, pageItems: items };
  }, [state.allPairs, pageFromUrl]);

  // Balance current page items into 3 columns (0,1,2,0,1,2)
  const columns = useMemo(() => {
    const cols = [[], [], []];
    pageItems.forEach((pair, idx) => cols[idx % 3].push(pair));
    return cols;
  }, [pageItems]);

  // Jump to page n (clamped) and scroll to top
  const goTo = (n) => {
    const clamped = Math.min(Math.max(n, 1), totalPages || 1);
    const next = new URLSearchParams(searchParams);
    next.set("p", String(clamped));
    setSearchParams(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Error or missing JSON → NotFound (e.g., no such folder)
  if (state.error) return <NotFound />;

  // Initial loading state
  if (state.loading && pageItems.length === 0) {
    return <div className="container py-5 text-center">Loading…</div>;
  }

  return (
    <div className="container">
      {/* Grid */}
      <div className="row">
        {columns.map((col, colIndex) => (
          <div className="col-md-4" key={`col-${colIndex}`}>
            {col.map((imagePair, pairIndex) => (
              <ImagePair
                images={imagePair}
                handleClick={handleClick}
                key={`imagePair-${colIndex}-${pairIndex}-${imagePair.title || ""}`}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <nav className="mt-4" aria-label="Image pairs pagination">
          <ul className="pagination justify-content-center">
            <li className={`page-item ${page <= 1 ? "disabled" : ""}`}>
              <button className="page-link" onClick={() => goTo(page - 1)} aria-label="Previous page">
                &laquo;
              </button>
            </li>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
              <li key={n} className={`page-item ${n === page ? "active" : ""}`}>
                <button
                  className="page-link"
                  onClick={() => goTo(n)}
                  aria-current={n === page ? "page" : undefined}
                >
                  {n}
                </button>
              </li>
            ))}

            <li className={`page-item ${page >= totalPages ? "disabled" : ""}`}>
              <button className="page-link" onClick={() => goTo(page + 1)} aria-label="Next page">
                &raquo;
              </button>
            </li>
          </ul>
        </nav>
      )}
    </div>
  );
}

/* ===== Pair & Thumb components (unchanged) ===== */

const ImagePair = ({ images, handleClick }) => {
  // Thumb size for grid; adjust once and all thumbs follow
  const dims = { w: 560, h: 560, fit: "fill", g: "auto" };

  return (
    <div className="row" onClick={() => handleClick(images)}>
      {images.imageSet.map((img, index) => {
        // Support both Cloudinary (publicId) and legacy (url) entries
        const isCloud = !!img.publicId;

        // Full-size thumbnail URL (Cloudinary or legacy URL)
        const fullSrc = isCloud ? cldUrl(img.publicId, dims) : img.url;

        // Super-small blurred preview as background for the skeleton
        const tinySrc = isCloud ? cldUrl(img.publicId, { w: 24, q: 10, blur: 2000 }) : null;

        return (
          <MMImage
            key={(img.publicId || img.url) + index}
            src={fullSrc}
            tiny={tinySrc}
            alt={img.alt}
          />
        );
      })}
    </div>
  );
};

function MMImage({ src, tiny, alt }) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className="col-6 d-flex justify-content-center">
      <div className="mm-imgwrap m-1">
        {/* Skeleton (optionally uses blurred tiny preview as background) */}
        {!loaded && (
          <div
            className="mm-skel"
            style={
              tiny
                ? { backgroundImage: `url(${tiny})`, backgroundSize: "cover", backgroundPosition: "center" }
                : undefined
            }
          />
        )}

        {/* Actual image (fades in via .is-loaded CSS) */}
        <img
          src={src}
          alt={alt}
          className={loaded ? "is-loaded" : ""}
          loading="lazy"
          decoding="async"
          onLoad={() => setLoaded(true)}
          // Bootstrap modal trigger. Make sure <Modal id="imagePreview" /> is mounted once on the page.
          data-bs-toggle="modal"
          data-bs-target="#imagePreview"
          // Keyboard support (Enter/Space to open)
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              e.currentTarget.click();
            }
          }}
        />
      </div>
    </div>
  );
}

export default ImagePairs;
