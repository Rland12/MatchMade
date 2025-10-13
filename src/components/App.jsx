import React, { useState, Suspense, lazy } from "react";
import { Link, Routes, Route, useLocation } from "react-router-dom";
import "./App.css";
import Categories from "./Categories";
import ImagePairs from "./ImagePairs";
import { imageMap } from "../utils/imageMap";

const Modal = lazy(() => import("./Modal"));
const PairSEO = lazy(() => import("./PairSEO"));

function App() {
  const [selectedImages, setSelectedImages] = useState({});
  const location = useLocation();
  const state = location.state && location.state.modal ? location.state : null;

  const handleClick = (pair) => {
    setSelectedImages({ ...pair, _openedAt: Date.now() });
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1 className="title"><Link to="/">MatchMade</Link></h1>
        <p className="sub-title">Matching profile pictures for friends or special someone.</p>

        <Categories categories={["Anime", "Cartoons", "Cute", "Lgbtq"]} />

        <Routes location={state?.backgroundLocation || location}>
          <Route path="/:category" element={<ImagePairs handleClick={handleClick} />} />
          <Route
            path="/pair/:folder/:slug"
            element={
              <Suspense fallback={null}>
                <PairSEO />
              </Suspense>
            }
          />
        </Routes>
      </header>

      <Suspense fallback={null}>
        <Modal selectedImages={selectedImages} onClose={() => setSelectedImages({})} />
      </Suspense>
    </div>
  );
}

export default App;
