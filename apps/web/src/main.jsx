import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ClerkProvider } from "@clerk/clerk-react";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App.jsx";
import MissingConfigScreen from "./components/MissingConfigScreen.jsx";

const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

createRoot(document.getElementById("root")).render(
  <StrictMode>
    {clerkPublishableKey ? (
      <ClerkProvider
        publishableKey={clerkPublishableKey}
        signInFallbackRedirectUrl="/fleet/dashboard"
        signUpFallbackRedirectUrl="/fleet/dashboard"
      >
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ClerkProvider>
    ) : (
      <MissingConfigScreen />
    )}
  </StrictMode>
);
