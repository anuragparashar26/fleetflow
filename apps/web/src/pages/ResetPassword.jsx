import { useState } from "react";
import { supabase } from "../utils/supabaseClient";
import { EyeIcon, EyeOffIcon, LockIcon, WarningIcon } from "../components/icons";

export default function ResetPassword({ onSuccess }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    setError("");
    if (password.length < 6) return setError("Password must be at least 6 characters.");
    if (password !== confirm) return setError("Passwords don't match.");
    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      await supabase.auth.signOut();
      onSuccess?.();
    } catch (err) {
      setError(err.message || "Unable to reset password.");
    } finally {
      setLoading(false);
    }
  };

  return <div style={s.page}><div style={s.card}><div style={s.heading}>Set New Password <LockIcon size={18} color="#b3aaff" /></div>
    <div style={s.subheading}>Choose a new password for your account.</div>
    {error && <div style={s.error}><WarningIcon size={14} color="#ff8f8f" /> {error}</div>}
    <label style={s.label}>New Password</label><div style={{ position: "relative" }}><input style={s.input} type={show ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} /><button style={s.eye} onClick={() => setShow((v) => !v)}>{show ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}</button></div>
    <label style={s.label}>Confirm New Password</label><input style={s.input} type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleReset()} />
    <button style={s.button} onClick={handleReset} disabled={loading}>{loading ? "Updating..." : "Reset Password"}</button>
  </div></div>;
}
const s = {
  page: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0F172A", padding: 20 }, card: { width: "100%", maxWidth: 440, background: "#1E293B", borderRadius: 16, padding: 28, color: "#fff" }, heading: { fontSize: 20, fontWeight: 700, display: "flex", gap: 8, alignItems: "center" }, subheading: { color: "#94A3B8", margin: "8px 0 22px" }, label: { display: "block", margin: "14px 0 6px", fontSize: 13 }, input: { width: "100%", boxSizing: "border-box", padding: 12, background: "#0F172A", border: "1px solid #334155", color: "#fff", borderRadius: 10 }, eye: { position: "absolute", right: 10, top: 10, background: "none", border: 0 }, button: { width: "100%", marginTop: 24, padding: 13, border: 0, borderRadius: 10, background: "#2563EB", color: "#fff", fontWeight: 700 }, error: { padding: 10, background: "#7F1D1D", display: "flex", gap: 8 },
};
