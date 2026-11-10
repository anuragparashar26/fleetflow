import { useState, useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";
import { useLocation, useNavigate } from "react-router-dom";
import { LoaderIcon, LogoutIcon } from "./icons";

const NAV_ITEMS = [
  { path: "/fleet/dashboard", label: "Dashboard", icon: "⊙", exact: true },
  { section: "OPERATIONS" },
  { path: "/fleet/shippers", label: "Shippers", icon: "▤" },
  { path: "/fleet/routes", label: "Routes", icon: "⇄" },
  { path: "/fleet/activities", label: "Activities", icon: "◷" },
  { section: "FLEET" },
  { path: "/fleet/vehicles", label: "Vehicles", icon: "▣" },
  { path: "/fleet/drivers", label: "Drivers", icon: "◉" },
  { path: "/fleet/trips", label: "Trips", icon: "➤" },
];

export default function Sidebar({
  darkMode = false,
  user,
  onLogout,
  onOpenProfile,
}) {
  const [showLogoutMenu, setShowLogoutMenu] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [savedName, setSavedName] = useState("");
  const { getToken } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const theme = darkMode ? DARK : LIGHT;

  // Fetch real name from backend profile endpoint
  useEffect(() => {
    if (!user?.id) return;

    const fetchName = async () => {
      try {
        const token = await getToken();
        if (!token) return;
        const { getProfile } = await import("../utils/apiClient");
        const data = await getProfile(token);

        if (data?.full_name) setSavedName(data.full_name);
        else if (data?.username) setSavedName(data.username);
      } catch {
        // Fallback to Clerk-derived display name.
      }
    };

    fetchName();
  }, [getToken, user?.id]);

  // Name priority:
  // 1. Supabase full_name
  // 2. Clerk fullName / firstName
  // 3. Email prefix (sahilraj from sahilraj@gmail.com)

  const email = user?.primaryEmailAddress?.emailAddress || "";
  const emailPrefix = email.split("@")[0] || "";

  const displayName =
    savedName ||
    user?.fullName ||
    user?.firstName ||
    emailPrefix ||
    "User";

  const avatarUrl = user?.imageUrl || null;
  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "U";

  const handleLogout = async () => {
    setLoggingOut(true);
    setShowLogoutMenu(false);
    await onLogout();
    setLoggingOut(false);
  };

  return (
    <aside style={{ ...styles.sidebar, background: theme.bg, borderRightColor: theme.border }}>

      {/* Logo */}
      <div style={{ ...styles.logoRow, borderBottomColor: theme.border }}>
        <div style={styles.logoIcon}>S</div>
        <span style={{ ...styles.logoText, color: theme.text }}>FleetFlow</span>
      </div>

      {/* Nav */}
      <nav style={styles.nav}>
        {NAV_ITEMS.map((item) => {
          if (item.section) {
            return (
              <div key={item.section} style={{ ...styles.sectionLabel, color: theme.muted }}>
                {item.section}
              </div>
            );
          }
          const active = item.exact
            ? location.pathname === item.path
            : location.pathname.startsWith(item.path);
          return (
            <button
              key={item.path}
              style={{
                ...styles.navItem,
                background: active ? theme.activeItemBg : "transparent",
                color: active ? theme.activeItemColor : theme.navText,
                fontWeight: active ? "600" : "400",
              }}
              onClick={() => navigate(item.path)}
            >
              <span style={{ color: theme.icon, width: "16px", textAlign: "center" }}>{item.icon}</span>
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* User + Logout */}
      <div style={{ ...styles.userSection, borderTopColor: theme.border }}>
        <button
          style={{ ...styles.userRow }}
          onClick={() => setShowLogoutMenu((v) => !v)}
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt={displayName} style={styles.avatarImg} />
          ) : (
            <div style={styles.avatarInitials}>{initials}</div>
          )}
          <div style={styles.userInfo}>
            <div style={{ ...styles.userName, color: theme.text }}>{displayName}</div>
            <div style={{ ...styles.userEmail, color: theme.muted }}>{email}</div>
          </div>
          <span style={{
            ...styles.chevron,
            color: theme.muted,
            transform: showLogoutMenu ? "rotate(180deg)" : "rotate(0deg)",
          }}>▲</span>
        </button>

        {showLogoutMenu && (
          <div style={{ ...styles.logoutMenu, background: theme.menuBg, borderColor: theme.border }}>
            {/* Show name + email in dropdown */}
            <div style={{
              padding: "12px 16px",
              borderBottom: `1px solid ${theme.border}`,
            }}>
              <div style={{ fontSize: "13px", fontWeight: "600", color: theme.text }}>
                {displayName}
              </div>
              <div style={{ fontSize: "11px", color: theme.muted, marginTop: "2px" }}>
                {email}
              </div>
            </div>
            <button
              style={{ ...styles.profileBtn, color: theme.text, borderBottom: `1px solid ${theme.border}` }}
              onClick={() => {
                setShowLogoutMenu(false);
                onOpenProfile?.();
              }}
            >
              Profile Settings
            </button>
            <button
              style={{ ...styles.logoutBtn }}
              onClick={handleLogout}
              disabled={loggingOut}
            >
              {loggingOut ? (
                <span style={styles.logoutContent}><LoaderIcon size={14} /> Signing out...</span>
              ) : (
                <span style={styles.logoutContent}><LogoutIcon size={14} /> Sign out</span>
              )}
            </button>
          </div>
        )}
      </div>

    </aside>
  );
}

const LIGHT = {
  bg: "#FFFFFF",
  border: "#E5E7EB",
  text: "#111827",
  navText: "#374151",
  muted: "#9CA3AF",
  icon: "#6B7280",
  activeItemBg: "#EEF2FF",
  activeItemColor: "#4F46E5",
  menuBg: "#FFFFFF",
};

const DARK = {
  bg: "#1E293B",
  border: "#334155",
  text: "#F1F5F9",
  navText: "#CBD5E1",
  muted: "#64748B",
  icon: "#94A3B8",
  activeItemBg: "#312E81",
  activeItemColor: "#A5B4FC",
  menuBg: "#0F172A",
};

const styles = {
  sidebar: {
    width: "240px", minWidth: "240px",
    height: "100vh",
    display: "flex", flexDirection: "column",
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif",
    overflowY: "auto",
    borderRight: "1px solid",
    position: "relative",
    transition: "background 0.2s, border-color 0.2s",
  },
  logoRow: {
    display: "flex", alignItems: "center", gap: "10px",
    padding: "20px 16px", borderBottom: "1px solid",
  },
  logoIcon: {
    width: "28px", height: "28px",
    background: "#4F46E5", borderRadius: "6px",
    display: "flex", alignItems: "center", justifyContent: "center",
    color: "#fff", fontWeight: "700", fontSize: "14px", flexShrink: 0,
  },
  logoText: { fontSize: "15px", fontWeight: "700" },
  moduleTabs: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "8px",
    padding: "10px 8px",
    borderBottom: "1px solid",
  },
  moduleTab: {
    border: "none",
    borderRadius: "8px",
    padding: "8px 10px",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: "600",
    fontFamily: "inherit",
  },
  nav: {
    flex: 1, padding: "12px 8px",
    display: "flex", flexDirection: "column", gap: "2px",
  },
  navItem: {
    display: "flex", alignItems: "center", gap: "10px",
    width: "100%", padding: "8px 12px",
    border: "none", borderRadius: "8px",
    fontSize: "14px", cursor: "pointer", textAlign: "left",
    transition: "background 0.15s", fontFamily: "inherit",
  },
  sectionLabel: {
    fontSize: "11px", fontWeight: "600",
    letterSpacing: "0.8px", padding: "16px 12px 6px",
  },
  createBtn: {
    display: "flex", alignItems: "center", gap: "10px",
    width: "100%", padding: "8px 12px",
    border: "none", borderRadius: "8px",
    fontSize: "14px", cursor: "pointer", textAlign: "left",
    background: "transparent", marginTop: "4px",
    fontFamily: "inherit", transition: "background 0.15s",
  },
  userSection: {
    borderTop: "1px solid", padding: "8px", position: "relative",
  },
  userRow: {
    display: "flex", alignItems: "center", gap: "10px",
    width: "100%", padding: "8px 10px",
    border: "none", background: "transparent",
    borderRadius: "8px", cursor: "pointer",
    textAlign: "left", fontFamily: "inherit",
    transition: "background 0.15s",
  },
  avatarImg: {
    width: "34px", height: "34px", borderRadius: "50%",
    objectFit: "cover", flexShrink: 0, border: "2px solid #E5E7EB",
  },
  avatarInitials: {
    width: "34px", height: "34px", borderRadius: "50%",
    background: "#4F46E5", color: "#fff",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: "13px", fontWeight: "600", flexShrink: 0,
  },
  userInfo: { flex: 1, overflow: "hidden", minWidth: 0 },
  userName: {
    fontSize: "13px", fontWeight: "600",
    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
  },
  userEmail: {
    fontSize: "11px",
    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
  },
  chevron: { fontSize: "8px", transition: "transform 0.2s", flexShrink: 0 },
  logoutMenu: {
    position: "absolute", bottom: "calc(100% + 4px)",
    left: "8px", right: "8px",
    border: "1px solid", borderRadius: "10px",
    boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
    overflow: "hidden", zIndex: 50,
  },
  logoutBtn: {
    width: "100%", padding: "12px 16px",
    border: "none", background: "none",
    textAlign: "left", fontSize: "14px", fontWeight: "500",
    color: "#EF4444", cursor: "pointer", fontFamily: "inherit",
  },
  logoutContent: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
  },
  profileBtn: {
    width: "100%",
    padding: "12px 16px",
    border: "none",
    background: "none",
    textAlign: "left",
    fontSize: "13px",
    fontWeight: "500",
    cursor: "pointer",
    fontFamily: "inherit",
  },
};