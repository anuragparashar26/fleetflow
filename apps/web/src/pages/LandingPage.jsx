

import { MoonIcon, SunIcon } from "../components/icons";

export default function LandingPage({ onLogin, onRegister, darkMode = false, onToggleDarkMode }) {
  

  // Dynamic theme colors based on dark/light mode
  const theme = darkMode ? DARK : LIGHT;

  return (
    <div style={{ ...styles.page, background: theme.pageBg, minHeight: "100vh", width: "100%" }}>

      {/* ── Navbar ── */}
      <nav style={{ ...styles.nav, background: theme.navBg, borderBottomColor: theme.border }}>

        {/* Logo */}
        <div style={styles.logoWrapper}>
          <div style={styles.logoIcon}>F</div>
          <span style={{ ...styles.logoText, color: theme.text }}>FleetFlow</span>
        </div>

        {/* Nav actions */}
        <div style={styles.navActions}>

          {/* Dark mode toggle */}
          <button
            style={{ ...styles.iconBtn, background: theme.toggleBg }}
            onClick={onToggleDarkMode}
            title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {darkMode ? <SunIcon size={18} /> : <MoonIcon size={18} />}
          </button>

          <button
            style={{ ...styles.loginBtn, color: theme.text }}
            onClick={onLogin}
          >
            Log in
          </button>

          <button style={styles.getStartedBtn} onClick={onRegister}>
            Get Started Free
          </button>
        </div>
      </nav>

      {/* ── Hero Section ── */}
      <main style={styles.hero}>
        <h1 style={{ ...styles.heroHeading, color: theme.heading }}>
          Master your work with{" "}
          <span style={styles.heroGradient}>intelligent clarity</span>
        </h1>

        <p style={{ ...styles.heroSubtitle, color: theme.subtitle }}>
          A comprehensive todo list dashboard that adapts to your workflow.
          From simple task management to deep productivity insights, helps
          you get more done, effortlessly.
        </p>

        {/* CTA Buttons */}
        <div style={styles.ctaGroup}>
          <button style={styles.ctaPrimary} onClick={onRegister}>
            Start your free trial
          </button>
          <button
            style={{
              ...styles.ctaSecondary,
              background: theme.navBg,
              color: theme.text,
              borderColor: theme.border,
            }}
          >
            View Live Demo
          </button>
        </div>
      </main>

    </div>
  );
}

// ── Light Theme ──
const LIGHT = {
  pageBg:   "#F9FAFB",
  navBg:    "#FFFFFF",
  border:   "#E5E7EB",
  text:     "#374151",
  heading:  "#111827",
  subtitle: "#6B7280",
  toggleBg: "#F3F4F6",
};

// ── Dark Theme ──
const DARK = {
  pageBg:   "#0F172A",
  navBg:    "#1E293B",
  border:   "#334155",
  text:     "#CBD5E1",
  heading:  "#F1F5F9",
  subtitle: "#94A3B8",
  toggleBg: "#334155",
};

// ── Base Styles ──
const styles = {
  page: {
    display: "flex",
    flexDirection: "column",
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif",
    width: "100%",
    minHeight: "100vh",
  },

  // Navbar
  nav: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "16px 40px",
    borderBottom: "1px solid",
    position: "sticky",
    top: 0,
    zIndex: 10,
  },
  logoWrapper: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  logoIcon: {
    width: "32px",
    height: "32px",
    background: "#4F46E5",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
    fontWeight: "700",
    fontSize: "16px",
    flexShrink: 0,
  },
  logoText: {
    fontSize: "18px",
    fontWeight: "700",
  },
  navActions: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  iconBtn: {
    border: "none",
    cursor: "pointer",
    fontSize: "18px",
    padding: "7px 10px",
    borderRadius: "8px",
    transition: "background 0.2s",
    lineHeight: "1",
  },
  loginBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
    padding: "8px 16px",
    borderRadius: "8px",
    transition: "background 0.2s",
  },
  getStartedBtn: {
    background: "#4F46E5",
    border: "none",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "600",
    color: "#fff",
    padding: "10px 20px",
    borderRadius: "8px",
    transition: "background 0.2s",
  },

  // Hero
  hero: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    padding: "100px 24px",
    margin: "0 auto",
    maxWidth: "760px",
    width: "100%",
  },
  heroHeading: {
    fontSize: "clamp(32px, 5vw, 54px)",
    fontWeight: "800",
    lineHeight: "1.15",
    marginBottom: "24px",
    letterSpacing: "-1px",
  },
  heroGradient: {
    background: "linear-gradient(90deg, #4F46E5 0%, #06B6D4 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
  },
  heroSubtitle: {
    fontSize: "16px",
    lineHeight: "1.7",
    marginBottom: "40px",
    maxWidth: "560px",
  },
  ctaGroup: {
    display: "flex",
    gap: "16px",
    justifyContent: "center",
    flexWrap: "wrap",
  },
  ctaPrimary: {
    background: "#4F46E5",
    color: "#fff",
    border: "none",
    padding: "14px 28px",
    borderRadius: "10px",
    fontSize: "15px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "background 0.2s",
  },
  ctaSecondary: {
    border: "1.5px solid",
    padding: "14px 28px",
    borderRadius: "10px",
    fontSize: "15px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s",
  },
};