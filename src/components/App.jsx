// App.jsx
import React, { useState, useEffect, Suspense, lazy } from "react";
import { Link, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import "./App.css";
import Categories from "./Categories";
import ImagePairs from "./ImagePairs";

const Modal = lazy(() => import("./Modal"));
const PairSEO = lazy(() => import("./PairSEO"));

const HOLIDAYS = [
  { key: "christmas", label: "Christmas" },
  { key: "halloween", label: "Halloween" },
];

const SOCIAL_LINKS = [
  {
    key: "instagram",
    label: "Instagram",
    href: "https://www.instagram.com/matchmadepics",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4zm0 2a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H7zm11.25 1.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0zM12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8zm0 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" />
      </svg>
    ),
  },
  {
    key: "tiktok",
    label: "TikTok",
    href: "https://www.tiktok.com/@matchmadepics",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M16 3.5v2.4a4.6 4.6 0 0 0 3.1 1.2v2.6a6.6 6.6 0 0 1-3.1-.75v5.35a5.75 5.75 0 1 1-5.75-5.75c.21 0 .42.01.63.04v2.65a2.75 2.75 0 1 0 2.25 2.7V3.5H16z" />
      </svg>
    ),
  },
  {
    key: "kofi",
    label: "Ko-fi",
    href: "https://ko-fi.com/matchmade",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M5 6h11.5a3.5 3.5 0 0 1 0 7H15a4 4 0 0 1-4 4H7a2 2 0 0 1-2-2V6zm2 2v8h2a2 2 0 0 0 2-2V8H7zm9.5 0H15v3h1.5a1.5 1.5 0 0 0 0-3z" />
      </svg>
    ),
  },
];

function SeasonalMenu() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const goHoliday = (key) => {
    navigate(`/seasonal?holiday=${key}`);
    setOpen(false);
  };

  return (
    <div className="seasonal-wrapper">
      <button
        className={`category seasonal-toggle ${open ? "active" : ""}`}
        onClick={() => setOpen(v => !v)}
      >
        Seasonal <span className="caret">▾</span>
      </button>

      <div className={"seasonal-menu" + (open ? " seasonal-menu-open" : "")}>
        {HOLIDAYS.map((h) => (
          <button
            key={h.key}
            className="seasonal-option"
            onClick={() => goHoliday(h.key)}
          >
            {h.label}
          </button>
        ))}
      </div>
    </div>
  );
}


function App() {
  const [selectedImages, setSelectedImages] = useState({});
  const [categories, setCategories] = useState([
    "Anime",
    "Cartoons",
    "Cute",
    "Lgbtq",
  ]);
  const location = useLocation();
  const state = location.state && location.state.modal ? location.state : null;

  // 🔹 Load categories from build-pairs output
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/data/categories.json", { cache: "no-store" });
        if (!res.ok) return; // fall back to default
        const data = await res.json();
        const raw = Array.isArray(data.categories) ? data.categories : [];

        // "seasonal" (if i ever add it as a folder)
        const labels = raw
          .filter(
            (c) => c.toLowerCase() !== "home" && c.toLowerCase() !== "seasonal"
          )
          .map((c) => c.charAt(0).toUpperCase() + c.slice(1).toLowerCase());

        if (labels.length) {
          setCategories(labels);
        }
      } catch (e) {
        // ignore and keep defaults
        console.warn("Failed to load categories.json", e);
      }
    })();
  }, []);

  const handleClick = (pair) => {
    setSelectedImages({ ...pair, _openedAt: Date.now() });
  };

  return (
    <div className="App">
      <a href="#main" className="skip-link">
        Skip to content
      </a>

      <header className="App-header">
        <h1 className="title">
          <Link to="/" aria-label="Go to homepage">MatchMade</Link>
        </h1>
        <p className="sub-title">
          Matching profile pictures for friends or special someone.
        </p>

        <div className="social-links" aria-label="MatchMade social profiles">
          {SOCIAL_LINKS.map((link) => (
            <a
              key={link.key}
              className="social-button"
              href={link.href}
              target="_blank"
              rel="noreferrer noopener"
            >
              {link.icon}
              <span>{link.label}</span>
            </a>
          ))}
        </div>

        <nav aria-label="Categories">
          <div className="category-row">
            <div className="category-strip">
              <Categories categories={categories} />
            </div>

            {/* Seasonal pill OUTSIDE scroll strip */}
            <SeasonalMenu />
          </div>
        </nav>

      </header>

      <main id="main" tabIndex={-1}>
        <Routes location={state?.backgroundLocation || location}>
          <Route path="/" element={<ImagePairs handleClick={handleClick} />} />
          <Route path="/:category" element={<ImagePairs handleClick={handleClick} />} />
          <Route
            path="/pair/:folder/:slug"
            element={
              <Suspense fallback={null}>
                <PairSEO />
              </Suspense>
            }
          />
          <Route path="/pair/:slug" element={<PairSEO />} />
        </Routes>
      </main>

      <Suspense fallback={null}>
        <Modal
          selectedImages={selectedImages}
          onClose={() => setSelectedImages({})}
        />
      </Suspense>
    </div>
  );
}

export default App;
