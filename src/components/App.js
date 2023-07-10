import React, { useState } from "react";
import { HashRouter, Link, Routes, Route } from "react-router-dom";
import "./App.css";
import Categories from "./Categories";
import ImagePairs from "./ImagePairs";
import Modal from "./Modal";
import { imageMap } from "../utils/imageMap";
//future: pagination for pages of images
//future: some type of download logging for a featured/popular page?
//future: logo in logo.svg
function App() {
  const [selectedImages, setSelectedImages] = useState({});

  const handleClick = (images) => {
    setSelectedImages(images);
  }

  return (
    <div className="App">
      <header className="App-header">
        <HashRouter>
          <h1 className="title"><Link to="/">MatchMade</Link></h1>
          <p className="sub-title"> Matching profile pictures for friends or special someone.</p>
          <Categories categories={["Anime", "Cartoons", "Cute", "Lgbtq"]} />
          <Routes>
            <Route path="/" element={<ImagePairs images={imageMap["/"]} handleClick={handleClick} />} />
            <Route path="/:category" element={<ImagePairs handleClick={handleClick} />} />
          </Routes>
        </HashRouter>
        <Modal selectedImages={selectedImages} />
      </header>
    </div>
  );
}

export default App;
