import "bootstrap/dist/css/bootstrap.css";
import React from 'react';
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom';
import App from './components/App.jsx';
import './index.css';

createRoot(document.getElementById("root")).render(
  <StrictMode>
     <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>
)

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
// reportWebVitals(); 
