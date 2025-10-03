import React, { useState } from "react";
import { Link, Routes, Route } from "react-router-dom";
import "./App.css";
import Categories from "./Categories";
import ImagePairs from "./ImagePairs";
import Modal from "./Modal";

//future: some type of download logging for a featured/popular page?
//future: add more categories
function App() {
  const [selectedImages, setSelectedImages] = useState({});
  const handleClick = (images) => setSelectedImages(images);

  return (
    <div className="App">
      <header className="App-header">
        <h1 className="title"><Link to="/">MatchMade</Link></h1>
        <p className="sub-title">Matching profile pictures for friends or special someone.</p>

        <Categories />

        <Routes>
          <Route path="/" element={<ImagePairs handleClick={handleClick} />} />
          <Route path="/:category" element={<ImagePairs handleClick={handleClick} />} />
        </Routes>
      </header>
      <Modal selectedImages={selectedImages} />
    </div>
  );
}

export default App;
