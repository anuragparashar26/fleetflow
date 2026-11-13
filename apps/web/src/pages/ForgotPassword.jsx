import { useState } from "react";
import { KeyIcon, MailIcon, WarningIcon } from "../components/icons";
import { supabase } from "../utils/supabaseClient";

export default function ForgotPassword({ onResetReady, onBackToLogin }) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    setError("");
    if (!email.includes("@")) return setError("Enter a valid email address.");
    setLoading(true);
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email.trim().toLowerCase(),
        { redirectTo: `${window.location.origin}/reset` }
      );
      if (resetError) throw resetError;
      setSent(true);
      setTimeout(() => onResetReady?.(email.trim().toLowerCase()), 1200);
    } catch (err) {
      setError(err.message || "Failed to send reset email. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return <div style={s.page}><div style={s.card}>
    {sent ? <><MailIcon size={44} color="#4F46E5" /><div style={s.heading}>Check your inbox!</div><div style={s.subheading}>Password reset link sent to <strong>{email}</strong>.</div></> : <>
      <div style={s.heading}>Forgot Password? <KeyIcon size={18} color="#4F46E5" /></div><div style={s.subheading}>Enter your registered email and we'll send you a reset link.</div>
      {error && <div style={s.errorBox}><WarningIcon size={14} color="#DC2626" /> {error}</div>}
      <label style={s.label}>Registered Email</label><input style={s.input} type="email" value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSend()} />
      <button style={s.primaryBtn} onClick={handleSend} disabled={loading}>{loading ? "Sending..." : "Send Reset Link"}</button>
    </>}
    <button style={s.linkBtn} onClick={onBackToLogin}>← Back to Login</button>
  </div></div>;
}
const s = {
  page: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#080B12", padding: 20 },
  card: { background: "#0E1524", borderRadius: 20, padding: "40px 44px", width: "100%", maxWidth: 420, color: "#F8FAFC" },
  heading: { fontSize: 22, fontWeight: 700, margin: "12px 0 6px" }, subheading: { color: "#94A3B8", marginBottom: 24 },
  label: { display: "block", fontSize: 13, marginBottom: 6 }, input: { width: "100%", padding: 12, boxSizing: "border-box", background: "#0B1120", color: "#F8FAFC", border: "1px solid #26364F", borderRadius: 10 },
  primaryBtn: { width: "100%", padding: 13, margin: "20px 0 24px", border: 0, borderRadius: 10, background: "#2563EB", color: "#fff", fontWeight: 700 }, linkBtn: { background: "none", border: 0, color: "#60A5FA", cursor: "pointer" },
  errorBox: { background: "#FEF2F2", color: "#DC2626", padding: 12, marginBottom: 12, display: "flex", gap: 8 },
};
