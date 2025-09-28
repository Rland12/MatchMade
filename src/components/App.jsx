import React, { useState } from "react";
import { Link, Routes, Route } from "react-router-dom";
import "./App.css";
import Categories from "./Categories";
import ImagePairs from "./ImagePairs";
import Modal from "./Modal";
import { imageMap } from "../utils/imageMap";
//future: pagination for pages of images
//future: some type of download logging for a featured/popular page?
//future: logo in logo.svg
//future: add more categories
//future: lgbtq small images dont match up to the big images look at the imageMap for differences
//current commits are not deployed use npm run build to deploy later
function App() {
  const [selectedImages, setSelectedImages] = useState({});
  const handleClick = (images) => setSelectedImages(images);

  return (
    <div className="App">
      <header className="App-header">
        <h1 className="title"><Link to="/">MatchMade</Link></h1>
        <p className="sub-title">Matching profile pictures for friends or special someone.</p>

        <Categories categories={["Anime", "Cartoons", "Cute", "Lgbtq"]} />

        <Routes>
          <Route
            path="/"
            element={<ImagePairs images={imageMap["/"]} handleClick={handleClick} />}
          />
          <Route
            path="/:category"
            element={<ImagePairs handleClick={handleClick} />}
          />
        </Routes>
      </header>
      <Modal selectedImages={selectedImages} />
    </div>
  );
}

export default App;
