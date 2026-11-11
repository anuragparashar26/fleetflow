
import { useEffect, useState } from "react";
import { useAuth, useUser } from "@clerk/clerk-react";
import { AuthenticateWithRedirectCallback } from "@clerk/clerk-react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";

import LandingPage from "./pages/LandingPage";
import AuthPage from "./pages/AuthPage";
import RegisterPage from "./pages/RegisterPage";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import DashboardPage from "./modules/fleet/DashboardPage";
import DirectoryPage from "./modules/fleet/DirectoryPage";
import ActivitiesPage from "./modules/fleet/ActivitiesPage";
import ProfilePage from "./pages/ProfilePage";
import { syncUserProfile } from "./utils/platformApi";

export default function App() {
  const { isSignedIn, user, isLoaded } = useUser();
  const { signOut, getToken } = useAuth();
  const navigate = useNavigate();

  const [successMsg, setSuccessMsg] = useState("");
  const [resetEmail, setResetEmail] = useState("");
  const [darkMode, setDarkMode] = useState(true);

  const toggleDarkMode = () => setDarkMode((v) => !v);

  const handleLogout = async () => {
    await signOut();
    navigate("/", { replace: true });
  };

  const handleRegisterSuccess = () => {
    setSuccessMsg("Account created.");
    navigate("/profile", { replace: true });
  };

  const handleResetSuccess = () => {
    setSuccessMsg("Password reset successful! Please log in.");
    navigate("/login", { replace: true });
  };

  const handleGoToLogin = () => {
    if (isSignedIn) navigate("/fleet/dashboard");
    else navigate("/login");
  };

  const handleGoToRegister = () => {
    if (isSignedIn) navigate("/fleet/dashboard");
    else navigate("/register");
  };

  const fleetPage = (Element, extraProps = {}) =>
    isSignedIn ? (
      <Element
        user={user}
        onLogout={handleLogout}
        darkMode={darkMode}
        onToggleDarkMode={toggleDarkMode}
        onOpenProfile={() => navigate("/profile")}
        getToken={getToken}
        {...extraProps}
      />
    ) : (
      <Navigate to="/login" replace />
    );

  useEffect(() => {
    if (!isSignedIn || !user?.id) return;

    const email = user.primaryEmailAddress?.emailAddress?.toLowerCase();
    if (!email) return;

    const ensureProfile = async () => {
      try {
        const token = await getToken();
        if (!token) return;
        await syncUserProfile(token, { email });
      } catch {
        // Profile sync can fail transiently; profile page can retry updates.
      }
    };

    ensureProfile();
  }, [getToken, isSignedIn, user]);

  useEffect(() => {
    if (!isSignedIn || !user?.id) return;

    const syncAndLoadMe = async () => {
      try {
        const token = await getToken();
        if (!token) return;

        const payload = {
          email: user.primaryEmailAddress?.emailAddress?.toLowerCase() || null,
        };

        if (typeof user.fullName === "string" && user.fullName.trim()) {
          payload.full_name = user.fullName.trim();
        }

        if (typeof user.username === "string" && user.username.trim()) {
          payload.username = user.username.trim().toLowerCase();
        }

        if (typeof user.primaryPhoneNumber?.phoneNumber === "string" && user.primaryPhoneNumber.phoneNumber.trim()) {
          payload.phone = user.primaryPhoneNumber.phoneNumber.trim();
        }

        await syncUserProfile(token, payload);
      } catch {
        // Ignore background sync failures to avoid blocking UI.
      }
    };

    syncAndLoadMe();
  }, [getToken, isSignedIn, user]);

  if (!isLoaded) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#F8FAFC",
          color: "#334155",
          fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif",
          fontSize: "14px",
          padding: "24px",
          textAlign: "center",
        }}
      >
        Loading authentication...
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/"
        element={
          isSignedIn ? (
            <Navigate to="/fleet/dashboard" replace />
          ) : (
            <LandingPage
              onLogin={handleGoToLogin}
              onRegister={handleGoToRegister}
              darkMode={darkMode}
              onToggleDarkMode={toggleDarkMode}
            />
          )
        }
      />

      <Route
        path="/login"
        element={
          isSignedIn ? (
            <Navigate to="/fleet/dashboard" replace />
          ) : (
            <AuthPage
              onLoginSuccess={() => navigate("/fleet/dashboard", { replace: true })}
              onForgotPassword={() => navigate("/forgot")}
              onRegister={() => navigate("/register")}
              successMsg={successMsg}
            />
          )
        }
      />

      <Route
        path="/register"
        element={
          isSignedIn ? (
            <Navigate to="/fleet/dashboard" replace />
          ) : (
            <RegisterPage
              onRegisterSuccess={handleRegisterSuccess}
              onBackToLogin={() => navigate("/login")}
            />
          )
        }
      />

      <Route
        path="/forgot"
        element={
          isSignedIn ? (
            <Navigate to="/fleet/dashboard" replace />
          ) : (
            <ForgotPassword
              onResetReady={(email) => {
                setResetEmail(email);
                navigate("/reset", { state: { email } });
              }}
              onBackToLogin={() => navigate("/login")}
            />
          )
        }
      />

      <Route
        path="/reset"
        element={
          isSignedIn ? (
            <Navigate to="/fleet/dashboard" replace />
          ) : (
            <ResetPage resetEmail={resetEmail} onSuccess={handleResetSuccess} />
          )
        }
      />

      <Route
        path="/sso-callback/*"
        element={
          <AuthenticateWithRedirectCallback
            signInFallbackRedirectUrl="/fleet/dashboard"
            signUpFallbackRedirectUrl="/fleet/dashboard"
          />
        }
      />

      <Route
        path="/fleet/dashboard"
        element={
          isSignedIn ? (
            <DashboardPage
              user={user}
              onLogout={handleLogout}
              darkMode={darkMode}
              onToggleDarkMode={toggleDarkMode}
              onOpenProfile={() => navigate("/profile")}
              getToken={getToken}
            />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      <Route
        path="/fleet/shippers"
        element={fleetPage(DirectoryPage, { resource: "shippers", title: "Shippers" })}
      />
      <Route
        path="/fleet/vehicles"
        element={fleetPage(DirectoryPage, { resource: "vehicles", title: "Vehicles" })}
      />
      <Route
        path="/fleet/drivers"
        element={fleetPage(DirectoryPage, { resource: "drivers", title: "Drivers" })}
      />
      <Route
        path="/fleet/routes"
        element={fleetPage(DirectoryPage, { resource: "routes", title: "Routes" })}
      />
      <Route
        path="/fleet/trips"
        element={fleetPage(DirectoryPage, { resource: "trips", title: "Trips" })}
      />
      <Route
        path="/fleet/activities"
        element={fleetPage(ActivitiesPage)}
      />

      <Route
        path="/profile"
        element={
          isSignedIn ? (
            <ProfilePage
              user={user}
              darkMode={darkMode}
              onToggleDarkMode={toggleDarkMode}
              onLogout={handleLogout}
              onBack={() => navigate("/fleet/dashboard")}
            />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      <Route path="/dashboard" element={<Navigate to="/fleet/dashboard" replace />} />

      <Route
        path="*"
        element={<Navigate to={isSignedIn ? "/fleet/dashboard" : "/"} replace />}
      />
    </Routes>
  );
}

function ResetPage({ resetEmail, onSuccess }) {
  const location = useLocation();
  const email = location.state?.email || resetEmail;

  return <ResetPassword email={email} onSuccess={onSuccess} />;
}