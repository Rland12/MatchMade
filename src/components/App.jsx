// App.jsx
import React, { useState, useEffect, Suspense, lazy } from "react";
import { Link, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import "./App.css";
import Categories from "./Categories";
import ImagePairs from "./ImagePairs";
import FiltersDropdown from "./FiltersDropdown";

const Modal = lazy(() => import("./Modal"));
const PairSEO = lazy(() => import("./PairSEO"));

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
    href: "https://www.tiktok.com/@matchmadepics.com",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M16 3.5v2.4a4.6 4.6 0 0 0 3.1 1.2v2.6a6.6 6.6 0 0 1-3.1-.75v5.35a5.75 5.75 0 1 1-5.75-5.75c.21 0 .42.01.63.04v2.65a2.75 2.75 0 1 0 2.25 2.7V3.5H16z" />
      </svg>
    ),
  },
  {
    key: "kofi",
    label: "Buy me a hot cocoa",
    href: "https://ko-fi.com/A0A51PGK4M",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M23.881 8.948c-.773-4.085-4.859-4.593-4.859-4.593H.723c-.604 0-.679.798-.679.798s-.082 7.324-.022 11.822c.164 2.424 2.586 2.672 2.586 2.672s8.267-.023 11.966-.049c2.438-.426 2.683-2.566 2.658-3.734 4.352.24 7.422-2.831 6.649-6.916zm-11.062 3.511c-1.246 1.453-4.011 3.976-4.011 3.976s-.121.119-.31.023c-.076-.057-.108-.09-.108-.09-.443-.441-3.368-3.049-4.034-3.954-.709-.965-1.041-2.7-.091-3.71.951-1.01 3.005-1.086 4.363.407 0 0 1.565-1.782 3.468-.963 1.904.82 1.832 3.011.723 4.311zm6.173.478c-.928.116-1.682.028-1.682.028V7.284h1.77s1.971.551 1.971 2.638c0 1.913-.985 2.667-2.059 3.015z" />
      </svg>
    ),
  },
];

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

            {/* Filters (season + pair type) */}
            <FiltersDropdown />
          </div>
        </nav>

      </header>

      <main id="main" tabIndex={-1}>
        <Routes location={uiLocation}>
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
          onClose={handleModalClose}
        />
      </Suspense>
    </div>
  );
}

export default App;
