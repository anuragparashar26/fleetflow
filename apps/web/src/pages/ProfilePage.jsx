import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { getProfile, syncProfile } from "../utils/apiClient";

export default function ProfilePage({ user, darkMode = false, onToggleDarkMode, onLogout, onBack }) {
  const [form, setForm] = useState({
    fullName: "",
    username: "",
    phone: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const { getToken } = useAuth();

  const theme = darkMode ? DARK : LIGHT;

  const email = useMemo(() => user?.primaryEmailAddress?.emailAddress || "", [user]);

  useEffect(() => {
    if (!user?.id) return;

    let isMounted = true;

    const loadProfile = async () => {
      setLoading(true);
      setError("");

      let data = null;
      let fetchError = null;
      try {
        const token = await getToken();
        if (token) {
          data = await getProfile(token);
        }
      } catch (err) {
        fetchError = err;
      }

      if (!isMounted) return;

      if (fetchError && fetchError.status !== 404) {
        setError(fetchError.message || "Failed to load profile.");
        setLoading(false);
        return;
      }

      setForm((prev) => ({
        ...prev,
        fullName: data?.full_name || "",
        username: data?.username || "",
        phone: data?.phone || "",
      }));
      setLoading(false);
    };

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, [getToken, user?.id]);

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError("");
    setSuccess("");
  };

  const handleSave = async () => {
    if (!user?.id) return;

    setSaving(true);
    setError("");
    setSuccess("");

    const normalizedUsername = form.username.trim().toLowerCase();

    if (normalizedUsername && !/^[a-zA-Z0-9_]{3,20}$/.test(normalizedUsername)) {
      setSaving(false);
      setError("Username must be 3-20 characters with letters, numbers, or underscore.");
      return;
    }

    if (form.phone && !/^\d{10}$/.test(form.phone)) {
      setSaving(false);
      setError("Phone number must be 10 digits.");
      return;
    }

    try {
      const token = await getToken();
      if (!token) {
        setError("Unable to verify session. Please sign in again.");
        setSaving(false);
        return;
      }

      await syncProfile(token, {
        email: email.toLowerCase(),
        full_name: form.fullName.trim() || null,
        username: normalizedUsername || null,
        phone: form.phone || null,
      });
    } catch (saveError) {
      setError(saveError.message || "Unable to save profile.");
      setSaving(false);
      return;
    }

    setSuccess("Profile updated successfully.");
    setSaving(false);
  };

  return (
    <div style={{ ...styles.page, background: theme.pageBg }}>
      <div style={{ ...styles.card, background: theme.cardBg, borderColor: theme.border }}>
        <div style={styles.headerRow}>
          <button style={{ ...styles.backBtn, color: theme.link }} onClick={onBack}>
            Back to Dashboard
          </button>
          <button style={{ ...styles.toggleBtn, background: theme.toggleBg }} onClick={onToggleDarkMode}>
            {darkMode ? "Light" : "Dark"}
          </button>
        </div>

        <h1 style={{ ...styles.title, color: theme.text }}>Profile Settings</h1>
        <p style={{ ...styles.subTitle, color: theme.muted }}>
          Account details are managed after sign in.
        </p>

        {error && <div style={styles.error}>{error}</div>}
        {success && <div style={styles.success}>{success}</div>}

        <div style={styles.group}>
          <label style={{ ...styles.label, color: theme.text }}>Email</label>
          <input style={{ ...styles.input, background: theme.inputBg, borderColor: theme.border }} value={email} disabled />
        </div>

        <div style={styles.group}>
          <label style={{ ...styles.label, color: theme.text }}>Full Name</label>
          <input
            style={{ ...styles.input, background: theme.inputBg, borderColor: theme.border, color: theme.text }}
            value={form.fullName}
            onChange={(e) => setField("fullName", e.target.value)}
            placeholder="Your full name"
          />
        </div>

        <div style={styles.group}>
          <label style={{ ...styles.label, color: theme.text }}>Username</label>
          <input
            style={{ ...styles.input, background: theme.inputBg, borderColor: theme.border, color: theme.text }}
            value={form.username}
            onChange={(e) => setField("username", e.target.value)}
            placeholder="username"
          />
        </div>

        <div style={styles.group}>
          <label style={{ ...styles.label, color: theme.text }}>Phone</label>
          <input
            style={{ ...styles.input, background: theme.inputBg, borderColor: theme.border, color: theme.text }}
            value={form.phone}
            onChange={(e) => setField("phone", e.target.value.replace(/\D/g, ""))}
            maxLength={10}
            placeholder="10-digit number"
          />
        </div>

        <div style={styles.actions}>
          <button style={{ ...styles.saveBtn, opacity: saving || loading ? 0.7 : 1 }} onClick={handleSave} disabled={saving || loading}>
            {saving ? "Saving..." : "Save Profile"}
          </button>
          <button style={styles.logoutBtn} onClick={onLogout}>Sign Out</button>
        </div>
      </div>
    </div>
  );
}

const LIGHT = {
  pageBg: "#F8FAFC",
  cardBg: "#FFFFFF",
  inputBg: "#FFFFFF",
  border: "#E2E8F0",
  text: "#0F172A",
  muted: "#64748B",
  toggleBg: "#E2E8F0",
  link: "#1D4ED8",
};

const DARK = {
  pageBg: "#0F172A",
  cardBg: "#1E293B",
  inputBg: "#0F172A",
  border: "#334155",
  text: "#E2E8F0",
  muted: "#94A3B8",
  toggleBg: "#334155",
  link: "#93C5FD",
};

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
    boxSizing: "border-box",
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif",
  },
  card: {
    width: "100%",
    maxWidth: "560px",
    border: "1px solid",
    borderRadius: "16px",
    padding: "24px",
    boxSizing: "border-box",
  },
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "12px",
  },
  backBtn: {
    border: "none",
    background: "none",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: "600",
  },
  toggleBtn: {
    border: "none",
    cursor: "pointer",
    borderRadius: "8px",
    padding: "6px 10px",
    fontSize: "12px",
    fontWeight: "600",
  },
  title: {
    margin: 0,
    fontSize: "26px",
    fontWeight: "700",
  },
  subTitle: {
    marginTop: "6px",
    marginBottom: "16px",
    fontSize: "14px",
  },
  group: {
    marginBottom: "14px",
  },
  label: {
    display: "block",
    marginBottom: "6px",
    fontSize: "13px",
    fontWeight: "600",
  },
  input: {
    width: "100%",
    border: "1.5px solid",
    borderRadius: "10px",
    padding: "11px 12px",
    boxSizing: "border-box",
    fontSize: "14px",
    fontFamily: "inherit",
    outline: "none",
  },
  actions: {
    display: "flex",
    gap: "10px",
    marginTop: "8px",
  },
  saveBtn: {
    flex: 1,
    border: "none",
    borderRadius: "10px",
    padding: "12px",
    fontWeight: "700",
    fontSize: "14px",
    color: "#FFFFFF",
    background: "#2563EB",
    cursor: "pointer",
  },
  logoutBtn: {
    border: "1px solid #FCA5A5",
    color: "#B91C1C",
    background: "#FFFFFF",
    borderRadius: "10px",
    padding: "12px 14px",
    fontWeight: "600",
    fontSize: "14px",
    cursor: "pointer",
  },
  error: {
    border: "1px solid #FECACA",
    background: "#FEF2F2",
    color: "#B91C1C",
    borderRadius: "10px",
    padding: "10px 12px",
    marginBottom: "12px",
    fontSize: "13px",
  },
  success: {
    border: "1px solid #BBF7D0",
    background: "#F0FDF4",
    color: "#166534",
    borderRadius: "10px",
    padding: "10px 12px",
    marginBottom: "12px",
    fontSize: "13px",
  },
};
