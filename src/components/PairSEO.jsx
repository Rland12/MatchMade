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

export default function PairSEO() {
  const { folder = "home", slug = "" } = useParams();
  const [state, setState] = useState({ loading: true, error: null, item: null });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/data/pairs-${encodeURIComponent(folder)}.json`, { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to load data");
        const data = await res.json();
        if (cancelled) return;
        const items = Array.isArray(data.items) ? data.items : [];
        const found = items.find((it) => slugify(it.title || "") === slug) || null;
        setState({ loading: false, error: found ? null : "Not found", item: found });
      } catch {
        if (!cancelled) setState({ loading: false, error: "Not found", item: null });
      }
    })();
    return () => { cancelled = true; };
  }, [folder, slug]);

  if (state.loading) return <div className="container py-5 text-center">Loading…</div>;

  if (state.error || !state.item) {
    const notFoundCanonical = `${SITE}/pair/${folder}/${slug}`;
    return (
      <>
        <Helmet>
          <title>Not found | MatchMade</title>
          <meta name="robots" content="noindex, follow" />
          <link rel="canonical" href={notFoundCanonical} />
        </Helmet>
        <div className="container py-5 text-center">
          <h2>Not found</h2>
          <p><Link to={`/${folder}`}>&larr; Back to {humanize(folder)}</Link></p>
        </div>
      </>
    );
  }

  const item = state.item;
  const safeTitle = item.title || "Matching PFP Pair";
  const title = `${safeTitle} Matching PFP Pair | MatchMade`;
  const description = item.description || `Download both sides of ${safeTitle} as matching profile pictures.`;
  const canonical = `${SITE}/pair/${folder}/${slug}`;

  const first = item.imageSet?.[0] || {};
  const ogImageUrl = first.publicId
    ? cldUrl(first.publicId, { w: 1200, h: 630, fit: "fill", g: "auto" })
    : first.url || "";
  const ogImageAlt = first.alt || safeTitle;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: safeTitle,
    description,
    url: canonical,
    image: (item.imageSet || [])
      .map((img) =>
        img.publicId ? cldUrl(img.publicId, { w: 1024, h: 1024, fit: "fill", g: "auto" }) : img.url
      )
      .filter(Boolean),
  };

   const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE + "/" },
      { "@type": "ListItem", position: 2, name: humanize(folder), item: `${SITE}/${folder}` },
      { "@type": "ListItem", position: 3, name: item.title, item: canonical }
    ]
  };

  return (
    <>
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={canonical} />

        <meta property="og:type" content="website" />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        {ogImageUrl && <meta property="og:image" content={ogImageUrl} />}
        {ogImageUrl && <meta property="og:image:width" content="1200" />}
        {ogImageUrl && <meta property="og:image:height" content="630" />}
        {ogImageAlt && <meta property="og:image:alt" content={ogImageAlt} />}
        <meta property="og:url" content={canonical} />

        <meta name="twitter:card" content="summary_large_image" />
        {ogImageUrl && <meta name="twitter:image" content={ogImageUrl} />}
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />

        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
        <script type="application/ld+json">{JSON.stringify(breadcrumbLd)}</script>
      </Helmet>

      <div className="container py-4">
        <nav className="mb-3">
          <Link to={`/${folder}`}>&larr; Back to {humanize(folder)}</Link>
        </nav>

        <h1 className="h3 mb-3">{safeTitle}</h1>
        <p className="text-muted">{description}</p>

        <div className="row">
          {(item.imageSet || []).map((img, i) => {
            const src = img.publicId
              ? cldUrl(img.publicId, { w: 1024, h: 1024, fit: "fill", g: "auto" })
              : img.url;
            if (!src) return null;
            return (
              <div className="col-12 col-md-6 mb-3" key={(img.publicId || img.url) || i}>
                <img
                  src={src}
                  alt={img.alt || safeTitle}
                  width="1024"
                  height="1024"
                  loading="eager"
                  decoding="sync"
                  className="img-fluid rounded"
                />
              </div>
            );
          })}
        </div>

        <p className="mt-3">
          <Link to={`/${folder}`}>Explore more in {humanize(folder)}</Link>
        </p>
      </div>
    </>
  );
}
