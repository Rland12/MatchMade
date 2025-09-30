import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";

export default function Categories() {
  const [cats, setCats] = useState([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/data/categories.json", { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (cancelled) return;

        // Ensure "home" is first; keep the rest in order
        const list = (data.categories || []).map(String);
        const ordered = ["home", ...list.filter(c => c.toLowerCase() !== "home")];
        setCats(ordered);
      } catch (e) {
        console.error("Failed to load categories.json", e);
        setCats(["home"]); // safe fallback
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (loading) return null; // or a tiny skeleton

  const pretty = (slug) =>
    slug.replace(/[-_]+/g, " ").replace(/\b\w/g, c => c.toUpperCase());

  return (
    <div className="container">
      <ul className="nav d-flex justify-content-center">
        {cats.map((slug) => {
          const path = slug.toLowerCase() === "home" ? "/" : `/${slug.toLowerCase()}`;
          const isActive = location.pathname.toLowerCase() === path.toLowerCase();
          const className = `category nav-link${isActive ? " active" : ""}`;
          return (
            <li key={slug} className="nav-item">
              <Link to={path} className={className}>
                {pretty(slug)}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
