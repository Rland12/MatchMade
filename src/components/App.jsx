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
