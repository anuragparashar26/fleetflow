//SHARED STYLES


const styles = {

  // ──  full-screen background of Auth pages ──
  authPage: {
    position: "fixed",
    top: 0, left: 0,
    width: "100vw",
    height: "100vh",
    background: "linear-gradient(135deg, #0f0c29, #302b63, #24243e)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'Segoe UI', sans-serif",
    boxSizing: "border-box",
  },

  // ── Glass card (login / forgot / reset) ──
  card: {
    background: "rgba(255,255,255,0.05)",
    backdropFilter: "blur(20px)",
    border: "1px solid rgba(255,255,255,0.15)",
    borderRadius: "20px",
    padding: "48px 40px",
    width: "100%",
    maxWidth: "420px",
    boxShadow: "0 25px 60px rgba(0,0,0,0.4)",
    color: "#fff",
    boxSizing: "border-box",
  },

  logo:       { fontSize: "28px", fontWeight: "800", letterSpacing: "-1px", marginBottom: "8px", color: "#fff" },
  logoAccent: { color: "#7c6af7" },
  subtitle:   { fontSize: "14px", color: "rgba(255,255,255,0.5)", marginBottom: "32px", lineHeight: "1.5" },

  tabs: {
    display: "flex", marginBottom: "28px", gap: "4px",
    background: "rgba(255,255,255,0.08)", borderRadius: "10px", padding: "4px",
  },
  tab: (active) => ({
    flex: 1, padding: "10px", border: "none", borderRadius: "8px",
    cursor: "pointer", fontWeight: "600", fontSize: "14px", transition: "all 0.2s",
    background: active ? "#7c6af7" : "transparent",
    color:      active ? "#fff"    : "rgba(255,255,255,0.5)",
  }),

  label: {
    display: "block", fontSize: "13px",
    color: "rgba(255,255,255,0.6)", marginBottom: "6px", fontWeight: "500",
  },

  input: {
    width: "100%", padding: "12px 16px", borderRadius: "10px",
    border: "1px solid rgba(255,255,255,0.15)",
    background: "rgba(255,255,255,0.08)",
    color: "#fff", fontSize: "15px", outline: "none",
    boxSizing: "border-box", marginBottom: "16px", transition: "border 0.2s",
  },

  btn: {
    width: "100%", padding: "14px", borderRadius: "10px", border: "none",
    background: "linear-gradient(135deg, #7c6af7, #6c63ff)",
    color: "#fff", fontSize: "15px", fontWeight: "700",
    cursor: "pointer", marginTop: "8px", letterSpacing: "0.5px",
    boxShadow: "0 4px 20px rgba(124,106,247,0.4)", transition: "opacity 0.2s",
  },

  linkBtn: {
    background: "none", border: "none", color: "#7c6af7",
    fontSize: "13px", cursor: "pointer", fontWeight: "600",
    padding: "0", textDecoration: "underline", textUnderlineOffset: "3px",
  },

  error: {
    background: "rgba(255,80,80,0.15)", border: "1px solid rgba(255,80,80,0.4)",
    color: "#ff8080", borderRadius: "8px",
    padding: "10px 14px", fontSize: "13px", marginBottom: "16px",
  },

  success: {
    background: "rgba(80,200,120,0.15)", border: "1px solid rgba(80,200,120,0.4)",
    color: "#80d8a0", borderRadius: "8px",
    padding: "10px 14px", fontSize: "13px", marginBottom: "16px",
  },

  info: {
    background: "rgba(124,106,247,0.15)", border: "1px solid rgba(124,106,247,0.35)",
    color: "#b3aaff", borderRadius: "8px",
    padding: "10px 14px", fontSize: "13px", marginBottom: "16px", lineHeight: "1.5",
  },

  // ── Dashboard ──
  dashPage: {
    position: "fixed", top: 0, left: 0,
    width: "100vw", height: "100vh",
    display: "flex", fontFamily: "'Segoe UI', sans-serif",
    background: "#f4f5f7", overflow: "hidden",
  },

  sidebar: {
    width: "240px", minWidth: "240px",
    background: "#1e1e2e", color: "#fff",
    display: "flex", flexDirection: "column",
    height: "100vh", overflowY: "auto",
    boxShadow: "4px 0 20px rgba(0,0,0,0.15)",
  },
  sidebarLogo: {
    fontSize: "20px", fontWeight: "800",
    padding: "24px", borderBottom: "1px solid rgba(255,255,255,0.1)",
    letterSpacing: "-0.5px",
  },
  sidebarSection: {
    padding: "20px 24px 8px", fontSize: "11px",
    color: "rgba(255,255,255,0.35)", fontWeight: "700",
    letterSpacing: "1.5px", textTransform: "uppercase",
  },
  sidebarItem: (active) => ({
    display: "flex", alignItems: "center", gap: "10px",
    padding: "10px 24px", cursor: "pointer", fontSize: "14px",
    fontWeight: active ? "600" : "400",
    color:      active ? "#fff" : "rgba(255,255,255,0.55)",
    background: active ? "rgba(124,106,247,0.25)" : "transparent",
    borderLeft: active ? "3px solid #7c6af7" : "3px solid transparent",
    transition: "all 0.15s",
  }),
  sidebarBottom: {
    marginTop: "auto", padding: "16px 24px",
    borderTop: "1px solid rgba(255,255,255,0.1)",
  },
  logoutBtn: {
    width: "100%", padding: "10px", borderRadius: "8px",
    border: "1px solid rgba(255,80,80,0.3)",
    background: "rgba(255,80,80,0.1)",
    color: "#ff8080", fontSize: "14px", cursor: "pointer", fontWeight: "600",
  },

  main: {
    flex: 1, padding: "40px 48px",
    overflowY: "auto", height: "100vh", boxSizing: "border-box",
  },
  topBar: {
    display: "flex", alignItems: "center",
    justifyContent: "space-between", marginBottom: "40px",
  },
  pageTitle:   { fontSize: "26px", fontWeight: "800", color: "#1a1a2e", letterSpacing: "-0.5px" },
  badge:       { background: "#7c6af7", color: "#fff", padding: "6px 14px", borderRadius: "20px", fontSize: "13px", fontWeight: "600" },
  contentCard: { background: "#fff", borderRadius: "16px", padding: "32px", boxShadow: "0 2px 20px rgba(0,0,0,0.08)", marginBottom: "24px" },
  issueRow:    { display: "flex", alignItems: "center", gap: "12px", padding: "14px 0", borderBottom: "1px solid #f0f0f5", fontSize: "14px", color: "#333" },
  issueTag: (color) => ({
    padding: "2px 10px", borderRadius: "4px", fontSize: "11px", fontWeight: "700",
    background: color === "blue" ? "#e8f0ff" : color === "green" ? "#e8fff0" : "#fff3e8",
    color:      color === "blue" ? "#4a6cf7" : color === "green" ? "#2d9e5f" : "#e07b20",
  }),
};

export default styles;