import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App.jsx";
import MissingConfigScreen from "./components/MissingConfigScreen.jsx";
import { isSupabaseConfigured } from "./utils/supabaseClient";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    {isSupabaseConfigured ? (
      <BrowserRouter>
        <App />
      </BrowserRouter>
    ) : (
      <MissingConfigScreen />
    )}
  </StrictMode>
);
