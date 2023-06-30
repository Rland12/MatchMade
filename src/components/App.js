import React, { useState } from "react";
import { BrowserRouter as Router, Link, Routes, Route } from "react-router-dom";
// import logo from './logo.svg';
import "../App.css";
import Categories from "./Categories";
import ImagePairs from "./ImagePairs";
import Modal from "./Modal";
import { imageMap } from "../utils/imageMap";

//future: pagination for pages of images
//future: some type of download logging for a featured/popular page?
function App() {
  const [selectedImages, setSelectedImages] = useState({});

  const handleClick = (images) => {
    setSelectedImages(images);
  }

  return (
    <div className="App">
        <header className="App-header">
          {/* <div className="search-container">
            <form>
            <input
              type="text"
              name="search"
              placeholder="Find your matches"
            ></input>
          </form>
          </div> */}
          <Router>
          <h1 className="title"><Link to="/">MatchMade</Link></h1>
          {/* <p className="sub-title"><Link to="/">Find matching profile pictures for friends or someone special</Link></p> */}
          <Categories categories={["Anime","Cartoons","Cute"]} />
          <Routes>
            <Route path="/" element={<ImagePairs images={imageMap["/"]} handleClick={handleClick} />} />
            <Route path="/:category" element={<ImagePairs handleClick={handleClick} />} />
          </Routes>
          </Router>
          <Modal selectedImages={selectedImages} />
        </header>
    </div>
  );
}

export default App;
