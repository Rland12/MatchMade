// ImagePairs.jsx
import { useEffect, useMemo, useState } from "react";
import {
  useParams,
  useSearchParams,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { Helmet } from "@dr.pogodin/react-helmet";
import { slugify } from "@/utils/slug";
import NotFound from "./NotFound";
import { cldSrcSet, cldUrl } from "../libs/cdn";
import { analytics } from "@/libs/analytics";

const PAIRS_PER_PAGE = 6;
const SITE = "https://www.matchmadepics.com";

// map holiday ids (from ?holiday=…) to your Cloudinary tags (season_*)
const HOLIDAY_TAGS = {
  christmas: "season_christmas",
  halloween: "season_halloween",
  valentines: "season_valentines",
};
// extra tag-based filters from Cloudinary
// match filters → Cloudinary tags

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

const makeAltText = (title, side, folder) => {
  const theme = folder && folder !== "home" ? `${humanize(folder)} ` : "";
  const sideLabel = side === "left" ? "left side" : "right side";
  return `${theme}matching profile picture pair titled “${title}”, ${sideLabel}`;
};

export default function ImagePairs({ handleClick }) {
  const params = useParams();
  const isHome = !params.category; // "/" has no category segment
  const folder = folderForCategory(params.category || "/");

  const [searchParams, setSearchParams] = useSearchParams();
  const rawPageParam = searchParams.get("page") ?? searchParams.get("p");
  const parsed = parseInt(rawPageParam || "1", 10);
  const pageFromUrl = Number.isFinite(parsed) && parsed > 0 ? parsed : 1;

  // seasonal controls via ?holiday=christmas|halloween|valentines
  const holidayId = (searchParams.get("holiday") || "").toLowerCase();
  const holidayTag = HOLIDAY_TAGS[holidayId] || null;

  // extra tag-based filters via ?filters=gender_gg,poc
  const rawFilters = (searchParams.get("filters") || "").toLowerCase();
  const activeFilterTags = rawFilters
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  // key used for effect deps so we re-run when filters change
  const filterKey = activeFilterTags.slice().sort().join(",");

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

    // When switching seasonal holiday (christmas <-> halloween), reset to page 1
  useEffect(() => {
    if (!holidayId) return;          // only care about seasonal views
    if (pageFromUrl === 1) return;   // already on page 1, nothing to do

    const next = new URLSearchParams(searchParams);
    next.set("page", "1");
    next.delete("p");
    setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [holidayId]);

  const [state, setState] = useState({ loading: true, error: null, allPairs: [] });

  useEffect(() => {
    let cancelled = false;

    const ALL_FOLDERS = ["home", "anime", "cartoons", "cute", "games", "lgbtq", "movies"];

    const fetchFolderItems = async (folderName) => {
      const url = `/data/pairs-${encodeURIComponent(folderName)}.json`;
      const res = await fetch(url, { cache: "no-store" });
      const ct = res.headers.get("content-type") || "";

      if (!res.ok || !ct.includes("application/json")) {
        const sample = await res.text().catch(() => "");
        console.error("[ImagePairs] BAD RESPONSE", {
          folderName,
          status: res.status,
          ct,
          sample: sample.slice(0, 200),
        });
        throw new Error(`Bad JSON for ${folderName}`);
      }

      const data = await res.json();
      const items = data.items || [];
      // remember which folder each pair came from
      return items.map((item) => ({ ...item, __folder: folderName }));
    };

    (async () => {
      try {
        setState({ loading: true, error: null, allPairs: [] });

        let items = [];

        if (holidayTag || isHome) {
          // Home + seasonal views: pull from *all* folders
          const results = await Promise.all(
            ALL_FOLDERS.map((fName) => fetchFolderItems(fName))
          );
          items = results.flat();
        } else {
          // Category view: just this category's folder
          items = await fetchFolderItems(folder);
        }


        // --- Seasonal tag filter (season_christmas, etc.) ---
        if (holidayTag) {
          items = items.filter((item) => {
            const tags = Array.isArray(item.tags) ? item.tags : [];
            return tags.includes(holidayTag);
          });
        }

        // --- Extra tag filters (gender_gg, gender_bb, poc, ...) ---
        if (activeFilterTags.length) {
          items = items.filter((item) => {
            const tags = Array.isArray(item.tags) ? item.tags : [];
            return activeFilterTags.every((t) => tags.includes(t));
          });
        }

        if (cancelled) return;

        setState({ loading: false, error: null, allPairs: items });

        // clamp page if filters made us run out of pages
        const totalPages = Math.max(1, Math.ceil(items.length / PAIRS_PER_PAGE));
        const clamped = Math.min(Math.max(pageFromUrl, 1), totalPages);
        if (clamped !== pageFromUrl) {
          const next = new URLSearchParams(searchParams);
          next.set("page", String(clamped));
          next.delete("p");
          if (holidayId) next.set("holiday", holidayId);
          if (rawFilters) next.set("filters", rawFilters);
          setSearchParams(next, { replace: true });
        }
      } catch (err) {
        if (!cancelled) {
          setState({
            loading: false,
            error: err.message || "Failed to load pairs",
            allPairs: [],
          });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
    // re-run when category or filters change
  }, [folder, holidayTag, filterKey, pageFromUrl, holidayId, rawFilters, searchParams, setSearchParams]);


  const { totalPages, page, pageItems } = useMemo(() => {
    const total = state.allPairs.length;

    // Plain home only (no holiday, no extra filters):
    // show a random 6-pack from all categories, no pagination
    if (isHome && !holidayTag && activeFilterTags.length === 0) {
      const shuffled = state.allPairs.slice().sort(() => Math.random() - 0.5);
      const items = shuffled.slice(0, PAIRS_PER_PAGE);
      return { totalPages: 1, page: 1, pageItems: items };
    }

    // All other views (categories, home+holiday, filtered):
    // use normal pagination based on pageFromUrl
    const pages = Math.max(1, Math.ceil(total / PAIRS_PER_PAGE));
    const safePage = Math.min(Math.max(pageFromUrl, 1), pages);
    const start = (safePage - 1) * PAIRS_PER_PAGE;
    const items = state.allPairs.slice(start, start + PAIRS_PER_PAGE);

    return { totalPages: pages, page: safePage, pageItems: items };
  }, [
    state.allPairs,
    pageFromUrl,
    isHome,
    holidayTag,
    activeFilterTags.length,
  ]);


  const hasResults =
    !state.loading && !state.error && state.allPairs.length > 0;

  const goTo = (n) => {
    const clamped = Math.min(Math.max(n, 1), totalPages || 1);
    const next = new URLSearchParams(searchParams);
    next.set("page", String(clamped));
    next.delete("p");
    if (holidayId) next.set("holiday", holidayId);
    if (rawFilters) next.set("filters", rawFilters);
    setSearchParams(next);
  };
  const clearFilters = () => {
    const next = new URLSearchParams(searchParams);
    next.delete("holiday");
    next.delete("filters");
    next.delete("page");
    next.delete("p");
    setSearchParams(next);
  };


  const prettyCat = humanize(folder);
  const baseUrl = isHome ? `${SITE}/` : `${SITE}/${folder}/`;

  // canonical that also respects holiday & page for seasonal
  const canonParams = new URLSearchParams();
  if (!isHome && page > 1) canonParams.set("page", String(page));
  if (holidayId) canonParams.set("holiday", holidayId);
  if (rawFilters) canonParams.set("filters", rawFilters);

  const canonQs = canonParams.toString();
  const canonical = canonQs ? `${baseUrl}?${canonQs}` : baseUrl;

  const homeTitle = "MatchMade — Matching Profile Picture Pairs";
  const homeDesc =
    "Matching profile pictures to share with your friends or special someone. Choose from anime, cartoons, cute or LGBTQ matching pfps.";
  const title = isHome
    ? homeTitle
    : page > 1
      ? `${prettyCat} Matching PFP Pairs - Page ${page} | MatchMade`
      : `${prettyCat} Matching PFP Pairs | MatchMade`;
  const description = isHome
    ? homeDesc
    : `Browse ${prettyCat} matching profile picture pairs. Download both sides in one click. Page ${page} of ${totalPages}.`;

  if (state.error) return <NotFound />;
  if (state.loading && pageItems.length === 0) {
    return <div className="container py-5 text-center">Loading…</div>;
  }

  const buildPageHref = (newPage) => {
    const params = new URLSearchParams();
    params.set("page", String(newPage));
    if (holidayId) params.set("holiday", holidayId);
    if (rawFilters) params.set("filters", rawFilters);
    return `${baseUrl}?${params.toString()}`;
  };

  return (
    <>
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={canonical} />
        {!isHome && page > 1 && (
          <link rel="prev" href={buildPageHref(page - 1)} />
        )}
        {!isHome && page < totalPages && (
          <link rel="next" href={buildPageHref(page + 1)} />
        )}

        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={canonical} />
      </Helmet>

      <div className="container">
        {/* No results message */}
        {!state.loading && !state.error && !hasResults && (
          <div className="no-pairs">
            <h2>No pairs found</h2>
            <p>
              Try changing the season or pair type filters,
              or clear all filters to see every pair again.
            </p>
            <button
              type="button"
              className="btn-clear-filters"
              onClick={clearFilters}
            >
              Clear filters
            </button>
          </div>
        )}

        {/* Normal grid + pagination when we have results */}
        {hasResults && (
          <>
            <div className="pair-grid">
              {pageItems.map((pair, pairIndex) => (
                <PairCard
                  pair={pair}
                  handleClick={handleClick}
                  pairIndex={pairIndex}
                  key={`pair-${pairIndex}-${pair.title || ""}`}
                />
              ))}
            </div>

            {totalPages > 1 && (
              <nav className="mt-2" aria-label="Image pairs pagination">
                <ul className="pagination">
                  <li className={`page-item ${page <= 1 ? "disabled" : ""}`}>
                    <button
                      className="page-link"
                      onClick={() => goTo(page - 1)}
                      aria-label="Previous page"
                    >
                      «
                    </button>
                  </li>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                    <li
                      key={n}
                      className={`page-item ${n === page ? "active" : ""}`}
                    >
                      <button
                        className="page-link"
                        onClick={() => goTo(n)}
                        aria-current={n === page ? "page" : undefined}
                      >
                        {n}
                      </button>
                    </li>
                  ))}

                  <li
                    className={`page-item ${page >= totalPages ? "disabled" : ""
                      }`}
                  >
                    <button
                      className="page-link"
                      onClick={() => goTo(page + 1)}
                      aria-label="Next page"
                    >
                      »
                    </button>
                  </li>
                </ul>
              </nav>
            )}
          </>
        )}
      </div>

    </>
  );
}

/* ===== Pair & Thumb components ===== */

function PairCard({ pair, handleClick, pairIndex }) {
  const params = useParams();
  const routeFolder = (params.category || "home").toLowerCase();

  // always prefer the folder the pair actually came from
  const folder = pair.__folder || routeFolder;


  const slug = slugify(pair.title);
  const dims = { w: 420, h: 420, fit: "fill", g: "auto" };
  const srcSetWidths = [220, 320, 420, 560];
  const navigate = useNavigate();
  const location = useLocation();

  const isHome = folder === "home";
  const hrefStr = isHome ? `/pair/${slug}` : `/pair/${folder}/${slug}`;

  const openAsModal = (e) => {
    if (e) e.preventDefault();
    analytics.selectItem({ folder, slug, title: pair.title });
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
      className="pair-card text-decoration-none"
      role="button"
      aria-label={`${pair.title} - open preview`}
      onClick={openAsModal}
      onKeyDown={onKeyDown}
    >
      {pair.imageSet.map((img, index) => {
        const isCloud = !!img.publicId;
        const fullSrc = isCloud ? cldUrl(img.publicId, dims) : img.url;
        const srcSet = isCloud ? cldSrcSet(img.publicId, srcSetWidths, dims) : undefined;
        const sizes = "(max-width: 900px) 50vw, 33vw";

        const side = index === 0 ? "left" : "right";
        const alt =
          (img.alt && img.alt.trim()) || makeAltText(pair.title, side, folder);
        return (
          <MMImage
            key={(img.publicId || img.url || "") + index}
            src={fullSrc}
            srcSet={srcSet}
            sizes={srcSet ? sizes : undefined}
            alt={alt}
            priority={pairIndex === 0}
          />
        );
      })}
    </a>
  );
}

function MMImage({ src, srcSet, sizes, alt, priority = false }) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className="pair-thumb">
      <div className="mm-imgwrap">
        {!loaded && <div className="mm-skel" />}
        <img
          src={src}
          srcSet={srcSet}
          sizes={sizes}
          alt={alt}
          className={loaded ? "is-loaded" : ""}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          fetchPriority={priority ? "high" : "auto"}
          onLoad={() => setLoaded(true)}
        />
      </div>
    </div>
  );
}
