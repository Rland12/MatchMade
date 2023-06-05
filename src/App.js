import React, { useState } from "react";
// import logo from './logo.svg';
import "./App.css";
import Categories from "./categories";
import ImagePairs from "./ImagePairs";
import Modal from "./Modal";

function App() {
  const [selectedImages, setSelectedImages] = useState([]);

  const handleClick = (images) => {
    setSelectedImages(images);
  }

  return (
    <div className="App">
      <header className="App-header">
        <h1>Place holder title.</h1>
        <div className="search-container">
          {/* <form>
            <input
              type="text"
              name="search"
              placeholder="Find your matches"
            ></input>
          </form> */}
        </div>
        <Categories categories={["Anime", "Movies", "Animals", "Cartoons"]}/>
        <Modal selectedImages={selectedImages} />
        <ImagePairs handleClick={handleClick} images={[
          [
            [
              {
                url: `images/girleaf-left.webp`,
                alt: "image1"
              },
              {
                url: `images/boyleaf-right.webp`,
                alt: "image2"
              }
            ],
            [
              {
                url: `images/girl-left.jpeg`,
                alt: "image1"
              },
              {
                url: `images/man-right.jpeg`,
                alt: "image2"
              }
            ],
          ],
          [
            [
              {
                url: `images/squidgame-girl-left.webp`,
                alt: "image1"
              },
              {
                url: `images/squidgame-girl-right.webp`,
                alt: "image2"
              }
            ],
            [
              {
                url: `images/boy-heartattack-left.jpeg`,
                alt: "image1"
              },
              {
                url: `images/girl-heartshot-right.jpeg`,
                alt: "image2"
              }
            ],
          ],
          [
            [
              {
                url: `images/toh-girl-left.jpg`,
                alt: "image1"
              },
              {
                url: `images/toh-girl-right.jpg`,
                alt: "image2"
              }
            ],
            [
              {
                url: `images/catboy-left.jpg`,
                alt: "image1"
              },
              {
                url: `images/catboy-right.jpg`,
                alt: "image2"
              }
            ],
          ]
        ]} />
      </header>
    </div>
  );
}

export default App;
