import React, { useState } from "react";
import { HashRouter, Link, Routes, Route } from "react-router-dom";
import "./App.css";
import Categories from "./Categories";
import ImagePairs from "./ImagePairs";
import Modal from "./Modal";
import NotFound from "./NotFound";
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
          <Categories categories={["Anime","Cartoons","Cute"]} />
          <Routes>
            <Route path="/" element={<ImagePairs images={imageMap["/"]} handleClick={handleClick} />} />
            <Route path="/:category" element={<ImagePairs handleClick={handleClick} />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          </HashRouter>
          <Modal selectedImages={selectedImages} />
        </header>
    </div>
  );
}

export default App;
