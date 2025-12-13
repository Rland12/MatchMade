import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "@dr.pogodin/react-helmet";
import { slugify } from "@/utils/slug";
import { cldUrl } from "../libs/cdn";

const SITE = "https://www.matchmadepics.com";

const humanize = (s) =>
  String(s || "")
    .replace(/[-_]/g, " ")
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());


const makeAltText = (title, side, folder) => {
  const theme = folder && folder !== "home" ? `${humanize(folder)} ` : "";
  const sideLabel = side === "left" ? "left side" : "right side";
  return `${theme}matching profile picture pair titled “${title}”, ${sideLabel}`;
};

export default function PairSEO() {
  const params = useParams();
  const isCleanHome = params.slug && !params.folder; // /pair/:slug
  const folder = isCleanHome ? "home" : (params.folder || "home");
  const slug = isCleanHome ? params.slug : (params.slug || "");
  const [state, setState] = useState({ loading: true, error: null, item: null });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/data/pairs-${encodeURIComponent(folder)}.json`, { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to load data");
        const data = await res.json();
        if (cancelled) return;
        const found = (data.items || []).find((it) => slugify(it.title) === slug) || null;
        setState({ loading: false, error: found ? null : "Not found", item: found });
      } catch {
        if (!cancelled) setState({ loading: false, error: "Not found", item: null });
      }
    })();
    return () => { cancelled = true; };
  }, [folder, slug]);

  if (state.loading) return <div className="container py-5 text-center">Loading…</div>;
  if (state.error || !state.item) {
    const backHref = folder === "home" ? "/" : `/${folder}`;
    return (
      <div className="container py-5 text-center">
        <h2>Not found</h2>
        <p><Link to={backHref}>Back to {humanize(folder)}</Link></p>
      </div>
    );
  }

  const item = state.item;
  const title = `${item.title} Matching PFP Pair | MatchMade`;
  const description = item.description || `Download both sides of ${item.title} as matching profile pictures.`;
  const canonical = `${SITE}${folder === "home" ? `/pair/${slug}` : `/pair/${folder}/${slug}`}`;

  const ogImagePublicId = item.imageSet?.[0]?.publicId || null;
  const ogImageUrl = ogImagePublicId
    ? cldUrl(ogImagePublicId, { w: 960, h: 504, fit: "fill", g: "auto" })
    : item.imageSet?.[0]?.url || "";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: item.title,
    description,
    url: canonical,
    image: item.imageSet
      ?.map((img) => (img.publicId ? cldUrl(img.publicId, { w: 900, h: 900, fit: "fill", g: "auto" }) : img.url))
      .filter(Boolean),
  };

  const backHref = folder === "home" ? "/" : `/${folder}`;

  return (
    <>
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={canonical} />
        <meta property="og:type" content="website" />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        {ogImageUrl && <meta property="og:image" content={ogImageUrl} />}
        <meta property="og:url" content={canonical} />
        <meta name="twitter:card" content="summary_large_image" />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      <div className="container py-4">
        <nav className="mb-3">
          <Link to={backHref}>&larr; Back to {humanize(folder)}</Link>
        </nav>

        <h1 className="h3 mb-3">{item.title}</h1>
        <p className="text-muted">{description}</p>

        <div className="row">
          {item.imageSet?.map((img, i) => {
            const src = img.publicId
              ? cldUrl(img.publicId, { w: 900, h: 900, fit: "fill", g: "auto" })
              : img.url;
            const side = i === 0 ? "left" : "right";
            const alt = (img.alt && img.alt.trim()) || makeAltText(item.title, side, folder);

            return (
              <div className="col-12 col-md-6 mb-3" key={(img.publicId || img.url) || i}>
                <img
                  src={src}
                  alt={alt}
                  loading="eager"
                  decoding="sync"
                  className="img-fluid rounded"
                />
              </div>
            );
          })}
        </div>

        <p className="mt-3">
          <Link to={backHref}>Explore more in {humanize(folder)}</Link>
        </p>
      </div>
    </>
  );
}
