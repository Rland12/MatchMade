import "bootstrap/dist/css/bootstrap.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { HelmetProvider } from "@dr.pogodin/react-helmet";
import App from "./components/App.jsx";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <HelmetProvider>
      <BrowserRouter basename="/">
        <App />
      </BrowserRouter>
    </HelmetProvider>
  </StrictMode>
);
