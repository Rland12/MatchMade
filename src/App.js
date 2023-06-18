import React, { useState } from "react";
import { BrowserRouter as Router, Link, Routes, Route } from "react-router-dom";
// import logo from './logo.svg';
import "./App.css";
import Categories from "./Categories";
import ImagePairs from "./ImagePairs";
import Modal from "./Modal";
import { imageMap } from "./ImageMap";

function App() {
  const [selectedImages, setSelectedImages] = useState([]);

  const handleClick = (images) => {
    setSelectedImages(images);
  }

  return (
    <div className="App">
        <header className="App-header">
          <div className="search-container">
            {/* <form>
            <input
              type="text"
              name="search"
              placeholder="Find your matches"
            ></input>
          </form> */}
          </div>
          <Router>
          <h1 className="title"><Link to="/">Place holder title.</Link></h1>
          <Categories categories={["Anime", "Movies", "Animals", "Cartoons"]} />
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
