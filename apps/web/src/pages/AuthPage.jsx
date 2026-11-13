import { useState } from "react";
import { CheckIcon, EyeIcon, EyeOffIcon, WarningIcon } from "../components/icons";
import { supabase } from "../utils/supabaseClient";

export default function AuthPage({ onLoginSuccess, onForgotPassword, onRegister, successMsg }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError("");
    if (!email || !password) return setError("Please fill in all fields.");
    if (!email.includes("@")) return setError("Enter a valid email address.");
    setLoading(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (signInError) throw signInError;
      onLoginSuccess?.();
    } catch (err) {
      setError(err.message === "Invalid login credentials"
        ? "Incorrect email or password."
        : err.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.page}><div style={s.card}>
      <div style={s.heading}>Welcome back</div>
      <div style={s.subheading}>Sign in to continue to your workspace</div>
      {successMsg && <div style={s.successBox}><CheckIcon size={14} color="#15803D" /> {successMsg}</div>}
      {error && <div style={s.errorBox}><WarningIcon size={14} color="#DC2626" /> {error}</div>}
      <div style={s.fieldGroup}><label style={s.label}>Email</label><input style={s.input} type="email" value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleLogin()} autoComplete="email" /></div>
      <div style={s.fieldGroup}><label style={s.label}>Password</label><div style={{ position: "relative" }}>
        <input style={{ ...s.input, paddingRight: "44px" }} type={showPass ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleLogin()} autoComplete="current-password" />
        <button style={s.eyeBtn} onClick={() => setShowPass((v) => !v)} tabIndex={-1}>{showPass ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}</button>
      </div></div>
      <div style={{ textAlign: "right", marginBottom: "24px" }}><button style={s.linkBtn} onClick={onForgotPassword}>Forgot password?</button></div>
      <button style={{ ...s.primaryBtn, opacity: loading ? 0.75 : 1 }} onClick={handleLogin} disabled={loading}>{loading ? "Signing in..." : "Sign In"}</button>
      <div style={s.bottomText}>Don't have an account? <button style={s.linkBtn} onClick={onRegister}>Create one here</button></div>
    </div></div>
  );
}

const s = {
  page: { minHeight: "100vh", width: "100%", background: "radial-gradient(circle at 15% 10%, rgba(37,99,235,.22), transparent 28rem), #080B12", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif", padding: "20px", boxSizing: "border-box" },
  card: { background: "#0E1524", borderRadius: "20px", padding: "40px 44px", width: "100%", maxWidth: "440px", boxShadow: "0 24px 80px rgba(0,0,0,.35)", border: "1px solid #1E293B", boxSizing: "border-box" },
  heading: { fontSize: "24px", fontWeight: "700", color: "#F8FAFC", marginBottom: "6px" },
  subheading: { fontSize: "14px", color: "#94A3B8", marginBottom: "28px", lineHeight: "1.5" },
  successBox: { background: "#F0FDF4", border: "1px solid #BBF7D0", color: "#15803D", borderRadius: "10px", padding: "12px 16px", fontSize: "13px", marginBottom: "20px", display: "flex", gap: "8px" },
  errorBox: { background: "#FEF2F2", border: "1px solid #FECACA", color: "#DC2626", borderRadius: "10px", padding: "12px 16px", fontSize: "13px", marginBottom: "20px", display: "flex", gap: "8px" },
  fieldGroup: { marginBottom: "18px" },
  label: { display: "block", fontSize: "13px", fontWeight: "600", color: "#CBD5E1", marginBottom: "6px" },
  input: { width: "100%", padding: "11px 14px", borderRadius: "10px", border: "1.5px solid #26364F", fontSize: "14px", color: "#F8FAFC", outline: "none", boxSizing: "border-box", background: "#0B1120" },
  eyeBtn: { position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: "4px" },
  linkBtn: { background: "none", border: "none", color: "#60A5FA", fontSize: "13px", fontWeight: "600", cursor: "pointer", padding: 0, textDecoration: "underline" },
  primaryBtn: { width: "100%", padding: "13px", borderRadius: "10px", border: "none", background: "linear-gradient(135deg, #2563EB, #06B6D4)", color: "#fff", fontSize: "15px", fontWeight: "700", cursor: "pointer" },
  bottomText: { textAlign: "center", fontSize: "13px", color: "#94A3B8", marginTop: "20px" },
};
