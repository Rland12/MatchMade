import React from 'react';
// import logo from './logo.svg';
import './App.css';
import Categories from './categories';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>
          Place holder title.
        </h1>
        <div className="search-container">
          <form>
            <input type="text" name="search" placeholder="Find your matches"></input>
          </form>
        </div>
        <Categories categories={["Anime", "Movies","Animals", "Cartoons"] } />
        
        {/* <img src={logo} className="App-logo" alt="logo" />
        
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a> */}
      </header>
    </div>
  );
}

export default App;
