// App.jsx
import React, { useState, Suspense, lazy } from "react";
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
  const location = useLocation();
  const state = location.state && location.state.modal ? location.state : null;

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
          <Link to="/">MatchMade</Link>
        </h1>
        <p className="sub-title">
          Matching profile pictures for friends or special someone.
        </p>

        <nav aria-label="Categories">
          <div className="category-row">
            <div className="category-strip">
              <Categories categories={["Anime", "Cartoons", "Cute", "Lgbtq"]} />
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
