// ImagePairs.jsx
import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams, useNavigate, useLocation } from "react-router-dom";
import { Helmet } from "@dr.pogodin/react-helmet";
import { slugify } from "@/utils/slug";
import NotFound from "./NotFound";
import { cldUrl } from "../libs/cdn";

const PAIRS_PER_PAGE = 6;
const SITE = "https://www.matchmadepics.com";

const folderForCategory = (cat) => {
  const slug = (cat || "/").replace(/^\/+/, "").toLowerCase();
  if (!slug) return "home";
  const map = { anime: "anime", cartoons: "cartoons", cute: "cute", lgbtq: "lgbtq" };
  return map[slug] || slug;
};

const humanize = (s) =>
  String(s || "")
    .replace(/[-_]+/g, " ")
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());

export default function ImagePairs({ handleClick }) {
  const category = useParams().category || "/";
  const folder = folderForCategory(category);

  const [searchParams, setSearchParams] = useSearchParams();
  const rawPageParam = searchParams.get("page") ?? searchParams.get("p");
  const parsed = parseInt(rawPageParam || "1", 10);
  const pageFromUrl = Number.isFinite(parsed) && parsed > 0 ? parsed : 1;

  useEffect(() => {
    const hasPage = searchParams.has("page");
    const hasLegacy = searchParams.has("p");
    if (!hasPage && hasLegacy) {
      const next = new URLSearchParams(searchParams);
      next.delete("p");
      next.set("page", String(pageFromUrl));
      setSearchParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [state, setState] = useState({ loading: true, error: null, allPairs: [] });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setState({ loading: true, error: null, allPairs: [] });
        const url = `/data/pairs-${encodeURIComponent(folder)}.json`;
        const res = await fetch(url, { cache: "no-store" });
        const ct = res.headers.get("content-type") || "";
        if (!res.ok || !ct.includes("application/json")) {
          const text = await res.text().catch(() => "");
          console.error("[ImagePairs] BAD RESPONSE", { status: res.status, ct, sample: text.slice(0, 200) });
          throw new Error(`Bad JSON for ${folder}`);
        }
        const data = await res.json();
        if (cancelled) return;
        const all = data.items || [];
        setState({ loading: false, error: null, allPairs: all });

        const totalPages = Math.max(1, Math.ceil(all.length / PAIRS_PER_PAGE));
        const clamped = Math.min(Math.max(pageFromUrl, 1), totalPages);
        if (clamped !== pageFromUrl) {
          const next = new URLSearchParams(searchParams);
          next.set("page", String(clamped));
          next.delete("p");
          setSearchParams(next, { replace: true });
        }
      } catch (err) {
        if (!cancelled) setState({ loading: false, error: err.message, allPairs: [] });
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [folder]);

  const { totalPages, page, pageItems } = useMemo(() => {
    const total = state.allPairs.length;
    const pages = Math.max(1, Math.ceil(total / PAIRS_PER_PAGE));
    const safePage = Math.min(Math.max(pageFromUrl, 1), pages);
    const start = (safePage - 1) * PAIRS_PER_PAGE;
    const items = state.allPairs.slice(start, start + PAIRS_PER_PAGE);
    return { totalPages: pages, page: safePage, pageItems: items };
  }, [state.allPairs, pageFromUrl]);

  const columns = useMemo(() => {
    const cols = [[], [], []];
    pageItems.forEach((pair, idx) => cols[idx % 3].push(pair));
    return cols;
  }, [pageItems]);

  const goTo = (n) => {
    const clamped = Math.min(Math.max(n, 1), totalPages || 1);
    const next = new URLSearchParams(searchParams);
    next.set("page", String(clamped));
    next.delete("p");
    setSearchParams(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const prettyCat = humanize(folder);
  const baseUrl = `${SITE}/${folder}`;
  const canonical = page > 1 ? `${baseUrl}?page=${page}` : baseUrl;
  const title = page > 1
    ? `${prettyCat} Matching PFP Pairs – Page ${page} | MatchMade`
    : `${prettyCat} Matching PFP Pairs | MatchMade`;
  const description = `Browse ${prettyCat} matching profile picture pairs. Download both sides in one click. Page ${page} of ${totalPages}.`;

  if (state.error) return <NotFound />;
  if (state.loading && pageItems.length === 0) {
    return <div className="container py-5 text-center">Loading…</div>;
  }

  return (
    <>
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={canonical} />
        {page > 1 && <link rel="prev" href={`${baseUrl}?page=${page - 1}`} />}
        {page < totalPages && <link rel="next" href={`${baseUrl}?page=${page + 1}`} />}
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={canonical} />
      </Helmet>

      <div className="container">
        <div className="row">
          {columns.map((col, colIndex) => (
            <div className="col-md-4" key={`col-${colIndex}`}>
              {col.map((pair, pairIndex) => (
                <PairCard
                  pair={pair}
                  handleClick={handleClick}
                  key={`pair-${colIndex}-${pairIndex}-${pair.title || ""}`}
                />
              ))}
            </div>
          ))}
        </div>

        {totalPages > 1 && (
          <nav className="mt-4" aria-label="Image pairs pagination">
            <ul className="pagination justify-content-center">
              <li className={`page-item ${page <= 1 ? "disabled" : ""}`}>
                <button className="page-link" onClick={() => goTo(page - 1)} aria-label="Previous page">
                  «
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
                  »
                </button>
              </li>
            </ul>
          </nav>
        )}
      </div>
    </>
  );
}

/* ===== Pair & Thumb components ===== */

function PairCard({ pair, handleClick }) {
  const folder = (useParams().category || "home").toLowerCase();
  const slug = slugify(pair.title);
  const dims = { w: 560, h: 560, fit: "fill", g: "auto" };
  const navigate = useNavigate();
  const location = useLocation();

  const isHome = folder === "home";
  const hrefStr = isHome ? `/pair/${slug}` : `/pair/${folder}/${slug}`;

  const openAsModal = (e) => {
    if (e) e.preventDefault();
    navigate(hrefStr, { state: { modal: true, backgroundLocation: location } });

    const payload = pair;
    if (typeof handleClick === "function") {
      Promise.resolve().then(() => {
        requestAnimationFrame(() => handleClick(payload));
      });
    }
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      openAsModal(e);
    }
  };

  return (
    <a
      href={hrefStr}
      className="row text-decoration-none"
      role="button"
      aria-label={`${pair.title} – open preview`}
      onClick={openAsModal}
      onKeyDown={onKeyDown}
    >
      {pair.imageSet.map((img, index) => {
        const isCloud = !!img.publicId;
        const fullSrc = isCloud ? cldUrl(img.publicId, dims) : img.url;
        const tinySrc = isCloud ? cldUrl(img.publicId, { w: 24, q: 10, blur: 2000 }) : null;

        return (
          <MMImage
            key={(img.publicId || img.url || "") + index}
            src={fullSrc}
            tiny={tinySrc}
            alt={img.alt}
          />
        );
      })}
    </a>
  );
}

function MMImage({ src, tiny, alt }) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className="col-6 d-flex justify-content-center">
      <div className="mm-imgwrap m-1">
        {!loaded && (
          <div
            className="mm-skel"
            style={tiny ? { backgroundImage: `url(${tiny})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}
          />
        )}
        <img
          src={src}
          alt={alt}
          className={loaded ? "is-loaded" : ""}
          loading="lazy"
          decoding="async"
          onLoad={() => setLoaded(true)}
        />
      </div>
    </div>
  );
}
