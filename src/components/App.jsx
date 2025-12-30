// App.jsx
import React, { useState, useEffect, Suspense, lazy } from "react";
import { Link, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import "./App.css";
import Categories from "./Categories";
import ImagePairs from "./ImagePairs";
import FiltersDropdown from "./FiltersDropdown";

const About = lazy(() => import("./About"));
const Modal = lazy(() => import("./Modal"));
const PairSEO = lazy(() => import("./PairSEO"));


const CATEGORY_SUBTITLES = {
  home:
    "Find matching profile pics for friends, couples and besties. Browse anime, cartoons, cute, games, movies and LGBTQ matching pfps and download both sides in one click.",
  anime:
    "Soft, cute and cool anime matching profile pics for friends, couples and besties. Pick an anime matching profile picture pair and save both sides for Discord, Instagram or TikTok.",
  cartoons:
    "Cartoon matching profile pics inspired by your favorite shows and characters. Choose a cartoon matching profile picture pair for you and your friend or special someone.",
  cute:
    "Adorable, cozy and pastel matching profile pics with soft vibes. Browse cute matching profile picture pairs for you and your favorite person and download both sides together.",
  games:
    "Game and gamer-themed matching profile pics. Find matching profile picture pairs for Discord, and more, and grab both sides in one tap.",
  lgbtq:
    "Pride-friendly LGBTQ matching profile pics for friends and partners. Discover matching profile picture pairs that reflect your identity and download both images easily.",
  movies:
    "Movie and TV inspired matching profile pics for film lovers and besties. Choose a matching profile picture pair from your favorite characters and save both sides.",
};

function getCategoryKeyFromPath(pathname) {
  const segments = pathname.split("/").filter(Boolean);
  const first = (segments[0] || "").toLowerCase();

  // homepage
  if (!first) return "home";

  // pair detail routes (modal or direct) – treat as home for the header
  if (first === "pair") return "home";

  // category routes like /anime, /cartoons, /cute, /games, /lgbtq, /movies
  return first;
}

function getCategoryLabel(key) {
  if (key === "home") return "";
  return key.charAt(0).toUpperCase() + key.slice(1);
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

  const navigate = useNavigate();
  const handleModalClose = () => {
    setSelectedImages({});
    // if this route was opened as a modal over a background location,
    // go back to that background route
    const locState = location.state;
    if (locState && locState.modal && locState.backgroundLocation) {
      navigate(locState.backgroundLocation, { replace: true });
    }
  };
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

  // When a modal is open, use the background route for UI (header, grid, etc.)
  const uiLocation = state?.backgroundLocation || location;
  const categoryKey = getCategoryKeyFromPath(uiLocation.pathname);
  const categoryLabel = getCategoryLabel(categoryKey);
  const subtitle =
    CATEGORY_SUBTITLES[categoryKey] || CATEGORY_SUBTITLES.home;

  return (
    <div className="App">
      <a href="#main" className="skip-link">
        Skip to content
      </a>

      <header className="App-header">
        <h1 className="title">
          <Link to="/" aria-label="Go to homepage">
            MatchMade
            {categoryLabel && <span> | {categoryLabel}</span>}
          </Link>
        </h1>
        <p className="sub-title">{subtitle}</p>

        <nav aria-label="Categories">
          <div className="category-row">
            <div className="category-strip">
              <Categories categories={categories} />
            </div>

            {/* Filters (season + pair type) */}
            <FiltersDropdown />
          </div>
          <div className="header-secondary-links">
            <Link to="/about" className="about-link">
              About MatchMade
            </Link>
          </div>
        </nav>

      </header>

      <main id="main" tabIndex={-1}>
        <Routes location={uiLocation}>
          <Route path="/" element={<ImagePairs handleClick={handleClick} />} />
          <Route path="/:category" element={<ImagePairs handleClick={handleClick} />} />
          <Route path="/about" element={<About />} />
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
          onClose={handleModalClose}
        />
      </Suspense>
    </div>
  );
}

export default App;
